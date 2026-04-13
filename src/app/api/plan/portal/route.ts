import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const SK = process.env.STRIPE_SECRET_KEY!;

const BILLING_PORTAL_CONFIG = "bpc_1TEOkMJlUr03cRD7Ooh3GBwM";

// Map plan name -> Stripe price ID
const PRICE_MAP: Record<string, string> = {
  individual:        "price_1TGVNLJlUr03cRD7PhMXGx9x",
  family:            "price_1TGVNTJlUr03cRD7F9F5mgHh",
  // Legacy mappings (map to closest new plan)
  essential:         "price_1TGVNLJlUr03cRD7PhMXGx9x",
  plus:              "price_1TGVNLJlUr03cRD7PhMXGx9x",
  concierge:         "price_1TGVNLJlUr03cRD7PhMXGx9x",
  essential_family:  "price_1TGVNTJlUr03cRD7F9F5mgHh",
  plus_family:       "price_1TGVNTJlUr03cRD7F9F5mgHh",
  concierge_family:  "price_1TGVNTJlUr03cRD7F9F5mgHh",
  complete:          "price_1TGVNLJlUr03cRD7PhMXGx9x",
  complete_family:   "price_1TGVNTJlUr03cRD7F9F5mgHh",
};

const PLAN_KEY_MAP: Record<string, string> = {
  individual: "INDIVIDUAL",
  family: "FAMILY",
  essential: "ESSENTIAL",
  plus: "PLUS",
  concierge: "CONCIERGE",
  essential_family: "ESSENTIAL_FAMILY",
  plus_family: "PLUS_FAMILY",
  concierge_family: "CONCIERGE_FAMILY",
  complete: "CONCIERGE",
  complete_family: "CONCIERGE_FAMILY",
};

// Monthly price in cents for comparison
const PLAN_PRICE_CENTS: Record<string, number> = {
  INDIVIDUAL: 9900,
  FAMILY: 14900,
  ESSENTIAL: 5000,
  PLUS: 8000,
  CONCIERGE: 11000,
  ESSENTIAL_FAMILY: 7500,
  PLUS_FAMILY: 13000,
  CONCIERGE_FAMILY: 18000,
};

const PLAN_DISPLAY_NAME: Record<string, string> = {
  ESSENTIAL: "Essential",
  PLUS: "Plus",
  CONCIERGE: "Concierge",
  ESSENTIAL_FAMILY: "Essential Family",
  PLUS_FAMILY: "Plus Family",
  CONCIERGE_FAMILY: "Concierge Family",
};

async function stripeAPI(path: string, body: Record<string, string>) {
  const auth = Buffer.from(`${SK}:`).toString("base64");
  const res = await fetch(`https://api.stripe.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
}

async function stripeGet(path: string) {
  const auth = Buffer.from(`${SK}:`).toString("base64");
  const res = await fetch(`https://api.stripe.com${path}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return res.json();
}

function isUpgrade(currentPlan: string, newPlan: string): boolean {
  const currentPrice = PLAN_PRICE_CENTS[currentPlan] || 0;
  const newPrice = PLAN_PRICE_CENTS[newPlan] || 0;
  return newPrice > currentPrice;
}

async function sendPlanChangeEmail(to: string, customerName: string, options: {
  isUpgrade: boolean;
  newPlanName: string;
  currentPlanName: string;
  proratedAmount?: string;
  effectiveDate?: string;
}) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "hello@kincare360.com",
        pass: process.env.GOOGLE_APP_PASSWORD || "rogvowrocfhdsasp",
      },
    });

    const firstName = customerName.split(" ")[0] || "there";

    if (options.isUpgrade) {
      await transporter.sendMail({
        from: '"Lily - KinCare360" <hello@kincare360.com>',
        to,
        subject: "Your KinCare360 plan has been upgraded!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <img src="https://kincare360.com/kincare360-logo.png" alt="KinCare360" style="height: 60px; margin-bottom: 20px;" />
            <h1 style="color: #0F2147; font-size: 24px;">Plan Upgraded, ${firstName}!</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Your plan has been upgraded to <strong>${options.newPlanName}</strong>. The change is effective immediately.
            </p>
            ${options.proratedAmount ? `
            <div style="background: #f0faf9; border-left: 4px solid #0EA5A0; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #0F2147;">You'll see a prorated charge of <strong>${options.proratedAmount}</strong> for the remainder of this billing period.</p>
            </div>
            ` : ""}
            <div style="background: #f0faf9; border-left: 4px solid #0EA5A0; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #0F2147;">Your new <strong>${options.newPlanName}</strong> features are available now. Log in to your <a href="https://kincare360.com/dashboard" style="color: #0EA5A0;">dashboard</a> to explore.</p>
            </div>
            <p style="color: #555; font-size: 16px;">Thank you for trusting KinCare360 with your family's care.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px;">
              &copy; 2026 Son Healthcare Services LLC, operating as KinCare360. All rights reserved.<br/>
              <a href="https://kincare360.com/terms" style="color: #999;">Terms of Service</a> &middot;
              <a href="https://kincare360.com/privacy" style="color: #999;">Privacy Policy</a>
            </p>
          </div>
        `,
      });
    } else {
      await transporter.sendMail({
        from: '"Lily - KinCare360" <hello@kincare360.com>',
        to,
        subject: "Your KinCare360 plan change is scheduled",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <img src="https://kincare360.com/kincare360-logo.png" alt="KinCare360" style="height: 60px; margin-bottom: 20px;" />
            <h1 style="color: #0F2147; font-size: 24px;">Plan Change Scheduled, ${firstName}</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Your plan will change to <strong>${options.newPlanName}</strong> at the end of your current billing period${options.effectiveDate ? ` on <strong>${options.effectiveDate}</strong>` : ""}.
            </p>
            <div style="background: #f0faf9; border-left: 4px solid #0EA5A0; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #0F2147;">You'll continue to enjoy <strong>${options.currentPlanName}</strong> features until then. No changes to your service until the switch date.</p>
            </div>
            <p style="color: #555; font-size: 16px;">You can cancel this scheduled change anytime from your <a href="https://kincare360.com/dashboard/plan" style="color: #0EA5A0;">plan settings</a>.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px;">
              &copy; 2026 Son Healthcare Services LLC, operating as KinCare360. All rights reserved.<br/>
              <a href="https://kincare360.com/terms" style="color: #999;">Terms of Service</a> &middot;
              <a href="https://kincare360.com/privacy" style="color: #999;">Privacy Policy</a>
            </p>
          </div>
        `,
      });
    }
    console.log(`Plan change email sent to: ${to}`);
  } catch (e) {
    console.error("Plan change email error:", e);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, plan: true, name: true },
  });

  const body = await req.json().catch(() => ({}));
  const action = body.action || "change"; // "change" | "cancel" | "cancel_downgrade"
  const targetPlan = (body.plan || "standard").toLowerCase();
  const priceId = PRICE_MAP[targetPlan] || PRICE_MAP.plus;
  const planKey = PLAN_KEY_MAP[targetPlan] || "PLUS";

  const baseUrl = process.env.NEXTAUTH_URL || "https://kincare360.com";

  // Cancel pending downgrade
  if (action === "cancel_downgrade") {
    await prisma.user.update({
      where: { id: userId },
      data: { pendingPlan: null, pendingPlanDate: null },
    });
    return Response.json({ success: true });
  }

  // Manage payment method -> send to billing portal
  if (action === "manage_payment" && user?.stripeCustomerId) {
    const portalSession = await stripeAPI("/v1/billing_portal/sessions", {
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/dashboard/plan`,
      configuration: BILLING_PORTAL_CONFIG,
    });
    if (portalSession.url) {
      return Response.json({ url: portalSession.url });
    }
    return Response.json({ error: "Failed to open payment portal" }, { status: 500 });
  }

  // Cancel action -> send to billing portal (has cancel button built in)
  if (action === "cancel" && user?.stripeCustomerId) {
    const portalSession = await stripeAPI("/v1/billing_portal/sessions", {
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/dashboard/plan`,
      configuration: BILLING_PORTAL_CONFIG,
    });
    if (portalSession.url) {
      return Response.json({ url: portalSession.url });
    }
    return Response.json({ error: "Failed to open cancellation portal" }, { status: 500 });
  }

  // Check if user already has an active or trialing subscription
  let existingSub: any = null;
  if (user?.stripeCustomerId) {
    const subCheck = await stripeGet(
      `/v1/subscriptions?customer=${user.stripeCustomerId}&limit=1`
    );
    if (subCheck?.data?.length > 0 && ["active", "trialing"].includes(subCheck.data[0].status)) {
      existingSub = subCheck.data[0];
    }
  }

  // If already subscribed -> UPDATE the existing subscription
  if (existingSub) {
    const subDetails = await stripeGet(`/v1/subscriptions/${existingSub.id}`);
    const itemId = subDetails.items?.data?.[0]?.id;
    const currentPlan = user?.plan || "";
    const normalizedCurrent = currentPlan.replace("COMPLETE_FAMILY", "CONCIERGE_FAMILY").replace("COMPLETE", "CONCIERGE");
    const upgrade = isUpgrade(normalizedCurrent, planKey);

    if (itemId) {
      if (upgrade) {
        // UPGRADE: Apply immediately with prorations
        const updateBody = new URLSearchParams({
          [`items[0][id]`]: itemId,
          [`items[0][price]`]: priceId,
          "proration_behavior": "create_prorations",
          [`metadata[plan]`]: planKey,
        });

        const updated = await stripeAPI(`/v1/subscriptions/${existingSub.id}`, Object.fromEntries(updateBody));

        if (updated.id) {
          // Clear any pending downgrade
          await prisma.user.update({
            where: { id: userId },
            data: { plan: planKey, pendingPlan: null, pendingPlanDate: null },
          });

          // Calculate prorated amount estimate
          const currentPrice = PLAN_PRICE_CENTS[normalizedCurrent] || 0;
          const newPrice = PLAN_PRICE_CENTS[planKey] || 0;
          const diff = newPrice - currentPrice;
          const proratedEstimate = diff > 0 ? `$${(diff / 100).toFixed(2)}` : undefined;

          // Send upgrade email
          if (user?.email) {
            sendPlanChangeEmail(user.email, user.name || "", {
              isUpgrade: true,
              newPlanName: PLAN_DISPLAY_NAME[planKey] || planKey,
              currentPlanName: PLAN_DISPLAY_NAME[normalizedCurrent] || normalizedCurrent,
              proratedAmount: proratedEstimate,
            });
          }

          return Response.json({ url: `${baseUrl}/dashboard/plan?upgraded=1` });
        }
      } else {
        // DOWNGRADE: Schedule for end of billing period
        // Store pending downgrade in DB, don't change Stripe yet
        const periodEnd = subDetails.current_period_end
          ? new Date(subDetails.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await prisma.user.update({
          where: { id: userId },
          data: {
            pendingPlan: planKey,
            pendingPlanDate: periodEnd,
          },
        });

        const effectiveDate = periodEnd.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        // Send downgrade scheduled email
        if (user?.email) {
          sendPlanChangeEmail(user.email, user.name || "", {
            isUpgrade: false,
            newPlanName: PLAN_DISPLAY_NAME[planKey] || planKey,
            currentPlanName: PLAN_DISPLAY_NAME[normalizedCurrent] || normalizedCurrent,
            effectiveDate,
          });
        }

        return Response.json({ url: `${baseUrl}/dashboard/plan?downgrade_scheduled=1` });
      }
    }
  }

  // New subscriber -> create checkout session with 7-day trial
  const checkoutParams: Record<string, string> = {
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "subscription_data[trial_period_days]": "7",
    success_url: `${baseUrl}/dashboard/plan?upgraded=1`,
    cancel_url: `${baseUrl}/dashboard/plan`,
    "metadata[userId]": userId,
    "metadata[plan]": planKey,
  };

  if (user?.email) {
    checkoutParams["customer_email"] = user.email;
  }

  const checkoutSession = await stripeAPI("/v1/checkout/sessions", checkoutParams);

  if (checkoutSession.url) {
    return Response.json({ url: checkoutSession.url });
  }

  return Response.json({ error: "Failed to create billing session" }, { status: 500 });
}

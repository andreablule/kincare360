import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const SK = process.env.STRIPE_SECRET_KEY!;

// Map plan name -> Stripe price ID
const PRICE_MAP: Record<string, string> = {
  essential:       "price_1TFgeLJlUr03cRD7PP0gW8gW",
  plus:            "price_1TFgeMJlUr03cRD7fTOu4j0y",
  complete:        "price_1TFgeOJlUr03cRD7Mli4BYhX",
  essential_family:"price_1TFgePJlUr03cRD7o3hb9ZGN",
  plus_family:     "price_1TFgeRJlUr03cRD7OIIRu8kg",
  complete_family: "price_1TFgeSJlUr03cRD7BAJ0XDzT",
};

const PLAN_KEY_MAP: Record<string, string> = {
  essential: "ESSENTIAL",
  plus: "PLUS",
  complete: "COMPLETE",
  essential_family: "ESSENTIAL_FAMILY",
  plus_family: "PLUS_FAMILY",
  complete_family: "COMPLETE_FAMILY",
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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, plan: true },
  });

  const body = await req.json().catch(() => ({}));
  const action = body.action || "change"; // "change" | "cancel"
  const targetPlan = (body.plan || "standard").toLowerCase();
  const priceId = PRICE_MAP[targetPlan] || PRICE_MAP.plus;
  const planKey = PLAN_KEY_MAP[targetPlan] || "PLUS";

  const baseUrl = process.env.NEXTAUTH_URL || "https://kincare360.com";

  // Cancel action → send to billing portal (has cancel button built in)
  if (action === "cancel" && user?.stripeCustomerId) {
    const portalSession = await stripeAPI("/v1/billing_portal/sessions", {
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/dashboard/plan`,
    });
    if (portalSession.url) {
      return Response.json({ url: portalSession.url });
    }
  }

  // Check if user already has an active or trialing subscription
  let existingSub: { id: string; status: string } | null = null;
  if (user?.stripeCustomerId) {
    const auth = Buffer.from(`${SK}:`).toString("base64");
    const subCheck = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${user.stripeCustomerId}&limit=1`,
      { headers: { Authorization: `Basic ${auth}` } }
    ).then((r) => r.json());
    if (subCheck?.data?.length > 0 && ["active", "trialing"].includes(subCheck.data[0].status)) {
      existingSub = subCheck.data[0];
    }
  }

  // If already subscribed → UPDATE the existing subscription (trial carries over, no double charge)
  if (existingSub) {
    const auth = Buffer.from(`${SK}:`).toString("base64");

    // Get the subscription item ID to update
    const subDetails = await fetch(`https://api.stripe.com/v1/subscriptions/${existingSub.id}`, {
      headers: { Authorization: `Basic ${auth}` },
    }).then((r) => r.json());

    const itemId = subDetails.items?.data?.[0]?.id;
    if (itemId) {
      const updateBody = new URLSearchParams({
        [`items[0][id]`]: itemId,
        [`items[0][price]`]: priceId,
        "proration_behavior": "create_prorations",
        [`metadata[plan]`]: planKey,
      });

      const updated = await fetch(`https://api.stripe.com/v1/subscriptions/${existingSub.id}`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: updateBody.toString(),
      }).then((r) => r.json());

      if (updated.id) {
        // Update DB
        await prisma.user.update({
          where: { id: userId },
          data: { plan: planKey },
        });
        return Response.json({ url: `${baseUrl}/dashboard/plan?upgraded=1` });
      }
    }
  }

  // New subscriber → create checkout session with 7-day trial
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

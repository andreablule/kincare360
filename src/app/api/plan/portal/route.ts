import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SK = process.env.STRIPE_SECRET_KEY!;

// Map plan name -> Stripe price ID
const PRICE_MAP: Record<string, string> = {
  basic:    process.env.STRIPE_PRICE_BASIC    || "price_1TEPOcJlUr03cRD7vm4xB09U",
  standard: process.env.STRIPE_PRICE_STANDARD || "price_1TEPOcJlUr03cRD7ypzyYYif",
  premium:  process.env.STRIPE_PRICE_PREMIUM  || "price_1TEPOcJlUr03cRD7tVv6DDjY",
};

const PLAN_KEY_MAP: Record<string, string> = {
  basic: "BASIC",
  standard: "STANDARD",
  premium: "PREMIUM",
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
  const priceId = PRICE_MAP[targetPlan] || PRICE_MAP.standard;
  const planKey = PLAN_KEY_MAP[targetPlan] || "STANDARD";

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

  // Plan change → always create a new checkout session for the specific plan
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

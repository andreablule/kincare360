import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SK = process.env.STRIPE_SECRET_KEY!;

const PRICE_MAP: Record<string, string> = {
  starter: 'price_1TEPOcJlUr03cRD7vm4xB09U',
  essential: 'price_1TEPOcJlUr03cRD7ypzyYYif',
  premium: 'price_1TEPOcJlUr03cRD7tVv6DDjY',
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

  const baseUrl = process.env.NEXTAUTH_URL || "https://kincare360.com";

  // If user has a Stripe customer ID, try to create a billing portal session
  if (user?.stripeCustomerId) {
    const portalSession = await stripeAPI("/v1/billing_portal/sessions", {
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/dashboard/plan`,
    });

    if (portalSession.url) {
      return Response.json({ url: portalSession.url });
    }
    // If portal config is missing or fails, fall through to checkout fallback
    console.error("Portal session failed:", portalSession.error);
  }

  // Fallback: create a new checkout session for upgrade
  const { plan } = await req.json().catch(() => ({ plan: null }));
  const targetPlan = plan || "essential";
  const priceId = PRICE_MAP[targetPlan] || PRICE_MAP.essential;

  const checkoutParams: Record<string, string> = {
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: `${baseUrl}/dashboard/plan?upgraded=1`,
    cancel_url: `${baseUrl}/dashboard/plan`,
    "metadata[userId]": userId,
    "metadata[plan]": targetPlan === "starter" ? "BASIC" : targetPlan === "essential" ? "STANDARD" : "PREMIUM",
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

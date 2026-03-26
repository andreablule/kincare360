import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SK = process.env.STRIPE_SECRET_KEY!;

async function stripeGet(path: string) {
  const auth = Buffer.from(`${SK}:`).toString("base64");
  const res = await fetch(`https://api.stripe.com${path}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return res.json();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true, stripeCustomerId: true },
  });

  let trialEnd: string | null = null;

  // Fetch trial end date from Stripe if customer exists
  if (user?.stripeCustomerId) {
    try {
      const subs = await stripeGet(
        `/v1/subscriptions?customer=${user.stripeCustomerId}&status=trialing&limit=1`
      );
      if (subs?.data?.[0]?.trial_end) {
        trialEnd = new Date(subs.data[0].trial_end * 1000).toISOString();
      }
    } catch {
      // Non-fatal — just won't show trial end date
    }
  }

  return Response.json({
    plan: user?.plan || null,
    subscriptionStatus: user?.subscriptionStatus || null,
    trialEnd,
  });
}

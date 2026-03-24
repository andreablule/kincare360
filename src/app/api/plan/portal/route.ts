import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return Response.json({ error: "No Stripe customer" }, { status: 400 });
  }

  const SK = process.env.STRIPE_SECRET_KEY!;
  const auth = Buffer.from(`${SK}:`).toString("base64");

  const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL || "https://kincare360.com"}/dashboard/plan`,
    }).toString(),
  });
  const portalSession = await res.json();

  if (portalSession.url) {
    return Response.json({ url: portalSession.url });
  }
  return Response.json({ error: "Failed to create portal session" }, { status: 500 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SK = process.env.STRIPE_SECRET_KEY!;

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

export async function POST(req: NextRequest) {
  try {
    const { referralCode } = await req.json();

    if (!referralCode) {
      return NextResponse.json({ error: "Referral code required" }, { status: 400 });
    }

    const referral = await prisma.referral.findUnique({ where: { code: referralCode } });
    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    // If already has a Stripe account, return existing
    if (referral.stripeAccountId) {
      // Create a new login link for existing account
      const loginLink = await stripeAPI(`/v1/accounts/${referral.stripeAccountId}/login_links`, {});
      return NextResponse.json({ url: loginLink.url, existing: true });
    }

    // Create Stripe Connect Express account
    const account = await stripeAPI("/v1/accounts", {
      type: "express",
      country: "US",
      capabilities: { transfers: { requested: "true" } } as any,
      "capabilities[transfers][requested]": "true",
      ...(referral.referrerEmail ? { email: referral.referrerEmail } : {}),
    });

    if (account.error) {
      console.error("Stripe Connect error:", account.error);
      return NextResponse.json({ error: "Failed to create Stripe account" }, { status: 500 });
    }

    // Save account ID
    await prisma.referral.update({
      where: { code: referralCode },
      data: { stripeAccountId: account.id, payoutMethod: "stripe_connect" },
    });

    // Create account link for onboarding
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://kincare360.com";
    const accountLink = await stripeAPI("/v1/account_links", {
      account: account.id,
      refresh_url: `${baseUrl}/partners?code=${referralCode}`,
      return_url: `${baseUrl}/partners?code=${referralCode}&connected=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("Referral connect error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

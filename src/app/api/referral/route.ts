import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function generateCode(name: string): string {
  const prefix = name
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 4)
    .toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const { type, name, email, phone, practiceName } = await req.json();

    if (!type || !name) {
      return NextResponse.json({ error: "Type and name are required" }, { status: 400 });
    }

    if (!["client", "family", "partner", "doctor"].includes(type)) {
      return NextResponse.json({ error: "Invalid referral type" }, { status: 400 });
    }

    // For client type, auto-link userId from session
    let userId: string | null = null;
    if (type === "client") {
      const session = await getServerSession(authOptions);
      userId = (session?.user as any)?.id || null;
    }

    // Generate a unique code
    let code = generateCode(name);
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.referral.findUnique({ where: { code } });
      if (!existing) break;
      code = generateCode(name);
      attempts++;
    }

    const referral = await prisma.referral.create({
      data: {
        code,
        type,
        referrerName: name,
        referrerEmail: email || null,
        referrerPhone: phone || null,
        practiceName: practiceName || null,
        userId,
      },
    });

    return NextResponse.json({
      code: referral.code,
      link: `https://kincare360.com/register?ref=${referral.code}`,
    });
  } catch (err) {
    console.error("Referral create error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const code = new URL(req.url).searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const referral = await prisma.referral.findUnique({
      where: { code },
      include: { conversions: true },
    });

    if (!referral) {
      return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
    }

    return NextResponse.json({
      code: referral.code,
      type: referral.type,
      referrerName: referral.referrerName,
      practiceName: referral.practiceName,
      earnings: referral.earnings,
      referralCount: referral.referralCount,
      createdAt: referral.createdAt,
      conversions: referral.conversions,
    });
  } catch (err) {
    console.error("Referral lookup error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

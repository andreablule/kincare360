import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has a referral code
    let referral = await prisma.referral.findFirst({
      where: { userId: user.id },
      include: { conversions: true },
    });

    // Auto-create if none exists
    if (!referral) {
      const name = user.name || user.email?.split("@")[0] || "USER";
      let code = generateCode(name);
      let attempts = 0;
      while (attempts < 5) {
        const existing = await prisma.referral.findUnique({ where: { code } });
        if (!existing) break;
        code = generateCode(name);
        attempts++;
      }

      referral = await prisma.referral.create({
        data: {
          code,
          type: "client",
          referrerName: user.name || user.email,
          referrerEmail: user.email,
          userId: user.id,
        },
        include: { conversions: true },
      });
    }

    const pending = referral.conversions.filter((c) => c.status === "pending").length;
    const paid = referral.conversions.filter((c) => c.status === "paid").length;
    const totalEarned = referral.conversions
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.amount, 0);

    return NextResponse.json({
      code: referral.code,
      link: `https://kincare360.com/register?ref=${referral.code}`,
      referrerName: referral.referrerName,
      earnings: referral.earnings,
      referralCount: referral.referralCount,
      stats: { pending, paid, totalEarned },
      conversions: referral.conversions,
    });
  } catch (err) {
    console.error("Referral my error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFlyer } from "../generate-flyer";

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const referral = await prisma.referral.findUnique({ where: { code } });
  if (!referral) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const link = `https://kincare360.com/register?ref=${referral.code}`;
  const html = generateFlyer(referral.referrerName, referral.code, link);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="KinCare360-Flyer-${code}.html"`,
    },
  });
}

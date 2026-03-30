import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import nodemailer from "nodemailer";

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

    const link = `https://kincare360.com/register?ref=${referral.code}`;
    const dashLink = `https://kincare360.com/partners?code=${referral.code}`;

    // Send SMS confirmation + social media post
    if (phone) {
      try {
        const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
        const twilioToken = process.env.TWILIO_AUTH_TOKEN!;
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER!;
        const smsAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");

        // Confirmation SMS
        const smsBody = `Welcome to the KinCare360 Referral Program, ${name.split(" ")[0]}! 🎉\n\nYour code: ${referral.code}\nShare this link: ${link}\n\nYou earn $50 for every new subscriber.\nTrack earnings: ${dashLink}\n\nReply STOP to opt out.`;

        const digits = phone.replace(/\D/g, "").slice(-10);
        if (digits.length === 10) {
          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: "POST",
            headers: { "Authorization": `Basic ${smsAuth}`, "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ To: `+1${digits}`, From: twilioPhone, Body: smsBody }).toString(),
          });

          // Send ready-to-post social media message
          const socialPost = `🎉 I just partnered with KinCare360 — a service that provides daily wellness check-in calls, medication reminders, and care coordination for aging parents.\n\nIf you or someone you know is caring for an elderly loved one, check it out:\n${link}\n\n✅ 7-day free trial\n✅ Daily check-in calls\n✅ Medication reminders\n✅ Family dashboard\n\n#ElderCare #AgingParents #KinCare360 #Caregiving`;

          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: "POST",
            headers: { "Authorization": `Basic ${smsAuth}`, "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ To: `+1${digits}`, From: twilioPhone, Body: `📱 Ready-to-post for social media (just copy & paste):\n\n${socialPost}` }).toString(),
          });
        }
      } catch (smsErr) {
        console.error("Partner SMS error:", smsErr);
      }
    }

    // Send confirmation email
    if (email) {
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

        const firstName = name.split(" ")[0] || "there";

        await transporter.sendMail({
          from: '"KinCare360 Partners" <hello@kincare360.com>',
          to: email,
          subject: `Welcome to the KinCare360 Referral Program, ${firstName}! 🎉`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <img src="https://kincare360.com/kincare360-logo.png" alt="KinCare360" style="height: 60px; margin-bottom: 20px;" />

              <h1 style="color: #0F2147; font-size: 24px;">You're in, ${firstName}!</h1>

              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Your referral partner code is:
              </p>

              <div style="background: #f0faf9; border: 2px solid #0EA5A0; padding: 20px; margin: 20px 0; border-radius: 12px; text-align: center;">
                <p style="font-size: 28px; font-weight: bold; color: #0EA5A0; margin: 0; font-family: monospace;">${referral.code}</p>
              </div>

              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Share this link with anyone who could use daily wellness check-ins for their aging parent:
              </p>

              <div style="background: #f5f5f5; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
                <a href="${link}" style="color: #0EA5A0; font-weight: bold; word-break: break-all;">${link}</a>
              </div>

              <div style="background: #f0faf9; border-left: 4px solid #0EA5A0; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #0F2147;"><strong>💰 You earn $50</strong> for every new subscriber who signs up using your code — after their 7-day trial ends and they pay their first bill.</p>
              </div>

              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Track your referrals and earnings anytime: <a href="${dashLink}" style="color: #0EA5A0;">Your Partner Dashboard</a>
              </p>

              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                To receive payouts directly to your bank, click "Connect Your Bank" on your partner page.
              </p>

              <h2 style="color: #0F2147; font-size: 18px; margin-top: 30px;">📱 Ready-to-Post on Social Media</h2>
              <p style="color: #555; font-size: 14px;">Copy and paste this to Facebook, Instagram, or anywhere:</p>
              <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 12px 0; font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap;">🎉 I just partnered with KinCare360 — a service that provides daily wellness check-in calls, medication reminders, and care coordination for aging parents.

If you or someone you know is caring for an elderly loved one, check it out:
${link}

✅ 7-day free trial
✅ Daily check-in calls
✅ Medication reminders
✅ Family dashboard

#ElderCare #AgingParents #KinCare360 #Caregiving</div>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

              <p style="color: #999; font-size: 12px;">
                Questions? Call Lily at <a href="tel:+18125155252" style="color: #999;">(812) 515-5252</a> or email <a href="mailto:hello@kincare360.com" style="color: #999;">hello@kincare360.com</a>
              </p>
            </div>
          `,
        });
        console.log("Partner welcome email sent to:", email);
      } catch (emailErr) {
        console.error("Partner email error:", emailErr);
        // Don't fail the signup if email fails
      }
    }

    return NextResponse.json({
      code: referral.code,
      link,
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

export async function DELETE(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const referral = await prisma.referral.findUnique({ where: { code } });
    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    // Delete conversions first (foreign key), then the referral
    await prisma.referralConversion.deleteMany({ where: { referralId: referral.id } });
    await prisma.referral.delete({ where: { code } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Referral delete error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

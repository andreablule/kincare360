import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

async function sendEmail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 587, secure: false,
    auth: { user: "hello@kincare360.com", pass: process.env.GOOGLE_APP_PASSWORD || "rogvowrocfhdsasp" },
  });
  await transporter.sendMail({ from: '"KinCare360" <hello@kincare360.com>', to, subject, html });
}

// VAPI tool endpoint — Lily calls this when a client reports a non-emergency concern
// Pain, missed medications, not eating, confusion, loneliness, etc.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let args: any = {};
    const toolCall = body.message?.toolCallList?.[0];
    if (toolCall?.function?.arguments) {
      args = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    }
    if (!args.concernDescription) args = body;

    const { concernDescription, riskLevel } = args;
    const callerPhone = (body.message?.call?.customer?.number || "").replace(/\D/g, "").slice(-10);

    let patient: any = null;
    if (callerPhone) {
      patient = await prisma.patient.findFirst({
        where: { phone: { contains: callerPhone } },
        include: { familyMembers: true },
      });
    }

    if (!patient) {
      return NextResponse.json({
        results: [{ toolCallId: toolCall?.id || "", result: "I've noted your concern. Please don't hesitate to call back anytime." }]
      });
    }

    const patientName = `${patient.firstName} ${patient.lastName}`;
    const description = concernDescription || "reported a health concern";
    const level = (riskLevel || "medium").toLowerCase();
    const now = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

    // Color and label based on risk level
    const levelConfig: Record<string, { color: string; bg: string; border: string; label: string; emoji: string }> = {
      low: { color: "#16a34a", bg: "#f0fdf4", border: "#16a34a", label: "LOW RISK", emoji: "🟢" },
      medium: { color: "#d97706", bg: "#fffbeb", border: "#d97706", label: "MEDIUM RISK", emoji: "🟡" },
      high: { color: "#dc2626", bg: "#fef2f2", border: "#dc2626", label: "HIGH RISK", emoji: "🟠" },
    };
    const config = levelConfig[level] || levelConfig.medium;

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:${config.color};color:white;padding:16px;border-radius:8px;margin-bottom:20px;">
          <h1 style="margin:0;font-size:22px;">${config.emoji} Health Concern — ${config.label}</h1>
          <p style="margin:4px 0 0 0;font-size:14px;opacity:0.9;">KinCare360 Care Update for ${patientName}</p>
        </div>
        <p style="font-size:16px;color:#333;line-height:1.6;"><strong>${patientName}</strong> ${description}.</p>
        <p style="color:#666;font-size:14px;">Reported during a call with Lily on ${now}</p>
        <div style="background:${config.bg};border:2px solid ${config.border};border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:${config.color};font-weight:bold;font-size:15px;">
            ${level === "high" ? "This may need attention soon. Consider checking in with them or scheduling a doctor visit." :
              level === "medium" ? "This is worth being aware of. Consider following up when you can." :
              "Just keeping you in the loop. No immediate action needed."}
          </p>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 8px 0;font-weight:bold;color:#334155;">What you can do:</p>
          <ul style="margin:0;padding-left:20px;color:#475569;line-height:1.8;">
            <li>Give them a call to check in</li>
            <li>Log in to the family dashboard: <a href="https://www.kincare360.com/dashboard" style="color:#0d9488;">kincare360.com/dashboard</a></li>
            <li>Call KinCare360 at (812) 515-5252 for more details</li>
          </ul>
        </div>
        <p style="color:#94a3b8;font-size:12px;">— KinCare360 Automated Care Update</p>
      </div>`;

    const subject = `${config.emoji} ${patientName} — ${config.label}: ${description.substring(0, 50)}`;

    // Send email to all family members
    let alerted = 0;
    for (const member of patient.familyMembers) {
      if (member.email) {
        try {
          await sendEmail(member.email, subject, emailHtml);
          alerted++;
          console.log(`[concern-alert] Email sent to ${member.name} (${member.email})`);
        } catch (e) {
          console.error(`[concern-alert] Email failed for ${member.name}:`, e);
        }
      }
    }

    console.log(`[concern-alert] ${config.label} alert for ${patientName}: ${description} — notified ${alerted} family members`);

    return NextResponse.json({
      results: [{
        toolCallId: toolCall?.id || "",
        result: `I've noted your concern and sent an update to your family so they're aware. They'll receive an email with the details.`
      }]
    });

  } catch (error) {
    console.error("[concern-alert] Error:", error);
    return NextResponse.json({
      results: [{ toolCallId: "", result: "I've noted your concern. Your family will be updated." }]
    });
  }
}

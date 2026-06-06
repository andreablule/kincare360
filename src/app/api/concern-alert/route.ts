import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

function digits(value = "") {
  return value.replace(/\D/g, "").slice(-10);
}

async function sendSMS(to: string, body: string) {
  if (!twilioSid || !twilioToken || !twilioPhone) {
    console.warn("[concern-alert] SMS skipped; missing Twilio configuration.");
    return;
  }
  const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: to, From: twilioPhone, Body: body }).toString(),
    });
  } catch (e) {
    console.error("[concern-alert] SMS failed:", e);
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.GOOGLE_APP_PASSWORD) {
    console.warn("[concern-alert] Email skipped; missing GOOGLE_APP_PASSWORD.");
    return;
  }
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: "hello@kincare360.com", pass: process.env.GOOGLE_APP_PASSWORD },
  });
  await transporter.sendMail({ from: '"KinCare360" <hello@kincare360.com>', to, subject, html });
}

// VAPI tool endpoint — Lily calls this when a caller shares a non-crisis family concern.
// Crisis/self-harm/immediate danger should use /api/crisis-alert instead.
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
    const callerPhone = digits(body.message?.call?.customer?.number || "");

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
    const description = concernDescription || "shared something the family may want to review";
    const level = (riskLevel || "medium").toLowerCase();
    const now = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

    const levelConfig: Record<string, { color: string; bg: string; border: string; label: string; emoji: string }> = {
      low: { color: "#16a34a", bg: "#f0fdf4", border: "#16a34a", label: "LOW CONCERN", emoji: "🟢" },
      medium: { color: "#d97706", bg: "#fffbeb", border: "#d97706", label: "FAMILY CONCERN", emoji: "🟡" },
      high: { color: "#dc2626", bg: "#fef2f2", border: "#dc2626", label: "IMPORTANT FAMILY CONCERN", emoji: "🟠" },
    };
    const config = levelConfig[level] || levelConfig.medium;

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:${config.color};color:white;padding:16px;border-radius:8px;margin-bottom:20px;">
          <h1 style="margin:0;font-size:22px;">${config.emoji} KinCare360 Family Concern — ${config.label}</h1>
          <p style="margin:4px 0 0 0;font-size:14px;opacity:0.9;">Family update for ${patientName}</p>
        </div>
        <p style="font-size:16px;color:#333;line-height:1.6;"><strong>${patientName}</strong> ${description}.</p>
        <p style="color:#666;font-size:14px;">Shared during a call with Lily on ${now}</p>
        <div style="background:${config.bg};border:2px solid ${config.border};border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:${config.color};font-weight:bold;font-size:15px;">
            ${level === "high" ? "Please check in with them soon. If you believe there is immediate danger, call 911." :
              level === "medium" ? "This is worth being aware of. Please follow up when you can." :
              "Just keeping you in the loop. No immediate action may be needed."}
          </p>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 8px 0;font-weight:bold;color:#334155;">What you can do:</p>
          <ul style="margin:0;padding-left:20px;color:#475569;line-height:1.8;">
            <li>Give them a call to check in</li>
            <li>Review the family dashboard: <a href="https://www.kincare360.com/dashboard" style="color:#0d9488;">kincare360.com/dashboard</a></li>
            <li>If you believe there is immediate danger, call 911</li>
          </ul>
        </div>
        <p style="color:#64748b;font-size:12px;line-height:1.6;">KinCare360 is not an emergency, crisis counseling, medical, or in-home care service. This notification means the caller shared something Lily should pass to family/safety contacts; it is not a diagnosis or emergency detection.</p>
        <p style="color:#94a3b8;font-size:12px;">— KinCare360 Automated Family Update</p>
      </div>`;

    const subject = `${config.emoji} ${patientName} — ${config.label}: ${description.substring(0, 50)}`;

    await prisma.callLog.create({
      data: {
        patientId: patient.id,
        callDate: new Date(),
        callType: 'concern',
        summary: `${config.emoji} ${config.label}: ${description}`,
        urgent: level === 'high',
      }
    });

    console.log(`[concern-alert] ${config.label} logged for ${patientName}: ${description}`);

    if (level === 'high') {
      const smsMsg = `${config.emoji} KinCare360 — ${config.label}\n\n${patientName} ${description}.\n\nTime: ${now}\n\nPlease check in soon. If there is immediate danger, call 911.\n\nView dashboard: kincare360.com/dashboard`;

      for (const member of patient.familyMembers) {
        if (member.email) {
          try { await sendEmail(member.email, subject, emailHtml); } catch (e) { console.error(`[concern-alert] Email failed:`, e); }
        }
        if (member.phone && member.alertsEnabled && member.smsConsentStatus === 'opted_in' && ['text', 'both'].includes(member.alertMode)) {
          const memberDigits = digits(member.phone);
          if (memberDigits.length === 10) { try { await sendSMS(`+1${memberDigits}`, smsMsg); } catch (e) {} }
        }
      }
    }

    return NextResponse.json({
      results: [{
        toolCallId: toolCall?.id || "",
        result: level === 'high'
          ? "I've noted this and notified your family contact right away because it sounds important. If you may be in immediate danger, please call 911."
          : "I've noted everything. Your family will receive a summary in their daily update."
      }]
    });

  } catch (error) {
    console.error("[concern-alert] Error:", error);
    return NextResponse.json({
      results: [{ toolCallId: "", result: "I've noted your concern. Your family will be updated." }]
    });
  }
}

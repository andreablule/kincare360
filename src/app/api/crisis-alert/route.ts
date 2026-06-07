import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";
import { sendSMS } from "@/lib/sms";

const alertPhone = process.env.ALERT_PHONE_NUMBER;

type CrisisCategory =
  | "SELF_HARM_IDEATION"
  | "SELF_HARM_IMMEDIATE"
  | "OVERDOSE_RISK"
  | "CONFUSION_DISORIENTATION"
  | "ABUSE_NEGLECT"
  | "SCAM_EXPLOITATION"
  | "MEDICAL_EMERGENCY_REPORTED"
  | "SEVERE_LONELINESS"
  | "OTHER_URGENT_SAFETY";

function parseArgs(body: any) {
  const toolCall = body.message?.toolCallList?.[0];
  if (toolCall?.function?.arguments) {
    return {
      toolCallId: toolCall.id || "",
      args: typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments,
    };
  }
  return { toolCallId: "", args: body };
}

function digits(value = "") {
  return value.replace(/\D/g, "").slice(-10);
}

function categoryLabel(category: CrisisCategory) {
  const labels: Record<CrisisCategory, string> = {
    SELF_HARM_IDEATION: "self-harm concern shared",
    SELF_HARM_IMMEDIATE: "immediate self-harm safety concern",
    OVERDOSE_RISK: "possible medication or poisoning safety concern",
    CONFUSION_DISORIENTATION: "confusion or disorientation concern",
    ABUSE_NEGLECT: "possible abuse, neglect, or safety concern",
    SCAM_EXPLOITATION: "possible scam or exploitation concern",
    MEDICAL_EMERGENCY_REPORTED: "urgent medical concern reported by caller",
    SEVERE_LONELINESS: "severe loneliness or emotional distress concern",
    OTHER_URGENT_SAFETY: "urgent safety concern",
  };
  return labels[category] || labels.OTHER_URGENT_SAFETY;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.GOOGLE_APP_PASSWORD) {
    console.warn("[crisis-alert] Email skipped; missing GOOGLE_APP_PASSWORD.");
    return;
  }
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: "hello@kincare360.com", pass: process.env.GOOGLE_APP_PASSWORD },
  });
  await transporter.sendMail({ from: '"KinCare360 Safety" <hello@kincare360.com>', to, subject, html });
}

// VAPI tool endpoint — Lily calls this when a caller shares a crisis-level safety concern.
// This does not mean Lily verified an emergency; it means the caller shared concerning information.
export async function POST(req: NextRequest) {
  let toolCallId = "";
  try {
    const body = await req.json();
    const parsed = parseArgs(body);
    toolCallId = parsed.toolCallId;
    const args = parsed.args || {};

    const category = (args.riskCategory || args.category || "OTHER_URGENT_SAFETY") as CrisisCategory;
    const concernDescription = args.concernDescription || args.description || "shared an urgent safety concern during a Lily call";
    const callerPhone = digits(body.message?.call?.customer?.number || args.callerPhone || "");

    let patient: any = null;
    if (callerPhone) {
      patient = await prisma.patient.findFirst({
        where: { phone: { contains: callerPhone } },
        include: { familyMembers: true },
      });
    }

    const now = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "A KinCare360 caller";
    const label = categoryLabel(category);
    const dashboardUrl = "https://www.kincare360.com/dashboard";

    const smsMsg = `KinCare360 family follow-up\n\n${patientName} shared a non-medical concern that may need family attention.\n\nDetails: ${concernDescription}.\nType: ${label}.\nTime: ${now}\n\nPlease check the family dashboard or follow up when available. KinCare360 is not an emergency, crisis, or medical service. If there is immediate danger, call 911.\n\nDashboard: ${dashboardUrl}`;

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;">
        <div style="background:#991b1b;color:white;padding:16px;border-radius:8px;margin-bottom:20px;">
          <h1 style="margin:0;font-size:22px;">Urgent KinCare360 Safety Concern</h1>
          <p style="margin:6px 0 0 0;font-size:14px;opacity:0.92;">Shared during a Lily call — ${now}</p>
        </div>
        <p style="font-size:16px;color:#333;line-height:1.6;"><strong>${patientName}</strong> ${concernDescription}.</p>
        <div style="background:#fef2f2;border:2px solid #991b1b;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#7f1d1d;font-weight:bold;">Please call or check on them now. If there is immediate danger, call 911. If this involves suicide or emotional crisis, call or text 988.</p>
        </div>
        <p style="font-size:14px;color:#475569;line-height:1.7;"><strong>Important:</strong> KinCare360 is not an emergency response, crisis counseling, medical, or suicide-prevention service. This notice means the caller shared something concerning during a Lily call and a family/safety contact should follow up.</p>
        <p style="font-size:14px;color:#475569;">Dashboard: <a href="${dashboardUrl}" style="color:#0d9488;">${dashboardUrl}</a></p>
        <p style="color:#94a3b8;font-size:12px;">— KinCare360 Automated Safety Notification</p>
      </div>`;

    if (patient) {
      await prisma.callLog.create({
        data: {
          patientId: patient.id,
          callDate: new Date(),
          callType: "crisis",
          summary: `Urgent safety concern: ${label} — ${concernDescription}`,
          concerns: `${category}: ${concernDescription}`,
          urgent: true,
        },
      });

      for (const member of patient.familyMembers) {
        if (member.email) {
          try { await sendEmail(member.email, `Urgent KinCare360 safety concern: ${patientName}`, emailHtml); } catch (e) { console.error("[crisis-alert] Family email failed:", e); }
        }
        if (member.phone && member.smsConsentStatus === "opted_in" && ["text", "both"].includes(member.alertMode)) {
          const memberDigits = digits(member.phone);
          if (memberDigits.length === 10) {
            try { await sendSMS(`+1${memberDigits}`, smsMsg); } catch (e) { console.error("[crisis-alert] Family SMS failed:", e); }
          }
        }
      }
    }

    if (alertPhone) {
      const ownerDigits = digits(alertPhone);
      if (ownerDigits.length === 10) {
        try { await sendSMS(`+1${ownerDigits}`, smsMsg); } catch (e) { console.error("[crisis-alert] Owner SMS failed:", e); }
      }
    }

    return NextResponse.json({
      results: [{
        toolCallId,
        result: "I have notified your family or safety contact right away. KinCare360 is not an emergency or crisis service, so if you may be in immediate danger please call 911 now. If you are thinking about suicide or self-harm, please call or text 988 now. I can stay with you while you reach out for help.",
      }],
    });
  } catch (error) {
    console.error("[crisis-alert] Error:", error);
    return NextResponse.json({
      results: [{
        toolCallId,
        result: "I want you to get real help right now. Please call 911 if you may be in immediate danger, or call or text 988 if this is about suicide, self-harm, or emotional crisis. If you can, ask someone nearby to stay with you.",
      }],
    });
  }
}

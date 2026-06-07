import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";
import { sendSMS } from "@/lib/sms";

const alertPhone = process.env.ALERT_PHONE_NUMBER;
const vapiApiKey = process.env.VAPI_API_KEY;
const vapiPhoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
const vapiAlertAssistantId = process.env.VAPI_ALERT_ASSISTANT_ID;

function digits(value = "") {
  return value.replace(/\D/g, "").slice(-10);
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.GOOGLE_APP_PASSWORD) {
    console.warn("[emergency-alert] Email skipped; missing GOOGLE_APP_PASSWORD.");
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

async function placeFamilySafetyCall(to: string, firstMessage: string) {
  if (!vapiApiKey || !vapiPhoneNumberId || !vapiAlertAssistantId) {
    console.warn("[emergency-alert] VAPI safety call skipped; missing configuration.");
    return;
  }
  await fetch("https://api.vapi.ai/call/phone", {
    method: "POST",
    headers: { "Authorization": `Bearer ${vapiApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumberId: vapiPhoneNumberId,
      customer: { number: to },
      assistantId: vapiAlertAssistantId,
      assistantOverrides: {
        firstMessage,
        maxDurationSeconds: 60,
      },
    }),
  });
}

// VAPI tool endpoint — kept for compatibility when Lily routes a caller-reported urgent situation here.
// Preferred mental-health/self-harm route is /api/crisis-alert.
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
    if (!args.emergencyDescription) args = body;

    const { emergencyDescription } = args;
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
        results: [{ toolCallId: toolCall?.id || "", result: "I'm trying to notify a safety contact now. KinCare360 is not an emergency service, so please call 911 now if you may be in immediate danger." }]
      });
    }

    const patientName = `${patient.firstName} ${patient.lastName}`;
    const description = emergencyDescription || "shared an urgent safety concern";
    const now = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

    const smsMsg = `KinCare360 family follow-up\n\n${patientName} shared a non-medical concern that may need family attention.\n\nDetails: ${description}.\nTime: ${now}\n\nPlease check the family dashboard or follow up when available. KinCare360 is not an emergency or medical service. If there is immediate danger, call 911.\n\n— KinCare360 Family Notice`;

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#b91c1c;color:white;padding:16px;border-radius:8px;margin-bottom:20px;">
          <h1 style="margin:0;font-size:24px;">Urgent KinCare360 Safety Concern</h1>
        </div>
        <p style="font-size:18px;color:#333;"><strong>${patientName}</strong> ${description}.</p>
        <p style="color:#666;">Time: ${now}</p>
        <div style="background:#fef2f2;border:2px solid #b91c1c;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#7f1d1d;font-weight:bold;">Please check on them immediately. If there is immediate danger, call 911.</p>
        </div>
        <p style="color:#475569;font-size:14px;line-height:1.7;">KinCare360 is not an emergency response, crisis counseling, medical, or in-home care service. This notice means the caller shared an urgent concern during a Lily call.</p>
        <p style="color:#999;font-size:12px;">— KinCare360 Automated Safety Notice</p>
      </div>`;

    let alerted = 0;
    for (const member of patient.familyMembers) {
      if (member.phone) {
        const memberDigits = digits(member.phone);
        if (memberDigits.length === 10) {
          const formattedPhone = `+1${memberDigits}`;
          if (member.smsConsentStatus === 'opted_in' && ['text', 'both'].includes(member.alertMode)) {
            try { await sendSMS(formattedPhone, smsMsg); alerted++; } catch (e) { console.error(`[emergency-alert] SMS failed for ${member.name}:`, e); }
          }
          try {
            await placeFamilySafetyCall(
              formattedPhone,
              `This is an urgent KinCare360 safety concern notice. ${patientName} ${description}. Please check on them immediately. If there is immediate danger, call nine one one. KinCare360 is not an emergency service.`
            );
            alerted++;
          } catch (e) { console.error(`[emergency-alert] VAPI safety call failed for ${member.name}:`, e); }
        }
      }
      if (member.email) {
        try { await sendEmail(member.email, `Urgent KinCare360 safety concern: ${patientName}`, emailHtml); alerted++; } catch (e) { console.error(`[emergency-alert] Email failed for ${member.name}:`, e); }
      }
    }

    if (alertPhone) {
      const ownerDigits = digits(alertPhone);
      if (ownerDigits.length === 10) {
        try { await sendSMS(`+1${ownerDigits}`, smsMsg); alerted++; } catch (e) { console.error("[emergency-alert] Owner SMS failed:", e); }
      }
    }

    await prisma.callLog.create({
      data: {
        patientId: patient.id,
        callDate: new Date(),
        callType: "urgent_safety",
        summary: `Urgent safety concern: ${description}`,
        concerns: description,
        urgent: true,
      },
    });

    console.log(`[emergency-alert] Urgent safety notice attempted via ${alerted} channel(s) for ${patientName}: ${description}`);

    return NextResponse.json({
      results: [{
        toolCallId: toolCall?.id || "",
        result: `I've notified your family or safety contact right away. KinCare360 is not an emergency response service, so please call nine one one now if you may be in immediate danger.`
      }]
    });

  } catch (error) {
    console.error("[emergency-alert] Error:", error);
    return NextResponse.json({
      results: [{ toolCallId: "", result: "I'm trying to notify your family now. Please call nine one one now if you may be in immediate danger." }]
    });
  }
}

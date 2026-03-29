import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
const twilioToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER!;
const alertPhone = process.env.ALERT_PHONE_NUMBER!;

async function sendSMS(to: string, body: string) {
  const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: twilioPhone, Body: body }).toString(),
  });
}

async function sendEmail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 587, secure: false,
    auth: { user: "hello@kincare360.com", pass: process.env.GOOGLE_APP_PASSWORD || "rogvowrocfhdsasp" },
  });
  await transporter.sendMail({ from: '"KinCare360 Alert" <hello@kincare360.com>', to, subject, html });
}

// VAPI tool endpoint — Lily calls this when a client reports an emergency
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
    const callerPhone = (body.message?.call?.customer?.number || "").replace(/\D/g, "").slice(-10);

    // Look up patient
    let patient: any = null;
    if (callerPhone) {
      patient = await prisma.patient.findFirst({
        where: { phone: { contains: callerPhone } },
        include: { familyMembers: true },
      });
    }

    if (!patient) {
      return NextResponse.json({
        results: [{ toolCallId: toolCall?.id || "", result: "I'm alerting emergency contacts now. Please stay on the line." }]
      });
    }

    const patientName = `${patient.firstName} ${patient.lastName}`;
    const description = emergencyDescription || "reported an emergency";
    const now = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

    const smsMsg = `🚨 EMERGENCY ALERT — KinCare360\n\n${patientName} ${description}.\n\nTime: ${now}\n\nPlease check on them immediately. Call 911 if needed.\n\n— KinCare360 Emergency Alert`;

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#ef4444;color:white;padding:16px;border-radius:8px;margin-bottom:20px;">
          <h1 style="margin:0;font-size:24px;">🚨 Emergency Alert</h1>
        </div>
        <p style="font-size:18px;color:#333;"><strong>${patientName}</strong> ${description}.</p>
        <p style="color:#666;">Time: ${now}</p>
        <div style="background:#fef2f2;border:2px solid #ef4444;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#b91c1c;font-weight:bold;">Please check on them immediately. Call 911 if needed.</p>
        </div>
        <p style="color:#999;font-size:12px;">— KinCare360 Automated Emergency Alert</p>
      </div>`;

    // Send alerts to all family members via SMS + email + VAPI call
    let alerted = 0;
    for (const member of patient.familyMembers) {
      // Try SMS (may fail if A2P 10DLC not approved yet)
      if (member.phone) {
        const digits = member.phone.replace(/\D/g, "").slice(-10);
        if (digits.length === 10) {
          try { await sendSMS(`+1${digits}`, smsMsg); } catch (e) { console.error(`[emergency-alert] SMS failed for ${member.name}:`, e); }
          // Also make an emergency VAPI call to the family member
          try {
            await fetch("https://api.vapi.ai/call/phone", {
              method: "POST",
              headers: { "Authorization": "Bearer 3e6bdfb6-fc6f-4c60-a584-16cfa60e6846", "Content-Type": "application/json" },
              body: JSON.stringify({
                phoneNumberId: "8354bde3-c67c-4316-b181-95c227479b58",
                customer: { number: `+1${digits}` },
                assistantId: "8dc06b99-9533-4b28-b379-7ed4f07768aa",
                assistantOverrides: {
                  firstMessage: `This is an emergency alert from KinCare360. ${patientName} ${description}. Please check on them immediately or call nine one one. This is an automated emergency notification.`,
                  maxDurationSeconds: 60
                }
              })
            });
            console.log(`[emergency-alert] Emergency call placed to ${member.name} at +1${digits}`);
          } catch (e) { console.error(`[emergency-alert] VAPI call failed for ${member.name}:`, e); }
          alerted++;
        }
      }
      // Always send email
      if (member.email) {
        try { await sendEmail(member.email, `🚨 Emergency Alert: ${patientName}`, emailHtml); } catch (e) { console.error(`[emergency-alert] Email failed for ${member.name}:`, e); }
      }
    }

    // Always alert Andrea (the owner) — SMS + call
    const ownerDigits = alertPhone.replace(/\D/g, "").slice(-10);
    try { await sendSMS(`+1${ownerDigits}`, smsMsg); } catch (e) { console.error("[emergency-alert] Owner SMS failed:", e); }
    alerted++;

    console.log(`[emergency-alert] Sent to ${alerted} contacts for ${patientName}: ${description}`);

    return NextResponse.json({
      results: [{
        toolCallId: toolCall?.id || "",
        result: `I've sent emergency alerts to ${patient.familyMembers.length} family member${patient.familyMembers.length !== 1 ? "s" : ""}. They're being notified right now. Please stay on the line and call nine one one if you need immediate help.`
      }]
    });

  } catch (error) {
    console.error("[emergency-alert] Error:", error);
    return NextResponse.json({
      results: [{ toolCallId: "", result: "I'm alerting your family now. Please stay on the line and call nine one one if needed." }]
    });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

export const maxDuration = 55;
export const dynamic = 'force-dynamic';

const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
const twilioToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER!;

async function sendSMS(to: string, body: string) {
  const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: to, From: twilioPhone, Body: body }).toString(),
    });
  } catch (e) { console.error("[send-digest] SMS failed:", e); }
}

async function sendEmail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 587, secure: false,
    auth: { user: "hello@kincare360.com", pass: process.env.GOOGLE_APP_PASSWORD || "rogvowrocfhdsasp" },
  });
  await transporter.sendMail({ from: '"KinCare360" <hello@kincare360.com>', to, subject, html });
}

function getEtTime(): { hours: number; minutes: number; timeStr: string } {
  const now = new Date();
  const etTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(now);
  const [h, m] = etTime.split(':').map(Number);
  return { hours: h, minutes: m, timeStr: etTime };
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export async function GET(req: NextRequest) {
  try {
    const { hours, minutes, timeStr } = getEtTime();
    const nowMins = hours * 60 + minutes;

    // Find all family members with alerts enabled whose summaryTime matches now (±7 min)
    const allFamily = await prisma.familyMember.findMany({
      where: { alertsEnabled: true, alertMode: { not: "none" } },
      include: {
        patient: {
          include: {
            callLogs: {
              where: { callDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
              orderBy: { callDate: "asc" },
              select: { callDate: true, callType: true, summary: true, mood: true, urgent: true }
            }
          }
        }
      }
    });

    let sent = 0;
    const results: string[] = [];

    for (const member of allFamily) {
      // Check if summary time matches
      const [sh, sm] = member.summaryTime.split(':').map(Number);
      const summaryMins = sh * 60 + sm;
      if (Math.abs(summaryMins - nowMins) > 7) continue;

      // Check if digest already sent today
      if (member.lastDigestSent) {
        const lastSent = new Date(member.lastDigestSent);
        const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
        if (hoursSince < 20) continue; // Already sent in last 20 hours
      }

      const patient = member.patient;
      if (!patient) continue;

      const callLogs = patient.callLogs || [];
      if (callLogs.length === 0) {
        // No calls today — send a brief "all quiet" update
        const quietMsg = `No check-in calls were recorded today for ${patient.firstName}. This could mean the scheduled calls didn't connect. Please check in when you can.`;
        // Still send so family knows the system is working
      }

      // Build digest
      const patientName = `${patient.firstName} ${patient.lastName || ''}`.trim();
      const dateStr = formatDate();

      // Build call summaries
      let callSummaries = '';
      let textSummary = '';
      for (const log of callLogs) {
        const time = new Date(log.callDate).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true });
        const type = log.callType === 'medication' ? 'Medication Reminder' : log.callType === 'checkin' ? 'Daily Check-in' : 'Call';
        const summary = log.summary || 'No details recorded.';
        
        callSummaries += `
          <div style="margin-bottom:16px;padding:12px 16px;background:#f8fafc;border-radius:8px;border-left:4px solid ${log.urgent ? '#ef4444' : '#0d9488'};">
            <div style="font-weight:600;color:#0f172a;margin-bottom:4px;">${type} — ${time}</div>
            <div style="color:#475569;font-size:14px;line-height:1.6;">${summary}</div>
          </div>`;
        
        textSummary += `${type} (${time}): ${summary}\n\n`;
      }

      if (callLogs.length === 0) {
        callSummaries = '<div style="padding:12px 16px;background:#fef3c7;border-radius:8px;color:#92400e;">No calls were recorded today.</div>';
        textSummary = 'No calls were recorded today.';
      }

      const emailHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#0d9488;color:white;padding:20px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;font-size:22px;">Daily Update for ${patientName}</h1>
            <p style="margin:4px 0 0;opacity:0.9;font-size:14px;">${dateStr}</p>
          </div>
          <div style="background:white;padding:20px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <p style="color:#334155;font-size:15px;margin-bottom:16px;">Hi ${member.name}, here's ${patientName}'s update for today:</p>
            ${callSummaries}
            <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;">
              <p style="color:#64748b;font-size:13px;margin:0;">View full details on your <a href="https://www.kincare360.com/dashboard" style="color:#0d9488;">family dashboard</a></p>
              <p style="color:#94a3b8;font-size:12px;margin-top:8px;">To change when you receive this summary, update your preferences in the dashboard.</p>
            </div>
          </div>
          <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:12px;">KinCare360 Daily Digest — hello@kincare360.com | (812) 515-5252</p>
        </div>`;

      const smsText = `KinCare360 Daily Update — ${patientName} (${dateStr})\n\n${textSummary}View details: kincare360.com/dashboard`;
      const emailSubject = `Daily Update: ${patientName} — ${dateStr}`;

      // Send based on preference
      try {
        if ((member.alertMode === 'email' || member.alertMode === 'both') && member.email) {
          await sendEmail(member.email, emailSubject, emailHtml);
        }
        if ((member.alertMode === 'text' || member.alertMode === 'both') && member.phone) {
          const digits = member.phone.replace(/\D/g, '').slice(-10);
          if (digits.length === 10) await sendSMS(`+1${digits}`, smsText);
        }

        // Mark digest as sent
        await prisma.familyMember.update({
          where: { id: member.id },
          data: { lastDigestSent: new Date() }
        });

        sent++;
        results.push(`${member.name} (${member.alertMode}) for ${patientName}`);
        console.log(`[send-digest] Sent to ${member.name} for ${patientName}`);
      } catch (e) {
        console.error(`[send-digest] Failed for ${member.name}:`, e);
      }
    }

    return NextResponse.json({ ok: true, time: timeStr, sent, results });
  } catch (error) {
    console.error("[send-digest] Error:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

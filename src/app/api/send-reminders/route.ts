import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const maxDuration = 55;
export const dynamic = 'force-dynamic';

const VAPI_KEY = '3e6bdfb6-fc6f-4c60-a584-16cfa60e6846';
const PHONE_NUMBER_ID = '8354bde3-c67c-4316-b181-95c227479b58'; // (812) 515-5252
const LILY_ASSISTANT_ID = '8dc06b99-9533-4b28-b379-7ed4f07768aa';
const CRON_SECRET = process.env.CRON_SECRET || 'kc360-cron-x9f2m7k4p1';

function getEtTime(): { etTime: string; nowMins: number } {
  const now = new Date();
  const etTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);
  const [nh, nm] = etTime.split(':').map(Number);
  return { etTime, nowMins: nh * 60 + nm };
}

function timeMatches(timeStr: string, nowMins: number): boolean {
  const parts = timeStr.split(':');
  if (parts.length < 2) return false;
  const rh = parseInt(parts[0], 10);
  const rm = parseInt(parts[1], 10);
  if (isNaN(rh) || isNaN(rm)) return false;
  // Exact minute match only - no ±1 slop to prevent duplicate triggers
  return (rh * 60 + rm) === nowMins;
}

async function hasRecentCall(patientId: string, callType: string): Promise<boolean> {
  const recentCall = await prisma.callLog.findFirst({
    where: {
      patientId,
      callDate: { gte: new Date(Date.now() - 30 * 60 * 1000) },
      callType,
    }
  });
  return !!recentCall;
}

async function logCall(patientId: string, callType: string, callId: string): Promise<void> {
  await prisma.callLog.create({
    data: {
      patientId,
      callDate: new Date(),
      callType,
      summary: `Outbound ${callType} call initiated (VAPI call ID: ${callId})`,
    }
  });
}

async function getAssistantConfig(phone: string, callType: string): Promise<any> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.kincare360.com';
  const formattedPhone = phone.replace(/\D/g, '').slice(-10);
  const fullPhone = `+1${formattedPhone}`;

  try {
    const res = await fetch(`${baseUrl}/api/vapi-lookup?callType=${callType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          type: 'assistant-request',
          call: { customer: { number: fullPhone } }
        }
      })
    });
    const data = await res.json();
    return data.assistant || null;
  } catch (e) {
    console.error(`[send-reminders] Failed to get assistant config for ${phone}:`, e);
    return null;
  }
}

async function vapiCheckinCall(phone: string, firstName: string): Promise<string> {
  const rawPhone = phone.replace(/\D/g, '');
  const formattedPhone = rawPhone.length === 10 ? `+1${rawPhone}` : `+${rawPhone}`;

  const assistantConfig = await getAssistantConfig(phone, 'checkin');

  const callBody: any = {
    phoneNumberId: PHONE_NUMBER_ID,
    customer: { number: formattedPhone },
  };

  if (assistantConfig) {
    callBody.assistant = {
      ...assistantConfig,
      firstMessage: `Hi ${firstName}! This is Lily from KinCare360 with your daily check-in. How are you feeling today?`,
      voicemailDetection: {
        provider: "twilio",
        enabled: true,
        machineDetectionTimeout: 8,
        machineDetectionSpeechThreshold: 3000,
        machineDetectionSpeechEndThreshold: 2000,
      },
    };
  } else {
    callBody.assistantId = LILY_ASSISTANT_ID;
    callBody.assistantOverrides = {
      firstMessage: `Hi ${firstName}! This is Lily from KinCare360 with your daily check-in. How are you feeling today?`,
      voicemailDetection: {
        provider: "twilio",
        enabled: true,
        machineDetectionTimeout: 8,
        machineDetectionSpeechThreshold: 3000,
        machineDetectionSpeechEndThreshold: 2000,
      },
    };
  }

  const res = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${VAPI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(callBody)
  });
  const result = await res.json();
  return result.id || result.error || JSON.stringify(result).substring(0, 100);
}

async function vapiMedicationCall(phone: string, firstName: string): Promise<string> {
  const rawPhone = phone.replace(/\D/g, '');
  const formattedPhone = rawPhone.length === 10 ? `+1${rawPhone}` : `+${rawPhone}`;

  const assistantConfig = await getAssistantConfig(phone, 'medication');

  const callBody: any = {
    phoneNumberId: PHONE_NUMBER_ID,
    customer: { number: formattedPhone },
  };

  if (assistantConfig) {
    callBody.assistant = {
      ...assistantConfig,
      firstMessage: `Hi ${firstName}! This is Lily from KinCare360. This is your medication reminder - it's time to take your medications. Have you taken them yet?`,
      voicemailDetection: {
        provider: "twilio",
        enabled: true,
        machineDetectionTimeout: 8,
        machineDetectionSpeechThreshold: 3000,
        machineDetectionSpeechEndThreshold: 2000,
      },
    };
  } else {
    callBody.assistantId = LILY_ASSISTANT_ID;
    callBody.assistantOverrides = {
      firstMessage: `Hi ${firstName}! This is Lily from KinCare360. This is your medication reminder - it's time to take your medications. Have you taken them yet?`,
      voicemailDetection: {
        provider: "twilio",
        enabled: true,
        machineDetectionTimeout: 8,
        machineDetectionSpeechThreshold: 3000,
        machineDetectionSpeechEndThreshold: 2000,
      },
    };
  }

  const res = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${VAPI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(callBody)
  });
  const result = await res.json();
  return result.id || result.error || JSON.stringify(result).substring(0, 100);
}

async function vapiReminderCall(phone: string, firstName: string, message: string): Promise<string> {
  const rawPhone = phone.replace(/\D/g, '');
  const formattedPhone = rawPhone.length === 10 ? `+1${rawPhone}` : `+${rawPhone}`;

  const callBody = {
    phoneNumberId: PHONE_NUMBER_ID,
    customer: { number: formattedPhone },
    assistant: {
      name: "Lily - Reminder",
      voicemailDetection: {
        provider: "twilio",
        enabled: true,
        machineDetectionTimeout: 8,
        machineDetectionSpeechThreshold: 3000,
        machineDetectionSpeechEndThreshold: 2000,
      },
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: `You are Lily from KinCare360 calling ${firstName} with a reminder they requested. The reminder is: "${message}". Call them by name, deliver the reminder warmly, ask if they need anything else, then say goodbye and end the call.`
        }],
      },
      voice: { provider: "11labs", voiceId: "paula" },
      firstMessage: `Hi ${firstName}, this is Lily from KinCare360. You asked me to remind you: ${message}`,
      endCallFunctionEnabled: true,
      serverUrl: "https://www.kincare360.com/api/call-logs",
      backgroundSound: "off",
      backgroundDenoisingEnabled: true,
      backchannelingEnabled: false,
    },
  };

  const res = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${VAPI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(callBody)
  });
  const result = await res.json();
  return result.id || result.error || JSON.stringify(result).substring(0, 100);
}

export async function GET(req: NextRequest) {
  // Auth check - accept CRON_SECRET, Vercel cron header, or query param
  const authHeader = req.headers.get('authorization');
  const vercelCronHeader = req.headers.get('x-vercel-cron');
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('secret');

  if (!vercelCronHeader && querySecret !== CRON_SECRET) {
    const token = authHeader?.replace('Bearer ', '');
    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const { etTime, nowMins } = getEtTime();

    // Fetch all patients with a phone number
    const patients = await prisma.patient.findMany({
      where: { phone: { not: null } },
      select: {
        id: true,
        firstName: true,
        phone: true,
        medicationReminderTime: true,
        preferredCallTime: true,
      }
    });

    const medsSent: string[] = [];
    const checkinSent: string[] = [];
    const remindersSent: string[] = [];
    const skipped: string[] = [];

    for (const patient of patients) {
      if (!patient.phone) continue;

      // --- Medication reminders ---
      if (patient.medicationReminderTime) {
        const times = patient.medicationReminderTime.split(',').map(t => t.trim());
        for (const t of times) {
          if (timeMatches(t, nowMins)) {
            if (await hasRecentCall(patient.id, 'medication')) {
              console.log(`[dedup] Skipping medication reminder for ${patient.firstName} - already called in last 30min`);
              skipped.push(`${patient.firstName}@${t}: dedup-medication`);
              break;
            }
            const callId = await vapiMedicationCall(patient.phone, patient.firstName || 'there');
            if (callId && !callId.includes('Bad Request') && !callId.includes('error')) {
              await logCall(patient.id, 'medication', callId);
            }
            console.log(`[med-reminder] ${patient.firstName} @ ${t} → ${callId}`);
            medsSent.push(`${patient.firstName}@${t}: ${callId}`);
            break;
          }
        }
      }

      // --- Daily check-in ---
      if (medsSent.some(m => m.startsWith(patient.firstName || ''))) {
        console.log(`[stagger] Skipping check-in for ${patient.firstName} - med reminder just sent this tick`);
        skipped.push(`${patient.firstName}@${patient.preferredCallTime}: stagger-wait`);
        continue;
      }
      if (patient.preferredCallTime && timeMatches(patient.preferredCallTime, nowMins)) {
        if (await hasRecentCall(patient.id, 'checkin')) {
          console.log(`[dedup] Skipping check-in for ${patient.firstName} - already called in last 30min`);
          skipped.push(`${patient.firstName}@${patient.preferredCallTime}: dedup-checkin`);
          continue;
        }
        const callId = await vapiCheckinCall(patient.phone, patient.firstName || 'there');
        if (callId && !callId.includes('Bad Request') && !callId.includes('error')) {
          await logCall(patient.id, 'checkin', callId);
        }
        console.log(`[daily-checkin] ${patient.firstName} @ ${patient.preferredCallTime} → ${callId}`);
        checkinSent.push(`${patient.firstName}@${patient.preferredCallTime}: ${callId}`);
      }
    }

    // --- Process pending reminders ---
    const pendingReminders = await prisma.reminder.findMany({
      where: {
        status: 'pending',
        scheduledAt: { lte: new Date() },
      },
      include: {
        patient: { select: { firstName: true, phone: true } },
      },
    });

    for (const reminder of pendingReminders) {
      if (!reminder.patient.phone) {
        await prisma.reminder.update({ where: { id: reminder.id }, data: { status: 'failed' } });
        continue;
      }

      try {
        const callId = await vapiReminderCall(
          reminder.patient.phone,
          reminder.patient.firstName || 'there',
          reminder.message
        );

        if (callId && !callId.includes('Bad Request') && !callId.includes('error')) {
          await logCall(reminder.patientId, 'reminder', callId);
          await prisma.reminder.update({ where: { id: reminder.id }, data: { status: 'sent' } });
          remindersSent.push(`${reminder.patient.firstName}: ${reminder.message} → ${callId}`);
          console.log(`[reminder] ${reminder.patient.firstName}: "${reminder.message}" → ${callId}`);
        } else {
          await prisma.reminder.update({ where: { id: reminder.id }, data: { status: 'failed' } });
          console.error(`[reminder] Failed for ${reminder.patient.firstName}: ${callId}`);
        }
      } catch (e) {
        await prisma.reminder.update({ where: { id: reminder.id }, data: { status: 'failed' } });
        console.error(`[reminder] Error for ${reminder.patient.firstName}:`, e);
      }
    }

    return NextResponse.json({
      ok: true,
      time: etTime,
      medReminders: medsSent.length,
      dailyCheckins: checkinSent.length,
      reminders: remindersSent.length,
      skipped: skipped.length,
      sent: { medReminders: medsSent, dailyCheckins: checkinSent, reminders: remindersSent, skipped }
    });
  } catch (e) {
    console.error('[send-reminders] Error:', e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

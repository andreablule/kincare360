import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const VAPI_KEY = '3e6bdfb6-fc6f-4c60-a584-16cfa60e6846';
const PHONE_NUMBER_ID = '8354bde3-c67c-4316-b181-95c227479b58'; // (812) 515-5252
const LILY_ASSISTANT_ID = '8dc06b99-9533-4b28-b379-7ed4f07768aa';

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
  return Math.abs(rh * 60 + rm - nowMins) <= 1;
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
  // Call our own vapi-lookup to get the full dynamic assistant config with patient context
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
  
  // Get full dynamic assistant config from vapi-lookup (with patient context, tools, etc.)
  const assistantConfig = await getAssistantConfig(phone, 'checkin');
  
  const callBody: any = {
    phoneNumberId: PHONE_NUMBER_ID,
    customer: { number: formattedPhone },
  };
  
  // Add voicemail detection — hang up if voicemail answers
  callBody.phoneCallProvider = 'twilio';
  callBody.transportConfigurations = [{
    provider: 'twilio',
    timeout: 20,
    machineDetection: 'DetectMessageEnd',
    asyncAmd: true,
    asyncAmdStatusCallbackUrl: undefined
  }];

  if (assistantConfig) {
    callBody.assistant = {
      ...assistantConfig,
      firstMessage: `Hi ${firstName}! This is Lily from KinCare360 with your daily check-in. How are you feeling today?`
    };
  } else {
    callBody.assistantId = LILY_ASSISTANT_ID;
    callBody.assistantOverrides = {
      firstMessage: `Hi ${firstName}! This is Lily from KinCare360 with your daily check-in. How are you feeling today?`
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
    phoneCallProvider: 'twilio',
    transportConfigurations: [{
      provider: 'twilio',
      timeout: 20,
      machineDetection: 'DetectMessageEnd',
      asyncAmd: true,
    }]
  };
  
  if (assistantConfig) {
    callBody.assistant = {
      ...assistantConfig,
      firstMessage: `Hi ${firstName}! This is Lily from KinCare360. This is your medication reminder — it's time to take your medications. Have you taken them yet?`
    };
  } else {
    callBody.assistantId = LILY_ASSISTANT_ID;
    callBody.assistantOverrides = {
      firstMessage: `Hi ${firstName}! This is Lily from KinCare360. This is your medication reminder — it's time to take your medications. Have you taken them yet?`
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

export async function GET() {
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
    const skipped: string[] = [];

    for (const patient of patients) {
      if (!patient.phone) continue;

      // --- Medication reminders ---
      if (patient.medicationReminderTime) {
        const times = patient.medicationReminderTime.split(',').map(t => t.trim());
        for (const t of times) {
          if (timeMatches(t, nowMins)) {
            // Dedup: skip if already called in last 30 min
            if (await hasRecentCall(patient.id, 'medication')) {
              console.log(`[dedup] Skipping medication reminder for ${patient.firstName} - already called in last 30min`);
              skipped.push(`${patient.firstName}@${t}: dedup-medication`);
              break;
            }
            const callId = await vapiMedicationCall(patient.phone, patient.firstName || 'there');
            await logCall(patient.id, 'medication', callId);
            console.log(`[med-reminder] ${patient.firstName} @ ${t} → ${callId}`);
            medsSent.push(`${patient.firstName}@${t}: ${callId}`);
            break; // only one call per patient per minute
          }
        }
      }

      // --- Daily check-in ---
      if (patient.preferredCallTime && timeMatches(patient.preferredCallTime, nowMins)) {
        // Dedup: skip if already called in last 30 min
        if (await hasRecentCall(patient.id, 'checkin')) {
          console.log(`[dedup] Skipping check-in for ${patient.firstName} - already called in last 30min`);
          skipped.push(`${patient.firstName}@${patient.preferredCallTime}: dedup-checkin`);
          continue;
        }
        const callId = await vapiCheckinCall(patient.phone, patient.firstName || 'there');
        await logCall(patient.id, 'checkin', callId);
        console.log(`[daily-checkin] ${patient.firstName} @ ${patient.preferredCallTime} → ${callId}`);
        checkinSent.push(`${patient.firstName}@${patient.preferredCallTime}: ${callId}`);
      }
    }

    await prisma.$disconnect();
    return NextResponse.json({
      ok: true,
      time: etTime,
      medReminders: medsSent.length,
      dailyCheckins: checkinSent.length,
      skipped: skipped.length,
      sent: { medReminders: medsSent, dailyCheckins: checkinSent, skipped }
    });
  } catch (e) {
    console.error('[send-reminders] Error:', e);
    await prisma.$disconnect();
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

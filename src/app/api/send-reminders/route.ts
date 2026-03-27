import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const VAPI_KEY = '3e6bdfb6-fc6f-4c60-a584-16cfa60e6846';
const PHONE_NUMBER_ID = '8354bde3-c67c-4316-b181-95c227479b58'; // (812) 515-5252

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
  return Math.abs(rh * 60 + rm - nowMins) <= 5;
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

async function vapiCheckinCall(phone: string): Promise<string> {
  const rawPhone = phone.replace(/\D/g, '');
  const formattedPhone = rawPhone.length === 10 ? `+1${rawPhone}` : `+${rawPhone}`;
  const res = await fetch('https://api.vapi.ai/call', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${VAPI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumberId: PHONE_NUMBER_ID,
      customer: { number: formattedPhone },
      serverUrl: 'https://www.kincare360.com/api/vapi-lookup?callType=checkin',
    })
  });
  const result = await res.json();
  return result.id || result.error || 'unknown';
}

async function vapiMedicationCall(phone: string, firstName: string): Promise<string> {
  const rawPhone = phone.replace(/\D/g, '');
  const formattedPhone = rawPhone.length === 10 ? `+1${rawPhone}` : `+${rawPhone}`;
  const res = await fetch('https://api.vapi.ai/call', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${VAPI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumberId: PHONE_NUMBER_ID,
      customer: { number: formattedPhone },
      serverUrl: 'https://www.kincare360.com/api/vapi-lookup?callType=medication',
    })
  });
  const result = await res.json();
  return result.id || result.error || 'unknown';
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
        const callId = await vapiCheckinCall(patient.phone);
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

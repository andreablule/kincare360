import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const VAPI_KEY = '3e6bdfb6-fc6f-4c60-a584-16cfa60e6846';
const PHONE_NUMBER_ID = '8354bde3-c67c-4316-b181-95c227479b58'; // (812) 515-5252
const DAILY_CHECKIN_ASSISTANT_ID = 'bb32dead-7738-4ec9-9c51-57181465b5f2';

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
  return Math.abs(rh * 60 + rm - nowMins) <= 2;
}

async function vapiCall(phone: string, firstName: string, firstMessage: string): Promise<string> {
  const rawPhone = phone.replace(/\D/g, '');
  const formattedPhone = rawPhone.length === 10 ? `+1${rawPhone}` : `+${rawPhone}`;
  // Use serverUrl so vapi-lookup injects full patient context (address, meds, etc.)
  const res = await fetch('https://api.vapi.ai/call', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${VAPI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumberId: PHONE_NUMBER_ID,
      customer: { number: formattedPhone },
      assistantId: DAILY_CHECKIN_ASSISTANT_ID,
      assistantOverrides: {
        firstMessage,
        serverUrl: 'https://www.kincare360.com/api/vapi-lookup'
      }
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

    for (const patient of patients) {
      if (!patient.phone) continue;

      // --- Medication reminders ---
      if (patient.medicationReminderTime) {
        const times = patient.medicationReminderTime.split(',').map(t => t.trim());
        for (const t of times) {
          if (timeMatches(t, nowMins)) {
            const callId = await vapiCall(
              patient.phone,
              patient.firstName || 'there',
              `Hi ${patient.firstName || 'there'}! This is Lily from KinCare360. This is your medication reminder — it is time to take your medications. Have you taken them yet?`
            );
            console.log(`[med-reminder] ${patient.firstName} @ ${t} → ${callId}`);
            medsSent.push(`${patient.firstName}@${t}: ${callId}`);
            break; // only one call per patient per minute
          }
        }
      }

      // --- Daily check-in ---
      if (patient.preferredCallTime && timeMatches(patient.preferredCallTime, nowMins)) {
        const callId = await vapiCall(
          patient.phone,
          patient.firstName || 'there',
          `Hi ${patient.firstName || 'there'}! This is Lily from KinCare360 with your daily check-in. How are you feeling today?`
        );
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
      sent: { medReminders: medsSent, dailyCheckins: checkinSent }
    });
  } catch (e) {
    console.error('[send-reminders] Error:', e);
    await prisma.$disconnect();
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

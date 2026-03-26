import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const VAPI_KEY = '3e6bdfb6-fc6f-4c60-a584-16cfa60e6846';
const PHONE_NUMBER_ID = '8354bde3-c67c-4316-b181-95c227479b58'; // (812) 515-5252
const DAILY_CHECKIN_ASSISTANT_ID = 'bb32dead-7738-4ec9-9c51-57181465b5f2';

export async function GET() {
  try {
    // Get current ET time as HH:MM
    const now = new Date();
    const etFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const etTime = etFormatter.format(now);
    const [nh, nm] = etTime.split(':').map(Number);
    const nowMins = nh * 60 + nm;

    // Find all patients with medication reminders and a phone number
    const patients = await prisma.patient.findMany({
      where: {
        medicationReminderTime: { not: null },
        phone: { not: null }
      },
      select: {
        id: true,
        firstName: true,
        phone: true,
        medicationReminderTime: true
      }
    });

    const sent: string[] = [];

    for (const patient of patients) {
      if (!patient.phone || !patient.medicationReminderTime) continue;

      const times = patient.medicationReminderTime.split(',').map(t => t.trim());
      const shouldCall = times.some(t => {
        const parts = t.split(':');
        if (parts.length < 2) return false;
        const rh = parseInt(parts[0], 10);
        const rm = parseInt(parts[1], 10);
        if (isNaN(rh) || isNaN(rm)) return false;
        const reminderMins = rh * 60 + rm;
        return Math.abs(reminderMins - nowMins) <= 2;
      });

      if (!shouldCall) continue;

      const rawPhone = patient.phone.replace(/\D/g, '');
      const formattedPhone = rawPhone.length === 10 ? `+1${rawPhone}` : `+${rawPhone}`;

      try {
        const res = await fetch('https://api.vapi.ai/call', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${VAPI_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phoneNumberId: PHONE_NUMBER_ID,
            customer: { number: formattedPhone },
            assistantId: DAILY_CHECKIN_ASSISTANT_ID,
            assistantOverrides: {
              firstMessage: `Hi ${patient.firstName}! This is Lily from KinCare360. This is your medication reminder — it is time to take your medications. Have you taken them yet?`
            }
          })
        });

        const result = await res.json();
        const callId = result.id || result.error || 'unknown';
        console.log(`[send-reminders] Reminder sent to ${patient.firstName} (${formattedPhone}) — call ID: ${callId}`);
        sent.push(`${patient.firstName}: ${callId}`);
      } catch (e) {
        console.error(`[send-reminders] Failed to call ${patient.firstName}:`, e);
      }
    }

    await prisma.$disconnect();
    return NextResponse.json({ ok: true, time: etTime, remindersSent: sent.length, sent });
  } catch (e) {
    console.error('[send-reminders] Error:', e);
    await prisma.$disconnect();
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
const twilioToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER!;

async function sendSMS(to: string, body: string) {
  const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
  const params = new URLSearchParams({ To: to, From: twilioPhone, Body: body });
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
}

// GET: Called daily by cron — checks which medications are due for refill in next 3 days
export async function GET() {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find all medications with refill tracking enabled
    const medications = await prisma.medication.findMany({
      where: {
        lastRefillDate: { not: null },
        refillIntervalDays: { not: null, gt: 0 },
      },
      include: {
        patient: {
          include: {
            familyMembers: { where: { notifyUpdates: true } },
            user: { select: { plan: true } },
          },
        },
      },
    });

    let remindersent = 0;

    for (const med of medications) {
      if (!med.lastRefillDate || !med.refillIntervalDays) continue;

      const nextRefillDate = new Date(med.lastRefillDate.getTime() + med.refillIntervalDays * 24 * 60 * 60 * 1000);
      
      // If refill is due within 3 days
      if (nextRefillDate <= threeDaysFromNow && nextRefillDate >= now) {
        const daysUntil = Math.ceil((nextRefillDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        const patientName = `${med.patient.firstName} ${med.patient.lastName}`;
        const pharmacyInfo = med.pharmacyName ? ` at ${med.pharmacyName}${med.pharmacyPhone ? ` (${med.pharmacyPhone})` : ''}` : '';
        
        // SMS to patient
        if (med.patient.phone) {
          const patientMsg = `💊 KinCare360 Reminder: Your ${med.name} (${med.dosage || ''}) prescription is due for refill in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}${pharmacyInfo}. Please contact your pharmacy to arrange your refill.`;
          await sendSMS(`+1${med.patient.phone.replace(/\D/g, '').slice(-10)}`, patientMsg);
        }

        // SMS to family members
        for (const member of med.patient.familyMembers) {
          if (member.phone) {
            const familyMsg = `💊 KinCare360: ${patientName}'s ${med.name} prescription is due for refill in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}${pharmacyInfo}. Please help ensure the refill is arranged.`;
            await sendSMS(`+1${member.phone.replace(/\D/g, '').slice(-10)}`, familyMsg);
          }
        }

        remindersent++;
      }
    }

    return NextResponse.json({ success: true, remindersChecked: medications.length, remindersSent: remindersent });
  } catch (err) {
    console.error('Refill check error:', err);
    return NextResponse.json({ success: false, error: 'Refill check failed' }, { status: 500 });
  }
}

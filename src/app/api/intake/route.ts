import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const ANDREA_PHONE = process.env.ANDREA_PHONE!;
const MESSAGING_SERVICE_SID = 'MG56c166fc03122880a51c65cb455696f1';

async function sendSMS(to: string, body: string) {
  const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, MessagingServiceSid: MESSAGING_SERVICE_SID, Body: body }).toString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const data = await req.json();

    // Parse patient name into first/last
    const nameParts = (data.patientName || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Upsert patient — update existing record if one already exists (from registration), otherwise create
    const existingPatient = await prisma.patient.findFirst({ where: { userId } });

    const patientData = {
      userId,
      firstName,
      lastName,
      dob: data.dob || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      preferredCallTime: data.checkInTime || null,
      medicationReminderTime: data.medicationReminders?.[0]?.time || null,
      checkInDays: Array.isArray(data.checkInDays) ? data.checkInDays.join(',') : data.checkInDays || null,
      insuranceCompany: data.insurances?.[0]?.company || null,
      insuranceMemberId: data.insurances?.[0]?.memberId || null,
      insuranceGroupNumber: data.insurances?.[0]?.groupNumber || null,
      insurancePolicyHolder: data.insurances?.[0]?.policyHolder || null,
    };

    let patient;
    if (existingPatient) {
      patient = await prisma.patient.update({
        where: { id: existingPatient.id },
        data: patientData,
      });
    } else {
      patient = await prisma.patient.create({ data: patientData });
    }

    // Create doctor if provided
    if (data.primaryDoctor) {
      await prisma.doctor.create({
        data: {
          patientId: patient.id,
          name: data.primaryDoctor,
          phone: data.doctorPhone || null,
          address: data.doctorAddress || null,
        },
      });
    }

    // Create pharmacy if provided
    if (data.pharmacy) {
      await prisma.pharmacy.create({
        data: {
          patientId: patient.id,
          name: data.pharmacy,
          phone: data.pharmacyPhone || null,
          address: data.pharmacyAddress || null,
        },
      });
    }

    // Create medications if provided (comma-separated text)
    if (data.medications) {
      const meds = data.medications.split(',').map((m: string) => m.trim()).filter(Boolean);
      for (const med of meds) {
        await prisma.medication.create({
          data: { patientId: patient.id, name: med },
        });
      }
    }

    // Create conditions if provided
    if (data.conditions) {
      const conds = data.conditions.split(',').map((c: string) => c.trim()).filter(Boolean);
      for (const cond of conds) {
        await prisma.condition.create({
          data: { patientId: patient.id, name: cond },
        });
      }
    }

    // Create family members
    if (Array.isArray(data.familyContacts)) {
      for (const contact of data.familyContacts) {
        if (contact.name) {
          await prisma.familyMember.create({
            data: {
              patientId: patient.id,
              name: contact.name,
              relationship: contact.relation || null,
              phone: contact.phone || null,
              email: contact.email || null,
              notifyUpdates: true,
            },
          });
        }
      }
    }

    // Send SMS alert to Andrea with new client info
    const alert = `🎉 NEW CLIENT INTAKE!\n👤 ${data.patientName} (DOB: ${data.dob})\n📱 ${data.phone}\n🏠 ${data.address}, ${data.city} ${data.state}\n👨‍⚕️ Dr: ${data.primaryDoctor || 'N/A'}\n💊 Pharmacy: ${data.pharmacy || 'N/A'}\n👨‍👩‍👧 Family: ${data.familyContacts?.[0]?.name || 'N/A'} (${data.familyContacts?.[0]?.relation || 'N/A'}) ${data.familyContacts?.[0]?.phone || ''}\n✅ Services: ${data.services?.join(', ') || 'None selected'}`;

    await sendSMS(ANDREA_PHONE, alert);

    console.log('NEW INTAKE:', JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, patientId: patient.id });
  } catch (err) {
    console.error('Intake error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

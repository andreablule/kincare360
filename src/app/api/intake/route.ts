import { NextRequest, NextResponse } from 'next/server';

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
    const data = await req.json();

    // Send SMS alert to Andrea with new client info
    const alert = `🎉 NEW CLIENT INTAKE!\n👤 ${data.patientName} (DOB: ${data.dob})\n📱 ${data.phone}\n🏠 ${data.address}, ${data.city} ${data.state}\n👨‍⚕️ Dr: ${data.primaryDoctor || 'N/A'}\n💊 Pharmacy: ${data.pharmacy || 'N/A'}\n👨‍👩‍👧 Family: ${data.familyName} (${data.familyRelation}) ${data.familyPhone}\n✅ Services: ${data.services.join(', ') || 'None selected'}`;

    await sendSMS(ANDREA_PHONE, alert);

    // Log the intake data
    console.log('NEW INTAKE:', JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Intake error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

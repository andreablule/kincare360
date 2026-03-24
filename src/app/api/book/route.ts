import { NextRequest, NextResponse } from 'next/server';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER!;
const ANDREA_PHONE = process.env.ANDREA_PHONE!;

async function sendSMS(to: string, body: string) {
  const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
  const params = new URLSearchParams({ To: to, From: FROM_NUMBER, Body: body });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, date, time, service, message } = await req.json();

    if (!name || !phone || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Format phone
    const cleanPhone = phone.replace(/\D/g, '');
    const e164Phone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;

    // SMS to client
    const clientMsg = `Hi ${name}! Your KinCare360 appointment is confirmed for ${date} at ${time}. Service: ${service || 'Care Consultation'}. Questions? Call/text (812) 515-5252. - KinCare360 Team`;
    await sendSMS(e164Phone, clientMsg);

    // SMS alert to Andrea
    const andreaMsg = `🔔 NEW BOOKING!\nName: ${name}\nPhone: ${phone}\nEmail: ${email || 'N/A'}\nDate: ${date}\nTime: ${time}\nService: ${service || 'Care Consultation'}\nNotes: ${message || 'None'}`;
    await sendSMS(ANDREA_PHONE, andreaMsg);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Booking error:', err);
    return NextResponse.json({ error: 'Failed to process booking' }, { status: 500 });
  }
}

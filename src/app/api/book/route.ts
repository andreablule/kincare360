import { NextRequest, NextResponse } from 'next/server';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER!;
const ANDREA_PHONE = process.env.ANDREA_PHONE!;
const MESSAGING_SERVICE_SID = 'MG56c166fc03122880a51c65cb455696f1';

async function sendSMS(to: string, body: string) {
  const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
  const params = new URLSearchParams({
    To: to,
    MessagingServiceSid: MESSAGING_SERVICE_SID,
    Body: body,
  });

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

async function sendWhatsApp(to: string, body: string) {
  const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
  // WhatsApp format
  const cleanTo = to.replace(/\D/g, '');
  const waTo = `whatsapp:+1${cleanTo.replace(/^1/, '')}`;
  const params = new URLSearchParams({
    To: waTo,
    From: `whatsapp:${FROM_NUMBER}`,
    Body: body,
  });

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

async function sendEmail(to: string, subject: string, text: string) {
  // Send via Gmail SMTP using nodemailer as fallback
  // For now log — will add nodemailer in next deploy
  console.log(`Email fallback: To: ${to} | Subject: ${subject}`);
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

    // Client confirmation message
    const clientMsg = `Hi ${name}! ✅ Your KinCare360 appointment is confirmed!\n\n📅 ${date} at ${time}\n💼 ${service || 'Care Consultation'}\n\nQuestions? Call/text (812) 515-5252\n- KinCare360 Team`;

    // Andrea alert message
    const andreaMsg = `🔔 NEW BOOKING!\n👤 ${name}\n📱 ${phone}\n📧 ${email || 'N/A'}\n📅 ${date} at ${time}\n💼 ${service || 'Care Consultation'}\n📝 ${message || 'No notes'}`;

    // Send SMS (with messaging service for better deliverability)
    const [clientSMS, andreaSMS] = await Promise.all([
      sendSMS(e164Phone, clientMsg),
      sendSMS(ANDREA_PHONE, andreaMsg),
    ]);

    console.log('Client SMS:', clientSMS.status, clientSMS.error_code || 'ok');
    console.log('Andrea SMS:', andreaSMS.status, andreaSMS.error_code || 'ok');

    // Log booking to console for visibility
    console.log(`BOOKING: ${name} | ${phone} | ${date} ${time} | ${service}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Booking error:', err);
    return NextResponse.json({ error: 'Failed to process booking' }, { status: 500 });
  }
}

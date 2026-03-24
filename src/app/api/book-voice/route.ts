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
    const { name, phone, preferredDate, preferredTime, serviceInterest } = await req.json();

    // Alert Andrea
    await sendSMS(ANDREA_PHONE,
      `📞 VOICE BOOKING via Lily!\n👤 ${name}\n📱 ${phone}\n📅 ${preferredDate || 'Flexible'} at ${preferredTime || 'Flexible'}\n💼 Interest: ${serviceInterest || 'General inquiry'}\n\nCall them back to confirm!`
    );

    console.log('Voice booking:', { name, phone, preferredDate, preferredTime, serviceInterest });

    return NextResponse.json({
      result: `Perfect! I've noted your appointment request for ${preferredDate || 'your preferred date'} at ${preferredTime || 'your preferred time'}. Our team will send you a confirmation text shortly. Is there anything else I can help you with?`
    });
  } catch (err) {
    return NextResponse.json({ result: 'I\'ve noted your request. Our team will follow up with you shortly to confirm your appointment.' });
  }
}

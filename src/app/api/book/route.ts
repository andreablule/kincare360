import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/sms';

const ANDREA_PHONE = process.env.ANDREA_PHONE!;

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

    console.log('Client SMS:', clientSMS.ok ? 'ok' : 'not_sent');
    console.log('Andrea SMS:', andreaSMS.ok ? 'ok' : 'not_sent');

    // Log booking to console for visibility
    console.log(`BOOKING: ${name} | ${phone} | ${date} ${time} | ${service}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Booking error:', err);
    return NextResponse.json({ error: 'Failed to process booking' }, { status: 500 });
  }
}

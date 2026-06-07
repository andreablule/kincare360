import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/sms';

const ANDREA_PHONE = process.env.ANDREA_PHONE;

export async function POST(req: NextRequest) {
  try {
    const { name, phone, preferredDate, preferredTime, serviceInterest } = await req.json();

    if (ANDREA_PHONE) {
      await sendSMS(
        ANDREA_PHONE,
        `📞 VOICE BOOKING via Lily!\n👤 ${name}\n📱 ${phone}\n📅 ${preferredDate || 'Flexible'} at ${preferredTime || 'Flexible'}\n💼 Interest: ${serviceInterest || 'General inquiry'}\n\nCall them back to confirm!`
      );
    } else {
      console.warn('[book-voice] Andrea alert skipped; missing ANDREA_PHONE.');
    }

    console.log('Voice booking:', { name, phone, preferredDate, preferredTime, serviceInterest });

    return NextResponse.json({
      result: `Perfect! I've noted your appointment request for ${preferredDate || 'your preferred date'} at ${preferredTime || 'your preferred time'}. Our team will send you a confirmation text shortly. Is there anything else I can help you with?`
    });
  } catch (err) {
    return NextResponse.json({ result: 'I\'ve noted your request. Our team will follow up with you shortly to confirm your appointment.' });
  }
}

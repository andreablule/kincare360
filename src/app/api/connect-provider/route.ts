import { NextRequest, NextResponse } from 'next/server';

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || '+18125155252';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract toolCallId for VAPI response format
    const toolCall = body.message?.toolCallList?.[0];
    const toolCallId = toolCall?.id || '';

    // Parse arguments
    let args: any = {};
    if (toolCall?.function?.arguments) {
      args = typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else if (body.message?.functionCall?.parameters) {
      args = body.message.functionCall.parameters;
    } else {
      args = body;
    }

    const providerPhone: string = args.providerPhone || args.phone || '';
    const providerName: string = args.providerName || args.name || 'the provider';

    if (!providerPhone) {
      return NextResponse.json({
        results: [{ toolCallId, result: `I don't have a phone number for ${providerName}. Would you like me to find a different option?` }]
      });
    }

    // Normalize phone
    const digits = providerPhone.replace(/\D/g, '');
    const toPhone = digits.length === 10 ? `+1${digits}` : digits.length === 11 ? `+${digits}` : providerPhone;

    // Call the provider via Twilio
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Hello, this is Lily calling from KinCare360 on behalf of one of our clients. Please hold for one moment while I connect you.</Say><Pause length="1"/></Response>`;

    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
    const twilioBody = new URLSearchParams({ To: toPhone, From: TWILIO_PHONE, Twiml: twiml });

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls.json`,
      {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: twilioBody.toString(),
      }
    );

    const twilioData = await twilioRes.json();

    if (twilioData.sid) {
      return NextResponse.json({
        results: [{
          toolCallId,
          result: `I'm calling ${providerName} right now at ${providerPhone}. I've connected the call — you should be hearing them shortly. If they don't answer or you need another option, just let me know!`
        }]
      });
    } else {
      console.error('Twilio error:', twilioData);
      return NextResponse.json({
        results: [{
          toolCallId,
          result: `I wasn't able to connect automatically. The number for ${providerName} is ${providerPhone} — you can call them directly at that number. Would you like me to find another option?`
        }]
      });
    }
  } catch (err) {
    console.error('Connect provider error:', err);
    return NextResponse.json({
      results: [{ toolCallId: '', result: 'I had a brief issue connecting the call. Would you like me to give you the phone number to call directly?' }]
    });
  }
}

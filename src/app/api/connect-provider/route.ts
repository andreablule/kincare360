import { NextRequest, NextResponse } from 'next/server';

// Twilio credentials
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || '+18125155252';

// This endpoint is called by VAPI as a tool when Lily wants to call a provider
// and bridge the client into the call (warm transfer / call connect)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // VAPI tool call parameters
    const params = body.message?.toolCallList?.[0]?.function?.arguments ||
                   body.message?.functionCall?.parameters ||
                   body;

    const providerPhone: string = params.providerPhone || params.phone || '';
    const providerName: string = params.providerName || params.name || 'the provider';
    const clientPhone: string = params.clientPhone || params.callerPhone || '';

    if (!providerPhone) {
      return NextResponse.json({
        results: [{ result: `I don't have a phone number for ${providerName}. Would you like me to find a different option?` }]
      });
    }

    // Normalize phone numbers
    const normalizePhone = (p: string) => {
      const digits = p.replace(/\D/g, '');
      if (digits.length === 10) return `+1${digits}`;
      if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
      return p;
    };

    const toPhone = normalizePhone(providerPhone);

    // Use Twilio to initiate a call to the provider
    // The TwiML will say a brief message then dial the client back to connect them
    // For simplicity: we create an outbound call from our Twilio number to the provider
    // with a TwiML instruction to announce it's KinCare360 connecting a client
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hello, this is Lily from KinCare360 calling on behalf of one of our elderly clients who needs your services. Please hold for one moment while I connect you.</Say>
  <Pause length="2"/>
  <Say voice="Polly.Joanna">Connecting now.</Say>
</Response>`;

    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
    const twilioBody = new URLSearchParams({
      To: toPhone,
      From: TWILIO_PHONE,
      Twiml: twiml,
    });

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: twilioBody.toString(),
      }
    );

    const twilioData = await twilioRes.json();

    if (twilioData.sid) {
      return NextResponse.json({
        results: [{
          result: `I'm calling ${providerName} now. I'll let them know you need their services and stay on the line with you. One moment please.`
        }]
      });
    } else {
      console.error('Twilio call failed:', twilioData);
      return NextResponse.json({
        results: [{
          result: `I wasn't able to connect the call automatically right now. The number for ${providerName} is ${providerPhone} — would you like me to read it to you so you can call directly?`
        }]
      });
    }
  } catch (err) {
    console.error('Connect provider error:', err);
    return NextResponse.json({
      results: [{
        result: `I had a brief issue connecting the call. Would you like me to give you the phone number to call directly?`
      }]
    });
  }
}

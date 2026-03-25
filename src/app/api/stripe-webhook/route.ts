import { NextRequest, NextResponse } from 'next/server';

const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
const twilioToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER!;
const alertPhone = process.env.ALERT_PHONE_NUMBER || process.env.ANDREA_PHONE || '+12674996927';

async function sendSMS(to: string, body: string) {
  const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
  const params = new URLSearchParams({ To: to, From: twilioPhone, Body: body });
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('SMS error:', e);
  }
}

async function sendEmail(to: string, subject: string, body: string) {
  // Send via Google Workspace SMTP using app password
  const nodemailerAvailable = false; // Would need nodemailer installed
  // For now, use a simple approach via the Gmail API or skip
  // TODO: Wire up email sending via Google Workspace
  console.log(`Email would send to ${to}: ${subject}`);
}

// This endpoint handles Stripe checkout completion
// Called from the success page to trigger confirmations
export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'No session ID' }, { status: 400 });
    }

    // Get checkout session details from Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY!;
    const auth = Buffer.from(`${stripeKey}:`).toString('base64');
    
    const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=customer&expand[]=subscription`, {
      headers: { 'Authorization': `Basic ${auth}` },
    });
    const session = await sessionRes.json();

    if (!session || session.error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    const customerEmail = session.customer_details?.email || session.customer?.email || '';
    const customerName = session.customer_details?.name || session.customer?.name || 'there';
    const customerPhone = session.customer_details?.phone || '';
    const planAmount = session.amount_total ? `$${session.amount_total / 100}` : '';
    const trialEnd = session.subscription?.trial_end ? new Date(session.subscription.trial_end * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '7 days from now';

    // SMS to Andrea (business alert)
    await sendSMS(
      `+1${alertPhone.replace(/\\D/g, '').slice(-10)}`,
      `🎉 NEW KINCARE360 SIGNUP!\n\nName: ${customerName}\nEmail: ${customerEmail}\nPhone: ${customerPhone || 'Not provided'}\nPlan: ${planAmount}/mo\nTrial ends: ${trialEnd}\n\nLily will begin daily check-ins automatically.`
    );

    // SMS to client (if phone available from intake data)
    // Note: A2P 10DLC still pending, SMS may not deliver to non-verified numbers
    if (customerPhone) {
      const digits = customerPhone.replace(/\D/g, '').slice(-10);
      if (digits.length === 10) {
        await sendSMS(
          `+1${digits}`,
          `Welcome to KinCare360, ${customerName}! 🎉\n\nYour 7-day free trial has started. Lily will begin your daily check-in calls at your preferred time.\n\nTrial ends: ${trialEnd}\nManage your plan: kincare360.com/login\nQuestions? Call (812) 515-5252\n\n— Lily, KinCare360`
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      customer: { name: customerName, email: customerEmail },
      trialEnd 
    });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

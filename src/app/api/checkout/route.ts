import { NextRequest, NextResponse } from 'next/server';

const SK = process.env.STRIPE_SECRET_KEY!;

async function stripeAPI(path: string, body: Record<string, string>) {
  const auth = Buffer.from(`${SK}:`).toString('base64');
  const res = await fetch(`https://api.stripe.com${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { priceId, email } = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://kincare360.com';

    const params: Record<string, string> = {
      'mode': 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'subscription_data[trial_period_days]': '7',
      'success_url': `${baseUrl}/intake?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${baseUrl}/#pricing`,
      'allow_promotion_codes': 'true',
      'billing_address_collection': 'auto',
      'payment_method_types[0]': 'card',
    };

    // Only add email if provided
    if (email && email.trim()) {
      params['customer_email'] = email.trim();
    }

    const session = await stripeAPI('/v1/checkout/sessions', params);

    if (session.url) {
      return NextResponse.json({ url: session.url });
    } else {
      console.error('Stripe error:', session.error);
      return NextResponse.json({ error: session.error?.message || 'Failed to create session' }, { status: 500 });
    }
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

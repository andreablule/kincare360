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
    const { priceId, email, name } = await req.json();

    const session = await stripeAPI('/v1/checkout/sessions', {
      'mode': 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'subscription_data[trial_period_days]': '7',
      'success_url': `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${process.env.NEXT_PUBLIC_URL}/#pricing`,
      'customer_email': email || '',
      'allow_promotion_codes': 'true',
      'billing_address_collection': 'auto',
      'payment_method_types[0]': 'card',
    });

    if (session.url) {
      return NextResponse.json({ url: session.url });
    } else {
      return NextResponse.json({ error: session.error?.message || 'Failed to create session' }, { status: 500 });
    }
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

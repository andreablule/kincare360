import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const SK = process.env.STRIPE_SECRET_KEY!;

// Hardcoded price IDs — these are the live Stripe prices
const PRICE_MAP: Record<string, string> = {
  starter: 'price_1TEPOcJlUr03cRD7vm4xB09U',     // $99/mo
  essential: 'price_1TEPOcJlUr03cRD7ypzyYYif',    // $199/mo
  premium: 'price_1TEPOcJlUr03cRD7tVv6DDjY',      // $299/mo
};

// Map price IDs back to plan names for DB storage
const PLAN_NAME_MAP: Record<string, string> = {
  starter: 'BASIC',
  essential: 'STANDARD',
  premium: 'PREMIUM',
};

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
    const { plan, priceId, email } = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://kincare360.com';

    // Resolve price ID from plan name or direct priceId
    const resolvedPriceId = plan ? PRICE_MAP[plan] : priceId;

    if (!resolvedPriceId) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Get userId from session if available
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || '';
    const planName = plan ? (PLAN_NAME_MAP[plan] || plan.toUpperCase()) : '';

    const params: Record<string, string> = {
      'mode': 'subscription',
      'line_items[0][price]': resolvedPriceId,
      'line_items[0][quantity]': '1',
      'subscription_data[trial_period_days]': '7',
      'success_url': `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${baseUrl}/intake`,
      'allow_promotion_codes': 'true',
      'billing_address_collection': 'auto',
      'payment_method_types[0]': 'card',
      'metadata[userId]': userId,
      'metadata[plan]': planName,
    };

    if (email && email.trim()) {
      params['customer_email'] = email.trim();
    }

    const stripeSession = await stripeAPI('/v1/checkout/sessions', params);

    if (stripeSession.url) {
      return NextResponse.json({ url: stripeSession.url });
    } else {
      console.error('Stripe error:', stripeSession.error);
      return NextResponse.json({ error: stripeSession.error?.message || 'Failed to create checkout session' }, { status: 500 });
    }
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

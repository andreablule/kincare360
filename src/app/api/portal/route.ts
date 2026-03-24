import { NextRequest, NextResponse } from 'next/server';

const SK = process.env.STRIPE_SECRET_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json();
    const auth = Buffer.from(`${SK}:`).toString('base64');

    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_URL}/`,
        configuration: 'bpc_1TEP5eJlUr03cRD7dBeLERXL', // test mode
      }).toString(),
    });
    const session = await res.json();

    if (session.url) {
      return NextResponse.json({ url: session.url });
    } else {
      return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

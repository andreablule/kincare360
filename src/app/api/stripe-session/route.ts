import { NextRequest, NextResponse } from 'next/server';

const SK = process.env.STRIPE_SECRET_KEY!;

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const auth = Buffer.from(`${SK}:`).toString('base64');
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { 'Authorization': `Basic ${auth}` },
    });
    const session = await res.json();

    // Map price to plan name
    let plan = null;
    if (session.line_items || session.subscription) {
      // Simple mapping based on amount
      const amount = session.amount_total;
      if (amount <= 5000) plan = 'ESSENTIAL';
      else if (amount <= 7500) plan = 'ESSENTIAL_FAMILY';
      else if (amount <= 8000) plan = 'PLUS';
      else if (amount <= 11000) plan = 'CONCIERGE';
      else if (amount <= 13000) plan = 'PLUS_FAMILY';
      else plan = 'CONCIERGE_FAMILY';
    }

    return NextResponse.json({
      customerId: session.customer,
      email: session.customer_details?.email || session.customer_email,
      plan,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { serviceType, city } = await req.json();
    const location = city || 'Philadelphia PA';

    // Use Google Places API if key available, otherwise return helpful response
    const searchQuery = `${serviceType} near ${location}`;

    // For now return a structured response Lily can use
    // In production, wire up Google Places API here
    return NextResponse.json({
      result: `I can help find a ${serviceType} near ${location}. I recommend searching on Google for "${searchQuery}" or calling 211 for local service referrals. Would you like me to connect you to our care coordinator who can help find a trusted provider?`,
      providers: [],
    });
  } catch (err) {
    return NextResponse.json({ result: 'I was unable to search for providers right now. Let me connect you to our care coordinator for assistance.' });
  }
}

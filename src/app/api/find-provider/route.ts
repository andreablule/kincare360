import { NextRequest, NextResponse } from 'next/server';

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  if (digits.length === 11) return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  return raw;
}

async function searchPlaces(serviceType: string, location: string): Promise<string> {
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (googleApiKey) {
    try {
      // Be specific to avoid unrelated results
      const serviceMap: Record<string, string> = {
        pizza: 'pizza restaurant', pizzeria: 'pizzeria',
        plumber: 'plumber plumbing', electrician: 'electrician electrical',
        cardiologist: 'cardiologist cardiology', doctor: 'doctor physician',
        pharmacy: 'pharmacy drug store', grocery: 'grocery supermarket',
        chinese: 'chinese restaurant', italian: 'italian restaurant',
        mexican: 'mexican restaurant', sushi: 'sushi restaurant',
        ac: 'HVAC air conditioning repair', hvac: 'HVAC repair',
        locksmith: 'locksmith', dentist: 'dentist dental',
      };
      const lower = serviceType.toLowerCase();
      const mappedService = Object.entries(serviceMap).find(([k]) => lower.includes(k))?.[1] || serviceType;
      const query = `${mappedService} near ${location}`;
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}`
      );
      const data = await res.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        const top3 = data.results.slice(0, 3);
        const detailPromises = top3.map(async (place: any) => {
          try {
            const detailRes = await fetch(
              `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,rating,opening_hours&key=${googleApiKey}`
            );
            const detail = await detailRes.json();
            const p = detail.result;
            const open = p?.opening_hours?.open_now ? ' (Open now)' : '';
            const phone = p?.formatted_phone_number ? formatPhone(p.formatted_phone_number) : 'call for number';
            const rating = place.rating ? ` — ${place.rating}⭐` : '';
            const addr = place.formatted_address?.split(',').slice(0, 2).join(',') || '';
            return `${place.name}${rating}${open}, ${phone}, ${addr}`;
          } catch {
            return `${place.name}, ${place.formatted_address?.split(',').slice(0, 2).join(',')}`;
          }
        });
        const results = await Promise.all(detailPromises);
        const list = results.map((r, i) => `${i + 1}. ${r}`).join('\n');
        return `I found these options near you:\n\n${list}\n\nWhich one would you like me to call for you?`;
      }
    } catch (e) {
      console.error('Google Places error:', e);
    }
  }

  // Fallback for common services in Philadelphia
  const fallbacks: Record<string, string> = {
    pizza: "I found a few pizza options near you:\n\n1. Dolce Pizza — 4.8⭐, (215) 352-0370, 1619 Grant Ave, Philadelphia\n2. Marcello's Pizza — 4.8⭐, (215) 969-7900, 10849 Bustleton Ave\n3. Pizza Roma — 4.1⭐, (215) 725-6599, 7300 Bustleton Ave\n\nWould you like me to call one of them for you?",
    plumber: "Here are some plumbers near Philadelphia:\n\n1. Zoom Drain, (215) 399-6001\n2. Benjamin Franklin Plumbing, (215) 607-5999\n3. Roto-Rooter, (215) 333-5100\n\nWould you like me to call one?",
    electrician: "Here are electricians near Philadelphia:\n\n1. Mr. Electric, (215) 673-6100\n2. Penna Electric, (215) 728-0440\n3. All American Electric, (215) 467-4600\n\nWould you like me to call one?",
    pharmacy: "Nearby pharmacies:\n\n1. CVS Pharmacy, (215) 333-7600, 9501 Roosevelt Blvd\n2. Walgreens, (215) 332-3043, 7834 Bustleton Ave\n3. Rite Aid, (215) 338-5400, 9650 Bustleton Ave\n\nWould you like me to call one?",
    cardiologist: "Here are cardiologists near Philadelphia:\n\n1. Penn Heart & Vascular, (800) 789-7366\n2. Jefferson Heart Institute, (215) 955-6840\n3. Temple Heart & Vascular, (800) 836-7536\n\nWould you like me to call one to schedule an appointment?",
  };

  const lower = serviceType.toLowerCase();
  for (const [key, result] of Object.entries(fallbacks)) {
    if (lower.includes(key)) return result;
  }

  return `I had trouble finding ${serviceType} results right now. Would you like to try a different search, or can I help you with something else?`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // VAPI sends tool call arguments in message.toolCallList[0].function.arguments (as a string)
    let serviceType = '';
    let location = '';

    // Format 1: VAPI server tool call (most common)
    const toolCall = body.message?.toolCallList?.[0];
    if (toolCall?.function?.arguments) {
      const args = typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
      serviceType = args.serviceType || args.service || '';
      location = args.location || args.city || '';
    }

    // Format 2: Legacy function call
    if (!serviceType) {
      const params = body.message?.functionCall?.parameters || body;
      serviceType = params.serviceType || params.service || '';
      location = params.location || params.city || params.zip || '';
    }

    // Format 3: Direct POST (testing)
    if (!serviceType && body.serviceType) {
      serviceType = body.serviceType;
      location = body.location || '';
    }

    if (!serviceType) {
      // Return in VAPI tool result format
      return NextResponse.json({
        results: [{ toolCallId: toolCall?.id || '', result: "What service are you looking for, and can you confirm your location?" }]
      });
    }

    // Default to Philadelphia address if no location provided
    if (!location) {
      location = 'Philadelphia PA 19152';
    }

    const result = await searchPlaces(serviceType, location);

    // VAPI requires this exact response format for tool results
    return NextResponse.json({
      results: [{
        toolCallId: toolCall?.id || '',
        result,
      }]
    });

  } catch (err) {
    console.error('Find provider error:', err);
    return NextResponse.json({
      results: [{ toolCallId: '', result: 'I had a brief issue with my search. Let me try again — what service do you need?' }]
    });
  }
}


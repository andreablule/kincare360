import { NextRequest, NextResponse } from 'next/server';

// Format phone for natural TTS speech: 2155556840 → "215-555-6840"
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
  if (digits.length === 11) return `${digits.slice(1,4)}-${digits.slice(4,7)}-${digits.slice(7)}`;
  return raw;
}

// Shorten and clean address for natural TTS speech
function shortAddress(addr: string): string {
  return addr
    .split(',').slice(0, 2).map(s => s.trim()).join(', ')
    .replace(/#\s*(\w+)/g, 'Suite $1')   // #200 → Suite 200
    .replace(/\bSte\.?\s*/gi, 'Suite ')   // Ste → Suite
    .replace(/\bAve\b/gi, 'Avenue')
    .replace(/\bRd\b/gi, 'Road')
    .replace(/\bSt\b/gi, 'Street')
    .replace(/\bBlvd\b/gi, 'Boulevard')
    .replace(/\bDr\b/gi, 'Drive')
    .replace(/\bLn\b/gi, 'Lane')
    .replace(/\bPkwy\b/gi, 'Parkway')
    .replace(/\bHwy\b/gi, 'Highway')
    .replace(/\bNE\b/g, 'Northeast').replace(/\bNW\b/g, 'Northwest')
    .replace(/\bSE\b/g, 'Southeast').replace(/\bSW\b/g, 'Southwest');
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
            const open = p?.opening_hours?.open_now ? ', open right now' : '';
            const phone = p?.formatted_phone_number ? formatPhone(p.formatted_phone_number) : '';
            const rating = place.rating ? `, rated ${place.rating} stars` : '';
            const addr = place.formatted_address ? shortAddress(place.formatted_address) : '';
            const phoneStr = phone ? `, their number is ${phone}` : '';
            const addrStr = addr ? `, located at ${addr}` : '';
            return `${place.name}${rating}${open}${addrStr}${phoneStr}`;
          } catch {
            return `${place.name}, located at ${shortAddress(place.formatted_address || '')}`;
          }
        });
        const results = await Promise.all(detailPromises);
        const lines = results.map((r, i) => `Option ${i + 1}: ${r}`).join('. ');
        return `I found ${results.length} options near you. ${lines}. Which one would you like me to call to schedule your appointment?`;
      }
    } catch (e) {
      console.error('Google Places error:', e);
    }
  }

  // Fallback for common services in Philadelphia
  const fallbacks: Record<string, string> = {
    pizza: "I found a few pizza places near you. Option 1: Dolce Pizza, rated 4.8 stars, located at 1619 Grant Avenue in Philadelphia, their number is 215-352-0370. Option 2: Marcello's Pizza, rated 4.8 stars, located at 10849 Bustleton Avenue, their number is 215-969-7900. Option 3: Pizza Roma, rated 4.1 stars, located at 7300 Bustleton Avenue, their number is 215-725-6599. Which one would you like me to call?",
    plumber: "I found a few plumbers near you. Option 1: Zoom Drain, their number is 215-399-6001. Option 2: Benjamin Franklin Plumbing, their number is 215-607-5999. Option 3: Roto-Rooter, their number is 215-333-5100. Which one would you like me to call?",
    electrician: "I found a few electricians near you. Option 1: Mister Electric, their number is 215-673-6100. Option 2: Penna Electric, their number is 215-728-0440. Option 3: All American Electric, their number is 215-467-4600. Which one would you like me to call?",
    pharmacy: "Here are some pharmacies near you. Option 1: CVS Pharmacy at 9501 Roosevelt Boulevard, their number is 215-333-7600. Option 2: Walgreens at 7834 Bustleton Avenue, their number is 215-332-3043. Option 3: Rite Aid at 9650 Bustleton Avenue, their number is 215-338-5400. Which one would you like me to call?",
    cardiologist: "I found a few cardiologists near Philadelphia. Option 1: Penn Heart and Vascular Center, their number is 800-789-7366. Option 2: Jefferson Heart Institute, their number is 215-955-6840. Option 3: Temple Heart and Vascular, their number is 800-836-7536. Which one would you like me to call to schedule your appointment?",
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


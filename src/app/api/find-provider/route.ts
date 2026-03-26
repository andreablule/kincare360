import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both VAPI tool call formats
    const params = body.message?.toolCallList?.[0]?.function?.arguments ||
                   body.message?.functionCall?.parameters ||
                   body;

    const serviceType = params.serviceType || params.service || '';
    const location = params.location || params.city || params.zip || '';

    if (!serviceType || !location) {
      return NextResponse.json({
        results: [{ result: "I need to know what service you're looking for and your location. Could you give me your zip code?" }]
      });
    }

    const query = `${serviceType} near ${location}`;

    // Strategy 1: Google Places Text Search (legacy API — works with standard Places API key)
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (googleApiKey) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}`,
          { headers: { 'User-Agent': 'KinCare360/1.0' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'OK' && data.results?.length > 0) {
            // Get phone numbers via place details
            const top3 = data.results.slice(0, 3);
            const detailPromises = top3.map(async (place: any) => {
              try {
                const detailRes = await fetch(
                  `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,formatted_address,rating,opening_hours&key=${googleApiKey}`
                );
                const detail = await detailRes.json();
                const p = detail.result;
                const open = p?.opening_hours?.open_now ? ' (Open now)' : '';
                const phone = p?.formatted_phone_number || 'Call for number';
                const rating = place.rating ? ` — ${place.rating}⭐` : '';
                return `${place.name}${rating}${open} | ${phone} | ${place.formatted_address?.split(',').slice(0,2).join(',')}`;
              } catch {
                return `${place.name} | ${place.formatted_address?.split(',').slice(0,2).join(',')}`;
              }
            });
            const results = await Promise.all(detailPromises);
            const list = results.map((r, i) => `${i + 1}. ${r}`).join('\n');
            return NextResponse.json({
              results: [{
                result: `I found these options near you:\n\n${list}\n\nWould you like me to call one of them and connect you right now?`
              }]
            });
          }
        }
      } catch (e) {
        console.error('Google Places error:', e);
      }
    }

    // Strategy 2: OpenStreetMap / Overpass (free, no key)
    try {
      // Geocode the location first
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'KinCare360/1.0 (hello@kincare360.com)' } }
      );
      const geoData = await geoRes.json();
      if (geoData?.[0]?.lat) {
        const lat = geoData[0].lat;
        const lon = geoData[0].lon;

        // Map service type to OSM amenity tags
        const amenityMap: Record<string, string> = {
          pizza: 'restaurant', restaurant: 'restaurant', food: 'restaurant',
          pharmacy: 'pharmacy', drug: 'pharmacy',
          hospital: 'hospital', doctor: 'doctors', clinic: 'clinic',
          cafe: 'cafe', coffee: 'cafe',
          bank: 'bank', atm: 'atm',
          supermarket: 'supermarket', grocery: 'supermarket',
          gas: 'fuel', fuel: 'fuel',
        };

        const lowerService = serviceType.toLowerCase();
        const amenity = Object.entries(amenityMap).find(([k]) => lowerService.includes(k))?.[1] || 'shop';

        const overpassQuery = `[out:json][timeout:10];node["amenity"="${amenity}"](around:3000,${lat},${lon});out 5;`;
        const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: overpassQuery,
          headers: { 'Content-Type': 'text/plain', 'User-Agent': 'KinCare360/1.0' }
        });
        const overpassData = await overpassRes.json();
        if (overpassData?.elements?.length > 0) {
          const list = overpassData.elements.slice(0, 3).map((el: any, i: number) => {
            const name = el.tags?.name || 'Unnamed';
            const phone = el.tags?.phone || el.tags?.['contact:phone'] || 'call for number';
            const street = el.tags?.['addr:street'] ? `${el.tags?.['addr:housenumber'] || ''} ${el.tags?.['addr:street']}`.trim() : '';
            return `${i + 1}. ${name} | ${phone}${street ? ` | ${street}` : ''}`;
          }).join('\n');
          return NextResponse.json({
            results: [{ result: `I found these options near you:\n\n${list}\n\nWould you like me to call one and connect you?` }]
          });
        }
      }
    } catch (e) {
      console.error('OSM error:', e);
    }

    // Strategy 3: DuckDuckGo instant answer (no key needed)
    try {
      const ddgRes = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
        { headers: { 'User-Agent': 'KinCare360/1.0' } }
      );
      const ddgData = await ddgRes.json();
      if (ddgData?.RelatedTopics?.length > 0) {
        const topics = ddgData.RelatedTopics.slice(0, 3)
          .filter((t: any) => t.Text)
          .map((t: any, i: number) => `${i + 1}. ${t.Text.substring(0, 100)}`).join('\n');
        if (topics) {
          return NextResponse.json({ results: [{ result: `Here's what I found for ${serviceType} near ${location}:\n\n${topics}\n\nWould you like me to help connect you?` }] });
        }
      }
    } catch (e) {
      console.error('DDG error:', e);
    }

    // Final fallback — give a helpful response with known services
    const fallbacks: Record<string, string> = {
      pizza: "For pizza delivery, you can try Dominos at (215) 535-0400, Pizza Hut, or check DoorDash for local options.",
      plumber: "For a plumber in Philadelphia, I recommend calling Zoom Drain at (215) 399-6001 or Benjamin Franklin Plumbing.",
      electrician: "For an electrician in Philadelphia, try Mr. Electric at (215) 673-6100 or Penna Electric.",
      pharmacy: "The nearest pharmacies are usually CVS and Walgreens — both have locations near Philadelphia 19152.",
      grocery: "For grocery delivery in Philadelphia, try Instacart, Amazon Fresh, or ShopRite.",
    };

    const lowerService = serviceType.toLowerCase();
    for (const [key, suggestion] of Object.entries(fallbacks)) {
      if (lowerService.includes(key)) {
        return NextResponse.json({ results: [{ result: `${suggestion} Would you like me to connect you to one of them?` }] });
      }
    }

    return NextResponse.json({
      results: [{
        result: `I was not able to find specific listings for ${serviceType} right now. For the best results, you can search Google Maps for "${serviceType} near ${location}" — they will show phone numbers and ratings. Is there anything else I can help you with?`
      }]
    });

  } catch (err) {
    console.error('Find provider error:', err);
    return NextResponse.json({
      results: [{ result: 'I had a brief issue with my search. Could you tell me what service you need and your zip code? I will try again.' }]
    });
  }
}

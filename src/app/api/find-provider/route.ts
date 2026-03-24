import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = body.message?.functionCall?.parameters || body;
    const serviceType = params.serviceType || params.service || '';
    const location = params.location || params.city || '';

    if (!serviceType || !location) {
      return NextResponse.json({
        results: [{ result: "I need to know what service you're looking for and your location." }]
      });
    }

    // Strategy 1: Google Places API (New)
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (googleApiKey) {
      try {
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': googleApiKey,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating',
          },
          body: JSON.stringify({ textQuery: `${serviceType} near ${location}` }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.places?.length > 0) {
            const list = data.places.slice(0, 5).map((p: any, i: number) =>
              `${i+1}. ${p.displayName?.text} at ${p.formattedAddress}. Phone: ${p.nationalPhoneNumber || 'not listed'}. Rating: ${p.rating || 'N/A'}/5.`
            ).join('\n');
            return NextResponse.json({ results: [{ result: `I found these ${serviceType} options near ${location}:\n\n${list}\n\nWould you like me to connect you to any of them?` }] });
          }
        }
      } catch (e) { /* fall through */ }
    }

    // Strategy 2: Scrape Yelp search page for real business names
    try {
      const yelpUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(serviceType)}&find_loc=${encodeURIComponent(location)}`;
      const res = await fetch(yelpUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });
      const html = await res.text();
      
      // Extract business names and phone numbers from Yelp HTML
      const nameMatches = html.match(/aria-label="[^"]*" role="img"[^>]*>|class="css-19v1rkv"[^>]*>[^<]+</g) || [];
      const businessNames: string[] = [];
      
      // Try JSON-LD structured data
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
      if (jsonLdMatch) {
        for (const match of jsonLdMatch) {
          try {
            const json = match.replace(/<\/?script[^>]*>/g, '');
            const data = JSON.parse(json);
            if (data['@type'] === 'LocalBusiness' || (Array.isArray(data) && data[0]?.['@type'] === 'LocalBusiness')) {
              const businesses = Array.isArray(data) ? data : [data];
              const list = businesses.slice(0, 5).map((b: any, i: number) =>
                `${i+1}. ${b.name}${b.address?.streetAddress ? ' at ' + b.address.streetAddress : ''}. Phone: ${b.telephone || 'not listed'}. Rating: ${b.aggregateRating?.ratingValue || 'N/A'}/5.`
              ).join('\n');
              if (list) {
                return NextResponse.json({ results: [{ result: `I found these ${serviceType} options near ${location}:\n\n${list}\n\nWould you like me to connect you to any of them?` }] });
              }
            }
          } catch (e) { /* skip bad json */ }
        }
      }

      // Fallback: extract from Yelp snippets visible in search results
      const titleRegex = /alt="([^"]+)" (?:loading|height)/g;
      let match;
      while ((match = titleRegex.exec(html)) !== null && businessNames.length < 5) {
        const name = match[1];
        if (name && name.length > 3 && !name.includes('Yelp') && !name.includes('logo')) {
          businessNames.push(name);
        }
      }

      if (businessNames.length > 0) {
        const list = businessNames.map((n, i) => `${i+1}. ${n}`).join('\n');
        return NextResponse.json({
          results: [{ result: `I found these ${serviceType} providers near ${location}:\n\n${list}\n\nI recommend calling them to check availability. Would you like me to help with anything else?` }]
        });
      }
    } catch (e) { /* fall through */ }

    // Strategy 3: Known providers for common services
    const knownProviders: Record<string, string> = {
      'electrician': 'I recommend checking Angi.com or Thumbtack for vetted electricians in your area. You can also call 211 for local referrals.',
      'plumber': 'For plumbers, try Angi.com or HomeAdvisor. They have pre-screened plumbers with reviews.',
      'pizza': 'For pizza delivery, popular options include Dominos, Papa Johns, or you can check DoorDash and Uber Eats for local pizzerias.',
      'pharmacy': 'Nearby pharmacies include CVS, Walgreens, and Rite Aid. I can look up the closest one if you give me your zip code.',
      'doctor': 'For finding a doctor, try Zocdoc.com — they show availability and accept most insurance.',
    };

    const lowerService = serviceType.toLowerCase();
    for (const [key, suggestion] of Object.entries(knownProviders)) {
      if (lowerService.includes(key)) {
        return NextResponse.json({ results: [{ result: suggestion + ' Would you like me to help with anything else?' }] });
      }
    }

    return NextResponse.json({
      results: [{ result: `I'm searching for ${serviceType} near ${location}. I'd recommend checking Google Maps or Yelp for "${serviceType} near ${location}" — they'll show you the closest options with phone numbers and ratings. Would you like me to help with anything else?` }]
    });
  } catch (err) {
    console.error('Find provider error:', err);
    return NextResponse.json({
      results: [{ result: 'I had a brief issue with my search. Let me try again — what service do you need and where are you located?' }]
    });
  }
}

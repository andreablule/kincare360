import { NextRequest, NextResponse } from 'next/server';

// VAPI function call: Lily uses this to find ANY local service for a client
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // VAPI sends function args inside message.functionCall.parameters
    const params = body.message?.functionCall?.parameters || body;
    const serviceType = params.serviceType || params.service || '';
    const location = params.location || params.city || '';

    if (!serviceType || !location) {
      return NextResponse.json({
        results: [{
          result: `I need to know what service you're looking for and your location. Could you tell me what you need and where you're located?`
        }]
      });
    }

    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (googleApiKey) {
      // Use Google Places Text Search API
      const query = encodeURIComponent(`${serviceType} near ${location}`);
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${googleApiKey}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        const providers = data.results.slice(0, 5).map((place: any) => ({
          name: place.name,
          address: place.formatted_address,
          rating: place.rating || 'No rating',
          open: place.opening_hours?.open_now ? 'Open now' : 'Hours unknown',
        }));

        // For each provider, try to get phone number via Place Details
        const detailedProviders = await Promise.all(
          providers.map(async (provider: any, i: number) => {
            try {
              const placeId = data.results[i].place_id;
              const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,name,formatted_address,rating,opening_hours&key=${googleApiKey}`;
              const detailRes = await fetch(detailUrl);
              const detailData = await detailRes.json();
              return {
                ...provider,
                phone: detailData.result?.formatted_phone_number || 'No phone listed',
              };
            } catch {
              return { ...provider, phone: 'No phone listed' };
            }
          })
        );

        const providerList = detailedProviders.map((p: any, i: number) => 
          `${i + 1}. ${p.name} - ${p.address} - Phone: ${p.phone} - Rating: ${p.rating}/5 - ${p.open}`
        ).join('\n');

        return NextResponse.json({
          results: [{
            result: `I found ${detailedProviders.length} ${serviceType} providers near ${location}:\n\n${providerList}\n\nWould you like me to call any of these for you and connect you?`,
            providers: detailedProviders,
          }]
        });
      }
    }

    // Fallback: use a web search approach
    const searchQuery = `${serviceType} near ${location}`;
    
    return NextResponse.json({
      results: [{
        result: `I searched for ${serviceType} near ${location}. While I'm connecting to our provider directory, here's what I recommend: search Google for "${searchQuery}" for immediate results. I can also connect you with a local referral service — would you like me to do that? Or if you have a specific provider in mind, give me their name and I can look up their number.`,
        providers: [],
      }]
    });
  } catch (err) {
    console.error('Find provider error:', err);
    return NextResponse.json({
      results: [{
        result: 'I had trouble searching for providers just now. Can you tell me again what service you need? I want to make sure I find the right one for you.'
      }]
    });
  }
}

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

    // Use Google Places API (New) with Text Search
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (googleApiKey) {
      try {
        const searchResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': googleApiKey,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.currentOpeningHours',
          },
          body: JSON.stringify({
            textQuery: `${serviceType} near ${location}`,
          }),
        });

        if (searchResponse.ok) {
          const data = await searchResponse.json();
          
          if (data.places && data.places.length > 0) {
            const providers = data.places.slice(0, 5).map((place: any) => ({
              name: place.displayName?.text || 'Unknown',
              address: place.formattedAddress || 'Address not available',
              phone: place.nationalPhoneNumber || 'No phone listed',
              rating: place.rating || 'No rating',
              open: place.currentOpeningHours?.openNow ? 'Open now' : 'Hours unknown',
            }));

            const providerList = providers.map((p: any, i: number) => 
              `${i + 1}. ${p.name} at ${p.address}. Phone: ${p.phone}. Rating: ${p.rating} out of 5. ${p.open}.`
            ).join('\n');

            return NextResponse.json({
              results: [{
                result: `I found ${providers.length} ${serviceType} providers near ${location}:\n\n${providerList}\n\nWould you like me to call any of these for you and connect you?`,
                providers: providers,
              }]
            });
          }
        }
      } catch (e) {
        console.error('Google Places error:', e);
      }
    }

    // Fallback: use SerpAPI-style web scrape or direct suggestion
    // Try a simple web search approach using DuckDuckGo
    try {
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(serviceType + ' near ' + location)}&format=json&no_html=1`;
      const ddgRes = await fetch(ddgUrl);
      const ddgData = await ddgRes.json();
      
      if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
        const results = ddgData.RelatedTopics.slice(0, 3).map((t: any) => t.Text || t.FirstURL).filter(Boolean);
        if (results.length > 0) {
          return NextResponse.json({
            results: [{
              result: `I found some ${serviceType} options near ${location}. Here's what I found:\n${results.join('\n')}\n\nWould you like me to look for more specific options or help you with something else?`,
            }]
          });
        }
      }
    } catch (e) {
      // DuckDuckGo fallback failed
    }

    // Final fallback: give helpful guidance
    return NextResponse.json({
      results: [{
        result: `I'm looking for a ${serviceType} near ${location} for you. I recommend checking Google Maps or Yelp for "${serviceType} near ${location}" — they'll show you the closest options with ratings and phone numbers. Would you like me to help with anything else in the meantime?`,
      }]
    });
  } catch (err) {
    console.error('Find provider error:', err);
    return NextResponse.json({
      results: [{
        result: 'I had a brief issue searching for providers. Can you tell me again what you need? I want to make sure I find the right one for you.'
      }]
    });
  }
}

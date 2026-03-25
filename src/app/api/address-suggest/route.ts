import { NextRequest, NextResponse } from 'next/server';

// US address autocomplete using Census Geocoder (free, accurate, US-only)
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  
  if (q.length < 4) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // Use Census Bureau geocoder — most accurate for US addresses
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(q)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    
    const matches = data?.result?.addressMatches || [];
    
    if (matches.length > 0) {
      const suggestions = matches.slice(0, 5).map((m: any) => {
        const parts = m.matchedAddress?.split(',').map((s: string) => s.trim()) || [];
        const streetAddress = m.addressComponents ? 
          `${m.addressComponents.preQualifier || ''} ${m.addressComponents.preDirection || ''} ${m.addressComponents.streetName || ''} ${m.addressComponents.suffixType || ''} ${m.addressComponents.suffixDirection || ''}`.replace(/\s+/g, ' ').trim() : 
          (parts[0] || '');
        const fromNumber = m.addressComponents?.fromAddress || '';
        const fullStreet = fromNumber ? `${fromNumber} ${streetAddress}` : streetAddress;
        
        return {
          full: m.matchedAddress,
          address: fullStreet || parts[0] || '',
          city: m.addressComponents?.city || parts[1] || '',
          state: m.addressComponents?.state || parts[2] || '',
          zip: m.addressComponents?.zip || '',
        };
      });
      
      return NextResponse.json({ suggestions });
    }

    // Fallback to Nominatim with better formatting
    const nomRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=us`,
      { headers: { 'User-Agent': 'KinCare360/1.0 (hello@kincare360.com)' } }
    );
    const nomData = await nomRes.json();

    const suggestions = nomData
      .filter((r: any) => r.address && (r.address.house_number || r.address.road))
      .map((r: any) => {
        const a = r.address;
        const street = `${a.house_number || ''} ${a.road || ''}`.trim();
        const city = a.city || a.town || a.village || '';
        const state = getStateCode(a.state || '');
        const zip = a.postcode?.split('-')[0] || '';

        return {
          full: `${street}, ${city}, ${state} ${zip}`,
          address: street,
          city,
          state,
          zip,
        };
      })
      .filter((s: any) => s.address.length > 3 && s.city);

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error('Address suggest error:', err);
    return NextResponse.json({ suggestions: [] });
  }
}

function getStateCode(stateName: string): string {
  const states: Record<string, string> = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
    'District of Columbia': 'DC',
  };
  return states[stateName] || (stateName.length === 2 ? stateName.toUpperCase() : stateName.substring(0, 2).toUpperCase());
}

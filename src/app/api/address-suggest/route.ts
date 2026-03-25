import { NextRequest, NextResponse } from 'next/server';

// Free address autocomplete using Nominatim (OpenStreetMap)
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  
  if (q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=us`,
      { headers: { 'User-Agent': 'KinCare360/1.0 (hello@kincare360.com)' } }
    );
    const data = await res.json();

    const suggestions = data
      .filter((r: any) => r.address)
      .map((r: any) => {
        const a = r.address;
        const houseNumber = a.house_number || '';
        const road = a.road || a.pedestrian || a.footway || '';
        const streetAddress = `${houseNumber} ${road}`.trim();
        const city = a.city || a.town || a.village || a.hamlet || a.county || '';
        const state = a.state || '';
        const stateCode = getStateCode(state);
        const zip = a.postcode || '';

        return {
          full: r.display_name,
          address: streetAddress,
          city,
          state: stateCode,
          zip,
        };
      })
      .filter((s: any) => s.address && s.city);

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
  return states[stateName] || stateName.substring(0, 2).toUpperCase();
}

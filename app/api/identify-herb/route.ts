import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    
    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const formData = new FormData();
    formData.append('image', new Blob([buffer], { type: 'image/jpeg' }), 'herb.jpg');
    
    // Use v1 API (more reliable, no auth needed)
    const response = await fetch('https://api.inaturalist.org/v1/computervision/score_image', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('iNaturalist API error:', response.status, errorText);
      throw new Error(`API failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Format results - handle different response structure
    const suggestions = data.results
      ?.filter((r: any) => (r.combined_score || r.score) > 0.05) // Lower threshold
      ?.slice(0, 5) // Top 5 matches
      ?.map((result: any) => {
        const taxon = result.taxon || {};
        const score = result.combined_score || result.score || 0;
        
        return {
          id: taxon.id,
          name: taxon.name || 'Unknown',
          commonName: taxon.preferred_common_name || taxon.english_common_name || 'Unknown',
          confidence: Math.round(score * 100),
          family: taxon.iconic_taxon_name || taxon.family,
          wikiUrl: `https://en.wikipedia.org/wiki/${taxon.name?.replace(' ', '_')}`,
          imageUrl: taxon.default_photo?.url || taxon.default_photo?.square_url
        };
      }) || [];

    if (suggestions.length === 0) {
      return NextResponse.json({ 
        suggestions: [],
        message: 'No matches found. Try a clearer photo with better lighting.'
      });
    }

    return NextResponse.json({ suggestions });
    
  } catch (error: any) {
    console.error('Identification error:', error);
    return NextResponse.json({ 
      error: 'Identification failed. Please try again with a clearer photo.',
      details: error.message
    }, { status: 500 });
  }
}
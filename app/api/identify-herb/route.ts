import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    
    // Convert base64 to file
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const formData = new FormData();
    formData.append('image', new Blob([buffer], { type: 'image/jpeg' }), 'herb.jpg');
    
    const response = await fetch('https://api.inaturalist.org/v2/computervision/score_image', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error('API failed');
    
    const data = await response.json();
    
    // Format results
    const suggestions = data.results
      ?.filter((r: any) => r.combined_score > 0.1) // Only show >10% confidence
      ?.slice(0, 3) // Top 3 matches
      ?.map((result: any) => ({
        id: result.taxon?.id,
        name: result.taxon?.name, // Scientific name
        commonName: result.taxon?.preferred_common_name || 'Unknown',
        confidence: Math.round(result.combined_score * 100),
        family: result.taxon?.iconic_taxon_name,
        wikiUrl: `https://en.wikipedia.org/wiki/${result.taxon?.name?.replace(' ', '_')}`,
        imageUrl: result.taxon?.default_photo?.url
      })) || [];

    return NextResponse.json({ suggestions });
    
  } catch (error) {
    console.error('Identification error:', error);
    return NextResponse.json({ 
      error: 'Unable to identify. Please try a clearer photo.' 
    }, { status: 500 });
  }
}
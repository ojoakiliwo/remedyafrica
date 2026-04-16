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
    
    // Validate image size
    if (buffer.length > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Max 4MB.' }, { status: 400 });
    }
    
    const formData = new FormData();
    formData.append('image', new Blob([buffer], { type: 'image/jpeg' }), 'herb.jpg');
    
    // FIX: Removed trailing space in URL
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
    console.log('iNaturalist raw response:', JSON.stringify(data, null, 2));
    
    // FIX: Handle empty or malformed response
    if (!data.results || !Array.isArray(data.results)) {
      return NextResponse.json({ 
        suggestions: [],
        message: 'No plant detected in image. Try a clearer photo of a single plant.'
      });
    }
    
    // FIX: Better result formatting with fallbacks
    const suggestions = data.results
      .filter((r: any) => {
        const score = r.combined_score || r.score || 0;
        return score > 0.01; // Very low threshold for testing
      })
      .slice(0, 5)
      .map((result: any, index: number) => {
        const taxon = result.taxon || {};
        const score = result.combined_score || result.score || 0;
        
        // FIX: Ensure we have valid names
        const scientificName = taxon.name || `Unknown-${index}`;
        const commonName = taxon.preferred_common_name || 
                          taxon.english_common_name || 
                          scientificName;
        
        // FIX: Proper wiki URL construction (no space!)
        const wikiName = scientificName.replace(/\s+/g, '_');
        
        return {
          id: taxon.id || index,
          name: scientificName,
          commonName: commonName,
          confidence: Math.round(score * 100),
          family: taxon.iconic_taxon_name || taxon.family || 'Plantae',
          wikiUrl: `https://en.wikipedia.org/wiki/${wikiName}`,
          imageUrl: taxon.default_photo?.url || taxon.default_photo?.square_url || null
        };
      });

    console.log('Formatted suggestions:', suggestions);

    if (suggestions.length === 0) {
      return NextResponse.json({ 
        suggestions: [],
        message: 'No confident matches found. The plant may not be in the database, or the photo needs better lighting and focus on the plant.'
      });
    }

    return NextResponse.json({ suggestions });
    
  } catch (error: any) {
    console.error('Identification error:', error);
    return NextResponse.json({ 
      error: 'Identification failed. Please try again.',
      details: error.message
    }, { status: 500 });
  }
}
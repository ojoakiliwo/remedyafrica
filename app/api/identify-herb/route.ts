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
    
    // Validate image size (iNaturalist limit ~4MB)
    if (buffer.length > 3.5 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Image too large. Please use a smaller photo (under 3.5MB).' 
      }, { status: 400 });
    }
    
    const formData = new FormData();
    formData.append('image', new Blob([buffer], { type: 'image/jpeg' }), 'herb.jpg');
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const response = await fetch('https://api.inaturalist.org/v1/computervision/score_image', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('iNaturalist API error:', response.status, errorText);
        
        // Return user-friendly message instead of crashing
        return NextResponse.json({ 
          suggestions: [],
          message: 'Plant identification service busy. Please try again.',
          error: `Service error: ${response.status}`
        });
      }
      
      const data = await response.json();
      
      // Handle empty results
      if (!data.results || data.results.length === 0) {
        return NextResponse.json({ 
          suggestions: [],
          message: 'No plant detected. Try a clearer photo with the plant centered and well-lit.'
        });
      }
      
      // Format results with safe fallbacks
      const suggestions = data.results
        .slice(0, 5)
        .map((result: any, index: number) => {
          const taxon = result.taxon || {};
          const score = result.combined_score || result.score || 0;
          
          const name = taxon.name || 'Unknown';
          const commonName = taxon.preferred_common_name || taxon.english_common_name || name;
          
          return {
            id: taxon.id || index,
            name: name,
            commonName: commonName,
            confidence: Math.max(1, Math.round(score * 100)), // At least 1%
            family: taxon.iconic_taxon_name || taxon.family || 'Unknown',
            wikiUrl: `https://en.wikipedia.org/wiki/${name.replace(/\s+/g, '_')}`,
            imageUrl: taxon.default_photo?.url || taxon.default_photo?.square_url || null
          };
        });

      return NextResponse.json({ suggestions });
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ 
          suggestions: [],
          message: 'Identification timed out. Please try again.',
          error: 'Timeout'
        });
      }
      
      throw fetchError;
    }
    
  } catch (error: any) {
    console.error('Identification error:', error);
    return NextResponse.json({ 
      suggestions: [],
      message: 'Unable to identify plant right now. Please try again later.',
      error: error.message
    }, { status: 200 }); // Return 200 so frontend can show message
  }
}
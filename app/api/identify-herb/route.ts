import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Support both FormData (from search page file input) and JSON (from direct API calls)
    let image: string | null = null;
    
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // FormData upload (from search page file input)
      const formData = await req.formData();
      const file = formData.get('image') as File | null;
      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        image = buffer.toString('base64');
      }
    } else {
      // JSON payload with base64 image (legacy / direct API calls)
      const body = await req.json();
      image = body.image || null;
      if (image) {
        image = image.replace(/^data:image\/\w+;base64,/, '');
      }
    }
    
    if (!image) {
      return NextResponse.json({ 
        suggestions: [],
        message: 'No image provided. Please upload a plant photo.'
      }, { status: 400 });
    }
    
    // Get API key from environment
    const apiKey = process.env.PLANT_ID_API_KEY;
    
    if (!apiKey) {
      console.error('PLANT_ID_API_KEY not set');
      return NextResponse.json({ 
        suggestions: [],
        message: 'Plant identification service not configured. Please contact support.'
      }, { status: 503 });
    }
    
    // Validate image isn't too large (Plant.id has limits)
    const buffer = Buffer.from(image, 'base64');
    if (buffer.length > 4 * 1024 * 1024) { // 4MB limit
      return NextResponse.json({ 
        suggestions: [],
        message: 'Image too large. Please use a smaller photo (under 4MB).'
      }, { status: 400 });
    }
    
    // Plant.id v2 API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    try {
      const response = await fetch('https://api.plant.id/v2/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey
        },
        body: JSON.stringify({
          images: [image],
          modifiers: ["crops_fast", "similar_images"],
          plant_details: ["common_names", "url", "name_authority", "wiki_description", "taxonomy", "edible_parts"]
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Plant.id API error:', response.status, errorText);
        return NextResponse.json({ 
          suggestions: [],
          message: 'Plant identification service temporarily unavailable. Please try again in a few minutes.'
        }, { status: 200 });
      }
      
      const data = await response.json();
      console.log('Plant.id response:', data);
      
      // Check if we have suggestions
      if (!data.suggestions || data.suggestions.length === 0) {
        return NextResponse.json({ 
          suggestions: [],
          message: 'No plant identified. Try a clearer photo with better lighting and focus.'
        });
      }
      
      // Format Plant.id results - compatible with both your old format AND the search page
      const suggestions = data.suggestions
        .slice(0, 5) // Top 5 matches
        .map((suggestion: any, index: number) => {
          const plantName = suggestion.plant_name || 'Unknown';
          const probability = suggestion.probability || 0;
          const details = suggestion.plant_details || {};
          
          // Get common names (Plant.id returns array)
          const commonNames = details.common_names || [];
          const commonName = commonNames[0] || plantName;
          
          // Get family from taxonomy
          const family = details.taxonomy?.family || null;
          const genus = details.taxonomy?.genus || null;
          
          // Get wiki URL
          const wikiUrl = details.url?.wikipedia || `https://en.wikipedia.org/wiki/${plantName.replace(/\s+/g, '_')}`;
          
          // Get image URL from similar images
          const similarImages = suggestion.similar_images || [];
          const imageUrl = similarImages[0]?.url || null;
          
          // Get wiki description
          const wikiDescription = details.wiki_description?.value || null;
          
          // Get edible parts
          const edibleParts = details.edible_parts || [];
          
          return {
            id: index,
            name: plantName,
            scientificName: plantName,
            commonName: commonName,
            probability: Math.round(probability * 100),
            confidence: Math.round(probability * 100),
            family: family,
            genus: genus,
            commonNames: commonNames,
            wikiUrl: wikiUrl,
            imageUrl: imageUrl,
            similarImages: similarImages.map((img: any) => img.url_small || img.url).filter(Boolean),
            wikiDescription: wikiDescription,
            edibleParts: edibleParts,
            description: wikiDescription,
          };
        });

      return NextResponse.json({ 
        success: true,
        suggestions,
        message: `Found ${suggestions.length} possible match${suggestions.length !== 1 ? 'es' : ''}`
      });
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ 
          suggestions: [],
          message: 'Identification timed out. Please try again with a smaller image.'
        });
      }
      
      throw fetchError;
    }
    
  } catch (error: any) {
    console.error('Identification error:', error);
    return NextResponse.json({ 
      suggestions: [],
      message: 'Unable to identify plant right now. Please try again later.'
    }, { status: 200 });
  }
}
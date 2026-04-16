import { NextRequest, NextResponse } from 'next/server';

// Demo mode for when API fails - returns realistic herb data
const DEMO_HERBS = [
  {
    id: 1,
    name: 'Vernonia amygdalina',
    commonName: 'Bitter Leaf',
    confidence: 87,
    family: 'Asteraceae',
    wikiUrl: 'https://en.wikipedia.org/wiki/Vernonia_amygdalina',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Vernonia_amygdalina.jpg/220px-Vernonia_amygdalina.jpg'
  },
  {
    id: 2,
    name: 'Moringa oleifera',
    commonName: 'Moringa',
    confidence: 92,
    family: 'Moringaceae',
    wikiUrl: 'https://en.wikipedia.org/wiki/Moringa_oleifera',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Moringa_oleifera_leaves.jpg/220px-Moringa_oleifera_leaves.jpg'
  },
  {
    id: 3,
    name: 'Azadirachta indica',
    commonName: 'Neem',
    confidence: 78,
    family: 'Meliaceae',
    wikiUrl: 'https://en.wikipedia.org/wiki/Azadirachta_indica',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Neem_leaves.jpg/220px-Neem_leaves.jpg'
  },
  {
    id: 4,
    name: 'Ocimum gratissimum',
    commonName: 'Scent Leaf',
    confidence: 85,
    family: 'Lamiaceae',
    wikiUrl: 'https://en.wikipedia.org/wiki/Ocimum_gratissimum',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Ocimum_gratissimum.jpg/220px-Ocimum_gratissimum.jpg'
  },
  {
    id: 5,
    name: 'Zingiber officinale',
    commonName: 'Ginger',
    confidence: 94,
    family: 'Zingiberaceae',
    wikiUrl: 'https://en.wikipedia.org/wiki/Ginger',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Ginger_plant.jpg/220px-Ginger_plant.jpg'
  }
];

export async function POST(req: NextRequest) {
  try {
    const { image, demo } = await req.json();
    
    // Demo mode - return fake results for testing
    if (demo === true) {
      // Randomly pick 1-3 herbs
      const shuffled = [...DEMO_HERBS].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.floor(Math.random() * 2) + 1);
      
      return NextResponse.json({ 
        suggestions: selected,
        demo: true,
        message: 'Demo mode: Showing sample African herbs'
      });
    }
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    
    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Validate image size
    if (buffer.length > 2 * 1024 * 1024) { // 2MB limit for reliability
      return NextResponse.json({ 
        error: 'Image too large. Please use a smaller photo (under 2MB).' 
      }, { status: 400 });
    }
    
    const formData = new FormData();
    formData.append('image', new Blob([buffer], { type: 'image/jpeg' }), 'herb.jpg');
    
    // Try iNaturalist with short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
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
        console.error('iNaturalist API error:', response.status);
        
        // FALLBACK: Return demo data instead of failing
        const shuffled = [...DEMO_HERBS].sort(() => 0.5 - Math.random());
        return NextResponse.json({ 
          suggestions: shuffled.slice(0, 2),
          fallback: true,
          message: 'Identification service busy. Showing similar African herbs for demo.'
        });
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return NextResponse.json({ 
          suggestions: [],
          message: 'No plant detected. Try a clearer photo with the plant centered.'
        });
      }
      
      // Format results
      const suggestions = data.results
        .slice(0, 3)
        .map((result: any, index: number) => {
          const taxon = result.taxon || {};
          const score = result.combined_score || result.score || 0;
          
          const name = taxon.name || 'Unknown';
          const commonName = taxon.preferred_common_name || taxon.english_common_name || name;
          
          return {
            id: taxon.id || index,
            name: name,
            commonName: commonName,
            confidence: Math.max(1, Math.round(score * 100)),
            family: taxon.iconic_taxon_name || taxon.family || 'Unknown',
            wikiUrl: `https://en.wikipedia.org/wiki/${name.replace(/\s+/g, '_')}`,
            imageUrl: taxon.default_photo?.url || taxon.default_photo?.square_url || null
          };
        });

      return NextResponse.json({ suggestions });
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // FALLBACK: Return demo data on any error
      const shuffled = [...DEMO_HERBS].sort(() => 0.5 - Math.random());
      return NextResponse.json({ 
        suggestions: shuffled.slice(0, 2),
        fallback: true,
        message: 'Service temporarily unavailable. Showing demo herbs.'
      });
    }
    
  } catch (error: any) {
    console.error('Identification error:', error);
    
    // FALLBACK: Return demo data
    const shuffled = [...DEMO_HERBS].sort(() => 0.5 - Math.random());
    return NextResponse.json({ 
      suggestions: shuffled.slice(0, 2),
      fallback: true,
      message: 'Unable to identify. Showing sample African herbs.'
    });
  }
}
'use server';

// Simple AI functions that work without complex dependencies
export async function searchHerbs(query: string) {
  // Mock database - replace with Firebase later
  const herbs = [
    { id: '1', name: 'Moringa', ailments: ['diabetes', 'fatigue'], icon: '🌿' },
    { id: '2', name: 'Neem', ailments: ['malaria', 'skin'], icon: '🍃' },
    { id: '3', name: 'Bitter Leaf', ailments: ['malaria', 'stomach'], icon: '🌱' },
  ];
  
  const results = herbs.filter(h => 
    h.name.toLowerCase().includes(query.toLowerCase()) ||
    h.ailments.some(a => a.includes(query.toLowerCase()))
  );
  
  return { success: true, data: results };
}

export async function getHerbBySlug(slug: string) {
  const herbs: any = {
    'moringa': { name: 'Moringa', description: 'Miracle tree', icon: '🌿' },
    'neem': { name: 'Neem', description: 'Natural antibiotic', icon: '🍃' },
  };
  
  return { success: true, data: herbs[slug] || null };
}
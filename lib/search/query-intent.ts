export type SearchExplainMode = 'plant' | 'condition';

export function resolveSearchIntent(params: {
  intent?: string | null;
  source?: string | null;
  mode?: string | null;
}): SearchExplainMode {
  const intent = String(params.intent || params.mode || '').trim().toLowerCase();
  const source = String(params.source || '').trim().toLowerCase();
  if (intent === 'plant') return 'plant';
  if (intent === 'condition') return 'condition';
  if (source === 'identify' || source === 'herb_identifier' || source === 'photo') {
    return 'plant';
  }
  return 'condition';
}

export function identifiedPlantSearchHref(plant: {
  commonName?: string | null;
  scientificName?: string | null;
  name?: string | null;
}): string {
  const scientific = String(plant.scientificName || plant.name || '').trim();
  const common = String(plant.commonName || '').trim();
  const query = common || scientific;
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('intent', 'plant');
  if (scientific) params.set('scientific', scientific);
  params.set('source', 'identify');
  return `/search?${params.toString()}`;
}

export function plantMatchQuery(query: string, scientificName?: string | null): string {
  const names = [query, scientificName]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  return Array.from(new Set(names)).join(' ');
}

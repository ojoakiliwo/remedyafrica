/**
 * Public catalogue rules: only show plants (and fungi used as herbs).
 * Animal TCM materia medica stays in Firestore for admin, but must not
 * appear as "herbal remedies" — that reads as a lie to households.
 */

const ANIMAL_NAMES = new Set(
  ['ji nei jin', 'hai long', 'lu rong', 'hai ma', 'ge jie'].map((n) => n.toLowerCase())
);

const ANIMAL_GENERA = [
  'gallus',
  'cervus',
  'hippocampus',
  'gekko',
  'syngnathoides',
  'syngnathus',
];

const ANIMAL_PARTS = /\bgizzard\b|\bwhole animal\b|\bantler\b|deer velvet|pipefish|seahorse|tokay gecko|chicken gizzard/i;

export type TrustHerb = {
  id?: string;
  name?: string;
  scientificName?: string;
  description?: string;
  origin?: string;
  partsUsed?: string;
};

function genus(scientificName?: string): string {
  return (scientificName || '').trim().split(/\s+/)[0]?.toLowerCase() || '';
}

export function isAnimalDerivedHerb(herb: TrustHerb): boolean {
  const name = (herb.name || '').trim().toLowerCase();
  if (ANIMAL_NAMES.has(name)) return true;
  if (ANIMAL_GENERA.includes(genus(herb.scientificName))) return true;
  const blob = `${herb.partsUsed || ''} ${herb.description || ''}`;
  return ANIMAL_PARTS.test(blob);
}

export function isPublicCatalogHerb(herb: TrustHerb): boolean {
  return !isAnimalDerivedHerb(herb);
}

export function publicCatalogHerbs<T extends TrustHerb>(herbs: T[]): T[] {
  return herbs.filter(isPublicCatalogHerb);
}

export function herbOriginLabel(origin?: string): string {
  const value = (origin || '').trim();
  return value || 'Traditional use';
}

/** Prefer well-known African botanicals on the homepage, never the Firestore dump order. */
export const FEATURED_HERB_NAMES = [
  'Sutherlandia',
  'African Wormwood',
  'Pelargonium',
  'Buchu',
  'African Ginger',
  'Imphepho',
  'African Potato',
  'Cryptolepis',
  'Aloe Vera',
  'Tamarind',
  'Honeybush',
  'African Cherry',
  'White Ginger',
  'Artemisia',
  'Moringa',
  'Roselle',
  'Ginger',
  'Neem',
];

export function pickFeaturedHerbs<T extends TrustHerb>(
  herbs: T[],
  count: number,
  hasImage: (herb: T) => boolean
): T[] {
  const publicHerbs = publicCatalogHerbs(herbs);
  const byName = new Map(publicHerbs.map((herb) => [(herb.name || '').toLowerCase(), herb]));
  const ranked: T[] = [];
  const seen = new Set<string>();

  const push = (herb?: T) => {
    if (!herb) return;
    const key = (herb.id || herb.name || '').toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    ranked.push(herb);
  };

  for (const name of FEATURED_HERB_NAMES) {
    push(byName.get(name.toLowerCase()));
  }

  const african = publicHerbs.filter((herb) => /africa/i.test(herb.origin || ''));
  for (const herb of african) push(herb);

  const withPhotos = ranked.filter(hasImage);
  const withoutPhotos = ranked.filter((herb) => !hasImage(herb));
  return [...withPhotos, ...withoutPhotos].slice(0, count);
}

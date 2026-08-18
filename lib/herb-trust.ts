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
  commonNames?: string[] | string;
};

export type FeaturedHerbSpec = {
  name: string;
  scientificName?: string;
  aliases?: string[];
};

/** Everyday West African / Nigerian plants people can find in compounds and markets. */
export const FEATURED_HOUSEHOLD_HERBS: FeaturedHerbSpec[] = [
  { name: 'Bitter Leaf', scientificName: 'Vernonia amygdalina' },
  {
    name: 'Scent Leaf',
    scientificName: 'Ocimum gratissimum',
    aliases: ['African Basil (Scent Leaf)', 'African Basil'],
  },
  { name: 'Moringa', scientificName: 'Moringa oleifera' },
  { name: 'Neem', scientificName: 'Azadirachta indica', aliases: ['Neem (Dogoyaro)', 'Dogoyaro'] },
  { name: 'Ginger', scientificName: 'Zingiber officinale' },
  { name: 'Zobo', scientificName: 'Hibiscus sabdariffa', aliases: ['Roselle'] },
  { name: 'Lemon Grass', scientificName: 'Cymbopogon citratus', aliases: ['Lemongrass'] },
  { name: 'Guava Leaf', scientificName: 'Psidium guajava' },
  { name: 'Pawpaw Leaf', scientificName: 'Carica papaya', aliases: ['Papaya Leaf'] },
  { name: 'Aloe Vera', scientificName: 'Aloe vera' },
  { name: 'Garlic', scientificName: 'Allium sativum' },
  { name: 'Turmeric', scientificName: 'Curcuma longa' },
  { name: 'Bitter Kola', scientificName: 'Garcinia kola' },
  { name: 'Utazi', scientificName: 'Gongronema latifolium' },
  { name: 'Uziza', scientificName: 'Piper guineense' },
  {
    name: 'Alligator Pepper',
    scientificName: 'Aframomum melegueta',
    aliases: ['Grains of Paradise'],
  },
  { name: 'Miracle Leaf', scientificName: 'Kalanchoe pinnata' },
  { name: 'Fluted Pumpkin', scientificName: 'Telfairia occidentalis', aliases: ['Ugu'] },
  { name: 'Baobab', scientificName: 'Adansonia digitata' },
  { name: 'Shea Butter', scientificName: 'Vitellaria paradoxa' },
  { name: 'Tamarind', scientificName: 'Tamarindus indica' },
];

/** @deprecated Use FEATURED_HOUSEHOLD_HERBS. Kept for older call sites. */
export const FEATURED_HERB_NAMES = FEATURED_HOUSEHOLD_HERBS.map((spec) => spec.name);

function norm(value?: string): string {
  return (value || '').trim().toLowerCase();
}

function matchesFeaturedSpec(herb: TrustHerb, spec: FeaturedHerbSpec): boolean {
  const name = norm(herb.name);
  const sci = norm(herb.scientificName);
  if (name && name === norm(spec.name)) return true;
  if (sci && spec.scientificName && sci === norm(spec.scientificName)) return true;
  return (spec.aliases || []).some((alias) => name === norm(alias));
}

export function herbCommonNames(herb: TrustHerb): string[] {
  const value = herb.commonNames;
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/[;|,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function herbLocalNamesLabel(herb: TrustHerb): string {
  const names = herbCommonNames(herb).filter((item) => norm(item) !== norm(herb.name));
  return names.slice(0, 3).join(' · ');
}

function originRank(origin?: string): number {
  const value = origin || '';
  if (/nigeria|west africa/i.test(value)) return 0;
  if (/africa/i.test(value)) return 1;
  return 2;
}

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

/**
 * Homepage preview: common Nigerian/West African plants first,
 * even when they have no photo. Photos only break ties among fillers.
 */
export function pickFeaturedHerbs<T extends TrustHerb>(
  herbs: T[],
  count: number,
  hasImage: (herb: T) => boolean = () => false
): T[] {
  const publicHerbs = publicCatalogHerbs(herbs);
  const ranked: T[] = [];
  const seen = new Set<string>();

  const push = (herb?: T) => {
    if (!herb) return;
    const key = (herb.id || herb.name || herb.scientificName || '').toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    ranked.push(herb);
  };

  for (const spec of FEATURED_HOUSEHOLD_HERBS) {
    const match = publicHerbs.find((herb) => matchesFeaturedSpec(herb, spec));
    push(match);
    if (ranked.length >= count) return ranked.slice(0, count);
  }

  const fillers = publicHerbs
    .filter((herb) => !ranked.includes(herb))
    .sort((a, b) => {
      const originDiff = originRank(a.origin) - originRank(b.origin);
      if (originDiff !== 0) return originDiff;
      return Number(hasImage(b)) - Number(hasImage(a));
    });

  for (const herb of fillers) {
    push(herb);
    if (ranked.length >= count) break;
  }

  return ranked.slice(0, count);
}

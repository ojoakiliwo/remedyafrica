/**
 * Single source of truth for matching herbs to ailments.
 *
 * Herb records almost never have an `ailments` field. Counts must come from
 * the same keyword scan the detail page uses — never from a second algorithm
 * or from hardcoded placeholders.
 */

import { isPublicCatalogHerb } from '@/lib/herb-trust';

export type MatchableHerb = {
  id?: string;
  name?: string;
  scientificName?: string;
  description?: string;
  longDescription?: string;
  benefits?: string[] | string;
  uses?: string[] | string;
  medicinalUses?: Array<string | { condition?: string }> | string;
  ailments?: string[] | string;
  preparation?: string;
  partsUsed?: string;
};

export type AilmentMatchInput = {
  id?: string;
  name: string;
  searchKeywords?: string[];
};

function flattenField(value: MatchableHerb[keyof MatchableHerb]): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === 'string') return [item];
      if (item && typeof item === 'object' && 'condition' in item && item.condition) {
        return [String(item.condition)];
      }
      return [];
    });
  }
  if (typeof value === 'string') {
    return value.split(/[;|]/).map((part) => part.trim()).filter(Boolean);
  }
  return [];
}

/** Normalize for matching: lowercase, strip punctuation, collapse space. */
export function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "'")
    .replace(/[^a-z0-9+']+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * True when `phrase` appears as whole words in `haystack`.
 * "pain" will not match "spain"; "memory" will match "memory support".
 */
function simplePlurals(phrase: string): string[] {
  const p = normalizeForMatch(phrase);
  if (p.length < 3) return [];
  const variants = [p];
  if (!p.endsWith('s') && !p.endsWith('x') && !p.endsWith('ch')) {
    variants.push(`${p}s`);
  }
  return variants;
}

export function containsPhrase(haystack: string, phrase: string): boolean {
  const h = normalizeForMatch(haystack);
  if (!h) return false;
  const padded = ` ${h} `;
  return simplePlurals(phrase).some((variant) => padded.includes(` ${variant} `));
}

export function herbSearchText(herb: MatchableHerb): string {
  const parts = [
    herb.name,
    herb.scientificName,
    herb.description,
    herb.longDescription,
    ...flattenField(herb.benefits),
    ...flattenField(herb.uses),
    ...flattenField(herb.medicinalUses),
    ...flattenField(herb.ailments),
    herb.preparation,
    herb.partsUsed,
  ].filter(Boolean) as string[];

  return parts.join(' ');
}

export function herbMatchesKeywords(herb: MatchableHerb, keywords: string[]): boolean {
  const text = herbSearchText(herb);
  return keywords.some((keyword) => containsPhrase(text, keyword));
}

export function ailmentMatchKeywords(ailment: AilmentMatchInput): string[] {
  const fromName = ailment.name ? [ailment.name] : [];
  const fromList = ailment.searchKeywords || [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...fromName, ...fromList]) {
    const key = normalizeForMatch(raw);
    if (key.length < 3 || seen.has(key)) continue;
    seen.add(key);
    out.push(raw);
  }
  return out;
}

export function herbMatchesAilment(herb: MatchableHerb, ailment: AilmentMatchInput): boolean {
  return herbMatchesKeywords(herb, ailmentMatchKeywords(ailment));
}

export function findMatchingHerbs<T extends MatchableHerb>(
  herbs: T[],
  ailment: AilmentMatchInput
): T[] {
  return herbs.filter(
    (herb) => isPublicCatalogHerb(herb) && herbMatchesAilment(herb, ailment)
  );
}

export function countMatchingHerbs(herbs: MatchableHerb[], ailment: AilmentMatchInput): number {
  return findMatchingHerbs(herbs, ailment).length;
}

export function uniqueHerbsMatchingAnyAilment<T extends MatchableHerb>(
  herbs: T[],
  ailments: AilmentMatchInput[]
): T[] {
  const seen = new Set<string>();
  const matched: T[] = [];
  for (const herb of herbs) {
    if (!isPublicCatalogHerb(herb)) continue;
    if (!ailments.some((ailment) => herbMatchesAilment(herb, ailment))) continue;
    const key = herb.id || herb.name || String(matched.length);
    if (seen.has(key)) continue;
    seen.add(key);
    matched.push(herb);
  }
  return matched;
}

export type CategorySlug =
  | 'mental-wellness'
  | 'pain-relief'
  | 'digestive-health'
  | 'immune-support'
  | 'skin-care'
  | 'respiratory';

export type CategoryVisual = {
  slug: CategorySlug;
  name: string;
  description: string;
  shortLabel: string;
};

export const CATEGORY_CATALOG: CategoryVisual[] = [
  {
    slug: 'mental-wellness',
    name: 'Mental Wellness',
    shortLabel: 'Mind',
    description: 'Calm, sleep, mood, and cognitive support drawn from traditional practice.',
  },
  {
    slug: 'pain-relief',
    name: 'Pain Relief',
    shortLabel: 'Ease',
    description: 'Headache, joints, menstrual discomfort, and everyday aches.',
  },
  {
    slug: 'digestive-health',
    name: 'Digestive Health',
    shortLabel: 'Gut',
    description: 'Stomach ease, regularity, and traditional digestive tonics.',
  },
  {
    slug: 'immune-support',
    name: 'Immune Support',
    shortLabel: 'Guard',
    description: 'Fevers, recovery, and herbs families reach for when illness visits.',
  },
  {
    slug: 'skin-care',
    name: 'Skin Care',
    shortLabel: 'Skin',
    description: 'Soothing, clearing, and wound-care plants for skin and scalp.',
  },
  {
    slug: 'respiratory',
    name: 'Respiratory Health',
    shortLabel: 'Breath',
    description: 'Cough, congestion, and breathing support from kitchen and clinic herbs.',
  },
];

export const CATEGORY_BY_SLUG = Object.fromEntries(
  CATEGORY_CATALOG.map((category) => [category.slug, category])
) as Record<CategorySlug, CategoryVisual>;

export function getCategoryVisual(slug: string): CategoryVisual | undefined {
  return CATEGORY_BY_SLUG[slug as CategorySlug];
}

export function isCategorySlug(slug: string): slug is CategorySlug {
  return slug in CATEGORY_BY_SLUG;
}

export interface HerbEntry {
  // Basic Info
  name: string;                    // Common name (e.g., "Moringa")
  scientificName: string;          // Binomial nomenclature
  family: string;                  // Plant family
  commonNames: string[];           // Regional/local names
  
  // Description
  description: string;             // General plant description
  habitat: string;               // Where it grows naturally
  appearance: string;            // Physical description for identification
  
  // Medicinal Info
  medicinalUses: {
    condition: string;             // What it treats
    preparation: string;           // How to prepare it
    dosage: string;                // Recommended dosage
    evidenceLevel: 'traditional' | 'preliminary' | 'clinical' | 'well-established';
  }[];
  
  // Traditional Knowledge
  traditionalUses: string[];       // Cultural/traditional applications
  partsUsed: string[];             // Leaves, roots, bark, etc.
  preparationMethods: string[];    // Decoction, infusion, poultice, etc.
  
  // Safety
  contraindications: string[];     // Who should NOT use it
  sideEffects: string[];           // Known adverse effects
  interactions: string[];          // Drug interactions
  pregnancySafety: 'safe' | 'caution' | 'avoid' | 'unknown';
  
  // Regional Info
  regions: string[];               // African regions where found
  availability: 'common' | 'seasonal' | 'rare' | 'cultivated';
  
  // Metadata
  category: string;                // For navigation (e.g., "Immune Support")
  tags: string[];                  // Search keywords
  status: 'draft' | 'review' | 'published';
  createdAt: Date;
  updatedAt: Date;
  verifiedBy?: string;           // Expert who verified
}

export const emptyHerbTemplate: HerbEntry = {
  name: "",
  scientificName: "",
  family: "",
  commonNames: [],
  description: "",
  habitat: "",
  appearance: "",
  medicinalUses: [],
  traditionalUses: [],
  partsUsed: [],
  preparationMethods: [],
  contraindications: [],
  sideEffects: [],
  interactions: [],
  pregnancySafety: 'unknown',
  regions: [],
  availability: 'common',
  category: "",
  tags: [],
  status: 'draft',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Predefined categories for African traditional medicine
export const herbCategories = [
  "Immune Support",
  "Digestive Health",
  "Respiratory Health",
  "Skin Conditions",
  "Pain Relief",
  "Malaria & Fever",
  "Diabetes Management",
  "Hypertension",
  "Women's Health",
  "Men's Health",
  "Mental Wellness",
  "Wound Healing",
  "Detoxification",
  "Energy & Vitality",
  "Sleep & Relaxation"
];

// Common preparation methods
export const preparationMethods = [
  "Decoction (boiled)",
  "Infusion (tea)",
  "Poultice (crushed applied to skin)",
  "Tincture (alcohol extract)",
  "Powder",
  "Steam inhalation",
  "Bath soak",
  "Gargle",
  "Syrup"
];

// African regions
export const africanRegions = [
  "West Africa",
  "East Africa",
  "Southern Africa",
  "Central Africa",
  "North Africa",
  "Sahel Region",
  "Congo Basin",
  "Ethiopian Highlands"
];
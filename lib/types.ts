export interface Ailment {
  id: string;
  name: string;
  category: string; // e.g., 'mental-wellness'
  description: string;
  symptoms: string[];
  medicalDisclaimer: string;
  associatedHerbs: string[]; // Array of herb IDs
  createdAt: Date;
}

export interface Herb {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  ailments: string[]; // Array of ailment names/IDs it treats
  // ... rest of your herb fields
}
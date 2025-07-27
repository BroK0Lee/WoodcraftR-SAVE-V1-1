import { create } from 'zustand';

export interface Material {
  name: string;
  image: string;
  id: string;
}

export interface MaterialDetails {
  images: string[];
  characteristics: {
    density: string;
    hardness: string;
    durability: string;
    color: string;
  };
  applications: string[];
  recommendations: string[];
  description: string;
}

// État par défaut "Aucune matière"
export const NO_MATERIAL: Material = {
  id: 'none',
  name: 'Aucune matière',
  image: '/placeholder-material.svg' // Nous créerons ce placeholder
};

interface MaterialStore {
  selectedMaterial: Material | null;
  setSelectedMaterial: (material: Material | null) => void;
  resetToDefault: () => void;
}

export const useMaterialStore = create<MaterialStore>((set) => ({
  selectedMaterial: NO_MATERIAL, // Initialisation avec l'état par défaut
  setSelectedMaterial: (material) => set({ selectedMaterial: material }),
  resetToDefault: () => set({ selectedMaterial: NO_MATERIAL }),
}));

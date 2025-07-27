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

interface MaterialStore {
  selectedMaterial: Material | null;
  setSelectedMaterial: (material: Material | null) => void;
}

export const useMaterialStore = create<MaterialStore>((set) => ({
  selectedMaterial: null,
  setSelectedMaterial: (material) => set({ selectedMaterial: material }),
}));

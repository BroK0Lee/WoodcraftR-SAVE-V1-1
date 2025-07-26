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
  isMaterialSelectorOpen: boolean;
  setSelectedMaterial: (material: Material | null) => void;
  setMaterialSelectorOpen: (open: boolean) => void;
}

export const useMaterialStore = create<MaterialStore>((set) => ({
  selectedMaterial: null,
  isMaterialSelectorOpen: false,
  setSelectedMaterial: (material) => set({ selectedMaterial: material }),
  setMaterialSelectorOpen: (open) => set({ isMaterialSelectorOpen: open }),
}));

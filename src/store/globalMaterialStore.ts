/**
 * Store global unifié pour les matériaux
 * Cache persistant entre les navigations et préchargement au démarrage
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Interface unifiée des matériaux (basée sur les images locales)
export interface GlobalWoodMaterial {
  id: string;
  name: string;
  displayName: string;
  image: string; // URL de l'image locale (_basecolor.jpg)
  price: number;
  description: string;
  characteristics: {
    generalDescription: string;
    colorAspect: {
      dominantColor: string;
      variations: string;
      grain: string;
    };
    density: {
      typical: string;
      range: string;
      value: number;
      unit: string;
    };
    hardness: {
      classification: string;
      janka?: string;
      value: number;
      unit: string;
    };
    workability: {
      cutting: string;
      drilling: string;
      finishing: string;
    };
    appearance: {
      grain: string;
      color: string;
      texture: string;
    };
    sustainability: {
      origin: string;
      certification: string;
      carbon_impact: string;
    };
    applications: string[];
  };
  metadata: {
    folder: string;
    hasNormalMap: boolean;
    hasRoughnessMap: boolean;
    hasAOMap: boolean;
  };
}

interface GlobalMaterialState {
  // État de chargement
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  
  // Données des matériaux
  materials: GlobalWoodMaterial[];
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMaterials: (materials: GlobalWoodMaterial[]) => void;
  getMaterialById: (id: string) => GlobalWoodMaterial | undefined;
  clearCache: () => void;
}

export const useGlobalMaterialStore = create<GlobalMaterialState>()(
  devtools(
    (set, get) => ({
      // État initial
      isLoading: false,
      isLoaded: false,
      error: null,
      materials: [],
      
      // Actions
      setLoading: (loading: boolean) => 
        set({ isLoading: loading }, false, 'setLoading'),
      
      setError: (error: string | null) => 
        set({ error, isLoading: false }, false, 'setError'),
      
      setMaterials: (materials: GlobalWoodMaterial[]) => 
        set({ 
          materials, 
          isLoaded: true, 
          isLoading: false, 
          error: null 
        }, false, 'setMaterials'),
      
      getMaterialById: (id: string) => 
        get().materials.find(material => material.id === id),
      
      clearCache: () => 
        set({ 
          materials: [], 
          isLoaded: false, 
          isLoading: false, 
          error: null 
        }, false, 'clearCache'),
    }),
    {
      name: 'global-material-store',
    }
  )
);

import { create } from "zustand";
import { materialPreloader } from "@/services/materialPreloader";

interface LoadingState {
  isAppLoading: boolean;
  isWorkerReady: boolean; // OpenCascade worker
  isMaterialsLoaded: boolean;
  isComponentsLoaded: boolean;
  isWoodMaterialSelectorLoaded: boolean;
  setAppLoading: (loading: boolean) => void;
  setWorkerReady: (ready: boolean) => void;
  setMaterialsLoaded: (loaded: boolean) => void;
  setComponentsLoaded: (loaded: boolean) => void;
  setWoodMaterialSelectorLoaded: (loaded: boolean) => void;
  initializeApp: () => Promise<void>;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  isAppLoading: true,
  isWorkerReady: false,
  isMaterialsLoaded: false,
  isComponentsLoaded: false,
  isWoodMaterialSelectorLoaded: false,

  setAppLoading: (loading) => set({ isAppLoading: loading }),
  setWorkerReady: (ready) => set({ isWorkerReady: ready }),
  setMaterialsLoaded: (loaded) => set({ isMaterialsLoaded: loaded }),
  setComponentsLoaded: (loaded) => set({ isComponentsLoaded: loaded }),
  setWoodMaterialSelectorLoaded: (loaded) =>
    set({ isWoodMaterialSelectorLoaded: loaded }),

  initializeApp: async () => {
    const state = get();

    try {
      // Étape 0: S'assurer que le worker est prêt AVANT de charger les matières
      // (polling simple; l'écran de chargement prend en charge le feedback visuel)
      while (!get().isWorkerReady) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Étape 1: Charger les matières + précharger les images (cache navigateur)
      if (!state.isMaterialsLoaded) {
        await materialPreloader.preloadMaterials();
        set({ isMaterialsLoaded: true });
      }

      // Étape 2: Initialiser les composants (UI non-bloquante)
      if (!state.isComponentsLoaded) {
        set({ isComponentsLoaded: true });
      }

      // Pas de finalisation ici - on attend que le worker et WoodMaterialSelector soient prêts
    } catch (error) {
      console.error("Erreur lors de l'initialisation de l'application:", error);
      // En cas d'erreur, on continue quand même
      set({
        isMaterialsLoaded: true,
        isComponentsLoaded: true,
      });
    }
  },
}));

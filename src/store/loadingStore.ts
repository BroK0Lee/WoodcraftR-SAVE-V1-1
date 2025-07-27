import { create } from 'zustand';

interface LoadingState {
  isAppLoading: boolean;
  isOpenCascadeLoaded: boolean;
  isMaterialsLoaded: boolean;
  isComponentsLoaded: boolean;
  setAppLoading: (loading: boolean) => void;
  setOpenCascadeLoaded: (loaded: boolean) => void;
  setMaterialsLoaded: (loaded: boolean) => void;
  setComponentsLoaded: (loaded: boolean) => void;
  initializeApp: () => Promise<void>;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  isAppLoading: true,
  isOpenCascadeLoaded: false,
  isMaterialsLoaded: false,
  isComponentsLoaded: false,
  
  setAppLoading: (loading) => set({ isAppLoading: loading }),
  setOpenCascadeLoaded: (loaded) => set({ isOpenCascadeLoaded: loaded }),
  setMaterialsLoaded: (loaded) => set({ isMaterialsLoaded: loaded }),
  setComponentsLoaded: (loaded) => set({ isComponentsLoaded: loaded }),
  
  initializeApp: async () => {
    const state = get();
    
    try {
      // Étape 1: Initialiser OpenCascade
      if (!state.isOpenCascadeLoaded) {
        // L'initialisation d'OpenCascade sera gérée par initOcc.ts
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulation
        set({ isOpenCascadeLoaded: true });
      }
      
      // Étape 2: Charger les matières
      if (!state.isMaterialsLoaded) {
        // Précharger les images des matières si nécessaire
        await new Promise(resolve => setTimeout(resolve, 100));
        set({ isMaterialsLoaded: true });
      }
      
      // Étape 3: Initialiser les composants
      if (!state.isComponentsLoaded) {
        await new Promise(resolve => setTimeout(resolve, 100));
        set({ isComponentsLoaded: true });
      }
      
      // Finalisation
      set({ isAppLoading: false });
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'application:', error);
      // En cas d'erreur, on continue quand même
      set({ 
        isAppLoading: false,
        isOpenCascadeLoaded: true,
        isMaterialsLoaded: true,
        isComponentsLoaded: true
      });
    }
  }
}));

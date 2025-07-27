import { useEffect, useState } from 'react';
import { initOcc } from '@/helpers/initOcc';
import { usePanelStore } from '@/store/panelStore';
import { useLoadingStore } from '@/store/loadingStore';

let occInstance: any = null;

export function useOpenCascadeInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setOpenCascadeLoaded } = useLoadingStore();
  const { dimensions } = usePanelStore();

  useEffect(() => {
    const initializeOpenCascade = async () => {
      try {
        if (occInstance) {
          setIsInitialized(true);
          setOpenCascadeLoaded(true);
          return;
        }

        console.log('🔧 Initialisation OpenCascade...');
        
        // Initialiser OpenCascade
        occInstance = await initOcc();
        
        console.log('✅ OpenCascade initialisé avec succès');
        
        // Créer un panel par défaut avec les dimensions du store
        createDefaultPanel();
        
        setIsInitialized(true);
        setOpenCascadeLoaded(true);
        
      } catch (err) {
        console.error('❌ Erreur lors de l\'initialisation OpenCascade:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        // On marque quand même comme chargé pour ne pas bloquer l'app
        setOpenCascadeLoaded(true);
      }
    };

    initializeOpenCascade();
  }, [setOpenCascadeLoaded]);

  const createDefaultPanel = () => {
    if (!occInstance) return;

    try {
      console.log('🏗️ Création du panel par défaut...');
      
      // Créer un box simple avec les dimensions du store
      new occInstance.BRepPrimAPI_MakeBox_2(
        dimensions.length,
        dimensions.width, 
        dimensions.thickness
      );
      
      console.log(`📦 Panel créé: ${dimensions.length}x${dimensions.width}x${dimensions.thickness}mm`);
      
      // Le panel sera géré par le store existant
      
    } catch (err) {
      console.error('❌ Erreur lors de la création du panel par défaut:', err);
    }
  };

  return {
    isInitialized,
    error,
    occInstance
  };
}

// Export de l'instance pour les autres composants
export const getOccInstance = () => occInstance;

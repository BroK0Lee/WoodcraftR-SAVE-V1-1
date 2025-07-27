import { useEffect, useState, useRef } from 'react';
import { useLoadingStore } from '@/store/loadingStore';
import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Cache global pour les instances 3D
interface WoodMaterialSelectorCache {
  scene: THREE.Scene | null;
  renderer: CSS3DRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  controls: OrbitControls | null;
  materialSphere: any | null; // Instance de MaterialSphere
  isInitialized: boolean;
  isSphereCreated: boolean;
}

let globalCache: WoodMaterialSelectorCache = {
  scene: null,
  renderer: null,
  camera: null,
  controls: null,
  materialSphere: null,
  isInitialized: false,
  isSphereCreated: false
};

export function useWoodMaterialSelectorInit() {
  const [isInitialized, setIsInitialized] = useState(globalCache.isInitialized);
  const [error, setError] = useState<string | null>(null);
  const { setWoodMaterialSelectorLoaded } = useLoadingStore();
  const initializationInProgress = useRef(false);

  useEffect(() => {
    const initializeWoodMaterialSelector = async () => {
      try {
        // Si déjà initialisé, marquer comme prêt
        if (globalCache.isInitialized) {
          setIsInitialized(true);
          setWoodMaterialSelectorLoaded(true);
          return;
        }

        // Éviter les initialisations multiples simultanées
        if (initializationInProgress.current) {
          return;
        }

        initializationInProgress.current = true;
        console.log('🎨 Initialisation WoodMaterialSelector...');

        // Créer les instances 3D de base (sans montage DOM)
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        const renderer = new CSS3DRenderer();

        // Configuration de base
        camera.position.set(0, 0, 400);
        renderer.setSize(800, 600); // Taille par défaut, sera ajustée au montage

        // Sauvegarder dans le cache global
        globalCache = {
          scene,
          renderer,
          camera,
          controls: null, // Les controls seront créés au montage
          materialSphere: null, // Sera créé au premier montage
          isInitialized: true,
          isSphereCreated: false
        };

        console.log('✅ WoodMaterialSelector initialisé avec succès (cache)');
        
        setIsInitialized(true);
        setWoodMaterialSelectorLoaded(true);
        
      } catch (err) {
        console.error('❌ Erreur lors de l\'initialisation WoodMaterialSelector:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        // Marquer comme chargé même en cas d'erreur pour ne pas bloquer l'app
        setWoodMaterialSelectorLoaded(true);
      } finally {
        initializationInProgress.current = false;
      }
    };

    initializeWoodMaterialSelector();
  }, [setWoodMaterialSelectorLoaded]);

  // Méthode pour monter le renderer dans un élément DOM
  const mountRenderer = (element: HTMLElement): CSS3DRenderer | null => {
    if (!globalCache.isInitialized || !globalCache.renderer) {
      console.warn('WoodMaterialSelector pas encore initialisé');
      return null;
    }

    try {
      // Ajuster la taille au conteneur
      const { clientWidth, clientHeight } = element;
      globalCache.renderer.setSize(clientWidth, clientHeight);
      
      if (globalCache.camera) {
        globalCache.camera.aspect = clientWidth / clientHeight;
        globalCache.camera.updateProjectionMatrix();
      }

      // Monter le DOM element
      element.appendChild(globalCache.renderer.domElement);

      // Créer les controls s'ils n'existent pas
      if (!globalCache.controls && globalCache.camera) {
        globalCache.controls = new OrbitControls(globalCache.camera, globalCache.renderer.domElement);
        globalCache.controls.enableDamping = true;
        globalCache.controls.dampingFactor = 0.05;
      }

      console.log('✅ WoodMaterialSelector monté dans le DOM');
      return globalCache.renderer;
      
    } catch (err) {
      console.error('❌ Erreur lors du montage WoodMaterialSelector:', err);
      return null;
    }
  };

  // Méthode pour démonter le renderer
  const unmountRenderer = (element: HTMLElement): void => {
    if (!globalCache.renderer) return;

    try {
      if (element.contains(globalCache.renderer.domElement)) {
        element.removeChild(globalCache.renderer.domElement);
      }
      console.log('✅ WoodMaterialSelector démonté du DOM');
    } catch (err) {
      console.error('❌ Erreur lors du démontage WoodMaterialSelector:', err);
    }
  };

  // Méthode pour obtenir les instances du cache
  const getCachedInstances = () => {
    return {
      scene: globalCache.scene,
      renderer: globalCache.renderer,
      camera: globalCache.camera,
      controls: globalCache.controls,
      materialSphere: globalCache.materialSphere,
      isSphereCreated: globalCache.isSphereCreated
    };
  };

  // Méthode pour sauvegarder la sphère dans le cache
  const setCachedSphere = (materialSphere: any) => {
    globalCache.materialSphere = materialSphere;
    globalCache.isSphereCreated = true;
    console.log('💾 [useWoodMaterialSelectorInit] Sphère sauvegardée dans le cache');
  };

  // Nettoyage complet du cache (pour les tests ou réinitialisations)
  const clearCache = () => {
    if (globalCache.controls) {
      globalCache.controls.dispose();
    }
    if (globalCache.renderer) {
      globalCache.renderer.domElement.remove();
    }
    
    // Nettoyer la sphère si elle existe
    if (globalCache.materialSphere) {
      globalCache.materialSphere.destroy();
    }
    
    globalCache = {
      scene: null,
      renderer: null,
      camera: null,
      controls: null,
      materialSphere: null,
      isInitialized: false,
      isSphereCreated: false
    };
    
    setIsInitialized(false);
    console.log('🧹 Cache WoodMaterialSelector nettoyé');
  };

  return {
    isInitialized,
    error,
    mountRenderer,
    unmountRenderer,
    getCachedInstances,
    setCachedSphere,
    clearCache
  };
}

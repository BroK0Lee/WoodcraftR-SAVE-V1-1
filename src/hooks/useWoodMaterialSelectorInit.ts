import { useEffect, useState, useRef } from 'react';
import { useLoadingStore } from '@/store/loadingStore';
import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { TweenGroup } from '@/lib/tween';
import { materialPreloader } from '@/services/materialPreloader';

// Cache global pour les instances 3D
interface WoodMaterialSelectorCache {
  scene: THREE.Scene | null;
  renderer: CSS3DRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  controls: TrackballControls | null;
  materialSphere: any | null; // Instance de MaterialSphere
  isInitialized: boolean;
  isSphereCreated: boolean;
  animationId: number | null; // ID de l'animation pour pouvoir l'arrêter
}

let globalCache: WoodMaterialSelectorCache = {
  scene: null,
  renderer: null,
  camera: null,
  controls: null,
  materialSphere: null,
  isInitialized: false,
  isSphereCreated: false,
  animationId: null
};

// Boucle d'animation globale (identique à l'exemple Three.js original)
function animate() {
  globalCache.animationId = requestAnimationFrame(animate);
  
  // Mettre à jour TWEEN.js (CRUCIAL pour les transformations)
  TweenGroup.update();
  
  // Mettre à jour les controls si ils existent
  if (globalCache.controls) {
    globalCache.controls.update();
  }
  
  // Render automatique si on a tout ce qu'il faut
  if (globalCache.renderer && globalCache.scene && globalCache.camera) {
    globalCache.renderer.render(globalCache.scene, globalCache.camera);
  }
}

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

        // Précharger les matériaux en arrière-plan
        materialPreloader.preloadMaterials().catch(error => {
          console.warn('⚠️ Erreur lors du préchargement des matériaux:', error);
          // Continuer l'initialisation même si le préchargement échoue
        });

        // Créer les instances 3D de base (sans montage DOM)
        const scene = new THREE.Scene();
        
        // === CAMÉRA IDENTIQUE À L'EXEMPLE THREE.JS ORIGINAL ===
        const camera = new THREE.PerspectiveCamera(40, 1, 1, 10000);
        camera.position.z = 2750; // Rapproché de 3000 à 2000 pour une meilleure vision des cartes
        
        const renderer = new CSS3DRenderer();
        renderer.setSize(800, 600);           // Taille par défaut, sera ajustée au montage

        // Sauvegarder dans le cache global
        globalCache = {
          scene,
          renderer,
          camera,
          controls: null, // Les controls seront créés au montage
          materialSphere: null, // Sera créé au premier montage
          isInitialized: true,
          isSphereCreated: false,
          animationId: null
        };

        // Démarrer la boucle d'animation globale (comme Three.js original)
        console.log('🎬 Démarrage de la boucle d\'animation globale');
        animate();

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
        globalCache.controls = new TrackballControls(globalCache.camera, globalCache.renderer.domElement);
        
        // === CONFIGURATION IDENTIQUE À L'EXEMPLE THREE.JS ORIGINAL ===
        globalCache.controls.rotateSpeed = 3.0; // Réduit de 5.0 à 3.0 pour une rotation plus douce
        globalCache.controls.minDistance = 300; // Réduit de 500 à 300 pour permettre un zoom plus proche
        globalCache.controls.maxDistance = 4000; // Réduit de 6000 à 4000 pour rester dans une plage raisonnable
        
        // Désactiver le panning (déplacement latéral)
        globalCache.controls.noPan = true;
        
        console.log('✅ TrackballControls configurés selon l\'exemple Three.js (panning désactivé)');
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
    
    // Arrêter la boucle d'animation
    if (globalCache.animationId) {
      cancelAnimationFrame(globalCache.animationId);
    }
    
    globalCache = {
      scene: null,
      renderer: null,
      camera: null,
      controls: null,
      materialSphere: null,
      isInitialized: false,
      isSphereCreated: false,
      animationId: null
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

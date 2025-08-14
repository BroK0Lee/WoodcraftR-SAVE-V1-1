import { useEffect, useState, useRef } from "react";
import { useLoadingStore } from "@/store/loadingStore";
import * as THREE from "three";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import { TweenGroup } from "@/lib/tween";
import { materialPreloader } from "@/services/materialPreloader";
// Cache global pour les instances 3D
interface WoodMaterialSelectorCache {
  scene: THREE.Scene | null;
  renderer: CSS3DRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  controls: TrackballControls | null;
  materialSphere: { destroy: () => void } | null; // Instance de MaterialSphere minimale
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
  animationId: null,
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
  const { setWoodMaterialSelectorLoaded, setSelectorStatus } =
    useLoadingStore();
  const initializationInProgress = useRef(false);
  useEffect(() => {
    const initializeWoodMaterialSelector = async () => {
      try {
        if (typeof window !== "undefined")
          console.debug("[LOAD] SELECTOR_INIT_START");
        // Si déjà initialisé, marquer comme prêt
        if (globalCache.isInitialized) {
          setIsInitialized(true);
          setWoodMaterialSelectorLoaded(true);
          setSelectorStatus("selector-ready");
          if (typeof window !== "undefined")
            console.debug("[LOAD] SELECTOR_READY (cached)");
          return;
        }
        if (initializationInProgress.current) return;
        initializationInProgress.current = true;
        materialPreloader.preloadMaterials().catch((e: unknown) => {
          console.warn(
            "[useWoodMaterialSelectorInit] preloadMaterials error:",
            e
          );
        });
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 1, 10000);
        camera.position.z = 2750;
        const renderer = new CSS3DRenderer();
        renderer.setSize(800, 600);
        globalCache = {
          scene,
          renderer,
          camera,
          controls: null,
          materialSphere: null,
          isInitialized: true,
          isSphereCreated: false,
          animationId: null,
        };
        animate();
        setIsInitialized(true);
        setWoodMaterialSelectorLoaded(true);
        setSelectorStatus("selector-ready");
        if (typeof window !== "undefined")
          console.debug("[LOAD] SELECTOR_READY");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        setWoodMaterialSelectorLoaded(true);
        setSelectorStatus("selector-error");
        if (typeof window !== "undefined")
          console.debug("[LOAD] SELECTOR_ERROR", err);
      } finally {
        initializationInProgress.current = false;
      }
    };
    initializeWoodMaterialSelector();
  }, [setWoodMaterialSelectorLoaded, setSelectorStatus]);
  // Méthode pour monter le renderer dans un élément DOM
  const mountRenderer = (element: HTMLElement): CSS3DRenderer | null => {
    if (!globalCache.isInitialized || !globalCache.renderer) {
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
        globalCache.controls = new TrackballControls(
          globalCache.camera,
          globalCache.renderer.domElement
        );
        // === CONFIGURATION IDENTIQUE À L'EXEMPLE THREE.JS ORIGINAL ===
        globalCache.controls.rotateSpeed = 3.0; // Réduit de 5.0 à 3.0 pour une rotation plus douce
        globalCache.controls.minDistance = 300; // Réduit de 500 à 300 pour permettre un zoom plus proche
        globalCache.controls.maxDistance = 4000; // Réduit de 6000 à 4000 pour rester dans une plage raisonnable
        // Désactiver le panning (déplacement latéral)
        globalCache.controls.noPan = true;
      }
      return globalCache.renderer;
    } catch (err) {
      console.warn("[useWoodMaterialSelectorInit] mountRenderer error:", err);
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
    } catch (err) {
      console.warn("[useWoodMaterialSelectorInit] unmountRenderer error:", err);
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
      isSphereCreated: globalCache.isSphereCreated,
    };
  };
  // Méthode pour sauvegarder la sphère dans le cache
  const setCachedSphere = (materialSphere: { destroy: () => void }) => {
    globalCache.materialSphere = materialSphere;
    globalCache.isSphereCreated = true;
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
      animationId: null,
    };
    setIsInitialized(false);
  };
  return {
    isInitialized,
    error,
    mountRenderer,
    unmountRenderer,
    getCachedInstances,
    setCachedSphere,
    clearCache,
  };
}

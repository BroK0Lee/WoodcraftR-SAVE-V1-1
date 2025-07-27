import { useRef, useState, useCallback } from 'react';
import { MaterialSphere, Material } from './MaterialSphere';
import { MaterialInteractionManager } from './MaterialInteractionManager';
import { useWoodMaterialSelectorInit } from '@/hooks/useWoodMaterialSelectorInit';
import * as TWEEN from '@tweenjs/tween.js';

interface UseMaterialSelectorConfig {
  materials: Material[];
  onMaterialSelect: (material: Material) => void;
  selectedMaterialId?: string;
}

export function useMaterialSelector(config: UseMaterialSelectorConfig) {
  const { materials, onMaterialSelect } = config;
  
  // État local
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Références pour les gestionnaires
  const sphereRef = useRef<MaterialSphere | null>(null);
  const interactionManagerRef = useRef<MaterialInteractionManager | null>(null);
  
  // Hook d'initialisation global
  const { 
    isInitialized, 
    mountRenderer, 
    unmountRenderer, 
    getCachedInstances,
    setCachedSphere
  } = useWoodMaterialSelectorInit();

  // Fonction pour initialiser le sélecteur de matériaux
  const initializeSelector = useCallback(async (container: HTMLElement): Promise<boolean> => {
    try {
      console.log('🚀 [useMaterialSelector] Initialisation du sélecteur...');

      // Monter le renderer dans le conteneur
      const renderer = mountRenderer(container);
      if (!renderer) {
        throw new Error('Impossible de monter le renderer');
      }

      // Récupérer les instances du cache
      const { scene, camera, controls, materialSphere, isSphereCreated } = getCachedInstances();
      if (!scene || !camera) {
        throw new Error('Instances du cache invalides');
      }

      // Réutiliser la sphère du cache ou en créer une nouvelle
      if (isSphereCreated && materialSphere) {
        console.log('♻️ [useMaterialSelector] Réutilisation de la sphère mise en cache');
        sphereRef.current = materialSphere;
        
        // Mettre à jour seulement les matériaux si nécessaire
        if (sphereRef.current) {
          sphereRef.current.updateMaterials(materials);
        }
      } else {
        console.log('🆕 [useMaterialSelector] Création d\'une nouvelle sphère');
        // Créer le gestionnaire de sphère
        sphereRef.current = new MaterialSphere(scene);
        
        // Créer la sphère de matériaux (rayon identique à l'exemple Three.js)
        sphereRef.current.createSphere({
          radius: 800,  // Même rayon que l'exemple Three.js original
          materials
        });

        // Sauvegarder dans le cache
        setCachedSphere(sphereRef.current);
      }

      // Créer le gestionnaire d'interactions
      interactionManagerRef.current = new MaterialInteractionManager({
        camera,
        container: renderer.domElement,
        onMaterialClick: onMaterialSelect
      });

      // Configurer les interactions avec les cartes matériaux
      // Attendre que les éléments DOM soient créés
      setTimeout(() => {
        if (interactionManagerRef.current) {
          interactionManagerRef.current.setupMaterialInteractions(materials);
        }
      }, 100);

      // Démarrer l'animation vers la sphère
      if (sphereRef.current) {
        sphereRef.current.transformToSphere();
      }

      // Configurer l'animation continue
      let animationId: number;
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        
        // Mettre à jour TWEEN.js (indispensable pour les animations Three.js)
        TWEEN.update();
        
        if (controls) {
          controls.update();
        }
        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };
      animationId = requestAnimationFrame(animate);

      // Stocker l'ID d'animation pour le cleanup
      (container as any)._animationId = animationId;

      setIsReady(true);
      console.log('✅ [useMaterialSelector] Sélecteur initialisé avec succès');
      return true;

    } catch (err) {
      console.error('❌ [useMaterialSelector] Erreur d\'initialisation:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    }
  }, [materials, onMaterialSelect, mountRenderer, getCachedInstances, setCachedSphere]);

  // Fonction pour nettoyer le sélecteur
  const cleanupSelector = useCallback((container: HTMLElement): void => {
    console.log('🧹 [useMaterialSelector] Nettoyage du sélecteur...');

    // Arrêter l'animation
    const animationId = (container as any)._animationId;
    if (animationId) {
      cancelAnimationFrame(animationId);
      delete (container as any)._animationId;
    }

    // Nettoyer le gestionnaire d'interactions
    if (interactionManagerRef.current) {
      interactionManagerRef.current.destroy();
      interactionManagerRef.current = null;
    }

    // Nettoyer la sphère
    if (sphereRef.current) {
      sphereRef.current.destroy();
      sphereRef.current = null;
    }

    // Démonter le renderer
    unmountRenderer(container);

    setIsReady(false);
  }, [unmountRenderer]);

  // Fonction pour mettre à jour la sélection
  const updateSelection = useCallback((_newSelectedId: string | null): void => {
    if (sphereRef.current) {
      // Recréer la sphère avec la nouvelle sélection (rayon identique à l'exemple Three.js)
      sphereRef.current.createSphere({
        radius: 800,  // Même rayon que l'exemple Three.js original
        materials
      });

      // Reconfigurer les interactions avec les nouvelles cartes matériaux
      if (interactionManagerRef.current) {
        setTimeout(() => {
          if (interactionManagerRef.current) {
            interactionManagerRef.current.setupMaterialInteractions(materials);
          }
        }, 100);
      }
    }
  }, [materials]);

  // === NOUVELLES MÉTHODES INSPIRÉES DU TABLEAU PÉRIODIQUE THREE.JS ===
  
  // Transformer vers une grille
  const transformToGrid = useCallback((): void => {
    if (sphereRef.current) {
      sphereRef.current.transformToGrid();
    }
  }, []);
  
  // Transformer vers une hélice
  const transformToHelix = useCallback((): void => {
    if (sphereRef.current) {
      sphereRef.current.transformToHelix();
    }
  }, []);
  
  // Retourner vers la sphère
  const transformToSphere = useCallback((): void => {
    if (sphereRef.current) {
      sphereRef.current.transformToSphere();
    }
  }, []);

  return {
    isReady,
    error,
    isInitialized,
    initializeSelector,
    cleanupSelector,
    updateSelection,
    // Nouvelles méthodes de transformation
    transformToGrid,
    transformToHelix,
    transformToSphere
  };
}

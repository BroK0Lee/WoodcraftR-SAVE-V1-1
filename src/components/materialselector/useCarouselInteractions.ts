import { useRef, useCallback, useEffect } from 'react';
import { Material } from './MaterialSphere';
import { MaterialCarousel3D } from './MaterialCarousel3D';

// Interface pour la configuration du hook
interface UseCarouselConfig {
  materials: Material[];
  onMaterialSelect: (material: Material) => void;
  radius?: number;
  autoRotate?: boolean;
}

// Hook pour gérer les interactions du carousel 3D
export function useCarouselInteractions(config: UseCarouselConfig) {
  const { materials, onMaterialSelect, radius = 400, autoRotate = false } = config;
  
  // Références
  const carouselRef = useRef<MaterialCarousel3D | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const autoRotateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialiser le carousel
  const initializeCarousel = useCallback((container: HTMLElement): boolean => {
    try {
      console.log('🎠 [useCarouselInteractions] Initialisation du carousel...');

      // Nettoyer l'ancien carousel si il existe
      if (carouselRef.current) {
        carouselRef.current.destroy();
      }

      // Créer le nouveau carousel
      carouselRef.current = new MaterialCarousel3D(container, {
        radius,
        materials,
        onMaterialSelect
      });

      // Créer le carousel
      carouselRef.current.createCarousel();

      // Configurer la rotation automatique si demandée
      if (autoRotate) {
        startAutoRotate();
      }

      containerRef.current = container;
      console.log('✅ [useCarouselInteractions] Carousel initialisé avec succès');
      return true;

    } catch (error) {
      console.error('❌ [useCarouselInteractions] Erreur d\'initialisation:', error);
      return false;
    }
  }, [materials, onMaterialSelect, radius, autoRotate]);

  // Démarrer la rotation automatique
  const startAutoRotate = useCallback(() => {
    if (autoRotateIntervalRef.current) {
      clearInterval(autoRotateIntervalRef.current);
    }

    if (!carouselRef.current) return;

    let currentIndex = 0;
    autoRotateIntervalRef.current = setInterval(() => {
      if (carouselRef.current && materials.length > 0) {
        const material = materials[currentIndex];
        carouselRef.current.rotateToMaterial(material.id);
        currentIndex = (currentIndex + 1) % materials.length;
      }
    }, 3000); // Rotation toutes les 3 secondes

    console.log('🔄 [useCarouselInteractions] Rotation automatique démarrée');
  }, [materials]);

  // Arrêter la rotation automatique
  const stopAutoRotate = useCallback(() => {
    if (autoRotateIntervalRef.current) {
      clearInterval(autoRotateIntervalRef.current);
      autoRotateIntervalRef.current = null;
      console.log('⏹️ [useCarouselInteractions] Rotation automatique arrêtée');
    }
  }, []);

  // Faire tourner vers un matériau spécifique
  const rotateToMaterial = useCallback((materialId: string) => {
    if (carouselRef.current) {
      carouselRef.current.rotateToMaterial(materialId);
      console.log('🎯 [useCarouselInteractions] Rotation vers:', materialId);
    }
  }, []);

  // Obtenir le matériau actuellement centré
  const getCurrentMaterial = useCallback((): Material | null => {
    return carouselRef.current?.getCurrentMaterial() || null;
  }, []);

  // Mettre à jour les matériaux
  const updateMaterials = useCallback((newMaterials: Material[]) => {
    if (carouselRef.current) {
      carouselRef.current.updateMaterials(newMaterials);
      console.log('🔄 [useCarouselInteractions] Matériaux mis à jour:', newMaterials.length);
    }
  }, []);

  // Nettoyer les ressources
  const cleanup = useCallback(() => {
    console.log('🧹 [useCarouselInteractions] Nettoyage...');

    // Arrêter la rotation automatique
    stopAutoRotate();

    // Détruire le carousel
    if (carouselRef.current) {
      carouselRef.current.destroy();
      carouselRef.current = null;
    }

    containerRef.current = null;
  }, [stopAutoRotate]);

  // Redimensionner le carousel
  const resize = useCallback(() => {
    if (carouselRef.current && containerRef.current) {
      // Le carousel CSS s'adapte automatiquement via les media queries
      // Mais on peut déclencher une re-création si nécessaire
      console.log('📐 [useCarouselInteractions] Redimensionnement détecté');
    }
  }, []);

  // Effet pour nettoyer au démontage
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Effet pour gérer le redimensionnement
  useEffect(() => {
    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [resize]);

  return {
    // Méthodes principales
    initializeCarousel,
    cleanup,
    
    // Contrôles du carousel
    rotateToMaterial,
    getCurrentMaterial,
    updateMaterials,
    
    // Rotation automatique
    startAutoRotate,
    stopAutoRotate,
    
    // Utilitaires
    resize,
    
    // État
    isInitialized: carouselRef.current !== null,
    carousel: carouselRef.current
  };
}

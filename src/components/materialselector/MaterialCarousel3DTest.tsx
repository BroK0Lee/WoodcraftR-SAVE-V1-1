import { useRef, useEffect } from 'react';
import { Material } from './MaterialSphere';
import { useCarouselInteractions } from './useCarouselInteractions';
import { getAllWoodMaterials } from './woodMaterials-public'; // 🔄 Nouveau fichier optimisé

interface MaterialCarousel3DTestProps {
  onMaterialSelect?: (material: Material) => void;
}

// Composant de test pour le Carousel 3D
export function MaterialCarousel3DTest({ onMaterialSelect }: MaterialCarousel3DTestProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Charger les matériaux de bois avec vraies textures
  const materials = getAllWoodMaterials();

  // Configuration du carousel avec le hook (mode scroll uniquement)
  const carousel = useCarouselInteractions({
    materials: materials,
    onMaterialSelect: (material) => {
      onMaterialSelect?.(material);
      console.log('🎯 Material sélectionné:', material.name);
    },
    radius: 400,
    autoRotate: false,
    useScrollControl: true,  // Mode scroll fixé
    snapAfterScroll: true
  });

  // Initialiser le carousel au montage
  useEffect(() => {
    console.log('🎠 [MaterialCarousel3DTest] Initialisation...', { 
      containerRef: containerRef.current,
      materialsCount: materials.length,
      isInitialized: carousel.isInitialized 
    });
    
    if (containerRef.current && !carousel.isInitialized) {
      console.log('🚀 [MaterialCarousel3DTest] Création du carousel...');
      carousel.initializeCarousel(containerRef.current);
    }

    return () => {
      console.log('🧹 [MaterialCarousel3DTest] Cleanup...');
      carousel.cleanup();
    };
  }, [carousel]);

  return (
    <div className="w-full h-full">
      {/* Container principal du carousel - Adaptatif aux thèmes */}
      <div 
        ref={containerRef}
        className="carousel-3d-container w-full h-full relative overflow-hidden 
                   bg-gray-50 dark:bg-gray-950 
                   border border-gray-200 dark:border-gray-800
                   transition-colors duration-200"
      />
    </div>
  );
}

export default MaterialCarousel3DTest;

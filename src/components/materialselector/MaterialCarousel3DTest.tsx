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
    if (containerRef.current && !carousel.isInitialized) {
      carousel.initializeCarousel(containerRef.current);
    }

    return () => {
      carousel.cleanup();
    };
  }, [carousel]);

  return (
    <div className="w-full h-full">
      {/* Container principal du carousel - Pleine taille */}
      <div 
        ref={containerRef}
        className="carousel-3d-container w-full h-full"
        style={{
          position: 'relative',
          overflow: 'hidden'
        }}
      />
    </div>
  );
}

export default MaterialCarousel3DTest;

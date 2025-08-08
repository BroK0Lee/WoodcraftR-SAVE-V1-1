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
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Charger les matériaux de bois avec vraies textures
  const materials = getAllWoodMaterials();
  
  console.log('📦 [MaterialCarousel3DTest] Matériaux chargés:', {
    count: materials.length,
    samples: materials.slice(0, 3).map(m => ({ id: m.id, name: m.name, image: m.image }))
  });

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
      
      // Debug: Vérifier les dimensions du container
      const rect = containerRef.current.getBoundingClientRect();
      console.log('📏 [MaterialCarousel3DTest] Dimensions container:', {
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0
      });
      
      const success = carousel.initializeCarousel(containerRef.current);
      console.log('🎯 [MaterialCarousel3DTest] Résultat initialisation:', success);
    }

    return () => {
      console.log('🧹 [MaterialCarousel3DTest] Cleanup...');
      carousel.cleanup();
    };
  }, [carousel]);

  // Gérer le redimensionnement des panels du Dashboard
  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = () => {
      // Débouncer les appels de redimensionnement
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      resizeTimeoutRef.current = setTimeout(() => {
        console.log('🔄 [MaterialCarousel3DTest] Redimensionnement du panel détecté');
        // Vérifier que le carousel est bien initialisé avant de resize
        if (carousel.isInitialized) {
          carousel.resize();
        } else {
          console.log('⏳ [MaterialCarousel3DTest] Carousel pas encore initialisé, resize ignoré');
        }
      }, 150); // Attendre 150ms après le dernier événement
    };

    // Observer les changements de taille du panel
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    // Écouter aussi les événements window resize pour les changements de fenêtre
    window.addEventListener('resize', handleResize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
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
        style={{ 
          minHeight: '400px',
          border: '2px solid #ff0000', // DEBUG: Border rouge pour voir les limites
          backgroundColor: '#f0f0f0' // DEBUG: Fond gris clair pour voir le container
        }}
      >
        {/* Debug info */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          DEBUG: Materials: {materials.length} | Initialized: {carousel.isInitialized ? '✅' : '❌'}
        </div>
      </div>
    </div>
  );
}

export default MaterialCarousel3DTest;

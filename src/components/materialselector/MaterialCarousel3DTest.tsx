import { useRef, useEffect, useState } from 'react';
import { Material } from './MaterialSphere';
import { useCarouselInteractions } from './useCarouselInteractions';

// Données de test pour le carousel
const testMaterials: Material[] = [
  {
    id: 'oak-classic',
    name: 'Chêne Classique',
    image: '/placeholder-material.svg',
    price: 45
  },
  {
    id: 'pine-natural',
    name: 'Pin Naturel',
    image: '/placeholder-material.svg',
    price: 32
  },
  {
    id: 'mahogany-premium',
    name: 'Acajou Premium',
    image: '/placeholder-material.svg',
    price: 78
  },
  {
    id: 'bamboo-eco',
    name: 'Bambou Éco',
    image: '/placeholder-material.svg',
    price: 55
  },
  {
    id: 'walnut-deluxe',
    name: 'Noyer Deluxe',
    image: '/placeholder-material.svg',
    price: 89
  },
  {
    id: 'cherry-wood',
    name: 'Bois de Cerisier',
    image: '/placeholder-material.svg',
    price: 67
  }
];

interface MaterialCarousel3DTestProps {
  onMaterialSelect?: (material: Material) => void;
}

// Composant de test pour le Carousel 3D
export function MaterialCarousel3DTest({ onMaterialSelect }: MaterialCarousel3DTestProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isAutoRotate, setIsAutoRotate] = useState(false);

  // Configuration du carousel avec le hook
  const carousel = useCarouselInteractions({
    materials: testMaterials,
    onMaterialSelect: (material) => {
      setSelectedMaterial(material);
      onMaterialSelect?.(material);
      console.log('🎯 Material sélectionné:', material.name);
    },
    radius: 400,
    autoRotate: isAutoRotate
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

  // Gestionnaires pour les boutons de test
  const handleRotateToMaterial = (materialId: string) => {
    carousel.rotateToMaterial(materialId);
  };

  const toggleAutoRotate = () => {
    const newAutoRotate = !isAutoRotate;
    setIsAutoRotate(newAutoRotate);
    
    if (newAutoRotate) {
      carousel.startAutoRotate();
    } else {
      carousel.stopAutoRotate();
    }
  };

  const getCurrentMaterial = () => {
    const current = carousel.getCurrentMaterial();
    if (current) {
      console.log('📍 Matériau actuellement centré:', current.name);
      setSelectedMaterial(current);
    }
  };

  return (
    <div className="carousel-test-container">
      {/* Container principal du carousel */}
      <div 
        ref={containerRef}
        className="carousel-3d-container"
        style={{
          width: '100%',
          height: '500px',
          position: 'relative',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      />

      {/* Panneau de contrôle pour les tests */}
      <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>🎮 Contrôles de Test - Carousel 3D</h3>
        
        {/* Informations sur le matériau sélectionné */}
        {selectedMaterial && (
          <div style={{ marginBottom: '15px', padding: '10px', background: '#e8f5e8', borderRadius: '6px' }}>
            <strong>Matériau sélectionné:</strong> {selectedMaterial.name} - {selectedMaterial.price}€/m²
          </div>
        )}

        {/* Boutons de navigation rapide */}
        <div style={{ marginBottom: '15px' }}>
          <strong>Navigation rapide:</strong>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            {testMaterials.map((material) => (
              <button
                key={material.id}
                onClick={() => handleRotateToMaterial(material.id)}
                style={{
                  padding: '6px 12px',
                  background: selectedMaterial?.id === material.id ? '#667eea' : '#fff',
                  color: selectedMaterial?.id === material.id ? '#fff' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {material.name}
              </button>
            ))}
          </div>
        </div>

        {/* Contrôles généraux */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={toggleAutoRotate}
            style={{
              padding: '8px 16px',
              background: isAutoRotate ? '#dc3545' : '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isAutoRotate ? '⏹️ Arrêter rotation' : '▶️ Démarrer rotation'}
          </button>

          <button
            onClick={getCurrentMaterial}
            style={{
              padding: '8px 16px',
              background: '#17a2b8',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📍 Matériau centré
          </button>
        </div>

        {/* Instructions */}
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          <strong>Instructions:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>🖱️ Cliquez et glissez horizontalement pour faire tourner</li>
            <li>🎯 Cliquez sur une carte pour la sélectionner</li>
            <li>⚡ Les animations utilisent GSAP avec inertie</li>
            <li>📱 Responsive design adaptatif</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MaterialCarousel3DTest;

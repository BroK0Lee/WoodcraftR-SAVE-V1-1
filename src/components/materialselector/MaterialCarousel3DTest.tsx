import { useRef, useEffect, useState } from 'react';
import { Material } from './MaterialSphere';
import { useCarouselInteractions } from './useCarouselInteractions';
import { getAllWoodMaterials } from './woodMaterials-public'; // 🔄 Nouveau fichier optimisé

interface MaterialCarousel3DTestProps {
  onMaterialSelect?: (material: Material) => void;
}

// Composant de test pour le Carousel 3D
export function MaterialCarousel3DTest({ onMaterialSelect }: MaterialCarousel3DTestProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // Charger les matériaux de bois avec vraies textures
  const materials = getAllWoodMaterials();

  // Configuration du carousel avec le hook (mode scroll uniquement)
  const carousel = useCarouselInteractions({
    materials: materials,
    onMaterialSelect: (material) => {
      setSelectedMaterial(material);
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

  // Gestionnaire pour la navigation rapide vers un matériau
  const handleRotateToMaterial = (materialId: string) => {
    carousel.rotateToMaterial(materialId);
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
        {materials.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <strong>Navigation rapide:</strong>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {materials.map((material: Material) => (
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
        )}

        {/* Instructions simplifiées */}
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          <strong>Instructions:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>🖱️ **Mode Scroll**: Utilisez la molette de souris pour faire tourner le carousel</li>
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

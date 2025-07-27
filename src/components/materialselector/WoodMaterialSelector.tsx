import React, { useEffect, useRef, useState } from 'react';
import { useMaterialSelector } from './useMaterialSelector';
import MaterialModal from './MaterialModal';

// Données des matériaux (à terme, ceci pourrait venir d'une API)
const materials = [
  {
    id: 'chene',
    name: 'Chêne',
    image: '/src/assets/textures/oak/oak_basecolor.png',
    price: 45,
    description: 'Bois noble et résistant, parfait pour les meubles durables.'
  },
  {
    id: 'hetre',
    name: 'Hêtre',
    image: '/src/assets/textures/oak/oak_basecolor.png',
    price: 35,
    description: 'Bois clair et homogène, idéal pour les finitions modernes.'
  },
  {
    id: 'pin',
    name: 'Pin',
    image: '/src/assets/textures/oak/oak_basecolor.png',
    price: 25,
    description: 'Bois tendre et économique, parfait pour les projets débutants.'
  },
  {
    id: 'erable',
    name: 'Érable',
    image: '/src/assets/textures/oak/oak_basecolor.png',
    price: 50,
    description: 'Bois dur aux nuances claires, excellent pour les détails fins.'
  },
  {
    id: 'noyer',
    name: 'Noyer',
    image: '/src/assets/textures/oak/oak_basecolor.png',
    price: 60,
    description: 'Bois sombre et prestigieux, pour les réalisations haut de gamme.'
  },
  {
    id: 'cerisier',
    name: 'Cerisier',
    image: '/src/assets/textures/oak/oak_basecolor.png',
    price: 55,
    description: 'Bois aux tons chauds, apprécié pour son grain délicat.'
  }
];

interface Material {
  id: string;
  name: string;
  image: string;
  price?: number;
  description?: string;
}

interface WoodMaterialSelectorProps {
  onMaterialSelect?: (material: Material) => void;
  selectedMaterialId?: string;
}

const WoodMaterialSelector: React.FC<WoodMaterialSelectorProps> = ({ 
  onMaterialSelect = () => {},
  selectedMaterialId 
}) => {
  // État local
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(selectedMaterialId || null);
  const [modalMaterial, setModalMaterial] = useState<Material | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Référence au conteneur
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Hook personnalisé pour la gestion du sélecteur
  const {
    isReady,
    error,
    isInitialized,
    initializeSelector,
    cleanupSelector,
    updateSelection
  } = useMaterialSelector({
    materials,
    onMaterialSelect: (material: Material) => {
      console.log('🎯 [WoodMaterialSelector] Matériau sélectionné:', material.name);
      setModalMaterial(material);
      setIsModalOpen(true);
      onMaterialSelect(material);
    },
    selectedMaterialId: selectedMaterial || undefined
  });

  // Effet pour initialiser/nettoyer le sélecteur quand isInitialized change
  useEffect(() => {
    if (!mountRef.current || !isInitialized) {
      return;
    }

    console.log('🎬 [WoodMaterialSelector] Montage du composant');
    
    const container = mountRef.current;
    let isMounted = true;

    // Initialiser le sélecteur de manière asynchrone
    const init = async () => {
      try {
        const success = await initializeSelector(container);
        if (!success && isMounted) {
          console.warn('⚠️ [WoodMaterialSelector] Échec de l\'initialisation');
        }
      } catch (err) {
        if (isMounted) {
          console.error('❌ [WoodMaterialSelector] Erreur d\'initialisation:', err);
        }
      }
    };

    init();

    // Cleanup function
    return () => {
      isMounted = false;
      console.log('🧹 [WoodMaterialSelector] Démontage du composant');
      cleanupSelector(container);
    };
    // Volontairement ne pas inclure initializeSelector et cleanupSelector 
    // car ils sont maintenant stables avec useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  // Effet pour mettre à jour la sélection
  useEffect(() => {
    if (isReady && selectedMaterialId !== selectedMaterial) {
      setSelectedMaterial(selectedMaterialId || null);
      updateSelection(selectedMaterialId || null);
    }
  }, [selectedMaterialId, selectedMaterial, isReady, updateSelection]);

  // Gestionnaire de confirmation du matériau
  const handleMaterialConfirm = (material: Material) => {
    console.log('✅ [WoodMaterialSelector] Matériau confirmé:', material.name);
    setSelectedMaterial(material.id);
    setIsModalOpen(false);
    onMaterialSelect(material);
  };

  // Gestionnaire de fermeture de modal
  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalMaterial(null);
  };

  // Rendu conditionnel selon l'état
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initialisation du sélecteur de matériaux...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Erreur</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Conteneur pour la scène 3D */}
      <div 
        ref={mountRef}
        className="w-full h-full bg-gradient-to-br from-amber-50 via-white to-orange-50"
        style={{ position: 'relative' }}
      />

      {/* Indicateurs d'état */}
      {!isReady && isInitialized && (
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
            <span className="text-sm text-gray-700">Chargement de la sphère...</span>
          </div>
        </div>
      )}

      {/* Informations sur le matériau sélectionné */}
      {selectedMaterial && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg max-w-xs">
          <div className="text-sm">
            <p className="font-semibold text-amber-800">Matériau sélectionné</p>
            <p className="text-gray-700">
              {materials.find(m => m.id === selectedMaterial)?.name || 'Inconnu'}
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg max-w-xs">
        <p className="text-xs text-gray-600">
          Cliquez sur un matériau pour le sélectionner. Utilisez la souris pour faire tourner la vue.
        </p>
      </div>

      {/* Modal de sélection de matériau */}
      <MaterialModal
        isOpen={isModalOpen}
        material={modalMaterial}
        onConfirm={handleMaterialConfirm}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default WoodMaterialSelector;

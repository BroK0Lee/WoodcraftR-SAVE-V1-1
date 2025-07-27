import React, { useEffect, useRef, useState } from 'react';
import { useMaterialSelector } from './useMaterialSelector';
import MaterialModal from './MaterialModal';
import { useGlobalMaterialStore, GlobalWoodMaterial } from '@/store/globalMaterialStore';

// Fonction pour convertir GlobalWoodMaterial vers Material (compatible MaterialSphere)
const convertToMaterial = (globalMaterial: GlobalWoodMaterial): Material => ({
  id: globalMaterial.id,
  name: globalMaterial.displayName,
  image: globalMaterial.image,
  price: globalMaterial.price,
  description: globalMaterial.description
});

interface Material {
  id: string;
  name: string;
  image: string;
  price?: number;
  description?: string;
}

interface WoodMaterialSelectorProps {
  onMaterialSelect?: (material: GlobalWoodMaterial) => void;
  selectedMaterialId?: string;
}

const WoodMaterialSelector: React.FC<WoodMaterialSelectorProps> = ({ 
  onMaterialSelect = () => {},
  selectedMaterialId 
}) => {
  // État local
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(selectedMaterialId || null);
  const [modalMaterial, setModalMaterial] = useState<GlobalWoodMaterial | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Référence au conteneur
  const mountRef = useRef<HTMLDivElement>(null);

  // Utiliser le store global pour les matériaux
  const { materials, isLoaded, isLoading, error: materialError } = useGlobalMaterialStore();

  // Chargement des matériaux depuis le cache global
  useEffect(() => {
    if (isLoaded && materials.length > 0) {
      console.log(`✅ [WoodMaterialSelector] ${materials.length} matériaux disponibles depuis le cache global`);
      console.log('📋 [WoodMaterialSelector] Matériaux:', materials.map(m => m.displayName).join(', '));
    } else if (isLoading) {
      console.log('⏳ [WoodMaterialSelector] Matériaux en cours de chargement...');
    } else if (materialError) {
      console.error('❌ [WoodMaterialSelector] Erreur de chargement des matériaux:', materialError);
    }
  }, [materials, isLoaded, isLoading, materialError]);
  
  // Hook personnalisé pour la gestion du sélecteur
  const {
    isReady,
    error,
    isInitialized,
    initializeSelector,
    cleanupSelector,
    updateSelection,
    transformToGrid,
    transformToHelix,
    transformToSphere
  } = useMaterialSelector({
    materials: materials.map(convertToMaterial),
    onMaterialSelect: (material: Material) => {
      console.log('🎯 [WoodMaterialSelector] Matériau sélectionné:', material.name);
      
      // Récupérer le WoodMaterial complet par ID
      const fullMaterial = materials.find(m => m.id === material.id);
      if (fullMaterial) {
        setModalMaterial(fullMaterial);
        setIsModalOpen(true);
        onMaterialSelect(fullMaterial);
      }
    },
    selectedMaterialId: selectedMaterial || undefined
  });

  // Effet pour initialiser/nettoyer le sélecteur quand isInitialized ET materials sont prêts
  useEffect(() => {
    if (!mountRef.current || !isInitialized || materials.length === 0 || isLoading) {
      return;
    }

    console.log('🎬 [WoodMaterialSelector] Montage du composant avec', materials.length, 'matériaux');
    
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
    // Dépendances : isInitialized, materials et isLoadingMaterials
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, materials.length, isLoading]);

  // Effet pour déclencher l'animation vers la sphère quand tout est prêt
  useEffect(() => {
    if (isReady && materials.length > 0 && !isLoading) {
      console.log('🌐 [WoodMaterialSelector] Animation automatique vers la sphère');
      // Petite pause pour laisser le rendu s'initialiser
      setTimeout(() => {
        transformToSphere?.();
      }, 500);
    }
  }, [isReady, materials.length, isLoading, transformToSphere]);

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
    
    // Récupérer le WoodMaterial complet par ID
    const fullMaterial = materials.find(m => m.id === material.id);
    if (fullMaterial) {
      onMaterialSelect(fullMaterial);
    }
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
      {isLoading && (
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-10">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            <span className="text-sm text-gray-700">Chargement des matériaux...</span>
          </div>
        </div>
      )}
      {!isReady && isInitialized && !isLoading && (
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

      {/* Menu de transformation (Style Three.js Original) */}
      {isReady && (
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
          <div className="flex flex-col space-y-2">
            <p className="text-xs font-semibold text-gray-700 mb-2">Formations :</p>
            <button
              onClick={() => {
                console.log('🌐 [WoodMaterialSelector] Clic bouton Sphère');
                transformToSphere?.();
              }}
              className="px-3 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
            >
              🌐 Sphère
            </button>
            <button
              onClick={() => {
                console.log('🔲 [WoodMaterialSelector] Clic bouton Grille');
                transformToGrid?.();
              }}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              🔲 Grille
            </button>
            <button
              onClick={() => {
                console.log('🌀 [WoodMaterialSelector] Clic bouton Hélice');
                transformToHelix?.();
              }}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              🌀 Hélice
            </button>
          </div>
        </div>
      )}

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

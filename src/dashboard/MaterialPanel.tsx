import { useState } from 'react';
import { useGlobalMaterialStore } from '@/store/globalMaterialStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TreePine,
  Info,
  Star,
  Hammer,
  Shield,
  RotateCcw,
  X
} from 'lucide-react';
import { MaterialCarousel3DTest } from '@/components/materialselector/MaterialCarousel3DTest';

export function MaterialPanel() {
  const { 
    materials, 
    getMaterialById
  } = useGlobalMaterialStore();

  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [showCarousel3D, setShowCarousel3D] = useState(false);

  const handleMaterialSelect = (materialId: string) => {
    setSelectedMaterialId(materialId);
  };

  const selectedMaterial = selectedMaterialId ? getMaterialById(selectedMaterialId) : null;

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Bouton de test pour le Carousel 3D */}
      <Card className="border-2 border-dashed border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="pt-4">
          <div className="text-center">
            <RotateCcw className="w-8 h-8 mx-auto mb-2 text-amber-600" />
            <h3 className="font-medium text-amber-900 mb-2">🎠 Nouveau Carousel 3D</h3>
            <p className="text-sm text-amber-700 mb-4">
              Testez le nouveau système de sélection avec GSAP Draggable
            </p>
            <Button 
              onClick={() => setShowCarousel3D(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Ouvrir le Carousel 3D
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sélection de la matière */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TreePine className="w-4 h-4" />
            Sélection de Matière
          </CardTitle>
          <CardDescription>
            Choisissez le type de bois pour votre projet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Affichage des matériaux disponibles */}
          {materials.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <TreePine className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Chargement des matériaux...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* Matériaux en version compacte */}
              {materials.slice(0, 8).map((material) => (
                <div
                  key={material.id}
                  className={`
                    relative group cursor-pointer rounded-lg border-2 p-3 transition-all duration-200
                    ${selectedMaterialId === material.id 
                      ? 'border-amber-300 bg-amber-50' 
                      : 'border-gray-200 hover:border-amber-200 bg-white hover:bg-amber-50/50'
                    }
                  `}
                  onClick={() => handleMaterialSelect(material.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={material.image}
                        alt={material.displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {material.displayName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {material.characteristics.hardness.classification}
                      </div>
                      <div className="text-xs text-amber-600">
                        {material.price}€/m²
                      </div>
                    </div>
                  </div>
                  {selectedMaterialId === material.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-white fill-current" />
                    </div>
                  )}
                </div>
              ))}

              {/* Bouton "Voir plus" - Ouvre le sélecteur 3D */}
              <div
                className="
                  relative group cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-3 
                  transition-all duration-200 hover:border-amber-300 hover:bg-amber-50/30
                  flex items-center justify-center
                "
                onClick={() => handleMaterialSelect('selector')}
              >
                <div className="text-center">
                  <TreePine className="w-6 h-6 mx-auto mb-1 text-gray-400 group-hover:text-amber-500" />
                  <div className="text-xs font-medium text-gray-600 group-hover:text-amber-700">
                    Voir tous
                  </div>
                  <div className="text-xs text-gray-400">
                    {materials.length} matériaux
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détails du matériau sélectionné */}
      {selectedMaterial && selectedMaterialId !== 'selector' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4" />
                Détails - {selectedMaterial.displayName}
              </CardTitle>
              <Badge variant="outline" className="text-amber-700 border-amber-300">
                {selectedMaterial.price}€/m²
              </Badge>
            </div>
            <CardDescription className="text-sm">
              {selectedMaterial.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Caractéristiques principales */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  <Shield className="w-3 h-3" />
                  Densité
                </div>
                <div className="text-xs text-gray-800">
                  {selectedMaterial.characteristics.density.typical || `${selectedMaterial.characteristics.density.value} ${selectedMaterial.characteristics.density.unit}`}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  <Hammer className="w-3 h-3" />
                  Dureté
                </div>
                <div className="text-xs text-gray-800">
                  {selectedMaterial.characteristics.hardness.classification}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  <Star className="w-3 h-3" />
                  Couleur
                </div>
                <div className="text-xs text-gray-800">
                  {selectedMaterial.characteristics.appearance.color}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  <TreePine className="w-3 h-3" />
                  Grain
                </div>
                <div className="text-xs text-gray-800">
                  {selectedMaterial.characteristics.appearance.grain}
                </div>
              </div>
            </div>

            {/* Applications */}
            {selectedMaterial.characteristics.applications.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-600">Applications</div>
                <div className="flex flex-wrap gap-1">
                  {selectedMaterial.characteristics.applications.slice(0, 4).map((app, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                      {app}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Message si sélecteur 3D */}
      {selectedMaterialId === 'selector' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <TreePine className="w-12 h-12 mx-auto mb-3 text-amber-500" />
              <h3 className="font-medium text-gray-900 mb-2">Sélecteur 3D</h3>
              <p className="text-sm text-gray-600 mb-4">
                Rendez-vous dans l'onglet "Matière" pour utiliser le sélecteur 3D interactif avec tous les matériaux disponibles.
              </p>
              <Badge variant="outline" className="text-amber-700 border-amber-300">
                {materials.length} matériaux disponibles
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Carousel 3D */}
      {showCarousel3D && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                Carousel 3D - Test Component
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCarousel3D(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              <MaterialCarousel3DTest 
                onMaterialSelect={(material) => {
                  console.log('Matériau sélectionné depuis le carousel:', material);
                  setSelectedMaterialId(material.id);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

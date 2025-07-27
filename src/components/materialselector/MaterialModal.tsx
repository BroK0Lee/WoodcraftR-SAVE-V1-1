import React from 'react';
import { Check, ArrowLeft, Star, Leaf, Hammer, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GlobalWoodMaterial } from '@/store/globalMaterialStore';

interface MaterialModalProps {
  material: GlobalWoodMaterial | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (material: GlobalWoodMaterial) => void;
}

const MaterialModal: React.FC<MaterialModalProps> = ({ material, isOpen, onClose, onConfirm }) => {
  if (!material) return null;

  const handleConfirm = () => {
    onConfirm(material);
    onClose();
  };

  // Utilisation directe des données du GlobalWoodMaterial
  const {
    name,
    displayName,
    image,
    description,
    characteristics
  } = material;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-amber-800 flex items-center gap-2">
            <Leaf className="w-6 h-6" />
            {displayName || name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image principale (cohérente avec le sélecteur 3D) */}
          <div className="space-y-4">
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={image}
                alt={`${name} - Texture du matériau`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Détails de la matière depuis GlobalWoodMaterial */}
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {description || characteristics.generalDescription}
              </p>
            </div>

            {/* Caractéristiques techniques */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Caractéristiques techniques
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-sm text-amber-700 font-medium">Densité</div>
                  <div className="text-gray-800">
                    {characteristics.density.typical} ({characteristics.density.unit})
                  </div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-sm text-amber-700 font-medium">Dureté</div>
                  <div className="text-gray-800">{characteristics.hardness.classification}</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-sm text-amber-700 font-medium">Grain</div>
                  <div className="text-gray-800">{characteristics.appearance.grain}</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-sm text-amber-700 font-medium">Couleur</div>
                  <div className="text-gray-800">{characteristics.appearance.color}</div>
                </div>
              </div>
            </div>

            {/* Applications */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Hammer className="w-5 h-5 text-blue-500" />
                Applications
              </h3>
              <ul className="space-y-2">
                {characteristics.applications.map((app: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-gray-600">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                    {app}
                  </li>
                ))}
              </ul>
            </div>

            {/* Usinage */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Facilité d'usinage
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                  Découpe: {characteristics.workability.cutting}
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                  Perçage: {characteristics.workability.drilling}
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                  Finition: {characteristics.workability.finishing}
                </li>
              </ul>
            </div>

            {/* Durabilité */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-500" />
                Durabilité
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-600">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                  Origine: {characteristics.sustainability.origin}
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                  Certification: {characteristics.sustainability.certification}
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                  Impact carbone: {characteristics.sustainability.carbon_impact}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Sélectionner cette matière
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialModal;

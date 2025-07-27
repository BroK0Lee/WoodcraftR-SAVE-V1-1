import React from 'react';
import { WoodMaterial } from '@/services/woodMaterialService';

interface MaterialCardProps {
  material: WoodMaterial;
  onSelect: () => void;
  isSelected: boolean;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onSelect, isSelected }) => {
  const handleClick = () => {
    onSelect();
  };

  return (
    <div 
      className={`
        material-card w-32 h-40 rounded-lg shadow-lg border cursor-pointer
        flex flex-col items-center justify-center transition-all duration-300
        user-select-none hover:shadow-xl hover:scale-105 transform
        ${isSelected 
          ? 'bg-amber-50 border-amber-300 shadow-amber-200/50' 
          : 'bg-white border-gray-200 hover:border-amber-200'
        }
      `}
      onClick={handleClick}
      title={`${material.displayName} - ${material.characteristics.colorAspect.dominantColor}`}
    >
      <div className="w-full h-24 overflow-hidden rounded-t-lg">
        <img 
          src={material.baseColorImage}
          alt={material.displayName}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          style={{ pointerEvents: 'none' }}
        />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-2">
        <span className={`
          text-sm font-medium text-center transition-colors duration-200
          ${isSelected ? 'text-amber-800' : 'text-gray-700'}
        `}>
          {material.displayName}
        </span>
        <span className={`
          text-xs text-center mt-1 transition-colors duration-200
          ${isSelected ? 'text-amber-600' : 'text-gray-500'}
        `}>
          {material.characteristics.hardness.classification}
        </span>
      </div>
    </div>
  );
};

export default MaterialCard;

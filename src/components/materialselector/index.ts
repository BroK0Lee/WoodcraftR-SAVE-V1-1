// Export principal
export { default as WoodMaterialSelector } from './WoodMaterialSelector';

// Exports des composants
export { default as MaterialCard } from './MaterialCard';
export { default as MaterialModal } from './MaterialModal';

// Exports des classes et hooks
export { MaterialSphere } from './MaterialSphere';
export { MaterialInteractionManager } from './MaterialInteractionManager';
export { useMaterialSelector } from './useMaterialSelector';

// Nouveaux exports pour le Carousel 3D
export { MaterialCarousel3D } from './MaterialCarousel3D';
export { MaterialCarousel3DTest } from './MaterialCarousel3DTest';
export { useCarouselInteractions } from './useCarouselInteractions';

// Export des données matériaux (version optimisée /public)
export { getAllWoodMaterials, getWoodMaterialById, createThreeMaterial } from './woodMaterials-public';
export type { WoodMaterial } from './woodMaterials-public';

export * from './carouselUtils';

// Types
export type { Material } from './MaterialSphere';

/**
 * Configuration des matériaux de bois pour le carousel 3D
 * Version optimisée pour assets dans /public/
 * Permet l'utilisation de multiple maps (diffuse, normal, roughness, AO)
 */

import { Material } from './MaterialSphere';

// Interface étendue pour supporter multiple texture maps
export interface WoodMaterial extends Material {
  // Texture maps pour Three.js PBR
  maps: {
    basecolor: string;      // Diffuse/Albedo map
    normal?: string;        // Normal map
    roughness?: string;     // Roughness map  
    ao?: string;           // Ambient Occlusion map
    metallic?: string;     // Metallic map (rare pour le bois)
  };
  // Propriétés physiques
  properties?: {
    roughnessValue?: number;  // Valeur de rugosité par défaut
    metallicValue?: number;   // Valeur métallique par défaut  
    normalScale?: number;     // Intensité de la normal map
  };
}

/**
 * Génère les chemins des textures pour un matériau de bois
 */
function generateWoodTexturePaths(woodType: string): WoodMaterial['maps'] {
  const basePath = `/textures/wood/${woodType}`;
  
  return {
    basecolor: `${basePath}/basecolor.jpg`,
    normal: `${basePath}/normal.jpg`,
    roughness: `${basePath}/roughness.jpg`,
    ao: `${basePath}/ao.jpg`
  };
}

/**
 * Données des matériaux de bois avec support PBR complet
 * Assets stockés dans /public/textures/wood/
 */
export const woodMaterials: WoodMaterial[] = [
  {
    id: 'chataignier',
    name: 'Châtaignier',
    image: '/textures/wood/chataignier/basecolor.jpg', // Pour le carousel
    price: 45,
    maps: generateWoodTexturePaths('chataignier'),
    properties: {
      roughnessValue: 0.8,
      metallicValue: 0.0,
      normalScale: 1.0
    }
  },
  {
    id: 'chene',
    name: 'Chêne', 
    image: '/textures/wood/chene/basecolor.jpg',
    price: 65,
    maps: generateWoodTexturePaths('chene'),
    properties: {
      roughnessValue: 0.7,
      metallicValue: 0.0,
      normalScale: 1.2
    }
  },
  {
    id: 'frene',
    name: 'Frêne',
    image: '/textures/wood/frene/basecolor.jpg', 
    price: 55,
    maps: generateWoodTexturePaths('frene'),
    properties: {
      roughnessValue: 0.75,
      metallicValue: 0.0,
      normalScale: 1.0
    }
  },
  {
    id: 'hetre',
    name: 'Hêtre',
    image: '/textures/wood/hetre/basecolor.jpg',
    price: 50,
    maps: generateWoodTexturePaths('hetre'),
    properties: {
      roughnessValue: 0.8,
      metallicValue: 0.0,
      normalScale: 0.9
    }
  },
  {
    id: 'merisier', 
    name: 'Merisier',
    image: '/textures/wood/merisier/basecolor.jpg',
    price: 70,
    maps: generateWoodTexturePaths('merisier'),
    properties: {
      roughnessValue: 0.6,
      metallicValue: 0.0,
      normalScale: 1.1
    }
  },
  {
    id: 'noyer',
    name: 'Noyer',
    image: '/textures/wood/noyer/basecolor.jpg',
    price: 80,
    maps: generateWoodTexturePaths('noyer'),
    properties: {
      roughnessValue: 0.65,
      metallicValue: 0.0,
      normalScale: 1.3
    }
  },
  {
    id: 'sycomore',
    name: 'Sycomore', 
    image: '/textures/wood/sycomore/basecolor.jpg',
    price: 60,
    maps: generateWoodTexturePaths('sycomore'),
    properties: {
      roughnessValue: 0.75,
      metallicValue: 0.0,
      normalScale: 1.0
    }
  }
];

/**
 * Utilitaire pour créer un matériau Three.js PBR à partir d'un WoodMaterial
 */
export function createThreeMaterial(woodMaterial: WoodMaterial, textureLoader: any) {
  const { maps, properties } = woodMaterial;
  
  // Charger les textures
  const diffuseMap = textureLoader.load(maps.basecolor);
  const normalMap = maps.normal ? textureLoader.load(maps.normal) : null;
  const roughnessMap = maps.roughness ? textureLoader.load(maps.roughness) : null;
  const aoMap = maps.ao ? textureLoader.load(maps.ao) : null;
  
  return {
    map: diffuseMap,
    normalMap,
    roughnessMap, 
    aoMap,
    roughness: properties?.roughnessValue ?? 0.8,
    metalness: properties?.metallicValue ?? 0.0,
    normalScale: properties?.normalScale ?? 1.0
  };
}

/**
 * Récupère tous les matériaux de bois
 */
export function getAllWoodMaterials(): WoodMaterial[] {
  return woodMaterials;
}

/**
 * Récupère un matériau par son ID
 */
export function getWoodMaterialById(id: string): WoodMaterial | undefined {
  return woodMaterials.find(material => material.id === id);
}

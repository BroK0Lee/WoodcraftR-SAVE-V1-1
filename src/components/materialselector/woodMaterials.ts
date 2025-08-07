/**
 * Configuration des matériaux de bois pour le carousel 3D
 * Utilise les imports Vite pour les images
 */

import { Material } from './MaterialSphere';

// Import des textures de bois via Vite
import chataignierTexture from '../../assets/textures/wood/chataignier/chataignier_basecolor.jpg';
import cheneTexture from '../../assets/textures/wood/chene/chene_basecolor.jpg';
import freneTexture from '../../assets/textures/wood/frene/frene_basecolor.jpg';
import hetreTexture from '../../assets/textures/wood/hetre/hetre_basecolor.jpg';
import merisierTexture from '../../assets/textures/wood/merisier/merisier_basecolor.jpg';
import noyerTexture from '../../assets/textures/wood/noyer/noyer_basecolor.jpg';
import sycomoreTexture from '../../assets/textures/wood/sycomore/sycomore_basecolor.jpg';

/**
 * Données des matériaux de bois avec vraies textures
 * Chaque matériau correspond à un dossier dans src/assets/textures/wood/
 */
export const woodMaterials: Material[] = [
  {
    id: 'chataignier',
    name: 'Châtaignier',
    image: chataignierTexture,
    price: 45
  },
  {
    id: 'chene',
    name: 'Chêne',
    image: cheneTexture,
    price: 52
  },
  {
    id: 'frene',
    name: 'Frêne',
    image: freneTexture,
    price: 48
  },
  {
    id: 'hetre',
    name: 'Hêtre',
    image: hetreTexture,
    price: 42
  },
  {
    id: 'merisier',
    name: 'Merisier',
    image: merisierTexture,
    price: 65
  },
  {
    id: 'noyer',
    name: 'Noyer',
    image: noyerTexture,
    price: 78
  },
  {
    id: 'sycomore',
    name: 'Sycomore',
    image: sycomoreTexture,
    price: 55
  }
];

/**
 * Fonction utilitaire pour obtenir un matériau par ID
 */
export const getWoodMaterialById = (id: string): Material | undefined => {
  return woodMaterials.find(material => material.id === id);
};

/**
 * Fonction utilitaire pour obtenir tous les matériaux
 */
export const getAllWoodMaterials = (): Material[] => {
  return [...woodMaterials];
};

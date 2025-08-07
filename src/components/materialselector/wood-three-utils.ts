/**
 * Exemple d'utilisation des textures PBR migrées pour Three.js
 * Montre comment créer un matériau Three.js avec toutes les maps
 */

import * as THREE from 'three';
import { getAllWoodMaterials, getWoodMaterialById } from './woodMaterials-public';

/**
 * Exemple : Créer un matériau Three.js avec toutes les textures PBR
 */
export function createWoodMaterial(woodType: string): THREE.MeshStandardMaterial {
  const material = getWoodMaterialById(woodType);
  if (!material) {
    throw new Error(`Matériau de bois non trouvé: ${woodType}`);
  }

  // Créer le TextureLoader Three.js
  const textureLoader = new THREE.TextureLoader();
  
  // Créer le matériau Three.js avec toutes les maps
  const { maps, properties } = material;
  
  // Charger toutes les textures
  const diffuseMap = textureLoader.load(maps.basecolor);
  const normalMap = maps.normal ? textureLoader.load(maps.normal) : null;
  const roughnessMap = maps.roughness ? textureLoader.load(maps.roughness) : null;
  const aoMap = maps.ao ? textureLoader.load(maps.ao) : null;
  
  // Configurer les textures pour répétition
  [diffuseMap, normalMap, roughnessMap, aoMap].forEach(texture => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1); // Ajustez selon vos besoins
    }
  });
  
  // Créer le matériau PBR
  const threeMaterial = new THREE.MeshStandardMaterial({
    name: `Wood_${material.name}`,
    
    // Texture principale (albedo/diffuse)
    map: diffuseMap,
    
    // Normal map pour les détails de surface
    normalMap: normalMap,
    normalScale: new THREE.Vector2(
      properties?.normalScale ?? 1.0,
      properties?.normalScale ?? 1.0
    ),
    
    // Roughness map pour la rugosité
    roughnessMap: roughnessMap,
    roughness: properties?.roughnessValue ?? 0.8,
    
    // AO map pour les ombres portées
    aoMap: aoMap,
    aoMapIntensity: 1.0,
    
    // Propriétés du bois
    metalness: properties?.metallicValue ?? 0.0,
    
    // Pas de metallic map pour le bois naturel
    metalnessMap: null
  });
  
  console.log(`🌳 Matériau Three.js créé pour: ${material.name}`);
  console.log(`📊 Maps: ${Object.keys(maps).join(', ')}`);
  
  return threeMaterial;
}

/**
 * Exemple : Créer tous les matériaux de bois pour un configurateur
 */
export function createAllWoodMaterials(): Record<string, THREE.MeshStandardMaterial> {
  const materials: Record<string, THREE.MeshStandardMaterial> = {};
  const woodMaterials = getAllWoodMaterials();
  
  woodMaterials.forEach(wood => {
    materials[wood.id] = createWoodMaterial(wood.id);
  });
  
  console.log(`🎨 ${Object.keys(materials).length} matériaux Three.js créés`);
  return materials;
}

/**
 * Exemple : Appliquer un matériau à un mesh Three.js
 */
export function applyWoodMaterial(
  mesh: THREE.Mesh, 
  woodType: string,
  uvScale: [number, number] = [1, 1]
): void {
  const material = createWoodMaterial(woodType);
  
  // Ajuster l'échelle UV si nécessaire
  if (uvScale[0] !== 1 || uvScale[1] !== 1) {
    [material.map, material.normalMap, material.roughnessMap, material.aoMap]
      .forEach(texture => {
        if (texture) {
          texture.repeat.set(uvScale[0], uvScale[1]);
        }
      });
  }
  
  mesh.material = material;
  console.log(`🪵 Matériau ${woodType} appliqué au mesh`);
}

/**
 * Exemple : Précharger toutes les textures pour éviter les délais
 */
export async function preloadAllWoodTextures(): Promise<void> {
  const textureLoader = new THREE.TextureLoader();
  const woodMaterials = getAllWoodMaterials();
  
  const promises: Promise<THREE.Texture>[] = [];
  
  woodMaterials.forEach(wood => {
    // Précharger toutes les maps de chaque bois
    Object.values(wood.maps).forEach(texturePath => {
      promises.push(
        new Promise((resolve, reject) => {
          textureLoader.load(
            texturePath,
            resolve,
            undefined,
            reject
          );
        })
      );
    });
  });
  
  try {
    await Promise.all(promises);
    console.log(`🚀 ${promises.length} textures préchargées avec succès`);
  } catch (error) {
    console.error('❌ Erreur lors du préchargement des textures:', error);
  }
}

// Exemple d'utilisation dans un configurateur Three.js :
/*
import { createWoodMaterial, applyWoodMaterial, preloadAllWoodTextures } from './wood-three-utils';

// 1. Précharger toutes les textures au démarrage
await preloadAllWoodTextures();

// 2. Créer un matériau spécifique
const cheneMaterial = createWoodMaterial('chene');

// 3. Appliquer à un mesh
const woodPlank = new THREE.BoxGeometry(10, 1, 2);
const plankMesh = new THREE.Mesh(woodPlank);
applyWoodMaterial(plankMesh, 'noyer', [2, 1]); // 2x répétition en X

// 4. Ajouter à la scène
scene.add(plankMesh);
*/

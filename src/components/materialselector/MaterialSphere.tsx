import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// Types pour les matériaux
export interface Material {
  id: string;
  name: string;
  image: string;
  price?: number;
  description?: string;
}

// Interface pour la configuration de la sphère
interface SphereConfig {
  radius: number;
  materials: Material[];
}

// Classe pour gérer la sphère de matériaux
export class MaterialSphere {
  private scene: THREE.Scene;
  private objects: CSS3DObject[] = [];
  private animationId: number | null = null;
  private isAnimating = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // Créer la sphère de matériaux
  createSphere(config: SphereConfig): void {
    console.log('🎯 [MaterialSphere] Création de la sphère avec', config.materials.length, 'matériaux');
    
    // Nettoyer les objets existants
    this.clearSphere();

    const { radius, materials } = config;

    materials.forEach((material, index) => {
      // Créer l'élément DOM pour la carte matériau
      const element = document.createElement('div');
      element.style.width = '128px';
      element.style.height = '160px';
      element.style.pointerEvents = 'none';
      element.id = `material-${material.id}`;
      
      // Créer le contenu HTML de la carte matériau
      element.innerHTML = `
        <div class="material-card w-32 h-40 rounded-lg shadow-lg border cursor-pointer flex flex-col items-center justify-center transition-all duration-300 user-select-none hover:shadow-xl hover:scale-105 transform bg-white border-gray-200 hover:border-amber-200">
          <div class="w-full h-24 overflow-hidden rounded-t-lg">
            <img 
              src="${material.image}"
              alt="${material.name}"
              class="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
              style="pointer-events: none;"
            />
          </div>
          <div class="flex-1 flex items-center justify-center px-2">
            <span class="text-sm font-medium text-center transition-colors duration-200 text-gray-700">
              ${material.name}
            </span>
          </div>
        </div>
      `;

      // Créer l'objet CSS3D
      const cssObject = new CSS3DObject(element);

      // Calculer la position sur la sphère
      const phi = Math.acos(-1 + (2 * index) / materials.length);
      const theta = Math.sqrt(materials.length * Math.PI) * phi;

      cssObject.position.setFromSphericalCoords(radius, phi, theta);
      cssObject.lookAt(0, 0, 0);

      // Stocker les positions pour l'animation
      (cssObject as any).targetPosition = cssObject.position.clone();
      (cssObject as any).startPosition = new THREE.Vector3(
        Math.random() * 2000 - 1000,
        Math.random() * 2000 - 1000,
        Math.random() * 2000 - 1000
      );
      cssObject.position.copy((cssObject as any).startPosition);

      this.scene.add(cssObject);
      this.objects.push(cssObject);
    });

    console.log('✅ [MaterialSphere] Sphère créée avec', this.objects.length, 'objets');
  }

  // Mettre à jour les matériaux sans recréer la sphère
  updateMaterials(materials: Material[]): void {
    console.log('🔄 [MaterialSphere] Mise à jour de la sphère avec', materials.length, 'matériaux');
    
    // Si le nombre de matériaux a changé, recréer complètement
    if (materials.length !== this.objects.length) {
      this.createSphere({ radius: 200, materials });
      return;
    }

    // Sinon, mettre à jour seulement le contenu des cartes existantes
    materials.forEach((material, index) => {
      const element = document.getElementById(`material-${material.id}`);
      if (element && this.objects[index]) {
        // Mettre à jour le contenu HTML
        element.innerHTML = `
          <div class="material-card w-32 h-40 rounded-lg shadow-lg border cursor-pointer flex flex-col items-center justify-center transition-all duration-300 user-select-none hover:shadow-xl hover:scale-105 transform bg-white border-gray-200 hover:border-amber-200">
            <div class="w-full h-24 overflow-hidden rounded-t-lg">
              <img 
                src="${material.image}"
                alt="${material.name}"
                class="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                style="pointer-events: none;"
              />
            </div>
            <div class="flex-1 flex items-center justify-center px-2">
              <span class="text-sm font-medium text-center transition-colors duration-200 text-gray-700">
                ${material.name}
              </span>
            </div>
          </div>
        `;
      }
    });
    
    console.log('✅ [MaterialSphere] Matériaux mis à jour');
  }

  // Animer vers la formation sphérique
  animateToSphere(duration: number = 2000): Promise<void> {
    return new Promise((resolve) => {
      if (this.isAnimating) {
        resolve();
        return;
      }

      console.log('🎬 [MaterialSphere] Début animation vers sphère');
      this.isAnimating = true;

      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = this.easeOutExpo(progress);

        this.objects.forEach((obj) => {
          const targetPos = (obj as any).targetPosition;
          const startPos = (obj as any).startPosition;
          
          if (targetPos && startPos) {
            obj.position.lerpVectors(startPos, targetPos, eased);
            obj.lookAt(0, 0, 0);
          }
        });

        if (progress < 1) {
          this.animationId = requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          this.animationId = null;
          console.log('✅ [MaterialSphere] Animation terminée');
          resolve();
        }
      };

      this.animationId = requestAnimationFrame(animate);
    });
  }

  // Fonction d'easing exponentielle
  private easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  // Nettoyer la sphère
  clearSphere(): void {
    console.log('🧹 [MaterialSphere] Nettoyage de la sphère');
    
    // Arrêter l'animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Supprimer les objets de la scène
    this.objects.forEach(obj => {
      this.scene.remove(obj);
    });
    this.objects = [];
  }

  // Détruire complètement
  destroy(): void {
    console.log('💥 [MaterialSphere] Destruction');
    this.clearSphere();
  }
}

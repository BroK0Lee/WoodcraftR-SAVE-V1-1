import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import TWEEN, { TweenGroup } from '@/lib/tween';

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

// Classe pour gérer la sphère de matériaux (Style Three.js Periodic Table Original)
export class MaterialSphere {
  private scene: THREE.Scene;
  private objects: CSS3DObject[] = [];
  private targets = { 
    sphere: [] as THREE.Object3D[], 
    grid: [] as THREE.Object3D[], 
    helix: [] as THREE.Object3D[] 
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // Créer la sphère de matériaux (Exact copy du style Three.js Periodic Table)
  createSphere(config: SphereConfig): void {
    console.log('🎯 [MaterialSphere] Création de la sphère avec', config.materials.length, 'matériaux');
    
    // Nettoyer les objets existants
    this.clearSphere();

    const { radius, materials } = config;

    // === CRÉATION DES OBJETS (Style Three.js Original) ===
    for (let i = 0; i < materials.length; i++) {
      const material = materials[i];

      // Créer l'élément DOM pour la carte matériau
      const element = document.createElement('div');
      element.className = 'element';
      element.style.width = '180px'; // Agrandi de 140px à 180px pour une meilleure visibilité
      element.style.height = '220px'; // Agrandi de 170px à 220px pour une meilleure visibilité
      element.style.backgroundColor = 'rgba(255,255,255,0.95)';
      element.style.border = '2px solid rgba(0,127,127,' + (Math.random() * 0.5 + 0.25) + ')';
      element.style.borderRadius = '12px';
      element.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      element.style.cursor = 'pointer';
      element.style.overflow = 'hidden';

      // Créer le contenu HTML (inspiré du style Three.js mais adapté aux matériaux)
      element.innerHTML = `
        <div style="width: 100%; height: 150px; overflow: hidden;"> <!-- Agrandi de 120px à 150px -->
          <img 
            src="${material.image}"
            alt="${material.name}"
            style="width: 100%; height: 100%; object-fit: cover;"
          />
        </div>
        <div style="padding: 10px; text-align: center;"> <!-- Agrandi le padding de 8px à 10px -->
          <div style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 4px;"> <!-- Agrandi de 14px à 16px -->
            ${material.name}
          </div>
          <div style="font-size: 13px; color: #d97706;"> <!-- Agrandi de 12px à 13px -->
            ${material.price ? `${material.price}€/m²` : 'Prix sur demande'}
          </div>
        </div>
      `;

      // Créer l'objet CSS3D
      const cssObject = new CSS3DObject(element);
      
      // Position initiale aléatoire (comme Three.js original)
      cssObject.position.x = Math.random() * 4000 - 2000;
      cssObject.position.y = Math.random() * 4000 - 2000;
      cssObject.position.z = Math.random() * 4000 - 2000;
      
      this.scene.add(cssObject);
      this.objects.push(cssObject);
    }

    // === CALCUL DES POSITIONS CIBLES (Exact copy Three.js) ===
    
    // SPHERE positions (syntaxe identique à l'exemple Three.js original)
    var vector = new THREE.Vector3();
    for (var i = 0, l = this.objects.length; i < l; i++) {
      var phi = Math.acos(-1 + (2 * i) / l);
      var theta = Math.sqrt(l * Math.PI) * phi;

      var object = new THREE.Object3D();
      object.position.x = radius * Math.cos(theta) * Math.sin(phi);
      object.position.y = radius * Math.sin(theta) * Math.sin(phi);
      object.position.z = radius * Math.cos(phi);

      vector.copy(object.position).multiplyScalar(2);
      object.lookAt(vector);

      this.targets.sphere.push(object);
    }

    // GRID positions (syntaxe identique à l'exemple Three.js original)
    for (var i = 0; i < this.objects.length; i++) {
      var object = new THREE.Object3D();
      object.position.x = ((i % 4) * 400) - 600; // 4 colonnes pour 12 objets
      object.position.y = (-(Math.floor(i / 4) % 3) * 400) + 400; // 3 lignes
      object.position.z = (Math.floor(i / 12)) * 1000 - 500;

      this.targets.grid.push(object);
    }

    // HELIX positions (syntaxe identique à l'exemple Three.js original)
    for (var i = 0, l = this.objects.length; i < l; i++) {
      var phi = i * 0.175 + Math.PI;

      var object = new THREE.Object3D();
      object.position.x = 900 * Math.sin(phi);
      object.position.y = -(i * 8) + 450;
      object.position.z = 900 * Math.cos(phi);

      vector.x = object.position.x * 2;
      vector.y = object.position.y;
      vector.z = object.position.z * 2;
      object.lookAt(vector);
      object.lookAt(vector);

      this.targets.helix.push(object);
    }

    console.log('✅ [MaterialSphere] Sphère créée avec', this.objects.length, 'objets');
    
    // Animation vers la sphère par défaut
    this.transformToSphere();
  }

  // === MÉTHODES DE TRANSFORMATION (Exact copy Three.js) ===
  
  // Transform vers sphère (comme Three.js original)
  transformToSphere(): void {
    console.log('🌐 [MaterialSphere] Transform vers sphère - objets:', this.objects.length, 'targets:', this.targets.sphere.length);
    this.transform(this.targets.sphere, 2000);
  }

  // Transform vers grille (comme Three.js original)
  transformToGrid(): void {
    console.log('🔲 [MaterialSphere] Transform vers grille - objets:', this.objects.length, 'targets:', this.targets.grid.length);
    this.transform(this.targets.grid, 2000);
  }

  // Transform vers hélice (comme Three.js original)
  transformToHelix(): void {
    console.log('🌀 [MaterialSphere] Transform vers hélice - objets:', this.objects.length, 'targets:', this.targets.helix.length);
    this.transform(this.targets.helix, 2000);
  }

  // Fonction de transformation (Exact copy du code Three.js original)
  private transform(targets: THREE.Object3D[], duration: number): void {
    console.log(`🎬 [MaterialSphere] Transform début - ${this.objects.length} objets vers nouvelle formation`);
    
    // Supprimer les anciens tweens
    TweenGroup.removeAll();

    // Créer les nouvelles animations
    for (var i = 0; i < this.objects.length; i++) {
      var object = this.objects[i];
      var target = targets[i];

      // Créer et démarrer le tween de position avec le groupe explicite
      const positionTween = new TWEEN.Tween(object.position, TweenGroup)
        .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration)
        .easing(TWEEN.Easing.Exponential.InOut);
      
      positionTween.start();

      // Créer et démarrer le tween de rotation avec le groupe explicite
      const rotationTween = new TWEEN.Tween(object.rotation, TweenGroup)
        .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
        .easing(TWEEN.Easing.Exponential.InOut);
      
      rotationTween.start();
    }

    const activeTweens = TweenGroup.getAll().length;
    console.log(`✅ [MaterialSphere] ${activeTweens} tweens créés et démarrés`);
  }

  // Mettre à jour les matériaux sans recréer la sphère
  updateMaterials(materials: Material[]): void {
    console.log('🔄 [MaterialSphere] Mise à jour de la sphère avec', materials.length, 'matériaux');
    
    // Si le nombre de matériaux a changé, recréer complètement
    if (materials.length !== this.objects.length) {
      this.createSphere({ radius: 800, materials });
      return;
    }

    console.log('✅ [MaterialSphere] Matériaux mis à jour');
  }

  // Nettoyer la sphère
  clearSphere(): void {
    console.log('🧹 [MaterialSphere] Nettoyage de la sphère');

    // Supprimer les objets de la scène
    this.objects.forEach(obj => {
      this.scene.remove(obj);
    });
    this.objects = [];
    
    // Vider les targets
    this.targets.sphere = [];
    this.targets.grid = [];
    this.targets.helix = [];
  }

  // Détruire complètement
  destroy(): void {
    console.log('💥 [MaterialSphere] Destruction');
    this.clearSphere();
  }
}

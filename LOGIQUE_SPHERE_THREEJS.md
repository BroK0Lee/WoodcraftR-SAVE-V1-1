# 🌍 Logique Sphère Three.js - Tableau Périodique Adaptée

## 📋 **Algorithme de référence - Tableau Périodique Three.js**

L'exemple du tableau périodique de Three.js utilise un algorithme de positionnement sphérique basé sur les **coordonnées sphériques** avec distribution uniforme.

## 🔧 **Implémentation de référence**

```typescript
// Algorithme inspiré du tableau périodique Three.js
// Source: https://threejs.org/examples/#css3d_periodictable

export class SphericalDistribution {
  
  /**
   * Calcule les positions sphériques pour N éléments selon l'algorithme Three.js
   * Basé sur la spirale de Fibonacci avec distribution uniforme
   */
  static calculateSpherePositions(
    count: number, 
    radius: number = 200
  ): Array<{ x: number, y: number, z: number, phi: number, theta: number }> {
    
    const positions: Array<{ x: number, y: number, z: number, phi: number, theta: number }> = [];
    
    for (let i = 0; i < count; i++) {
      // === ALGORITHME TROIS.JS ORIGINAL ===
      
      // Distribution uniforme sur la sphère (spirale de Fibonacci)
      const phi = Math.acos(-1 + (2 * i) / count);        // Latitude [0, π]
      const theta = Math.sqrt(count * Math.PI) * phi;      // Longitude avec spirale dorée
      
      // Conversion coordonnées sphériques → cartésiennes
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      positions.push({ x, y, z, phi, theta });
    }
    
    return positions;
  }
  
  /**
   * Version optimisée pour 12 éléments avec distribution manuelle
   * Inspirée du tableau périodique mais adaptée à nos besoins
   */
  static calculateOptimal12Positions(radius: number = 200) {
    // Distribution manuelle optimisée pour 12 éléments
    // Inspirée de la géométrie icosaédrique
    const positions = [
      // Pôles
      { phi: 0, theta: 0 },                                     // Nord
      { phi: Math.PI, theta: 0 },                               // Sud
      
      // Couronne arctique (latitude ≈ 31.7°)
      { phi: Math.PI * 0.176, theta: 0 },
      { phi: Math.PI * 0.176, theta: Math.PI * 0.4 },
      { phi: Math.PI * 0.176, theta: Math.PI * 0.8 },
      { phi: Math.PI * 0.176, theta: Math.PI * 1.2 },
      { phi: Math.PI * 0.176, theta: Math.PI * 1.6 },
      
      // Couronne antarctique (latitude ≈ 148.3°) - décalée de 36°
      { phi: Math.PI * 0.824, theta: Math.PI * 0.2 },
      { phi: Math.PI * 0.824, theta: Math.PI * 0.6 },
      { phi: Math.PI * 0.824, theta: Math.PI * 1.0 },
      { phi: Math.PI * 0.824, theta: Math.PI * 1.4 },
      { phi: Math.PI * 0.824, theta: Math.PI * 1.8 }
    ];
    
    return positions.map(({ phi, theta }) => {
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      return { x, y, z, phi, theta };
    });
  }
}

/**
 * Classe pour gérer l'orientation CSS3D selon la méthode Three.js
 */
export class CSS3DOrientation {
  
  /**
   * Oriente un objet CSS3D pour qu'il regarde vers l'extérieur de la sphère
   * Méthode utilisée dans le tableau périodique Three.js
   */
  static orientTowardsCamera(
    object: CSS3DObject, 
    position: THREE.Vector3,
    camera: THREE.Camera
  ): void {
    
    // === MÉTHODE TABLEAU PÉRIODIQUE ===
    
    // 1. Positionner l'objet
    object.position.copy(position);
    
    // 2. Calculer le vecteur normal (du centre vers la position)
    const normal = position.clone().normalize();
    
    // 3. Calculer la direction vers la caméra
    const cameraDirection = camera.position.clone().sub(position).normalize();
    
    // 4. Créer une matrice de rotation pour orienter vers la caméra
    const matrix = new THREE.Matrix4();
    matrix.lookAt(position, camera.position, camera.up);
    
    // 5. Appliquer la rotation à l'objet CSS3D
    object.rotation.setFromRotationMatrix(matrix);
    
    // 6. Ajustement spécifique pour CSS3D (compensation Y flip)
    object.rotation.y += Math.PI;
  }
  
  /**
   * Version simplifiée : orientation fixe vers l'extérieur
   * Plus simple et souvent suffisante
   */
  static orientOutward(object: CSS3DObject, position: THREE.Vector3): void {
    object.position.copy(position);
    
    // Calculer le point de visée (extérieur de la sphère)
    const normal = position.clone().normalize();
    const target = position.clone().add(normal.multiplyScalar(100));
    
    // Orienter vers l'extérieur
    object.lookAt(target);
    
    // Compensation CSS3D
    object.rotation.y += Math.PI;
  }
}

/**
 * Animation de transition inspirée du tableau périodique
 */
export class SphereTransition {
  
  /**
   * Anime les objets depuis des positions aléatoires vers la sphère
   * Méthode exacte du tableau périodique Three.js
   */
  static animateToSphere(
    objects: CSS3DObject[],
    targetPositions: Array<{ x: number, y: number, z: number }>,
    duration: number = 2000
  ): Promise<void> {
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Positions de départ aléatoires (comme dans le tableau périodique)
      const startPositions = objects.map(() => ({
        x: Math.random() * 4000 - 2000,
        y: Math.random() * 4000 - 2000,
        z: Math.random() * 4000 - 2000
      }));
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Fonction d'easing identique au tableau périodique
        const eased = CSS3DTransition.easeOutExpo(progress);
        
        objects.forEach((object, index) => {
          const start = startPositions[index];
          const target = targetPositions[index];
          
          if (start && target) {
            // Interpolation linéaire des positions
            object.position.x = start.x + (target.x - start.x) * eased;
            object.position.y = start.y + (target.y - start.y) * eased;
            object.position.z = start.z + (target.z - start.z) * eased;
            
            // Réorienter pendant l'animation
            CSS3DOrientation.orientOutward(object, object.position);
          }
        });
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }
  
  /**
   * Fonction d'easing utilisée dans le tableau périodique
   */
  static easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }
}

/**
 * Gestionnaire de transformations (grille, hélice, sphère)
 * Inspiré du tableau périodique qui a plusieurs modes de vue
 */
export class ViewTransforms {
  
  static sphere(objects: CSS3DObject[], radius: number = 200): void {
    const positions = SphericalDistribution.calculateSpherePositions(objects.length, radius);
    
    objects.forEach((object, index) => {
      const pos = positions[index];
      if (pos) {
        object.position.set(pos.x, pos.y, pos.z);
        CSS3DOrientation.orientOutward(object, object.position);
      }
    });
  }
  
  static grid(objects: CSS3DObject[], spacing: number = 200): void {
    const cols = Math.ceil(Math.sqrt(objects.length));
    
    objects.forEach((object, index) => {
      const x = (index % cols) * spacing - (cols * spacing) / 2;
      const y = 0;
      const z = Math.floor(index / cols) * spacing - (Math.floor(objects.length / cols) * spacing) / 2;
      
      object.position.set(x, y, z);
      object.rotation.set(0, 0, 0);
    });
  }
  
  static helix(objects: CSS3DObject[], radius: number = 200, turns: number = 2): void {
    objects.forEach((object, index) => {
      const theta = (index / objects.length) * Math.PI * 2 * turns;
      const y = (index / objects.length) * 1000 - 500;
      
      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);
      
      object.position.set(x, y, z);
      object.rotation.y = theta + Math.PI;
    });
  }
}
```

## 🎯 **Différences clés avec notre implémentation actuelle**

### **1. Algorithme de distribution**
- **Three.js** : Spirale de Fibonacci pure `θ = √(N×π) × φ`
- **Notre version** : Distribution manuelle optimisée pour 12 éléments

### **2. Orientation des objets**
- **Three.js** : Orientation dynamique vers la caméra
- **Notre version** : Orientation fixe vers l'extérieur

### **3. Animation**
- **Three.js** : Positions de départ complètement aléatoires
- **Notre version** : Positions de départ dans un volume plus restreint

## 🚀 **Recommandation d'intégration**

Pour adopter la logique Three.js pure, nous devrions :

1. **Remplacer** notre algorithme manuel par la spirale de Fibonacci
2. **Utiliser** l'orientation dynamique vers la caméra
3. **Élargir** le volume de départ pour l'animation
4. **Ajouter** les modes de vue alternatifs (grille, hélice)

Cette approche donnera un résultat plus proche de l'exemple officiel Three.js.

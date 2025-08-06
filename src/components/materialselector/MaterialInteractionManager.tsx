import * as THREE from 'three';
import { gsap } from 'gsap';
import { Material } from './MaterialSphere';

// Interface pour la configuration des interactions
interface InteractionConfig {
  camera: THREE.PerspectiveCamera;
  container: HTMLElement;
  onMaterialClick: (material: Material) => void;
}

// Classe pour gérer les interactions avec les matériaux
export class MaterialInteractionManager {
  private config: InteractionConfig;
  private eventCleanupFunctions: Array<() => void> = [];

  constructor(config: InteractionConfig) {
    this.config = config;
    
    // Les événements seront configurés plus tard via la méthode setupMaterialInteractions()
    // car les éléments DOM des matériaux n'existent pas encore au moment de la construction
  }

  // Configurer les interactions avec les cartes matériaux
  setupMaterialInteractions(materials: Material[]): void {
    console.log('🔧 [MaterialInteractionManager] Configuration des interactions pour', materials.length, 'matériaux');
    
    // Nettoyer les anciennes interactions
    this.cleanupEventListeners();

    let elementsFound = 0;
    let elementsNotFound = 0;

    // Configuration des interactions avec les matériaux
    materials.forEach((material) => {
      const elementId = `material-${material.id}`;
      const element = document.getElementById(elementId);
      
      if (!element) {
        console.warn(`❌ [MaterialInteractionManager] Élément DOM non trouvé: ${elementId}`);
        elementsNotFound++;
        return;
      }

      console.log(`✅ [MaterialInteractionManager] Élément DOM trouvé: ${elementId}`);
      elementsFound++;

      // Permettre les interactions sur la carte
      element.style.pointerEvents = 'auto';
      element.style.cursor = 'pointer';
      element.style.position = 'relative'; // Assurer le positionnement pour z-index
      element.style.zIndex = '1000'; // Placer au-dessus du CSS3DRenderer

      // Forcer le recalcul du layout pour éviter les problèmes CSS3DRenderer
      element.offsetHeight; // Force reflow

      // Gestionnaire de clic
      const handleClick = () => {
        console.log(`🎯 [MaterialInteractionManager] Clic détecté sur matériau:`, material.name);
        
        // Animation de sélection avec GSAP
        gsap.fromTo(
          element,
          { scale: 1 },
          { 
            scale: 1.1,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
          }
        );

        // Délai pour l'animation puis sélection
        setTimeout(() => {
          console.log(`📞 [MaterialInteractionManager] Appel onMaterialClick pour:`, material.name);
          this.config.onMaterialClick(material);
        }, 200);
      };

      // Gestionnaires d'interaction
      const handleMouseEnter = () => {
        gsap.to(element, {
          scale: 1.05,
          duration: 0.2,
          ease: "power2.out",
          transformOrigin: "center center", // Fixer l'origine de transformation
          force3D: true // Forcer l'accélération 3D
        });
      };

      const handleMouseLeave = () => {
        gsap.to(element, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out",
          transformOrigin: "center center", // Fixer l'origine de transformation
          force3D: true // Forcer l'accélération 3D
        });
      };

      // Ajouter les événements avec options pour CSS3DRenderer
      const eventOptions = { passive: false, capture: true };
      element.addEventListener('click', handleClick, eventOptions);
      element.addEventListener('mouseenter', handleMouseEnter, eventOptions);
      element.addEventListener('mouseleave', handleMouseLeave, eventOptions);

      // Ajouter aussi les événements tactiles pour compatibilité mobile
      element.addEventListener('touchstart', handleClick, eventOptions);

      // Stocker les références pour le nettoyage
      this.eventCleanupFunctions.push(() => {
        const eventOptions = { passive: false, capture: true };
        element.removeEventListener('click', handleClick, eventOptions);
        element.removeEventListener('mouseenter', handleMouseEnter, eventOptions);
        element.removeEventListener('mouseleave', handleMouseLeave, eventOptions);
        element.removeEventListener('touchstart', handleClick, eventOptions);
      });
    });

    // Résumé de la configuration
    console.log(`📊 [MaterialInteractionManager] Configuration terminée: ${elementsFound} éléments configurés, ${elementsNotFound} éléments manqués`);
    
    if (elementsNotFound > 0) {
      console.warn(`⚠️ [MaterialInteractionManager] ${elementsNotFound} éléments DOM manquants - les interactions ne fonctionneront pas pour ces matériaux`);
    } else {
      console.log(`✅ [MaterialInteractionManager] Toutes les interactions configurées avec succès`);
    }
  }

  // Nettoyer les écouteurs d'événements des cartes matériaux
  private cleanupEventListeners(): void {
    this.eventCleanupFunctions.forEach(cleanup => cleanup());
    this.eventCleanupFunctions = [];
  }

  // Nettoyer toutes les ressources
  destroy(): void {
    this.cleanupEventListeners();
  }
}

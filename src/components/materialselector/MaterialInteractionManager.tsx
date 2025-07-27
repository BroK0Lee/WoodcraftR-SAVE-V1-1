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
    
    // Pas d'écouteurs d'événements ici - ils seront ajoutés par setupMaterialInteractions
  }

  // Configurer les interactions avec les cartes matériaux
  setupMaterialInteractions(materials: Material[]): void {
    // Nettoyer les anciennes interactions
    this.cleanupEventListeners();

    // Configuration des interactions avec les matériaux
    materials.forEach((material) => {
      const element = document.getElementById(`material-${material.id}`);
      if (!element) return;

      // Permettre les interactions sur la carte
      element.style.pointerEvents = 'auto';
      element.style.cursor = 'pointer';

      // Gestionnaire de clic
      const handleClick = () => {
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
          this.config.onMaterialClick(material);
        }, 200);
      };

      // Gestionnaires d'interaction
      const handleMouseEnter = () => {
        gsap.to(element, {
          scale: 1.05,
          duration: 0.2,
          ease: "power2.out"
        });
      };

      const handleMouseLeave = () => {
        gsap.to(element, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out"
        });
      };

      // Ajouter les événements
      element.addEventListener('click', handleClick);
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);

      // Stocker les références pour le nettoyage
      this.eventCleanupFunctions.push(() => {
        element.removeEventListener('click', handleClick);
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      });
    });
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

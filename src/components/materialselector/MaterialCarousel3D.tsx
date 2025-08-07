import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { Material } from './MaterialSphere';
import './carousel3d.css';

// Enregistrer le plugin Draggable
gsap.registerPlugin(Draggable);

// Interface pour la configuration du carousel
interface CarouselConfig {
  radius: number;
  materials: Material[];
  onMaterialSelect: (material: Material) => void;
  useScrollControl?: boolean;  // Option pour utiliser le scroll au lieu du drag
  snapAfterScroll?: boolean;   // Option pour snap automatique après scroll
}

// Classe pour gérer le carousel 3D (Inspiré du CodePen GSAP)
export class MaterialCarousel3D {
  private container: HTMLElement;
  private ring!: HTMLElement; // ! pour indiquer qu'il sera initialisé dans createDOMStructure
  private dragger!: HTMLElement; // ! pour indiquer qu'il sera initialisé dans createDOMStructure
  private materials: Material[] = [];
  private config: CarouselConfig;
  private draggableInstance: Draggable[] | null = null;
  private currentRotation: number = 0;
  private wheelHandler?: (e: WheelEvent) => void; // Handler pour les événements scroll

  constructor(container: HTMLElement, config: CarouselConfig) {
    this.container = container;
    this.config = config;
    this.materials = config.materials;

    // Créer la structure DOM
    this.createDOMStructure();
    
    console.log('🎠 [MaterialCarousel3D] Carousel initialisé avec', this.materials.length, 'matériaux');
  }

  // Créer la structure DOM du carousel (avec wrapper pour React mais structure CodePen)
  private createDOMStructure(): void {
    // Nettoyer le container parent et REMETTRE la classe wrapper pour React
    this.container.innerHTML = '';
    this.container.className = 'carousel-parent'; // NÉCESSAIRE pour React et encapsulation
    
    // 1. Container principal (.container dans CodePen) - DIRECT dans le wrapper
    const containerDiv = document.createElement('div');
    containerDiv.className = 'container';

    // 2. Ring principal (#ring dans CodePen) - VA DANS LE CONTAINER
    this.ring = document.createElement('div');
    this.ring.id = 'ring';
    
    // Ajouter le ring dans le container
    containerDiv.appendChild(this.ring);

    // 3. Vignette (.vignette dans CodePen) - OUTSIDE du container
    const vignette = document.createElement('div');
    vignette.className = 'vignette';

    // 4. Dragger (#dragger dans CodePen) - OUTSIDE du container
    this.dragger = document.createElement('div');
    this.dragger.id = 'dragger';

    // Assemblage dans le container parent (exactement comme CodePen)
    this.container.appendChild(containerDiv);  // Container avec ring à l'intérieur
    this.container.appendChild(vignette);      // Vignette à l'extérieur
    this.container.appendChild(this.dragger);  // Dragger à l'extérieur

    console.log('🏗️ [MaterialCarousel3D] Structure DOM créée EXACTEMENT comme CodePen');
  }

  // Créer le carousel avec les matériaux
  public createCarousel(): void {
    console.log('🎨 [MaterialCarousel3D] Création du carousel avec', this.materials.length, 'matériaux');

    // Nettoyer le ring
    this.ring.innerHTML = '';

    // Calculer l'angle entre chaque carte
    const angleStep = 360 / this.materials.length;
    const radius = this.config.radius;

    // Créer les cartes matériaux
    this.materials.forEach((material, index) => {
      const card = this.createMaterialCard(material, index);
      this.ring.appendChild(card);
    });

    // Configuration GSAP initiale (comme CodePen)
    this.setupGSAPAnimation(angleStep, radius);

    // Configurer les interactions
    // Les interactions Draggable sont maintenant configurées dans setupGSAPAnimation

    console.log('✅ [MaterialCarousel3D] Carousel créé avec succès');
  }

  // Créer une carte matériau individuelle (EXACTEMENT comme CodePen avec .img)
  private createMaterialCard(material: Material, _index: number): HTMLElement {
    const card = document.createElement('div');
    card.className = 'img'; // EXACTEMENT comme CodePen original
    card.id = `carousel-material-${material.id}`;
    card.setAttribute('data-material-id', material.id);

    // Pas de contenu HTML - l'image sera appliquée via CSS background dans GSAP
    // Exactement comme le CodePen original

    // Ajouter les événements de clic (compatible avec MaterialInteractionManager)
    card.addEventListener('click', () => {
      console.log('🎯 [MaterialCarousel3D] Clic sur matériau:', material.name);
      this.config.onMaterialSelect(material);
    });

    return card;
  }

  // Configuration GSAP initiale (version scroll OU drag selon option)
  private setupGSAPAnimation(_angleStep: number, _radius: number): void {
    // Variables pour les interactions
    let xPos = 0;

    // Timeline d'initialisation (EXACTEMENT comme CodePen original)
    gsap.timeline()
      .set(this.dragger, { opacity: 0 }) //make the drag layer invisible
      .set(this.ring, { rotationY: 180 }) //set initial rotationY so the parallax jump happens off screen
      .set('.carousel-parent .img', { // apply transform rotations to each image
        rotateY: (i: number) => i * -36, // EXACTEMENT comme CodePen : -36 degrés
        transformOrigin: '50% 50% 500px', // EXACTEMENT comme CodePen : 500px
        z: -500, // EXACTEMENT comme CodePen : -500px
        backgroundImage: (i: number) => `url(${this.materials[i]?.image || ''})`, // Nos images au lieu de Picsum
        backgroundPosition: (i: number) => this.getBgPos(i), // EXACTEMENT comme CodePen
        backfaceVisibility: 'hidden'
      })
      .from('.carousel-parent .img', {
        duration: 1.5,
        y: 200,
        opacity: 0,
        stagger: 0.1,
        ease: 'expo'
      });

    // Choisir le type d'interaction selon la configuration
    if (this.config.useScrollControl) {
      this.setupScrollControl();
    } else {
      this.setupDragControl(xPos);
    }

    console.log('🎭 [MaterialCarousel3D] GSAP configuré avec contrôle:', 
                this.config.useScrollControl ? 'SCROLL' : 'DRAG');
  }

  // Configuration du contrôle par SCROLL (molette de souris)
  private setupScrollControl(): void {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Empêcher le scroll de page
      
      // Calculer la rotation basée sur deltaY (molette verticale)
      const scrollSensitivity = 0.5; // Ajustez la sensibilité
      const rotationDelta = e.deltaY * scrollSensitivity;
      
      // Appliquer la rotation
      gsap.to(this.ring, {
        rotationY: '+=' + rotationDelta,
        duration: 0.3,
        ease: 'power2.out',
        onUpdate: () => {
          gsap.set('.carousel-parent .img', { 
            backgroundPosition: (i: number) => this.getBgPos(i) 
          });
        }
      });

      // Debounce pour snap automatique après arrêt du scroll
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (this.config.snapAfterScroll) {
          this.snapToNearestCard();
        }
      }, 300);
    };

    // Ajouter l'event listener sur le container principal
    this.container.addEventListener('wheel', handleWheel, { passive: false });
    
    // Stocker la référence pour le cleanup
    this.wheelHandler = handleWheel;
  }

  // Configuration du contrôle par DRAG (original CodePen)
  private setupDragControl(xPos: number): void {
    this.draggableInstance = Draggable.create(this.dragger, {
      
      onDragStart: (e: any) => {
        if (e.touches) e.clientX = e.touches[0].clientX;
        xPos = Math.round(e.clientX);
      },

      onDrag: (e: any) => {
        if (e.touches) e.clientX = e.touches[0].clientX;

        gsap.to(this.ring, {
          rotationY: '-=' + ((Math.round(e.clientX) - xPos) % 360),
          onUpdate: () => {
            gsap.set('.carousel-parent .img', { 
              backgroundPosition: (i: number) => this.getBgPos(i) 
            });
          }
        });

        xPos = Math.round(e.clientX);
      },

      onDragEnd: () => {
        // gsap.to(ring, { rotationY: Math.round(gsap.getProperty(ring,'rotationY')/36)*36 }) // move to nearest photo...at the expense of the inertia effect
        gsap.set(this.dragger, { x: 0, y: 0 }); // reset drag layer
      }
    });
  }

  // Fonction getBgPos EXACTEMENT comme CodePen original
  private getBgPos(i: number): string {
    // returns the background-position string to create parallax movement in each image
    const rotationY = gsap.getProperty(this.ring, 'rotationY') as number;
    const bgPos = -gsap.utils.wrap(0, 360, rotationY - 180 - i * 36) / 360 * 400;
    return bgPos + 'px 0px';
  }

  // Méthode pour snap vers la carte la plus proche (publique pour usage externe)
  public snapToNearestCard(): void {
    const currentRotation = gsap.getProperty(this.ring, 'rotationY') as number;
    const angleStep = 360 / this.materials.length;
    
    // Trouver l'angle le plus proche
    const nearestIndex = Math.round(currentRotation / angleStep);
    const targetRotation = nearestIndex * angleStep;
    
    // Animer vers l'angle le plus proche
    gsap.to(this.ring, {
      rotationY: targetRotation,
      duration: 0.5,
      ease: 'power2.out'
    });
    
    this.currentRotation = targetRotation;
  }

  // Faire tourner le carousel vers un matériau spécifique
  public rotateToMaterial(materialId: string): void {
    const index = this.materials.findIndex(m => m.id === materialId);
    if (index === -1) return;

    const angleStep = 360 / this.materials.length;
    const targetRotation = index * angleStep;

    gsap.to(this.ring, {
      rotationY: targetRotation,
      duration: 1,
      ease: 'power2.out'
    });

    this.currentRotation = targetRotation;
    console.log('🎯 [MaterialCarousel3D] Rotation vers matériau:', materialId);
  }

  // Obtenir le matériau actuellement au centre
  public getCurrentMaterial(): Material | null {
    const normalizedRotation = ((this.currentRotation % 360) + 360) % 360;
    const angleStep = 360 / this.materials.length;
    const index = Math.round(normalizedRotation / angleStep) % this.materials.length;
    return this.materials[index] || null;
  }

  // Nettoyer les ressources
  public destroy(): void {
    console.log('🧹 [MaterialCarousel3D] Nettoyage du carousel');

    // Nettoyer Draggable
    if (this.draggableInstance) {
      this.draggableInstance.forEach(d => d.kill());
      this.draggableInstance = null;
    }

    // Nettoyer le wheel handler
    if (this.wheelHandler) {
      this.container.removeEventListener('wheel', this.wheelHandler);
      this.wheelHandler = undefined;
    }

    // Nettoyer GSAP avec les sélecteurs encapsulés
    gsap.killTweensOf(this.ring);
    gsap.killTweensOf('.carousel-parent .img');

    // Nettoyer DOM
    this.container.innerHTML = '';
  }

  // Méthodes utilitaires
  public getRadius(): number {
    return this.config.radius;
  }

  public getMaterials(): Material[] {
    return this.materials;
  }

  public updateMaterials(materials: Material[]): void {
    this.materials = materials;
    this.config.materials = materials;
    this.createCarousel();
  }
}

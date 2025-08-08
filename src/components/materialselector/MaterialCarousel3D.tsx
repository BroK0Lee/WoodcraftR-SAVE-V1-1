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
  private ring!: HTMLElement;
  private dragger!: HTMLElement;
  private containerDiv!: HTMLElement;
  private vignette!: HTMLElement;
  private cards: HTMLElement[] = [];
  private materials: Material[] = [];
  private config: CarouselConfig;
  private draggableInstance: Draggable[] | null = null;
  private currentRotation: number = 0;
  private wheelHandler?: (e: WheelEvent) => void;

  constructor(container: HTMLElement, config: CarouselConfig) {
    this.container = container;
    this.config = config;
    this.materials = config.materials;

    // Créer la structure DOM
    this.createDOMStructure();
    
    console.log('🎠 [MaterialCarousel3D] Carousel initialisé avec', this.materials.length, 'matériaux');
  }

  // Créer la structure DOM du carousel (selectorless)
  private createDOMStructure(): void {
    console.log('🏗️ [MaterialCarousel3D] Création de la structure DOM...');
    
    // Nettoyer le container parent et enlever toute dépendance de classe forcée
    this.container.innerHTML = '';

    // Styles de base pour le container fourni par le parent
    Object.assign(this.container.style, {
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      height: '100%'
    } as Partial<CSSStyleDeclaration>);
    
    // Debug: Vérifier les dimensions du container
    const rect = this.container.getBoundingClientRect();
    console.log('📏 [MaterialCarousel3D] Dimensions container:', {
      width: rect.width,
      height: rect.height,
      visible: rect.width > 0 && rect.height > 0
    });
    
    // 1. Container principal (perspective + couche 100%)
    this.containerDiv = document.createElement('div');
    Object.assign(this.containerDiv.style, {
      position: 'absolute',
      inset: '0',
      perspective: '2000px',
      width: '100%',
      height: '100%'
    } as Partial<CSSStyleDeclaration>);

    // 2. Ring principal - remplit le conteneur
    this.ring = document.createElement('div');
    Object.assign(this.ring.style, {
      position: 'absolute',
      width: '100%',
      height: '100%'
    } as Partial<CSSStyleDeclaration>);
    
    // Ajouter le ring dans le container
    this.containerDiv.appendChild(this.ring);

    // 3. Vignette (optionnelle, esthétique)
    this.vignette = document.createElement('div');
    Object.assign(this.vignette.style, {
      position: 'absolute',
      width: '1400px',
      height: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      background: 'linear-gradient(to left, rgba(0,0,0,1) 12%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 88%)'
    } as Partial<CSSStyleDeclaration>);

    // 4. Dragger - couche d'interaction
    this.dragger = document.createElement('div');
    Object.assign(this.dragger.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%'
    } as Partial<CSSStyleDeclaration>);

    // Assemblage dans le container parent
    this.container.appendChild(this.containerDiv);  // Container avec ring à l'intérieur
    this.container.appendChild(this.vignette);      // Vignette au-dessus
    this.container.appendChild(this.dragger);       // Dragger au-dessus

    console.log('🏗️ [MaterialCarousel3D] Structure DOM créée (selectorless)');
  }

  // Créer le carousel avec les matériaux
  public createCarousel(): void {
    console.log('🎨 [MaterialCarousel3D] Création du carousel avec', this.materials.length, 'matériaux');

    if (!this.ring) {
      console.error('❌ [MaterialCarousel3D] Ring non disponible pour createCarousel');
      return;
    }

    // Nettoyer le ring et les cartes
    this.ring.innerHTML = '';
    this.cards = [];

    // Calculer l'angle entre chaque carte
    const angleStep = 360 / this.materials.length;
    const radius = this.config.radius;

    console.log('🔧 [MaterialCarousel3D] Configuration:', {
      angleStep,
      radius,
      materialsCount: this.materials.length
    });

    // Créer les cartes matériaux et stocker leurs refs
    this.materials.forEach((material, index) => {
      const card = this.createMaterialCard(material, index);
      this.ring.appendChild(card);
      this.cards.push(card);
      console.log(`🃏 [MaterialCarousel3D] Carte créée: ${material.name} (${index})`);
    });

    console.log('📦 [MaterialCarousel3D] Ring contient maintenant:', this.ring.children.length, 'éléments');

    // Configuration GSAP initiale
    this.setupGSAPAnimation(angleStep, radius);

    console.log('✅ [MaterialCarousel3D] Carousel créé avec succès');
  }

  // Créer une carte matériau individuelle
  private createMaterialCard(material: Material, _index: number): HTMLElement {
    const card = document.createElement('div');
    // Styles de base de la carte (pas de classes globales requises)
    Object.assign(card.style, {
      position: 'absolute',
      width: '100%',
      height: '100%'
    } as Partial<CSSStyleDeclaration>);

    card.id = `carousel-material-${material.id}`;
    card.setAttribute('data-material-id', material.id);

    // Interaction clic
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

    // Timeline d'initialisation
    gsap.timeline()
      .set(this.dragger, { opacity: 0 }) // rendre la couche drag invisible
      .set(this.ring, { rotationY: 180 }) // rotation initiale pour parallax off screen
      .set(this.cards, { // appliquer les transforms à chaque image
        rotateY: (i: number) => i * -36,
        transformOrigin: '50% 50% 500px',
        z: -500,
        backgroundImage: (i: number) => {
          const material = this.materials[i];
          const imageUrl = (material as any)?.maps?.basecolor || (material as any)?.image || '';
          console.log(`🖼️ [MaterialCarousel3D] Application texture ${i}:`, imageUrl);
          return `url(${imageUrl})`;
        },
        backgroundSize: 'cover',
        backgroundPosition: (i: number) => this.getBgPos(i),
        backfaceVisibility: 'hidden'
      } as any)
      .from(this.cards, {
        duration: 1.5,
        y: 200,
        opacity: 0,
        stagger: 0.1,
        ease: 'expo'
      } as any);

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
          gsap.set(this.cards, { 
            backgroundPosition: (i: number) => this.getBgPos(i) 
          } as any);
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
            gsap.set(this.cards, { 
              backgroundPosition: (i: number) => this.getBgPos(i) 
            } as any);
          }
        });

        xPos = Math.round(e.clientX);
      },

      onDragEnd: () => {
        gsap.set(this.dragger, { x: 0, y: 0 }); // reset drag layer
      }
    });
  }

  // Fonction getBgPos EXACTEMENT comme CodePen original
  private getBgPos(i: number): string {
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

  // Redimensionner le carousel en fonction du container
  public resize(): void {
    console.log('📐 [MaterialCarousel3D] Redimensionnement du carousel...');
    
    if (!this.container || !this.ring) {
      console.warn('⚠️ [MaterialCarousel3D] Container ou ring non disponible pour le resize');
      return;
    }

    // Obtenir les nouvelles dimensions du container
    const containerRect = this.container.getBoundingClientRect();
    const newWidth = containerRect.width;
    const newHeight = containerRect.height;
    
    console.log(`📏 [MaterialCarousel3D] Nouvelles dimensions: ${newWidth}x${newHeight}`);
    
    // Calculer le nouveau rayon basé sur la taille du container
    const minDimension = Math.min(newWidth, newHeight);
    const newRadius = Math.max(200, minDimension * 0.3);
    
    // Mettre à jour le rayon si il a changé significativement
    if (Math.abs(newRadius - this.config.radius) > 20) {
      console.log(`🔄 [MaterialCarousel3D] Ajustement rayon: ${this.config.radius} -> ${newRadius}`);
      this.config.radius = newRadius;
      
      // Recréer le carousel avec le nouveau rayon
      this.createCarousel();
    } else {
      console.log('✅ [MaterialCarousel3D] Rayon inchangé, pas de recréation nécessaire');
    }
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

    // Nettoyer GSAP
    gsap.killTweensOf(this.ring);
    gsap.killTweensOf(this.cards);

    // Nettoyer DOM
    this.container.innerHTML = '';
    this.cards = [];
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

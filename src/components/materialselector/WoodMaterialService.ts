/**
 * Service pour la gestion dynamique des matériaux de bois
 * Charge les matériaux depuis le système de fichiers local
 */

export interface WoodCharacteristics {
  hardness: {
    value: number;
    unit: string;
    classification: string;
  };
  density: {
    value: number;
    unit: string;
  };
  workability: {
    cutting: string;
    drilling: string;
    finishing: string;
  };
  appearance: {
    grain: string;
    color: string;
    texture: string;
  };
  sustainability: {
    origin: string;
    certification: string;
    carbon_impact: string;
  };
}

export interface WoodMaterial {
  id: string;
  name: string;
  image: string;
  price?: number;
  description?: string;
  characteristics: WoodCharacteristics;
}

export class WoodMaterialService {
  private static instance: WoodMaterialService;
  private materials: WoodMaterial[] = [];
  private isLoaded = false;

  // Types de bois disponibles (correspondant aux dossiers)
  private readonly woodTypes = [
    'chataignier',
    'chene', 
    'frene',
    'hetre',
    'merisier',
    'noyer',
    'sycomore'
  ];

  private constructor() {}

  static getInstance(): WoodMaterialService {
    if (!WoodMaterialService.instance) {
      WoodMaterialService.instance = new WoodMaterialService();
    }
    return WoodMaterialService.instance;
  }

  /**
   * Charge tous les matériaux depuis le système de fichiers
   */
  async loadAllMaterials(): Promise<WoodMaterial[]> {
    if (this.isLoaded) {
      return this.materials;
    }

    console.log('🌳 [WoodMaterialService] Chargement des matériaux depuis le système de fichiers...');

    try {
      const materialPromises = this.woodTypes.map(async (woodType) => {
        try {
          // Chargement des caractéristiques depuis le fichier _caract.txt
          const characteristics = await this.loadCharacteristics(woodType);
          
          // Construction de l'URL de l'image
          const imageUrl = `/src/assets/textures/wood/${woodType}/${woodType}_basecolor.jpg`;
          
          // Création du matériau
          const material: WoodMaterial = {
            id: woodType,
            name: this.formatWoodName(woodType),
            image: imageUrl,
            price: this.calculatePrice(characteristics),
            description: this.generateDescription(characteristics),
            characteristics
          };

          console.log(`✅ [WoodMaterialService] Matériau ${woodType} chargé avec succès`);
          return material;

        } catch (error) {
          console.warn(`⚠️ [WoodMaterialService] Erreur lors du chargement de ${woodType}:`, error);
          
          // Matériau de fallback en cas d'erreur
          return this.createFallbackMaterial(woodType);
        }
      });

      this.materials = await Promise.all(materialPromises);
      this.isLoaded = true;

      console.log(`🎯 [WoodMaterialService] ${this.materials.length} matériaux chargés avec succès`);
      return this.materials;

    } catch (error) {
      console.error('❌ [WoodMaterialService] Erreur critique lors du chargement des matériaux:', error);
      throw error;
    }
  }

  /**
   * Charge les caractéristiques d'un type de bois depuis son fichier _caract.txt
   */
  private async loadCharacteristics(woodType: string): Promise<WoodCharacteristics> {
    const caractUrl = `/src/assets/textures/wood/${woodType}/${woodType}_caract.txt`;
    
    try {
      const response = await fetch(caractUrl);
      if (!response.ok) {
        throw new Error(`Fichier caractéristiques non trouvé: ${response.status}`);
      }
      
      const content = await response.text();
      return this.parseCharacteristics(content);
      
    } catch (error) {
      console.warn(`⚠️ [WoodMaterialService] Impossible de charger ${caractUrl}:`, error);
      return this.getDefaultCharacteristics(woodType);
    }
  }

  /**
   * Parse le contenu d'un fichier de caractéristiques (format markdown)
   */
  private parseCharacteristics(content: string): WoodCharacteristics {
    // Expressions régulières pour extraire les données du markdown
    const densityMatch = content.match(/(?:Densité.*?(\d+)\s*kg\/m³|(\d+)\s*kg\/m³)/i);
    const hardnessMatch = content.match(/(?:Janka.*?(\d+)\s*N|Brinell\s*(\d+))/i);
    const couleurMatch = content.match(/Couleur dominante\s*:\s*([^\n\[]+)/i);
    const grainMatch = content.match(/grain\s+([^,\n]+)/i);
    const classementMatch = content.match(/Classement pratique\s*:\s*\*\*([^*]+)\*\*/i);

    // Extraction de la densité
    const densityValue = densityMatch ? parseInt(densityMatch[1] || densityMatch[2] || '600') : 600;
    
    // Extraction de la dureté
    const hardnessValue = hardnessMatch ? parseInt(hardnessMatch[1] || hardnessMatch[2] || '500') : 500;
    
    // Classification de dureté basée sur la valeur
    let hardnessClassification = 'Moyen';
    if (classementMatch) {
      const classification = classementMatch[1].toLowerCase();
      if (classification.includes('dur')) {
        hardnessClassification = classification.includes('mi-') ? 'Mi-dur' : 'Dur';
      } else if (classification.includes('tendre')) {
        hardnessClassification = 'Tendre';
      }
    } else if (hardnessValue < 400) {
      hardnessClassification = 'Tendre';
    } else if (hardnessValue > 700) {
      hardnessClassification = 'Dur';
    }

    // Extraction des autres informations
    const color = couleurMatch ? couleurMatch[1].trim() : 'Naturel';
    const grain = grainMatch ? grainMatch[1].trim() : 'Moyen';

    return {
      hardness: {
        value: hardnessValue,
        unit: 'N',
        classification: hardnessClassification
      },
      density: {
        value: densityValue,
        unit: 'kg/m³'
      },
      workability: {
        cutting: 'Bon',
        drilling: 'Bon',
        finishing: 'Bon'
      },
      appearance: {
        grain: grain,
        color: color,
        texture: 'Lisse'
      },
      sustainability: {
        origin: 'Europe',
        certification: 'FSC',
        carbon_impact: 'Faible'
      }
    };
  }

  /**
   * Retourne des caractéristiques par défaut pour un type de bois
   */
  private getDefaultCharacteristics(woodType: string): WoodCharacteristics {
    const defaults: Record<string, Partial<WoodCharacteristics>> = {
      chene: {
        hardness: { value: 750, unit: 'N', classification: 'Dur' },
        density: { value: 700, unit: 'kg/m³' },
        appearance: { grain: 'Prononcé', color: 'Brun doré', texture: 'Rugueuse' }
      },
      noyer: {
        hardness: { value: 650, unit: 'N', classification: 'Dur' },
        density: { value: 650, unit: 'kg/m³' },
        appearance: { grain: 'Beau', color: 'Brun chocolat', texture: 'Fine' }
      },
      hetre: {
        hardness: { value: 720, unit: 'N', classification: 'Dur' },
        density: { value: 710, unit: 'kg/m³' },
        appearance: { grain: 'Fin', color: 'Rose pâle', texture: 'Lisse' }
      }
    };

    const specific = defaults[woodType] || {};
    
    return {
      hardness: { value: 500, unit: 'N', classification: 'Moyen', ...specific.hardness },
      density: { value: 600, unit: 'kg/m³', ...specific.density },
      workability: { cutting: 'Bon', drilling: 'Bon', finishing: 'Bon', ...specific.workability },
      appearance: { grain: 'Moyen', color: 'Naturel', texture: 'Lisse', ...specific.appearance },
      sustainability: { origin: 'Europe', certification: 'FSC', carbon_impact: 'Faible', ...specific.sustainability }
    };
  }

  /**
   * Formate le nom d'un type de bois pour l'affichage
   */
  private formatWoodName(woodType: string): string {
    const names: Record<string, string> = {
      chataignier: 'Châtaignier',
      chene: 'Chêne',
      frene: 'Frêne',
      hetre: 'Hêtre',
      merisier: 'Merisier',
      noyer: 'Noyer',
      sycomore: 'Sycomore'
    };
    
    return names[woodType] || woodType.charAt(0).toUpperCase() + woodType.slice(1);
  }

  /**
   * Calcule un prix basé sur les caractéristiques
   */
  private calculatePrice(characteristics: WoodCharacteristics): number {
    const basePrice = 30;
    const hardnessMultiplier = characteristics.hardness.value / 500;
    const densityMultiplier = characteristics.density.value / 600;
    
    return Math.round(basePrice * (hardnessMultiplier + densityMultiplier) / 2);
  }

  /**
   * Génère une description basée sur les caractéristiques
   */
  private generateDescription(characteristics: WoodCharacteristics): string {
    const hardnessDesc = characteristics.hardness.classification.toLowerCase();
    const grainDesc = characteristics.appearance.grain.toLowerCase();
    const colorDesc = characteristics.appearance.color.toLowerCase();
    
    return `Bois ${hardnessDesc} au grain ${grainDesc} et à la couleur ${colorDesc}. Idéal pour de nombreux projets de menuiserie.`;
  }

  /**
   * Crée un matériau de fallback en cas d'erreur
   */
  private createFallbackMaterial(woodType: string): WoodMaterial {
    return {
      id: woodType,
      name: this.formatWoodName(woodType),
      image: `/src/assets/textures/wood/${woodType}/${woodType}_basecolor.jpg`,
      price: 35,
      description: `Bois de ${this.formatWoodName(woodType)} - Caractéristiques en cours de chargement`,
      characteristics: this.getDefaultCharacteristics(woodType)
    };
  }

  /**
   * Retourne la liste des matériaux chargés
   */
  getMaterials(): WoodMaterial[] {
    return this.materials;
  }

  /**
   * Retourne un matériau par son ID
   */
  getMaterialById(id: string): WoodMaterial | undefined {
    return this.materials.find(material => material.id === id);
  }

  /**
   * Vérifie si les matériaux sont chargés
   */
  isReady(): boolean {
    return this.isLoaded;
  }
}

// Export d'une instance par défaut
export const woodMaterialService = WoodMaterialService.getInstance();

/**
 * Service global unifié pour le chargement des matériaux
 * Utilise uniquement les images locales et précharge tout au démarrage
 */

import { GlobalWoodMaterial } from '@/store/globalMaterialStore';

// Interface pour les caractéristiques brutes du fichier _caract.txt
interface RawWoodCharacteristics {
  generalDescription: string;
  colorAspect: {
    dominantColor: string;
    variations: string;
    grain: string;
  };
  density: {
    typical: string;
    range: string;
  };
  hardness: {
    janka?: string;
    classification: string;
  };
  applications: string[];
  raw: string;
}

export class GlobalWoodMaterialService {
  private static instance: GlobalWoodMaterialService;

  // Liste des matériaux disponibles (correspondant aux dossiers dans assets)
  private readonly AVAILABLE_WOODS = [
    { id: 'chataignier', displayName: 'Châtaignier' },
    { id: 'chene', displayName: 'Chêne' },
    { id: 'frene', displayName: 'Frêne' },
    { id: 'hetre', displayName: 'Hêtre' },
    { id: 'merisier', displayName: 'Merisier' },
    { id: 'noyer', displayName: 'Noyer' },
    { id: 'sycomore', displayName: 'Sycomore' }
  ];

  private constructor() {}

  static getInstance(): GlobalWoodMaterialService {
    if (!GlobalWoodMaterialService.instance) {
      GlobalWoodMaterialService.instance = new GlobalWoodMaterialService();
    }
    return GlobalWoodMaterialService.instance;
  }

  /**
   * Charge tous les matériaux depuis les assets locaux
   */
  async loadAllMaterials(): Promise<GlobalWoodMaterial[]> {
    console.log('🌳 [GlobalWoodMaterialService] Chargement des matériaux depuis les assets locaux...');

    const materials: GlobalWoodMaterial[] = [];

    for (const wood of this.AVAILABLE_WOODS) {
      try {
        const material = await this.loadSingleMaterial(wood.id, wood.displayName);
        materials.push(material);
        console.log(`✅ [GlobalWoodMaterialService] ${wood.displayName} chargé`);
      } catch (error) {
        console.warn(`⚠️ [GlobalWoodMaterialService] Erreur pour ${wood.displayName}:`, error);
        // Créer un matériau de fallback
        const fallbackMaterial = this.createFallbackMaterial(wood.id, wood.displayName);
        materials.push(fallbackMaterial);
      }
    }

    console.log(`🎯 [GlobalWoodMaterialService] ${materials.length} matériaux chargés au total`);
    return materials;
  }

  /**
   * Charge un matériau spécifique
   */
  private async loadSingleMaterial(id: string, displayName: string): Promise<GlobalWoodMaterial> {
    const basePath = `/src/assets/textures/wood/${id}`;
    
    // Image locale (_basecolor.jpg)
    const imageUrl = `${basePath}/${id}_basecolor.jpg`;
    
    // Charger les caractéristiques depuis le fichier _caract.txt
    const rawCharacteristics = await this.loadCharacteristics(id);
    
    // Convertir en format unifié
    const characteristics = this.convertToUnifiedFormat(rawCharacteristics);
    
    // Métadonnées des fichiers disponibles
    const metadata = {
      folder: id,
      hasNormalMap: true,
      hasRoughnessMap: true,
      hasAOMap: true
    };

    // Calculer un prix basé sur les caractéristiques
    const price = this.calculatePrice(characteristics);

    return {
      id,
      name: id,
      displayName,
      image: imageUrl,
      price,
      description: characteristics.generalDescription || `Bois de ${displayName} - Excellent choix pour vos projets`,
      characteristics,
      metadata
    };
  }

  /**
   * Charge les caractéristiques depuis le fichier _caract.txt
   */
  private async loadCharacteristics(id: string): Promise<RawWoodCharacteristics> {
    const caractUrl = `/src/assets/textures/wood/${id}/${id}_caract.txt`;
    
    try {
      const response = await fetch(caractUrl);
      if (!response.ok) {
        throw new Error(`Fichier non trouvé: ${response.status}`);
      }
      
      const content = await response.text();
      return this.parseCharacteristics(content);
      
    } catch (error) {
      console.warn(`⚠️ [GlobalWoodMaterialService] Impossible de charger ${caractUrl}:`, error);
      return this.getDefaultCharacteristics(id);
    }
  }

  /**
   * Parse le contenu du fichier _caract.txt
   */
  private parseCharacteristics(rawText: string): RawWoodCharacteristics {
    const lines = rawText.split('\n');
    let currentSection = '';
    
    const characteristics: Partial<RawWoodCharacteristics> = {
      colorAspect: {
        dominantColor: '',
        variations: '',
        grain: ''
      },
      density: {
        typical: '',
        range: ''
      },
      hardness: {
        classification: ''
      },
      applications: [],
      raw: rawText
    };

    let generalDescription = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('# ')) {
        continue;
      } else if (trimmedLine.startsWith('## ')) {
        currentSection = trimmedLine.replace('## ', '').toLowerCase();
        continue;
      }
      
      switch (currentSection) {
        case 'caractéristique générale':
          if (trimmedLine && !trimmedLine.startsWith('-')) {
            generalDescription += trimmedLine + ' ';
          }
          break;
          
        case 'couleur / aspect':
          if (trimmedLine.includes('couleur dominante')) {
            characteristics.colorAspect!.dominantColor = this.extractValue(trimmedLine);
          } else if (trimmedLine.includes('variations') || trimmedLine.includes('veinage')) {
            characteristics.colorAspect!.variations = this.extractValue(trimmedLine);
          } else if (trimmedLine.includes('grain') || trimmedLine.includes('maillure')) {
            characteristics.colorAspect!.grain = this.extractValue(trimmedLine);
          }
          break;
          
        case 'densité (12% h)':
          if (trimmedLine.includes('valeur typique')) {
            characteristics.density!.typical = this.extractValue(trimmedLine);
          } else if (trimmedLine.includes('fourchette')) {
            characteristics.density!.range = this.extractValue(trimmedLine);
          }
          break;
          
        case 'dureté':
          if (trimmedLine.includes('classement') || trimmedLine.includes('**')) {
            characteristics.hardness!.classification = this.extractValue(trimmedLine);
          } else if (trimmedLine.includes('janka')) {
            characteristics.hardness!.janka = this.extractValue(trimmedLine);
          }
          break;
          
        case 'applications privilégiées':
          if (trimmedLine.startsWith('-')) {
            characteristics.applications!.push(trimmedLine.replace('- ', ''));
          }
          break;
      }
    }

    characteristics.generalDescription = generalDescription.trim();
    
    return characteristics as RawWoodCharacteristics;
  }

  /**
   * Convertit les caractéristiques brutes en format unifié
   */
  private convertToUnifiedFormat(raw: RawWoodCharacteristics): GlobalWoodMaterial['characteristics'] {
    // Extraction des valeurs numériques pour densité et dureté
    const densityValue = this.extractNumericValue(raw.density.typical || raw.density.range, 600);
    const hardnessValue = this.extractNumericValue(raw.hardness.janka || '', 500);

    return {
      generalDescription: raw.generalDescription,
      colorAspect: raw.colorAspect,
      density: {
        ...raw.density,
        value: densityValue,
        unit: 'kg/m³'
      },
      hardness: {
        ...raw.hardness,
        value: hardnessValue,
        unit: 'N'
      },
      workability: {
        cutting: 'Bon',
        drilling: 'Bon',
        finishing: 'Bon'
      },
      appearance: {
        grain: raw.colorAspect.grain || 'Moyen',
        color: raw.colorAspect.dominantColor || 'Naturel',
        texture: 'Lisse'
      },
      sustainability: {
        origin: 'Europe',
        certification: 'FSC',
        carbon_impact: 'Faible'
      },
      applications: raw.applications
    };
  }

  /**
   * Extrait une valeur numérique d'une chaîne
   */
  private extractNumericValue(text: string, defaultValue: number): number {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : defaultValue;
  }

  /**
   * Extrait la valeur après les deux-points
   */
  private extractValue(line: string): string {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return line.trim();
    
    return line.substring(colonIndex + 1)
      .replace(/【.*?】/g, '')
      .replace(/\*\*/g, '')
      .trim();
  }

  /**
   * Caractéristiques par défaut en cas d'erreur
   */
  private getDefaultCharacteristics(id: string): RawWoodCharacteristics {
    return {
      generalDescription: `Bois de qualité adapté à de nombreux projets`,
      colorAspect: {
        dominantColor: 'Naturel',
        variations: 'Modérées',
        grain: 'Moyen'
      },
      density: {
        typical: '600 kg/m³',
        range: '550-650 kg/m³'
      },
      hardness: {
        classification: 'Moyen',
        janka: '500 N'
      },
      applications: ['Menuiserie générale', 'Mobilier', 'Décoration'],
      raw: `# ${id}\n\nCaractéristiques par défaut`
    };
  }

  /**
   * Calcule un prix basé sur les caractéristiques
   */
  private calculatePrice(characteristics: GlobalWoodMaterial['characteristics']): number {
    let basePrice = 35;
    
    // Ajustement selon la dureté
    if (characteristics.hardness.classification.toLowerCase().includes('dur')) {
      basePrice += 15;
    } else if (characteristics.hardness.classification.toLowerCase().includes('tendre')) {
      basePrice -= 10;
    }
    
    // Ajustement selon la densité
    if (characteristics.density.value > 700) {
      basePrice += 10;
    } else if (characteristics.density.value < 500) {
      basePrice -= 5;
    }
    
    return Math.max(20, basePrice);
  }

  /**
   * Crée un matériau de fallback
   */
  private createFallbackMaterial(id: string, displayName: string): GlobalWoodMaterial {
    const defaultCharacteristics = this.getDefaultCharacteristics(id);
    const characteristics = this.convertToUnifiedFormat(defaultCharacteristics);
    
    return {
      id,
      name: id,
      displayName,
      image: `/src/assets/textures/wood/${id}/${id}_basecolor.jpg`,
      price: 35,
      description: `Bois de ${displayName} - Caractéristiques en cours de chargement`,
      characteristics,
      metadata: {
        folder: id,
        hasNormalMap: true,
        hasRoughnessMap: true,
        hasAOMap: true
      }
    };
  }
}

// Export d'une instance singleton
export const globalWoodMaterialService = GlobalWoodMaterialService.getInstance();

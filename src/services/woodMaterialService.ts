// Service pour charger automatiquement les matériaux depuis src/assets/textures/wood/
export interface WoodMaterial {
  id: string;
  name: string;
  displayName: string;
  baseColorImage: string;
  characteristics: WoodCharacteristics;
  metadata: {
    folder: string;
    hasNormalMap: boolean;
    hasRoughnessMap: boolean;
    hasAOMap: boolean;
  };
}

export interface WoodCharacteristics {
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
  raw: string; // Texte brut complet du fichier _caract.txt
}

class WoodMaterialService {
  private materialsCache: WoodMaterial[] | null = null;

  // Liste des matériaux disponibles (basée sur les dossiers existants)
  private readonly AVAILABLE_WOODS = [
    { id: 'chataignier', displayName: 'Châtaignier' },
    { id: 'chene', displayName: 'Chêne' },
    { id: 'frene', displayName: 'Frêne' },
    { id: 'hetre', displayName: 'Hêtre' },
    { id: 'merisier', displayName: 'Merisier' },
    { id: 'noyer', displayName: 'Noyer' },
    { id: 'sycomore', displayName: 'Sycomore' }
  ];

  /**
   * Charger tous les matériaux disponibles
   */
  async loadAllMaterials(): Promise<WoodMaterial[]> {
    if (this.materialsCache) {
      return this.materialsCache;
    }

    console.log('🌳 [WoodMaterialService] Chargement des matériaux...');
    
    const materials: WoodMaterial[] = [];

    for (const wood of this.AVAILABLE_WOODS) {
      try {
        const material = await this.loadSingleMaterial(wood.id, wood.displayName);
        materials.push(material);
        console.log(`✅ [WoodMaterialService] ${wood.displayName} chargé`);
      } catch (error) {
        console.warn(`⚠️ [WoodMaterialService] Impossible de charger ${wood.displayName}:`, error);
      }
    }

    this.materialsCache = materials;
    console.log(`🎯 [WoodMaterialService] ${materials.length} matériaux chargés au total`);
    
    return materials;
  }

  /**
   * Charger un matériau spécifique
   */
  private async loadSingleMaterial(id: string, displayName: string): Promise<WoodMaterial> {
    const basePath = `/src/assets/textures/wood/${id}`;
    
    // Charger l'image de base
    const baseColorImage = `${basePath}/${id}_basecolor.jpg`;
    
    // Charger et parser les caractéristiques
    const characteristics = await this.loadCharacteristics(id);
    
    // Vérifier les autres fichiers disponibles
    const metadata = {
      folder: id,
      hasNormalMap: true, // Assume true, ils semblent tous en avoir
      hasRoughnessMap: true,
      hasAOMap: true
    };

    return {
      id,
      name: id,
      displayName,
      baseColorImage,
      characteristics,
      metadata
    };
  }

  /**
   * Charger et parser le fichier _caract.txt
   */
  private async loadCharacteristics(id: string): Promise<WoodCharacteristics> {
    try {
      const response = await fetch(`/src/assets/textures/wood/${id}/${id}_caract.txt`);
      const rawText = await response.text();
      
      return this.parseCharacteristics(rawText);
    } catch (error) {
      console.warn(`⚠️ Impossible de charger les caractéristiques pour ${id}:`, error);
      
      // Retour par défaut
      return {
        generalDescription: `Informations non disponibles pour ${id}`,
        colorAspect: {
          dominantColor: 'Non spécifié',
          variations: 'Non spécifié',
          grain: 'Non spécifié'
        },
        density: {
          typical: 'Non spécifié',
          range: 'Non spécifié'
        },
        hardness: {
          classification: 'Non spécifié'
        },
        applications: [],
        raw: ''
      };
    }
  }

  /**
   * Parser le contenu du fichier _caract.txt
   */
  private parseCharacteristics(rawText: string): WoodCharacteristics {
    const lines = rawText.split('\n');
    let currentSection = '';
    
    const characteristics: Partial<WoodCharacteristics> = {
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
        // Titre principal (nom du bois)
        continue;
      } else if (trimmedLine.startsWith('## ')) {
        // Section
        currentSection = trimmedLine.replace('## ', '').toLowerCase();
        continue;
      }
      
      // Contenu selon la section
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
    
    return characteristics as WoodCharacteristics;
  }

  /**
   * Extraire la valeur après les deux-points
   */
  private extractValue(line: string): string {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return line.trim();
    
    return line.substring(colonIndex + 1)
      .replace(/【.*?】/g, '') // Supprimer les références
      .replace(/\*\*/g, '') // Supprimer le markdown bold
      .trim();
  }

  /**
   * Obtenir un matériau par ID
   */
  async getMaterialById(id: string): Promise<WoodMaterial | undefined> {
    const materials = await this.loadAllMaterials();
    return materials.find(m => m.id === id);
  }

  /**
   * Vider le cache (pour rechargement)
   */
  clearCache(): void {
    this.materialsCache = null;
  }
}

// Instance singleton
export const woodMaterialService = new WoodMaterialService();

/**
 * Service de préchargement des matériaux au démarrage
 * Charge une seule fois les matériaux et les met en cache global
 */

import { useGlobalMaterialStore } from '@/store/globalMaterialStore';
import { globalWoodMaterialService } from '@/services/globalWoodMaterialService';

export class MaterialPreloader {
  private static instance: MaterialPreloader;
  private isLoading = false;
  private isLoaded = false;

  static getInstance(): MaterialPreloader {
    if (!MaterialPreloader.instance) {
      MaterialPreloader.instance = new MaterialPreloader();
    }
    return MaterialPreloader.instance;
  }

  /**
   * Précharge tous les matériaux dans le cache global
   */
  async preloadMaterials(): Promise<void> {
    if (this.isLoaded || this.isLoading) {
      console.log('🌳 [MaterialPreloader] Matériaux déjà chargés ou en cours de chargement');
      return;
    }

    this.isLoading = true;
    const { setLoading, setMaterials, setError } = useGlobalMaterialStore.getState();

    try {
      setLoading(true);
      console.log('🌳 [MaterialPreloader] Début du préchargement des matériaux...');

      const materials = await globalWoodMaterialService.loadAllMaterials();
      
      // Précharger les images en arrière-plan
      await this.preloadImages(materials.map(m => m.image));
      
      setMaterials(materials);
      
      this.isLoaded = true;
      console.log(`✅ [MaterialPreloader] ${materials.length} matériaux préchargés avec succès`);
      
    } catch (error) {
      console.error('❌ [MaterialPreloader] Erreur lors du préchargement:', error);
      setError(error instanceof Error ? error.message : 'Erreur de préchargement');
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Précharge les images pour éviter les "image not found"
   */
  private async preloadImages(imageUrls: string[]): Promise<void> {
    console.log('🖼️ [MaterialPreloader] Préchargement des images...');
    
    const imagePromises = imageUrls.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          console.log(`✅ [MaterialPreloader] Image préchargée: ${url}`);
          resolve();
        };
        img.onerror = () => {
          console.warn(`⚠️ [MaterialPreloader] Erreur de chargement: ${url}`);
          resolve(); // Continuer même en cas d'erreur
        };
        img.src = url;
      });
    });

    await Promise.all(imagePromises);
    console.log('✅ [MaterialPreloader] Toutes les images préchargées');
  }

  /**
   * Vérifie si les matériaux sont chargés
   */
  isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Remet à zéro le cache
   */
  reset(): void {
    this.isLoaded = false;
    this.isLoading = false;
    useGlobalMaterialStore.getState().clearCache();
  }
}

// Export d'une instance singleton
export const materialPreloader = MaterialPreloader.getInstance();

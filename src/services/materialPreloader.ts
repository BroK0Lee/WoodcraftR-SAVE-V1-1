/**
 * Service de préchargement des matériaux au démarrage
 * Charge une seule fois les matériaux et les met en cache global
 */

import { useGlobalMaterialStore } from '@/store/globalMaterialStore';
import { initializeMaterialsWithDefault } from '@/services/globalMaterialsFromManifest';

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
      return;
    }

    this.isLoading = true;
  const { setLoading, setError } = useGlobalMaterialStore.getState();

    try {
      setLoading(true);

  // Charger depuis le manifest public et définir la matière par défaut
  await initializeMaterialsWithDefault('mdf_standard');
  // Précharger les images en arrière-plan (après injection dans le store)
  const state = useGlobalMaterialStore.getState();
  await this.preloadImages(state.materials.map(m => m.image));
      
      this.isLoaded = true;
      
    } catch (error) {
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
    const imagePromises = imageUrls.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve();
        };
        img.onerror = () => {
          resolve(); // Continuer même en cas d'erreur
        };
        img.src = url;
      });
    });

    await Promise.all(imagePromises);
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

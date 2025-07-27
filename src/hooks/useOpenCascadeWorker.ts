import { useEffect, useRef, useState } from 'react';
import * as Comlink from 'comlink';
import type { OccWorkerAPI } from '@/workers/worker.types';
import { useLoadingStore } from '@/store/loadingStore';

// Cache global pour le worker OpenCascade
interface OccWorkerCache {
  worker: Worker | null;
  proxy: Comlink.Remote<OccWorkerAPI> | null;
  isReady: boolean;
}

let globalWorkerCache: OccWorkerCache = {
  worker: null,
  proxy: null,
  isReady: false
};

export function useOpenCascadeWorker() {
  const [isReady, setIsReady] = useState(globalWorkerCache.isReady);
  const [error, setError] = useState<string | null>(null);
  const { setWorkerReady } = useLoadingStore();
  const initializationInProgress = useRef(false);

  useEffect(() => {
    const initializeWorker = async () => {
      try {
        // Si déjà initialisé, marquer comme prêt
        if (globalWorkerCache.isReady && globalWorkerCache.proxy) {
          console.log('🔧 [useOpenCascadeWorker] Worker déjà initialisé, utilisation du cache');
          setIsReady(true);
          setWorkerReady(true);
          return;
        }

        // Éviter les initialisations multiples simultanées
        if (initializationInProgress.current) {
          console.log('🔧 [useOpenCascadeWorker] Initialisation déjà en cours...');
          return;
        }

        initializationInProgress.current = true;
        console.log('🔧 [useOpenCascadeWorker] Initialisation du worker OpenCascade...');

        // Créer le worker une seule fois
        const worker = new Worker(
          new URL("../workers/occ.worker.ts", import.meta.url),
          { type: "module" }
        );

        const proxy = Comlink.wrap<OccWorkerAPI>(worker);

        // Initialiser OpenCascade dans le worker
        const ready = await proxy.init();
        console.log('🔧 [useOpenCascadeWorker] Worker OpenCascade initialisé:', ready);

        if (ready) {
          // Sauvegarder dans le cache global
          globalWorkerCache = {
            worker,
            proxy,
            isReady: true
          };

          console.log('✅ [useOpenCascadeWorker] Worker mis en cache avec succès');
          setIsReady(true);
          setWorkerReady(true);
        } else {
          throw new Error('Échec de l\'initialisation du worker OpenCascade');
        }

      } catch (err) {
        console.error('❌ [useOpenCascadeWorker] Erreur lors de l\'initialisation:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        // En cas d'erreur, marquer comme prêt pour ne pas bloquer l'app
        setWorkerReady(true);
      } finally {
        initializationInProgress.current = false;
      }
    };

    initializeWorker();

    // Cleanup function - NE PAS terminer le worker ici car il est global
    return () => {
      console.log('🔧 [useOpenCascadeWorker] Cleanup - worker conservé en cache');
    };
  }, [setWorkerReady]);

  // Fonction pour obtenir le proxy du worker (pour les composants qui en ont besoin)
  const getWorkerProxy = (): Comlink.Remote<OccWorkerAPI> | null => {
    return globalWorkerCache.proxy;
  };

  // Fonction pour terminer le worker (à appeler uniquement lors de la fermeture de l'app)
  const terminateWorker = () => {
    if (globalWorkerCache.worker) {
      console.log('🔧 [useOpenCascadeWorker] Terminaison du worker OpenCascade');
      globalWorkerCache.worker.terminate();
      globalWorkerCache = {
        worker: null,
        proxy: null,
        isReady: false
      };
      setIsReady(false);
    }
  };

  return {
    isReady,
    error,
    getWorkerProxy,
    terminateWorker
  };
}

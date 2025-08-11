import { useCallback, useEffect, useRef, useState } from "react";
import { useLoadingStore } from "@/store/loadingStore";
import {
  initOccWorker,
  getOccProxy,
  isOccReady,
  terminateOccWorker,
} from "@/services/openCascadeWorkerService";

export function useOpenCascadeWorker() {
  const [isReady, setIsReady] = useState(isOccReady());
  const [error, setError] = useState<string | null>(null);
  const { setWorkerReady } = useLoadingStore();
  const initializationInProgress = useRef(false);

  useEffect(() => {
    const initializeWorker = async () => {
      try {
        // Si déjà initialisé, marquer comme prêt
        if (isOccReady() && getOccProxy()) {
          setIsReady(true);
          setWorkerReady(true);
          return;
        }

        // Éviter les initialisations multiples simultanées
        if (initializationInProgress.current) {
          return;
        }

        initializationInProgress.current = true;

        // Initialiser via le service singleton
        const ok = await initOccWorker();
        if (ok) {
          setIsReady(true);
          setWorkerReady(true);
        } else {
          throw new Error("Échec de l'initialisation du worker OpenCascade");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        // Ne pas marquer comme prêt en cas d'erreur: laisser l'écran de chargement informer l'utilisateur
      } finally {
        initializationInProgress.current = false;
      }
    };

    initializeWorker();

    // Cleanup: ne pas terminer le worker ici (global). Laisser au service.
    return () => {
      // noop
    };
  }, [setWorkerReady]);

  // Fonction pour obtenir le proxy du worker (pour les composants qui en ont besoin)
  const getWorkerProxy = useCallback(() => getOccProxy(), []);

  // Fonction pour terminer le worker (à appeler uniquement lors de la fermeture de l'app)
  const terminateWorker = useCallback(() => {
    terminateOccWorker();
    setIsReady(false);
  }, []);

  return {
    isReady,
    error,
    getWorkerProxy,
    terminateWorker,
  };
}

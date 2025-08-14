import { useCallback, useEffect, useRef, useState } from "react";
import { useLoadingStore } from "@/store/loadingStore";
import {
  initOccWorker,
  getOccProxy,
  isOccReady,
  terminateOccWorker,
} from "@/services/openCascadeWorkerService";

// Hook minimal: initialise le worker OpenCascade et expose son proxy.
// Toute logique de progression fine a été supprimée (UI gérée par timings adaptatifs côté écran de chargement).
export function useOpenCascadeWorker() {
  const [isReady, setIsReady] = useState(isOccReady());
  const [error, setError] = useState<string | null>(null);
  const { setWorkerStatus } = useLoadingStore();
  const initRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (initRef.current) return; // idempotent
      initRef.current = true;
      try {
        if (isOccReady() && getOccProxy()) {
          if (!cancelled) {
            setIsReady(true);
            setWorkerStatus("worker-ready");
          }
          return;
        }
        const ok = await initOccWorker();
        if (!ok)
          throw new Error("Échec de l'initialisation du worker OpenCascade");
        if (!cancelled) {
          setIsReady(true);
          setWorkerStatus("worker-ready");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setWorkerStatus("worker-error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setWorkerStatus]);

  const getWorkerProxy = useCallback(() => getOccProxy(), []);
  const terminateWorker = useCallback(() => {
    terminateOccWorker();
    setIsReady(false);
  }, []);

  return { isReady, error, getWorkerProxy, terminateWorker };
}

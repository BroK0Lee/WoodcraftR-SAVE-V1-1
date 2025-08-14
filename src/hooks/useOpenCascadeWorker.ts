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
  const { setWorkerStatus, workerStatus } = useLoadingStore();
  const initRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (initRef.current) return; // idempotent
      initRef.current = true;
      try {
        // log init début
        if (typeof window !== "undefined")
          console.debug("[LOAD] WORKER_INIT_START");
        if (isOccReady() && getOccProxy()) {
          if (!cancelled) {
            setIsReady(true);
            if (workerStatus !== "worker-ready") {
              // Sécurité si service n'a pas promu
              setWorkerStatus("worker-ready");
              if (typeof window !== "undefined")
                console.debug("[LOAD] WORKER_READY (cached promote)");
            } else if (typeof window !== "undefined") {
              console.debug("[LOAD] WORKER_READY (cached)");
            }
          }
          return;
        }
        const ok = await initOccWorker();
        if (!ok)
          throw new Error("Échec de l'initialisation du worker OpenCascade");
        if (!cancelled) {
          setIsReady(true);
          // Normalement déjà promu par service, fallback si besoin
          if (workerStatus !== "worker-ready") {
            setWorkerStatus("worker-ready");
            if (typeof window !== "undefined")
              console.debug("[LOAD] WORKER_READY (hook fallback promote)");
          } else if (typeof window !== "undefined") {
            console.debug("[LOAD] WORKER_READY (service)");
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setWorkerStatus("worker-error");
          if (typeof window !== "undefined")
            console.debug("[LOAD] WORKER_ERROR", e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setWorkerStatus, workerStatus]);

  const getWorkerProxy = useCallback(() => getOccProxy(), []);
  const terminateWorker = useCallback(() => {
    terminateOccWorker();
    setIsReady(false);
  }, []);

  return { isReady, error, getWorkerProxy, terminateWorker };
}

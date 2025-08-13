import { useCallback, useEffect, useRef, useState } from "react";
import { useLoadingStore } from "@/store/loadingStore";
import {
  initOccWorker,
  getOccProxy,
  isOccReady,
  terminateOccWorker,
} from "@/services/openCascadeWorkerService";
import { onOccProgress } from "@/services/openCascadeWorkerService";

export function useOpenCascadeWorker() {
  const [isReady, setIsReady] = useState(isOccReady());
  const [error, setError] = useState<string | null>(null);
  const { setWorkerReady, setWorkerProgressEvent } = useLoadingStore();
  const initializationInProgress = useRef(false);
  // Refs pour smoothing (doivent être au niveau du hook, pas dans useEffect)
  const hasDownloadEvent = useRef(false);
  const smoothing = useRef<{
    active: boolean;
    start: number;
    duration: number;
    targetPct: number;
    raf?: number;
  }>({ active: false, start: 0, duration: 3000, targetPct: 40 });

  useEffect(() => {
    // Snapshot refs pour cleanup (lint satisfaction)
    const smoothingRef = smoothing;
    function stopSmoothing(finish = false) {
      if (smoothing.current.raf) cancelAnimationFrame(smoothing.current.raf);
      if (finish) {
        setWorkerProgressEvent({
          phase: "download",
          pct: smoothing.current.targetPct,
        });
      }
      smoothing.current.active = false;
      smoothing.current.raf = undefined;
    }

    function runSmoothing() {
      if (!smoothing.current.active) return;
      const now = performance.now();
      const t = Math.min(
        1,
        (now - smoothing.current.start) / smoothing.current.duration
      );
      // easing léger (easeOutQuad)
      const eased = 1 - (1 - t) * (1 - t);
      const pct = smoothing.current.targetPct * eased;
      setWorkerProgressEvent({ phase: "download", pct });
      if (t < 1) {
        smoothing.current.raf = requestAnimationFrame(runSmoothing);
      } else {
        stopSmoothing(true);
      }
    }

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

    const unsubscribe = onOccProgress((evt) => {
      // Map direct des nouvelles phases vers le store
      switch (evt.phase) {
        case "start":
          setWorkerProgressEvent({ phase: evt.phase, pct: evt.pct });
          break;
        case "download":
          if (evt.phase === "download") {
            // Cas smoothing: premier event = 100% brut (donc pct segmenté = 40) sans aucun download intermédiaire
            if (!hasDownloadEvent.current) {
              hasDownloadEvent.current = true;
              const rawIsInstant = evt.rawPct === 100 && (evt.pct ?? 0) >= 40;
              if (rawIsInstant) {
                // Initialise smoothing
                smoothing.current.active = true;
                smoothing.current.start = performance.now();
                smoothing.current.targetPct = evt.pct ?? 40;
                setWorkerProgressEvent({
                  phase: "download",
                  pct: 0,
                  rawPct: evt.rawPct,
                });
                smoothing.current.raf = requestAnimationFrame(runSmoothing);
                return; // ne pas pousser l'evt direct (sinon saut à 40%)
              }
            }
            if (!smoothing.current.active) {
              setWorkerProgressEvent({
                phase: evt.phase,
                pct: evt.pct,
                rawPct: evt.rawPct,
              });
            }
            return; // éviter double passage setWorkerProgressEvent plus bas
          }
          break;
        case "compile-start":
        case "compile":
        case "compile-done":
        case "init":
        case "ready":
        case "error":
          if (
            smoothing.current.active &&
            [
              "compile-start",
              "compile",
              "compile-done",
              "init",
              "ready",
            ].includes(evt.phase)
          ) {
            // Fin anticipée du smoothing si la phase avance déjà
            stopSmoothing(true);
          }
          setWorkerProgressEvent({
            phase: evt.phase,
            pct: evt.pct,
            rawPct: evt.rawPct,
            errorMessage: evt.errorMessage,
          });
          if (evt.phase === "ready") {
            setWorkerReady(true);
          }
          if (evt.phase === "error") {
            setWorkerReady(false);
          }
          break;
      }
    });

    initializeWorker();

    // Cleanup: ne pas terminer le worker ici (global). Laisser au service.
    return () => {
      const sm = smoothingRef.current;
      if (sm.raf) cancelAnimationFrame(sm.raf);
      sm.active = false;
      unsubscribe();
      // hasDownloadRef pas besoin de reset (idempotent sur nouvelle mount)
    };
  }, [setWorkerReady, setWorkerProgressEvent, isReady]);

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

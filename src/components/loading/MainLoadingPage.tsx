import { useCallback, useEffect, useRef, useState } from "react";
import { useLoadingStore } from "@/store/loadingStore";
import { BrandingHeader } from "./components/BrandingHeader";
import { GlobalProgressBar } from "./components/GlobalProgressBar";
import { useGsapIntro } from "./hooks/useGsapIntro";
import { useOpenCascadeWorker } from "@/hooks/useOpenCascadeWorker";
import { useWoodMaterialSelectorInit } from "@/hooks/useWoodMaterialSelectorInit";

interface MainLoadingPageProps {
  onLoadingComplete: () => void;
}

// Durées / caps adaptatives (ms / ratios)
const MIN_TOTAL_MS = 6000; // durée minimale crédible (fast path)
const TARGET_TOTAL_MS = 18000; // durée cible confortable
const MAX_TOTAL_MS = 30000; // durée maximale avant d'entrer en mode attente lente

// Caps (en fraction de 1 pour lisibilité interne)
const FAST_PATH_MIN = 0.6; // seuil minimum avant accélération finale si readiness précoce
const SOFT_CAP = 0.9; // palier d'accélération avant zone d'attente
const HARD_WAIT_CAP = 0.98; // plafond pendant attente readiness (pas de 99% figé)

// Ticks
const BASE_TICK_MS = 100; // tick principal progression adaptative
const PULSE_INTERVAL_MS = 200; // micro pulses en zone d'attente

// Finalisation animation durations (ms)
const FINISH_MIN_MS = 500;
const FINISH_MAX_MS = 1200;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v;
}

// DEBUG FLAG (mettre à false pour couper la verbosité)
const DEBUG_LOADING = true;

export function MainLoadingPage({ onLoadingComplete }: MainLoadingPageProps) {
  const dlog = useCallback((...args: unknown[]) => {
    if (DEBUG_LOADING) console.debug("[LOAD]", ...args);
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const barInnerRef = useRef<HTMLDivElement | null>(null);

  // Hook worker & selector (déclenche les initialisations)
  useOpenCascadeWorker();
  useWoodMaterialSelectorInit();

  const {
    setAppStatus,
    setWorkerStatus,
    setSelectorStatus,
    workerStatus,
    selectorStatus,
    setAppLoading,
    initializeApp,
  } = useLoadingStore();

  const [progress, setProgress] = useState(0); // 0..100 (affiché)
  const [startedAt] = useState(() => performance.now());
  const waitingRef = useRef(false); // en zone d'attente (softCap -> hardWaitCap)
  const doneRef = useRef(false); // finalisation terminée
  const baseIntervalRef = useRef<number | null>(null); // interval principal
  const pulseRafRef = useRef<number | null>(null); // micro pulses
  const finishingRef = useRef(false); // animation finale en cours

  // Déterminer objectif adaptatif selon readiness réelle
  const computeTarget = useCallback(() => {
    const now = performance.now();
    const elapsed = now - startedAt;
    // Si tout déjà prêt rapidement => fast path
    if (
      workerStatus === "worker-ready" &&
      selectorStatus === "selector-ready" &&
      elapsed < MIN_TOTAL_MS
    ) {
      return MIN_TOTAL_MS;
    }
    // Sinon viser target, mais si dépassement => max
    if (elapsed > TARGET_TOTAL_MS)
      return Math.min(elapsed + 2000, MAX_TOTAL_MS);
    return TARGET_TOTAL_MS;
  }, [startedAt, workerStatus, selectorStatus]);

  // Phase textuelle
  const phaseLabel = (() => {
    if (workerStatus === "worker-error" || selectorStatus === "selector-error")
      return "Erreur de chargement";
    if (workerStatus !== "worker-ready") return "Initialisation du moteur 3D";
    if (selectorStatus !== "selector-ready")
      return "Préparation du sélecteur matériaux";
    if (!doneRef.current) return "Finalisation de l'application";
    return "Prêt";
  })();

  // Démarrage statuts (one-shot même sous StrictMode)
  const initStartedRef = useRef(false);
  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;
    setAppStatus("app-start");
    setWorkerStatus("worker-start");
    setSelectorStatus("selector-start");
    initializeApp();
    dlog("INIT_APP_START");
  }, [setAppStatus, setWorkerStatus, setSelectorStatus, initializeApp, dlog]);

  // Intro (logo + barre)
  useGsapIntro({ logoRef, progressBarRef });

  // Log transitions statuts
  useEffect(() => {
    dlog("STATUS_CHANGE", { workerStatus, selectorStatus });
  }, [workerStatus, selectorStatus, dlog]);

  // Progression adaptative de base (0 -> SOFT_CAP * 100) en fonction du temps cible
  useEffect(() => {
    if (baseIntervalRef.current) return;
    baseIntervalRef.current = window.setInterval(() => {
      if (doneRef.current || finishingRef.current) return;
      const elapsed = performance.now() - startedAt;
      const targetTotal = computeTarget();
      // ratio idéal 0..1
      let ratio = elapsed / targetTotal;
      if (ratio > 1) ratio = 1;
      // Conversion vers progression limitée au SOFT_CAP avant readiness
      const softCapPct = SOFT_CAP * 100;
      const baseIdeal = ratio * softCapPct; // progression normale jusqu'à soft cap

      setProgress((prev) => {
        if (prev >= softCapPct) return prev; // laisser autres systèmes gérer
        return baseIdeal > prev ? Math.min(baseIdeal, softCapPct) : prev;
      });
    }, BASE_TICK_MS);
    return () => {
      if (baseIntervalRef.current)
        window.clearInterval(baseIntervalRef.current);
      baseIntervalRef.current = null;
    };
  }, [computeTarget, startedAt]);

  // Logs de jalons progression
  const lastMarkerRef = useRef<number | null>(null);
  useEffect(() => {
    const markers = [0, 60, 90, 95, 98, 100];
    for (const m of markers) {
      if (progress >= m && lastMarkerRef.current !== m) {
        lastMarkerRef.current = m;
        dlog("PROGRESS_MARK", m);
      }
    }
  }, [progress, dlog]);

  // Micro pulses dans la zone d'attente (SOFT_CAP -> HARD_WAIT_CAP) tant que readiness pas atteinte
  useEffect(() => {
    const readyAll =
      workerStatus === "worker-ready" && selectorStatus === "selector-ready";
    if (doneRef.current || finishingRef.current) return;

    if (readyAll) {
      waitingRef.current = false;
      if (pulseRafRef.current) {
        cancelAnimationFrame(pulseRafRef.current);
        pulseRafRef.current = null;
      }
      return;
    }

    // Activer waiting si progress a atteint le soft cap
    if (progress >= SOFT_CAP * 100 && progress < HARD_WAIT_CAP * 100) {
      waitingRef.current = true;
      let lastPulse = performance.now();
      const tick = () => {
        if (!waitingRef.current || doneRef.current || finishingRef.current)
          return;
        const now = performance.now();
        if (now - lastPulse >= PULSE_INTERVAL_MS) {
          lastPulse = now;
          setProgress((p) => {
            if (p < HARD_WAIT_CAP * 100) {
              const inc = 0.1; // 0.1% micro avancée
              return Math.min(p + inc, HARD_WAIT_CAP * 100);
            }
            return p;
          });
        }
        pulseRafRef.current = requestAnimationFrame(tick);
      };
      pulseRafRef.current = requestAnimationFrame(tick);
      return () => {
        waitingRef.current = false;
        if (pulseRafRef.current) cancelAnimationFrame(pulseRafRef.current);
        pulseRafRef.current = null;
      };
    }
  }, [progress, workerStatus, selectorStatus]);

  // Fonction de démarrage finalisation indépendante
  const startFinalization = useCallback(() => {
    if (doneRef.current || finishingRef.current) return;
    const readyAll =
      workerStatus === "worker-ready" && selectorStatus === "selector-ready";
    if (!readyAll) return;
    waitingRef.current = false; // couper message attente
    const minPct = FAST_PATH_MIN * 100;
    setProgress((p) => (p < minPct ? minPct : p));
    const start = Math.max(progress, minPct);
    const distance = 100 - start;
    const tNorm = clamp((distance / 100 - (1 - SOFT_CAP)) / SOFT_CAP, 0, 1);
    const duration = lerp(FINISH_MIN_MS, FINISH_MAX_MS, tNorm);
    finishingRef.current = true;
    dlog("FINALIZE_TRIGGER", {
      start,
      duration,
      workerStatus,
      selectorStatus,
    });
    const startTime = performance.now();
    const animate = () => {
      if (doneRef.current) return;
      const now = performance.now();
      const t = clamp((now - startTime) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = lerp(start, 100, eased);
      setProgress(value);
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        doneRef.current = true;
        setProgress(100);
        dlog("FINALIZE_DONE");
        setAppStatus("app-ready");
        setTimeout(() => {
          setAppLoading(false);
          onLoadingComplete();
        }, 120);
      }
    };
    requestAnimationFrame(animate);
  }, [
    progress,
    workerStatus,
    selectorStatus,
    setAppStatus,
    setAppLoading,
    onLoadingComplete,
    dlog,
  ]);

  // Effet déclencheur sur statuts uniquement
  useEffect(() => {
    startFinalization();
  }, [workerStatus, selectorStatus, startFinalization]);

  // Watchdog & fallback
  useEffect(() => {
    let readyAt: number | null = null;
    let finishingAt: number | null = null;
    const interval = window.setInterval(() => {
      const readyAll =
        workerStatus === "worker-ready" && selectorStatus === "selector-ready";
      if (readyAll && !doneRef.current && !finishingRef.current) {
        if (readyAt == null) readyAt = performance.now();
        if (performance.now() - readyAt > 2000) {
          dlog("WATCHDOG_FORCE_START");
          startFinalization();
        }
      }
      if (finishingRef.current && !doneRef.current) {
        if (finishingAt == null) finishingAt = performance.now();
        if (performance.now() - finishingAt > 5000) {
          dlog("WATCHDOG_FORCE_COMPLETE", { progress });
          doneRef.current = true;
          setProgress(100);
          setAppStatus("app-ready");
          setAppLoading(false);
          onLoadingComplete();
        }
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [
    workerStatus,
    selectorStatus,
    progress,
    startFinalization,
    setAppLoading,
    setAppStatus,
    onLoadingComplete,
    dlog,
  ]);

  // Ajuster largeur barre
  useEffect(() => {
    if (!progressBarRef.current) return;
    const inner =
      progressBarRef.current.querySelector<HTMLDivElement>(".h-full");
    barInnerRef.current = inner;
    if (inner) inner.style.width = `${Math.round(progress)}%`;
  }, [progress]);

  // (Legacy fast-path observer supprimé : remplacé par la logique finalisation ci-dessus)

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center z-50"
    >
      <div className="max-w-md w-full mx-4 text-center">
        {/* Logo animé */}
        <BrandingHeader ref={logoRef} />

        <GlobalProgressBar ref={progressBarRef} />
        <p className="text-xs text-gray-600 mt-4">{phaseLabel}</p>
        {waitingRef.current && !doneRef.current && (
          <p className="text-[11px] text-amber-600 mt-2">
            Finalisation... (peut prendre quelques secondes la première fois)
          </p>
        )}
        {(workerStatus === "worker-error" ||
          selectorStatus === "selector-error") && (
          <p className="text-xs text-red-600 mt-4">
            Erreur de chargement – veuillez recharger la page.
          </p>
        )}
      </div>
    </div>
  );
}

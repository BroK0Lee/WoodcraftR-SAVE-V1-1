import { useCallback, useEffect, useRef, useState } from "react";
import { useLoadingStore } from "@/store/loadingStore";
import { BrandingHeader } from "./components/BrandingHeader";
import { GlobalProgressBar } from "./components/GlobalProgressBar";
import { useGsapIntro } from "./hooks/useGsapIntro";
import { useOpenCascadeWorker } from "@/hooks/useOpenCascadeWorker";
import {
  computeInitialPanelIfNeeded,
  registerWorkerProxy,
} from "@/services/panelGeometryService";
import { useWoodMaterialSelectorInit } from "@/hooks/useWoodMaterialSelectorInit";

interface MainLoadingPageProps {
  onLoadingComplete: () => void;
  /** Contrôle visibilité overlay (opacity + pointer-events). Par défaut true */
  visible?: boolean;
}

// Timings & caps
const MIN_TOTAL_MS = 6000;
const TARGET_TOTAL_MS = 18000;
const MAX_TOTAL_MS = 30000;
const FAST_PATH_MIN = 0.6;
const SOFT_CAP = 0.9;
const HARD_WAIT_CAP = 0.98;
const BASE_TICK_MS = 100;
const PULSE_INTERVAL_MS = 200;
const FINISH_MIN_MS = 500;
const FINISH_MAX_MS = 1200;
const DEBUG_LOADING = true;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, min: number, max: number) =>
  v < min ? min : v > max ? max : v;

export function MainLoadingPage({
  onLoadingComplete,
  visible = true,
}: MainLoadingPageProps) {
  const dlog = useCallback((...args: unknown[]) => {
    if (DEBUG_LOADING) console.debug("[LOAD]", ...args);
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const barInnerRef = useRef<HTMLDivElement | null>(null);
  const { getWorkerProxy, isReady: workerReady } = useOpenCascadeWorker();
  useEffect(() => {
    if (workerReady) {
      const proxy = getWorkerProxy();
      if (proxy) {
        registerWorkerProxy(proxy);
        void computeInitialPanelIfNeeded();
      }
    }
  }, [workerReady, getWorkerProxy]);
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
  const [progress, setProgress] = useState(0);
  const [startedAt] = useState(() => performance.now());
  const waitingRef = useRef(false);
  const doneRef = useRef(false);
  const baseIntervalRef = useRef<number | null>(null);
  const pulseRafRef = useRef<number | null>(null);
  const finishingRef = useRef(false);
  const computeTarget = useCallback(() => {
    const now = performance.now();
    const elapsed = now - startedAt;
    if (
      workerStatus === "worker-ready" &&
      selectorStatus === "selector-ready" &&
      elapsed < MIN_TOTAL_MS
    )
      return MIN_TOTAL_MS;
    if (elapsed > TARGET_TOTAL_MS)
      return Math.min(elapsed + 2000, MAX_TOTAL_MS);
    return TARGET_TOTAL_MS;
  }, [startedAt, workerStatus, selectorStatus]);
  const phaseLabel = (() => {
    if (workerStatus === "worker-error" || selectorStatus === "selector-error")
      return "Erreur de chargement";
    if (workerStatus !== "worker-ready") return "Initialisation du moteur 3D";
    if (selectorStatus !== "selector-ready")
      return "Préparation du sélecteur matériaux";
    if (!doneRef.current) return "Finalisation de l'application";
    return "Prêt";
  })();
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
  useGsapIntro({ logoRef, progressBarRef });
  useEffect(() => {
    dlog("STATUS_CHANGE", { workerStatus, selectorStatus });
  }, [workerStatus, selectorStatus, workerReady, dlog]);
  useEffect(() => {
    if (baseIntervalRef.current) return;
    baseIntervalRef.current = window.setInterval(() => {
      if (doneRef.current || finishingRef.current) return;
      const elapsed = performance.now() - startedAt;
      const targetTotal = computeTarget();
      let ratio = elapsed / targetTotal;
      if (ratio > 1) ratio = 1;
      const softCapPct = SOFT_CAP * 100;
      const baseIdeal = ratio * softCapPct;
      setProgress((prev) => {
        if (DEBUG_LOADING && Math.abs(prev - baseIdeal) > 5)
          dlog("BASE_TICK", {
            elapsed: Math.round(elapsed),
            targetTotal: Math.round(targetTotal),
            prev,
            baseIdeal: Math.round(baseIdeal),
          });
        if (prev >= softCapPct) return prev;
        return baseIdeal > prev ? Math.min(baseIdeal, softCapPct) : prev;
      });
    }, BASE_TICK_MS);
    return () => {
      if (baseIntervalRef.current)
        window.clearInterval(baseIntervalRef.current);
      baseIntervalRef.current = null;
    };
  }, [computeTarget, startedAt, dlog]);
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
            if (p < HARD_WAIT_CAP * 100)
              return Math.min(p + 0.1, HARD_WAIT_CAP * 100);
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
  const startFinalization = useCallback(() => {
    if (doneRef.current || finishingRef.current) return;
    const readyAll =
      workerStatus === "worker-ready" && selectorStatus === "selector-ready";
    if (!readyAll) return;
    waitingRef.current = false;
    const minPct = FAST_PATH_MIN * 100;
    setProgress((p) => (p < minPct ? minPct : p));
    const start = Math.max(progress, minPct);
    const distance = 100 - start;
    const tNorm = clamp((distance / 100 - (1 - SOFT_CAP)) / SOFT_CAP, 0, 1);
    const duration = lerp(FINISH_MIN_MS, FINISH_MAX_MS, tNorm);
    finishingRef.current = true;
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
  ]);
  useEffect(() => {
    startFinalization();
  }, [workerStatus, selectorStatus, startFinalization]);
  useEffect(() => {
    const readyAll =
      workerStatus === "worker-ready" && selectorStatus === "selector-ready";
    if (!readyAll || !workerReady) return;
    let canceled = false;
    (async () => {
      const t0 = performance.now();
      const did = await computeInitialPanelIfNeeded();
      if (!canceled && did)
        dlog("INITIAL_PANEL_PRECOMPUTED", {
          ms: Math.round(performance.now() - t0),
        });
    })();
    return () => {
      canceled = true;
    };
  }, [workerStatus, selectorStatus, workerReady, dlog]);
  useEffect(() => {
    let readyAt: number | null = null;
    let finishingAt: number | null = null;
    const interval = window.setInterval(() => {
      const readyAll =
        workerStatus === "worker-ready" && selectorStatus === "selector-ready";
      if (readyAll && !doneRef.current && !finishingRef.current) {
        if (readyAt == null) readyAt = performance.now();
        if (performance.now() - readyAt > 2000) startFinalization();
      }
      if (finishingRef.current && !doneRef.current) {
        if (finishingAt == null) finishingAt = performance.now();
        if (performance.now() - finishingAt > 5000) {
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
  ]);
  useEffect(() => {
    if (!progressBarRef.current) return;
    const inner =
      progressBarRef.current.querySelector<HTMLDivElement>(".h-full");
    barInnerRef.current = inner;
    if (inner) inner.style.width = `${Math.round(progress)}%`;
  }, [progress]);
  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
        visible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="max-w-md w-full mx-4 text-center">
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

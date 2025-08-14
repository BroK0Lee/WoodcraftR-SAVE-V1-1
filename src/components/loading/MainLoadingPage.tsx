import { useCallback, useEffect, useRef, useState } from "react";
import { useLoadingStore } from "@/store/loadingStore";
import { BrandingHeader } from "./components/BrandingHeader";
import { GlobalProgressBar } from "./components/GlobalProgressBar";
import { useGsapIntro } from "./hooks/useGsapIntro";
import { useOpenCascadeWorker } from "@/hooks/useOpenCascadeWorker";
import { useWoodMaterialSelectorInit } from "@/hooks/useWoodMaterialSelectorInit";

interface MainLoadingPageProps { onLoadingComplete: () => void }

// Durées adaptatives (ms)
const MIN_TOTAL_MS = 6000; // fast path minimal
const TARGET_TOTAL_MS = 18000; // progression confortable
const MAX_TOTAL_MS = 30000; // hard cap avant plateau 99%
const TICK_MS = 100;

export function MainLoadingPage({ onLoadingComplete }: MainLoadingPageProps) {
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
  } = useLoadingStore();

  const [progress, setProgress] = useState(0); // 0..100
  const [startedAt] = useState(() => performance.now());
  const plateauRef = useRef(false);
  const doneRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

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
    if (elapsed > TARGET_TOTAL_MS) return Math.min(elapsed + 2000, MAX_TOTAL_MS);
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

  // Démarrage statuts
  useEffect(() => {
    setAppStatus("app-start");
    setWorkerStatus("worker-start");
    setSelectorStatus("selector-start");
  }, [setAppStatus, setWorkerStatus, setSelectorStatus]);

  // Intro (logo + barre)
  useGsapIntro({
    logoRef,
    progressBarRef,
    // Fournit un ref vide typé pour compat compat.
    stepsRef: { current: null } as unknown as React.RefObject<HTMLDivElement>,
  });

  // Loop de progression adaptative
  useEffect(() => {
    if (intervalRef.current) return; // déjà lancé
    intervalRef.current = window.setInterval(() => {
      if (doneRef.current) return;
      const targetTotal = computeTarget();
      const elapsed = performance.now() - startedAt;
      let ideal = (elapsed / targetTotal) * 100;
      if (ideal >= 100) ideal = 99; // gate max avant readiness
      // Plateau si dépassé max total ms
      if (elapsed >= MAX_TOTAL_MS) {
        plateauRef.current = true;
        ideal = 99;
      }
      // Si readiness complète et on est >90%, on peut finaliser
      const readyAll =
        workerStatus === "worker-ready" && selectorStatus === "selector-ready";
      if (readyAll && ideal >= 95) {
        doneRef.current = true;
        setProgress(100);
        setAppStatus("app-ready");
        // courte attente pour fluidité
        setTimeout(() => {
          setAppLoading(false);
          onLoadingComplete();
        }, 150);
        return;
      }
      setProgress((p) => (ideal > p ? Math.min(ideal, 99) : p));
    }, TICK_MS);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [computeTarget, startedAt, workerStatus, selectorStatus, setAppStatus, setAppLoading, onLoadingComplete]);

  // Ajuster largeur barre
  useEffect(() => {
    if (!progressBarRef.current) return;
    const inner = progressBarRef.current.querySelector<HTMLDivElement>(
      '.h-full'
    );
    barInnerRef.current = inner;
    if (inner) inner.style.width = `${Math.round(progress)}%`;
  }, [progress]);

  // Observer readiness pour finalisation rapide si tout prêt très tôt
  useEffect(() => {
    if (doneRef.current) return;
    if (
      workerStatus === "worker-ready" &&
      selectorStatus === "selector-ready" &&
      progress >= 40 &&
      performance.now() - startedAt < MIN_TOTAL_MS
    ) {
      // Fast path: accélérer progression vers 100
      const fast = () => {
        setProgress((p) => {
          if (p >= 100) return 100;
          const np = p + 5;
          return np >= 100 ? 100 : np;
        });
        if (progress < 100) requestAnimationFrame(fast);
      };
      fast();
    }
  }, [workerStatus, selectorStatus, progress, startedAt]);

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
        {plateauRef.current && !doneRef.current && (
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

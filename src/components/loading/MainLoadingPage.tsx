import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useLoadingStore } from "@/store/loadingStore";
import { BrandingHeader } from "./components/BrandingHeader";
import { GlobalProgressBar } from "./components/GlobalProgressBar";
import { StepList } from "./components/StepList";
import type { LoadingStep } from "./types";
import { useProgressTimer } from "./hooks/useProgressTimer";
import { PROGRESS_CONFIG } from "./config";
import { waitForFlag, guards } from "./utils/storeGuards";
import { ensureMaterialsPreloaded } from "./utils/preloader";

interface MainLoadingPageProps {
  onLoadingComplete: () => void;
}

export function MainLoadingPage({ onLoadingComplete }: MainLoadingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<LoadingStep[]>([
    {
      id: "worker",
      label: "Initialisation OpenCascade Worker...",
      status: "pending",
    },
    { id: "materials", label: "Chargement des matières...", status: "pending" },
  ]);

  // Timers de progression visuelle par étape
  const {
    value: workerProgress,
    start: startWorkerTimer,
    finish: finishWorkerTimer,
    reset: resetWorkerTimer,
    stop: stopWorkerTimer,
  } = useProgressTimer(PROGRESS_CONFIG.worker);
  const materialsLoadTimer = useProgressTimer(PROGRESS_CONFIG.materialsLoad);
  const materialsWaitTimer = useProgressTimer(PROGRESS_CONFIG.materialsWaiting);
  const materialsProgress = Math.max(
    materialsLoadTimer.value,
    materialsWaitTimer.value
  );

  // Store state pour suivre l'avancement du chargement
  const { initializeApp } = useLoadingStore();

  const startLoadingProcess = useCallback(async () => {
    // Lancer l'initialisation de l'app (matières, composants)
    initializeApp();

    // Étape 1: Attendre OpenCascade Worker
    setCurrentStep(0);
    resetWorkerTimer();
    setSteps((prev) =>
      prev.map((step, i) => ({
        ...step,
        status: i === 0 ? "loading" : "pending",
      }))
    );
    // Animation de progression simulée jusqu'à 90%
    startWorkerTimer();
    await waitForFlag(guards.workerReady, 100);
    finishWorkerTimer();
    setSteps((prev) =>
      prev.map((step, i) => ({
        ...step,
        status: i === 0 ? "completed" : "pending",
      }))
    );

    // Étape 2: Matières (manifest + préchargement images)
    setCurrentStep(1);
    materialsLoadTimer.reset();
    materialsWaitTimer.reset();
    setSteps((prev) =>
      prev.map((step, i) => ({
        ...step,
        status: i === 1 ? "loading" : i < 1 ? "completed" : "pending",
      }))
    );
    // Forcer le préchargement si pas déjà fait (idempotent via service)
    materialsLoadTimer.start();
    await ensureMaterialsPreloaded();
    materialsLoadTimer.stop();
    // Poursuivre l'attente pour components + selector dans la même étape "materials"
    // Faire grimper doucement la progression jusqu'à 98% pendant l'attente
    materialsWaitTimer.start();
    await waitForFlag(guards.componentsLoaded, 100);
    await waitForFlag(guards.selectorLoaded, 100);
    materialsWaitTimer.finish();
    setSteps((prev) =>
      prev.map((step, i) => ({
        ...step,
        status: i <= 1 ? "completed" : "pending",
      }))
    );

    // Animations finales
    gsap.to(progressBarRef.current, {
      width: "100%",
      duration: 0.3,
      ease: "power2.out",
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => {
        onLoadingComplete();
      },
    });
  }, [
    initializeApp,
    onLoadingComplete,
    finishWorkerTimer,
    materialsLoadTimer,
    materialsWaitTimer,
    resetWorkerTimer,
    startWorkerTimer,
  ]);

  useEffect(() => {
    // Animation d'entrée du logo
    gsap.fromTo(
      logoRef.current,
      { scale: 0, rotation: -180, opacity: 0 },
      {
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 1.2,
        ease: "back.out(1.7)",
        delay: 0.3,
      }
    );

    // Animation de la barre de progression
    gsap.fromTo(
      progressBarRef.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 0.8,
        ease: "power2.inOut",
        delay: 0.8,
      }
    );

    // Animation des étapes
    gsap.fromTo(
      stepsRef.current?.children || [],
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        delay: 1.2,
      }
    );
    // Démarrer le processus de chargement
    startLoadingProcess();
    return () => {
      // Nettoyage des timers si le composant se démonte
      stopWorkerTimer();
      materialsLoadTimer.stop();
      materialsWaitTimer.stop();
    };
  }, [
    startLoadingProcess,
    materialsLoadTimer,
    materialsWaitTimer,
    stopWorkerTimer,
  ]);

  // Icônes désormais gérées par StepItem

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center z-50"
    >
      <div className="max-w-md w-full mx-4 text-center">
        {/* Logo animé */}
        <BrandingHeader ref={logoRef} />

        {/* Barre de progression */}
        <GlobalProgressBar ref={progressBarRef} />
        <p className="text-xs text-gray-500 -mt-6 mb-6">
          Étape {currentStep + 1} sur {steps.length}
        </p>

        {/* Liste des étapes */}
        <div ref={stepsRef}>
          <StepList
            steps={steps}
            workerProgress={workerProgress}
            materialsProgress={materialsProgress}
          />
        </div>

        {/* Message de patience */}
        <div className="mt-8 text-xs text-gray-500">
          <p>Initialisation en cours, merci de patienter...</p>
        </div>
      </div>
    </div>
  );
}

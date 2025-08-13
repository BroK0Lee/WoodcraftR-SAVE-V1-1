import { useCallback, useEffect, useRef, useState } from "react";
import { useLoadingStore } from "@/store/loadingStore";
import { BrandingHeader } from "./components/BrandingHeader";
import { GlobalProgressBar } from "./components/GlobalProgressBar";
import { StepList } from "./components/StepList";
import type { LoadingStep } from "./types";
import { useProgressTimer } from "./hooks/useProgressTimer";
import { PROGRESS_CONFIG } from "./config";
import { waitForFlag, guards } from "./utils/storeGuards";
import { ensureMaterialsPreloaded } from "./utils/preloader";
import { useGsapIntro } from "./hooks/useGsapIntro";
import { runGsapOutro } from "./hooks/useGsapOutro";
import { initOccWorker } from "@/services/openCascadeWorkerService";

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
  // Suppression du timer simulé pour le worker: on affiche désormais uniquement la progression réelle (download) envoyée par le worker.
  const materialsLoadTimer = useProgressTimer(PROGRESS_CONFIG.materialsLoad);
  const materialsWaitTimer = useProgressTimer(PROGRESS_CONFIG.materialsWaiting);
  const materialsProgress = Math.max(
    materialsLoadTimer.value,
    materialsWaitTimer.value
  );

  // Store state pour suivre l'avancement du chargement
  const { initializeApp } = useLoadingStore();
  const workerPhase = useLoadingStore((s) => s.workerPhase);
  const workerPct = useLoadingStore((s) => s.workerPct);
  const setAppLoading = useLoadingStore((s) => s.setAppLoading);

  const startLoadingProcess = useCallback(async () => {
    // Lancer l'initialisation de l'app (matières, composants)
    initializeApp();

    // Étape 1: Attendre OpenCascade Worker
    setCurrentStep(0);
    setSteps((prev) =>
      prev.map((step, i) => ({
        ...step,
        status: i === 0 ? "loading" : "pending",
      }))
    );
    // Attendre le worker, mais arrêter en cas d'erreur détectée
    try {
      await waitForFlag(guards.workerReady, 100, guards.workerError);
    } catch {
      // Si la garde échoue, on reste sur l'étape worker
      return;
    }
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

    // Animations finales via hook dédié
    await runGsapOutro({
      containerRef,
      progressBarRef,
      onComplete: onLoadingComplete,
    });
  }, [
    initializeApp,
    onLoadingComplete,
    materialsLoadTimer,
    materialsWaitTimer,
  ]);

  // Animations d'intro (logo, barre, liste)
  useGsapIntro({ logoRef, progressBarRef, stepsRef });

  // Démarrer le processus de chargement + cleanup timers
  useEffect(() => {
    startLoadingProcess();
    return () => {
      materialsLoadTimer.stop();
      materialsWaitTimer.stop();
    };
  }, [startLoadingProcess, materialsLoadTimer, materialsWaitTimer]);

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
          <StepList steps={steps} materialsProgress={materialsProgress} />
        </div>

        {/* Message / Erreur / Action */}
        <div className="mt-8 text-xs text-gray-500">
          {workerPhase === "error" ? (
            <div className="space-y-3">
              <p className="text-red-600">
                Impossible d'initialiser le moteur 3D. Vérifiez votre connexion
                et réessayez.
              </p>
              <button
                className="inline-flex items-center px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700 text-xs"
                onClick={async () => {
                  // Forcer une relance simple: masquer/afficher l'écran de chargement et relancer le flux
                  setAppLoading(true);
                  setSteps([
                    {
                      id: "worker",
                      label: "Initialisation OpenCascade Worker...",
                      status: "pending",
                    },
                    {
                      id: "materials",
                      label: "Chargement des matières...",
                      status: "pending",
                    },
                  ]);
                  setCurrentStep(0);
                  try {
                    await initOccWorker();
                  } catch {
                    // laisser l'UI gérer l'erreur via workerPhase
                  }
                  startLoadingProcess();
                }}
              >
                Réessayer
              </button>
            </div>
          ) : (
            <p>
              Initialisation en cours ({Math.round(workerPct)}%) – merci de
              patienter...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

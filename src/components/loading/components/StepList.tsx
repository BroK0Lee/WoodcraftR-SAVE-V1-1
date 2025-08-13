import type { LoadingStep } from "../types";
import { StepItem } from "./StepItem";
import { useLoadingStore } from "@/store/loadingStore";

export interface StepListProps {
  steps: LoadingStep[];
  workerProgress: number;
  materialsProgress: number;
}

export function StepList({
  steps,
  workerProgress,
  materialsProgress,
}: StepListProps) {
  const workerPct = useLoadingStore((s) => s.workerProgress);
  const workerPhase = useLoadingStore((s) => s.workerPhase);
  const phaseLabel = (p: typeof workerPhase) => {
    switch (p) {
      case "start":
        return "préparation";
      case "download":
        return "téléchargement";
      case "compile":
        return "compilation";
      case "ready":
        return "prêt";
      case "error":
        return "erreur";
      default:
        return undefined;
    }
  };
  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const isWorker = step.id === "worker";
        const isMaterials = step.id === "materials";
        const progress = isWorker
          ? workerPct > 0
            ? workerPct
            : workerProgress
          : isMaterials
          ? materialsProgress
          : step.status === "completed"
          ? 100
          : undefined;
        const label =
          isWorker && step.status === "loading" && workerPhase !== "idle"
            ? `${step.label.replace(/\.*$/, "")} (${phaseLabel(workerPhase)})`
            : step.label;
        return (
          <StepItem
            key={step.id}
            step={{ ...step, label }}
            progress={progress}
          />
        );
      })}
    </div>
  );
}

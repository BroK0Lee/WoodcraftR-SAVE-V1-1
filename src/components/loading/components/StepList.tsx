import type { LoadingStep } from "../types";
import { StepItem } from "./StepItem";
import { useLoadingStore } from "@/store/loadingStore";

export interface StepListProps {
  steps: LoadingStep[];
  materialsProgress: number;
}

export function StepList({
  steps,
  materialsProgress,
}: StepListProps): JSX.Element {
  const workerPct = useLoadingStore((s) => s.workerProgress);
  const workerPhase = useLoadingStore((s) => s.workerPhase);

  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const isWorker = step.id === "worker";
        const isMaterials = step.id === "materials";

        let progress: number | undefined;
        if (isWorker) {
          // Affiche uniquement le pourcentage réel (phase download) ou reste à 0.
          progress =
            workerPhase === "download"
              ? workerPct
              : workerPhase === "ready"
              ? 100
              : undefined;
        } else if (isMaterials) {
          progress = materialsProgress;
        } else if (step.status === "completed") {
          progress = 100;
        }

        // Plus de cap artificiel à 99%; ready pilote directement 100%.

        return <StepItem key={step.id} step={step} progress={progress} />;
      })}
    </div>
  );
}

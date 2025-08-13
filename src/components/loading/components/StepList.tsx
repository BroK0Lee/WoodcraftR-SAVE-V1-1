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
          progress = workerPct > 0 ? workerPct : workerProgress;
        } else if (isMaterials) {
          progress = materialsProgress;
        } else if (step.status === "completed") {
          progress = 100;
        }

        if (
          isWorker &&
          step.status === "loading" &&
          workerPhase === "ready" &&
          typeof progress === "number"
        ) {
          progress = Math.min(progress, 99);
        }

        return <StepItem key={step.id} step={step} progress={progress} />;
      })}
    </div>
  );
}

import type { LoadingStep } from "../types";
import { StepItem } from "./StepItem";

export interface StepListProps {
  steps: LoadingStep[];
  workerProgress: number;
  materialsProgress: number;
}

export function StepList({ steps, workerProgress, materialsProgress }: StepListProps) {
  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const isWorker = step.id === "worker";
        const isMaterials = step.id === "materials";
        const progress = isWorker
          ? workerProgress
          : isMaterials
          ? materialsProgress
          : step.status === "completed"
          ? 100
          : undefined;
        return <StepItem key={step.id} step={step} progress={progress} />;
      })}
    </div>
  );
}

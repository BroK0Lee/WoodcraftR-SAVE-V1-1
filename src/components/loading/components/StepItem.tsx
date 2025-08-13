import { Loader2, CheckCircle } from "lucide-react";
import type { LoadingStep } from "../types";
import { useLoadingStore } from "@/store/loadingStore";

export interface StepItemProps {
  step: LoadingStep;
  progress?: number; // 0..100 si applicable (worker/materials)
}

export function StepItem({ step, progress }: StepItemProps) {
  const workerPhase = useLoadingStore((s) => s.workerPhase);
  const getIcon = () => {
    switch (step.status) {
      case "loading":
        return <Loader2 className="w-4 h-4 animate-spin text-amber-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return (
          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
        );
    }
  };

  const isProgressVisible = typeof progress === "number";
  const isWorkerStep = step.id === "worker";
  const showIndeterminate = isWorkerStep && step.status === "loading" && workerPhase === "compile" && !isProgressVisible;

  return (
    <div
      className={`p-3 rounded-lg transition-all duration-300 ${
        step.status === "loading"
          ? "bg-amber-100 border border-amber-200"
          : step.status === "completed"
          ? "bg-green-50 border border-green-200"
          : "bg-gray-50 border border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <span
          className={`text-sm font-medium ${
            step.status === "loading"
              ? "text-amber-800"
              : step.status === "completed"
              ? "text-green-800"
              : "text-gray-600"
          }`}
        >
          {step.label}
        </span>
      </div>
      {isProgressVisible && (
        <div className="mt-2 w-full h-1.5 bg-white/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-200"
            style={{ width: `${Math.max(0, Math.min(100, progress ?? 0))}%` }}
          />
        </div>
      )}
      {showIndeterminate && (
        <div className="mt-2 w-full h-1.5 bg-white/50 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 animate-pulse bg-[repeating-linear-gradient(45deg,rgba(251,191,36,0.4)_0,rgba(251,191,36,0.4)_10px,rgba(253,230,138,0.6)_10px,rgba(253,230,138,0.6)_20px)]" />
        </div>
      )}
    </div>
  );
}

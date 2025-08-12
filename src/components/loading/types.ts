export type StepStatus = "pending" | "loading" | "completed";

export interface LoadingStep {
  id: string;
  label: string;
  status: StepStatus;
}

export interface MainLoadingPageProps {
  onLoadingComplete: () => void;
}

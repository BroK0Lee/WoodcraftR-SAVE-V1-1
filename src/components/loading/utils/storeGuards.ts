import { useLoadingStore } from "@/store/loadingStore";

export async function waitForFlag(
  getter: () => boolean,
  intervalMs = 100,
  abortWhen?: () => boolean
) {
  // polling with optional abort condition
  // upstream orchestrator can add a timeout if needed
  while (true) {
    if (getter()) return;
    if (abortWhen && abortWhen()) throw new Error("Aborted waiting for flag");
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

export const guards = {
  workerReady: () => useLoadingStore.getState().isWorkerReady,
  workerError: () => useLoadingStore.getState().workerPhase === "error",
  materialsLoaded: () => useLoadingStore.getState().isMaterialsLoaded,
  componentsLoaded: () => useLoadingStore.getState().isComponentsLoaded,
  selectorLoaded: () => useLoadingStore.getState().isWoodMaterialSelectorLoaded,
};

import { useLoadingStore } from "@/store/loadingStore";

export async function waitForFlag(getter: () => boolean, intervalMs = 100) {
  // simple polling without timeout; upstream orchestrator can add a timeout if needed
  while (!getter()) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

export const guards = {
  workerReady: () => useLoadingStore.getState().isWorkerReady,
  materialsLoaded: () => useLoadingStore.getState().isMaterialsLoaded,
  componentsLoaded: () => useLoadingStore.getState().isComponentsLoaded,
  selectorLoaded: () => useLoadingStore.getState().isWoodMaterialSelectorLoaded,
};

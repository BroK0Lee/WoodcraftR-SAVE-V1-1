import { materialPreloader } from "@/services/materialPreloader";
import { useLoadingStore } from "@/store/loadingStore";

export async function ensureMaterialsPreloaded() {
  if (!useLoadingStore.getState().isMaterialsLoaded) {
    try {
      await materialPreloader.preloadMaterials();
    } catch {
      // tolerate image errors, do not block
    }
    useLoadingStore.getState().setMaterialsLoaded(true);
  } else {
    try {
      await materialPreloader.preloadMaterials();
    } catch {
      // ignore
    }
  }
}

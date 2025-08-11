import * as Comlink from "comlink";
import type { OccWorkerAPI } from "@/workers/worker.types";

// Service singleton pour gérer le worker OpenCascade via Comlink
// - Création unique, même sous StrictMode (double mount)
// - Expose init(), getProxy(), isReady(), terminate()

let workerInstance: Worker | null = null;
let proxyInstance: Comlink.Remote<OccWorkerAPI> | null = null;
let ready = false;
let initPromise: Promise<boolean> | null = null;

/**
 * Initialise le worker OpenCascade (idempotent)
 */
export async function initOccWorker(): Promise<boolean> {
  if (ready && proxyInstance) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!workerInstance) {
      workerInstance = new Worker(
        new URL("../workers/occ.worker.ts", import.meta.url),
        { type: "module" }
      );
    }
    if (!proxyInstance) {
      proxyInstance = Comlink.wrap<OccWorkerAPI>(workerInstance);
    }
    try {
      const ok = await proxyInstance.init();
      ready = !!ok;
      return ready;
    } catch (e) {
      // En cas d'échec, nettoyer l'état pour permettre une réinitialisation ultérieure
      ready = false;
      proxyInstance = null;
      if (workerInstance) {
        workerInstance.terminate();
        workerInstance = null;
      }
      throw e;
    } finally {
      // Laisser initPromise non nul si ready=true pour éviter recréation concurrente; si échec, on la remettra à null
      if (!ready) initPromise = null;
    }
  })();

  return initPromise;
}

/** Retourne le proxy Comlink si prêt, sinon null */
export function getOccProxy(): Comlink.Remote<OccWorkerAPI> | null {
  return proxyInstance;
}

/** Indique si le worker est prêt */
export function isOccReady(): boolean {
  return ready;
}

/** Termine le worker et réinitialise le service */
export function terminateOccWorker(): void {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
  proxyInstance = null;
  ready = false;
  initPromise = null;
}

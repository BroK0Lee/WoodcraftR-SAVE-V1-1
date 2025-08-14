import * as Comlink from "comlink";
import type { OccWorkerAPI } from "@/workers/worker.types";
import { useLoadingStore } from "@/store/loadingStore";

// Service singleton pour gérer le worker OpenCascade via Comlink
// - Création unique, même sous StrictMode (double mount)
// - Expose init(), getProxy(), isReady(), terminate()

let workerInstance: Worker | null = null;
let proxyInstance: Comlink.Remote<OccWorkerAPI> | null = null;
let ready = false;
let initPromise: Promise<boolean> | null = null;
const DEBUG_LOADING = true;
const wlog = (...a: unknown[]) => {
  if (DEBUG_LOADING) console.debug("[LOAD][WORKER]", ...a);
};

// Reflète la nouvelle machine d'états du worker (progressEvents.ts)
export type WorkerProgressEvent = {
  type: "oc:progress";
  phase:
    | "start"
    | "download"
    | "compile-start"
    | "compile"
    | "compile-done"
    | "init"
    | "ready"
    | "error";
  pct?: number; // progression globale segmentée (0..100)
  rawPct?: number; // progression brute de téléchargement (download uniquement)
  errorMessage?: string; // message d'erreur éventuel
};

type ProgressListener = (evt: WorkerProgressEvent) => void;
const progressListeners = new Set<ProgressListener>();

export function onOccProgress(listener: ProgressListener) {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
}

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
      wlog("spawn worker");
      // Ecoute des messages bruts (progression)
      workerInstance.addEventListener("message", (e: MessageEvent) => {
        const data = e.data as unknown;
        if (!data || typeof data !== "object") return;
        const evt = data as Partial<WorkerProgressEvent>;
        if (evt.type === "oc:progress" && evt.phase) {
          progressListeners.forEach((cb) => {
            try {
              cb(evt as WorkerProgressEvent);
            } catch {
              // ignore listener errors
            }
          });
        }
      });
    }
    if (!proxyInstance) {
      proxyInstance = Comlink.wrap<OccWorkerAPI>(workerInstance);
    }
    try {
      wlog("call proxy.init()");
      const ok = await Promise.race([
        proxyInstance.init(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error("OCC init timeout 30s")), 30000)
        ),
      ]);
      ready = !!ok;
      wlog("init result", ready);
      if (ready) {
        // Promotion immédiate du statut global si pas déjà fait
        const st = useLoadingStore.getState();
        if (st.workerStatus !== "worker-ready") {
          try {
            st.setWorkerStatus("worker-ready");
            wlog("promote worker-ready (service)");
          } catch {
            // Ignore promotion error (store possiblement indisponible)
          }
        }
      }
      return ready;
    } catch (e) {
      wlog("init error", e);
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

import { usePanelStore } from "@/store/panelStore";
import type { PanelGeometryDTO } from "@/workers/api/shapeToGeometry";
import type { EdgeDTO } from "@/models/EdgeDTO";
// IMPORTANT: ne pas importer/consommer directement le hook useOpenCascadeWorker ici (hooks interdits hors React).
// On utilisera une fonction d'enregistrement pour stocker le proxy lorsque le worker devient prêt.

// Service centralisé pour la géométrie du panneau
// Gère pré-calcul initial (pendant loading) et recalculs utilisateur (debounce + skip sur même signature)

const DEBUG_PANEL = true;
const plog = (...a: unknown[]) => {
  if (DEBUG_PANEL) console.debug("[PANEL_GEOM]", ...a);
};

let inFlight: Promise<void> | null = null;
let abortFlag = false;
let lastSig: string | null = null;
let precomputePromise: Promise<boolean> | null = null;

// Référence globale au proxy du worker (alimentée par registerWorkerProxy)
// Types minimaux dérivés de l'API worker
interface CreatePanelWithCutsArgs {
  dimensions: {
    length: number;
    width: number;
    thickness: number;
  };
  cuts: unknown[]; // Pour rester souple; idéalement importer type Cut
  shape: "rectangle" | "circle";
  circleDiameter?: number;
}
interface CreatePanelWithCutsResult {
  geometry: PanelGeometryDTO;
  edges: EdgeDTO[];
}
export type WorkerProxyType = {
  createPanelWithCuts: (
    args: CreatePanelWithCutsArgs
  ) => Promise<CreatePanelWithCutsResult>;
};
let workerProxy: WorkerProxyType | null = null;

export function registerWorkerProxy(proxy: unknown) {
  // Validation minimale
  if (proxy && typeof proxy === "object" && "createPanelWithCuts" in proxy) {
    workerProxy = proxy as WorkerProxyType;
  } else if (proxy == null) {
    workerProxy = null;
  }
  if (proxy) plog("WORKER_PROXY_REGISTERED");
}

function buildSig() {
  const { dimensions, cuts, shape, circleDiameter, previewCut } =
    usePanelStore.getState();
  return JSON.stringify({
    dimensions,
    cuts,
    shape,
    circleDiameter,
    preview: previewCut?.id || null,
  });
}

async function computePanelCore(force = false): Promise<boolean> {
  const panelState = usePanelStore.getState();
  const {
    dimensions,
    cuts,
    shape,
    circleDiameter,
    geometry,
    setGeometry,
    setEdges,
    setCalculating,
    previewCut,
  } = panelState;

  // Récupération du proxy via hook (hors composant : on appelle directement la fonction du hook - acceptable car elle retourne une ref stable)
  const proxy = workerProxy;
  if (!proxy) {
    plog("NO_PROXY_READY");
    return false;
  }

  const sig = buildSig();
  if (!force && sig === lastSig && geometry) {
    plog("SKIP_SAME_SIG");
    return false;
  }

  if (inFlight) {
    plog("MARK_ABORT_PREVIOUS");
    abortFlag = true; // On laissera finir mais ignorera le résultat
  }

  abortFlag = false;
  lastSig = sig;
  setCalculating(true);
  plog("START", {
    cuts: cuts.length,
    shape,
    circleDiameter,
    preview: !!previewCut,
  });

  const computation = async () => {
    try {
      const res = await proxy.createPanelWithCuts({
        dimensions,
        cuts: previewCut ? [...cuts, previewCut] : cuts,
        shape,
        circleDiameter,
      });
      if (abortFlag) {
        plog("IGNORED_ABORTED_RESULT");
        return;
      }
      const clonedGeometry = {
        positions: new Float32Array(res.geometry.positions),
        indices:
          res.geometry.indices instanceof Uint32Array
            ? new Uint32Array(res.geometry.indices)
            : new Uint16Array(res.geometry.indices),
      } satisfies PanelGeometryDTO;
      setGeometry(clonedGeometry);
      setEdges(res.edges as EdgeDTO[]);
      plog("DONE", {
        vertices: clonedGeometry.positions.length / 3,
        triangles: clonedGeometry.indices.length / 3,
        edges: res.edges.length,
      });
    } catch (e) {
      if (!abortFlag) plog("ERROR", e);
    } finally {
      inFlight = null;
      setCalculating(false);
    }
  };

  const p = computation();
  inFlight = p;
  return true;
}

export async function computeInitialPanelIfNeeded(): Promise<boolean> {
  if (precomputePromise) return precomputePromise;
  const { geometry } = usePanelStore.getState();
  if (geometry) {
    plog("INITIAL_SKIP_ALREADY_HAS_GEOMETRY");
    return false;
  }
  precomputePromise = (async () => {
    plog("INITIAL_TRY");
    const ok = await computePanelCore(true);
    if (!ok) {
      // Échec (probablement proxy pas encore dispo) => autoriser un futur retry
      precomputePromise = null;
    }
    return ok;
  })();
  return precomputePromise;
}

let debounceTimer: number | null = null;
const DEBOUNCE_MS = 120;

export function requestUserRecompute(reason: string) {
  plog("USER_RECOMPUTE_REQUEST", reason);
  if (debounceTimer) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    debounceTimer = null;
    void computePanelCore(false);
  }, DEBOUNCE_MS);
}

export function forceRecompute() {
  void computePanelCore(true);
}

export function _debugPanelState() {
  return { lastSig, inFlight: !!inFlight };
}

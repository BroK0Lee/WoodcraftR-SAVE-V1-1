// --- IMPORTS ---
import * as Comlink from "comlink";
import openCascadeFactory from "opencascade.js/dist/opencascade.full.js";
import wasmURL from "opencascade.js/dist/opencascade.full.wasm?url";
import { createProgressEmitter } from "./bootstrap/progressEvents";
import type {
  OccWorkerAPI,
  CutValidationResult,
  PanelWithCutsConfig,
} from "./worker.types";
import type { PanelDimensions } from "@/models/Panel";
import type { Cut, RectangularCut, CircularCut } from "@/models/Cut";
import type { TopoDS_Shape } from "opencascade.js";
// Modules refactorisés
import { createBox as createBoxBase } from "./api/panelBase";
import { getEdges as getEdgesBase } from "./api/edges";
import { createPanelWithCuts as createPanelWithCutsBase } from "./api/panelWithCuts";
import {
  createCircularCut as createCircularCutBase,
  createRectangularCut as createRectangularCutBase,
  applyAllCuts as applyAllCutsBase,
} from "./api/cuts";
import { validateSingleCut } from "./api/validation";
import type { OCCLike } from "./api/occtypes";

// --- ETAT GLOBAL ---
let oc: Awaited<ReturnType<typeof openCascadeFactory>> | null = null;
const progress = createProgressEmitter((evt) => self.postMessage(evt));

async function init(): Promise<boolean> {
  if (oc) {
    progress.ready();
    return true;
  }
  type OpenCascadeFactory = (opts: {
    locateFile: () => string;
  }) => Promise<Awaited<ReturnType<typeof openCascadeFactory>>>;
  const factory = openCascadeFactory as unknown as OpenCascadeFactory;
  progress.start();
  try {
    const resp = await fetch(wasmURL);
    const totalStr = resp.headers.get("Content-Length");
    const total = totalStr ? parseInt(totalStr, 10) : undefined;
    let loaded = 0;
    let wasmBuffer: ArrayBuffer;
    if (resp.body && total && Number.isFinite(total)) {
      const reader = resp.body.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.byteLength;
          const pct = Math.max(
            0,
            Math.min(100, Math.round((loaded / total) * 100))
          );
          progress.reportDownload(pct);
        }
      }
      const combined = new Uint8Array(loaded);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.byteLength;
      }
      wasmBuffer = combined.buffer;
    } else {
      wasmBuffer = await resp.arrayBuffer();
      progress.reportDownload(100);
    }
    const blob = new Blob([wasmBuffer], { type: "application/wasm" });
    const blobUrl = URL.createObjectURL(blob);
  progress.compileStart();
  oc = await factory({ locateFile: () => blobUrl });
  progress.compileDone();
  URL.revokeObjectURL(blobUrl);
  progress.ready();
    return true;
  } catch (e) {
    progress.error(e instanceof Error ? e.message : String(e));
    throw e;
  }
}

// Utilitaire
function requireOc() {
  if (!oc) throw new Error("OpenCascade not ready");
  return oc;
}

// Wrappers
async function createBox(dims: PanelDimensions) {
  return createBoxBase(requireOc() as unknown as OCCLike, dims);
}
function getEdges(shape: TopoDS_Shape, tolerance: number) {
  return getEdgesBase(requireOc() as unknown as OCCLike, shape, tolerance);
}
async function createPanelWithCuts(config: PanelWithCutsConfig) {
  return createPanelWithCutsBase(requireOc() as unknown as OCCLike, config);
}
async function validateCutFeasibility(
  panelDims: PanelDimensions,
  cut: Cut
): Promise<CutValidationResult> {
  const res = validateSingleCut(
    { width: panelDims.width, height: panelDims.length },
    cut.type === "rectangle"
      ? {
          type: "rect",
          width: cut.length,
          height: cut.width,
          x: cut.positionX,
          y: cut.positionY,
        }
      : {
          type: "circle",
          radius: cut.radius,
          x: cut.positionX,
          y: cut.positionY,
        }
  );
  return { isValid: res.ok, errors: res.errors, warnings: [] };
}
function createRectangularCut(cut: RectangularCut, thickness: number) {
  return createRectangularCutBase(
    requireOc() as unknown as OCCLike,
    cut,
    thickness
  );
}
function createCircularCut(cut: CircularCut, thickness: number) {
  return createCircularCutBase(
    requireOc() as unknown as OCCLike,
    cut,
    thickness
  );
}
async function applyAllCuts(
  panel: TopoDS_Shape,
  cuts: Cut[],
  thickness: number
) {
  return applyAllCutsBase(
    requireOc() as unknown as OCCLike,
    panel,
    cuts,
    thickness
  );
}

Comlink.expose({
  init,
  createBox,
  getEdges,
  createPanelWithCuts,
  validateCutFeasibility,
  createRectangularCut,
  createCircularCut,
  applyAllCuts,
} as OccWorkerAPI);

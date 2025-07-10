
// --- IMPORTS ---
import * as Comlink from "comlink";
import openCascadeFactory from "opencascade.js/dist/opencascade.full.js";
import wasmURL from "opencascade.js/dist/opencascade.full.wasm?url";
import { shapeToGeometry } from "../helpers/shapeToGeometry";
import shapeToUrl from "../helpers/shapeToUrl"; // doit etre "pur JS" !
import type { OccWorkerAPI } from "./worker.types";
import type { PanelDimensions } from "@/models/Panel";
import type { EdgeDTO } from "@/models/EdgeDTO";
import type { TopoDS_Shape } from "opencascade.js";


// --- VARIABLES GLOBALES ---
let oc: Awaited<ReturnType<typeof openCascadeFactory>> | null = null;


// --- INIT OPENCASCADE ---
async function init() {
  if (!oc) {
    // Correction du typage pour accepter locateFile
    type OpenCascadeFactory = (opts: { locateFile: () => string }) => Promise<Awaited<ReturnType<typeof openCascadeFactory>>>;
    const factory = openCascadeFactory as unknown as OpenCascadeFactory;
    oc = await factory({ locateFile: () => wasmURL });
  }
  return true;
}


// --- API PRINCIPALE ---


// Fonction unique : génère la géométrie, les edges et l'URL GLB d'un panneau
async function createBox({ length, width, thickness }: PanelDimensions): Promise<{
  geometry: import("@/helpers/shapeToGeometry").PanelGeometryDTO;
  edges: EdgeDTO[];
  url: string;
}> {
  if (!oc) throw new Error("OpenCascade not ready");
  const panel = new oc.BRepPrimAPI_MakeBox_2(length, width, thickness).Shape();
  const geometry = shapeToGeometry(oc, panel);
  const edges = getEdges(panel, 0.5);
  const url = shapeToUrl(oc, panel);
  return { geometry, edges, url };
}


// 3. Retourne les arêtes discrétisées d'une forme
function getEdges(shape: TopoDS_Shape, tolerance: number): EdgeDTO[] {
  if (!oc) throw new Error("OpenCascade not ready");

  // Correction du typage dynamique pour les enums OpenCascade.js
  const TopAbs_EDGE = (oc.TopAbs_ShapeEnum?.TopAbs_EDGE ?? 2);
  const TopAbs_SHAPE = (oc.TopAbs_ShapeEnum?.TopAbs_SHAPE ?? 7);
  const explorer = new oc.TopExp_Explorer_2(
    shape,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TopAbs_EDGE as any, // OpenCascade enum casting required
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TopAbs_SHAPE as any,
  );

  const result: EdgeDTO[] = [];
  let id = 0;

  while (explorer.More()) {
    const edge = oc.TopoDS.Edge_1(explorer.Current());
    const adaptor = new oc.BRepAdaptor_Curve_2(edge);
    const discretizer = new oc.GCPnts_UniformDeflection_2(
      adaptor,
      tolerance,
      false,
    );

    if (discretizer.IsDone()) {
      const nb = discretizer.NbPoints();
      const points = new Float32Array(nb * 3);
      for (let i = 1; i <= nb; i++) {
        const pnt = discretizer.Value(i);
        const base = (i - 1) * 3;
        points[base] = pnt.X();
        points[base + 1] = pnt.Y();
        points[base + 2] = pnt.Z();
      }
      result.push({ id, xyz: points });
      id += 1;
    }

    explorer.Next();
  }

  return result;
}

// --- EXPOSE API ---
Comlink.expose({ init, createBox, getEdges } as OccWorkerAPI);

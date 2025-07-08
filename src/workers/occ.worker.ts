import * as Comlink from "comlink";
import openCascadeFactory from "opencascade.js/dist/opencascade.full.js";
import wasmURL from "opencascade.js/dist/opencascade.full.wasm?url";
import shapeToUrl from "../helpers/shapeToUrl"; // doit etre "pur JS" !
import type { PanelDimensions } from "@/models/Panel";
import type { EdgeDTO } from "@/models/EdgeDTO";
import type { TopoDS_Shape } from "opencascade.js";

let oc: Awaited<ReturnType<typeof openCascadeFactory>> | null = null;

async function init() {
  if (!oc) {
    // openCascadeFactory typings lack options parameter
    const factory = openCascadeFactory as unknown as (
      opts: { locateFile: () => string }
    ) => Promise<Awaited<ReturnType<typeof openCascadeFactory>>>;
    oc = await factory({ locateFile: () => wasmURL });
  }
  return true;
}

// Génère un panneau simple selon les dimensions fournies
async function createBox({ width, height, thickness }: PanelDimensions): Promise<{ url: string; edges: EdgeDTO[] }> {
  if (!oc) throw new Error("OpenCascade not ready");

  const panel = new oc.BRepPrimAPI_MakeBox_2(
    width,
    height,
    thickness,
  ).Shape();

  const url = shapeToUrl(oc, panel);
  const edges = getEdges(panel, 0.5);
  return { url, edges }; // On retourne l'URL du GLB et les arêtes
}

// Retourne les arêtes discrétisées d'une forme
function getEdges(shape: TopoDS_Shape, tolerance: number): EdgeDTO[] {
  if (!oc) throw new Error("OpenCascade not ready");

  const explorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_EDGE,
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE,
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

Comlink.expose({ init, createBox, getEdges });

import type { PanelDimensions } from "@/models/Panel";
import type { EdgeDTO } from "@/models/EdgeDTO";
import { shapeToGeometry } from "@/helpers/shapeToGeometry";
import shapeToUrl from "@/helpers/shapeToUrl";
import { getEdges } from "./edges";

export interface PanelBuildResult {
  geometry: import("@/helpers/shapeToGeometry").PanelGeometryDTO;
  edges: EdgeDTO[];
  url: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createBox(oc: any, dims: PanelDimensions): Promise<PanelBuildResult> {
  if (!oc) throw new Error("OpenCascade not ready");
  const panel = new oc.BRepPrimAPI_MakeBox_2(dims.length, dims.width, dims.thickness).Shape();
  const geometry = shapeToGeometry(oc, panel);
  const edges = getEdges(oc, panel, 0.5);
  const url = shapeToUrl(oc, panel);
  return { geometry, edges, url };
}

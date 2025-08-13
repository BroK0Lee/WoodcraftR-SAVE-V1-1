import type { PanelDimensions } from "@/models/Panel";
import type { EdgeDTO } from "@/models/EdgeDTO";
import { shapeToGeometry } from "@/helpers/shapeToGeometry";
import shapeToUrl from "@/helpers/shapeToUrl";
import { getEdges } from "./edges";
import type { OCCLike } from "./occtypes";
import { assertOc } from "./occtypes";
import type { OpenCascadeInstance } from "opencascade.js";

export interface PanelBuildResult {
  geometry: import("@/helpers/shapeToGeometry").PanelGeometryDTO;
  edges: EdgeDTO[];
  url: string;
}

export async function createBox(
  oc: OCCLike | null,
  dims: PanelDimensions
): Promise<PanelBuildResult> {
  assertOc(oc);
  const panel = new oc.BRepPrimAPI_MakeBox_2!(
    dims.length,
    dims.width,
    dims.thickness
  ).Shape();
  const geometry = shapeToGeometry(oc, panel);
  const edges = getEdges(oc, panel, 0.5);
  const url = shapeToUrl(oc as unknown as OpenCascadeInstance, panel);
  return { geometry, edges, url };
}

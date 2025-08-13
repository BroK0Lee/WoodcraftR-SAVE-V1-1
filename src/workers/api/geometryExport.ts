import type { EdgeDTO } from "@/models/EdgeDTO";
import { shapeToGeometry } from "@/helpers/shapeToGeometry";
import shapeToUrl from "@/helpers/shapeToUrl";
import { getEdges } from "./edges";

export interface ExportResult {
  geometry: import("@/helpers/shapeToGeometry").PanelGeometryDTO;
  edges: EdgeDTO[];
  url: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildPanelResult(oc: any, shape: unknown): Promise<ExportResult> {
  if (!oc) throw new Error("OpenCascade not ready");
  const geometry = shapeToGeometry(oc, shape as never);
  const edges = getEdges(oc, shape as never, 0.5);
  const url = shapeToUrl(oc, shape as never);
  return { geometry, edges, url };
}

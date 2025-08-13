import type { EdgeDTO } from "@/models/EdgeDTO";
import { shapeToGeometry } from "@/helpers/shapeToGeometry";
import shapeToUrl from "@/helpers/shapeToUrl";
import { getEdges } from "./edges";
import type { OCCLike } from "./occtypes";
import { assertOc } from "./occtypes";
import type { OpenCascadeInstance } from "opencascade.js";

export interface ExportResult {
  geometry: import("@/helpers/shapeToGeometry").PanelGeometryDTO;
  edges: EdgeDTO[];
  url: string;
}

export async function buildPanelResult(
  oc: OCCLike | null,
  shape: unknown
): Promise<ExportResult> {
  assertOc(oc);
  const geometry = shapeToGeometry(oc, shape as never);
  const edges = getEdges(oc, shape as never, 0.5);
  // shapeToUrl attend l'instance OpenCascade complète; notre OCCLike est un sous-ensemble -> cast contrôlé.
  const url = shapeToUrl(oc as unknown as OpenCascadeInstance, shape as never);
  return { geometry, edges, url };
}

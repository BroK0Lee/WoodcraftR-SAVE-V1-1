import type { PanelWithCutsConfig, CuttingInfo } from "../worker.types";
import type { EdgeDTO } from "@/models/EdgeDTO";
import type { TopoDS_Shape } from "opencascade.js";
import { applyAllCuts } from "./cuts";
import { buildPanelResult } from "./geometryExport";
import type { OCCLike } from "./occtypes";
import { assertOc } from "./occtypes";

export interface PanelWithCutsResult {
  geometry: import("@/helpers/shapeToGeometry").PanelGeometryDTO;
  edges: EdgeDTO[];
  url: string;
  cuttingInfo: CuttingInfo;
}

export async function createPanelWithCuts(
  oc: OCCLike | null,
  config: PanelWithCutsConfig
): Promise<PanelWithCutsResult> {
  assertOc(oc);
  const { dimensions, cuts, shape = "rectangle", circleDiameter } = config;

  // Créer le panneau de base selon la forme
  let basePanel: TopoDS_Shape;
  if (shape === "circle") {
    const diameter =
      circleDiameter ?? Math.min(dimensions.length, dimensions.width);
    const radius = Math.max(0.1, diameter / 2);
    const rawCylinder = new oc.BRepPrimAPI_MakeCylinder_2!(
      radius,
      dimensions.thickness,
      2 * Math.PI
    ).Shape();
    const trsf = new oc.gp_Trsf_1!();
    trsf.SetTranslation_1(new oc.gp_Vec_4!(radius, radius, 0));
    const transform = new oc.BRepBuilderAPI_Transform_2!(
      rawCylinder,
      trsf,
      false
    );
    basePanel = transform.Shape();
  } else {
    basePanel = new oc.BRepPrimAPI_MakeBox_2!(
      dimensions.length,
      dimensions.width,
      dimensions.thickness
    ).Shape();
  }

  const { resultShape, cuttingInfo } = await applyAllCuts(
    oc,
    basePanel,
    cuts,
    dimensions.thickness
  );
  const { geometry, edges, url } = await buildPanelResult(oc, resultShape);
  return { geometry, edges, url, cuttingInfo };
}

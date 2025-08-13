import type { RectangularCut, CircularCut, Cut } from "@/models/Cut";
import { EPSILON_CUT } from "@/models/Cut";
import type { TopoDS_Shape } from "opencascade.js";
import type { CuttingInfo } from "../worker.types";
import type { OCCLike } from "./occtypes";
import { assertOc } from "./occtypes";

// Crée une forme de découpe rectangulaire positionnée
export function createRectangularCut(
  oc: OCCLike | null,
  cut: RectangularCut,
  panelThickness: number
): TopoDS_Shape {
  assertOc(oc);
  const cutDepth = cut.depth || panelThickness;
  const cutBox = new oc.BRepPrimAPI_MakeBox_2!(
    cut.length,
    cut.width,
    cutDepth + 2 * EPSILON_CUT
  ).Shape();
  const translation = new oc.gp_Trsf_1!();
  const zPosition = panelThickness + EPSILON_CUT - (cutDepth + 2 * EPSILON_CUT);
  translation.SetTranslation_1(
    new oc.gp_Vec_4!(
      cut.positionX - cut.length / 2,
      cut.positionY - cut.width / 2,
      zPosition
    )
  );
  const transform = new oc.BRepBuilderAPI_Transform_2!(
    cutBox,
    translation,
    false
  );
  return transform.Shape();
}

// Crée une forme de découpe circulaire positionnée
export function createCircularCut(
  oc: OCCLike | null,
  cut: CircularCut,
  panelThickness: number
): TopoDS_Shape {
  assertOc(oc);
  const cutDepth = cut.depth || panelThickness;
  const cylinder = new oc.BRepPrimAPI_MakeCylinder_2!(
    cut.radius,
    cutDepth + 2 * EPSILON_CUT,
    2 * Math.PI
  ).Shape();
  const translation = new oc.gp_Trsf_1!();
  const zPosition = panelThickness + EPSILON_CUT - (cutDepth + 2 * EPSILON_CUT);
  translation.SetTranslation_1(
    new oc.gp_Vec_4!(cut.positionX, cut.positionY, zPosition)
  );
  const transform = new oc.BRepBuilderAPI_Transform_2!(
    cylinder,
    translation,
    false
  );
  return transform.Shape();
}

// Applique toutes les découpes et calcule les infos
export async function applyAllCuts(
  oc: OCCLike | null,
  panel: TopoDS_Shape,
  cuts: Cut[],
  panelThickness: number
): Promise<{ resultShape: TopoDS_Shape; cuttingInfo: CuttingInfo }> {
  assertOc(oc);
  let resultShape: TopoDS_Shape = panel;
  const failedCuts: string[] = [];
  let totalCutArea = 0;
  let totalCutVolume = 0;
  let rectangularCuts = 0;
  let circularCuts = 0;
  for (const cut of cuts) {
    try {
      let cutShape: TopoDS_Shape;
      if (cut.type === "rectangle") {
        cutShape = createRectangularCut(oc, cut, panelThickness);
        rectangularCuts++;
        totalCutArea += cut.length * cut.width;
        totalCutVolume +=
          cut.length * cut.width * (cut.depth || panelThickness);
      } else {
        cutShape = createCircularCut(oc, cut, panelThickness);
        circularCuts++;
        const area = Math.PI * cut.radius * cut.radius;
        totalCutArea += area;
        totalCutVolume += area * (cut.depth || panelThickness);
      }
      const booleanOp = new oc.BRepAlgoAPI_Cut_3!(
        resultShape,
        cutShape,
        new oc.Message_ProgressRange_1!()
      );
      booleanOp.Build(new oc.Message_ProgressRange_1!());
      if (booleanOp.IsDone()) {
        resultShape = booleanOp.Shape();
      } else {
        failedCuts.push(cut.id);
        console.warn(
          `Échec de l'opération booléenne pour la découpe ${cut.id}`
        );
      }
    } catch (error) {
      failedCuts.push(cut.id);
      console.error(
        `Erreur lors de la création de la découpe ${cut.id}:`,
        error
      );
    }
  }
  const cuttingInfo: CuttingInfo = {
    totalCuts: cuts.length,
    rectangularCuts,
    circularCuts,
    totalCutArea,
    totalCutVolume,
    failedCuts,
  };
  return { resultShape, cuttingInfo };
}

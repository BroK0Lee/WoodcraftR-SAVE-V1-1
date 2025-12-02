import type { RectangularCut, CircularCut, Cut } from "@/models/Cut";
import { EPSILON_CUT } from "@/models/Cut";
import { validateRectangularCut } from "@/dashboard/cutting/validation/CutRulesValidation";
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

  // Validation de sécurité pour éviter les géométries invalides (chevauchement excessif)
  const validation = validateRectangularCut(cut);
  if (!validation.isValid) {
    console.warn(`[Worker] Invalid cut configuration ignored: ${validation.errors.join(", ")}`);
    throw new Error(`Invalid cut configuration: ${validation.errors.join(", ")}`);
  }

  const cutDepth = cut.depth || panelThickness;
  
  // 1. Créer la boîte à l'origine (0,0,0)
  const cutBox = new oc.BRepPrimAPI_MakeBox_2!(
    cut.length,
    cut.width,
    cutDepth + 2 * EPSILON_CUT
  ).Shape();

  // 2. Centrer la boîte sur le plan XY
  const centeringTrsf = new oc.gp_Trsf_1!();
  centeringTrsf.SetTranslation_1(
    new oc.gp_Vec_4!(-cut.length / 2, -cut.width / 2, 0)
  );

  // 3. Appliquer la rotation (si définie)
  const rotationTrsf = new oc.gp_Trsf_1!();
  if (cut.rotation) {
    const axis = new oc.gp_Ax1_2!(
      new oc.gp_Pnt_3!(0, 0, 0),
      new oc.gp_Dir_4!(0, 0, 1)
    );
    rotationTrsf.SetRotation_1(axis, (cut.rotation * Math.PI) / 180);
  }

  // 4. Translation finale vers la position
  const finalTranslationTrsf = new oc.gp_Trsf_1!();
  const zPosition = panelThickness + EPSILON_CUT - (cutDepth + 2 * EPSILON_CUT);
  finalTranslationTrsf.SetTranslation_1(
    new oc.gp_Vec_4!(cut.positionX, cut.positionY, zPosition)
  );

  // Préparer la forme de base transformée (centrée + tournée)
  const baseTrsf = new oc.gp_Trsf_1!();
  baseTrsf.Multiply(rotationTrsf);
  baseTrsf.Multiply(centeringTrsf);

  const baseShape = new oc.BRepBuilderAPI_Transform_2!(
    cutBox,
    baseTrsf,
    false
  ).Shape();

  // Gestion des répétitions
  const repX = cut.repetitionX || 0;
  const repY = cut.repetitionY || 0;
  const spaceX = cut.spacingX || 100;
  const spaceY = cut.spacingY || 100;

  // Si aucune répétition, on retourne la forme positionnée directement
  if (repX === 0 && repY === 0) {
    const transform = new oc.BRepBuilderAPI_Transform_2!(
      baseShape,
      finalTranslationTrsf,
      false
    );
    return transform.Shape();
  }

  // Création d'un Compound pour regrouper toutes les instances
  const builder = new oc.BRep_Builder!();
  const compound = new oc.TopoDS_Compound!();
  builder.MakeCompound(compound);

  for (let i = 0; i <= repX; i++) {
    for (let j = 0; j <= repY; j++) {
      const offsetX = i * spaceX;
      const offsetY = j * spaceY;

      const translationTrsf = new oc.gp_Trsf_1!();
      translationTrsf.SetTranslation_1(
        new oc.gp_Vec_4!(
          cut.positionX + offsetX,
          cut.positionY + offsetY,
          zPosition
        )
      );

      const positionedShape = new oc.BRepBuilderAPI_Transform_2!(
        baseShape,
        translationTrsf,
        true // Copy
      ).Shape();

      builder.Add(compound, positionedShape);
    }
  }

  return compound;
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

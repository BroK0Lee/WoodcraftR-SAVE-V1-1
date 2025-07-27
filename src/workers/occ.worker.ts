// --- IMPORTS ---
import * as Comlink from "comlink";
import openCascadeFactory from "opencascade.js/dist/opencascade.full.js";
import wasmURL from "opencascade.js/dist/opencascade.full.wasm?url";
import { shapeToGeometry } from "../helpers/shapeToGeometry";
import shapeToUrl from "../helpers/shapeToUrl"; // doit etre "pur JS" !
import type { 
  OccWorkerAPI, 
  CuttingInfo, 
  CutValidationResult, 
  PanelWithCutsConfig 
} from "./worker.types";
import type { PanelDimensions } from "@/models/Panel";
import type { EdgeDTO } from "@/models/EdgeDTO";
import type { Cut, RectangularCut, CircularCut } from "@/models/Cut";
import { EPSILON_CUT } from "@/models/Cut";
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

// ===== NOUVELLES FONCTIONS DE DÉCOUPE =====

/**
 * Crée une forme de découpe rectangulaire positionnée
 */
function createRectangularCut(cut: RectangularCut, panelThickness: number): any {
  if (!oc) throw new Error("OpenCascade not ready");
  
  // Utiliser la profondeur spécifiée ou l'épaisseur du panneau si traversante
  const cutDepth = cut.depth || panelThickness;
  
  // Créer la boîte de découpe avec un epsilon pour éviter le Z-fighting
  const cutBox = new oc.BRepPrimAPI_MakeBox_2(
    cut.length, 
    cut.width, 
    cutDepth + (2 * EPSILON_CUT)
  ).Shape();
  
  // Créer la transformation pour positionner la découpe
  const translation = new oc.gp_Trsf_1();
  
  // Position relative au coin inférieur gauche du panneau
  // Découpe depuis la face avant (Z=thickness) vers les Z négatifs
  // La découpe doit commencer à Z = panelThickness + EPSILON_CUT et aller vers le bas
  const zPosition = panelThickness + EPSILON_CUT - (cutDepth + (2 * EPSILON_CUT));
  
  console.log(`🔧 [RectangularCut] Debug positioning:`, {
    cutDepth,
    panelThickness,
    EPSILON_CUT,
    zPosition,
    positionX: cut.positionX,
    positionY: cut.positionY
  });
  
  translation.SetTranslation_1(new oc.gp_Vec_4(
    cut.positionX, 
    cut.positionY, 
    zPosition
  ));
  
  // Appliquer la transformation
  const transform = new oc.BRepBuilderAPI_Transform_2(cutBox, translation, false);
  
  return transform.Shape();
}

/**
 * Crée une forme de découpe circulaire positionnée
 */
function createCircularCut(cut: CircularCut, panelThickness: number): any {
  if (!oc) throw new Error("OpenCascade not ready");
  
  // Utiliser la profondeur spécifiée ou l'épaisseur du panneau si traversante
  const cutDepth = cut.depth || panelThickness;
  
  // Créer le cylindre de découpe avec un epsilon pour éviter le Z-fighting
  // Le cylindre est créé avec l'axe Z par défaut et l'origine au centre
  const cylinder = new oc.BRepPrimAPI_MakeCylinder_2(
    cut.radius, 
    cutDepth + (2 * EPSILON_CUT),
    2 * Math.PI // angle complet
  ).Shape();
  
  // Créer la transformation pour positionner la découpe
  const translation = new oc.gp_Trsf_1();
  
  // Position relative au coin inférieur gauche du panneau
  // Découpe depuis la face avant (Z=thickness) vers les Z négatifs
  // La découpe doit commencer à Z = panelThickness + EPSILON_CUT et aller vers le bas
  const zPosition = panelThickness + EPSILON_CUT - (cutDepth + (2 * EPSILON_CUT));
  
  console.log(`🔧 [CircularCut] Debug positioning:`, {
    cutDepth,
    panelThickness,
    EPSILON_CUT,
    zPosition,
    positionX: cut.positionX,
    positionY: cut.positionY,
    radius: cut.radius
  });
  
  translation.SetTranslation_1(new oc.gp_Vec_4(
    cut.positionX, 
    cut.positionY, 
    zPosition
  ));
  
  // Appliquer la transformation
  const transform = new oc.BRepBuilderAPI_Transform_2(cylinder, translation, false);
  
  return transform.Shape();
}

/**
 * Applique toutes les découpes sur un panneau par soustraction séquentielle
 */
async function applyAllCuts(
  panel: any, 
  cuts: Cut[], 
  panelThickness: number
): Promise<{
  resultShape: any;
  cuttingInfo: CuttingInfo;
}> {
  if (!oc) throw new Error("OpenCascade not ready");
  
  let resultShape = panel;
  const failedCuts: string[] = [];
  let totalCutArea = 0;
  let totalCutVolume = 0;
  let rectangularCuts = 0;
  let circularCuts = 0;
  
  for (const cut of cuts) {
    try {
      // Créer la forme de découpe selon le type
      let cutShape: any;
      if (cut.type === 'rectangle') {
        cutShape = createRectangularCut(cut, panelThickness);
        rectangularCuts++;
        // Calculer l'aire et le volume pour rectangle
        totalCutArea += cut.length * cut.width;
        totalCutVolume += cut.length * cut.width * (cut.depth || panelThickness);
      } else {
        cutShape = createCircularCut(cut, panelThickness);
        circularCuts++;
        // Calculer l'aire et le volume pour cercle
        const area = Math.PI * cut.radius * cut.radius;
        totalCutArea += area;
        totalCutVolume += area * (cut.depth || panelThickness);
      }
      
      // Appliquer l'opération booléenne de soustraction
      const booleanOp = new oc.BRepAlgoAPI_Cut_3(
        resultShape, 
        cutShape, 
        new oc.Message_ProgressRange_1()
      );
      
      // Construire l'opération
      booleanOp.Build(new oc.Message_ProgressRange_1());
      
      // Vérifier si l'opération a réussi
      if (booleanOp.IsDone()) {
        resultShape = booleanOp.Shape();
      } else {
        failedCuts.push(cut.id);
        console.warn(`Échec de l'opération booléenne pour la découpe ${cut.id}`);
      }
      
    } catch (error) {
      failedCuts.push(cut.id);
      console.error(`Erreur lors de la création de la découpe ${cut.id}:`, error);
    }
  }
  
  const cuttingInfo: CuttingInfo = {
    totalCuts: cuts.length,
    rectangularCuts,
    circularCuts,
    totalCutArea,
    totalCutVolume,
    failedCuts
  };
  
  return { resultShape, cuttingInfo };
}

/**
 * Crée un panneau avec toutes les découpes appliquées
 */
async function createPanelWithCuts({ dimensions, cuts }: PanelWithCutsConfig): Promise<{
  geometry: import("@/helpers/shapeToGeometry").PanelGeometryDTO;
  edges: EdgeDTO[];
  url: string;
  cuttingInfo: CuttingInfo;
}> {
  if (!oc) throw new Error("OpenCascade not ready");
  
  // Créer le panneau de base
  const basePanel = new oc.BRepPrimAPI_MakeBox_2(
    dimensions.length, 
    dimensions.width, 
    dimensions.thickness
  ).Shape();
  
  // Appliquer toutes les découpes
  const { resultShape, cuttingInfo } = await applyAllCuts(basePanel, cuts, dimensions.thickness);
  
  // Générer la géométrie, les edges et l'URL
  const geometry = shapeToGeometry(oc, resultShape);
  const edges = getEdges(resultShape, 0.5);
  const url = shapeToUrl(oc, resultShape);
  
  return { geometry, edges, url, cuttingInfo };
}

/**
 * Valide la faisabilité géométrique d'une découpe
 */
async function validateCutFeasibility(
  panelDims: PanelDimensions,
  cut: Cut
): Promise<CutValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Vérifications communes
  if (cut.positionX < 0) {
    errors.push("La position X ne peut pas être négative");
  }
  if (cut.positionY < 0) {
    errors.push("La position Y ne peut pas être négative");
  }
  if (cut.depth < 0) {
    errors.push("La profondeur ne peut pas être négative");
  }
  if (cut.depth > panelDims.thickness) {
    warnings.push("La profondeur dépasse l'épaisseur du panneau");
  }
  
  // Vérifications spécifiques par type
  if (cut.type === 'rectangle') {
    // Vérifier que la découpe reste dans les limites du panneau
    if (cut.positionX + cut.length > panelDims.length) {
      errors.push("La découpe rectangulaire dépasse la longueur du panneau");
    }
    if (cut.positionY + cut.width > panelDims.width) {
      errors.push("La découpe rectangulaire dépasse la largeur du panneau");
    }
    if (cut.length <= 0) {
      errors.push("La longueur doit être positive");
    }
    if (cut.width <= 0) {
      errors.push("La largeur doit être positive");
    }
  } else if (cut.type === 'circle') {
    // Vérifier que le cercle reste dans les limites du panneau
    if (cut.positionX - cut.radius < 0 || cut.positionX + cut.radius > panelDims.length) {
      errors.push("La découpe circulaire dépasse la longueur du panneau");
    }
    if (cut.positionY - cut.radius < 0 || cut.positionY + cut.radius > panelDims.width) {
      errors.push("La découpe circulaire dépasse la largeur du panneau");
    }
    if (cut.radius <= 0) {
      errors.push("Le rayon doit être positif");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// --- EXPOSE API ---
Comlink.expose({ 
  init, 
  createBox, 
  getEdges,
  createPanelWithCuts,
  validateCutFeasibility,
  createRectangularCut,
  createCircularCut,
  applyAllCuts
} as OccWorkerAPI);

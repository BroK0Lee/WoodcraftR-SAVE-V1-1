import type { PanelGeometryDTO } from "@/helpers/shapeToGeometry";
import type { PanelDimensions } from "@/models/Panel";
import type { EdgeDTO } from "@/models/EdgeDTO";
import type { TopoDS_Shape } from "opencascade.js";

// Enum pour le typage du paramètre Poly_MeshPurpose (usage de la triangulation)
export enum Poly_MeshPurpose {
  NONE = 0,
  Calculation = 0x0001,
  Presentation = 0x0002,
  Active = 0x0004,
  Loaded = 0x0008,
  AnyFallback = 0x0009, // à vérifier selon le binding JS
  USER = 0x0020,
}

// Interface de l'API exposée par le worker OCC
export interface OccWorkerAPI {
  /**
   * Initialise OpenCascade dans le worker
   * @returns true si l'initialisation a réussi
   */
  init: () => Promise<boolean>;

  /**
   * Génère la géométrie, les edges et l'URL GLB d'un panneau OCC
   */
  createBox: (params: PanelDimensions) => Promise<{
    geometry: PanelGeometryDTO;
    edges: EdgeDTO[];
    url: string;
  }>;

  /**
   * Retourne les arêtes discrétisées d'une forme
   * @param shape forme TopoDS_Shape
   * @param tolerance tolérance de discrétisation
   * @returns tableau d'arêtes EdgeDTO
   */
  getEdges: (shape: TopoDS_Shape, tolerance: number) => EdgeDTO[];

  // (Supprimé) createBoxGeometry n'est plus exposé
}

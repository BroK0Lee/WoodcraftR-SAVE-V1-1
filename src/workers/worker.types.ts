import type { PanelDimensions } from "@/models/Panel";
import type { EdgeDTO } from "@/models/EdgeDTO";
import type { TopoDS_Shape } from "opencascade.js";

// Interface de l'API exposée par le worker OCC
export interface OccWorkerAPI {
  /**
   * Initialise OpenCascade dans le worker
   * @returns true si l'initialisation a réussi
   */
  init: () => Promise<boolean>;

  /**
   * Génère un panneau simple selon les dimensions fournies
   * @param params dimensions du panneau
   * @returns url du GLB et arêtes du panneau
   */
  createBox: (params: PanelDimensions) => Promise<{ url: string; edges: EdgeDTO[] }>;

  /**
   * Retourne les arêtes discrétisées d'une forme
   * @param shape forme TopoDS_Shape
   * @param tolerance tolérance de discrétisation
   * @returns tableau d'arêtes EdgeDTO
   */
  getEdges: (shape: TopoDS_Shape, tolerance: number) => EdgeDTO[];
}

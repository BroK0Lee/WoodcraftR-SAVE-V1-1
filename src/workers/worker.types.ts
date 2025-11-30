import type { PanelGeometryDTO } from "@/workers/api/shapeToGeometry";
import type { PanelDimensions } from "@/models/Panel";
import type { EdgeDTO } from "@/models/EdgeDTO";
import type { Cut, RectangularCut, CircularCut } from "@/models/Cut";
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

// ===== NOUVEAUX TYPES POUR LES DÉCOUPES =====

/** Informations sur les découpes appliquées */
export interface CuttingInfo {
  /** Nombre total de découpes appliquées */
  totalCuts: number;
  /** Nombre de découpes rectangulaires */
  rectangularCuts: number;
  /** Nombre de découpes circulaires */
  circularCuts: number;
  /** Surface totale découpée (mm²) */
  totalCutArea: number;
  /** Volume total découpé (mm³) */
  totalCutVolume: number;
  /** Découpes qui ont échoué lors de l'opération booléenne */
  failedCuts: string[];
}

/** Résultat de validation d'une découpe */
export interface CutValidationResult {
  /** La découpe est-elle valide ? */
  isValid: boolean;
  /** Messages d'erreur si invalide */
  errors: string[];
  /** Avertissements non bloquants */
  warnings: string[];
}

/** Configuration pour créer un panneau avec découpes */
export interface PanelWithCutsConfig {
  /** Dimensions du panneau */
  dimensions: PanelDimensions;
  /** Liste des découpes à appliquer */
  cuts: Cut[];
  /** Forme du panneau (défaut: rectangle) */
  shape?: "rectangle" | "circle";
  /** Diamètre du panneau si forme circulaire (en mm) */
  circleDiameter?: number;
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

  // ===== NOUVELLES FONCTIONS POUR LES DÉCOUPES =====

  /**
   * Crée un panneau avec toutes les découpes appliquées
   * @param config Configuration avec dimensions et découpes
   * @returns Géométrie, edges, URL GLB et informations de découpe
   */
  createPanelWithCuts: (config: PanelWithCutsConfig) => Promise<{
    geometry: PanelGeometryDTO;
    edges: EdgeDTO[];
    url: string;
    cuttingInfo: CuttingInfo;
  }>;

  /**
   * Valide la faisabilité géométrique d'une découpe
   * @param panelDims Dimensions du panneau
   * @param cut Découpe à valider
   * @returns Résultat de validation
   */
  validateCutFeasibility: (
    panelDims: PanelDimensions,
    cut: Cut
  ) => Promise<CutValidationResult>;

  /**
   * Crée une forme de découpe rectangulaire positionnée
   * @param cut Découpe rectangulaire
   * @param panelThickness Épaisseur du panneau (pour la profondeur par défaut)
   * @returns Forme TopoDS_Shape de la découpe
   */
  createRectangularCut: (
    cut: RectangularCut,
    panelThickness: number
  ) => TopoDS_Shape;

  /**
   * Crée une forme de découpe circulaire positionnée
   * @param cut Découpe circulaire
   * @param panelThickness Épaisseur du panneau (pour la profondeur par défaut)
   * @returns Forme TopoDS_Shape de la découpe
   */
  createCircularCut: (cut: CircularCut, panelThickness: number) => TopoDS_Shape;

  /**
   * Applique toutes les découpes sur un panneau par soustraction séquentielle
   * @param panel Forme du panneau
   * @param cuts Liste des découpes à appliquer
   * @param panelThickness Épaisseur du panneau
   * @returns Forme résultante et informations de découpe
   */
  applyAllCuts: (
    panel: TopoDS_Shape,
    cuts: Cut[],
    panelThickness: number
  ) => Promise<{
    resultShape: TopoDS_Shape;
    cuttingInfo: CuttingInfo;
  }>;
}

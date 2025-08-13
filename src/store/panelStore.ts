import { create } from "zustand";
import {
  PANEL_LIMITS,
  DEFAULT_DIMENSIONS,
  type PanelDimensions,
  CIRCLE_LIMITS,
} from "@/models/Panel";
import {
  type Cut,
  type CutValidationResult,
  type CutOverlapInfo,
  createDefaultCut,
  updateCutTimestamp,
} from "@/models/Cut";
import { clamp } from "@/lib/utils";
import type { PanelGeometryDTO } from "@/workers/api/shapeToGeometry";
import type { EdgeDTO } from "@/models/EdgeDTO";

/** Store Zustand pour la gestion globale du panneau */
export interface PanelStore {
  // === DIMENSIONS DU PANNEAU ===
  dimensions: PanelDimensions;
  setLength: (length: number) => void;
  setWidth: (width: number) => void;
  setThickness: (thickness: number) => void;
  setDimensions: (dims: PanelDimensions) => void;
  resetDimensions: () => void;

  // === FORME DU PANNEAU ===
  shape: "rectangle" | "circle";
  setShape: (shape: "rectangle" | "circle") => void;

  // === CHAMPS UI LIÉS À LA FORME ===
  // Pour "circle", on manipule un diamètre côté UI. Le store garde dimensions.thickness, et length/width sont ignorés.
  circleDiameter: number; // mm
  setCircleDiameter: (diameter: number) => void;

  // === GÉOMÉTRIE ET ARÊTES ===
  geometry: PanelGeometryDTO | null;
  edges: EdgeDTO[];
  isCalculating: boolean;
  setGeometry: (geometry: PanelGeometryDTO | null) => void;
  setEdges: (edges: EdgeDTO[]) => void;
  setCalculating: (calculating: boolean) => void;

  // === GESTION DES DÉCOUPES ===
  cuts: Cut[];
  editingCutId: string | null;

  // Actions pour les découpes
  addCut: (cut: Cut) => void;
  updateCut: (id: string, updatedCut: Partial<Cut>) => void;
  removeCut: (id: string) => void;
  clearCuts: () => void;
  duplicateCut: (id: string) => void;

  // Gestion du mode édition
  startEditingCut: (id: string) => void;
  stopEditingCut: () => void;

  // === PRÉVISUALISATION DÉCOUPE ===
  previewCut: Cut | null; // Découpe en cours de configuration
  isPreviewMode: boolean; // Mode prévisualisation actif

  // === DEBUG & VISIBILITÉ ===
  isPanelVisible: boolean; // Visibilité du mesh du panneau (pour debug)

  // Actions de prévisualisation
  setPreviewCut: (cut: Cut | null) => void;
  updatePreviewCut: (updatedCut: Partial<Cut>) => void;
  enablePreview: () => void;
  disablePreview: () => void;

  // Actions de visibilité
  togglePanelVisibility: () => void;
  setPanelVisibility: (visible: boolean) => void;

  // Validation et utilitaires
  validateCutPosition: (cut: Cut) => CutValidationResult;
  getCutsOverlap: () => CutOverlapInfo[];
  getCutById: (id: string) => Cut | undefined;
  getCutsByType: (type: Cut["type"]) => Cut[];
}

export const usePanelStore = create<PanelStore>((set, get) => ({
  // === ÉTAT INITIAL ===
  dimensions: DEFAULT_DIMENSIONS,
  shape: "rectangle",
  circleDiameter: 300, // valeur UI par défaut pour circulaire
  cuts: [],
  editingCutId: null,
  previewCut: null,
  isPreviewMode: false,
  isPanelVisible: true, // Panneau visible par défaut

  // === GÉOMÉTRIE ET ARÊTES ===
  geometry: null,
  edges: [],
  isCalculating: false,

  // === ACTIONS DIMENSIONS ===
  setLength: (length: number) =>
    set((state) => ({
      dimensions: {
        ...state.dimensions,
        length: clamp(length, PANEL_LIMITS.length.min, PANEL_LIMITS.length.max),
      },
    })),
  setWidth: (width: number) =>
    set((state) => ({
      dimensions: {
        ...state.dimensions,
        width: clamp(width, PANEL_LIMITS.width.min, PANEL_LIMITS.width.max),
      },
    })),
  setThickness: (thickness: number) =>
    set((state) => ({
      dimensions: {
        ...state.dimensions,
        thickness: clamp(
          thickness,
          PANEL_LIMITS.thickness.min,
          PANEL_LIMITS.thickness.max
        ),
      },
    })),

  // === ACTIONS FORME ===
  setShape: (shape: "rectangle" | "circle") => set({ shape }),

  // === ACTIONS SPÉCIFIQUES CERCLE ===
  setCircleDiameter: (diameter: number) =>
    set(() => ({
      circleDiameter: clamp(
        diameter,
        CIRCLE_LIMITS.diameter.min,
        CIRCLE_LIMITS.diameter.max
      ),
    })),

  // === ACTIONS GÉOMÉTRIE ===
  setGeometry: (geometry: PanelGeometryDTO | null) => set({ geometry }),
  setEdges: (edges: EdgeDTO[]) => set({ edges }),
  setCalculating: (isCalculating: boolean) => set({ isCalculating }),
  setDimensions: (dims: PanelDimensions) =>
    set({
      dimensions: {
        length: clamp(
          dims.length,
          PANEL_LIMITS.length.min,
          PANEL_LIMITS.length.max
        ),
        width: clamp(
          dims.width,
          PANEL_LIMITS.width.min,
          PANEL_LIMITS.width.max
        ),
        thickness: clamp(
          dims.thickness,
          PANEL_LIMITS.thickness.min,
          PANEL_LIMITS.thickness.max
        ),
      },
    }),
  resetDimensions: () => set({ dimensions: DEFAULT_DIMENSIONS }),

  // === ACTIONS DÉCOUPES ===
  addCut: (cut: Cut) =>
    set((state) => ({
      cuts: [...state.cuts, cut],
    })),

  updateCut: (id: string, updatedCut: Partial<Cut>) =>
    set((state) => ({
      cuts: state.cuts.map((cut) =>
        cut.id === id
          ? updateCutTimestamp({ ...cut, ...updatedCut } as Cut)
          : cut
      ),
    })),

  removeCut: (id: string) =>
    set((state) => ({
      cuts: state.cuts.filter((cut) => cut.id !== id),
      editingCutId: state.editingCutId === id ? null : state.editingCutId,
    })),

  clearCuts: () =>
    set({
      cuts: [],
      editingCutId: null,
    }),

  duplicateCut: (id: string) =>
    set((state) => {
      const cutToDuplicate = state.cuts.find((cut) => cut.id === id);
      if (!cutToDuplicate) return state;

      const meta = createDefaultCut(cutToDuplicate.type, state.cuts.length);
      const newCut: Cut = {
        ...cutToDuplicate,
        id: meta.id,
        name: meta.name,
        createdAt: meta.createdAt,
        updatedAt: meta.updatedAt,
        positionX: cutToDuplicate.positionX + 20,
        positionY: cutToDuplicate.positionY + 20,
      };

      return {
        cuts: [...state.cuts, newCut],
      };
    }),

  // === GESTION MODE ÉDITION ===
  startEditingCut: (id: string) => set({ editingCutId: id }),

  stopEditingCut: () => set({ editingCutId: null }),

  // === ACTIONS PRÉVISUALISATION ===
  setPreviewCut: (cut: Cut | null) => set({ previewCut: cut }),

  updatePreviewCut: (updatedCut: Partial<Cut>) =>
    set((state) => ({
      previewCut: state.previewCut
        ? updateCutTimestamp({ ...state.previewCut, ...updatedCut } as Cut)
        : null,
    })),

  enablePreview: () => set({ isPreviewMode: true }),

  disablePreview: () =>
    set({
      isPreviewMode: false,
      previewCut: null,
    }),

  // === ACTIONS VISIBILITÉ ===
  togglePanelVisibility: () =>
    set((state) => ({ isPanelVisible: !state.isPanelVisible })),

  setPanelVisibility: (visible: boolean) => set({ isPanelVisible: visible }),

  // === MÉTHODES UTILITAIRES ===
  getCutById: (id: string) => {
    const state = get();
    return state.cuts.find((cut) => cut.id === id);
  },

  getCutsByType: (type: Cut["type"]) => {
    const state = get();
    return state.cuts.filter((cut) => cut.type === type);
  },

  // === VALIDATION ===
  validateCutPosition: (cut: Cut): CutValidationResult => {
    const state = get();
    const { dimensions, shape, circleDiameter } = state;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérification des limites du panneau
    if (cut.positionX < 0) {
      errors.push("La position X ne peut pas être négative");
    }
    if (cut.positionY < 0) {
      errors.push("La position Y ne peut pas être négative");
    }

    // Vérification selon le type de découpe
    if (cut.type === "rectangle") {
      const halfL = cut.length / 2;
      const halfW = cut.width / 2;
      if (shape === "circle" && circleDiameter > 0) {
        const rPanel = circleDiameter / 2;
        const cx = rPanel;
        const cy = rPanel;
        const corners: Array<[number, number]> = [
          [cut.positionX - halfL, cut.positionY - halfW],
          [cut.positionX + halfL, cut.positionY - halfW],
          [cut.positionX - halfL, cut.positionY + halfW],
          [cut.positionX + halfL, cut.positionY + halfW],
        ];
        const anyOutside = corners.some(
          ([x, y]) => Math.hypot(x - cx, y - cy) > rPanel
        );
        if (anyOutside) {
          errors.push(
            "La découpe rectangulaire dépasse le bord du panneau circulaire"
          );
        }
      } else {
        if (
          cut.positionX - halfL < 0 ||
          cut.positionX + halfL > dimensions.length
        ) {
          errors.push("La découpe dépasse la longueur du panneau");
        }
        if (
          cut.positionY - halfW < 0 ||
          cut.positionY + halfW > dimensions.width
        ) {
          errors.push("La découpe dépasse la largeur du panneau");
        }
      }
    } else if (cut.type === "circle") {
      // Pour panneau circulaire, contraindre à l'intérieur du disque
      if (shape === "circle" && circleDiameter > 0) {
        const rPanel = circleDiameter / 2;
        const distCenter = Math.hypot(
          cut.positionX - rPanel,
          cut.positionY - rPanel
        );
        if (distCenter + cut.radius > rPanel) {
          errors.push("Le cercle dépasse le bord du panneau circulaire");
        }
      } else {
        if (
          cut.positionX - cut.radius < 0 ||
          cut.positionX + cut.radius > dimensions.length
        ) {
          errors.push("Le cercle dépasse la longueur du panneau");
        }
        if (
          cut.positionY - cut.radius < 0 ||
          cut.positionY + cut.radius > dimensions.width
        ) {
          errors.push("Le cercle dépasse la largeur du panneau");
        }
      }
    }

    // Vérification de la profondeur
    if (cut.depth > 0 && cut.depth >= dimensions.thickness) {
      warnings.push(
        "La profondeur de découpe est proche de l'épaisseur du panneau"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  getCutsOverlap: (): CutOverlapInfo[] => {
    const state = get();
    const overlaps: CutOverlapInfo[] = [];

    // Vérification simple de chevauchement (à améliorer avec calculs géométriques précis)
    for (let i = 0; i < state.cuts.length; i++) {
      for (let j = i + 1; j < state.cuts.length; j++) {
        const cut1 = state.cuts[i];
        const cut2 = state.cuts[j];

        // Calcul basique de chevauchement (à améliorer selon les formes)
        const hasOverlap = checkBasicOverlap(cut1, cut2);

        if (hasOverlap) {
          overlaps.push({
            cutId1: cut1.id,
            cutId2: cut2.id,
            overlapArea: 0, // À calculer précisément
            severity: "minor", // À déterminer selon l'ampleur
          });
        }
      }
    }

    return overlaps;
  },
}));

// === FONCTIONS UTILITAIRES PRIVÉES ===

/**
 * Vérification basique de chevauchement entre deux découpes
 * (Version simplifiée - à améliorer avec calculs géométriques précis)
 */
function checkBasicOverlap(cut1: Cut, cut2: Cut): boolean {
  // Pour l'instant, vérification basique de distance entre centres
  const distance = Math.sqrt(
    Math.pow(cut2.positionX - cut1.positionX, 2) +
      Math.pow(cut2.positionY - cut1.positionY, 2)
  );

  // Seuil arbitraire - à améliorer selon les dimensions réelles
  const minDistance = 20; // 20mm
  return distance < minDistance;
}

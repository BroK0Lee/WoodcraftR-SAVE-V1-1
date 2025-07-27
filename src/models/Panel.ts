export interface PanelDimensions {
  length: number;
  width: number;
  thickness: number;
}

// Limites autorisées pour les dimensions du panneau (en centimètres)
export const PANEL_LIMITS = {
  length: { min: 10, max: 3000 },
  width: { min: 10, max: 1250 },
  thickness: { min: 1, max: 20 },
} as const;

// Dimensions par défaut du panneau lors de l'initialisation
export const DEFAULT_DIMENSIONS: PanelDimensions = {
  length: 1500,
  width: 500,
  thickness: 10,
};

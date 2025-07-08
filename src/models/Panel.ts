export interface PanelDimensions {
  width: number;
  height: number;
  thickness: number;
}

// Limites autorisées pour les dimensions du panneau (en centimètres)
export const PANEL_LIMITS = {
  width: { min: 10, max: 3000 },
  height: { min: 10, max: 1250 },
  thickness: { min: 1, max: 20 },
} as const;

// Dimensions par défaut du panneau lors de l'initialisation
export const DEFAULT_DIMENSIONS: PanelDimensions = {
  width: 1500,
  height: 500,
  thickness: 10,
};

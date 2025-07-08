export interface CutBox {
  width: number;
  height: number;
  thickness: number;
}

// Limites autorisées pour les dimensions de la découpe (en millimètres)
export const BOX_LIMITS = {
  width: { min: 5, max: 3000 },
  height: { min: 5, max: 1250 },
  thickness: { min: 0.5, max: 20 },
} as const;

// Dimensions par défaut du panneau lors de l'initialisation
export const DEFAULT_DIMENSIONS: CutBox = {
  width: 200,
  height: 200,
  thickness: 10,
};

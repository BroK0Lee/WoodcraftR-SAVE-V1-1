export interface CutCylinder {
  radius: number;
  height: number;
}

// Limites autorisées pour les dimensions du cylindre (en millimètres)
export const CYLINDER_LIMITS = {
  radius: { min: 1, max: 3000 },
  height: { min: 1, max: 20 },
} as const;

// Dimensions par défaut du cylindre lors de l'initialisation
export const DEFAULT_CYLINDER: CutCylinder = {
  radius: 50,
  height: 10,
};
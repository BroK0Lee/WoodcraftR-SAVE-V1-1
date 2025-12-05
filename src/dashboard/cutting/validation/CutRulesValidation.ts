import { RectangularCut, CircularCut } from "@/models/Cut";
import { getCircularGridMinSpacing } from "@/dashboard/cutting/components/gridrepetition";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  minSpacingX: number;
  minSpacingY: number;
}

/**
 * Calcule les dimensions projetées d'un rectangle après rotation
 * @param length Longueur du rectangle
 * @param width Largeur du rectangle
 * @param rotationDeg Angle de rotation en degrés
 */
export function calculateProjectedDimensions(
  length: number,
  width: number,
  rotationDeg: number
): { projWidth: number; projHeight: number } {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  const projWidth = length * cos + width * sin;
  const projHeight = length * sin + width * cos;

  return { projWidth, projHeight };
}

/**
 * Valide les contraintes d'une découpe rectangulaire, notamment les répétitions
 */
export function validateRectangularCut(cut: Partial<RectangularCut>): ValidationResult {
  const errors: string[] = [];
  // Ld (longueur selon X) correspond à `length`
  // ld (largeur selon Y) correspond à `width`
  const length = cut.length || 0; // Ld
  const width = cut.width || 0; // ld
  // alias explicites pour la lecture de la formule (Ld, ld)
  const Ld = length;
  const ld = width;
  const rotation = (cut.rotation || 0) % 360;
  const repX = cut.repetitionX || 0;
  const spacingX = cut.spacingX || 0;
  const repY = cut.repetitionY || 0;
  const spacingY = cut.spacingY || 0;
  // Calcul selon logique de "nesting" décrit :
  // On veut conserver une clearance minimale (bandeau) entre faces parallèles de 1mm
  const SAFETY_MARGIN_MM = 1.0;

  // Normaliser l'angle sur [0,180) car la géométrie se répète tous les 180°
  const theta = ((rotation % 180) + 180) % 180; // 0..180
  const rad = (theta * Math.PI) / 180;
  const absCos = Math.abs(Math.cos(rad));
  const absSin = Math.abs(Math.sin(rad));

  let minSpacingX: number;
  let minSpacingY: number;

  // Règles par plages d'angle (Votre définition : Ld->length, ld->width)
  // X-axis spacing (répétition horizontale)
  if (Math.abs(theta - 0) < 1e-6 || Math.abs(theta - 180) < 1e-6) {
    minSpacingX = length + SAFETY_MARGIN_MM;
  } else if (Math.abs(theta - 90) < 1e-6) {
    minSpacingX = width + SAFETY_MARGIN_MM;
  } else if ((theta > 0 && theta < 45) || (theta > 135 && theta < 180)) {
    // faces longueur contraignantes
    minSpacingX = (length + SAFETY_MARGIN_MM) / (absCos || 1e-6);
  } else {
    // 45 <= theta <= 135 -> faces largeur contraignantes
    minSpacingX = (width + SAFETY_MARGIN_MM) / (absSin || 1e-6);
  }

  // Y-axis spacing (répétition verticale) - logique inverse
  if (Math.abs(theta - 0) < 1e-6 || Math.abs(theta - 180) < 1e-6) {
    // θ = 0 or 180 : faces horizontales alignées -> Lymin = ld + margin
    minSpacingY = ld + SAFETY_MARGIN_MM;
  } else if (Math.abs(theta - 90) < 1e-6) {
    // θ = 90 : rectangle debout -> Lymin = Ld + margin
    minSpacingY = Ld + SAFETY_MARGIN_MM;
  } else if ((theta > 0 && theta < 45) || (theta > 135 && theta < 180)) {
    // 0 < θ < 45 or 135 < θ < 180 : use (ld + margin) / |cos(theta)|
    minSpacingY = (ld + SAFETY_MARGIN_MM) / (absCos || 1e-6);
  } else {
    // 45 <= θ <= 135 : use (Ld + margin) / |sin(theta)|
    minSpacingY = (Ld + SAFETY_MARGIN_MM) / (absSin || 1e-6);
  }

  // Arrondir
  const minSpacingXRounded = Number(minSpacingX.toFixed(2));
  const minSpacingYRounded = Number(minSpacingY.toFixed(2));

  if (repX > 0 && spacingX < minSpacingXRounded - 1e-2) {
    errors.push(`L'entraxe X doit être au minimum de ${minSpacingXRounded}mm (clearance ${SAFETY_MARGIN_MM}mm).`);
  }

  if (repY > 0 && spacingY < minSpacingYRounded - 1e-2) {
    errors.push(`L'entraxe Y doit être au minimum de ${minSpacingYRounded}mm (clearance ${SAFETY_MARGIN_MM}mm).`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    minSpacingX,
    minSpacingY
  };
}

/**
 * Valide les contraintes pour une découpe circulaire en répétition grille
 * Règle : entraxe min (X et Y) = diameter/2 + SAFETY_MARGIN_MM
 */
export function validateCircularCut(
  cut: Partial<CircularCut & { repetitionX?: number; spacingX?: number; repetitionY?: number; spacingY?: number }>
): ValidationResult {
  const errors: string[] = [];
  const radius = cut.radius || 0;
  const diameter = radius * 2;

  // Use helper to compute min spacing
  const { minSpacingX, minSpacingY } = getCircularGridMinSpacing(diameter, 1.0);

  const repX = cut.repetitionX || 0;
  const spacingX = cut.spacingX || 0;
  const repY = cut.repetitionY || 0;
  const spacingY = cut.spacingY || 0;

  if (repX > 0 && spacingX < minSpacingX - 1e-2) {
    errors.push(`L'entraxe X doit être au minimum de ${minSpacingX}mm pour les découpes circulaires.`);
  }

  if (repY > 0 && spacingY < minSpacingY - 1e-2) {
    errors.push(`L'entraxe Y doit être au minimum de ${minSpacingY}mm pour les découpes circulaires.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    minSpacingX,
    minSpacingY,
  };
}

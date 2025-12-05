// Utilitaires pour la répétition en grille (calculs d'entraxe minimum)
// Fournit des fonctions réutilisables pour les découpes rectangulaires et circulaires

export interface GridMinSpacing {
  minSpacingX: number;
  minSpacingY: number;
}

/**
 * Pour une découpe circulaire :
 * - diameter : diamètre de la découpe (mm)
 * - marginMm : marge minimale entre découpes (mm)
 *
 * Formule demandée : Lmini = diameter + margin
 * (cette valeur est retournée pour X et Y)
 */
export function getCircularGridMinSpacing(
  diameter: number,
  marginMm = 1
): GridMinSpacing {
  const min = Number((diameter + marginMm).toFixed(2));
  return { minSpacingX: min, minSpacingY: min };
}

export default { getCircularGridMinSpacing };

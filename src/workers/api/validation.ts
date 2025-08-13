// validation.ts
// Validation basique de faisabilité des découpes (approximation géométrique 2D).

export interface CutSpec {
  type: "rect" | "circle";
  width?: number; // rect
  height?: number; // rect
  radius?: number; // circle
  x: number; // position centre par rapport au centre panneau
  y: number;
}

export interface PanelSpec {
  width: number;
  height: number;
  minMargin?: number; // marge minimale entre bord panneau et découpe
  minHoleSpacing?: number; // espacement min entre centres de découpes
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateCutFeasibility(panel: PanelSpec, cuts: CutSpec[]): ValidationResult {
  const errors: string[] = [];
  const margin = panel.minMargin ?? 0;
  const spacing = panel.minHoleSpacing ?? 0;
  const halfPanelW = panel.width / 2;
  const halfPanelH = panel.height / 2;

  for (let i = 0; i < cuts.length; i += 1) {
    const c = cuts[i];
    if (c.type === "rect") {
      if (c.width == null || c.height == null) {
        errors.push(`Rect ${i} dimensions manquantes`);
        continue;
      }
      if (c.width <= 0 || c.height <= 0) errors.push(`Rect ${i} dimensions invalides`);
      const hw = c.width / 2;
      const hh = c.height / 2;
      if (Math.abs(c.x) + hw > halfPanelW - margin || Math.abs(c.y) + hh > halfPanelH - margin) {
        errors.push(`Rect ${i} hors panneau ou viole marge`);
      }
    } else if (c.type === "circle") {
      if (c.radius == null || c.radius <= 0) {
        errors.push(`Cercle ${i} rayon invalide`);
        continue;
      }
      if (Math.abs(c.x) + c.radius > halfPanelW - margin || Math.abs(c.y) + c.radius > halfPanelH - margin) {
        errors.push(`Cercle ${i} hors panneau ou viole marge`);
      }
    }
    // Spacing vs autres
    if (spacing > 0) {
      for (let j = i + 1; j < cuts.length; j += 1) {
        const c2 = cuts[j];
        const dx = c.x - c2.x;
        const dy = c.y - c2.y;
        const dist = Math.hypot(dx, dy);
        if (dist < spacing) errors.push(`Découpes ${i} et ${j} trop proches (dist=${dist.toFixed(2)} < ${spacing})`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

// Adaptation: validation d'une seule découpe (compat pour ancienne API worker)
export function validateSingleCut(panel: PanelSpec, cut: CutSpec): ValidationResult {
  return validateCutFeasibility(panel, [cut]);
}

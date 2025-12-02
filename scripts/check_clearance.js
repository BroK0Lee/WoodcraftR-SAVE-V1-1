// Petit script de vérification pour la formule de clearance
const L = 50; // Ld -> length
const W = 30; // ld -> width
const thetaDeg = 45; // angle
const E = 50; // entraxe
const MIN_CLEARANCE = 1.0;

function computeMinSpacing(L, W, thetaDeg) {
  // normaliser theta dans [0,180)
  let theta = ((thetaDeg % 180) + 180) % 180;
  const rad = (theta * Math.PI) / 180;
  const absCos = Math.abs(Math.cos(rad));
  const absSin = Math.abs(Math.sin(rad));

  let minSpacingX;
  // cas spéciaux
  if (Math.abs(theta) < 1e-9 || Math.abs(theta - 180) < 1e-9) {
    minSpacingX = L + MIN_CLEARANCE;
  } else if (Math.abs(theta - 90) < 1e-9) {
    minSpacingX = W + MIN_CLEARANCE;
  } else if ((theta > 0 && theta < 45) || (theta > 135 && theta < 180)) {
    minSpacingX = (L + MIN_CLEARANCE) / absCos;
  } else {
    minSpacingX = (W + MIN_CLEARANCE) / absSin;
  }

  return { minSpacingX, theta, rad, absCos, absSin };
}

function computeGap(E, L, W, thetaDeg) {
  const theta = ((thetaDeg % 180) + 180) % 180;
  const rad = (theta * Math.PI) / 180;
  // déterminer quelle face contraint : recompute min and compare
  const { minSpacingX, absCos, absSin } = computeMinSpacing(L, W, thetaDeg);

  // Si la contrainte vient de la largeur (branch using sin)
  const usesWidth = Math.abs(minSpacingX - (W + MIN_CLEARANCE) / (absSin || 1e-9)) < 1e-6 && absSin > 1e-9;
  const usesLength = Math.abs(minSpacingX - (L + MIN_CLEARANCE) / (absCos || 1e-9)) < 1e-6 && absCos > 1e-9;

  let gap;
  if (usesWidth) {
    // gap perpendiculaire to width faces = E * sin(theta) - W
    gap = E * Math.abs(Math.sin(rad)) - W;
  } else if (usesLength) {
    // gap perpendiculaire to length faces = E * cos(theta) - L
    gap = E * Math.abs(Math.cos(rad)) - L;
  } else {
    // fallback: use projected bounding box gap
    const projWidth = L * Math.abs(Math.cos(rad)) + W * Math.abs(Math.sin(rad));
    gap = E - projWidth;
  }

  return { gap };
}

const res = computeMinSpacing(L, W, thetaDeg);
const gapRes = computeGap(E, L, W, thetaDeg);

console.log('Inputs: L=', L, 'W=', W, 'theta=', thetaDeg, 'E=', E);
console.log('Computed minSpacingX =', res.minSpacingX.toFixed(2));
console.log('Components: absCos=', res.absCos.toFixed(4), 'absSin=', res.absSin.toFixed(4));
console.log('Projected width (L*cos + W*sin)=', (L * res.absCos + W * res.absSin).toFixed(4));
console.log('Resulting perpendicular gap (approx) =', gapRes.gap.toFixed(2), 'mm');

// Also show whether current E respects min spacing
console.log('E >= minSpacingX ?', E >= res.minSpacingX ? 'yes' : 'NO');

/**
 * Modèles de données pour les découpes sur panneaux
 * Définit les interfaces et valeurs par défaut pour les différents types de découpes
 */

import { DEFAULT_DIMENSIONS } from './Panel';

// ===== INTERFACES DE BASE =====

/** Interface de base commune à tous les types de découpes */
export interface BaseCut {
  /** Identifiant unique de la découpe */
  id: string;
  /** Nom descriptif de la découpe */
  name: string;
  /** Position X sur le panneau (en mm, origine en bas-gauche) */
  positionX: number;
  /** Position Y sur le panneau (en mm, origine en bas-gauche) */
  positionY: number;
  /** Profondeur de la découpe (en mm, traversante) */
  depth: number;
  /** Timestamp de création */
  createdAt: number;
  /** Timestamp de dernière modification */
  updatedAt: number;
}

/** Découpe rectangulaire */
export interface RectangularCut extends BaseCut {
  type: 'rectangle';
  /** Longueur de la découpe rectangulaire (en mm) */
  length: number;
  /** Largeur de la découpe rectangulaire (en mm) */
  width: number;
}

/** Découpe circulaire */
export interface CircularCut extends BaseCut {
  type: 'circle';
  /** Rayon de la découpe circulaire (en mm) */
  radius: number;
}

/** Union de tous les types de découpes possibles */
export type Cut = RectangularCut | CircularCut;

// ===== LIMITES ET CONTRAINTES =====

/** Constante epsilon pour éviter le Z-fighting */
export const EPSILON_CUT = 0.1;

/** Limites pour les découpes rectangulaires (en mm) */
export const RECTANGULAR_CUT_LIMITS = {
  length: { min: 5, max: 2000 },
  width: { min: 5, max: 1000 },
  depth: { min: 0.5, max: 1000 }, // min 0.5mm, max = épaisseur panneau
  position: { min: 0 } // Position minimale (max dépend des dimensions du panneau)
} as const;

/** Limites pour les découpes circulaires (en mm) */
export const CIRCULAR_CUT_LIMITS = {
  radius: { min: 2.5, max: 500 },
  depth: { min: 0.5, max: 1000 }, // min 0.5mm, max = épaisseur panneau
  position: { min: 0 } // Position minimale (max dépend des dimensions du panneau)
} as const;

// ===== VALEURS PAR DÉFAUT =====

/** Valeurs par défaut pour une découpe rectangulaire */
export const DEFAULT_RECTANGULAR_CUT: Omit<RectangularCut, 'id' | 'name' | 'createdAt' | 'updatedAt'> = {
  type: 'rectangle',
  positionX: 100,
  positionY: 100,
  length: 50,
  width: 30,
  depth: DEFAULT_DIMENSIONS.thickness // Traversante par défaut = épaisseur du panneau
};

/** Valeurs par défaut pour une découpe circulaire */
export const DEFAULT_CIRCULAR_CUT: Omit<CircularCut, 'id' | 'name' | 'createdAt' | 'updatedAt'> = {
  type: 'circle',
  positionX: 100,
  positionY: 100,
  radius: 25,
  depth: DEFAULT_DIMENSIONS.thickness // Traversante par défaut = épaisseur du panneau
};

// ===== FONCTIONS UTILITAIRES =====

/**
 * Calcule la hauteur effective de la découpe pour la géométrie 3D
 * depth.cut = depth + (2 × epsilon.cut)
 */
export function calculateCutDepth(depth: number): number {
  return -(depth + (2 * EPSILON_CUT));
}

/**
 * Vérifie si une découpe est traversante
 * @param depth - Profondeur de la découpe
 * @param panelThickness - Épaisseur du panneau
 * @returns true si la découpe est traversante
 */
export function isCutThrough(depth: number, panelThickness: number): boolean {
  return depth >= panelThickness;
}

/**
 * Génère un identifiant unique pour une nouvelle découpe
 */
export function generateCutId(): string {
  return `cut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Génère un nom par défaut basé sur le type et un compteur
 */
export function generateCutName(type: Cut['type'], index: number): string {
  const typeNames = {
    rectangle: 'Rectangle',
    circle: 'Cercle'
  };
  return `${typeNames[type]} ${index + 1}`;
}

/**
 * Crée une nouvelle découpe rectangulaire avec les valeurs par défaut
 */
export function createDefaultRectangularCut(index: number = 0): RectangularCut {
  const now = Date.now();
  return {
    ...DEFAULT_RECTANGULAR_CUT,
    id: generateCutId(),
    name: generateCutName('rectangle', index),
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Crée une nouvelle découpe circulaire avec les valeurs par défaut
 */
export function createDefaultCircularCut(index: number = 0): CircularCut {
  const now = Date.now();
  return {
    ...DEFAULT_CIRCULAR_CUT,
    id: generateCutId(),
    name: generateCutName('circle', index),
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Factory function pour créer une découpe par défaut selon le type
 */
export function createDefaultCut(type: Cut['type'], index: number = 0): Cut {
  switch (type) {
    case 'rectangle':
      return createDefaultRectangularCut(index);
    case 'circle':
      return createDefaultCircularCut(index);
    default:
      throw new Error(`Type de découpe non supporté: ${type}`);
  }
}

/**
 * Met à jour le timestamp de modification d'une découpe
 */
export function updateCutTimestamp<T extends Cut>(cut: T): T {
  return {
    ...cut,
    updatedAt: Date.now()
  };
}

// ===== TYPES POUR LA VALIDATION =====

/** Résultat de validation d'une découpe */
export interface CutValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/** Information sur un chevauchement entre découpes */
export interface CutOverlapInfo {
  cutId1: string;
  cutId2: string;
  overlapArea: number; // En mm²
  severity: 'minor' | 'major' | 'critical';
}

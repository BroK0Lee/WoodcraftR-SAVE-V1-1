import { create } from 'zustand';
import {
  PANEL_LIMITS,
  DEFAULT_DIMENSIONS,
  type PanelDimensions,
} from '@/models/Panel';
import { clamp } from '@/lib/utils';

/** Store Zustand pour la gestion globale du panneau */
export interface PanelStore {
  dimensions: PanelDimensions;
  setLength: (length: number) => void;
  setWidth: (width: number) => void;
  setThickness: (thickness: number) => void;
  setDimensions: (dims: PanelDimensions) => void;
  resetDimensions: () => void;
}

export const usePanelStore = create<PanelStore>((set) => ({
  dimensions: DEFAULT_DIMENSIONS,
  setLength: (length) =>
    set((state) => ({
      dimensions: {
        ...state.dimensions,
        length: clamp(length, PANEL_LIMITS.length.min, PANEL_LIMITS.length.max),
      },
    })),
  setWidth: (width) =>
    set((state) => ({
      dimensions: {
        ...state.dimensions,
        width: clamp(width, PANEL_LIMITS.width.min, PANEL_LIMITS.width.max),
      },
    })),
  setThickness: (thickness) =>
    set((state) => ({
      dimensions: {
        ...state.dimensions,
        thickness: clamp(
          thickness,
          PANEL_LIMITS.thickness.min,
          PANEL_LIMITS.thickness.max,
        ),
      },
    })),
  setDimensions: (dims) =>
    set({
      dimensions: {
        length: clamp(dims.length, PANEL_LIMITS.length.min, PANEL_LIMITS.length.max),
        width: clamp(
          dims.width,
          PANEL_LIMITS.width.min,
          PANEL_LIMITS.width.max,
        ),
        thickness: clamp(
          dims.thickness,
          PANEL_LIMITS.thickness.min,
          PANEL_LIMITS.thickness.max,
        ),
      },
    }),
  resetDimensions: () => set({ dimensions: DEFAULT_DIMENSIONS }),
}));

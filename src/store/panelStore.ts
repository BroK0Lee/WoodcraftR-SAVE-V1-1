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
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setThickness: (thickness: number) => void;
  setDimensions: (dims: PanelDimensions) => void;
  resetDimensions: () => void;
}

export const usePanelStore = create<PanelStore>((set) => ({
  dimensions: DEFAULT_DIMENSIONS,
  setWidth: (width) =>
    set((state) => ({
      dimensions: {
        ...state.dimensions,
        width: clamp(width, PANEL_LIMITS.width.min, PANEL_LIMITS.width.max),
      },
    })),
  setHeight: (height) =>
    set((state) => ({
      dimensions: {
        ...state.dimensions,
        height: clamp(height, PANEL_LIMITS.height.min, PANEL_LIMITS.height.max),
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
        width: clamp(dims.width, PANEL_LIMITS.width.min, PANEL_LIMITS.width.max),
        height: clamp(
          dims.height,
          PANEL_LIMITS.height.min,
          PANEL_LIMITS.height.max,
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

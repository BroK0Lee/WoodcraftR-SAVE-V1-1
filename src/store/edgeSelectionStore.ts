import { create } from 'zustand';

/** Zustand store for edge selection */
export interface EdgeSelectionStore {
  selectedEdgeId: number | null;
  setSelectedEdgeId: (id: number | null) => void;
  clearSelection: () => void;
}

export const useEdgeSelectionStore = create<EdgeSelectionStore>((set) => ({
  selectedEdgeId: null,
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
  clearSelection: () => set({ selectedEdgeId: null }),
}));

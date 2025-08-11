import { create } from "zustand";
import { usePanelStore } from "@/store/panelStore";

type TabType = "material" | "general" | "cutting" | "engraving" | "finishing";

interface DashboardStore {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeTab: "material",
  setActiveTab: (tab) => {
    // Si on QUITTE l'onglet "cutting", annuler toute prévisualisation/édition en cours
    const prev = useDashboardStore.getState().activeTab;
    if (prev === "cutting" && tab !== "cutting") {
      const panel = usePanelStore.getState();
      // Désactive le mode preview et efface la découpe de prévisualisation
      panel.disablePreview();
      // Stoppe l'édition en cours le cas échéant
      panel.stopEditingCut();
    }
    set({ activeTab: tab });
  },
}));

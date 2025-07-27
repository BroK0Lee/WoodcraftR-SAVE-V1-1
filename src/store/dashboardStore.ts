import { create } from 'zustand';

type TabType = 'material' | 'general' | 'cutting' | 'engraving' | 'finishing';

interface DashboardStore {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeTab: 'material',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

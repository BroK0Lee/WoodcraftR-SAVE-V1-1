import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sidebar } from './Sidebar';
import ContentViewer from "@/components/ContentViewer";
import { useDashboardStore } from '@/store/dashboardStore';
import Carousel3D from '@/components/materialselector/Carousel3D';

export function Dashboard() {
  const { activeTab } = useDashboardStore();
  // Affiche le Carousel 3D uniquement dans l'onglet "Matière"

  return (
    <div className="h-[calc(100vh-73px)] flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
          <Sidebar />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={75}>
          <div className="h-full flex flex-col">
            <div className="flex-1">
              {activeTab === 'material' ? (
                <Carousel3D />
              ) : (
                <ContentViewer />
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
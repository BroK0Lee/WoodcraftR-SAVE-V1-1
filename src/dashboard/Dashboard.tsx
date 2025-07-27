import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sidebar } from './Sidebar';
import ContentViewer from "@/components/ContentViewer";
import WoodMaterialSelector from "@/components/WoodMaterialSelector";
import { useDashboardStore } from '@/store/dashboardStore';

export function Dashboard() {
  const { activeTab } = useDashboardStore();

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
                <WoodMaterialSelector />
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
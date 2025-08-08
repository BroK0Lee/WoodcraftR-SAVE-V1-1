import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sidebar } from './Sidebar';
import ContentViewer from "@/components/ContentViewer";
import { useDashboardStore } from '@/store/dashboardStore';
import { useMaterialCarousel } from '@/components/materialselector/useMaterialCarousel';
import { getAllWoodMaterials } from '@/components/materialselector/woodMaterials-public';

export function Dashboard() {
  const { activeTab } = useDashboardStore();

  // Nouveau: hook selectorless
  const materials = getAllWoodMaterials();
  const carousel = useMaterialCarousel({
    materials,
    onMaterialSelect: (m) => console.log('🎯 [Dashboard] Matériau sélectionné:', m.name),
    useScrollControl: true,
    snapAfterScroll: true
  });

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
              {/* Conteneurs isolés pour éviter conflits WebGL */}
              <div 
                className="w-full h-full"
                style={{ 
                  display: activeTab === 'material' ? 'block' : 'none',
                  position: 'relative',
                  zIndex: activeTab === 'material' ? 1 : -1
                }}
              >
                {/* Hôte du carousel selectorless */}
                <div ref={carousel.hostRef} className="w-full h-full relative overflow-hidden" />
              </div>
              
              <div 
                className="w-full h-full"
                style={{ 
                  display: activeTab !== 'material' ? 'block' : 'none',
                  position: 'relative',
                  zIndex: activeTab !== 'material' ? 1 : -1
                }}
              >
                <ContentViewer />
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralPanel } from "./GeneralPanel";
import { CuttingPanel } from "./CuttingPanel";
import { EngravingPanel } from "./EngravingPanel";
import { FinishingPanel } from "./FinishingPanel";
import { MaterialPanel } from "./MaterialPanel";
import { useDashboardStore } from "@/store/dashboardStore";
import type { TabType } from "@/store/dashboardStore";
import type {} from "@/store/dashboardStore";
import { Ruler, Zap, Scissors, Settings, TreePine } from "lucide-react";

export function Sidebar() {
  const { activeTab, setActiveTab } = useDashboardStore();

  return (
    <div className="h-full bg-card border-r border-border shadow-xs">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Personnalisez votre panneau
        </p>
      </div>

      <ScrollArea className="h-[calc(100%-80px)]">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 gap-1 m-4">
            <TabsTrigger
              value="material"
              className="flex items-center gap-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <TreePine className="h-3 w-3" />
              Matière
            </TabsTrigger>
            <TabsTrigger
              value="general"
              className="flex items-center gap-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Ruler className="h-3 w-3" />
              Général
            </TabsTrigger>
            <TabsTrigger
              value="cutting"
              className="flex items-center gap-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Scissors className="h-3 w-3" />
              Découpes
            </TabsTrigger>
          </TabsList>

          <TabsList className="grid w-full grid-cols-2 gap-1 m-4 mt-2">
            <TabsTrigger
              value="engraving"
              className="flex items-center gap-2 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Zap className="h-4 w-4" />
              Gravure
            </TabsTrigger>
            <TabsTrigger
              value="finishing"
              className="flex items-center gap-2 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Settings className="h-4 w-4" />
              Finition
            </TabsTrigger>
          </TabsList>

          <div className="px-4 pb-4">
            <TabsContent value="material" className="mt-0">
              <MaterialPanel />
            </TabsContent>

            <TabsContent value="general" className="mt-0">
              <GeneralPanel />
            </TabsContent>

            <TabsContent value="cutting" className="mt-0">
              <CuttingPanel />
            </TabsContent>

            <TabsContent value="engraving" className="mt-0">
              <EngravingPanel />
            </TabsContent>

            <TabsContent value="finishing" className="mt-0">
              <FinishingPanel />
            </TabsContent>
          </div>
        </Tabs>
      </ScrollArea>
    </div>
  );
}

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralPanel } from './GeneralPanel';
import { CuttingPanel } from './CuttingPanel';
import { EngravingPanel } from './EngravingPanel';
import { FinishingPanel } from './FinishingPanel';
import { 
  Ruler, 
  Zap, 
  Scissors, 
  Settings 
} from 'lucide-react';

export function Sidebar() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="h-full bg-card/30 border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-foreground">Configuration</h2>
        <p className="text-sm text-muted-foreground">Personnalisez votre panneau</p>
      </div>

      <ScrollArea className="h-[calc(100%-80px)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-1 m-4">
            <TabsTrigger value="general" className="flex items-center gap-2 text-xs">
              <Ruler className="h-4 w-4" />
              Général
            </TabsTrigger>
            <TabsTrigger value="cutting" className="flex items-center gap-2 text-xs">
              <Scissors className="h-4 w-4" />
              Découpes
            </TabsTrigger>
          </TabsList>

          <TabsList className="grid w-full grid-cols-2 gap-1 m-4 mt-2">
            <TabsTrigger value="engraving" className="flex items-center gap-2 text-xs">
              <Zap className="h-4 w-4" />
              Gravure
            </TabsTrigger>
            <TabsTrigger value="finishing" className="flex items-center gap-2 text-xs">
              <Settings className="h-4 w-4" />
              Finition
            </TabsTrigger>
          </TabsList>

          <div className="px-4 pb-4">
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
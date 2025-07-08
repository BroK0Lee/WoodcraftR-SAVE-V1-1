import React from "react";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  Square,
  Circle,
  Triangle,
  Pentagon,
  Scissors,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';

interface Cut {
  id: number;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function CuttingPanel() {
  const [selectedTool, setSelectedTool] = useState('rectangle');
  const [cuts, setCuts] = useState<Cut[]>([]);

  const tools = [
    { id: 'rectangle', icon: Square, name: 'Rectangle' },
    { id: 'circle', icon: Circle, name: 'Cercle' },
    { id: 'triangle', icon: Triangle, name: 'Triangle' },
    { id: 'polygon', icon: Pentagon, name: 'Polygone' },
    { id: 'freehand', icon: Edit3, name: 'Libre' }
  ];

  const addCut = () => {
    const newCut = {
      id: Date.now(),
      type: selectedTool,
      name: `Découpe ${cuts.length + 1}`,
      x: 50,
      y: 50,
      width: 20,
      height: 20
    };
    setCuts([...cuts, newCut]);
  };

  const removeCut = (id: number) => {
    setCuts(cuts.filter(cut => cut.id !== id));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            Outils de découpe
          </CardTitle>
          <CardDescription>
            Sélectionnez une forme de découpe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleGroup 
            type="single" 
            value={selectedTool} 
            onValueChange={setSelectedTool}
            className="grid grid-cols-2 gap-2"
          >
            {tools.map((tool) => (
              <ToggleGroupItem
                key={tool.id}
                value={tool.id}
                className="flex flex-col items-center gap-2 h-16 data-[state=on]:bg-orange-100 data-[state=on]:text-orange-800 data-[state=on]:border-orange-300 dark:data-[state=on]:bg-orange-900/30 dark:data-[state=on]:text-orange-400"
              >
                <tool.icon className="h-5 w-5" />
                <span className="text-xs">{tool.name}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <Button onClick={addCut} className="w-full mt-4" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une découpe
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Découpes actives</CardTitle>
          <CardDescription>
            {cuts.length} découpe(s) définie(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cuts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Scissors className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune découpe définie</p>
              <p className="text-xs">Cliquez sur "Ajouter une découpe" pour commencer</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cuts.map((cut) => (
                <div key={cut.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary rounded">
                      {React.createElement(tools.find(t => t.id === cut.type)?.icon || Square, {
                        className: "h-4 w-4"
                      })}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{cut.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {cut.width} × {cut.height} cm
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeCut(cut.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {cuts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Paramètres de découpe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Position X (cm)</Label>
                <Input type="number" defaultValue={50} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Position Y (cm)</Label>
                <Input type="number" defaultValue={50} className="h-9" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Largeur (cm)</Label>
                <Input type="number" defaultValue={20} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Hauteur (cm)</Label>
                <Input type="number" defaultValue={20} className="h-9" />
              </div>
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
}
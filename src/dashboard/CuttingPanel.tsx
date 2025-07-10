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
  Scissors,
  Plus,
  Trash2
} from 'lucide-react';

// Import du store et des modèles
import { usePanelStore } from '@/store/panelStore';
import { createDefaultCut, type Cut } from '@/models/Cut';

export function CuttingPanel() {
  // === ZUSTAND STORE ===
  const { 
    cuts, 
    addCut, 
    removeCut, 
    editingCutId
  } = usePanelStore();
  
  // === LOCAL STATE ===
  const [selectedTool, setSelectedTool] = useState<Cut['type']>('rectangle');
  const [showParameterForm, setShowParameterForm] = useState(false);

  // === DEBUG LOGS ===
  console.log('🔧 CuttingPanel Debug:');
  console.log('  - cuts count:', cuts.length);
  console.log('  - cuts:', cuts);
  console.log('  - editingCutId:', editingCutId);
  console.log('  - selectedTool:', selectedTool);

  // === TOOLS CONFIGURATION ===
  const tools = [
    { id: 'rectangle', icon: Square, name: 'Rectangle' },
    { id: 'circle', icon: Circle, name: 'Cercle' }
  ];

  // === HANDLERS ===
  const handleAddCut = () => {
    setShowParameterForm(true);
    console.log('📝 Affichage du formulaire de paramètres pour:', selectedTool);
  };

  const handleAddCutWithParams = (customParams: Partial<Cut>) => {
    const newCut = createDefaultCut(selectedTool, cuts.length);
    Object.assign(newCut, customParams);
    addCut(newCut);
    setShowParameterForm(false); // Masquer le formulaire après création
    
    console.log('✅ Nouvelle découpe créée:', newCut.name, newCut);
  };

  const handleCancelForm = () => {
    setShowParameterForm(false);
    console.log('❌ Formulaire de paramètres annulé');
  };

  const handleRemoveCut = (id: string) => {
    const cutToRemove = cuts.find(cut => cut.id === id);
    removeCut(id);
    console.log('🗑️ Découpe supprimée:', cutToRemove?.name, cutToRemove);
  };

  const handleToolChange = (value: string) => {
    if (value === 'rectangle' || value === 'circle') {
      setSelectedTool(value as Cut['type']);
      setShowParameterForm(false); // Masquer le formulaire quand on change d'outil
    }
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
            onValueChange={handleToolChange}
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

          <Button onClick={handleAddCut} className="w-full mt-4" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une découpe
          </Button>
        </CardContent>
      </Card>

      {showParameterForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Paramètres de découpe</CardTitle>
            <CardDescription>
              Outil sélectionné: {tools.find(t => t.id === selectedTool)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTool === 'rectangle' && <RectangularCutForm onAddCut={handleAddCutWithParams} onCancel={handleCancelForm} />}
            {selectedTool === 'circle' && <CircularCutForm onAddCut={handleAddCutWithParams} onCancel={handleCancelForm} />}
          </CardContent>
        </Card>
      )}

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
                        {cut.type === 'rectangle' 
                          ? `${cut.length} × ${cut.width} mm`
                          : `⌀ ${cut.radius * 2} mm`
                        }
                        {cut.depth > 0 && ` • Prof: ${cut.depth}mm`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Position: {cut.positionX}, {cut.positionY} mm
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemoveCut(cut.id)}
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
    </div>
  );
}

// === FORM COMPONENTS ===

interface CutFormProps {
  onAddCut: (params: Partial<Cut>) => void;
  onCancel: () => void;
}

function RectangularCutForm({ onAddCut, onCancel }: CutFormProps) {
  const [formData, setFormData] = useState({
    positionX: 100,
    positionY: 100,
    length: 50,
    width: 30,
    depth: 0
  });

  const handleInputChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: Math.max(0, value) }));
  };

  const handleAddCut = () => {
    onAddCut({
      positionX: formData.positionX,
      positionY: formData.positionY,
      length: formData.length,
      width: formData.width,
      depth: formData.depth
    });
    
    // Reset form ou laisser les valeurs pour faciliter la création multiple
    // setFormData({ positionX: 100, positionY: 100, length: 50, width: 30, depth: 0 });
  };

  const isValid = formData.length > 0 && formData.width > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Position X (mm)</Label>
          <Input 
            type="number" 
            value={formData.positionX}
            onChange={(e) => handleInputChange('positionX', Number(e.target.value))}
            className="h-9" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Position Y (mm)</Label>
          <Input 
            type="number" 
            value={formData.positionY}
            onChange={(e) => handleInputChange('positionY', Number(e.target.value))}
            className="h-9" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Longueur (mm)</Label>
          <Input 
            type="number" 
            value={formData.length}
            onChange={(e) => handleInputChange('length', Number(e.target.value))}
            className="h-9" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Largeur (mm)</Label>
          <Input 
            type="number" 
            value={formData.width}
            onChange={(e) => handleInputChange('width', Number(e.target.value))}
            className="h-9" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Profondeur (mm) - 0 = traversant</Label>
        <Input 
          type="number" 
          value={formData.depth}
          onChange={(e) => handleInputChange('depth', Number(e.target.value))}
          className="h-9" 
        />
      </div>

      <div className="flex gap-3 mt-4">
        <Button 
          onClick={onCancel}
          className="flex-1"
          variant="outline"
        >
          Annuler
        </Button>
        <Button 
          onClick={handleAddCut}
          className="flex-1"
          variant="default"
          disabled={!isValid}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer
        </Button>
      </div>
    </div>
  );
}

function CircularCutForm({ onAddCut, onCancel }: CutFormProps) {
  const [formData, setFormData] = useState({
    positionX: 100,
    positionY: 100,
    radius: 25,
    depth: 0
  });

  const handleInputChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: Math.max(0, value) }));
  };

  const handleAddCut = () => {
    onAddCut({
      positionX: formData.positionX,
      positionY: formData.positionY,
      radius: formData.radius,
      depth: formData.depth
    });
  };

  const isValid = formData.radius > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Position X (mm)</Label>
          <Input 
            type="number" 
            value={formData.positionX}
            onChange={(e) => handleInputChange('positionX', Number(e.target.value))}
            className="h-9" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Position Y (mm)</Label>
          <Input 
            type="number" 
            value={formData.positionY}
            onChange={(e) => handleInputChange('positionY', Number(e.target.value))}
            className="h-9" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Rayon (mm)</Label>
          <Input 
            type="number" 
            value={formData.radius}
            onChange={(e) => handleInputChange('radius', Number(e.target.value))}
            className="h-9" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Diamètre (mm)</Label>
          <Input 
            type="number" 
            value={formData.radius * 2}
            onChange={(e) => handleInputChange('radius', Number(e.target.value) / 2)}
            className="h-9" 
            placeholder="Calculé automatiquement"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Profondeur (mm) - 0 = traversant</Label>
        <Input 
          type="number" 
          value={formData.depth}
          onChange={(e) => handleInputChange('depth', Number(e.target.value))}
          className="h-9" 
        />
      </div>

      <div className="flex gap-3 mt-4">
        <Button 
          onClick={onCancel}
          className="flex-1"
          variant="outline"
        >
          Annuler
        </Button>
        <Button 
          onClick={handleAddCut}
          className="flex-1"
          variant="default"
          disabled={!isValid}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer
        </Button>
      </div>
    </div>
  );
}
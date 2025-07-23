import React from "react";
import { useState, useEffect } from 'react';
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
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

// Import du store et des modèles
import { usePanelStore } from '@/store/panelStore';
import { createDefaultCut, type Cut, RECTANGULAR_CUT_LIMITS, CIRCULAR_CUT_LIMITS } from '@/models/Cut';

export function CuttingPanel() {
  // === ZUSTAND STORE ===
  const { 
    cuts, 
    addCut, 
    removeCut, 
    editingCutId,
    startEditingCut,
    // Actions de prévisualisation
    setPreviewCut,
    previewCut,
    validateCutPosition,
    // Actions de visibilité (debug)
    isPanelVisible,
    togglePanelVisibility
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
    
    // Créer une découpe par défaut pour déclencher la prévisualisation
    const defaultCut = createDefaultCut(selectedTool, cuts.length);
    setPreviewCut(defaultCut);
    
    console.log('📝 Affichage du formulaire de paramètres pour:', selectedTool);
    console.log('👁️ Découpe par défaut créée pour prévisualisation:', defaultCut);
  };

  const handleAddCutWithParams = (customParams: Partial<Cut>) => {
    const newCut = createDefaultCut(selectedTool, cuts.length);
    Object.assign(newCut, customParams);
    addCut(newCut);
    setShowParameterForm(false); // Masquer le formulaire après création
    
    // Nettoyer la prévisualisation après ajout de la découpe
    setPreviewCut(null);
    
    console.log('✅ Nouvelle découpe créée:', newCut.name, newCut);
  };

  const handleCancelForm = () => {
    setShowParameterForm(false);
    
    // Nettoyer la prévisualisation lors de l'annulation
    setPreviewCut(null);
    
    console.log('❌ Formulaire de paramètres annulé');
  };

  const handleRemoveCut = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette découpe ?')) {
      removeCut(id);
      
      // Nettoyer la prévisualisation si on supprime la découpe en cours de prévisualisation
      setPreviewCut(null);
      
      console.log('🗑️ Découpe supprimée:', id);
    }
  };

  const handleToolChange = (value: string) => {
    if (value === 'rectangle' || value === 'circle') {
      setSelectedTool(value as Cut['type']);
      setShowParameterForm(false); // Masquer le formulaire quand on change d'outil
      
      // Nettoyer la prévisualisation lors du changement d'outil
      setPreviewCut(null);
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
          
          {/* Indicateur de prévisualisation active */}
          {previewCut && (
            <div className="mt-3 space-y-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="text-xs text-blue-800 dark:text-blue-400 flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Prévisualisation en cours
                </div>
              </div>
              
              {/* Validation de la découpe */}
              {(() => {
                const validation = validateCutPosition(previewCut);
                return (
                  <div className={`p-2 border rounded-md ${
                    validation.isValid 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <div className={`text-xs font-medium ${
                      validation.isValid 
                        ? 'text-green-800 dark:text-green-400' 
                        : 'text-red-800 dark:text-red-400'
                    }`}>
                      {validation.isValid ? '✓ Découpe valide' : '✗ Découpe invalide'}
                    </div>
                    {validation.errors.length > 0 && (
                      <ul className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {validation.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    )}
                    {validation.warnings.length > 0 && (
                      <ul className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                        {validation.warnings.map((warning, index) => (
                          <li key={index}>⚠ {warning}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          
          {/* Bouton de debug pour cacher/afficher le panneau */}
          <Button 
            onClick={togglePanelVisibility}
            variant="outline" 
            size="sm"
            className="w-full mt-3"
          >
            {isPanelVisible ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Cacher le panneau (debug)
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Afficher le panneau
              </>
            )}
          </Button>
          
          {/* Bouton de test pour découpes Worker OpenCascade */}
          <Button 
            onClick={() => {
              // Créer une découpe rectangulaire de test
              const testCut = createDefaultCut('rectangle', cuts.length);
              console.log('🧪 Test découpe worker - Ajout de:', testCut);
              addCut(testCut);
            }}
            variant="secondary" 
            size="sm"
            className="w-full mt-2"
          >
            <Scissors className="h-4 w-4 mr-2" />
            Test Worker: Ajouter découpe rectangulaire
          </Button>
          
          <Button 
            onClick={() => {
              // Créer une découpe circulaire de test
              const testCut = createDefaultCut('circle', cuts.length);
              console.log('🧪 Test découpe worker - Ajout de:', testCut);
              addCut(testCut);
            }}
            variant="secondary" 
            size="sm"
            className="w-full mt-1"
          >
            <Circle className="h-4 w-4 mr-2" />
            Test Worker: Ajouter découpe circulaire
          </Button>
          
          <Button 
            onClick={() => {
              // Test cotations: créer une découpe de prévisualisation
              const testCut = createDefaultCut('rectangle', cuts.length);
              testCut.positionX = 150;
              testCut.positionY = 75;
              console.log('📐 Test cotations - Prévisualisation découpe:', testCut);
              setPreviewCut(testCut);
            }}
            variant="outline" 
            size="sm"
            className="w-full mt-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Test Cotations: Prévisualisation
          </Button>
          
          <Button 
            onClick={() => {
              // Test cotations: éditer la première découpe s'il y en a une
              if (cuts.length > 0) {
                const firstCut = cuts[0];
                console.log('📐 Test cotations - Édition découpe:', firstCut);
                startEditingCut(firstCut.id);
              } else {
                console.warn('Aucune découpe à éditer - ajoutez d\'abord une découpe');
              }
            }}
            variant="outline" 
            size="sm"
            className="w-full mt-1"
            disabled={cuts.length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Test Cotations: Édition
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
  // Accès aux dimensions du panneau et à la découpe de prévisualisation
  const dimensions = usePanelStore((state) => state.dimensions);
  const previewCut = usePanelStore((state) => state.previewCut);
  
  // Initialiser avec les valeurs de la découpe de prévisualisation si elle existe
  const initialData = previewCut && previewCut.type === 'rectangle' ? {
    positionX: previewCut.positionX,
    positionY: previewCut.positionY,
    length: previewCut.length,
    width: previewCut.width,
    depth: previewCut.depth
  } : {
    positionX: 100,
    positionY: 100,
    length: 50,
    width: 30,
    depth: dimensions.thickness
  };

  const [formData, setFormData] = useState(initialData);

  // États locaux pour permettre la saisie libre avant validation (comme GeneralPanel)
  const [positionXInput, setPositionXInput] = useState(formData.positionX.toString());
  const [positionYInput, setPositionYInput] = useState(formData.positionY.toString());
  const [lengthInput, setLengthInput] = useState(formData.length.toString());
  const [widthInput, setWidthInput] = useState(formData.width.toString());
  const [depthInput, setDepthInput] = useState(formData.depth.toString());

  // Actions de prévisualisation depuis le store
  const updatePreviewCut = usePanelStore((state) => state.updatePreviewCut);

  // Synchroniser avec la découpe de prévisualisation du parent (une seule fois au montage)
  useEffect(() => {
    if (previewCut && previewCut.type === 'rectangle') {
      // Pas besoin de recréer, la découpe existe déjà
      console.log('🔄 [RectangularCutForm] Découpe de prévisualisation déjà créée:', previewCut);
    } else {
      // Créer une nouvelle découpe si aucune n'existe
      updatePreviewCut(formData);
      console.log('🆕 [RectangularCutForm] Découpe de prévisualisation créée:', formData);
    }
  }, []); // Déclenché uniquement au montage du composant

  // Fonction pour appliquer les contraintes min/max localement
  const applyConstraints = (field: string, value: number): number => {
    let constrainedValue = Math.max(0, value);
    
    // Appliquer les contraintes spécifiques pour rectangle
    if (field === 'depth') {
      constrainedValue = Math.max(RECTANGULAR_CUT_LIMITS.depth.min, 
                                 Math.min(value, dimensions.thickness));
    }
    
    return constrainedValue;
  };

  // Fonction pour gérer la validation (onBlur ET onEnter)
  const handleValidation = (field: string, inputValue: string) => {
    const newValue = Number(inputValue);
    const currentStoreValue = formData[field as keyof typeof formData];
    
    // Appliquer les contraintes min/max
    const constrainedValue = applyConstraints(field, newValue);
    
    // Mettre à jour l'affichage de l'input avec la valeur contrainte
    if (field === 'positionX') setPositionXInput(String(constrainedValue));
    if (field === 'positionY') setPositionYInput(String(constrainedValue));
    if (field === 'length') setLengthInput(String(constrainedValue));
    if (field === 'width') setWidthInput(String(constrainedValue));
    if (field === 'depth') setDepthInput(String(constrainedValue));
    
    // Si la valeur contrainte est différente du store, on met à jour le 3D
    if (constrainedValue !== currentStoreValue) {
      const newFormData = { ...formData, [field]: constrainedValue };
      setFormData(newFormData);
      updatePreviewCut(newFormData);
    }
  };

  // Fonction pour gérer onBlur
  const handleFieldBlur = (field: string, inputValue: string) => {
    handleValidation(field, inputValue);
  };

  // Fonction pour gérer Entrée (SANS quitter le champ)
  const handleKeyDown = (e: React.KeyboardEvent, field: string, inputValue: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleValidation(field, inputValue);
      // PAS de blur() - on reste dans le champ
    }
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
          <Label className="text-xs flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-red-500 bg-red-50"></div>
            <span className="text-red-600 font-medium">Position X (mm)</span>
          </Label>
          <Input 
            type="number" 
            value={positionXInput}
            onChange={(e) => setPositionXInput(e.target.value)}
            onBlur={() => handleFieldBlur('positionX', positionXInput)}
            onKeyDown={(e) => handleKeyDown(e, 'positionX', positionXInput)}
            className="h-9 border-red-300 focus:border-red-500 focus:ring-red-200" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-50"></div>
            <span className="text-blue-600 font-medium">Position Y (mm)</span>
          </Label>
          <Input 
            type="number" 
            value={positionYInput}
            onChange={(e) => setPositionYInput(e.target.value)}
            onBlur={() => handleFieldBlur('positionY', positionYInput)}
            onKeyDown={(e) => handleKeyDown(e, 'positionY', positionYInput)}
            className="h-9 border-blue-300 focus:border-blue-500 focus:ring-blue-200" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Longueur (mm)</Label>
          <Input 
            type="number" 
            value={lengthInput}
            onChange={(e) => setLengthInput(e.target.value)}
            onBlur={() => handleFieldBlur('length', lengthInput)}
            onKeyDown={(e) => handleKeyDown(e, 'length', lengthInput)}
            className="h-9" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Largeur (mm)</Label>
          <Input 
            type="number" 
            value={widthInput}
            onChange={(e) => setWidthInput(e.target.value)}
            onBlur={() => handleFieldBlur('width', widthInput)}
            onKeyDown={(e) => handleKeyDown(e, 'width', widthInput)}
            className="h-9" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Profondeur (mm) - {dimensions.thickness}mm = traversant</Label>
        <Input 
          type="number" 
          value={depthInput}
          onChange={(e) => setDepthInput(e.target.value)}
          onBlur={() => handleFieldBlur('depth', depthInput)}
          onKeyDown={(e) => handleKeyDown(e, 'depth', depthInput)}
          className="h-9" 
          min={RECTANGULAR_CUT_LIMITS.depth.min}
          max={dimensions.thickness}
          step={0.1}
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
  // Accès aux dimensions du panneau et à la découpe de prévisualisation
  const dimensions = usePanelStore((state) => state.dimensions);
  const previewCut = usePanelStore((state) => state.previewCut);
  
  // Initialiser avec les valeurs de la découpe de prévisualisation si elle existe
  const initialData = previewCut && previewCut.type === 'circle' ? {
    positionX: previewCut.positionX,
    positionY: previewCut.positionY,
    radius: previewCut.radius,
    depth: previewCut.depth
  } : {
    positionX: 100,
    positionY: 100,
    radius: 25,
    depth: dimensions.thickness
  };

  const [formData, setFormData] = useState(initialData);

  // États locaux pour permettre la saisie libre avant validation (comme GeneralPanel)
  const [positionXInput, setPositionXInput] = useState(formData.positionX.toString());
  const [positionYInput, setPositionYInput] = useState(formData.positionY.toString());
  const [radiusInput, setRadiusInput] = useState(formData.radius.toString());
  const [depthInput, setDepthInput] = useState(formData.depth.toString());

  // Actions de prévisualisation depuis le store
  const updatePreviewCut = usePanelStore((state) => state.updatePreviewCut);

  // Synchroniser avec la découpe de prévisualisation du parent (une seule fois au montage)
  useEffect(() => {
    if (previewCut && previewCut.type === 'circle') {
      // Pas besoin de recréer, la découpe existe déjà
      console.log('🔄 [CircularCutForm] Découpe de prévisualisation déjà créée:', previewCut);
    } else {
      // Créer une nouvelle découpe si aucune n'existe
      updatePreviewCut(formData);
      console.log('🆕 [CircularCutForm] Découpe de prévisualisation créée:', formData);
    }
  }, []); // Déclenché uniquement au montage du composant

  // Fonction de validation et mise à jour centralisée
  const handleValidation = (field: string, inputValue: string) => {
    let newValue = Number(inputValue);
    let constrainedValue = Math.max(0, newValue);
    
    // Appliquer les contraintes spécifiques pour cercle
    if (field === 'depth') {
      constrainedValue = Math.max(CIRCULAR_CUT_LIMITS.depth.min, 
                                 Math.min(newValue, dimensions.thickness));
    }
    
    // Corriger la valeur dans l'input si elle a été contrainte
    if (constrainedValue !== newValue) {
      setTimeout(() => {
        switch (field) {
          case 'positionX': setPositionXInput(constrainedValue.toString()); break;
          case 'positionY': setPositionYInput(constrainedValue.toString()); break;
          case 'radius': setRadiusInput(constrainedValue.toString()); break;
          case 'depth': setDepthInput(constrainedValue.toString()); break;
        }
      }, 0);
    }
    
    // Vérifier si la valeur a vraiment changé avant de déclencher le calcul
    if (formData[field as keyof typeof formData] !== constrainedValue) {
      const newFormData = { ...formData, [field]: constrainedValue };
      setFormData(newFormData);
      // Mettre à jour la prévisualisation uniquement si changement réel
      updatePreviewCut(newFormData);
    }
  };

  // Fonction pour gérer onBlur
  const handleFieldBlur = (field: string, inputValue: string) => {
    handleValidation(field, inputValue);
  };

  // Fonction pour gérer Entrée
  const handleKeyDown = (e: React.KeyboardEvent, field: string, inputValue: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleValidation(field, inputValue);
      // Auto-blur supprimé : pas de (e.target as HTMLInputElement).blur();
    }
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
          <Label className="text-xs flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-red-500 bg-red-50"></div>
            <span className="text-red-600 font-medium">Position X (mm)</span>
          </Label>
          <Input 
            type="number" 
            value={positionXInput}
            onChange={(e) => setPositionXInput(e.target.value)}
            onBlur={() => handleFieldBlur('positionX', positionXInput)}
            onKeyDown={(e) => handleKeyDown(e, 'positionX', positionXInput)}
            className="h-9 border-red-300 focus:border-red-500 focus:ring-red-200" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-50"></div>
            <span className="text-blue-600 font-medium">Position Y (mm)</span>
          </Label>
          <Input 
            type="number" 
            value={positionYInput}
            onChange={(e) => setPositionYInput(e.target.value)}
            onBlur={() => handleFieldBlur('positionY', positionYInput)}
            onKeyDown={(e) => handleKeyDown(e, 'positionY', positionYInput)}
            className="h-9 border-blue-300 focus:border-blue-500 focus:ring-blue-200" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Rayon (mm)</Label>
          <Input 
            type="number" 
            value={radiusInput}
            onChange={(e) => setRadiusInput(e.target.value)}
            onBlur={() => handleFieldBlur('radius', radiusInput)}
            onKeyDown={(e) => handleKeyDown(e, 'radius', radiusInput)}
            className="h-9" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Diamètre (mm)</Label>
          <Input 
            type="number" 
            value={(Number(radiusInput) * 2).toString()}
            onChange={(e) => {
              const newRadius = Number(e.target.value) / 2;
              setRadiusInput(newRadius.toString());
            }}
            onBlur={() => handleFieldBlur('radius', radiusInput)}
            onKeyDown={(e) => handleKeyDown(e, 'radius', radiusInput)}
            className="h-9" 
            placeholder="Calculé automatiquement"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Profondeur (mm) - {dimensions.thickness}mm = traversant</Label>
        <Input 
          type="number" 
          value={depthInput}
          onChange={(e) => setDepthInput(e.target.value)}
          onBlur={() => handleFieldBlur('depth', depthInput)}
          onKeyDown={(e) => handleKeyDown(e, 'depth', depthInput)}
          className="h-9" 
          min={CIRCULAR_CUT_LIMITS.depth.min}
          max={dimensions.thickness}
          step={0.1}
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
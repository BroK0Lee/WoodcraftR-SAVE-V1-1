import { useState, useEffect } from 'react';
import { usePanelStore } from "@/store/panelStore";
import { PANEL_LIMITS, CIRCLE_LIMITS } from "@/models/Panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Square, Circle } from 'lucide-react';
import { 
  RotateCcw
} from 'lucide-react';

export function GeneralPanel() {
  const {
    dimensions,
  shape,
    setLength,
    setWidth,
    setThickness,
    resetDimensions,
  setShape,
  circleDiameter,
  setCircleDiameter,
  } = usePanelStore();

  // Valeurs locales pour permettre la saisie libre avant validation
  const [lengthInput, setLengthInput] = useState(dimensions.length.toString());
  const [widthInput, setWidthInput] = useState(dimensions.width.toString());
  const [thicknessInput, setThicknessInput] = useState(dimensions.thickness.toString());
  const [diameterInput, setDiameterInput] = useState(circleDiameter.toString());

  useEffect(() => setLengthInput(String(dimensions.length)), [dimensions.length]);
  useEffect(() => setWidthInput(String(dimensions.width)), [dimensions.width]);
  useEffect(() => setThicknessInput(String(dimensions.thickness)), [dimensions.thickness]);
  useEffect(() => setDiameterInput(String(circleDiameter)), [circleDiameter]);

  // Fonction pour appliquer les contraintes min/max localement (sans appeler le store)
  const applyConstraints = (key: string, value: number): number => {
    if (key === "length") {
      return Math.min(Math.max(value, PANEL_LIMITS.length.min), PANEL_LIMITS.length.max);
    }
    if (key === "width") {
      return Math.min(Math.max(value, PANEL_LIMITS.width.min), PANEL_LIMITS.width.max);
    }
    if (key === "thickness") {
      return Math.min(Math.max(value, PANEL_LIMITS.thickness.min), PANEL_LIMITS.thickness.max);
    }
    if (key === "diameter") {
      return Math.min(Math.max(value, CIRCLE_LIMITS.diameter.min), CIRCLE_LIMITS.diameter.max);
    }
    return value;
  };

  // Fonction pour mettre à jour le store
  const updateDimension = (key: string, value: number) => {
    if (key === "length") setLength(value);
    if (key === "width") setWidth(value);
    if (key === "thickness") setThickness(value);
    if (key === "diameter") setCircleDiameter(value);
  };

  // Fonction pour gérer la validation (onBlur ET onEnter)
  const handleValidation = (key: string, inputValue: string) => {
    const newValue = Number(inputValue);
    const currentStoreValue =
      key === "length" ? dimensions.length :
      key === "width" ? dimensions.width :
      key === "thickness" ? dimensions.thickness :
      circleDiameter;
    
    // Appliquer les contraintes min/max
    const constrainedValue = applyConstraints(key, newValue);
    
    // Mettre à jour l'affichage de l'input avec la valeur contrainte
    if (key === "length") setLengthInput(String(constrainedValue));
    if (key === "width") setWidthInput(String(constrainedValue));
  if (key === "thickness") setThicknessInput(String(constrainedValue));
  if (key === "diameter") setDiameterInput(String(constrainedValue));
    
    // Si la valeur contrainte est différente du store, on met à jour le 3D
    if (constrainedValue !== currentStoreValue) {
      updateDimension(key, constrainedValue);
    }
  };

  // Fonction pour gérer onBlur
  const handleFieldBlur = (key: string, inputValue: string) => {
    handleValidation(key, inputValue);
  };

  // Fonction pour gérer Entrée (SANS quitter le champ)
  const handleKeyDown = (e: React.KeyboardEvent, key: string, inputValue: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleValidation(key, inputValue);
      // PAS de blur() - on reste dans le champ
    }
  };

  const resetDimensionsHandler = () => {
    resetDimensions();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Forme</CardTitle>
          <CardDescription>Choisissez la forme du panneau</CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            value={shape}
            onValueChange={(val) => {
              if (val === 'rectangle' || val === 'circle') setShape(val);
            }}
            className="grid grid-cols-2 gap-2"
          >
            <ToggleGroupItem
              value="rectangle"
              className="flex flex-col items-center gap-2 h-16 data-[state=on]:bg-orange-100 data-[state=on]:text-orange-800 data-[state=on]:border-orange-300 dark:data-[state=on]:bg-orange-900/30 dark:data-[state=on]:text-orange-400"
            >
              <Square className="h-5 w-5" />
              <span className="text-xs">Carré / Rectangle</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="circle"
              className="flex flex-col items-center gap-2 h-16 data-[state=on]:bg-orange-100 data-[state=on]:text-orange-800 data-[state=on]:border-orange-300 dark:data-[state=on]:bg-orange-900/30 dark:data-[state=on]:text-orange-400"
            >
              <Circle className="h-5 w-5" />
              <span className="text-xs">Circulaire</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            Dimensions
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetDimensionsHandler}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            {shape === 'rectangle'
              ? 'Modifier la longueur, la largeur et l’épaisseur'
              : 'Modifier le diamètre et l’épaisseur'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {shape === 'rectangle' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {/* Longueur */}
                <div className="flex flex-col gap-1 w-full">
                  <Label htmlFor="length" className="text-xs">Longueur (mm)</Label>
                  <Input
                    id="length"
                    type="number"
                    value={lengthInput}
                    onChange={(e) => setLengthInput(e.target.value)}
                    onBlur={() => handleFieldBlur('length', lengthInput)}
                    onKeyDown={(e) => handleKeyDown(e, 'length', lengthInput)}
                    className="h-9 flex-1"
                    min={PANEL_LIMITS.length.min}
                    max={PANEL_LIMITS.length.max}
                  />
                  <Badge variant="secondary" className="self-start text-xs mt-0.5">
                  min: {PANEL_LIMITS.length.min} mm – max: {PANEL_LIMITS.length.max} mm
                  </Badge>
                </div>
                {/* Largeur */}
                <div className="flex flex-col gap-1 w-full">
                  <Label htmlFor="width" className="text-xs">Largeur (mm)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={widthInput}
                    onChange={(e) => setWidthInput(e.target.value)}
                    onBlur={() => handleFieldBlur('width', widthInput)}
                    onKeyDown={(e) => handleKeyDown(e, 'width', widthInput)}
                    className="h-9 flex-1"
                    min={PANEL_LIMITS.width.min}
                    max={PANEL_LIMITS.width.max}
                  />
                  <Badge variant="secondary" className="self-start text-xs mt-0.5">
                  min: {PANEL_LIMITS.width.min} mm – max: {PANEL_LIMITS.width.max} mm
                  </Badge>
                </div>
              </div>

              {/* Épaisseur */}
              <div className="flex flex-col gap-1 w-full">
                <Label htmlFor="thickness" className="text-xs">Épaisseur (mm)</Label>
                <Input
                  id="thickness"
                  type="number"
                  value={thicknessInput}
                  onChange={(e) => setThicknessInput(e.target.value)}
                  onBlur={() => handleFieldBlur('thickness', thicknessInput)}
                  onKeyDown={(e) => handleKeyDown(e, 'thickness', thicknessInput)}
                  className="h-9 flex-1"
                  min={PANEL_LIMITS.thickness.min}
                  max={PANEL_LIMITS.thickness.max}
                  step="0.1"
                />
                <Badge variant="secondary" className="self-start text-xs mt-0.5">
                min: {PANEL_LIMITS.thickness.min} mm – max: {PANEL_LIMITS.thickness.max} mm
                </Badge>
              </div>
            </>
          ) : (
            <>
              {/* Diamètre */}
              <div className="flex flex-col gap-1 w-full">
                <Label htmlFor="diameter" className="text-xs">Diamètre (mm)</Label>
                <Input
                  id="diameter"
                  type="number"
                  value={diameterInput}
                  onChange={(e) => setDiameterInput(e.target.value)}
                  onBlur={() => handleFieldBlur('diameter', diameterInput)}
                  onKeyDown={(e) => handleKeyDown(e, 'diameter', diameterInput)}
                  className="h-9 flex-1"
                  min={CIRCLE_LIMITS.diameter.min}
                  max={CIRCLE_LIMITS.diameter.max}
                />
                <Badge variant="secondary" className="self-start text-xs mt-0.5">
                  min: {CIRCLE_LIMITS.diameter.min} mm – max: {CIRCLE_LIMITS.diameter.max} mm
                </Badge>
              </div>

              {/* Épaisseur */}
              <div className="flex flex-col gap-1 w-full">
                <Label htmlFor="thickness-c" className="text-xs">Épaisseur (mm)</Label>
                <Input
                  id="thickness-c"
                  type="number"
                  value={thicknessInput}
                  onChange={(e) => setThicknessInput(e.target.value)}
                  onBlur={() => handleFieldBlur('thickness', thicknessInput)}
                  onKeyDown={(e) => handleKeyDown(e, 'thickness', thicknessInput)}
                  className="h-9 flex-1"
                  min={PANEL_LIMITS.thickness.min}
                  max={PANEL_LIMITS.thickness.max}
                  step="0.1"
                />
                <Badge variant="secondary" className="self-start text-xs mt-0.5">
                  min: {PANEL_LIMITS.thickness.min} mm – max: {PANEL_LIMITS.thickness.max} mm
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Surface:</span>
            <Badge variant="secondary">
              {(dimensions.length * dimensions.width / 10000).toFixed(2)} m²
            </Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Volume:</span>
            <Badge variant="secondary">
              {(dimensions.length * dimensions.width * dimensions.thickness / 1000000).toFixed(3)} m³
            </Badge>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Poids estimé:</span>
            <Badge variant="outline">
              {(dimensions.length * dimensions.width * dimensions.thickness * 0.0007).toFixed(1)} kg
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { validateCircularCut } from "../validation/CutRulesValidation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit } from "lucide-react";
import { usePanelStore } from "@/store/panelStore";
import { CIRCULAR_CUT_LIMITS } from "@/models/Cut";
import { CutFormProps } from "../types";

export function CircularCutForm({ onAddCut, onCancel, editingCut }: CutFormProps) {
  // Accès aux dimensions du panneau et à la découpe de prévisualisation
  const dimensions = usePanelStore((state) => state.dimensions);
  const previewCut = usePanelStore((state) => state.previewCut);
  const updateCut = usePanelStore((state) => state.updateCut);

  // Initialiser avec les valeurs de la découpe de prévisualisation si elle existe,
  // ou avec les valeurs de la découpe en cours d'édition,
  // ou avec des valeurs par défaut
  const initialData =
    editingCut && editingCut.type === "circle"
      ? {
          positionX: editingCut.positionX,
          positionY: editingCut.positionY,
          radius: editingCut.radius,
          depth: editingCut.depth,
          repetitionX: editingCut.repetitionX || 0,
          spacingX: editingCut.spacingX || 100,
          repetitionY: editingCut.repetitionY || 0,
          spacingY: editingCut.spacingY || 100,
        }
      : previewCut && previewCut.type === "circle"
      ? {
          positionX: previewCut.positionX,
          positionY: previewCut.positionY,
          radius: previewCut.radius,
          depth: previewCut.depth,
          repetitionX: previewCut.repetitionX || 0,
          spacingX: previewCut.spacingX || 100,
          repetitionY: previewCut.repetitionY || 0,
          spacingY: previewCut.spacingY || 100,
        }
      : {
          positionX: 100,
          positionY: 100,
          radius: 25,
          depth: dimensions.thickness,
          repetitionX: 0,
          spacingX: 100,
          repetitionY: 0,
          spacingY: 100,
        };

  const [formData, setFormData] = useState(initialData);

  // États locaux pour permettre la saisie libre avant validation (comme GeneralPanel)
  const [positionXInput, setPositionXInput] = useState(
    formData.positionX.toString()
  );
  const [positionYInput, setPositionYInput] = useState(
    formData.positionY.toString()
  );
  const [diameterInput, setDiameterInput] = useState(
    (formData.radius * 2).toString()
  );
  const [depthInput, setDepthInput] = useState(formData.depth.toString());

  // États pour la grille
  const [enableGrid, setEnableGrid] = useState(
    (formData.repetitionX || 0) > 0 || (formData.repetitionY || 0) > 0
  );
  const [repetitionXInput, setRepetitionXInput] = useState(
    (formData.repetitionX || 0).toString()
  );
  const [spacingXInput, setSpacingXInput] = useState(
    (formData.spacingX || 100).toString()
  );
  const [repetitionYInput, setRepetitionYInput] = useState(
    (formData.repetitionY || 0).toString()
  );
  const [spacingYInput, setSpacingYInput] = useState(
    (formData.spacingY || 100).toString()
  );

  // État de validation
  const [validationState, setValidationState] = useState({
    isValid: true,
    minSpacingX: 0,
    minSpacingY: 0,
  });

  // Actions de prévisualisation depuis le store
  const updatePreviewCut = usePanelStore((state) => state.updatePreviewCut);

  // Ref pour dernier toast (comportement similaire aux formulaires rectangulaires)
  const lastToastRef = useRef<string | number | null>(null);

  // Gérer les changements d'editingCut pour réinitialiser les champs
  useEffect(() => {
    if (editingCut && editingCut.type === "circle") {
      const editData = {
        positionX: editingCut.positionX,
        positionY: editingCut.positionY,
        radius: editingCut.radius,
        depth: editingCut.depth,
        repetitionX: editingCut.repetitionX || 0,
        spacingX: editingCut.spacingX || 100,
        repetitionY: editingCut.repetitionY || 0,
        spacingY: editingCut.spacingY || 100,
      };
      setFormData(editData);
      setPositionXInput(editingCut.positionX.toString());
      setPositionYInput(editingCut.positionY.toString());
      setDiameterInput((editingCut.radius * 2).toString());
      setDepthInput(editingCut.depth.toString());
      const hasGrid = (editingCut.repetitionX || 0) > 0 || (editingCut.repetitionY || 0) > 0;
      setEnableGrid(hasGrid);
      setRepetitionXInput((editingCut.repetitionX || 0).toString());
      setSpacingXInput((editingCut.spacingX || 100).toString());
      setRepetitionYInput((editingCut.repetitionY || 0).toString());
      setSpacingYInput((editingCut.spacingY || 100).toString());
      // En mode édition, pas de prévisualisation séparée - on modifie directement
    }
  }, [editingCut]);

  // Validation en temps réel
  useEffect(() => {
    const validation = validateCircularCut(formData as any);
    setValidationState({
      isValid: validation.isValid,
      minSpacingX: validation.minSpacingX || 0,
      minSpacingY: validation.minSpacingY || 0,
    });

    // Si la configuration redevient valide, annuler le toast existant
    if (validation.isValid && lastToastRef.current) {
      try {
        toast.dismiss(lastToastRef.current);
      } catch (e) {
        // ignore
      }
      lastToastRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, editingCut]);

  // Synchroniser avec la découpe de prévisualisation du parent (une seule fois au montage)
  useEffect(() => {
    // En mode édition, on ne crée pas de prévisualisation séparée
    if (editingCut) {
      console.log(
        "🔄 [CircularCutForm] Mode édition - pas de prévisualisation séparée"
      );
      return;
    }

    if (previewCut && previewCut.type === "circle") {
      // Pas besoin de recréer, la découpe existe déjà
      console.log(
        "🔄 [CircularCutForm] Découpe de prévisualisation déjà créée:",
        previewCut
      );
    } else {
      // Créer une nouvelle découpe si aucune n'existe
      updatePreviewCut(formData);
      console.log(
        "🆕 [CircularCutForm] Découpe de prévisualisation créée:",
        formData
      );
    }
    // Intention: exécuter uniquement au montage pour initialiser la prévisualisation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Déclenché uniquement au montage du composant

  // Fonction de validation et mise à jour centralisée
  const handleValidation = (field: string, inputValue: string) => {
    const newValue = Number(inputValue);
    let constrainedValue = Math.max(0, newValue);

    // Pour le diamètre, on applique les contraintes de rayon multipliées par 2
    if (field === "diameter") {
      const radiusValue = newValue / 2;
      const constrainedRadius = Math.max(
        CIRCULAR_CUT_LIMITS.radius.min,
        Math.min(radiusValue, CIRCULAR_CUT_LIMITS.radius.max)
      );
      constrainedValue = constrainedRadius * 2; // Reconvertir en diamètre
    }
    // Appliquer les contraintes spécifiques pour la profondeur
    else if (field === "depth") {
      constrainedValue = Math.max(
        CIRCULAR_CUT_LIMITS.depth.min,
        Math.min(newValue, dimensions.thickness)
      );
    }

    // Corriger la valeur dans l'input si elle a été contrainte
    if (constrainedValue !== newValue) {
      setTimeout(() => {
        switch (field) {
          case "positionX":
            setPositionXInput(constrainedValue.toString());
            break;
          case "positionY":
            setPositionYInput(constrainedValue.toString());
            break;
          case "diameter":
            setDiameterInput(constrainedValue.toString());
            break;
          case "depth":
            setDepthInput(constrainedValue.toString());
            break;
        }
      }, 0);
    }

    // Pour le diamètre, on doit mettre à jour le rayon dans formData
    let fieldToUpdate = field;
    let valueToUpdate = constrainedValue;
    if (field === "diameter") {
      fieldToUpdate = "radius";
      valueToUpdate = constrainedValue / 2;
    }

    // Contraintes générales pour répétitions / entraxes
    if (field === "repetitionX" || field === "repetitionY") {
      constrainedValue = Math.max(0, Math.min(newValue, 50));
      fieldToUpdate = field;
      valueToUpdate = constrainedValue;
    }
    if (field === "spacingX" || field === "spacingY") {
      constrainedValue = Math.max(1, newValue);
      fieldToUpdate = field;
      valueToUpdate = constrainedValue;
    }

    // Vérifier si la valeur a vraiment changé avant de déclencher le calcul
    if (formData[fieldToUpdate as keyof typeof formData] !== valueToUpdate) {
      const newFormData = { ...formData, [fieldToUpdate]: valueToUpdate };
      setFormData(newFormData);

      // Si la modification touche des propriétés de grille, valider
      const validation = validateCircularCut(newFormData as any);
      if (!validation.isValid) {
        if (lastToastRef.current) {
          try {
            toast.dismiss(lastToastRef.current);
          } catch (e) {}
          lastToastRef.current = null;
        }
        lastToastRef.current = toast.error("Configuration invalide", {
          description: validation.errors.join("\n"),
          duration: 5000,
        });

        // Ne pas propager la configuration invalide vers le worker / preview
        return;
      }

      // En mode édition : mettre à jour directement la découpe existante
      if (editingCut) {
        updateCut(editingCut.id, newFormData);
        console.log(
          "🔄 [CircularCutForm] Mode édition - MAJ directe de la découpe:",
          fieldToUpdate,
          valueToUpdate
        );
      } else {
        // En mode création : utiliser la prévisualisation
        updatePreviewCut(newFormData);
        console.log(
          "🔄 [CircularCutForm] Mode création - MAJ prévisualisation:",
          fieldToUpdate,
          valueToUpdate
        );
      }
    }
  };

  // Fonction pour gérer onBlur
  const handleFieldBlur = (field: string, inputValue: string) => {
    handleValidation(field, inputValue);
  };

  // Fonction pour gérer Entrée
  const handleKeyDown = (
    e: React.KeyboardEvent,
    field: string,
    inputValue: string
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleValidation(field, inputValue);
      // Auto-blur supprimé : pas de (e.target as HTMLInputElement).blur();
    }
  };

  const handleAddCut = () => {
    // Validation finale pour les répétitions circulaires (si présentes)
    const validation = validateCircularCut(formData as any);
    if (!validation.isValid) {
      if (lastToastRef.current) {
        try { toast.dismiss(lastToastRef.current); } catch (e) {}
        lastToastRef.current = null;
      }
      lastToastRef.current = toast.error("Impossible de créer la découpe", {
        description: validation.errors.join("\n"),
      });
      return;
    }

    const cutData = {
      positionX: formData.positionX,
      positionY: formData.positionY,
      radius: formData.radius,
      depth: formData.depth,
      repetitionX: enableGrid ? formData.repetitionX : 0,
      spacingX: enableGrid ? formData.spacingX : 100,
      repetitionY: enableGrid ? formData.repetitionY : 0,
      spacingY: enableGrid ? formData.spacingY : 100,
    };

    // Toujours appeler onAddCut - la logique de création vs édition
    // est gérée dans handleAddCutWithParams du composant parent
    onAddCut(cutData);
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
            onBlur={() => handleFieldBlur("positionX", positionXInput)}
            onKeyDown={(e) => handleKeyDown(e, "positionX", positionXInput)}
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
            onBlur={() => handleFieldBlur("positionY", positionYInput)}
            onKeyDown={(e) => handleKeyDown(e, "positionY", positionYInput)}
            className="h-9 border-blue-300 focus:border-blue-500 focus:ring-blue-200"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Diamètre ⌀ (mm)</Label>
        <Input
          type="number"
          value={diameterInput}
          onChange={(e) => setDiameterInput(e.target.value)}
          onBlur={() => handleFieldBlur("diameter", diameterInput)}
          onKeyDown={(e) => handleKeyDown(e, "diameter", diameterInput)}
          className="h-9"
          min={CIRCULAR_CUT_LIMITS.radius.min * 2}
          max={CIRCULAR_CUT_LIMITS.radius.max * 2}
          step={0.1}
          placeholder="Diamètre en mm"
        />
      </div>

      <div className="space-y-4 border rounded-md p-3 bg-muted/20">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Répétition en grille</Label>
          <Switch checked={enableGrid} onCheckedChange={(v) => {
            // toggle handler: reuse logic similar to rectangular form
            setEnableGrid(Boolean(v));
            if (!v) {
              const newFormData = { ...formData, repetitionX: 0, repetitionY: 0 };
              setFormData(newFormData);
              const validation = validateCircularCut(newFormData as any);
              if (!validation.isValid) {
                if (lastToastRef.current) { try { toast.dismiss(lastToastRef.current); } catch(e){}; lastToastRef.current = null; }
                lastToastRef.current = toast.error("Configuration invalide", { description: validation.errors.join("\n"), duration: 5000 });
                return;
              }
              if (editingCut) { updateCut(editingCut.id, newFormData); } else { updatePreviewCut(newFormData); }
            } else {
              const repX = parseInt(repetitionXInput) || 0;
              const repY = parseInt(repetitionYInput) || 0;
              const spX = parseFloat(spacingXInput) || 100;
              const spY = parseFloat(spacingYInput) || 100;
              const newFormData = { ...formData, repetitionX: repX, spacingX: spX, repetitionY: repY, spacingY: spY };
              setFormData(newFormData);
              const validation = validateCircularCut(newFormData as any);
              if (!validation.isValid) {
                if (lastToastRef.current) { try { toast.dismiss(lastToastRef.current); } catch(e){}; lastToastRef.current = null; }
                lastToastRef.current = toast.error("Configuration invalide", { description: validation.errors.join("\n"), duration: 5000 });
                return;
              }
              if (editingCut) { updateCut(editingCut.id, newFormData); } else { updatePreviewCut(newFormData); }
            }
          }} />
        </div>

        {enableGrid && (
          <div className="space-y-3 pt-2">
            {/* Axe X */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">Axe X</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Répétitions (suppl.)</Label>
                  <Input
                    type="number"
                    value={repetitionXInput}
                    onChange={(e) => setRepetitionXInput(e.target.value)}
                    onBlur={() => handleFieldBlur("repetitionX", repetitionXInput)}
                    onKeyDown={(e) => handleKeyDown(e, "repetitionX", repetitionXInput)}
                    className="h-8"
                    min={0}
                    max={50}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Entraxe (mm)</Label>
                  <Input
                    type="number"
                    value={spacingXInput}
                    onChange={(e) => setSpacingXInput(e.target.value)}
                    onBlur={() => handleFieldBlur("spacingX", spacingXInput)}
                    onKeyDown={(e) => handleKeyDown(e, "spacingX", spacingXInput)}
                    className={`h-8 ${!validationState.isValid && formData.spacingX < validationState.minSpacingX ? "border-red-500 focus:border-red-500" : ""}`}
                    min={1}
                  />
                  {!validationState.isValid && formData.spacingX < validationState.minSpacingX && (
                    <p className="text-[10px] text-red-500">Min: {Math.ceil(validationState.minSpacingX)}mm</p>
                  )}
                </div>
              </div>
            </div>

            {/* Axe Y */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">Axe Y</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Répétitions (suppl.)</Label>
                  <Input
                    type="number"
                    value={repetitionYInput}
                    onChange={(e) => setRepetitionYInput(e.target.value)}
                    onBlur={() => handleFieldBlur("repetitionY", repetitionYInput)}
                    onKeyDown={(e) => handleKeyDown(e, "repetitionY", repetitionYInput)}
                    className="h-8"
                    min={0}
                    max={50}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Entraxe (mm)</Label>
                  <Input
                    type="number"
                    value={spacingYInput}
                    onChange={(e) => setSpacingYInput(e.target.value)}
                    onBlur={() => handleFieldBlur("spacingY", spacingYInput)}
                    onKeyDown={(e) => handleKeyDown(e, "spacingY", spacingYInput)}
                    className={`h-8 ${!validationState.isValid && formData.spacingY < validationState.minSpacingY ? "border-red-500 focus:border-red-500" : ""}`}
                    min={1}
                  />
                  {!validationState.isValid && formData.spacingY < validationState.minSpacingY && (
                    <p className="text-[10px] text-red-500">Min: {Math.ceil(validationState.minSpacingY)}mm</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs">
          Profondeur (mm) - {dimensions.thickness}mm = traversant
        </Label>
        <Input
          type="number"
          value={depthInput}
          onChange={(e) => setDepthInput(e.target.value)}
          onBlur={() => handleFieldBlur("depth", depthInput)}
          onKeyDown={(e) => handleKeyDown(e, "depth", depthInput)}
          className="h-9"
          min={CIRCULAR_CUT_LIMITS.depth.min}
          max={dimensions.thickness}
          step={0.1}
        />
      </div>

      <div className="flex gap-3 mt-4">
        <Button onClick={onCancel} className="flex-1" variant="outline">
          Annuler
        </Button>
        <Button
          onClick={handleAddCut}
          className="flex-1"
          variant="default"
          disabled={!isValid}
        >
          {editingCut ? (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Créer
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit } from "lucide-react";
import { usePanelStore } from "@/store/panelStore";
import { RECTANGULAR_CUT_LIMITS } from "@/models/Cut";
import { CutFormProps } from "../types";
import { validateRectangularCut } from "../validation/CutRulesValidation";
import { toast } from "sonner";

export function RectangularCutForm({ onAddCut, onCancel, editingCut }: CutFormProps) {
  // Accès aux dimensions du panneau et à la découpe de prévisualisation
  const dimensions = usePanelStore((state) => state.dimensions);
  const previewCut = usePanelStore((state) => state.previewCut);
  const updateCut = usePanelStore((state) => state.updateCut);

  // Initialiser avec les valeurs de la découpe de prévisualisation si elle existe,
  // ou avec les valeurs de la découpe en cours d'édition,
  // ou avec des valeurs par défaut
  const initialData =
    editingCut && editingCut.type === "rectangle"
      ? {
          positionX: editingCut.positionX,
          positionY: editingCut.positionY,
          length: editingCut.length,
          width: editingCut.width,
          depth: editingCut.depth,
          rotation: editingCut.rotation || 0,
          repetitionX: editingCut.repetitionX || 0,
          spacingX: editingCut.spacingX || 100,
          repetitionY: editingCut.repetitionY || 0,
          spacingY: editingCut.spacingY || 100,
        }
      : previewCut && previewCut.type === "rectangle"
      ? {
          positionX: previewCut.positionX,
          positionY: previewCut.positionY,
          length: previewCut.length,
          width: previewCut.width,
          depth: previewCut.depth,
          rotation: previewCut.rotation || 0,
          repetitionX: previewCut.repetitionX || 0,
          spacingX: previewCut.spacingX || 100,
          repetitionY: previewCut.repetitionY || 0,
          spacingY: previewCut.spacingY || 100,
        }
      : {
          positionX: 100,
          positionY: 100,
          length: 50,
          width: 30,
          depth: dimensions.thickness,
          rotation: 0,
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
  const [lengthInput, setLengthInput] = useState(formData.length.toString());
  const [widthInput, setWidthInput] = useState(formData.width.toString());
  const [depthInput, setDepthInput] = useState(formData.depth.toString());
  const [rotationInput, setRotationInput] = useState(
    (formData.rotation || 0).toString()
  );
  
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
    minSpacingY: 0
  });

  // Ref pour garder le dernier toast actif afin de pouvoir le dismiss
  const lastToastRef = useRef<string | number | null>(null);

  // Actions de prévisualisation depuis le store
  const updatePreviewCut = usePanelStore((state) => state.updatePreviewCut);

  // Validation en temps réel
  useEffect(() => {
    const validation = validateRectangularCut(formData);
    setValidationState({
      isValid: validation.isValid,
      minSpacingX: validation.minSpacingX,
      minSpacingY: validation.minSpacingY
    });

    // Si la configuration redevient valide, s'assurer d'annuler un toast existant
    if (validation.isValid && lastToastRef.current) {
      try {
        toast.dismiss(lastToastRef.current);
      } catch (e) {
        // ignore
      }
      lastToastRef.current = null;
    }

    // Si valide, mettre à jour la prévisualisation
    if (validation.isValid) {
      if (editingCut) {
        // En mode édition, on ne met à jour que si on n'est pas en train de taper
        // (géré par handleValidation pour l'édition directe)
      } else {
        // En mode création, on met à jour la prévisualisation
        // Note: updatePreviewCut est déjà appelé dans handleValidation, 
        // mais ici on s'assure que la validation est respectée
      }
    }
  }, [formData, editingCut]); // Dépendances: formData complet

  // Gérer les changements d'editingCut pour réinitialiser les champs
  useEffect(() => {
    if (editingCut && editingCut.type === "rectangle") {
      const editData = {
        positionX: editingCut.positionX,
        positionY: editingCut.positionY,
        length: editingCut.length,
        width: editingCut.width,
        depth: editingCut.depth,
        rotation: editingCut.rotation || 0,
        repetitionX: editingCut.repetitionX || 0,
        spacingX: editingCut.spacingX || 100,
        repetitionY: editingCut.repetitionY || 0,
        spacingY: editingCut.spacingY || 100,
      };
      setFormData(editData);
      setPositionXInput(editingCut.positionX.toString());
      setPositionYInput(editingCut.positionY.toString());
      setLengthInput(editingCut.length.toString());
      setWidthInput(editingCut.width.toString());
      setDepthInput(editingCut.depth.toString());
      setRotationInput((editingCut.rotation || 0).toString());
      
      const hasGrid = (editingCut.repetitionX || 0) > 0 || (editingCut.repetitionY || 0) > 0;
      setEnableGrid(hasGrid);
      setRepetitionXInput((editingCut.repetitionX || 0).toString());
      setSpacingXInput((editingCut.spacingX || 100).toString());
      setRepetitionYInput((editingCut.repetitionY || 0).toString());
      setSpacingYInput((editingCut.spacingY || 100).toString());
      // En mode édition, pas de prévisualisation séparée - on modifie directement
      // En mode édition, pas de prévisualisation séparée - on modifie directement
    }
  }, [editingCut]);

  // Synchroniser avec la découpe de prévisualisation du parent (une seule fois au montage)
  useEffect(() => {
    // En mode édition, on ne crée pas de prévisualisation séparée
    if (editingCut) {
      console.log(
        "🔄 [RectangularCutForm] Mode édition - pas de prévisualisation séparée"
      );
      return;
    }

    if (previewCut && previewCut.type === "rectangle") {
      // Pas besoin de recréer, la découpe existe déjà
      console.log(
        "🔄 [RectangularCutForm] Découpe de prévisualisation déjà créée:",
        previewCut
      );
    } else {
      // Créer une nouvelle découpe si aucune n'existe
      updatePreviewCut(formData);
      console.log(
        "🆕 [RectangularCutForm] Découpe de prévisualisation créée:",
        formData
      );
    }
    // Intention: exécuter uniquement au montage pour initialiser la prévisualisation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Déclenché uniquement au montage du composant

  // Fonction pour appliquer les contraintes min/max localement
  const applyConstraints = (field: string, value: number): number => {
    let constrainedValue = Math.max(0, value);

    // Appliquer les contraintes spécifiques pour rectangle
    if (field === "depth") {
      constrainedValue = Math.max(
        RECTANGULAR_CUT_LIMITS.depth.min,
        Math.min(value, dimensions.thickness)
      );
    }

    // Limiter la rotation entre 0 et 180 degrés
    if (field === "rotation") {
      constrainedValue = Math.max(0, Math.min(value, 180));
    }

    // Limiter les répétitions (max 50)
    if (field === "repetitionX" || field === "repetitionY") {
      constrainedValue = Math.max(0, Math.min(value, 50));
    }

    // Limiter les entraxes (min 1mm)
    if (field === "spacingX" || field === "spacingY") {
      constrainedValue = Math.max(1, value);
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
    if (field === "positionX") setPositionXInput(String(constrainedValue));
    if (field === "positionY") setPositionYInput(String(constrainedValue));
    if (field === "length") setLengthInput(String(constrainedValue));
    if (field === "width") setWidthInput(String(constrainedValue));
    if (field === "depth") setDepthInput(String(constrainedValue));
    if (field === "rotation") setRotationInput(String(constrainedValue));
    if (field === "repetitionX") setRepetitionXInput(String(constrainedValue));
    if (field === "spacingX") setSpacingXInput(String(constrainedValue));
    if (field === "repetitionY") setRepetitionYInput(String(constrainedValue));
    if (field === "spacingY") setSpacingYInput(String(constrainedValue));

    // Si la valeur contrainte est différente du store, on met à jour le 3D
    if (constrainedValue !== currentStoreValue) {
      const newFormData = { ...formData, [field]: constrainedValue };
      setFormData(newFormData);

      // Validation immédiate avant envoi au store
      const validation = validateRectangularCut(newFormData);

      if (!validation.isValid) {
        // Annuler le toast précédent si encore visible
        if (lastToastRef.current) {
          try { toast.dismiss(lastToastRef.current); } catch (e) {}
          lastToastRef.current = null;
        }

        // Afficher un nouveau toast d'erreur (toujours afficher lorsqu'on valide explicitement)
        lastToastRef.current = toast.error("Configuration invalide", {
          description: validation.errors.join("\n"),
          duration: 5000,
        });

        // On ne propage pas au store pour éviter le calcul CAD
        return;
      }

      // En mode édition : mettre à jour directement la découpe existante
      if (editingCut) {
        updateCut(editingCut.id, newFormData);
        console.log(
          "🔄 [RectangularCutForm] Mode édition - MAJ directe de la découpe:",
          field,
          constrainedValue
        );
      } else {
        // En mode création : utiliser la prévisualisation
        updatePreviewCut(newFormData);
        console.log(
          "🔄 [RectangularCutForm] Mode création - MAJ prévisualisation:",
          field,
          constrainedValue
        );
      }
    }
  };

  // Fonction pour gérer onBlur
  const handleFieldBlur = (field: string, inputValue: string) => {
    handleValidation(field, inputValue);
  };

  // Fonction pour gérer Entrée (SANS quitter le champ)
  const handleKeyDown = (
    e: React.KeyboardEvent,
    field: string,
    inputValue: string
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleValidation(field, inputValue);
      // PAS de blur() - on reste dans le champ
    }
  };

  const handleGridToggle = (checked: boolean) => {
    setEnableGrid(checked);
    if (!checked) {
      // Si on désactive, on met les répétitions à 0 dans le store/preview
      // mais on garde les valeurs dans les inputs pour si l'utilisateur réactive
      const newFormData = { ...formData, repetitionX: 0, repetitionY: 0 };
      setFormData(newFormData);
      
      // Validation (toujours valide si pas de répétition, mais bon principe)
      const validation = validateRectangularCut(newFormData);
      if (!validation.isValid) {
        if (lastToastRef.current) {
          try { toast.dismiss(lastToastRef.current); } catch (e) {}
          lastToastRef.current = null;
        }
        lastToastRef.current = toast.error("Configuration invalide", {
          description: validation.errors.join("\n"),
          duration: 5000,
        });
        return;
      }

      if (editingCut) {
        updateCut(editingCut.id, newFormData);
      } else {
        updatePreviewCut(newFormData);
      }
    } else {
      // Si on active, on restaure les valeurs des inputs
      const repX = parseInt(repetitionXInput) || 0;
      const repY = parseInt(repetitionYInput) || 0;
      const spX = parseFloat(spacingXInput) || 100;
      const spY = parseFloat(spacingYInput) || 100;

      const newFormData = {
        ...formData,
        repetitionX: repX,
        spacingX: spX,
        repetitionY: repY,
        spacingY: spY,
      };
      setFormData(newFormData);

      // Validation avant application
      const validation = validateRectangularCut(newFormData);
      if (!validation.isValid) {
        if (lastToastRef.current) {
          try { toast.dismiss(lastToastRef.current); } catch (e) {}
          lastToastRef.current = null;
        }
        lastToastRef.current = toast.error("Configuration invalide", {
          description: validation.errors.join("\n"),
          duration: 5000,
        });
        return;
      }

      if (editingCut) {
        updateCut(editingCut.id, newFormData);
      } else {
        updatePreviewCut(newFormData);
      }
    }
  };

  const handleAddCut = () => {
    // Validation finale avant ajout
    const validation = validateRectangularCut(formData);
    if (!validation.isValid) {
      // Annuler et ré-émettre un toast (nouveau)
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
      length: formData.length,
      width: formData.width,
      depth: formData.depth,
      rotation: formData.rotation,
      repetitionX: enableGrid ? formData.repetitionX : 0,
      spacingX: enableGrid ? formData.spacingX : 100,
      repetitionY: enableGrid ? formData.repetitionY : 0,
      spacingY: enableGrid ? formData.spacingY : 100,
    };

    // Toujours appeler onAddCut - la logique de création vs édition
    // est gérée dans handleAddCutWithParams du composant parent
    onAddCut(cutData);

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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Longueur (mm)</Label>
          <Input
            type="number"
            value={lengthInput}
            onChange={(e) => setLengthInput(e.target.value)}
            onBlur={() => handleFieldBlur("length", lengthInput)}
            onKeyDown={(e) => handleKeyDown(e, "length", lengthInput)}
            className="h-9"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Largeur (mm)</Label>
          <Input
            type="number"
            value={widthInput}
            onChange={(e) => setWidthInput(e.target.value)}
            onBlur={() => handleFieldBlur("width", widthInput)}
            onKeyDown={(e) => handleKeyDown(e, "width", widthInput)}
            className="h-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Rotation (°)</Label>
        <Input
          type="number"
          value={rotationInput}
          onChange={(e) => setRotationInput(e.target.value)}
          onBlur={() => handleFieldBlur("rotation", rotationInput)}
          onKeyDown={(e) => handleKeyDown(e, "rotation", rotationInput)}
          className="h-9"
          min={0}
          max={180}
        />
      </div>

      <div className="space-y-4 border rounded-md p-3 bg-muted/20">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Répétition en grille</Label>
          <Switch checked={enableGrid} onCheckedChange={handleGridToggle} />
        </div>

        {enableGrid && (
          <div className="space-y-3 pt-2">
            {/* Axe X */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                Axe X
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Répétitions (suppl.)</Label>
                  <Input
                    type="number"
                    value={repetitionXInput}
                    onChange={(e) => setRepetitionXInput(e.target.value)}
                    onBlur={() =>
                      handleFieldBlur("repetitionX", repetitionXInput)
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(e, "repetitionX", repetitionXInput)
                    }
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
                    onKeyDown={(e) =>
                      handleKeyDown(e, "spacingX", spacingXInput)
                    }
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
              <Label className="text-xs font-semibold text-muted-foreground">
                Axe Y
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Répétitions (suppl.)</Label>
                  <Input
                    type="number"
                    value={repetitionYInput}
                    onChange={(e) => setRepetitionYInput(e.target.value)}
                    onBlur={() =>
                      handleFieldBlur("repetitionY", repetitionYInput)
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(e, "repetitionY", repetitionYInput)
                    }
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
                    onKeyDown={(e) =>
                      handleKeyDown(e, "spacingY", spacingYInput)
                    }
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
          min={RECTANGULAR_CUT_LIMITS.depth.min}
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

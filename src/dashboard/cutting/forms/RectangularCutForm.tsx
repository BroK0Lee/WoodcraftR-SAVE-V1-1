import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { usePanelStore } from "@/store/panelStore";
import { RECTANGULAR_CUT_LIMITS } from "@/models/Cut";
import { CutFormProps } from "../types";

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
        }
      : previewCut && previewCut.type === "rectangle"
      ? {
          positionX: previewCut.positionX,
          positionY: previewCut.positionY,
          length: previewCut.length,
          width: previewCut.width,
          depth: previewCut.depth,
        }
      : {
          positionX: 100,
          positionY: 100,
          length: 50,
          width: 30,
          depth: dimensions.thickness,
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

  // Actions de prévisualisation depuis le store
  const updatePreviewCut = usePanelStore((state) => state.updatePreviewCut);

  // Gérer les changements d'editingCut pour réinitialiser les champs
  useEffect(() => {
    if (editingCut && editingCut.type === "rectangle") {
      const editData = {
        positionX: editingCut.positionX,
        positionY: editingCut.positionY,
        length: editingCut.length,
        width: editingCut.width,
        depth: editingCut.depth,
      };
      setFormData(editData);
      setPositionXInput(editingCut.positionX.toString());
      setPositionYInput(editingCut.positionY.toString());
      setLengthInput(editingCut.length.toString());
      setWidthInput(editingCut.width.toString());
      setDepthInput(editingCut.depth.toString());
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

    // Si la valeur contrainte est différente du store, on met à jour le 3D
    if (constrainedValue !== currentStoreValue) {
      const newFormData = { ...formData, [field]: constrainedValue };
      setFormData(newFormData);

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

  const handleAddCut = () => {
    const cutData = {
      positionX: formData.positionX,
      positionY: formData.positionY,
      length: formData.length,
      width: formData.width,
      depth: formData.depth,
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

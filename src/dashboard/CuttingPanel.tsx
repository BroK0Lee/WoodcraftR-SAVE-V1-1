import { useState } from "react";
import { Square, Circle } from "lucide-react";

// Import du store et des modèles
import { usePanelStore } from "@/store/panelStore";
import {
  createDefaultCut,
  type Cut,
} from "@/models/Cut";

// Import du formulaire général
import { CutGeneralForm } from "./cutting/forms/CutGeneralForm";

export function CuttingPanel() {
  // === ZUSTAND STORE ===
  const {
    cuts,
    addCut,
    removeCut,
    updateCut,
    // Actions de prévisualisation
    setPreviewCut,
    // Actions d'édition
    startEditingCut,
    stopEditingCut,
  } = usePanelStore();

  // === LOCAL STATE ===
  const [selectedTool, setSelectedTool] = useState<Cut["type"]>("rectangle");
  const [showParameterForm, setShowParameterForm] = useState(false);
  const [editingCut, setEditingCut] = useState<Cut | null>(null); // Découpe en cours d'édition
  console.log("  - selectedTool:", selectedTool);

  // === TOOLS CONFIGURATION ===
  const tools = [
    { id: "rectangle", icon: Square, name: "Rectangle" },
    { id: "circle", icon: Circle, name: "Cercle" },
  ];

  // === HANDLERS ===
  const handleAddCut = () => {
    setShowParameterForm(true);

    // Réinitialiser le mode édition
    setEditingCut(null);

    // Créer une découpe par défaut pour déclencher la prévisualisation
    const defaultCut = createDefaultCut(selectedTool, cuts.length);
    setPreviewCut(defaultCut);

    console.log("📝 Affichage du formulaire de paramètres pour:", selectedTool);
    console.log(
      "👁️ Découpe par défaut créée pour prévisualisation:",
      defaultCut
    );
  };

  const handleAddCutWithParams = (customParams: Partial<Cut>) => {
    if (editingCut) {
      // Mode édition : mettre à jour la découpe existante
      const updatedCut = { ...editingCut, ...customParams };
      updateCut(editingCut.id, updatedCut);
      stopEditingCut();

      console.log("✏️ Découpe mise à jour:", updatedCut.name, updatedCut);
    } else {
      // Mode création : créer une nouvelle découpe
      const newCut = createDefaultCut(selectedTool, cuts.length);
      Object.assign(newCut, customParams);
      addCut(newCut);

      console.log("✅ Nouvelle découpe créée:", newCut.name, newCut);
    }

    setShowParameterForm(false); // Masquer le formulaire après création/modification

    // Nettoyer la prévisualisation et l'état d'édition
    setPreviewCut(null);
    setEditingCut(null);
    stopEditingCut();
  };

  const handleCancelForm = () => {
    setShowParameterForm(false);

    // Nettoyer la prévisualisation et l'état d'édition lors de l'annulation
    setPreviewCut(null);
    setEditingCut(null);
    stopEditingCut();

    console.log("❌ Formulaire de paramètres annulé");
  };

  const handleRemoveCut = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette découpe ?")) {
      removeCut(id);

      // Nettoyer la prévisualisation si on supprime la découpe en cours de prévisualisation
      setPreviewCut(null);

      console.log("🗑️ Découpe supprimée:", id);
    }
  };

  const handleEditCut = (cut: Cut) => {
    // Définir le type d'outil sélectionné selon la découpe
    setSelectedTool(cut.type);

    // Marquer cette découpe comme étant en édition
    setEditingCut(cut);
    startEditingCut(cut.id);

    // En mode édition, on ne crée pas de prévisualisation séparée
    // La découpe existante sera modifiée directement dans le store
    setPreviewCut(null);

    // Afficher le formulaire de paramètres
    setShowParameterForm(true);

    console.log("✏️ Édition de la découpe:", cut.name, cut);
  };

  const handleToolChange = (value: string) => {
    if (value === "rectangle" || value === "circle") {
      setSelectedTool(value as Cut["type"]);
      setShowParameterForm(false); // Masquer le formulaire quand on change d'outil

      // Nettoyer la prévisualisation lors du changement d'outil
      setPreviewCut(null);
    }
  };

  return (
    <CutGeneralForm
      selectedTool={selectedTool}
      onToolChange={handleToolChange}
      tools={tools}
      onAddCut={handleAddCut}
      showParameterForm={showParameterForm}
      onAddCutWithParams={handleAddCutWithParams}
      onCancelForm={handleCancelForm}
      editingCut={editingCut}
      cuts={cuts}
      onEditCut={handleEditCut}
      onRemoveCut={handleRemoveCut}
    />
  );
}

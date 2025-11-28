import React from "react";
import { usePanelStore } from "@/store/panelStore";
import { Cut } from "@/models/Cut";

interface CutValidationStatusProps {
  cut: Cut;
}

export function CutValidationStatus({ cut }: CutValidationStatusProps) {
  const validateCutPosition = usePanelStore((state) => state.validateCutPosition);
  const validation = validateCutPosition(cut);

  return (
    <div
      className={`p-2 border rounded-md ${
        validation.isValid
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      }`}
    >
      <div
        className={`text-xs font-medium ${
          validation.isValid
            ? "text-green-800 dark:text-green-400"
            : "text-red-800 dark:text-red-400"
        }`}
      >
        {validation.isValid ? "✓ Découpe valide" : "✗ Découpe invalide"}
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
}

import { Cut } from "@/models/Cut";

export interface CutFormProps {
  onAddCut: (params: Partial<Cut>) => void;
  onCancel: () => void;
  editingCut?: Cut | null;
}

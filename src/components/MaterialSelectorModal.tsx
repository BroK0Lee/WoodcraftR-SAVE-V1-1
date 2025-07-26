import { useMaterialStore } from '@/store/materialStore';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import WoodMaterialSelector from './WoodMaterialSelector';

export function MaterialSelectorModal() {
  const { 
    isMaterialSelectorOpen, 
    setMaterialSelectorOpen, 
    setSelectedMaterial 
  } = useMaterialStore();

  const handleMaterialSelect = (material: any) => {
    setSelectedMaterial(material);
    setMaterialSelectorOpen(false);
  };

  return (
    <Dialog open={isMaterialSelectorOpen} onOpenChange={setMaterialSelectorOpen}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <div className="w-full h-[80vh]">
          <WoodMaterialSelector
            onMaterialSelect={handleMaterialSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

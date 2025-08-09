import { useEffect, useState } from 'react';
import { useGlobalMaterialStore } from '@/store/globalMaterialStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TreePine } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { listMaterials } from '@/services/materialsManifest';

export function MaterialPanel() {
  const { selectedMaterialId, setSelectedMaterialId } = useGlobalMaterialStore();
  // État: sélection courante (par défaut: aucune)
  const [localSelection, setLocalSelection] = useState<string | ''>('');
  const NONE_VALUE = '__none__';
  // Données issues du manifest JSON public
  const [options, setOptions] = useState<Array<{ id: string; displayName: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger la liste depuis public/textures/wood/materials.json
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const opts = await listMaterials();
        if (!mounted) return;
        setOptions(opts);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement des matières');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Synchroniser la sélection locale avec le store global
  useEffect(() => {
    setLocalSelection(selectedMaterialId ?? '');
  }, [selectedMaterialId]);

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Sélection de la matière */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TreePine className="w-4 h-4" />
            Matière selectionnée
          </CardTitle>
          <CardDescription>
            Choisissez la matière via la liste déroulante ci-dessous
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="text-center text-gray-500 py-4">
              <TreePine className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Chargement des matériaux...</p>
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              Erreur: {error}
            </div>
          )}
          {!isLoading && !error && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Liste des matières</div>
              <Select
                value={localSelection || undefined}
                onValueChange={(val) => {
                  if (val === NONE_VALUE) {
                    setLocalSelection('');
                    setSelectedMaterialId(null);
                    return;
                  }
                  setLocalSelection(val);
                  setSelectedMaterialId(val || null);
                }}
              >
                <SelectTrigger size="default" className="w-full" aria-label="Choisir une matière">
                  <SelectValue placeholder="Aucune matière sélectionnée" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Aucune matière sélectionnée</SelectItem>
                  {options.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Aperçu de la matière sélectionnée */}
              {selectedMaterialId ? (
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1">Aperçu</div>
                  <div className="rounded-md overflow-hidden border border-border bg-card hover:shadow-sm transition-shadow">
                    <img
                      src={`/textures/wood/${selectedMaterialId}/basecolor.jpg`}
                      alt={`Aperçu ${options.find(o => o.id === selectedMaterialId)?.displayName || selectedMaterialId}`}
                      className="w-full h-28 object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = '0.3';
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-muted-foreground">Aucune matière sélectionnée</div>
              )}

              <div className="text-xs text-muted-foreground">
                État: {selectedMaterialId ? `"${options.find(o => o.id === selectedMaterialId)?.displayName ?? selectedMaterialId}" sélectionnée` : 'Aucune matière sélectionnée'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useGlobalMaterialStore } from '@/store/globalMaterialStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TreePine } from 'lucide-react';

export function MaterialPanel() {
  const { selectedMaterialId, setSelectedMaterialId } = useGlobalMaterialStore();
  // État: sélection courante (par défaut: aucune)
  const [localSelection, setLocalSelection] = useState<string | ''>('');
  // Données issues du manifest JSON public
  const [options, setOptions] = useState<Array<{ id: string; displayName: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger la liste depuis public/textures/wood/materials.json
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/textures/wood/materials.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!mounted) return;
        const opts = (json?.materials ?? []).map((m: { id: string; displayName: string }) => ({
          id: m.id,
          displayName: m.displayName,
        }));
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
              <label htmlFor="material-select" className="text-sm font-medium text-gray-700">
                Liste des matières
              </label>
              <select
                id="material-select"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={localSelection}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalSelection(val);
                  setSelectedMaterialId(val || null);
                }}
              >
                <option value="">Aucune matière sélectionnée</option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.displayName}
                  </option>
                ))}
              </select>

              {/* Aperçu de la matière sélectionnée */}
              {selectedMaterialId ? (
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1">Aperçu</div>
                  <div className="rounded-md overflow-hidden border border-gray-200 bg-white">
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
                <div className="mt-3 text-xs text-gray-500">Aucune matière sélectionnée</div>
              )}

              <div className="text-xs text-gray-500">
                État: {selectedMaterialId ? `"${options.find(o => o.id === selectedMaterialId)?.displayName ?? selectedMaterialId}" sélectionnée` : 'Aucune matière sélectionnée'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

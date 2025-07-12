import { useEffect, useState, useRef, useCallback } from "react";
import * as Comlink from "comlink";
import PanelViewer from "./AppViewer";
import type { PanelGeometryDTO } from "@/helpers/shapeToGeometry";
import { usePanelStore } from "@/store/panelStore";
import type { OccWorkerAPI } from "@/workers/worker.types";
import type { EdgeDTO } from "@/models/EdgeDTO";

export default function ContentViewer() {
  const [geometry, setGeometry] = useState<PanelGeometryDTO | null>(null);
  const [edges, setEdges] = useState<EdgeDTO[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastCuttingInfo, setLastCuttingInfo] = useState<any>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Indique si le moteur OpenCascade est prêt
  const [ocReady, setOcReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const occProxyRef = useRef<Comlink.Remote<OccWorkerAPI> | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidGeometryRef = useRef<{ geometry: PanelGeometryDTO; edges: EdgeDTO[] } | null>(null);
  
  const dimensions = usePanelStore((state) => state.dimensions);
  
  // Nouvelles données pour les découpes
  const cuts = usePanelStore((state) => state.cuts);
  const editingCutId = usePanelStore((state) => state.editingCutId);

  // Initialisation du worker une seule fois
  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/occ.worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    const occProxy = Comlink.wrap<OccWorkerAPI>(worker);
    occProxyRef.current = occProxy;

    // Initialisation du moteur OCCT dans le worker
    (async () => {
      const ready = await occProxy.init();
      setOcReady(ready);
    })();

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Fonction de recalcul optimisée avec debouncing
  const calculateGeometry = useCallback(async (shouldDebounce = true) => {
    const proxy = occProxyRef.current;
    if (!proxy || !ocReady) return;

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const performCalculation = async () => {
      setIsCalculating(true);
      let isCancelled = false;
      const currentDimensions = { ...dimensions };
      const currentCuts = [...cuts];
      
      try {
        // Si nous avons des découpes, utiliser la nouvelle fonction createPanelWithCuts
        if (currentCuts.length > 0) {
          console.log('[ContentViewer] Recalcul avec découpes:', currentCuts.length);
          
          if (typeof proxy.createPanelWithCuts !== 'function') {
            console.error('[ContentViewer] Worker API error: createPanelWithCuts is not a function');
            return;
          }
          
          const { geometry: geom, edges: newEdges, cuttingInfo } = await proxy.createPanelWithCuts({
            dimensions: currentDimensions,
            cuts: currentCuts
          });
          
          if (!isCancelled) {
            // Force la création de nouveaux objets pour éviter la mutation
            const newGeometry = {
              positions: new Float32Array(geom.positions),
              indices: geom.indices.constructor === Uint32Array ? 
                new Uint32Array(geom.indices) : new Uint16Array(geom.indices),
            };
            
            setGeometry(newGeometry);
            setEdges([...newEdges]);
            setLastCuttingInfo(cuttingInfo);
            setLastError(null);
            setRetryCount(0);
            
            // Sauvegarder la géométrie valide comme fallback
            lastValidGeometryRef.current = { geometry: newGeometry, edges: [...newEdges] };
            
            // Log des informations de découpe pour debug
            console.log('[ContentViewer] ✅ Découpes appliquées:', cuttingInfo);
          }
        } else {
          console.log('[ContentViewer] Recalcul panneau simple');
          
          // Sinon, utiliser la fonction classique pour un panneau simple
          if (typeof proxy.createBox !== 'function') {
            console.error('[ContentViewer] Worker API error: createBox is not a function');
            return;
          }
          
          const { geometry: geom, edges: newEdges } = await proxy.createBox(currentDimensions);
          
          if (!isCancelled) {
            // Force la création de nouveaux objets pour éviter la mutation
            const newGeometry = {
              positions: new Float32Array(geom.positions),
              indices: geom.indices.constructor === Uint32Array ? 
                new Uint32Array(geom.indices) : new Uint16Array(geom.indices),
            };
            
            setGeometry(newGeometry);
            setEdges([...newEdges]);
            setLastCuttingInfo(null);
            setLastError(null);
            setRetryCount(0);
            
            // Sauvegarder la géométrie valide comme fallback
            lastValidGeometryRef.current = { geometry: newGeometry, edges: [...newEdges] };
            
            console.log('[ContentViewer] ✅ Panneau simple généré');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
          console.error('[ContentViewer] ❌ Error calling worker functions:', err);
          
          setLastError(errorMessage);
          setRetryCount(prev => prev + 1);
          
          // Si on a une géométrie valide précédente et que c'est un échec de découpe, on peut faire un rollback
          if (lastValidGeometryRef.current && currentCuts.length > 0 && retryCount < 2) {
            console.warn('[ContentViewer] 🔄 Rollback vers géométrie précédente valide');
            setGeometry(lastValidGeometryRef.current.geometry);
            setEdges(lastValidGeometryRef.current.edges);
          }
        }
      } finally {
        if (!isCancelled) {
          setIsCalculating(false);
        }
      }
      
      return () => {
        isCancelled = true;
      };
    };

    // Appliquer le debouncing seulement si demandé (pas pour les changements initiaux)
    if (shouldDebounce && editingCutId) {
      // Pendant l'édition, on debounce pour éviter les recalculs trop fréquents
      debounceTimeoutRef.current = setTimeout(performCalculation, 500);
    } else {
      // Recalcul immédiat pour les ajouts/suppressions ou changements de dimensions
      await performCalculation();
    }
  }, [dimensions, cuts, editingCutId, ocReady]);

  // Calcul du modèle à chaque changement de dimensions ou de découpes
  useEffect(() => {
    calculateGeometry(false); // Pas de debounce pour les changements initiaux
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [calculateGeometry]);

  // Centre de la scène : le modèle est re-positionné au centre du panneau
  const target: [number, number, number] = [
    dimensions.length / 2, 
    dimensions.width / 2, 
    dimensions.thickness / 2
  ];

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {!ocReady ? (
        <div className="text-center">
          <p>Chargement d'OpenCascade…</p>
          <div className="mt-2 text-sm text-gray-500">
            Initialisation du moteur CAD
          </div>
        </div>
      ) : (
        <>
          {isCalculating && (
            <div className="absolute top-4 right-4 z-10 bg-blue-600 text-white px-3 py-1 rounded-md text-sm">
              Calcul en cours...
            </div>
          )}
          
          {lastError && (
            <div className="absolute top-4 left-4 z-10 bg-red-600 text-white px-3 py-1 rounded-md text-sm max-w-xs">
              ❌ {lastError}
              {retryCount > 0 && (
                <div className="text-xs mt-1">Tentative: {retryCount}/3</div>
              )}
            </div>
          )}
          
          {geometry && (
            <PanelViewer
              geometry={geometry}
              target={target}
              dimensions={dimensions}
              edges={edges}
            />
          )}
          
          <div className="absolute bottom-2 right-2 text-xs text-neutral-50 space-y-1">
            <div>{edges.length} edges</div>
            {lastCuttingInfo && (
              <div className="text-xs bg-black/50 rounded px-2 py-1 space-y-1">
                <div>🔪 {lastCuttingInfo.totalCuts} découpe(s)</div>
                {lastCuttingInfo.rectangularCuts > 0 && (
                  <div>⬛ {lastCuttingInfo.rectangularCuts} rectangulaire(s)</div>
                )}
                {lastCuttingInfo.circularCuts > 0 && (
                  <div>⭕ {lastCuttingInfo.circularCuts} circulaire(s)</div>
                )}
                {lastCuttingInfo.failedCuts.length > 0 && (
                  <div className="text-red-400">
                    ❌ {lastCuttingInfo.failedCuts.length} échec(s)
                  </div>
                )}
                <div>📐 {Math.round(lastCuttingInfo.totalCutArea)}mm²</div>
                <div>📊 {Math.round(lastCuttingInfo.totalCutVolume)}mm³</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

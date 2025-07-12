import { useEffect, useState, useRef } from "react";
import * as Comlink from "comlink";
import PanelViewer from "./AppViewer";
import type { PanelGeometryDTO } from "@/helpers/shapeToGeometry";
import { usePanelStore } from "@/store/panelStore";
import type { OccWorkerAPI } from "@/workers/worker.types";
import type { EdgeDTO } from "@/models/EdgeDTO";

export default function ContentViewer() {
  const [geometry, setGeometry] = useState<PanelGeometryDTO | null>(null);
  const [edges, setEdges] = useState<EdgeDTO[]>([]);

  // Indique si le moteur OpenCascade est prêt
  const [ocReady, setOcReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const occProxyRef = useRef<Comlink.Remote<OccWorkerAPI> | null>(null);
  const dimensions = usePanelStore((state) => state.dimensions);
  
  // État de prévisualisation depuis le store
  const previewCut = usePanelStore((state) => state.previewCut);
  const isPreviewMode = usePanelStore((state) => state.isPreviewMode);
  
  // Nouvelles données pour les découpes
  const cuts = usePanelStore((state) => state.cuts);

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

  // Calcul du modèle à chaque changement de dimensions ou de découpes
  useEffect(() => {
    const proxy = occProxyRef.current;
    if (!proxy || !ocReady) return;

    let isCancelled = false;
    const currentDimensions = { ...dimensions };
    const currentCuts = [...cuts];
    
    (async () => {
      try {
        // Si nous avons des découpes, utiliser la nouvelle fonction createPanelWithCuts
        if (currentCuts.length > 0) {
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
            
            // Log des informations de découpe pour debug
            console.log('[ContentViewer] Découpes appliquées:', cuttingInfo);
          }
        } else {
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
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('[ContentViewer] Error calling worker functions:', err);
        }
      }
    })();
    
    return () => {
      isCancelled = true;
    };
  }, [dimensions, cuts, ocReady]);

  // Centre de la scène : le modèle est re-positionné au centre du panneau
  const target: [number, number, number] = [
    dimensions.length / 2, 
    dimensions.width / 2, 
    dimensions.thickness / 2
  ];

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {!ocReady ? (
        <p>Chargement d'OpenCascade…</p>
      ) : (
        <>
          {geometry && (
            <PanelViewer
              geometry={geometry}
              target={target}
              dimensions={dimensions}
              edges={edges}
              previewCut={previewCut}
              isPreviewMode={isPreviewMode}
            />
          )}
          <p className="absolute bottom-2 right-2 text-xs text-neutral-50">
            {edges.length} edges
          </p>
        </>
      )}
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import * as Comlink from "comlink";
import AppViewer from "./AppViewer";
import { usePanelStore } from "@/store/panelStore";
import type { PanelDimensions } from "@/models/Panel";
import type { EdgeDTO } from "@/models/EdgeDTO";

export default function ContentViewer() {
  const [modelUrl, setModelUrl] = useState<string | undefined>();
  const [edges, setEdges] = useState<EdgeDTO[]>([]);
  // Indique si le moteur OpenCascade est prêt
  const [ocReady, setOcReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const occProxyRef = useRef<{
    init: () => Promise<boolean>;
    createBox: (dims: PanelDimensions) => Promise<{ url: string; edges: EdgeDTO[] }>;
    getEdges: (shape: unknown, tolerance: number) => Promise<EdgeDTO[]>;
  } | null>(null);
  const dimensions = usePanelStore((state) => state.dimensions);

  // Initialisation du worker une seule fois
  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/occ.worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    const occProxy = Comlink.wrap<{
      init: () => Promise<boolean>;
      createBox: (dims: PanelDimensions) => Promise<{ url: string; edges: EdgeDTO[] }>;
      getEdges: (shape: unknown, tolerance: number) => Promise<EdgeDTO[]>;
    }>(worker);
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

  // Calcul du modèle à chaque changement de dimensions
  useEffect(() => {
    const proxy = occProxyRef.current;
    if (!proxy || !ocReady) return;

    (async () => {
      const { url, edges: newEdges } = await proxy.createBox(dimensions);
      setModelUrl(url);
      setEdges(newEdges);
    })();
  }, [dimensions, ocReady]);

  // Centre de la scène : le modèle est re-positionné autour de l'origine
  const target: [number, number, number] = [0, 0, 0];

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {!ocReady ? (
        <p>Chargement d'OpenCascade…</p>
      ) : modelUrl === undefined ? (
        <p>Loading…</p>
      ) : (
        <>
          <AppViewer
            url={modelUrl}
            target={target}
            dimensions={dimensions}
            edges={edges}
          />
          <p className="absolute bottom-2 right-2 text-xs text-neutral-50">
            {edges.length} edges
          </p>
        </>
      )}
    </div>
  );
}

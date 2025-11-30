import { useEffect, useRef } from "react";
import PanelViewer from "./AppViewer";
import type { PanelGeometryDTO } from "@/workers/api/shapeToGeometry";
import { usePanelStore } from "@/store/panelStore";
import { useOpenCascadeWorker } from "@/hooks/useOpenCascadeWorker";
import { requestUserRecompute } from "@/services/panelGeometryService";

export default function ContentViewer() {
  const log = (...a: unknown[]) => console.debug("[CV]", ...a);
  const geometry = usePanelStore((s) => s.geometry);
  const edges = usePanelStore((s) => s.edges);
  const isCalculating = usePanelStore((s) => s.isCalculating);
  // Inputs pour signature
  const dimensions = usePanelStore((s) => s.dimensions);
  const cuts = usePanelStore((s) => s.cuts);
  const previewCut = usePanelStore((s) => s.previewCut);
  const shape = usePanelStore((s) => s.shape);
  const circleDiameter = usePanelStore((s) => s.circleDiameter);
  const { isReady: ocReady } = useOpenCascadeWorker();
  const localLastGeometryRef = useRef<PanelGeometryDTO | null>(null);

  useEffect(() => {
    log("MOUNT");
    return () => log("UNMOUNT");
  }, []);

  useEffect(() => {
    if (!geometry) return;
    localLastGeometryRef.current = geometry;
    log("GEOMETRY_UPDATED_STORE", {
      vertices: geometry.positions.length / 3,
      triangles: geometry.indices.length / 3,
    });
  }, [geometry]);

  // Recompute automatique sur changements d'inputs panel (après montage & readiness worker)
  useEffect(() => {
    if (!ocReady) return;
    requestUserRecompute("panel-input-change");
  }, [ocReady, dimensions, cuts, previewCut, shape, circleDiameter]);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {!ocReady && (
        <div className="text-center">
          <p>Chargement d'OpenCascade…</p>
          <div className="mt-2 text-sm text-gray-500">
            Initialisation du moteur CAD
          </div>
        </div>
      )}
      {ocReady && (
        <>
          {isCalculating && (
            <div className="absolute top-4 right-4 z-10 bg-blue-600 text-white px-3 py-1 rounded-md text-sm">
              Calcul en cours...
            </div>
          )}
          {(geometry || localLastGeometryRef.current) && <PanelViewer />}
          <div className="absolute bottom-2 right-2 text-xs text-neutral-50 space-y-1">
            <div>{edges.length} edges</div>
          </div>
        </>
      )}
    </div>
  );
}

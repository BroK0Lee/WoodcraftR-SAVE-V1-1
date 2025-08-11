import { useEffect, useState, useRef } from "react";
import PanelViewer from "./AppViewer";
import type { PanelGeometryDTO } from "@/helpers/shapeToGeometry";
import { usePanelStore } from "@/store/panelStore";
import { useOpenCascadeWorker } from "@/hooks/useOpenCascadeWorker";
import type { EdgeDTO } from "@/models/EdgeDTO";
import type { CuttingInfo } from "@/workers/worker.types";

export default function ContentViewer() {
  const [lastCuttingInfo, setLastCuttingInfo] = useState<CuttingInfo | null>(
    null
  );
  const [lastError, setLastError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const inFlightRef = useRef(false);

  // Utiliser le worker global
  const { isReady: ocReady, getWorkerProxy } = useOpenCascadeWorker();
  const lastValidGeometryRef = useRef<{
    geometry: PanelGeometryDTO;
    edges: EdgeDTO[];
  } | null>(null);

  // Store state
  const dimensions = usePanelStore((state) => state.dimensions);
  const geometry = usePanelStore((state) => state.geometry);
  const edges = usePanelStore((state) => state.edges);
  const isCalculating = usePanelStore((state) => state.isCalculating);
  const setGeometry = usePanelStore((state) => state.setGeometry);
  const setEdges = usePanelStore((state) => state.setEdges);
  const setCalculating = usePanelStore((state) => state.setCalculating);
  const shape = usePanelStore((state) => state.shape);
  const circleDiameter = usePanelStore((state) => state.circleDiameter);

  // Nouvelles données pour les découpes
  const cuts = usePanelStore((state) => state.cuts);
  const editingCutId = usePanelStore((state) => state.editingCutId);

  // État de prévisualisation depuis le store
  const previewCut = usePanelStore((state) => state.previewCut);
  const isPreviewMode = usePanelStore((state) => state.isPreviewMode);
  const lastInputSigRef = useRef<string>("__init__");

  // Recalcul quand les dimensions/découpes changent
  useEffect(() => {
    const proxy = getWorkerProxy();
    if (!proxy || !ocReady) {
      console.log("⏳ [ContentViewer] Worker pas encore prêt, attente...");
      return;
    }

    // Construire une signature stable des entrées pour éviter les recalculs identiques
    const inputSig = JSON.stringify({
      dims: dimensions,
      cuts,
      preview: previewCut,
      shape,
      circleDiameter,
    });
    if (inputSig === lastInputSigRef.current) {
      // Entrées identiques: ignorer sans bruit pour éviter les logs en boucle
      return;
    }
    lastInputSigRef.current = inputSig;

    console.log("📋 [useEffect] Changement détecté - recalcul nécessaire");

    let isCancelled = false;
    const performCalculation = async () => {
      if (inFlightRef.current) {
        console.warn(
          "[ContentViewer] Calcul déjà en cours, on ignore ce trigger"
        );
        return;
      }
      inFlightRef.current = true;
      setCalculating(true);
      const currentDimensions = { ...dimensions };
      const currentCuts = [...cuts];

      // Ajouter la découpe de prévisualisation aux découpes existantes (toujours active si elle existe)
      const allCuts = previewCut ? [...currentCuts, previewCut] : currentCuts;

      try {
        // Toujours utiliser OpenCascade pour la cohérence
        console.log("🔄 [ContentViewer] DEBUT - Dimensions demandées:", {
          length: currentDimensions.length,
          width: currentDimensions.width,
          thickness: currentDimensions.thickness,
        });
        console.log("🔄 [ContentViewer] Découpes à traiter:", allCuts.length);

        if (typeof proxy.createPanelWithCuts !== "function") {
          console.error(
            "[ContentViewer] Worker API error: createPanelWithCuts is not a function"
          );
          return;
        }

        const {
          geometry: geom,
          edges: newEdges,
          cuttingInfo,
        } = await proxy.createPanelWithCuts({
          dimensions: currentDimensions,
          cuts: allCuts,
          shape,
          circleDiameter: shape === "circle" ? circleDiameter : undefined,
        });

        if (!isCancelled) {
          // Force la création de nouveaux objets pour éviter la mutation
          const newGeometry = {
            positions: new Float32Array(geom.positions),
            indices:
              geom.indices.constructor === Uint32Array
                ? new Uint32Array(geom.indices)
                : new Uint16Array(geom.indices),
          };

          setGeometry(newGeometry);
          setEdges([...newEdges]);
          setLastCuttingInfo(cuttingInfo);
          setLastError(null);
          setRetryCount(0);

          // Log de la géométrie générée
          console.log("✅ [ContentViewer] FIN - Géométrie générée:", {
            vertices: newGeometry.positions.length / 3,
            triangles: newGeometry.indices.length / 3,
            edges: newEdges.length,
          });

          // Sauvegarder la géométrie valide comme fallback
          lastValidGeometryRef.current = {
            geometry: newGeometry,
            edges: [...newEdges],
          };

          // Log unifié avec timestamp pour tracer l'ordre
          const message =
            allCuts.length > 0
              ? `OpenCascade avec ${allCuts.length} découpe(s)`
              : "OpenCascade panneau simple (0 découpe)";
          console.log(
            `✅ [ContentViewer] RESULTATS - ${message}:`,
            cuttingInfo
          );
        }
      } catch (err) {
        if (!isCancelled) {
          const errorMessage =
            err instanceof Error ? err.message : "Erreur inconnue";
          console.error(
            "[ContentViewer] ❌ Error calling worker functions:",
            err
          );

          setLastError(errorMessage);
          setRetryCount((prev) => (prev < 3 ? prev + 1 : prev));

          // Si on a une géométrie valide précédente et que c'est un échec de découpe, on peut faire un rollback
          if (
            lastValidGeometryRef.current &&
            currentCuts.length > 0 &&
            retryCount < 2
          ) {
            console.warn(
              "[ContentViewer] 🔄 Rollback vers géométrie précédente valide"
            );
            setGeometry(lastValidGeometryRef.current.geometry);
            setEdges(lastValidGeometryRef.current.edges);
          }
        }
      } finally {
        // Toujours réinitialiser l'état de calcul, même si la tâche a été annulée,
        // pour éviter de rester bloqué sur "Calcul en cours..."
        setCalculating(false);
        inFlightRef.current = false;
      }
    };

    // Mise à jour simplifiée : plus besoin de throttling car CuttingPanel
    // utilise maintenant onBlur (comme GeneralPanel)
    console.log("⚡ [useEffect] Recalcul géométrique immédiat");
    void performCalculation();

    // Cleanup automatique par React lors du démontage/changement
    return () => {
      isCancelled = true;
    };
  }, [
    dimensions,
    cuts,
    editingCutId,
    ocReady,
    previewCut,
    isPreviewMode,
    shape,
    circleDiameter,
    retryCount,
    getWorkerProxy,
    setGeometry,
    setEdges,
    setCalculating,
  ]);

  // Fallback: garder en mémoire une géométrie locale si celle du store devient brièvement nulle
  const localLastGeometryRef = useRef<PanelGeometryDTO | null>(null);
  useEffect(() => {
    if (geometry) {
      localLastGeometryRef.current = geometry;
    }
  }, [geometry]);

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

          {(geometry || localLastGeometryRef.current) && <PanelViewer />}

          <div className="absolute bottom-2 right-2 text-xs text-neutral-50 space-y-1">
            <div>{edges.length} edges</div>
            {lastCuttingInfo && (
              <div className="text-xs bg-black/50 rounded px-2 py-1 space-y-1">
                <div>🔪 {lastCuttingInfo.totalCuts} découpe(s)</div>
                {lastCuttingInfo.rectangularCuts > 0 && (
                  <div>
                    ⬛ {lastCuttingInfo.rectangularCuts} rectangulaire(s)
                  </div>
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

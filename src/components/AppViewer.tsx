import { Canvas, useLoader } from "@react-three/fiber";
import { Suspense, useMemo, useEffect, useState } from "react";
import { OrbitControls, Environment } from "@react-three/drei";
import AxesHelper from "./AxesHelper";
import EdgesLayer from "./EdgesLayer";
import DimensionLabels from "./DimensionLabels";
import type { PanelGeometryDTO } from "@/helpers/shapeToGeometry";
import { usePanelStore } from "@/store/panelStore";
import { useGlobalMaterialStore } from "@/store/globalMaterialStore";
import {
  TextureLoader,
  RepeatWrapping,
  DoubleSide,
  Vector2,
  SRGBColorSpace,
  NoColorSpace,
} from "three";
import { getMaterialsManifest, type MaterialsManifest } from "@/services/materialsManifest";

function PanelMesh({ geometry }: { geometry: PanelGeometryDTO }) {
  // Calculs optimisés des dimensions une seule fois
  const positions = geometry.positions;
  const indices = geometry.indices;
  const selectedMaterialId = useGlobalMaterialStore(
    (s) => s.selectedMaterialId
  );
  const useAO = useGlobalMaterialStore((s) => s.useAO);
  const shape = usePanelStore((s) => s.shape);
  const circleDiameter = usePanelStore((s) => s.circleDiameter);

  // Calcul simple des dimensions sans répéter les opérations
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  let minZ = Infinity,
    maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const calculatedDimensions = {
    width: (maxX - minX).toFixed(2),
    height: (maxY - minY).toFixed(2),
    depth: (maxZ - minZ).toFixed(2),
    vertices: positions.length / 3,
    triangles: indices.length / 3,
  };

  console.log("🎯 [PanelMesh] Rendu mesh:", calculatedDimensions);

  // Compute simple planar UVs (project on X/Y).
  // For circular panels, preserve an exact Ø/2 offset by anchoring UVs to [0..Ø] using the known diameter,
  // rather than relying on triangulation extents which can drift by a few epsilons.
  const uvs = useMemo(() => {
    const uvArr = new Float32Array((positions.length / 3) * 2);
    if (shape === "circle" && circleDiameter > 0) {
      const diam = circleDiameter;
      const invDiam = 1 / diam;
      // Geometry for circular panel is translated to [0..Ø] x [0..Ø], center at (Ø/2, Ø/2)
      for (let i = 0, j = 0; i < positions.length; i += 3, j += 2) {
        const x = positions[i];
        const y = positions[i + 1];
        uvArr[j] = x * invDiam; // U along X from 0 .. 1
        uvArr[j + 1] = y * invDiam; // V along Y from 0 .. 1
      }
    } else {
      const width = maxX - minX || 1;
      const height = maxY - minY || 1;
      for (let i = 0, j = 0; i < positions.length; i += 3, j += 2) {
        const x = positions[i];
        const y = positions[i + 1];
        uvArr[j] = (x - minX) / width; // U along X
        uvArr[j + 1] = (y - minY) / height; // V along Y
      }
    }
    return uvArr;
  }, [positions, minX, maxX, minY, maxY, shape, circleDiameter]);

  // Build texture URLs. Always keep hook order stable by providing neutral 1x1 placeholders when no selection.
  const white1x1 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9QCywAAAAASUVORK5CYII=";
  const hasMaterial = !!selectedMaterialId;
  // Récupérer folder/maps depuis le manifest pour l'id sélectionné
  const [selectedEntry, setSelectedEntry] = useState<MaterialsManifest["materials"][number] | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!hasMaterial) {
        setSelectedEntry(null);
        return;
      }
      try {
        const manifest = await getMaterialsManifest();
        if (!mounted) return;
        const entry = manifest.materials.find((m) => m.id === selectedMaterialId) ?? null;
        setSelectedEntry(entry);
      } catch {
        setSelectedEntry(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [hasMaterial, selectedMaterialId]);

  const baseUrl = hasMaterial && selectedEntry ? `/textures/wood/${selectedEntry.folder}` : undefined;
  const [colorTex, normalTex, roughTex] = useLoader(TextureLoader, [
    hasMaterial && selectedEntry ? `${baseUrl}/${selectedEntry.maps.basecolor}` : white1x1,
    hasMaterial && selectedEntry ? `${baseUrl}/${selectedEntry.maps.normal}` : white1x1,
    hasMaterial && selectedEntry ? `${baseUrl}/${selectedEntry.maps.roughness}` : white1x1,
  ]);
  // AO texture (optional based on flag)
  const [aoTex] = useLoader(TextureLoader, [
    useAO && hasMaterial && selectedEntry ? `${baseUrl}/${selectedEntry.maps.ao}` : white1x1,
  ]);
  // Improve texture sampling
  [colorTex, normalTex, roughTex, aoTex].forEach((t, idx) => {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.anisotropy = 4;
    // Définir l'espace colorimétrique: baseColor en sRGB, autres en linéaire
    if (idx === 0) {
      t.colorSpace = SRGBColorSpace;
    } else {
      t.colorSpace = NoColorSpace;
    }
    t.needsUpdate = true;
  });
  const baseColor = hasMaterial ? "#ffffff" : "#9ca3af"; // neutral gray when no material selected

  return (
    <mesh position={[0, 0, 0]} castShadow receiveShadow>
      <bufferGeometry
        key={`geom-${geometry.positions.length}-${geometry.indices.length}`}
        onUpdate={(g) => {
          // Assurer des bornes correctes pour le culling
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const geom = g as any;
          geom.computeBoundingBox?.();
          geom.computeBoundingSphere?.();
        }}
      >
        <bufferAttribute
          attach="attributes-position"
          array={geometry.positions}
          count={geometry.positions.length / 3}
          itemSize={3}
          onUpdate={(attr) => {
            attr.needsUpdate = true;
          }}
        />
        <bufferAttribute
          attach="index"
          array={geometry.indices}
          count={geometry.indices.length}
          itemSize={1}
          onUpdate={(attr) => {
            attr.needsUpdate = true;
          }}
        />
        <bufferAttribute
          attach="attributes-uv"
          array={uvs}
          count={uvs.length / 2}
          itemSize={2}
          onUpdate={(attr) => {
            attr.needsUpdate = true;
          }}
        />
        {useAO && (
          <bufferAttribute
            attach="attributes-uv2"
            array={uvs}
            count={uvs.length / 2}
            itemSize={2}
            onUpdate={(attr) => {
              attr.needsUpdate = true;
            }}
          />
        )}
      </bufferGeometry>
      {/* Physically based material with optional maps */}
      <meshStandardMaterial
        side={DoubleSide}
        color={baseColor}
        map={hasMaterial ? colorTex : undefined}
        normalMap={hasMaterial ? normalTex : undefined}
        roughnessMap={hasMaterial ? roughTex : undefined}
        aoMap={useAO && hasMaterial ? aoTex : undefined}
        metalness={0}
        roughness={1}
        normalScale={hasMaterial ? new Vector2(1, 1) : new Vector2(0, 0)}
        aoMapIntensity={useAO && hasMaterial ? 1 : 0}
      />
    </mesh>
  );
}
export default function PanelViewer() {
  const isPanelVisible = usePanelStore((state) => state.isPanelVisible);
  const geometry = usePanelStore((state) => state.geometry);
  const edges = usePanelStore((state) => state.edges);

  // États pour les cotations
  const dimensions = usePanelStore((state) => state.dimensions);
  const editingCutId = usePanelStore((state) => state.editingCutId);
  const previewCut = usePanelStore((state) => state.previewCut);
  const cuts = usePanelStore((state) => state.cuts);

  // Debug: Vérifier l'état de la prévisualisation
  console.log("🔍 [AppViewer] État actuel:", {
    editingCutId,
    previewCut: previewCut
      ? { id: previewCut.id, type: previewCut.type }
      : null,
    showDimensionLabels: !!previewCut,
  });

  // Pas d'offset supplémentaire: on conserve les coordonnées locales (0..Ø) renvoyées par le worker telles quelles.
  const panelOffset: [number, number, number] = [0, 0, 0];

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        camera={{
          position: [500, 500, 500],
          fov: 50,
          near: 1,
          far: 10000,
        }}
        shadows
        className="h-full w-full"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} castShadow />
        <Environment preset="city" />

        <group position={panelOffset}>
          {isPanelVisible && geometry && (
            <Suspense fallback={null}>
              <PanelMesh geometry={geometry} />
            </Suspense>
          )}

          {edges.length > 0 && isPanelVisible && <EdgesLayer />}

          {/* Cotations lors de l'édition/prévisualisation d'une découpe */}
          {isPanelVisible && (
            <>
              {/* Cotations pour découpe en cours d'édition */}
              {editingCutId &&
                (() => {
                  const editingCut = cuts.find(
                    (cut) => cut.id === editingCutId
                  );
                  return editingCut ? (
                    <DimensionLabels
                      cut={editingCut}
                      panelDimensions={dimensions}
                    />
                  ) : null;
                })()}

              {/* Cotations pour découpe en prévisualisation */}
              {previewCut && (
                <DimensionLabels
                  cut={previewCut}
                  panelDimensions={dimensions}
                />
              )}
            </>
          )}
        </group>

        <AxesHelper />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          target={[0, 0, 0]}
          // Configuration stricte des contrôles souris
          mouseButtons={{
            LEFT: 0, // Clic gauche = Rotation uniquement
            MIDDLE: null, // Molette clic = Désactivé
            RIGHT: 2, // Clic droit = Pan uniquement
          }}
          // Sensibilité optimisée
          panSpeed={0.8}
          rotateSpeed={0.6}
          zoomSpeed={1.0}
          // Contraintes de rotation pour éviter les rotations indésirables
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          // Amortissement pour des mouvements plus fluides
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}

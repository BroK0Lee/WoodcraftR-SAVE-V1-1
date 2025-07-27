import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { OrbitControls, Environment } from "@react-three/drei";
import AxesHelper from "./AxesHelper";
import EdgesLayer from "./EdgesLayer";
import DimensionLabels from "./DimensionLabels";
import type { PanelGeometryDTO } from "@/helpers/shapeToGeometry";
import { usePanelStore } from "@/store/panelStore";

type Props = {
  // Plus besoin de props - on lit tout depuis le store
};

function PanelMesh({ geometry }: { geometry: PanelGeometryDTO }) {
  // Calculs optimisés des dimensions une seule fois
  const positions = geometry.positions;
  const indices = geometry.indices;
  
  // Calcul simple des dimensions sans répéter les opérations
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
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
    triangles: indices.length / 3
  };
  
  console.log('🎯 [PanelMesh] Rendu mesh:', calculatedDimensions);
  
  return (
    <mesh position={[0, 0, 0]} castShadow receiveShadow>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={geometry.positions}
          count={geometry.positions.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="index"
          array={geometry.indices}
          count={geometry.indices.length}
          itemSize={1}
        />
      </bufferGeometry>
    </mesh>
  );
}
export default function PanelViewer(_props: Props) {
  const isPanelVisible = usePanelStore((state) => state.isPanelVisible);
  const geometry = usePanelStore((state) => state.geometry);
  const edges = usePanelStore((state) => state.edges);
  const isCalculating = usePanelStore((state) => state.isCalculating);
  
  // États pour les cotations
  const dimensions = usePanelStore((state) => state.dimensions);
  const editingCutId = usePanelStore((state) => state.editingCutId);
  const previewCut = usePanelStore((state) => state.previewCut);
  const cuts = usePanelStore((state) => state.cuts);

  // Debug: Vérifier l'état de la prévisualisation
  console.log('🔍 [AppViewer] État actuel:', {
    editingCutId,
    previewCut: previewCut ? { id: previewCut.id, type: previewCut.type } : null,
    showDimensionLabels: !!previewCut
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas 
        camera={{ 
          position: [500, 500, 500],
          fov: 50,
          near: 1,
          far: 10000
        }}
        shadows 
        className="h-full w-full"
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} castShadow />
        <Environment preset="city" />

        {isPanelVisible && geometry && !isCalculating && (
          <Suspense fallback={null}>
            <PanelMesh geometry={geometry} />
          </Suspense>
        )}

        {edges.length > 0 && isPanelVisible && !isCalculating && (
          <EdgesLayer />
        )}

        {/* Cotations lors de l'édition/prévisualisation d'une découpe */}
        {isPanelVisible && (
          <>
            {/* Cotations pour découpe en cours d'édition */}
            {editingCutId && (() => {
              const editingCut = cuts.find(cut => cut.id === editingCutId);
              return editingCut ? (
                <DimensionLabels cut={editingCut} panelDimensions={dimensions} />
              ) : null;
            })()}
            
            {/* Cotations pour découpe en prévisualisation */}
            {previewCut && (
              <DimensionLabels cut={previewCut} panelDimensions={dimensions} />
            )}
          </>
        )}

        <AxesHelper />

        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          target={[0, 0, 0]}
          
          // Configuration stricte des contrôles souris
          mouseButtons={{
            LEFT: 0,   // Clic gauche = Rotation uniquement
            MIDDLE: null, // Molette clic = Désactivé
            RIGHT: 2   // Clic droit = Pan uniquement
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

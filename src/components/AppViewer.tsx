import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Suspense, useEffect, useRef, useMemo } from "react";
import {
  OrbitControls,
  Environment,
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
// ...existing code...
import AxesHelper from "./AxesHelper";
import EdgesLayer from "./EdgesLayer";
import type { EdgeDTO } from "@/models/EdgeDTO";
import type { PanelGeometryDTO } from "@/helpers/shapeToGeometry";
import { usePanelStore } from "@/store/panelStore";

import type { PanelDimensions } from "@/models/Panel";

type Props = {
  geometry: PanelGeometryDTO;
  /** Cible à viser par la caméra */
  target: [number, number, number];
  /** Dimensions du panneau pour le centrage */
  dimensions: PanelDimensions;
  /** Optional edges to display and interact with */
  edges?: EdgeDTO[];
};




function PanelMesh({ geometry, dimensions }: { geometry: PanelGeometryDTO; dimensions: PanelDimensions }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Force la recréation de la géométrie à chaque update
  useEffect(() => {
    if (meshRef.current && meshRef.current.geometry) {
      meshRef.current.geometry.dispose();
      
      // Crée une nouvelle géométrie
      const newGeometry = new THREE.BufferGeometry();
      newGeometry.setAttribute('position', new THREE.BufferAttribute(geometry.positions, 3));
      newGeometry.setIndex(new THREE.BufferAttribute(geometry.indices, 1));
      newGeometry.computeVertexNormals();
      
      meshRef.current.geometry = newGeometry;
    }
  }, [geometry, dimensions]);

  return (
    <mesh 
      ref={meshRef}
      position={[0, 0, 0.1]} 
      castShadow 
      receiveShadow
      key={`${dimensions.length}-${dimensions.width}-${dimensions.thickness}-${geometry.positions.length}`}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={geometry.positions}
          count={geometry.positions.length / 3}
          itemSize={3}
          needsUpdate={true}
        />
        <bufferAttribute
          attach="index"
          array={geometry.indices}
          count={geometry.indices.length}
          itemSize={1}
          needsUpdate={true}
        />
      </bufferGeometry>
      <meshStandardMaterial 
        color="#D2B48C" 
        roughness={0.5} 
        metalness={0} 
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function PanelViewer({ geometry, target, dimensions, edges }: Props) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  
  // État de visibilité du panneau pour debug
  const isPanelVisible = usePanelStore((state) => state.isPanelVisible);

  const boundingRadius = useMemo(() => {
    const { length, width, thickness } = dimensions;
    return Math.sqrt(length ** 2 + width ** 2 + thickness ** 2) / 2;
  }, [dimensions]);

  const cameraProps = useMemo(() => {
    const distance = boundingRadius * 2;
    return {
      position: [distance, distance, distance] as [number, number, number],
      fov: 50,
      near: 0.1,
      far: boundingRadius * 10,
    };
  }, [boundingRadius]);

  const controlsLimits = useMemo(
    () => ({
      minDistance: boundingRadius * 1.1,
      maxDistance: boundingRadius * 3,
    }),
    [boundingRadius]
  );

  const axesScale = useMemo(
    () => [
      (dimensions.length / 2) * 1.2,
      (dimensions.width / 2) * 1.4,
      Math.max(dimensions.length, dimensions.width) / 4,
    ] as [number, number, number],
    [dimensions]
  );

  useEffect(() => {
    controlsRef.current?.target.set(...target);
    controlsRef.current?.update();
  }, [target]);

  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    c.object.position.set(...cameraProps.position);
    c.update();
  }, [cameraProps]);

  return (
    <Canvas camera={cameraProps} shadows className="h-full w-full">
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.7} castShadow />
      <Environment preset="city" />

      {/* Mesh du panneau (peut être caché pour debug) */}
      {isPanelVisible && (
        <Suspense fallback={null}>
          <PanelMesh
            key={`${dimensions.length}-${dimensions.width}-${dimensions.thickness}`}
            geometry={geometry}
            dimensions={dimensions}
          />
        </Suspense>
      )}

      {/* Edges du panneau (cachés si panneau caché) */}
      {edges && isPanelVisible && (
        <EdgesLayer edges={edges} position={[0, 0, 0.1]} />
      )}

      <AxesHelper size={1} scale={axesScale} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan
        enableZoom
        enableRotate
        target={target}
        minDistance={controlsLimits.minDistance}
        maxDistance={controlsLimits.maxDistance}
      />
    </Canvas>
  );
}

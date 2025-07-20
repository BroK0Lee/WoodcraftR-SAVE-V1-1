import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useMemo, useState } from "react";
import {
  OrbitControls,
  Environment,
  OrthographicCamera,
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
import AxesHelper from "./AxesHelper";
import EdgesLayer from "./EdgesLayer";
import type { EdgeDTO } from "@/models/EdgeDTO";
import type { PanelGeometryDTO } from "@/helpers/shapeToGeometry";
import { usePanelStore } from "@/store/panelStore";
import * as THREE from "three";

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
  useEffect(() => {
    if (meshRef.current && meshRef.current.geometry) {
      meshRef.current.geometry.dispose();
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
  const [isOrtho, setIsOrtho] = useState(false);

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
      minDistance: boundingRadius * 0.1,
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

  // Calcul pour orthographic camera
  const orthoProps = useMemo(() => {
    const { length, width } = dimensions;
    const size = Math.max(length, width) * 0.6;
    return {
      left: -size,
      right: size,
      top: size,
      bottom: -size,
      near: -1000,
      far: 1000,
      position: [0, 0, size] as [number, number, number],
      zoom: 50,
    };
  }, [dimensions]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    
    // Définir le target de manière stable
    controls.target.set(...target);
    controls.update();
  }, [target]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    
    // Éviter les mises à jour de position pendant le pan
    // Seulement mettre à jour si on n'est pas en train de faire du pan
    const currentDistance = controls.object.position.distanceTo(controls.target);
    const newPosition = cameraProps.position;
    const newDistance = Math.sqrt(newPosition[0]**2 + newPosition[1]**2 + newPosition[2]**2);
    
    // Ne mettre à jour la position que si la distance a significativement changé
    if (Math.abs(currentDistance - newDistance) > 0.1) {
      controls.object.position.set(...newPosition);
      controls.update();
    }
  }, [cameraProps]);

  // Surveillance pour s'assurer que le pan ne cause pas de rotation parasite
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    let isPanning = false;

    const handleStart = (event: any) => {
      // Détecter si c'est un pan (bouton milieu ou clic droit selon la config)
      if (event?.button === 2 || (event?.button === 0 && event?.ctrlKey)) {
        isPanning = true;
        // Désactiver temporairement la rotation pendant le pan
        controls.enableRotate = false;
      }
    };

    const handleEnd = () => {
      if (isPanning) {
        isPanning = false;
        // Réactiver la rotation après le pan
        controls.enableRotate = true;
      }
    };

    const handleChange = () => {
      // Gestionnaire de changement pour les contrôles de caméra
      // Plus besoin de sauvegarder l'état - simplifié
    };

    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);
    controls.addEventListener('change', handleChange);
    
    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
      controls.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <button
        style={{ position: 'absolute', zIndex: 10, top: 10, right: 10, padding: '6px 12px', background: '#eee', borderRadius: 4 }}
        onClick={() => setIsOrtho((v) => !v)}
      >
        {isOrtho ? 'Vue Perspective' : 'Vue Orthographique'}
      </button>
      <Canvas camera={isOrtho ? undefined : cameraProps} shadows className="h-full w-full">
        {isOrtho && <OrthographicCamera makeDefault {...orthoProps} />}
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
          screenSpacePanning={true}
          panSpeed={1.0}
          rotateSpeed={1.0}
          zoomSpeed={1.0}
          enableDamping={false}
          dampingFactor={0.05}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          minAzimuthAngle={-Infinity}
          maxAzimuthAngle={Infinity}
          target={target}
          minDistance={controlsLimits.minDistance}
          maxDistance={controlsLimits.maxDistance}
        />
      </Canvas>
    </div>
  );
}

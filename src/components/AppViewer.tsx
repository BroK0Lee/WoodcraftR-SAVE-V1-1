import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useMemo } from "react";
import {
  OrbitControls,
  Environment,
  useGLTF,
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshStandardMaterial, Color } from "three";
import AxesHelper from "./AxesHelper";
import EdgesLayer from "./EdgesLayer";
import type { EdgeDTO } from "@/models/EdgeDTO";

import type { PanelDimensions } from "@/models/Panel";

type Props = {
  url: string;
  /** Cible à viser par la caméra */
  target: [number, number, number];
  /** Dimensions du panneau pour le centrage */
  dimensions: PanelDimensions;
  /** Optional edges to display and interact with */
  edges?: EdgeDTO[];
};

function Model({ url, dimensions }: Pick<Props, "url" | "dimensions">) {
  // Pré-chargement du GLB pour éviter un flash lors du chargement
  if (useGLTF.preload) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    useGLTF.preload(url);
  }

  const { scene } = useGLTF(url, true);

  // Forcer un matériau gris uniforme sur toutes les faces
  useEffect(() => {
    const monoMat = new MeshStandardMaterial({
      color: new Color(0x888888),
      roughness: 0.5,
      metalness: 0,
    });
    scene.traverse((obj) => {
      // Remplace tout material de mesh
      if ((obj as any).isMesh) {
        (obj as any).material = monoMat;
        (obj as any).castShadow = true;
        (obj as any).receiveShadow = true;
      }
    });
  }, [scene]);

  // Calcul du décalage pour centrer
  const offset = [
    -dimensions.width / 2,
    -dimensions.height / 2,
    -dimensions.thickness - 1,
  ] as const;

  return <primitive object={scene} dispose={null} position={offset} />;
}

export default function GLBViewer({ url, target, dimensions, edges }: Props) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const boundingRadius = useMemo(() => {
    const { width, height, thickness } = dimensions;
    return Math.sqrt(width ** 2 + height ** 2 + thickness ** 2) / 2;
  }, [dimensions]);

  const offset = useMemo(
    () => [
      -dimensions.width / 2,
      -dimensions.height / 2,
      -dimensions.thickness - 1,
    ] as const,
    [dimensions]
  );

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
      (dimensions.width / 2) * 1.2,
      (dimensions.height / 2) * 1.4,
      Math.max(dimensions.width, dimensions.height) / 4,
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

      <Suspense fallback={null}>
        <Model url={url} dimensions={dimensions} />
      </Suspense>

      {edges && <EdgesLayer edges={edges} position={offset} />}

      <AxesHelper size={1} scale={axesScale} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan
        enableZoom
        enableRotate
        minDistance={controlsLimits.minDistance}
        maxDistance={controlsLimits.maxDistance}
      />
    </Canvas>
  );
}

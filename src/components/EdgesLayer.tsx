import { forwardRef, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Group } from "three";
import type { EdgeDTO } from "@/models/EdgeDTO";
import useEdgeSelection from "@/hooks/useEdgeSelection";
// Fat lines imports
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

// Helper pour nettoyer les objets 3D de manière type-safe
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const disposeObject = (obj: any) => {
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) {
    if (Array.isArray(obj.material)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      obj.material.forEach((m: any) => m.dispose());
    } else {
      obj.material.dispose();
    }
  }
};

interface Props {
  edges: EdgeDTO[];
  /** Décalage identique au modèle 3D pour que la couche coïncide parfaitement */
  position?: readonly [number, number, number];
}

const EdgesLayer = forwardRef<Group, Props>(function EdgesLayer(
  { edges, position = [0, 0, 0] },
) {
  const groupRef = useRef<Group>(new Group());
  const { scene, size } = useThree();

  useEffect(() => {
    const group = groupRef.current;
    scene.add(group);
    return () => {
      scene.remove(group);
      group.children.forEach(disposeObject);
      group.clear();
    };
  }, [scene]);

  useEffect(() => {
    groupRef.current.position.set(...position);
  }, [position]);

  useEffect(() => {
    const group = groupRef.current;
    group.children.forEach(disposeObject);
    group.clear();

    edges.forEach((edge) => {
      const positions = Array.from(edge.xyz);
      const lineGeo = new LineGeometry();
      lineGeo.setPositions(positions);

      const mat2 = new LineMaterial({
        color: 0x555555,
        linewidth: 3,
        depthTest: false,
        depthWrite: false,
        polygonOffset: false,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
      mat2.resolution.set(size.width, size.height);

      const line = new LineSegments2(lineGeo, mat2);
      line.renderOrder = 999;
      line.userData.edgeId = edge.id;
      group.add(line);
    });
  }, [edges, size]);

  // Sélection des arêtes
  useEdgeSelection(groupRef.current);

  return null;
});

export default EdgesLayer;

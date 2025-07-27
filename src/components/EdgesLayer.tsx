import { forwardRef, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Group } from "three";
import { usePanelStore } from "@/store/panelStore";
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
  // Plus de props nécessaires - on lit depuis le store
}

const EdgesLayer = forwardRef<Group, Props>(function EdgesLayer(_props, _ref) {
  const groupRef = useRef<Group>(new Group());
  const { scene, size } = useThree();
  
  // Lire les edges depuis le store au lieu des props
  const edges = usePanelStore((state) => state.edges);

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
    const group = groupRef.current;
    group.children.forEach(disposeObject);
    group.clear();

    edges.forEach((edge) => {
      const positions = Array.from(edge.xyz) as number[];
      const lineGeo = new LineGeometry();
      lineGeo.setPositions(positions);
      
      const mat2 = new LineMaterial({
        color: 0x000000, // Toujours noir
        linewidth: 1, // Épaisseur de base
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        transparent: false, // Pas de transparence pour un noir constant
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

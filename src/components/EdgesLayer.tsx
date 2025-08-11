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

type Props = Record<string, never>;

const EdgesLayer = forwardRef<Group, Props>(function EdgesLayer() {
  const groupRef = useRef<Group>(new Group());
  const { size } = useThree();

  // Lire les edges depuis le store au lieu des props
  const edges = usePanelStore((state) => state.edges);

  // Le group est désormais géré par la hiérarchie R3F (pas d'ajout manuel à la scène)

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

  // Rendu: on renvoie un group afin qu'il hérite des transforms parents (panelOffset)
  return <group ref={groupRef} />;
});

export default EdgesLayer;

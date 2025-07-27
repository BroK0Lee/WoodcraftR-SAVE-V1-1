import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Group, Raycaster, Vector2, Color } from "three";
import { useEdgeSelectionStore } from "@/store/edgeSelectionStore";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";

export default function useEdgeSelection(edgesGroup: Group | null) {
  const { camera, gl } = useThree();
  const { setSelectedEdgeId, clearSelection, selectedEdgeId } = useEdgeSelectionStore((state) => state);

  const raycasterRef = useRef<Raycaster>();
  const pointer = useRef(new Vector2());
  const lastHovered = useRef<LineSegments2 | null>(null);

  useEffect(() => {
    if (!edgesGroup) return;

    const raycaster = new Raycaster();
    raycaster.params.Line.threshold = 2; // Seuil de sélection
    raycasterRef.current = raycaster;

    const canvas = gl.domElement;
    
    function handlePointerMove(event: PointerEvent) {
      if (!raycasterRef.current || !edgesGroup) return;
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(pointer.current, camera);
      const intersects = raycasterRef.current.intersectObjects(edgesGroup.children, false);

      const hoveredEdge = intersects.length > 0 ? intersects[0].object as LineSegments2 : null;
      
      // Restaurer l'arête précédente (sauf si elle est sélectionnée)
      if (lastHovered.current && lastHovered.current !== hoveredEdge) {
        const prevMat = lastHovered.current.material as LineMaterial;
        const prevId = lastHovered.current.userData.edgeId as number;
        if (prevId !== selectedEdgeId) {
          // Remettre en noir avec épaisseur normale
          prevMat.color = new Color(0x000000);
          prevMat.linewidth = 1;
        }
      }
      
      // Appliquer le survol à la nouvelle arête (sauf si elle est déjà sélectionnée)
      if (hoveredEdge) {
        const mat = hoveredEdge.material as LineMaterial;
        const id = hoveredEdge.userData.edgeId as number;
        if (id !== selectedEdgeId) {
          // Rouge avec épaisseur x10
          mat.color = new Color(0xff0000);
          mat.linewidth = 10;
        }
      }
      
      lastHovered.current = hoveredEdge;
    }
    
    function handlePointerDown(event: PointerEvent) {
      if (!raycasterRef.current || !edgesGroup) return;
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(pointer.current, camera);
      const intersects = raycasterRef.current.intersectObjects(edgesGroup.children, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as LineSegments2;
        const id = hit.userData.edgeId as number | undefined;
        if (id != null) setSelectedEdgeId(id);
      } else {
        clearSelection();
      }
    }

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerdown", handlePointerDown);
    
    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [edgesGroup, gl, camera, setSelectedEdgeId, clearSelection, selectedEdgeId]);

  // Mettre à jour l'affichage quand la sélection change
  useEffect(() => {
    if (!edgesGroup) return;
    
    edgesGroup.children.forEach((child) => {
      const lineChild = child as LineSegments2;
      const mat = lineChild.material as LineMaterial;
      const id = lineChild.userData.edgeId as number | undefined;
      
      if (id === selectedEdgeId) {
        // Arête sélectionnée : rouge avec épaisseur x10
        mat.color = new Color(0xff0000);
        mat.linewidth = 10;
      } else {
        // Arête normale : noir avec épaisseur 1
        mat.color = new Color(0x000000);
        mat.linewidth = 1;
      }
    });
  }, [selectedEdgeId, edgesGroup]);
}

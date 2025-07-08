import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Group, Raycaster, Vector2, Color } from "three";
import { useEdgeSelectionStore } from "@/store/edgeSelectionStore";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

/**
 * Hook de raycasting et mise à jour du store de sélection des arêtes
 */
export default function useEdgeSelection(edgesGroup: Group | null) {
  const { camera, gl } = useThree();
  const { setSelectedEdgeId, clearSelection, selectedEdgeId } =
    useEdgeSelectionStore((state) => state);

  const raycasterRef = useRef<Raycaster>();
  const pointer = useRef(new Vector2());
  const lastSelected = useRef<any>(null);

  useEffect(() => {
    if (!edgesGroup) return;

    const raycaster = new Raycaster();
    const sample = edgesGroup.children[0] as any;
    if (sample) {
      sample.geometry.computeBoundingSphere();
      const r = sample.geometry.boundingSphere?.radius ?? 1;
      raycaster.params.Line.threshold = Math.max(r * 0.02, 1);
    } else {
      raycaster.params.Line.threshold = 1;
    }
    raycasterRef.current = raycaster;

    const canvas = gl.domElement;
    function handlePointerDown(event: PointerEvent) {
      if (!raycasterRef.current || !edgesGroup) return;
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(pointer.current, camera);
      const intersects = raycasterRef.current.intersectObjects(
        edgesGroup.children,
        false,
      );

      if (intersects.length > 0) {
        const hit = intersects[0].object as any;
        if (lastSelected.current && lastSelected.current !== hit) {
          const prevMat = lastSelected.current.material as LineMaterial;
          prevMat.color = new Color(0x555555);
          prevMat.linewidth = 3;
        }
        lastSelected.current = hit;
        const mat = hit.material as LineMaterial;
        mat.color = new Color(0xff0000);
        mat.linewidth = 5;
        const id = hit.userData.edgeId as number | undefined;
        if (id != null) setSelectedEdgeId(id);
      } else {
        if (lastSelected.current) {
          const mat = lastSelected.current.material as LineMaterial;
          mat.color = new Color(0x555555);
          mat.linewidth = 3;
          lastSelected.current = null;
        }
        clearSelection();
      }
    }

    canvas.addEventListener("pointerdown", handlePointerDown);
    return () => canvas.removeEventListener("pointerdown", handlePointerDown);
  }, [edgesGroup, gl, camera, setSelectedEdgeId, clearSelection]);

  useEffect(() => {
    if (!edgesGroup) return;
    edgesGroup.children.forEach((child: any) => {
      const mat = child.material as LineMaterial;
      const id = child.userData.edgeId as number | undefined;
      if (id === selectedEdgeId) {
        mat.color = new Color(0xff0000);
        mat.linewidth = 5;
        lastSelected.current = child;
      } else {
        mat.color = new Color(0x555555);
        mat.linewidth = 3;
      }
    });
  }, [selectedEdgeId, edgesGroup]);
}

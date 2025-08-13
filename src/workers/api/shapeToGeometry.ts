// Conversion d'un TopoDS_Shape OpenCascade.js en BufferGeometry utilisable dans Three.js
// Déplacé depuis src/helpers -> src/workers/api (cohérence worker)

import type { TopoDS_Shape } from "opencascade.js";
import type { Poly_MeshPurpose } from "@/workers/worker.types";

export interface PanelGeometryDTO {
  positions: Float32Array;
  indices: Uint32Array | Uint16Array;
  normals?: Float32Array;
  uvs?: Float32Array;
}

// Convertit un TopoDS_Shape en données BufferGeometry (positions, indices, etc.)
export function shapeToGeometry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oc: any,
  shape: TopoDS_Shape,
  purpose: Poly_MeshPurpose = 0
): PanelGeometryDTO {
  const mesh = new oc.BRepMesh_IncrementalMesh_2(shape, 0.5, false, 0.5, true);
  const progress = new oc.Message_ProgressRange_1();
  mesh.Perform(progress);

  const faces: unknown[] = [];
  const explorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_FACE,
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
  );
  while (explorer.More()) {
    faces.push(oc.TopoDS.Face_1(explorer.Current()));
    explorer.Next();
  }

  const positions: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  for (const face of faces) {
    const location = new oc.TopLoc_Location_1();
    let triangulation: unknown;
    try {
      triangulation = oc.BRep_Tool.Triangulation(face, location, purpose);
    } catch {
      continue;
    }
    if (triangulation && typeof triangulation === "object") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (triangulation as any).get === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        triangulation = (triangulation as any).get();
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!triangulation || (triangulation as any).IsNull?.()) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nbNodes = (triangulation as any).NbNodes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nbTriangles = (triangulation as any).NbTriangles();

    const trsf =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      location && typeof (location as any).Transformation === "function"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (location as any).Transformation()
        : null;

    for (let i = 1; i <= nbNodes; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const node = (triangulation as any).Node(i);
      if (trsf) {
        const p = new oc.gp_Pnt_3(node.X(), node.Y(), node.Z());
        if (typeof p.Transform_1 === "function") p.Transform_1(trsf);
        else if (typeof p.Transform === "function") p.Transform(trsf);
        positions.push(p.X(), p.Y(), p.Z());
      } else {
        positions.push(node.X(), node.Y(), node.Z());
      }
    }
    for (let i = 1; i <= nbTriangles; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tri = (triangulation as any).Triangle(i);
      indices.push(
        tri.Value(1) - 1 + vertexOffset,
        tri.Value(2) - 1 + vertexOffset,
        tri.Value(3) - 1 + vertexOffset
      );
    }
    vertexOffset += nbNodes;
  }

  return {
    positions: new Float32Array(positions),
    indices:
      positions.length / 3 > 65535
        ? new Uint32Array(indices)
        : new Uint16Array(indices),
  };
}

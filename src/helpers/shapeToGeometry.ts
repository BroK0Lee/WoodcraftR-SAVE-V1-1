// Conversion d'un TopoDS_Shape OpenCascade.js en BufferGeometry utilisable dans Three.js
// Cette fonction doit être appelée dans le worker OCC

import type { TopoDS_Shape } from "opencascade.js";
import type { Poly_MeshPurpose } from "@/workers/worker.types";

export interface PanelGeometryDTO {
  positions: Float32Array;
  indices: Uint32Array | Uint16Array;
  normals?: Float32Array;
  uvs?: Float32Array;
}

/**
 * Convertit un TopoDS_Shape en données BufferGeometry (positions, indices, etc.)
 * @param oc instance OpenCascade.js
 * @param shape shape à convertir
 * @returns PanelGeometryDTO
 */
// On ajoute un paramètre optionnel purpose pour la robustesse
export function shapeToGeometry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oc: any, // OpenCascade.js instance - complex typing
  shape: TopoDS_Shape,
  purpose: Poly_MeshPurpose = 0 // Poly_MeshPurpose.NONE par défaut
): PanelGeometryDTO {
  // Exemple minimal : triangulation automatique de la shape
  // (À adapter selon la qualité de la triangulation souhaitée)
  const mesh = new oc.BRepMesh_IncrementalMesh_2(shape, 0.5, false, 0.5, true);
  const progress = new oc.Message_ProgressRange_1();
  mesh.Perform(progress);

  // Parcours des faces pour extraire la géométrie
  const faces = [];
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
    // Correction : on passe bien 3 arguments à Triangulation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let triangulation: any;
    try {
      triangulation = oc.BRep_Tool.Triangulation(face, location, purpose);
    } catch {
      // Skip face if triangulation fails
      continue;
    }
    if (triangulation && typeof triangulation === "object") {
      if (typeof triangulation.get === "function") {
        triangulation = triangulation.get();
      }
    }
    if (!triangulation || triangulation.IsNull?.()) continue;

    // Extraction via les méthodes du binding JS (Node/NbNodes, Triangle/NbTriangles)
    const nbNodes = triangulation.NbNodes();
    const nbTriangles = triangulation.NbTriangles();

    // Transformation de repère éventuelle (placement de la face)
    // Certaines formes (ex: cylindre translaté) possèdent un TopLoc_Location
    // qu'il faut appliquer pour obtenir des coordonnées globales cohérentes
    const trsf =
      location && typeof location.Transformation === "function"
        ? location.Transformation()
        : null;

    // Ajout des sommets (avec application du TopLoc_Location si présent)
    for (let i = 1; i <= nbNodes; i++) {
      const node = triangulation.Node(i);
      if (trsf) {
        const p = new oc.gp_Pnt_3(node.X(), node.Y(), node.Z());
        // Méthode binding: suffixe _1 pour Transform
        if (typeof p.Transform_1 === "function") {
          p.Transform_1(trsf);
        } else if (typeof p.Transform === "function") {
          p.Transform(trsf);
        }
        positions.push(p.X(), p.Y(), p.Z());
      } else {
        positions.push(node.X(), node.Y(), node.Z());
      }
    }
    // Ajout des indices
    for (let i = 1; i <= nbTriangles; i++) {
      const tri = triangulation.Triangle(i);
      // Attention : OpenCascade utilise des indices 1-based
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
    // Normales et UVs peuvent être ajoutées ici si besoin
  };
}

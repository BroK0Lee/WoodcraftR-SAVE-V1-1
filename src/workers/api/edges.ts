// edges.ts
// Extraction de la logique getEdges depuis occ.worker
import type { EdgeDTO } from "@/models/EdgeDTO";
import type { TopoDS_Shape } from "opencascade.js";
import type { OCCLike } from "./occtypes";
import { assertOc } from "./occtypes";

export function getEdges(
  oc: OCCLike | null,
  shape: TopoDS_Shape,
  tolerance: number
): EdgeDTO[] {
  assertOc(oc);
  const TopAbs_EDGE = oc.TopAbs_ShapeEnum?.TopAbs_EDGE ?? 2;
  const TopAbs_SHAPE = oc.TopAbs_ShapeEnum?.TopAbs_SHAPE ?? 7;
  const explorer = new oc.TopExp_Explorer_2!(
    shape,
    TopAbs_EDGE as number,
    TopAbs_SHAPE as number
  );
  const result: EdgeDTO[] = [];
  let id = 0;
  while (explorer.More()) {
    const edge = oc.TopoDS!.Edge_1(explorer.Current());
    const adaptor = new oc.BRepAdaptor_Curve_2!(edge);
    const discretizer = new oc.GCPnts_UniformDeflection_2!(
      adaptor,
      tolerance,
      false
    );
    if (discretizer.IsDone()) {
      const nb = discretizer.NbPoints();
      const points = new Float32Array(nb * 3);
      for (let i = 1; i <= nb; i++) {
        const pnt = discretizer.Value(i);
        const base = (i - 1) * 3;
        points[base] = pnt.X();
        points[base + 1] = pnt.Y();
        points[base + 2] = pnt.Z();
      }
      result.push({ id, xyz: points });
      id += 1;
    }
    explorer.Next();
  }
  return result;
}

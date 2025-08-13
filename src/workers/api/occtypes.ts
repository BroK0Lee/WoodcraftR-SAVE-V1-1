import type { TopoDS_Shape } from "opencascade.js";

// Interface minimale pour gp_Trsf (structure utilisée par notre code)
interface GpTrsfLike { SetTranslation_1(v: unknown): void }

// Interface partagée minimaliste décrivant UNIQUEMENT les membres OCC utilisés.
// Chaque propriété est optionnelle pour tolérer des variantes de build; les fonctions doivent vérifier oc.
export interface OCCLike {
  // Primitives
  BRepPrimAPI_MakeBox_2?: new (l: number, w: number, h: number) => {
    Shape(): TopoDS_Shape;
  };
  BRepPrimAPI_MakeCylinder_2?: new (r: number, h: number, angle: number) => {
    Shape(): TopoDS_Shape;
  };

  // Transforms
  gp_Trsf_1?: new () => GpTrsfLike;
  gp_Vec_4?: new (x: number, y: number, z: number) => unknown;
  BRepBuilderAPI_Transform_2?: new (
    shape: TopoDS_Shape,
    trsf: GpTrsfLike,
    copy: boolean
  ) => { Shape(): TopoDS_Shape };

  // Boolean
  BRepAlgoAPI_Cut_3?: new (a: TopoDS_Shape, b: TopoDS_Shape, pr: unknown) => {
    Build(pr: unknown): void;
    IsDone(): boolean;
    Shape(): TopoDS_Shape;
  };
  Message_ProgressRange_1?: new () => unknown;

  // Edges enumeration & discretisation
  TopAbs_ShapeEnum?: { TopAbs_EDGE: number; TopAbs_SHAPE: number };
  TopExp_Explorer_2?: new (
    shape: TopoDS_Shape,
    what: number,
    until: number
  ) => { More(): boolean; Current(): unknown; Next(): void };
  TopoDS?: { Edge_1(cur: unknown): TopoDS_Shape };
  BRepAdaptor_Curve_2?: new (edge: TopoDS_Shape) => unknown;
  GCPnts_UniformDeflection_2?: new (
    adaptor: unknown,
    tol: number,
    param: boolean
  ) => {
    IsDone(): boolean;
    NbPoints(): number;
    Value(i: number): { X(): number; Y(): number; Z(): number };
  };
}

export function assertOc<T extends OCCLike | null | undefined>(
  oc: T
): asserts oc is Exclude<T, null | undefined> {
  if (!oc) throw new Error("OpenCascade not ready");
}

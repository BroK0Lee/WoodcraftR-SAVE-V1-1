import type { TopoDS_Shape, gp_Trsf, gp_Vec } from "opencascade.js";

// Interface partagée minimaliste décrivant UNIQUEMENT les membres OCC utilisés.
// Chaque propriété est optionnelle pour tolérer des variantes de build; les fonctions doivent vérifier oc.
// Type structurel minimal compatible avec gp_Vec réel
type GpVecLike = gp_Vec; // on référence directement pour compat stricte

export interface OCCLike {
  // Primitives
  BRepPrimAPI_MakeBox_2?: new (l: number, w: number, h: number) => {
    Shape(): TopoDS_Shape;
  };
  BRepPrimAPI_MakeCylinder_2?: new (r: number, h: number, angle: number) => {
    Shape(): TopoDS_Shape;
  };

  // Transforms
  gp_Trsf_1?: new () => gp_Trsf;
  gp_Vec_4?: new (x: number, y: number, z: number) => GpVecLike;
  gp_Pnt_3?: new (x: number, y: number, z: number) => unknown;
  gp_Dir_4?: new (x: number, y: number, z: number) => unknown;
  gp_Ax1_2?: new (p: unknown, d: unknown) => unknown;

  BRepBuilderAPI_Transform_2?: new (
    shape: TopoDS_Shape,
    trsf: gp_Trsf,
    copy: boolean
  ) => { Shape(): TopoDS_Shape };

  // Compound
  TopoDS_Compound?: new () => TopoDS_Shape;
  BRep_Builder?: new () => {
    MakeCompound(c: TopoDS_Shape): void;
    Add(c: TopoDS_Shape, s: TopoDS_Shape): void;
  };

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

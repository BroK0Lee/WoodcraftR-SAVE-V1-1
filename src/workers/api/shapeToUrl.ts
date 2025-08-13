import { OpenCascadeInstance, TopoDS_Shape } from "opencascade.js";

// Déplacé depuis src/helpers -> src/workers/api
export default function shapeToUrl(
  oc: OpenCascadeInstance,
  shape: TopoDS_Shape
) {
  const docHandle = new oc.Handle_TDocStd_Document_2(
    new oc.TDocStd_Document(new oc.TCollection_ExtendedString_1())
  );
  const shapeTool = oc.XCAFDoc_DocumentTool.ShapeTool(
    docHandle.get().Main()
  ).get();
  shapeTool.SetShape(shapeTool.NewShape(), shape);
  new oc.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.1, false);
  const cafWriter = new oc.RWGltf_CafWriter(
    new oc.TCollection_AsciiString_2("./file.glb"),
    true
  );
  cafWriter.Perform_2(
    docHandle,
    new oc.TColStd_IndexedDataMapOfStringString_1(),
    new oc.Message_ProgressRange_1()
  );
  const glbFile = oc.FS.readFile("./file.glb", { encoding: "binary" });
  const src = glbFile as Uint8Array;
  const ab = new ArrayBuffer(src.byteLength);
  new Uint8Array(ab).set(src);
  return URL.createObjectURL(new Blob([ab], { type: "model/gltf-binary" }));
}

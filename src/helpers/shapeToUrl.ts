import { OpenCascadeInstance, TopoDS_Shape } from "opencascade.js";

/**
 * Converts a TopoDS_Shape to a GLB file and returns an ObjectURL for download or preview.
 * @param oc OpenCascade.js instance
 * @param shape The shape to export
 * @returns ObjectURL pointing to the generated GLB file
 */
export default function shapeToUrl(
  oc: OpenCascadeInstance,
  shape: TopoDS_Shape
) {
  // Create a new XCAF document and add the shape
  const docHandle = new oc.Handle_TDocStd_Document_2(
    new oc.TDocStd_Document(new oc.TCollection_ExtendedString_1())
  );
  const shapeTool = oc.XCAFDoc_DocumentTool.ShapeTool(
    docHandle.get().Main()
  ).get();
  shapeTool.SetShape(shapeTool.NewShape(), shape);

  // Request meshing for the shape (required for export)
  new oc.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.1, false);

  // Export the document to a GLB file (this also triggers meshing if not already done)
  const cafWriter = new oc.RWGltf_CafWriter(
    new oc.TCollection_AsciiString_2("./file.glb"),
    true
  );
  cafWriter.Perform_2(
    docHandle,
    new oc.TColStd_IndexedDataMapOfStringString_1(),
    new oc.Message_ProgressRange_1()
  );

  // Read the GLB file from the in-memory virtual file system
  const glbFile = oc.FS.readFile("./file.glb", { encoding: "binary" });

  // Return a Blob URL for the GLB file (MIME type: model/gltf-binary)
  return URL.createObjectURL(
    new Blob([glbFile.buffer], { type: "model/gltf-binary" })
  );
}

export const CAD_FILE_LIMIT = 20 * 1024 * 1024;
export const CAD_TRIANGLE_LIMIT = 500000;
export function validateCadBytes(buffer, name) {
  if (
    !(buffer instanceof ArrayBuffer) ||
    buffer.byteLength > CAD_FILE_LIMIT ||
    buffer.byteLength < 15
  )
    throw Error("Choose a non-empty GLB or STL file of at most 20 MB.");
  const extension = name.toLowerCase().split(".").pop(),
    view = new DataView(buffer);
  if (extension === "glb") {
    if (
      buffer.byteLength < 20 ||
      view.getUint32(0, true) !== 0x46546c67 ||
      view.getUint32(4, true) !== 2 ||
      view.getUint32(8, true) !== buffer.byteLength
    )
      throw Error("This is not a valid GLB 2.0 file.");
    const length = view.getUint32(12, true);
    if (
      view.getUint32(16, true) !== 0x4e4f534a ||
      length < 2 ||
      20 + length > buffer.byteLength
    )
      throw Error("The GLB JSON chunk is invalid.");
    let doc;
    try {
      doc = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(
          new Uint8Array(buffer, 20, length),
        ),
      );
    } catch {
      throw Error("The GLB metadata could not be read.");
    }
    if (doc.asset?.version !== "2.0")
      throw Error("Export this model as GLB 2.0.");
    if ((doc.nodes?.length || 0) > 256 || (doc.meshes?.length || 0) > 128)
      throw Error("Use a simpler model with at most 128 meshes and 256 nodes.");
    if (doc.animations?.length || doc.skins?.length)
      throw Error("Export a static, unskinned model for this inspector.");
    if (
      doc.images?.length ||
      doc.textures?.length ||
      doc.buffers?.some((b) => b.uri)
    )
      throw Error(
        "Use a self-contained, untextured GLB. External resources and textures are not loaded.",
      );
    if (
      (doc.extensionsRequired || []).some((e) =>
        /draco|meshopt|basisu|gpu_instancing/i.test(e),
      )
    )
      throw Error(
        "Export an uncompressed GLB; compressed geometry is not supported.",
      );
    let triangles = 0;
    for (const mesh of doc.meshes || [])
      for (const primitive of mesh.primitives || []) {
        if (primitive.targets?.length)
          throw Error("Export the base mesh without morph targets.");
        if (primitive.mode !== undefined && primitive.mode !== 4)
          throw Error("Only triangle mesh GLB models are supported.");
        const accessor =
          doc.accessors?.[primitive.indices ?? primitive.attributes?.POSITION];
        triangles += (accessor?.count || 0) / 3;
      }
    if (triangles > CAD_TRIANGLE_LIMIT)
      throw Error("Simplify the model to at most 500,000 triangles.");
    return { format: "glb", document: doc };
  }
  if (extension === "stl") {
    let count = 0;
    if (
      buffer.byteLength >= 84 &&
      84 + view.getUint32(80, true) * 50 === buffer.byteLength
    )
      count = view.getUint32(80, true);
    else {
      const text = new TextDecoder().decode(buffer);
      if (!/^\s*solid\b/i.test(text))
        throw Error("This is not a valid binary or ASCII STL.");
      count = (text.match(/\bfacet\s+normal\b/gi) || []).length;
    }
    if (!count || count > CAD_TRIANGLE_LIMIT)
      throw Error("Use an STL with 1–500,000 triangles.");
    return { format: "stl" };
  }
  throw Error(
    "Choose a .glb or .stl model. STEP requires conversion to a mesh first.",
  );
}

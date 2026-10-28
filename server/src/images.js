import sharp from "sharp";
const formats = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};
const fail = (status, message) => Object.assign(Error(message), { status });
export async function normalizeUploadImages(
  files,
  idForIndex = (i) => `image-${i + 1}`,
) {
  const images = [];
  for (const [i, f] of files.entries()) {
    if (!formats[f.mimetype])
      throw fail(415, "Only JPEG, PNG and WebP images are supported.");
    try {
      const meta = await sharp(f.buffer, {
        limitInputPixels: 20000000,
        animated: false,
      }).metadata();
      if (meta.format !== formats[f.mimetype] || (meta.pages || 1) > 1)
        throw fail(
          415,
          "Image content must match its MIME type and must not be animated.",
        );
      const { data, info } = await sharp(f.buffer, {
        limitInputPixels: 20000000,
      })
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer({ resolveWithObject: true });
      images.push({
        id: idForIndex(i),
        width: info.width,
        height: info.height,
        dataUrl: `data:image/jpeg;base64,${data.toString("base64")}`,
      });
    } catch (e) {
      if (e.status) throw e;
      throw fail(
        415,
        "An image could not be decoded or exceeds the 20 megapixel limit.",
      );
    }
  }
  return images;
}

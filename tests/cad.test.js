import test from "node:test";
import assert from "node:assert/strict";
import { writeFile, mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { makeCadFixture } from "./helpers/cadFixture.js";
import {
  validateCadBytes,
  CAD_FILE_LIMIT,
} from "../frontend/src/lib/cadFiles.js";
test("static self-contained GLB is accepted; external resources, textures, animation and oversized input are rejected", () => {
  assert.equal(
    validateCadBytes(makeCadFixture(), "assembly.GLB").format,
    "glb",
  );
  for (const patch of [
    { buffers: [{ uri: "https://example.com/private.bin" }] },
    { images: [{ uri: "https://example.com/tracker.png" }] },
    { textures: [{}] },
    { animations: [{}] },
    { skins: [{}] },
    { extensionsRequired: ["EXT_mesh_gpu_instancing"] },
  ])
    assert.throws(() => validateCadBytes(makeCadFixture(patch), "bad.glb"));
  assert.throws(() =>
    validateCadBytes(new ArrayBuffer(CAD_FILE_LIMIT + 1), "huge.glb"),
  );
  const invalid = makeCadFixture();
  new DataView(invalid).setUint32(8, 24, true);
  assert.throws(() => validateCadBytes(invalid, "truncated.glb"));
  assert.throws(() => validateCadBytes(makeCadFixture(), "model.step"));
});
test("STL validates actual format and the included PiCar reference has a bounded triangle count", async () => {
  const bytes = await readFile(
    new URL(
      "../frontend/public/models/picar-reference-chassis.stl",
      import.meta.url,
    ),
  );
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  assert.equal(validateCadBytes(buffer, "picar.stl").format, "stl");
  const empty = new TextEncoder().encode(
    "solid empty\nendsolid empty\n",
  ).buffer;
  assert.throws(() => validateCadBytes(empty, "empty.stl"));
  const fake = new TextEncoder().encode("this is not a model file").buffer;
  assert.throws(() => validateCadBytes(fake, "fake.stl"));
});
test("adapted CAD Showcase statistics compose translation, rotation and scale in glTF order", async () => {
  const dir = await mkdtemp(join(tmpdir(), "realitylab-cad-stats-"));
  try {
    const file = join(dir, "transformed.glb");
    await writeFile(
      file,
      Buffer.from(
        makeCadFixture({
          scenes: [{ nodes: [0] }],
          nodes: [{ mesh: 0, translation: [10, 20, 30], scale: [2, 3, 4] }],
        }),
      ),
    );
    const { stdout } = await promisify(execFile)("python3", [
      "scripts/vendor/cad_showcase_glb_stats.py",
      file,
      "--json",
    ]);
    const [stats] = JSON.parse(stdout);
    assert.equal(stats.triangles, 12);
    assert.deepEqual(stats.bboxGlb, [
      [9, 18.5, 28],
      [11, 21.5, 32],
    ]);
    assert.deepEqual(stats.sizeGlb, [2, 3, 4]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

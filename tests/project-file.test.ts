import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projectFileSchema, restoreProject } from "../lib/project-file.ts";

const scan = JSON.parse(
  readFileSync(new URL("../public/demos/fan.json", import.meta.url), "utf8"),
);
const lesson = JSON.parse(
  readFileSync(
    new URL("../public/demos/fan-learning.json", import.meta.url),
    "utf8",
  ),
);
function project(): any {
  return {
    kind: "realitylab-investigation",
    version: 1,
    exported_at: "2026-10-29T12:00:00.000Z",
    notice: "Restorable project.",
    scan,
    photos: [{ id: "demo-fan", width: 1536, height: 1024, included: false }],
    workspace: {
      selected: "part-1",
      image: 0,
      view: "blueprint",
      adjustments: {},
    },
    learning: {
      recorded: true,
      lesson,
      answers: [],
      completed: [0],
      observations: [],
    },
  };
}

test("validates and restores a photo-free project without inventing image evidence", () => {
  const parsed = projectFileSchema.parse(project());
  const restored = restoreProject(parsed);
  assert.equal(restored.scan.photos[0].url, "/photo-omitted.svg");
  assert.equal(restored.scan.photos[0].omitted, true);
  assert.equal(
    restored.learning?.lesson?.meta.requestId,
    lesson.meta.requestId,
  );
  assert.equal(restored.photosIncluded, 0);
});
test("rejects broken component, lesson and observation references", () => {
  const broken = project();
  broken.workspace.selected = "missing-part";
  assert.equal(projectFileSchema.safeParse(broken).success, false);
  const wrongLesson = project();
  wrongLesson.learning!.lesson.source_request_id =
    "15031ca6-451f-4ec9-a996-7ee1fc705f54";
  assert.equal(projectFileSchema.safeParse(wrongLesson).success, false);
});
test("rejects fake embedded image bytes and unsupported versions", () => {
  const fake = project();
  fake.photos[0] = {
    ...fake.photos[0],
    included: true,
    data_url: "data:image/png;base64,ZmFrZQ==",
  };
  assert.equal(projectFileSchema.safeParse(fake).success, false);
  const future = { ...project(), version: 2 };
  assert.equal(projectFileSchema.safeParse(future).success, false);
});

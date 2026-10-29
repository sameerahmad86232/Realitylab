import { z } from "zod";
import {
  scanResultSchema,
  type ScanView,
  type WorkspaceState,
} from "./analysis.ts";
import { learningDraftSchema, type LearningDraft } from "./learning-cache.ts";
import { validLearning } from "./learning.ts";
import { observationsFor } from "./observations.ts";

export const PROJECT_KIND = "realitylab-investigation";
export const PROJECT_VERSION = 1;
const marker = z
  .object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
  .strict();
const photo = z
  .object({
    id: z.string().trim().min(1).max(80),
    width: z.number().int().min(1).max(10000),
    height: z.number().int().min(1).max(10000),
    included: z.boolean(),
    data_url: z.string().max(8_000_000).optional(),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.included !== Boolean(p.data_url))
      ctx.addIssue({
        code: "custom",
        message: "Photo inclusion flag does not match its data.",
      });
    if (
      p.data_url &&
      !/^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(p.data_url)
    )
      ctx.addIssue({
        code: "custom",
        message: "Only embedded JPEG or PNG photos are accepted.",
      });
    if (
      p.data_url?.startsWith("data:image/jpeg") &&
      !p.data_url.startsWith("data:image/jpeg;base64,/9j/")
    )
      ctx.addIssue({
        code: "custom",
        message: "Embedded JPEG signature is invalid.",
      });
    if (
      p.data_url?.startsWith("data:image/png") &&
      !p.data_url.startsWith("data:image/png;base64,iVBORw0KGgo")
    )
      ctx.addIssue({
        code: "custom",
        message: "Embedded PNG signature is invalid.",
      });
    if (p.width * p.height > 20_000_000)
      ctx.addIssue({
        code: "custom",
        message: "Embedded photo dimensions are too large.",
      });
  });
const workspace = z
  .object({
    selected: z.string().max(40),
    image: z.number().int().min(0).max(2),
    view: z.enum(["photo", "map", "blueprint"]),
    adjustments: z.record(z.string().max(40), marker),
  })
  .strict();
const clientTiming = z
  .object({ totalMs: z.number().nonnegative().finite() })
  .strict();
const recorded = z
  .object({
    sourceUrl: z
      .string()
      .url()
      .max(1000)
      .refine(
        (value) => value.startsWith("https://"),
        "Recorded sources must use HTTPS.",
      ),
    author: z.string().trim().min(1).max(200),
    license: z.string().trim().min(1).max(100),
  })
  .strict();
export const projectFileSchema = z
  .object({
    kind: z.literal(PROJECT_KIND),
    version: z.literal(PROJECT_VERSION),
    exported_at: z.string().datetime(),
    notice: z.string().max(600),
    scan: scanResultSchema,
    recorded: recorded.optional(),
    photos: z.array(photo).min(1).max(3),
    workspace,
    client_timing: clientTiming.optional(),
    learning: learningDraftSchema.optional(),
  })
  .strict()
  .superRefine((p, ctx) => {
    const ids = new Set(p.scan.analysis.components.map((part) => part.id));
    if (new Set(p.photos.map((photo) => photo.id)).size !== p.photos.length)
      ctx.addIssue({ code: "custom", message: "Photo IDs must be unique." });
    if (
      p.scan.analysis.components.some(
        (part) =>
          part.image_index !== null && part.image_index >= p.photos.length,
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Component source view does not exist.",
      });
    if (p.workspace.selected && !ids.has(p.workspace.selected))
      ctx.addIssue({
        code: "custom",
        message: "Selected component does not exist.",
      });
    if (p.workspace.image >= p.photos.length)
      ctx.addIssue({
        code: "custom",
        message: "Selected photo does not exist.",
      });
    for (const [id, value] of Object.entries(p.workspace.adjustments)) {
      const part = p.scan.analysis.components.find((item) => item.id === id);
      if (
        !part?.observed ||
        part.image_index === null ||
        part.image_index >= p.photos.length ||
        !value
      )
        ctx.addIssue({
          code: "custom",
          message: "Marker adjustment does not match an observed component.",
        });
    }
    if (!p.learning) return;
    const source = p.scan.meta.requestId,
      lesson = p.learning.lesson;
    if (
      lesson &&
      (lesson.source_request_id !== source ||
        !validLearning(lesson.learning, {
          analysis: p.scan.analysis,
          source_request_id: source,
          kind: "lesson",
          question: "",
          consent: true,
        }))
    )
      ctx.addIssue({
        code: "custom",
        message: "Saved lesson does not belong to this scan.",
      });
    if (
      lesson &&
      observationsFor(lesson, p.learning.observations || []).length !==
        (p.learning.observations || []).length
    )
      ctx.addIssue({
        code: "custom",
        message: "Saved observations do not match the lesson steps.",
      });
    if (
      new Set(p.learning.completed).size !== p.learning.completed.length ||
      p.learning.completed.some(
        (i) => !lesson || i >= lesson.learning.steps.length,
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Saved completion markers do not match the lesson.",
      });
    for (const answer of p.learning.answers) {
      const request = {
        analysis: p.scan.analysis,
        source_request_id: source,
        kind: "question" as const,
        question: answer.question,
        consent: true as const,
        ...(answer.observation_context
          ? { observation_context: answer.observation_context }
          : {}),
      };
      if (
        answer.result.source_request_id !== source ||
        !validLearning(answer.result.learning, request)
      )
        ctx.addIssue({
          code: "custom",
          message: "Saved answer does not belong to this scan.",
        });
    }
  });
export type ProjectFile = z.infer<typeof projectFileSchema>;

async function photoData(url: string) {
  const response = await fetch(url);
  if (!response.ok)
    throw Error(
      "One source photo is no longer available. Save without photos or return to the original scan.",
    );
  const blob = await response.blob();
  if (!["image/jpeg", "image/png"].includes(blob.type) || blob.size > 6_000_000)
    throw Error("Only prepared JPEG or PNG photos up to 6 MB can be included.");
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(Error("A source photo could not be read."));
    reader.readAsDataURL(blob);
  });
}
export async function makeProjectFile(
  scan: ScanView,
  state: Required<WorkspaceState>,
  learning: LearningDraft | undefined,
  includePhotos: boolean,
): Promise<ProjectFile> {
  const photos = await Promise.all(
    scan.photos.map(async (p) => ({
      id: p.id,
      width: p.width,
      height: p.height,
      included: includePhotos && !p.omitted,
      ...(includePhotos && !p.omitted
        ? { data_url: await photoData(p.url) }
        : {}),
    })),
  );
  const candidate = {
    kind: PROJECT_KIND,
    version: PROJECT_VERSION,
    exported_at: new Date().toISOString(),
    notice:
      "Restorable RealityLab investigation. Model output and user notes are not independent verification. Photos are embedded only when explicitly included.",
    scan: scan.result,
    ...(scan.recorded ? { recorded: scan.recorded } : {}),
    photos,
    workspace: {
      selected: state.selected,
      image: state.image,
      view: state.view,
      adjustments: state.adjustments,
    },
    ...(scan.clientTiming ? { client_timing: scan.clientTiming } : {}),
    ...(learning ? { learning } : {}),
  };
  return projectFileSchema.parse(candidate);
}
export function restoreProject(value: unknown) {
  const parsed = projectFileSchema.parse(value);
  const omitted = "/photo-omitted.svg";
  const scan: ScanView = {
    result: parsed.scan,
    photos: parsed.photos.map((p) => ({
      id: p.id,
      width: p.width,
      height: p.height,
      url: p.data_url || omitted,
      omitted: !p.data_url,
    })),
    workspace: parsed.workspace,
    ...(parsed.client_timing ? { clientTiming: parsed.client_timing } : {}),
    ...(parsed.recorded ? { recorded: parsed.recorded } : {}),
  };
  return {
    scan,
    learning: parsed.learning,
    photosIncluded: parsed.photos.filter((p) => p.included).length,
  };
}
export async function verifyProjectPhotos(project: ProjectFile) {
  for (const photo of project.photos) {
    const data = photo.data_url;
    if (!data) continue;
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () =>
        image.naturalWidth === photo.width &&
        image.naturalHeight === photo.height
          ? resolve()
          : reject(
              Error(
                "An embedded photo does not match its declared dimensions.",
              ),
            );
      image.onerror = () =>
        reject(Error("An embedded photo could not be decoded."));
      image.src = data;
    });
  }
}

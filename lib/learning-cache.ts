import { z } from "zod";
import { observationSchema, type Observation } from "./observations.ts";
import {
  learningResponseSchema,
  observationContextSchema,
  type LearningResponse,
  type ObservationContext,
} from "./learning.ts";
export type LearningAnswer = {
  question: string;
  result: LearningResponse;
  observation_context?: ObservationContext;
};
export type LearningDraft = {
  recorded?: boolean;
  observations?: Observation[];
  lesson: LearningResponse | null;
  answers: LearningAnswer[];
  completed: number[];
};
export const learningAnswerSchema = z
  .object({
    question: z.string().trim().min(1).max(600),
    result: learningResponseSchema,
    observation_context: observationContextSchema.optional(),
  })
  .strict();
export const learningDraftSchema = z
  .object({
    recorded: z.boolean().optional(),
    observations: z.array(observationSchema).max(7).optional(),
    lesson: learningResponseSchema.nullable(),
    answers: z.array(learningAnswerSchema).max(5),
    completed: z.array(z.number().int().min(0).max(6)).max(7),
  })
  .strict();
// Tab-memory only. No photos, localStorage, server persistence or cross-user cache.
const drafts = new Map<string, LearningDraft>();
export function getLearningDraft(id: string) {
  return drafts.get(id);
}
export function saveLearningDraft(id: string, draft: LearningDraft) {
  drafts.delete(id);
  drafts.set(id, draft);
  while (drafts.size > 6) drafts.delete(drafts.keys().next().value!);
}

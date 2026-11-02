import { stageEventSchema, type StageEvent } from "./orchestration.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function errorMessage(value: unknown, fallback: string): string {
  return isRecord(value) && isRecord(value.error) && typeof value.error.message === "string"
    ? value.error.message : fallback;
}

/** Reads split UTF-8/NDJSON frames; a lost stream can never become a successful result. */
export async function readScanResponse(response: Response, onStage: (event: StageEvent) => void): Promise<unknown> {
  if (!response.headers.get("content-type")?.includes("application/x-ndjson")) {
    let body: unknown;
    try { body = await response.json(); }
    catch { throw Error("The scan service returned an empty or unreadable response. Your photos are preserved. Please retry."); }
    if (!response.ok) throw Error(errorMessage(body, "The scan could not be completed. Your photos are preserved."));
    return body;
  }
  if (!response.ok || !response.body) throw Error("The scan service is unavailable. Your photos are preserved.");
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let pending = "", bytes = 0, sequence = 0, caseId: string | undefined;
  let result: unknown, terminal = false, done = false;
  function frame(line: string) {
    if (!line.trim()) return;
    if (terminal) throw Error("The service returned an invalid scan stream.");
    const body: unknown = JSON.parse(line);
    if (!isRecord(body)) throw Error("The service returned an invalid scan stream.");
    if (body.type === "stage") {
      const event = stageEventSchema.parse(body.event);
      if (event.sequence !== sequence + 1 || (caseId && caseId !== event.caseId)) throw Error("The service returned an inconsistent stage trace.");
      sequence = event.sequence; caseId = event.caseId; onStage(event);
    } else if (body.type === "error") {
      throw Error(errorMessage(body, "The scan could not be completed. Your photos are preserved."));
    } else if (body.type === "result") {
      const requestId = isRecord(body.result) && isRecord(body.result.meta) ? body.result.meta.requestId : undefined;
      if (caseId && requestId !== caseId) throw Error("The scan result did not match this case.");
      result = body.result; terminal = true;
    } else throw Error("The service returned an unknown scan event.");
  }
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {done = true; pending += decoder.decode(); break;}
      bytes += chunk.value.byteLength;
      if (bytes > 2 * 1024 * 1024) throw Error("The scan response exceeded its size limit.");
      pending += decoder.decode(chunk.value, {stream: true});
      let index: number;
      while ((index = pending.indexOf("\n")) >= 0) {frame(pending.slice(0, index)); pending = pending.slice(index + 1);}
    }
    if (pending.trim()) frame(pending);
    if (!terminal) throw Error("The scan connection ended before results were ready. Your photos are preserved.");
    return result;
  } finally {
    if (!done) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

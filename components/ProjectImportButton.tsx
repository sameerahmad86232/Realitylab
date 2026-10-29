"use client";
import { useEffect, useRef, useState } from "react";
import { FolderOpen } from "lucide-react";
import type { ScanView } from "../lib/analysis";
import {
  projectFileSchema,
  restoreProject,
  verifyProjectPhotos,
} from "../lib/project-file";
import { saveLearningDraft } from "../lib/learning-cache";

export default function ProjectImportButton({
  onOpen,
  className = "secondary",
}: {
  onOpen: (scan: ScanView, message: string) => void;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null),
    [armed, setArmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (armed) input.current?.click();
  }, [armed]);
  async function open(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      if (file.size > 25_000_000)
        throw Error("Project files must be 25 MB or smaller.");
      const parsed = projectFileSchema.parse(JSON.parse(await file.text()));
      await verifyProjectPhotos(parsed);
      const restored = restoreProject(parsed);
      if (restored.learning)
        saveLearningDraft(
          restored.scan.result.meta.requestId,
          restored.learning,
        );
      onOpen(
        restored.scan,
        `${restored.photosIncluded} of ${restored.scan.photos.length} source photos restored. ${restored.photosIncluded ? "Embedded photos stayed inside the project file." : "The project was saved without photo bytes."}`,
      );
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? "This is not valid JSON."
          : e instanceof Error && e.name === "ZodError"
            ? "This project file is invalid, unsupported or has broken references."
            : e instanceof Error
              ? e.message
              : "This project could not be opened.",
      );
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
      setArmed(false);
    }
  }
  return (
    <span className="project-open-control">
      <button
        className={className}
        disabled={busy}
        onClick={() => armed ? input.current?.click() : setArmed(true)}
      >
        <FolderOpen size={14} />
        {busy ? "Checking project…" : "Open project"}
      </button>
      {armed && (
        <input
          ref={input}
          type="file"
          hidden
          accept="application/json,.json"
          onChange={(e) => open(e.target.files?.[0])}
        />
      )}
      {error && (
        <span className="project-open-error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}

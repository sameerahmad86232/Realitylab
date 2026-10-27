import PropTypes from "prop-types";
import { NotebookPen, ArrowUpRight } from "lucide-react";

export default function EvidenceNotebook({ analysis, onChange, onCapture }) {
  const reviewed = analysis.observations.filter(
    (o) => o.review?.status && o.review.status !== "pending",
  ).length;
  function update(index, patch) {
    const previous = analysis.followUpNotes?.[index];
    onChange({
      ...analysis.followUpNotes,
      [index]: {
        status: "planned",
        notes: "",
        ...previous,
        ...patch,
        source: "user-reported",
        updatedAt: new Date().toISOString(),
      },
    });
  }
  return (
    <div className="evidence-notebook">
      <div className="notebook-heading">
        <div>
          <span className="eyebrow">
            <NotebookPen size={14} /> THE OBSERVATION NOTEBOOK
          </span>
          <h4>A suggestion is the beginning.</h4>
          <p>Review a part above, then record what you can actually observe.</p>
        </div>
        <span className="notebook-count">
          {reviewed} / {analysis.observations.length}
          <small>PARTS REVIEWED BY YOU</small>
        </span>
      </div>
      <div className="notebook-steps">
        {(analysis.nextSteps || []).map((step, index) => {
          const entry = analysis.followUpNotes?.[index];
          return (
            <article key={index}>
              <span className="notebook-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h5>{step}</h5>
                <label className="lab-label">
                  Follow-up {index + 1} status
                  <select
                    aria-label={`Follow-up ${index + 1} status`}
                    value={entry?.status || "planned"}
                    onChange={(e) => update(index, { status: e.target.value })}
                  >
                    <option value="planned">Planned observation</option>
                    <option value="recorded" disabled={!entry?.notes?.trim()}>
                      I recorded an observation
                    </option>
                    <option value="unavailable">Cannot check yet</option>
                  </select>
                </label>
                <label className="lab-label">
                  Follow-up {index + 1} notes
                  <textarea
                    aria-label={`Follow-up ${index + 1} notes`}
                    value={entry?.notes || ""}
                    maxLength={1000}
                    placeholder="What did you see? Include the viewpoint or measurement units when relevant."
                    onChange={(e) =>
                      update(index, {
                        notes: e.target.value,
                        ...(entry?.status === "recorded"
                          ? { status: "planned" }
                          : {}),
                      })
                    }
                  />
                </label>
              </div>
            </article>
          );
        })}
      </div>
      {!analysis.nextSteps?.length && (
        <p className="lab-help">
          No model follow-ups were proposed. Review visible parts and note what
          another photo could clarify.
        </p>
      )}
      <div className="notebook-footer">
        <p>
          Your notes are self-reported, not model verification. Export before
          refreshing or starting another analysis.
        </p>
        <button className="quiet-button" onClick={onCapture}>
          Return to photos <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  );
}
EvidenceNotebook.propTypes = {
  analysis: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onCapture: PropTypes.func.isRequired,
};

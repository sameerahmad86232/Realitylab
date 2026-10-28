import PropTypes from "prop-types";
import grinder from "../../assets/precision-grinder.webp";
import {
  Car,
  Laptop,
  Armchair,
  Wrench,
  Leaf,
  Fan,
  Network,
  ArrowUpRight,
} from "lucide-react";
const categories = [
  {
    name: "Vehicles",
    icon: Car,
    context:
      "Explore the visible components and relationships of this vehicle. Distinguish design hypotheses from visible evidence.",
  },
  {
    name: "Electronics",
    icon: Laptop,
    context:
      "Explore the visible structure, interfaces and probable component roles of this electronic object without assuming its hidden specifications.",
  },
  {
    name: "Home & appliances",
    icon: Fan,
    context:
      "Inspect the visible parts of this household object. Suggest only non-invasive observations; do not provide powered disassembly steps.",
  },
  {
    name: "Furniture",
    icon: Armchair,
    context:
      "Inspect this piece of furniture: visible structure, supports, joints, and what cannot be established from the image.",
  },
  {
    name: "Tools & mechanisms",
    icon: Wrench,
    context:
      "Inspect the visible parts and motion relationships of this tool or mechanism. Identify a gear pair only if it is actually visible.",
  },
  {
    name: "Nature & unfamiliar",
    icon: Leaf,
    context:
      "Describe the visible structure of this natural or unfamiliar object. Be explicit about uncertain identity and avoid medical or health claims.",
  },
];
export default function ObjectOverview({ analysis, onSuggest, onGearTool }) {
  return (
    <div className="object-overview">
      {analysis && (
        <div className="lab-panel-heading">
          <span>02</span>
          <div>
            <h4>Visible parts. Open questions.</h4>
            <p>Keep your observations and suggested connections together.</p>
          </div>
          <Network size={20} />
        </div>
      )}
      {analysis ? (
        <>
          <div className="object-identity">
            <span>
              {analysis.category || "other"} /{" "}
              {analysis.recognition || "identified"}
            </span>
            <strong>{analysis.objectName}</strong>
            <p>
              {analysis.recognition === "uncertain"
                ? "The identity is uncertain. Treat suggestions cautiously and provide another angle or context."
                : "Model recognition is a suggestion, not a measurement or guarantee."}
            </p>
          </div>
          <div className="object-stat-grid">
            <div>
              <strong>{analysis.observations.length}</strong>
              <span>VISIBLE PARTS</span>
            </div>
            <div>
              <strong>{analysis.relationships?.length || 0}</strong>
              <span>RELATIONSHIPS</span>
            </div>
            <div>
              <strong>{analysis.unknowns.length}</strong>
              <span>OPEN QUESTIONS</span>
            </div>
          </div>
          <div className="object-next-steps">
            <h5>What to explore next.</h5>
            {analysis.nextSteps?.length ? (
              <ol>
                {analysis.nextSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            ) : (
              <p>
                Take another angle, identify a reference measurement, or correct
                the component map below.
              </p>
            )}
          </div>
          <p className="lab-help">
            The graph is an explanatory map. Hidden internals, exact dimensions
            and physical performance remain unknown unless independently
            established.
          </p>
        </>
      ) : (
        <>
          <div className="precision-object-example">
            <div className="precision-example-title">
              <span>EXAMPLE PREVIEW</span>
              <small>Your scan supplies the real parts.</small>
            </div>
            <div className="precision-example-object">
              <img
                src={grinder}
                alt="Illustrative manual coffee grinder, not a scan result"
                loading="lazy"
                width="1024"
                height="1536"
              />
              <span>Illustrative object study</span>
            </div>
            <div className="precision-example-part-list">
              <strong>A closer look at familiar things.</strong>
              <p>
                See visible parts, ask a useful question, and keep the evidence
                close.
              </p>
              <div>
                <span>Handle knob</span>
                <span>Adjustment ring</span>
                <span>Catch cup</span>
              </div>
            </div>
          </div>
          <details className="precision-category-picker">
            <summary>Choose a starting question</summary>
            <div className="object-category-grid">
              {categories.map(({ name, icon: Icon, context }) => (
                <button key={name} onClick={() => onSuggest(context)}>
                  <Icon size={22} />
                  <span>{name}</span>
                  <ArrowUpRight size={12} />
                </button>
              ))}
            </div>{" "}
          </details>
        </>
      )}
      <button className="quiet-button" onClick={onGearTool}>
        <Wrench size={13} /> Open manual gear experiment
      </button>
    </div>
  );
}
ObjectOverview.propTypes = {
  analysis: PropTypes.shape({
    objectName: PropTypes.string,
    category: PropTypes.string,
    recognition: PropTypes.string,
    observations: PropTypes.array,
    relationships: PropTypes.array,
    unknowns: PropTypes.array,
    nextSteps: PropTypes.array,
  }),
  onSuggest: PropTypes.func.isRequired,
  onGearTool: PropTypes.func.isRequired,
};

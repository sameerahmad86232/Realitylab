import PropTypes from "prop-types";
import {
  Car,
  Laptop,
  Armchair,
  Wrench,
  Leaf,
  Fan,
  Camera,
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
      <div className="lab-panel-heading">
        <span>02</span>
        <div>
          <h4>
            {analysis
              ? "Visible parts. Open questions."
              : "A wider world to explore."}
          </h4>
          <p>
            {analysis
              ? "Image-specific evidence and editable connections, beyond a single kind of mechanism."
              : "From a simple chair to a complex machine. The image determines the result."}
          </p>
        </div>
        <Network size={20} />
      </div>
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
          <div className="object-category-grid">
            {categories.map(({ name, icon: Icon, context }) => (
              <button key={name} onClick={() => onSuggest(context)}>
                <Icon size={22} />
                <span>{name}</span>
                <ArrowUpRight size={12} />
              </button>
            ))}
          </div>
          <div className="object-promise">
            <Camera size={20} />
            <div>
              <strong>Your object, your evidence.</strong>
              <p>
                Upload a clear photo. Explore its visible parts, suggested roles
                and connections. Correct the model and export the map.
              </p>
            </div>
          </div>
          <p className="lab-help">
            These are exploration guides, not a claim of perfect recognition.
            Blurry, hidden, very small or unfamiliar objects may need more
            evidence.
          </p>
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

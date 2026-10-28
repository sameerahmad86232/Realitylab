import PropTypes from "prop-types";
import {
  ArrowUpRight,
  ArrowRight,
  ScanLine,
  Wrench,
  FileCheck2,
} from "lucide-react";
import ShaderAtmosphere from "./ShaderAtmosphere";
import grinder from "../assets/precision-grinder.webp";
import objects from "../assets/field-guide-objects.webp";
export default function FieldGuideHero({ onExplore }) {
  return (
    <>
      <section
        className="field-hero hero luminous-hero precision-hero"
        aria-labelledby="field-hero-title"
      >
        <ShaderAtmosphere />
        <div className="field-hero-copy">
          <span className="field-kicker">
            A CLOSER LOOK. A BETTER NEXT STEP.
          </span>
          <h1 id="field-hero-title">
            Understand it.
            <br />
            Keep it working.
          </h1>
          <p>
            Scan everyday objects. Explore their parts. Get a clearer next step
            when something goes wrong.
          </p>
          <div className="precision-hero-actions">
            <a href="#studio" className="field-primary" onClick={onExplore}>
              <ScanLine size={18} /> Scan an object <ArrowUpRight size={18} />
            </a>
            <a className="precision-example-link" href="#repair-preview">
              See an example <ArrowRight size={16} />
            </a>
          </div>
          <div className="precision-hero-note">
            <span className="precision-dot" /> Your photos. Your observations. A
            useful next step.
          </div>
        </div>
        <figure className="field-chair precision-hero-object">
          <img
            src={grinder}
            alt="Illustrative stainless-steel manual coffee grinder with a walnut handle and clear catch cup"
            fetchPriority="high"
            width="1024"
            height="1536"
          />
          <span className="precision-object-label label-handle">
            <i /> Handle knob
          </span>
          <span className="precision-object-label label-ring">
            <i /> Adjustment ring
          </span>
          <span className="precision-object-label label-cup">
            <i /> Catch cup
          </span>
          <figcaption>Illustrative object study</figcaption>
        </figure>
      </section>
      <div className="precision-value-strip">
        {[
          {
            icon: ScanLine,
            title: "Photo-linked parts",
            text: "Keep the evidence close to the explanation.",
          },
          {
            icon: Wrench,
            title: "Guided troubleshooting",
            text: "One useful question. A clearer next step.",
          },
          {
            icon: FileCheck2,
            title: "An honest repair record",
            text: "Save the suggestions and your observations.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title}>
            <Icon size={25} />
            <span>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
FieldGuideHero.propTypes = { onExplore: PropTypes.func.isRequired };
export function FieldGuideStories({ onExplore }) {
  return (
    <section
      className="field-catalog precision-catalog"
      id="objects"
      aria-labelledby="field-catalog-title"
    >
      <div className="field-section-line">
        <div>
          <h2 id="field-catalog-title">Everyday objects. Better questions.</h2>
          <p>
            From kitchen tools to home essentials, take a closer look at how
            things work.
          </p>
        </div>
        <a href="#studio" onClick={onExplore}>
          Bring your own object <ArrowUpRight size={16} />
        </a>
      </div>
      <div className="field-study-grid">
        {[
          {
            title: "Desk lamp",
            detail: "A closer look at joints and movement.",
            pos: "0%",
          },
          {
            title: "Coffee grinder",
            detail: "The visible logic of a familiar ritual.",
            image: grinder,
          },
          {
            title: "Hand tool",
            detail: "A head, a handle, and how they connect.",
            pos: "50%",
          },
        ].map((study) => (
          <a
            className="field-study"
            href="#studio"
            onClick={onExplore}
            key={study.title}
          >
            {study.image ? (
              <div className="field-study-image precision-catalog-grinder">
                <img
                  src={study.image}
                  alt="Illustrative manual coffee grinder"
                  loading="lazy"
                  width="1024"
                  height="1536"
                />
              </div>
            ) : (
              <div
                className="field-study-image"
                role="img"
                aria-label={`Illustrative ${study.title.toLowerCase()} study`}
                style={{
                  backgroundImage: `url(${objects})`,
                  backgroundPosition: `${study.pos} center`,
                }}
              />
            )}
            <div className="field-study-caption">
              <div>
                <h3>{study.title}</h3>
                <p>{study.detail}</p>
              </div>
              <ArrowUpRight size={18} />
            </div>
          </a>
        ))}
      </div>
      <p className="field-catalog-note">
        Illustrative starting points. Upload photos of your own object for an
        assessment.
      </p>
    </section>
  );
}
FieldGuideStories.propTypes = { onExplore: PropTypes.func.isRequired };
export function PrecisionRepairIntro({ onExplore }) {
  return (
    <section className="precision-repair-intro" id="repair-preview">
      <div>
        <span className="eyebrow">A QUESTION WORTH ASKING</span>
        <h2>
          From “what’s wrong?”
          <br />
          to a useful next step.
        </h2>
        <p>
          Describe the symptom or add another photo. Review the evidence before
          you act.
        </p>
        <ol className="precision-mini-flow">
          <li>
            <span>01</span>
            <strong>Report</strong>
            <small>Show the problem.</small>
          </li>
          <li>
            <span>02</span>
            <strong>Clarify</strong>
            <small>Add the missing detail.</small>
          </li>
          <li>
            <span>03</span>
            <strong>Review</strong>
            <small>Choose the next step.</small>
          </li>
        </ol>
      </div>
      <div className="precision-example-card">
        <span className="eyebrow">ILLUSTRATIVE REPAIR WORKFLOW</span>
        <div className="precision-example-symptom">
          <img
            src={grinder}
            alt="Illustrative grinder"
            loading="lazy"
            width="80"
            height="96"
          />
          <p>“The handle knob feels loose.”</p>
        </div>
        <div className="precision-example-part">
          <span>Suggested part to check</span>
          <strong>
            Handle knob <small>Needs review</small>
          </strong>
          <p>Check the visible attachment before assuming an internal fault.</p>
        </div>
        <ol>
          {[
            "Stop use and inspect",
            "Check the accessible fixing",
            "Verify the attachment",
          ].map((title, i) => (
            <li key={title}>
              <span>{i + 1}</span>
              <strong>{title}</strong>
            </li>
          ))}
        </ol>
        <div className="precision-example-bottom">
          <p>
            Example only. Your object needs its own evidence and assessment.
          </p>
          <a href="#studio" onClick={onExplore}>
            Start with your object <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
PrecisionRepairIntro.propTypes = { onExplore: PropTypes.func.isRequired };

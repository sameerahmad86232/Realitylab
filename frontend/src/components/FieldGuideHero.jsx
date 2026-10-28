import PropTypes from "prop-types";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import ShaderAtmosphere from "./ShaderAtmosphere";
import chair from "../assets/field-guide-chair.webp";
import objects from "../assets/field-guide-objects.webp";
const studies = [
  {
    title: "Articulated lamp",
    index: "01",
    position: "0%",
    detail: "Joints, fasteners, and the quiet logic of movement.",
  },
  {
    title: "Hand tool",
    index: "02",
    position: "50%",
    detail: "A head, a handle. A closer look at how they meet.",
  },
  {
    title: "Mechanical fan",
    index: "03",
    position: "100%",
    detail: "Blades, a housing, and the structure around them.",
  },
];
export default function FieldGuideHero({ onExplore }) {
  return (
    <>
      <section
        className="field-hero hero luminous-hero"
        aria-labelledby="field-hero-title"
      >
        <ShaderAtmosphere />
        <div className="field-hero-copy">
          <span className="field-kicker">
            <span /> OBJECTS. IDEAS. A NEW PERSPECTIVE.
          </span>
          <h1 id="field-hero-title">
            See beyond.
            <br />
            <em>the surface.</em>
          </h1>
          <p>Scan an object. Understand its parts. Describe what’s wrong and get an evidence-linked repair assessment.</p>
          <a href="#studio" className="field-primary" onClick={onExplore}>
            Discover an object <ArrowRight size={18} />
          </a>
          <div className="field-hero-footnote">
            <span>NO. 001</span>
            <p>
              For the things you see every day.
              <br />
              And the questions you’ve never asked.
            </p>
          </div>
        </div>
        <figure className="field-chair">
          <img
            src={chair}
            alt="AI-generated editorial study of an original walnut bentwood chair, isolated on warm ivory"
            fetchPriority="high"
            width="1024"
            height="1536"
          />
          <div className="luminous-object-label" aria-hidden="true">
            <span /> FORM / 001
          </div>
          <div className="luminous-part-label" aria-hidden="true">
            <span /> STRUCTURE, REVEALED
          </div>
          <figcaption>
            <span>01</span>
            <p>
              Look closely.
              <br />
              There’s more here.
            </p>
          </figcaption>
          <span className="field-image-disclosure">
            ILLUSTRATIVE OBJECT STUDY
          </span>
        </figure>
      </section>
    </>
  );
}
FieldGuideHero.propTypes = { onExplore: PropTypes.func.isRequired };

export function FieldGuideStories({ onExplore }) {
  return (
    <>
      <section
        className="field-catalog"
        id="objects"
        aria-labelledby="field-catalog-title"
      >
        <div className="field-section-line">
          <div>
            <span>02</span>
            <h2 id="field-catalog-title">Explore more possibilities</h2>
          </div>
          <a href="#studio" onClick={onExplore}>
            Your own object <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="field-study-grid">
          {studies.map((study) => (
            <a
              className="field-study"
              key={study.title}
              href="#studio"
              onClick={onExplore}
            >
              <div
                className="field-study-image"
                role="img"
                aria-label={`AI-generated editorial study: ${study.title}`}
                style={{
                  backgroundImage: `url(${objects})`,
                  backgroundPosition: `${study.position} center`,
                }}
              />
              <div className="field-study-caption">
                <div>
                  <h3>{study.title}</h3>
                  <p>{study.detail}</p>
                </div>
                <span>
                  <ArrowUpRight size={17} />
                </span>
              </div>
            </a>
          ))}
        </div>
        <p className="field-catalog-note">
          A few starting points. Bring a photo of your own object to begin.
        </p>
      </section>

    </>
  );
}
FieldGuideStories.propTypes = { onExplore: PropTypes.func.isRequired };

"use client";

import Image from "next/image";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return diagonal ? (
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5 4h7v7" /></svg>
  ) : (
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h10M8 3.5 12.5 8 8 12.5" /></svg>
  );
}

export default function DotMatrixHero({
  onStart,
  onDemo,
  onSample,
  onResume,
}: {
  onStart: () => void;
  onDemo: () => void;
  onSample: () => void;
  onResume?: () => void;
}) {
  return (
    <section className="matrix-hero" aria-labelledby="matrix-title">
      <nav className="matrix-nav" aria-label="Landing navigation">
        <a className="matrix-brand" href="#main" aria-label="RealityLab home">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6Zm0 4a5.8 5.8 0 1 1 0 11.6 5.8 5.8 0 0 1 0-11.6Zm0 3a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z" />
          </svg>
          <span>Reality<span className="matrix-brand-light">Lab</span></span>
        </a>
        <div className="matrix-links">
          <a href="#how-it-works">How it works</a>
          <a href="#collection">Examples</a>
          <button onClick={onDemo}>Guided demo</button>
        </div>
        <button className="matrix-signin" onClick={onStart}>
          <span>Scan an object</span> <Arrow diagonal />
        </button>
      </nav>

      <div className="matrix-content">
        <div className="matrix-copy">
          <p className="matrix-kicker"><span /> A CLOSER LOOK AT EVERYDAY THINGS</p>
          <h1 id="matrix-title">A photo can reveal <em>how things work.</em></h1>
          <p className="matrix-sub">
            Explore the parts you can see, follow how they connect, and keep
            photo evidence separate from possible explanations.
          </p>
          <div className="matrix-actions">
            <button className="matrix-cta" onClick={onStart}>
              <span>Scan an object</span> <Arrow diagonal />
            </button>
            <button className="matrix-sample" onClick={onSample}>
              Explore a real example <Arrow />
            </button>
          </div>
          {onResume && (
            <button className="matrix-resume" onClick={onResume}>
              Resume your exploration <Arrow />
            </button>
          )}
          <button className="matrix-demo" onClick={onDemo}>
            <span className="matrix-play" aria-hidden="true">▶</span>
            See the guided walkthrough
          </button>
          <div className="matrix-proof" aria-label="How RealityLab works">
            <div><span className="matrix-proof-icon">01</span><span><strong>Start with a photo</strong><small>Bring your own object</small></span></div>
            <div><span className="matrix-proof-icon">02</span><span><strong>Explore its parts</strong><small>Follow visible evidence</small></span></div>
            <div><span className="matrix-proof-icon">03</span><span><strong>Test an idea</strong><small>Record what you observe</small></span></div>
          </div>
        </div>

        <div className="matrix-visual" aria-label="Recorded desk fan photo study">
          <div className="matrix-visual-top">
            <span><i /> RECORDED PHOTO STUDY</span>
            <span>EXAMPLE 01</span>
          </div>
          <div className="matrix-photo">
            <Image
              src="/demos/fan.jpg"
              alt="Desk fan used in a recorded RealityLab photo study"
              fill
              priority
              sizes="(max-width: 820px) 94vw, 52vw"
            />
            <div className="matrix-photo-grid" aria-hidden="true" />
            <div className="matrix-callout matrix-callout-one"><span>01</span><i /></div>
            <div className="matrix-callout matrix-callout-two"><span>02</span><i /></div>
            <div className="matrix-image-caption">
              <span>OBSERVE</span>
              <span>PHOTO EVIDENCE · NOT A RECONSTRUCTION</span>
            </div>
          </div>
          <button className="matrix-study-card" onClick={onSample}>
            <span className="matrix-study-number">01 <i> / AIR &amp; MOTION</i></span>
            <span className="matrix-study-title">The desk fan <Arrow diagonal /></span>
            <span className="matrix-study-detail">Open the recorded example · No new AI request</span>
          </button>
          <div className="matrix-visual-foot">
            <span>PHOTO → COMPONENTS → PRINCIPLE</span>
            <span>Evidence first. Possibilities clearly labeled.</span>
          </div>
        </div>
      </div>
      <div className="matrix-bottom-rule"><span>MADE FOR CURIOUS MINDS</span><span>SEE MORE IN WHAT YOU ALREADY KNOW</span></div>
    </section>
  );
}

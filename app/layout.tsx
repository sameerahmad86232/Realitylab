import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "./globals.css";
import "./phase5.css";
import "./phase6.css";
import "./phase7.css";
import "./reverse-engineering.css";
import "./component-images.css";
import "./orchestrator.css";
import "./repair.css";
import "./matrix-hero.css";
import "./kindred-system.css";
import "./observatory.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.RENDER_EXTERNAL_URL || "https://realitylab.onrender.com",
  ),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "RealityLab",
    title: "RealityLab — A closer look at the everyday",
    description:
      "Explore everyday objects through photo evidence, conceptual blueprints and construction studies.",
    images: [
      {
        url: "/art/mechanism-study-v2.webp",
        width: 1600,
        height: 900,
        alt: "RealityLab AI-generated mechanism concept illustration",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  title: "RealityLab — A closer look at the everyday",
  icons: { icon: "/icon.svg" },
  description:
    "Scan everyday objects, explore component evidence, create conceptual blueprints, and learn through paper models and circuit simulations.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{background:"#090b0d"}}>
      <body>{children}</body>
    </html>
  );
}

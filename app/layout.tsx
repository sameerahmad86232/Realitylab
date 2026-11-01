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
        url: "/art/optical-exploration.webp",
        width: 1440,
        height: 720,
        alt: "RealityLab editorial optical concept illustration",
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}

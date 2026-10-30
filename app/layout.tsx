import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "./globals.css";
import "./phase5.css";
import "./phase6.css";
import "./phase7.css";
import "./reverse-engineering.css";
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
      <body>{children}</body>
    </html>
  );
}

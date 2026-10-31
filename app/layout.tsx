import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "./globals.css";
import "./phase5.css";
import "./phase6.css";
import "./phase7.css";
import "./reverse-engineering.css";
import "./component-images.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.RENDER_EXTERNAL_URL || "https://realitylab.onrender.com",
  ),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "RealityLab",
    title: "RealityLab — Fix Anything. See It Fixed.",
    description:
      "Photo in, practical next steps out. Diagnose issues, find the object with SAM 3.1 and visualize a possible repair.",
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
    "RealityLab is a visual AI troubleshooter. Upload a photo, investigate the issue, get a careful three-step guide, and see a possible fixed version.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

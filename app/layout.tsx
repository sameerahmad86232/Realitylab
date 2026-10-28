import type { Metadata } from 'next';
import '@fontsource-variable/geist';
import './globals.css';
export const metadata: Metadata = { title: 'RealityLab — A closer look at the everyday', description: 'Explore the parts and principles behind everyday objects. Liquid Gallery design preview.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }

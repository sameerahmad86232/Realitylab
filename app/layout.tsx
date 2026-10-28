import type { Metadata } from 'next';
import '@fontsource-variable/geist';
import './globals.css';
export const metadata: Metadata = { title: 'RealityLab — A closer look at the everyday', icons:{icon:'/icon.svg'}, description: 'Scan everyday objects, explore component evidence, create conceptual blueprints, and learn through paper models and circuit simulations.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }

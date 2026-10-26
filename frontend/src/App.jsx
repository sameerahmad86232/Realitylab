import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import UploadZone from './components/UploadZone';
import ActionArea from './components/ActionArea';
import ResultsSection from './components/ResultsSection';
import Footer from './components/Footer';
import { sampleBlueprintData } from './data/sampleBlueprintData';

// Realistic sample photo SVGs for quick testing
const sampleDroneTopSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450" fill="%230f172a"><rect width="600" height="450" fill="%230f172a"/><g stroke="rgba(255,255,255,0.08)" stroke-width="1"><line x1="0" y1="225" x2="600" y2="225"/><line x1="300" y1="0" x2="300" y2="450"/><circle cx="300" cy="225" r="160" fill="none" stroke-dasharray="4 4"/></g><line x1="140" y1="105" x2="460" y2="345" stroke="%2338bdf8" stroke-width="6" stroke-linecap="round"/><line x1="460" y1="105" x2="140" y2="345" stroke="%2338bdf8" stroke-width="6" stroke-linecap="round"/><rect x="240" y="165" width="120" height="120" rx="20" fill="%231e293b" stroke="%2300f0ff" stroke-width="2.5"/><circle cx="300" cy="225" r="30" fill="%230f172a" stroke="%23a855f7" stroke-width="2"/><circle cx="140" cy="105" r="45" fill="none" stroke="%2338bdf8" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="140" cy="105" r="15" fill="%23334155"/><circle cx="460" cy="105" r="45" fill="none" stroke="%2338bdf8" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="460" cy="105" r="15" fill="%23334155"/><circle cx="140" cy="345" r="45" fill="none" stroke="%2338bdf8" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="140" cy="345" r="15" fill="%23334155"/><circle cx="460" cy="345" r="45" fill="none" stroke="%2338bdf8" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="460" cy="345" r="15" fill="%23334155"/><text x="300" y="420" fill="%2394a3b8" font-family="sans-serif" font-size="12" font-weight="600" text-anchor="middle">Sample Capture: Top-Down Orthogonal</text></svg>`;

const sampleDroneIsoSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450" fill="%230f172a"><rect width="600" height="450" fill="%230f172a"/><g stroke="rgba(255,255,255,0.08)" stroke-width="1"><ellipse cx="300" cy="250" rx="200" ry="70" fill="none" stroke-dasharray="4 4"/></g><polygon points="300,160 430,235 300,305 170,235" fill="%231e293b" stroke="%2300f0ff" stroke-width="2.5"/><line x1="170" y1="235" x2="90" y2="190" stroke="%2338bdf8" stroke-width="5" stroke-linecap="round"/><line x1="430" y1="235" x2="510" y2="190" stroke="%2338bdf8" stroke-width="5" stroke-linecap="round"/><circle cx="90" cy="190" r="16" fill="%23334155" stroke="%23a855f7" stroke-width="2"/><circle cx="510" cy="190" r="16" fill="%23334155" stroke="%23a855f7" stroke-width="2"/><circle cx="300" cy="210" r="8" fill="%2300f0ff"/><text x="300" y="420" fill="%2394a3b8" font-family="sans-serif" font-size="12" font-weight="600" text-anchor="middle">Sample Capture: 45° Perspective View</text></svg>`;

export default function App() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [blueprintData, setBlueprintData] = useState(null);

  // 1-click sample drone scan loader
  const handleLoadSample = () => {
    setFiles([
      {
        id: 'sample-1',
        name: 'drone_ortho_top.png',
        size: '142.4 KB',
        preview: sampleDroneTopSvg,
        isSample: true,
      },
      {
        id: 'sample-2',
        name: 'drone_isometric_45.png',
        size: '186.1 KB',
        preview: sampleDroneIsoSvg,
        isSample: true,
      }
    ]);
  };

  // Generate blueprint: simulate 2-second processing
  const handleGenerate = () => {
    if (files.length === 0) return;
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setBlueprintData(sampleBlueprintData);
      setHasGenerated(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-slate-100 font-sans antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Subtle Background Radial Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/10 via-purple-600/5 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[400px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col flex-1">
        
        {/* 1. Navigation Bar */}
        <Navbar />

        <main className="flex-1">
          {/* 2. Hero Section */}
          <HeroSection />

          {/* 3. Upload Zone */}
          <UploadZone 
            files={files} 
            setFiles={setFiles} 
            onSelectSample={handleLoadSample} 
          />

          {/* 4. Action Area */}
          <ActionArea 
            hasFiles={files.length > 0} 
            isLoading={isLoading} 
            onGenerate={handleGenerate} 
            hasGenerated={hasGenerated}
          />

          {/* 5. Results Section (Hidden until Generate is clicked) */}
          <ResultsSection 
            blueprintData={blueprintData} 
            isVisible={hasGenerated} 
          />
        </main>

        {/* 6. Footer */}
        <Footer />

      </div>

    </div>
  );
}

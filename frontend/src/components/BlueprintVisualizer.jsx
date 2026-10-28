import { useState } from 'react';
import PropTypes from 'prop-types';
import { ZoomIn, ZoomOut } from 'lucide-react';

export default function BlueprintVisualizer({ onSelectPart }) {
  const [activeLayer, setActiveLayer] = useState('all'); // 'all', 'exterior', 'interior'
  const [zoomLevel, setZoomLevel] = useState(100);

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col h-[560px] relative overflow-hidden transition-all duration-300 hover:border-cyan-500/50 select-none">
      
      {/* Blueprint Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Generated Blueprint Schematic
          </h3>
          <span className="text-xs font-mono text-slate-400">145×145mm</span>
        </div>

        {/* Layer Filter Pills */}
        <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-white/5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveLayer('all')}
            className={`px-3 py-1 rounded-lg transition-all ${activeLayer === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('exterior')}
            className={`px-3 py-1 rounded-lg transition-all ${activeLayer === 'exterior' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}
          >
            Observed
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('interior')}
            className={`px-3 py-1 rounded-lg transition-all ${activeLayer === 'interior' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white'}`}
          >
            Inferred
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 bg-slate-950/80 rounded-xl border border-white/5 relative flex items-center justify-center p-4 overflow-hidden">
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-subtle-grid opacity-30 pointer-events-none" />

        {/* Blueprint Vector Drawing */}
        <div 
          className="w-full h-full flex items-center justify-center transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          <svg viewBox="0 0 500 500" className="w-full h-full max-h-[420px] drop-shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <defs>
              <radialGradient id="sensorRadial" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Reference Circles & Axes */}
            <circle cx="250" cy="250" r="210" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="250" cy="250" r="130" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
            <line x1="30" y1="250" x2="470" y2="250" stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="3 3" />
            <line x1="250" y1="30" x2="250" y2="470" stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="3 3" />

            {/* Structural Cantilever Arms */}
            <g opacity={activeLayer === 'interior' ? 0.35 : 1}>
              <line x1="120" y1="120" x2="380" y2="380" stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" />
              <line x1="380" y1="120" x2="120" y2="380" stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* Central Unibody Fuselage Chassis */}
            <rect 
              x="200" y="180" width="100" height="140" rx="18" 
              fill="#0f172a" 
              stroke="#00f0ff" 
              strokeWidth="2.5"
              opacity={activeLayer === 'interior' ? 0.35 : 1}
            />

            {/* Forward Stereo Camera (Observed) */}
            <g opacity={activeLayer === 'interior' ? 0.25 : 1}>
              <rect x="225" y="160" width="50" height="22" rx="4" fill="#1e293b" stroke="#00f0ff" strokeWidth="1.5" />
              <circle cx="237" cy="171" r="4.5" fill="#00f0ff" />
              <circle cx="263" cy="171" r="4.5" fill="#00f0ff" />
            </g>

            {/* Center Electronics Bay: IMU & ESC (Inferred) */}
            <g opacity={activeLayer === 'exterior' ? 0.2 : 1}>
              <rect x="220" y="220" width="60" height="60" rx="8" fill="#2e1065" stroke="#a855f7" strokeWidth="2" strokeDasharray="3 2" />
              <rect x="238" y="238" width="24" height="24" rx="4" fill="#a855f7" opacity="0.8" />
              <text x="250" y="272" fill="#d8b4fe" fontSize="8" fontFamily="monospace" textAnchor="middle">IMU / ESC</text>
            </g>

            {/* 4 Motors & Rotor Sweeps */}
            {[
              { cx: 120, cy: 120, label: 'M1 (CW)' },
              { cx: 380, cy: 120, label: 'M2 (CCW)' },
              { cx: 120, cy: 380, label: 'M3 (CCW)' },
              { cx: 380, cy: 380, label: 'M4 (CW)' }
            ].map((m, idx) => (
              <g key={idx}>
                <circle cx={m.cx} cy={m.cy} r="65" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity={activeLayer === 'interior' ? 0.25 : 0.6} />
                <circle cx={m.cx} cy={m.cy} r="16" fill="#1e293b" stroke="#a855f7" strokeWidth="2" />
                <circle cx={m.cx} cy={m.cy} r="4" fill="#00f0ff" />
                <text x={m.cx} y={m.cy + 30} fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">{m.label}</text>
              </g>
            ))}

            {/* Interactive Callout Pins */}
            {/* PIN 01: Camera */}
            <g className="cursor-pointer" onClick={() => onSelectPart('obs-3')} opacity={activeLayer === 'interior' ? 0.25 : 1}>
              <line x1="250" y1="160" x2="250" y2="100" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="250" cy="95" r="12" fill="#0c4a6e" stroke="#00f0ff" strokeWidth="2" />
              <text x="250" y="99" fill="#00f0ff" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">01</text>
              <rect x="270" y="85" width="110" height="20" rx="4" fill="#082f49" stroke="#00f0ff" strokeWidth="1" />
              <text x="278" y="99" fill="#7dd3fc" fontSize="9" fontFamily="monospace">Stereo Camera</text>
            </g>

            {/* PIN 02: IMU */}
            <g className="cursor-pointer" onClick={() => onSelectPart('inf-2')} opacity={activeLayer === 'exterior' ? 0.25 : 1}>
              <line x1="280" y1="250" x2="340" y2="250" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="350" cy="250" r="12" fill="#3b0764" stroke="#a855f7" strokeWidth="2" />
              <text x="350" y="254" fill="#d8b4fe" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">02</text>
              <rect x="370" y="240" width="100" height="20" rx="4" fill="#2e1065" stroke="#a855f7" strokeWidth="1" />
              <text x="378" y="254" fill="#d8b4fe" fontSize="9" fontFamily="monospace">6-Axis IMU</text>
            </g>

            {/* PIN 03: Motor */}
            <g className="cursor-pointer" onClick={() => onSelectPart('inf-1')} opacity={activeLayer === 'exterior' ? 0.25 : 1}>
              <line x1="120" y1="120" x2="65" y2="120" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="55" cy="120" r="12" fill="#3b0764" stroke="#a855f7" strokeWidth="2" />
              <text x="55" y="124" fill="#d8b4fe" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">03</text>
              <rect x="0" y="90" width="95" height="20" rx="4" fill="#2e1065" stroke="#a855f7" strokeWidth="1" />
              <text x="6" y="104" fill="#d8b4fe" fontSize="9" fontFamily="monospace">8520 Motor</text>
            </g>
          </svg>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex items-center space-x-1 bg-slate-900/90 rounded-lg border border-white/10 p-1">
          <button 
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(prev + 15, 140))}
            className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(prev - 15, 75))}
            className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span>Click callout pins to inspect components</span>
        <span>Scale 1:1.2</span>
      </div>

    </div>
  );
}

BlueprintVisualizer.propTypes = { onSelectPart: PropTypes.func.isRequired };

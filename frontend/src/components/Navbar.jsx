import React from 'react';
import { Scan, Sparkles } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900/60 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Left Side: RealityLab Logo with glowing Scan icon */}
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all">
            <Scan className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Reality<span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Lab</span>
          </span>
        </div>

        {/* Right Side: Meta Hackathon badge */}
        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800/60 border border-white/10 text-xs font-medium text-slate-300 shadow-sm">
          {/* Meta Infinity Icon */}
          <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7.2c-2.4 0-4.3 1.7-5.5 3.8-1.2-2.1-3.1-3.8-5.5-3.8-3.4 0-6 2.8-6 6.5s2.6 6.5 6 6.5c2.4 0 4.3-1.7 5.5-3.8 1.2 2.1 3.1 3.8 5.5 3.8 3.4 0 6-2.8 6-6.5s-2.6-6.5-6-6.5zm-5.5 6.5c0 1.9-1.3 3.5-3.5 3.5s-3.5-1.6-3.5-3.5 1.3-3.5 3.5-3.5 3.5 1.6 3.5 3.5zm11 0c0 1.9-1.3 3.5-3.5 3.5s-3.5-1.6-3.5-3.5 1.3-3.5 3.5-3.5 3.5 1.6 3.5 3.5z" transform="translate(6, 1) scale(0.5)"/>
          </svg>
          <span className="tracking-wide">Meta Hackathon</span>
          <span className="text-purple-400 font-semibold">2026</span>
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        </div>

      </div>
    </header>
  );
}

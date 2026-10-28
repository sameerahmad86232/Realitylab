import { Sparkles, Layers, Cpu, Wrench } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="text-center py-16 md:py-24 max-w-6xl mx-auto px-6">
      
      {/* Top Small Badge */}
      <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-xl border border-white/10 text-cyan-400 text-xs font-mono tracking-wider mb-8 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span className="uppercase">AI-Powered Spatial Engineering</span>
        <span className="w-1 h-1 rounded-full bg-slate-600" />
        <span className="text-slate-400">Meta Hackathon 2026</span>
      </div>

      {/* Main Title (h1 huge and bold: text-5xl md:text-7xl) */}
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
        <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
          RealityLab
        </span>
      </h1>

      {/* Subtitle (text-slate-400, tracking-tight) */}
      <p className="text-2xl md:text-3xl text-slate-400 font-medium tracking-tight mb-4">
        Scan it. Understand it. Build it.
      </p>

      {/* Short Description */}
      <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
        Transform everyday objects into interactive engineering blueprints, concealed mechanical insights, and DIY build guides.
      </p>

      {/* 3 Pillars / Feature Cards with Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        
        <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:-translate-y-1 hover:border-cyan-500/50 transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase block mb-1">
            01. Deconstruct
          </span>
          <h3 className="text-base font-semibold text-white tracking-tight mb-2">
            Visual Segmentation
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Extracts structural boundaries, outer materials, and component interfaces from user photos.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:-translate-y-1 hover:border-purple-500/50 transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
            <Cpu className="w-5 h-5" />
          </div>
          <span className="text-xs font-mono text-purple-400 font-semibold tracking-wider uppercase block mb-1">
            02. Infer
          </span>
          <h3 className="text-base font-semibold text-white tracking-tight mb-2">
            Internal Deduction
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Deduces concealed internal mechanics, motors, sensors, and power circuitry using spatial AI.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:-translate-y-1 hover:border-blue-500/50 transition-all duration-300">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
            <Wrench className="w-5 h-5" />
          </div>
          <span className="text-xs font-mono text-blue-400 font-semibold tracking-wider uppercase block mb-1">
            03. Replicate
          </span>
          <h3 className="text-base font-semibold text-white tracking-tight mb-2">
            Maker Assembly
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Generates household materials substitutes and step-by-step reverse-engineering assembly steps.
          </p>
        </div>

      </div>

    </section>
  );
}

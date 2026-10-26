import React, { useState, useRef, useEffect } from 'react';
import { 
  Eye, 
  Hammer, 
  Sparkles, 
  CheckCircle2, 
  Cpu, 
  Box, 
  Clock, 
  Wrench, 
  Zap, 
  AlertTriangle 
} from 'lucide-react';
import BlueprintVisualizer from './BlueprintVisualizer';

export default function ResultsSection({ blueprintData, isVisible }) {
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' or 'build'
  const [selectedPartId, setSelectedPartId] = useState('obs-1');
  const resultsRef = useRef(null);

  useEffect(() => {
    if (isVisible && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isVisible]);

  if (!isVisible || !blueprintData) return null;

  return (
    <section 
      ref={resultsRef}
      className="w-full max-w-6xl mx-auto px-6 pb-24 transition-all duration-500 select-none"
    >
      
      {/* 1. Header Card with Generous Padding */}
      <div className="p-6 md:p-10 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 mb-8 transition-all duration-300 hover:border-cyan-500/50">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono tracking-wider text-cyan-400 font-medium uppercase">
                ID: {blueprintData.id}
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-mono tracking-wider text-purple-400 font-medium uppercase flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Confidence: {blueprintData.confidence}%</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {blueprintData.detectedCategory}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
              {blueprintData.objectName}
            </h2>

            <p className="text-sm md:text-base text-slate-400 max-w-3xl leading-relaxed">
              {blueprintData.summary}
            </p>
          </div>

          {/* Quick Spec Badges */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <div className="px-4 py-3 rounded-xl bg-slate-950/60 border border-white/5 text-left min-w-[110px]">
              <span className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase">Dimensions</span>
              <span className="text-sm font-semibold text-slate-200">{blueprintData.dimensions}</span>
            </div>

            <div className="px-4 py-3 rounded-xl bg-slate-950/60 border border-white/5 text-left min-w-[100px]">
              <span className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase">Weight</span>
              <span className="text-sm font-semibold text-slate-200">{blueprintData.estimatedWeight}</span>
            </div>

            <div className="px-4 py-3 rounded-xl bg-slate-950/60 border border-white/5 text-left min-w-[110px]">
              <span className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase">Build Time</span>
              <span className="text-sm font-semibold text-cyan-400">{blueprintData.estimatedBuildTime}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Tab Navigation */}
      <div className="flex items-center justify-between border-b border-white/10 mb-8 pb-4">
        
        <div className="flex items-center space-x-3">
          
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300
              ${activeTab === 'discover'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
              }
            `}
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Discover Mode</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-slate-300">
              {blueprintData.observedParts.length + blueprintData.inferredParts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('build')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300
              ${activeTab === 'build'
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
              }
            `}
          >
            <Hammer className="w-4 h-4 text-purple-400" />
            <span>Build Mode</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-slate-300">
              {blueprintData.buildSteps.length}
            </span>
          </button>

        </div>

        <p className="hidden sm:block text-xs text-slate-400">
          {activeTab === 'discover' ? 'CAD Blueprint & Component Breakdown' : 'Household Materials & Build Instructions'}
        </p>

      </div>

      {/* 3. Tab 1: DISCOVER MODE */}
      {activeTab === 'discover' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Generated Blueprint Image Placeholder */}
          <div className="lg:col-span-6">
            <BlueprintVisualizer 
              selectedPart={selectedPartId} 
              onSelectPart={(id) => setSelectedPartId(id)} 
            />
          </div>

          {/* Right: Observed & Inferred Parts */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Observed Parts */}
            <div className="p-6 md:p-8 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:-translate-y-1 hover:border-cyan-500/50 transition-all duration-300">
              
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <h3 className="text-base font-semibold text-white tracking-tight">
                    Observed Parts
                  </h3>
                </div>
                <span className="text-xs font-mono tracking-wider text-slate-400">
                  {blueprintData.observedParts.length} DETECTED
                </span>
              </div>

              <div className="space-y-3">
                {blueprintData.observedParts.map((part) => {
                  const isSelected = selectedPartId === part.id;
                  return (
                    <div
                      key={part.id}
                      onClick={() => setSelectedPartId(part.id)}
                      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer text-left
                        ${isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                          : 'bg-slate-950/40 border-white/5 hover:border-cyan-500/40 hover:bg-slate-800/30'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono tracking-wider px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-cyan-300 font-medium">
                            {part.tag}
                          </span>
                          <h4 className="text-sm font-semibold text-white">
                            {part.name}
                          </h4>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1 flex-shrink-0 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{part.confidence}%</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed mb-2">
                        {part.specs}
                      </p>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                        <span>{part.location}</span>
                        <span className="text-cyan-400 font-medium">{part.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Inferred Parts */}
            <div className="p-6 md:p-8 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:-translate-y-1 hover:border-purple-500/50 transition-all duration-300">
              
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <h3 className="text-base font-semibold text-white tracking-tight">
                    Inferred Parts
                  </h3>
                </div>
                <span className="text-xs font-mono tracking-wider text-purple-400 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>DEDUCTIVE AI</span>
                </span>
              </div>

              <div className="space-y-3">
                {blueprintData.inferredParts.map((part) => {
                  const isSelected = selectedPartId === part.id;
                  return (
                    <div
                      key={part.id}
                      onClick={() => setSelectedPartId(part.id)}
                      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer text-left
                        ${isSelected
                          ? 'bg-purple-950/40 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                          : 'bg-slate-950/40 border-white/5 hover:border-purple-500/40 hover:bg-slate-800/30'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono tracking-wider px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-purple-300 font-medium">
                            {part.tag}
                          </span>
                          <h4 className="text-sm font-semibold text-white">
                            {part.name}
                          </h4>
                        </div>
                        <span className="text-xs font-mono text-purple-400 flex items-center space-x-1 flex-shrink-0 font-medium">
                          <Cpu className="w-3.5 h-3.5" />
                          <span>{part.confidence}%</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed mb-2">
                        {part.specs}
                      </p>

                      {/* AI Inference Reasoning */}
                      <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200 mb-2">
                        <span className="text-purple-400 font-semibold mr-1">Why Inferred:</span>
                        {part.inferenceReason}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                        <span>{part.internalLocation}</span>
                        <span className="text-purple-400 font-medium">{part.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 4. Tab 2: BUILD MODE */}
      {activeTab === 'build' && (
        <div className="space-y-8">
          
          {/* Household Materials Card */}
          <div className="p-6 md:p-10 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:-translate-y-1 hover:border-cyan-500/50 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                  <Box className="w-5 h-5 text-purple-400" />
                  <span>Household Materials & Substitutes</span>
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Accessible maker alternatives for upcycled prototyping.
                </p>
              </div>

              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono tracking-wider font-semibold">
                EST. COST: ~$8.70
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {blueprintData.householdMaterials.map((mat) => (
                <div 
                  key={mat.id}
                  className="p-5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white">{mat.name}</h4>
                      <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-slate-800 border border-white/10 text-purple-300">
                        {mat.difficulty}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs mb-4">
                      <div>
                        <span className="text-slate-400 uppercase text-[10px] font-mono tracking-wider block">Standard Spec</span>
                        <span className="text-slate-300">{mat.standardSpec}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/20">
                        <span className="text-purple-400 uppercase text-[10px] font-mono tracking-wider font-semibold block mb-0.5">Household Alternative</span>
                        <span className="text-purple-200">{mat.householdAlternative}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <span>Source: {mat.source}</span>
                    <span className="text-emerald-400 font-semibold">{mat.estimatedCost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Instructions Card */}
          <div className="p-6 md:p-10 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:-translate-y-1 hover:border-cyan-500/50 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-white/10">
              <Wrench className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Step-by-Step Assembly Instructions
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Sequential protocol to build and calibrate the prototype.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {blueprintData.buildSteps.map((step) => (
                <div key={step.step} className="flex items-start space-x-4">
                  
                  {/* Step Number */}
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-cyan-400/40 text-cyan-400 flex items-center justify-center font-mono font-bold text-sm flex-shrink-0 shadow-sm">
                    0{step.step}
                  </div>

                  <div className="flex-1 p-5 rounded-xl bg-slate-950/60 border border-white/5 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h4 className="text-base font-semibold text-white">
                        {step.title}
                      </h4>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{step.duration}</span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed mb-4">
                      {step.description}
                    </p>

                    {/* Tools */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 mr-1">Tools:</span>
                      {step.tools.map((tool, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 border border-white/5 text-xs text-slate-300">
                          {tool}
                        </span>
                      ))}
                    </div>

                    {/* Pro Tip */}
                    {step.tip && (
                      <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200 mt-3 flex items-start space-x-2">
                        <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span><strong className="text-cyan-300">Pro Tip:</strong> {step.tip}</span>
                      </div>
                    )}

                    {/* Safety Notice */}
                    {step.safetyWarning && (
                      <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 mt-2 flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span><strong className="text-amber-300">Safety Notice:</strong> {step.safetyWarning}</span>
                      </div>
                    )}

                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </section>
  );
}

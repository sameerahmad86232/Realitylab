import React from 'react';
import { Loader2, Sparkles, ArrowRight } from 'lucide-react';

export default function ActionArea({ hasFiles, isLoading, onGenerate, hasGenerated }) {
  return (
    <div className="text-center mb-16 px-6 select-none">
      
      <div className="inline-block">
        <button
          type="button"
          disabled={!hasFiles || isLoading}
          onClick={onGenerate}
          className={`px-10 py-4 text-lg font-semibold rounded-xl transition-all duration-300 flex items-center justify-center space-x-3
            ${!hasFiles 
              ? 'bg-slate-800/50 border border-white/5 text-slate-500 cursor-not-allowed shadow-none'
              : isLoading
                ? 'bg-slate-900 border border-cyan-500/50 text-cyan-300 cursor-wait shadow-[0_0_25px_rgba(0,240,255,0.25)]'
                : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:scale-105 active:scale-95 cursor-pointer'
            }
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 text-cyan-300 animate-spin" />
              <span>Generating Blueprint...</span>
            </>
          ) : hasGenerated ? (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Regenerate Blueprint</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </>
          ) : (
            <>
              <span>Generate Blueprint</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </>
          )}
        </button>
      </div>

      <p className="text-sm text-slate-400 mt-3 font-medium">
        {!hasFiles 
          ? "Upload at least 1 photo to analyze" 
          : isLoading 
            ? "Analyzing spatial geometry and subassemblies..."
            : "Ready to deconstruct into engineering blueprints"
        }
      </p>

    </div>
  );
}

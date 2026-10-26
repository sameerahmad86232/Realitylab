import React, { useRef, useState } from 'react';
import { Upload, X, AlertCircle, Sparkles, Plus, Image as ImageIcon } from 'lucide-react';

export default function UploadZone({ files, setFiles, onSelectSample }) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFiles = (incomingFiles) => {
    setErrorMsg('');
    const validFiles = Array.from(incomingFiles).filter(file => {
      return file.type.startsWith('image/jpeg') || file.type.startsWith('image/png') || file.type.startsWith('image/webp');
    });

    if (validFiles.length === 0) {
      setErrorMsg('Please upload JPG or PNG images.');
      return;
    }

    if (files.length + validFiles.length > 3) {
      setErrorMsg('You can upload up to 3 photos.');
    }

    const availableSlots = Math.max(0, 3 - files.length);
    const filesToAdd = validFiles.slice(0, availableSlots).map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      preview: URL.createObjectURL(file),
      rawFile: file,
    }));

    setFiles(prev => [...prev, ...filesToAdd]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (idToRemove, e) => {
    e.stopPropagation();
    setFiles(prev => {
      const target = prev.find(f => f.id === idToRemove);
      if (target && target.preview && !target.isSample) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter(f => f.id !== idToRemove);
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 mb-10 select-none">
      
      {/* Upload Drop Zone */}
      <div 
        onClick={() => files.length < 3 && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-2xl p-6 md:p-12 text-center transition-all duration-300 cursor-pointer
          bg-slate-900/60 backdrop-blur-xl border-2 border-dashed
          ${isDragging 
            ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)] bg-slate-900/80 scale-[1.01]' 
            : 'border-slate-700 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]'
          }
        `}
      >
        {/* Hidden File Input */}
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          accept="image/png, image/jpeg, image/jpg, image/webp" 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
          disabled={files.length >= 3}
        />

        {/* Empty State */}
        {files.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center">
            
            {/* Large Upload Icon (w-12 h-12 text-slate-400) */}
            <div className="w-20 h-20 rounded-2xl bg-slate-800/60 border border-white/10 flex items-center justify-center mb-6 text-slate-400 shadow-inner">
              <Upload className="w-12 h-12 text-slate-400" />
            </div>

            <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight mb-2">
              Click to upload or drag and drop
            </h3>
            
            <p className="text-sm md:text-base text-slate-400 max-w-md mb-8">
              Upload up to 3 photos (JPG, PNG)
            </p>

            {/* Quick Demo Sample Button */}
            <div onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={onSelectSample}
                className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-400/50 text-cyan-400 text-xs font-mono tracking-wider uppercase inline-flex items-center space-x-2 transition-all shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Load Sample Photos (Drone Model RL-4X)</span>
              </button>
            </div>

          </div>
        ) : (
          /* Thumbnail Previews */
          <div className="py-2" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between text-sm text-slate-400 mb-6 font-medium">
              <span>{files.length} of 3 photos selected</span>
              {files.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-mono tracking-wider uppercase flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another photo</span>
                </button>
              )}
            </div>

            {/* Previews Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {files.map((file, idx) => (
                <div 
                  key={file.id} 
                  className="relative group rounded-xl overflow-hidden bg-slate-900 border border-white/10 p-3 flex flex-col justify-between hover:border-cyan-500/50 transition-all duration-300"
                >
                  {/* Photo Index Tag */}
                  <div className="absolute top-5 left-5 z-10 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur border border-white/10 text-[10px] font-mono tracking-wider text-slate-300">
                    PHOTO 0{idx + 1}
                  </div>

                  {/* Remove "X" Button */}
                  <button
                    type="button"
                    onClick={(e) => removeFile(file.id, e)}
                    className="absolute top-5 right-5 z-10 w-7 h-7 rounded-full bg-slate-900/90 border border-white/10 text-slate-400 hover:text-white hover:bg-red-500/80 flex items-center justify-center transition-all shadow-md"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Image Thumbnail */}
                  <div className="w-full h-44 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center mb-3">
                    <img 
                      src={file.preview} 
                      alt={file.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>

                  {/* File Metadata */}
                  <div className="text-left px-1">
                    <p className="text-sm font-medium text-slate-200 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {file.size}
                    </p>
                  </div>
                </div>
              ))}

              {/* Slot placeholder if < 3 */}
              {files.length < 3 && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-slate-800 hover:border-slate-600 bg-slate-900/30 flex flex-col items-center justify-center h-60 cursor-pointer text-slate-400 hover:text-slate-300 transition-all"
                >
                  <Plus className="w-6 h-6 mb-2 text-slate-500" />
                  <span className="text-xs font-mono tracking-wider uppercase">Add Photo 0{files.length + 1}</span>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="mt-4 flex items-center space-x-2 text-sm text-amber-300 bg-amber-950/40 border border-amber-500/30 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

    </div>
  );
}

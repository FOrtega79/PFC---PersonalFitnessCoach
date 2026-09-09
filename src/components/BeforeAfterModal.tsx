import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Sparkles, Sliders, Columns, RefreshCw, Copy, Check, TrendingDown, TrendingUp, Award, Dumbbell, ShieldCheck, ChevronRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export interface PhotoLog {
  date: string;
  weight: number;
  photo: string | null;
  angle?: 'Front' | 'Side' | 'Back' | 'General';
  note?: string;
}

interface AIAnalysisResult {
  status: string;
  summary: string;
  consistencyRating?: string;
  highlights: string[];
  physiqueObservations: {
    muscleDefinition: string;
    bodyComposition: string;
    postureAndForm: string;
  };
  coachFeedback: string;
  nextMilestoneAdvice: string[];
}

interface BeforeAfterModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: PhotoLog[];
  userGoal?: string;
}

export default function BeforeAfterModal({ isOpen, onClose, logs, userGoal = 'Fitness' }: BeforeAfterModalProps) {
  const photoLogs = logs.filter(l => l.photo);
  const [beforeIdx, setBeforeIdx] = useState(0);
  const [afterIdx, setAfterIdx] = useState(photoLogs.length - 1 >= 0 ? photoLogs.length - 1 : 0);
  const [activeTab, setActiveTab] = useState<'slider' | 'sideBySide' | 'aiAnalysis'>('slider');
  
  // Interactive Slider State
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // AI Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Update indexes when logs change
  useEffect(() => {
    if (photoLogs.length >= 2) {
      setBeforeIdx(0);
      setAfterIdx(photoLogs.length - 1);
    }
  }, [logs]);

  // Handle curtain slider mouse/touch drag
  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length > 0) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleSliderMove(e.clientX);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);

  if (!isOpen || photoLogs.length < 2) return null;

  const beforeLog = photoLogs[beforeIdx] || photoLogs[0];
  const afterLog = photoLogs[afterIdx] || photoLogs[photoLogs.length - 1];

  const weightDiff = (afterLog.weight - beforeLog.weight).toFixed(1);
  const isWeightDown = Number(weightDiff) < 0;

  const handleRunAIAnalysis = async () => {
    if (!beforeLog.photo || !afterLog.photo) {
      toast.error('Both photos are required for AI analysis.');
      return;
    }

    setAnalyzing(true);
    setActiveTab('aiAnalysis');

    try {
      const res = await fetch('/api/analyze-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beforeImageBase64: beforeLog.photo,
          afterImageBase64: afterLog.photo,
          beforeDate: beforeLog.date,
          afterDate: afterLog.date,
          beforeWeight: beforeLog.weight,
          afterWeight: afterLog.weight,
          userGoal: userGoal,
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate analysis');
      }

      const data = await res.json();
      setAiResult(data);
      toast.success('AI Progress Breakdown generated!');
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      toast.error('Could not analyze photos right now. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopySummary = () => {
    if (!aiResult) return;
    const textToCopy = `🏋️ Transformation Summary (${beforeLog.date} -> ${afterLog.date})\n` +
      `⚖️ Weight: ${beforeLog.weight}kg -> ${afterLog.weight}kg (${Number(weightDiff) > 0 ? '+' : ''}${weightDiff}kg)\n` +
      `🔥 Coach Assessment:\n${aiResult.summary}\n\n` +
      `✨ Highlights:\n${aiResult.highlights.map(h => `• ${h}`).join('\n')}\n\n` +
      `🎯 Next Milestone:\n${aiResult.nextMilestoneAdvice.map(a => `• ${a}`).join('\n')}`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Analysis copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#0F172A] border border-white/15 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-light tracking-wider uppercase text-white">Progress Comparison</h2>
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/50 tracking-wider">
                <span>{beforeLog.date} ({beforeLog.weight}kg)</span>
                <span>→</span>
                <span>{afterLog.date} ({afterLog.weight}kg)</span>
                <span className={`px-1.5 py-0.5 rounded font-mono ${isWeightDown ? 'bg-teal-500/20 text-teal-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                  {Number(weightDiff) > 0 ? `+${weightDiff}` : weightDiff} kg
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-1 border-b border-white/10 bg-black/20 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('slider')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-all ${
                activeTab === 'slider' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Curtain Slider</span>
            </button>
            <button
              onClick={() => setActiveTab('sideBySide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-all ${
                activeTab === 'sideBySide' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side by Side</span>
            </button>
          </div>

          <button
            onClick={handleRunAIAnalysis}
            disabled={analyzing}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono tracking-wider uppercase transition-all shadow-lg ${
              activeTab === 'aiAnalysis'
                ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-fuchsia-500/20'
                : 'bg-white/10 hover:bg-white/15 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Analyzing...' : 'AI Breakdown'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto no-scrollbar space-y-6">
          
          {/* TAB 1: CURTAIN SLIDER */}
          {activeTab === 'slider' && (
            <div className="space-y-4">
              <div 
                ref={containerRef}
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden select-none cursor-ew-resize bg-black shadow-inner border border-white/10"
              >
                {/* AFTER IMAGE (Background / Full Width) */}
                <img 
                  src={afterLog.photo!} 
                  alt="After" 
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-lg border border-white/10 z-10">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-white/90">After: {afterLog.date} ({afterLog.weight}kg)</span>
                </div>

                {/* BEFORE IMAGE (Clipped / Foreground) */}
                <div 
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img 
                    src={beforeLog.photo!} 
                    alt="Before" 
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ 
                      width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                      maxWidth: 'none'
                    }}
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-lg border border-white/10 z-10">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-indigo-300">Before: {beforeLog.date} ({beforeLog.weight}kg)</span>
                  </div>
                </div>

                {/* DIVIDER HANDLE */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                  style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-indigo-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
              <p className="text-center text-[11px] font-mono text-white/40 tracking-wider">
                ↔ Drag slider left or right to wipe between Before and After
              </p>
            </div>
          )}

          {/* TAB 2: SIDE BY SIDE */}
          {activeTab === 'sideBySide' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Before Card */}
                <div className="flex flex-col relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 group shadow-lg">
                  <div className="h-64 sm:h-80 w-full relative">
                    <img src={beforeLog.photo!} alt="Before" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-md border border-white/10">
                      <span className="text-[10px] font-mono tracking-wider uppercase text-indigo-300">Before</span>
                    </div>
                    <div className="absolute bottom-3 left-3 flex flex-col">
                      <span className="text-white font-mono text-[10px] tracking-widest uppercase opacity-75">{beforeLog.date}</span>
                      <span className="text-white font-light text-sm tracking-wider">{beforeLog.weight} kg</span>
                    </div>
                  </div>
                </div>

                {/* After Card */}
                <div className="flex flex-col relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 group shadow-lg">
                  <div className="h-64 sm:h-80 w-full relative">
                    <img src={afterLog.photo!} alt="After" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-md border border-white/10">
                      <span className="text-[10px] font-mono tracking-wider uppercase text-teal-300">After</span>
                    </div>
                    <div className="absolute bottom-3 left-3 flex flex-col">
                      <span className="text-white font-mono text-[10px] tracking-widest uppercase opacity-75">{afterLog.date}</span>
                      <span className="text-white font-light text-sm tracking-wider">{afterLog.weight} kg</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-around text-center">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">Weight Change</p>
                  <p className={`text-base font-light font-mono ${isWeightDown ? 'text-teal-300' : 'text-indigo-300'}`}>
                    {Number(weightDiff) > 0 ? `+${weightDiff}` : weightDiff} kg
                  </p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">Time Elapsed</p>
                  <p className="text-base font-light text-white font-mono">
                    {beforeLog.date} → {afterLog.date}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI ANALYSIS */}
          {activeTab === 'aiAnalysis' && (
            <div className="space-y-6">
              {analyzing ? (
                <div className="p-8 bg-gradient-to-b from-indigo-950/40 to-black/60 border border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-spin">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-light tracking-wider uppercase text-white">AI Coach is Analyzing Your Photos</h3>
                    <p className="text-xs font-mono text-white/50 mt-1">Comparing muscle definition, posture alignment & leanness...</p>
                  </div>
                </div>
              ) : aiResult ? (
                <div className="space-y-5 animate-in fade-in duration-300">
                  
                  {/* Summary & Rating Card */}
                  <div className="p-5 bg-gradient-to-r from-fuchsia-600/15 via-indigo-600/15 to-blue-600/15 border border-fuchsia-500/30 rounded-2xl space-y-3 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-fuchsia-300">
                        <Award className="w-4 h-4 text-fuchsia-400" /> Transformation Assessment
                      </span>
                      {aiResult.consistencyRating && (
                        <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-mono tracking-wider text-white border border-white/15 uppercase">
                          {aiResult.consistencyRating}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-light text-white/90 leading-relaxed font-sans">
                      {aiResult.summary}
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  {aiResult.highlights && aiResult.highlights.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono tracking-widest uppercase text-white/60 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-indigo-400" /> Key Visible Improvements
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5">
                        {aiResult.highlights.map((h, i) => (
                          <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono">
                              ✓
                            </div>
                            <span className="text-xs text-white/80 font-light leading-relaxed">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detailed Observations */}
                  {aiResult.physiqueObservations && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono tracking-widest uppercase text-white/60 flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Biomechanical & Physique Breakdown
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-1.5">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-indigo-300">Muscle Definition</p>
                          <p className="text-xs text-white/70 font-light leading-relaxed">
                            {aiResult.physiqueObservations.muscleDefinition}
                          </p>
                        </div>
                        <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-1.5">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-fuchsia-300">Body Composition</p>
                          <p className="text-xs text-white/70 font-light leading-relaxed">
                            {aiResult.physiqueObservations.bodyComposition}
                          </p>
                        </div>
                        <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-1.5">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-teal-300">Posture & Form</p>
                          <p className="text-xs text-white/70 font-light leading-relaxed">
                            {aiResult.physiqueObservations.postureAndForm}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Coach Advice */}
                  {aiResult.nextMilestoneAdvice && aiResult.nextMilestoneAdvice.length > 0 && (
                    <div className="p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl space-y-2">
                      <p className="text-xs font-mono uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                        <Dumbbell className="w-3.5 h-3.5" /> Next 30-Day Focus
                      </p>
                      <ul className="space-y-1.5">
                        {aiResult.nextMilestoneAdvice.map((a, i) => (
                          <li key={i} className="text-xs text-white/80 font-light flex items-start gap-2">
                            <span className="text-indigo-400 font-mono">•</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleCopySummary}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied' : 'Copy Breakdown'}</span>
                    </button>
                    <button
                      onClick={handleRunAIAnalysis}
                      className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white font-mono text-xs uppercase flex items-center justify-center gap-2 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ) : (
                <div className="p-8 bg-black/40 border border-white/10 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-300 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-light tracking-wider uppercase text-white">AI Progress Analysis</h3>
                    <p className="text-xs text-white/50 max-w-sm mx-auto mt-1 font-light leading-relaxed">
                      Let our AI analyze muscle tone evolution, fat distribution, postural symmetry, and generate your customized next-stage coaching advice.
                    </p>
                  </div>
                  <button
                    onClick={handleRunAIAnalysis}
                    className="px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-90 text-white rounded-xl font-mono text-xs tracking-wider uppercase shadow-xl transition-all inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Run AI Assessment
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PHOTO TIMELINE PICKER (Allows swapping before and after easily) */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/50">
              Select Photos to Compare ({photoLogs.length} photos available)
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono uppercase tracking-wider text-indigo-300 mb-1 block">
                  1. "Before" Photo
                </label>
                <select
                  value={beforeIdx}
                  onChange={(e) => {
                    setBeforeIdx(Number(e.target.value));
                    setAiResult(null);
                  }}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                >
                  {photoLogs.map((l, i) => (
                    <option key={i} value={i} className="bg-[#0F172A]">
                      {l.date} - {l.weight}kg {l.angle ? `(${l.angle})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-mono uppercase tracking-wider text-teal-300 mb-1 block">
                  2. "After" Photo
                </label>
                <select
                  value={afterIdx}
                  onChange={(e) => {
                    setAfterIdx(Number(e.target.value));
                    setAiResult(null);
                  }}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                >
                  {photoLogs.map((l, i) => (
                    <option key={i} value={i} className="bg-[#0F172A]">
                      {l.date} - {l.weight}kg {l.angle ? `(${l.angle})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

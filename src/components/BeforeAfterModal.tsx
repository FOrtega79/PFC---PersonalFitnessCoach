import React, { useState, useRef } from 'react';
import { X, Share2 } from 'lucide-react';

interface Log {
  date: string;
  weight: number;
  photo: string | null;
}

export default function BeforeAfterModal({ isOpen, onClose, logs }: { isOpen: boolean, onClose: () => void, logs: Log[] }) {
  const photoLogs = logs.filter(l => l.photo);
  const [beforeIdx, setBeforeIdx] = useState(0);
  const [afterIdx, setAfterIdx] = useState(photoLogs.length - 1 >= 0 ? photoLogs.length - 1 : 0);

  if (!isOpen || photoLogs.length < 2) return null;

  const beforeLog = photoLogs[beforeIdx];
  const afterLog = photoLogs[afterIdx];

  const handleShare = () => {
    alert('Share feature would generate an image and invoke native share!');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#0F172A] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-xl font-light tracking-widest uppercase text-white">Before & After</h2>
            <p className="text-white/50 font-mono text-[10px] tracking-widest uppercase">Your Progress Journey</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto no-scrollbar flex flex-col">
          {/* Comparison View */}
          <div className="flex gap-2 sm:gap-4 mb-8 bg-black/50 p-2 sm:p-4 rounded-2xl border border-white/5">
            {/* Before */}
            <div className="flex-1 flex flex-col relative rounded-xl overflow-hidden group">
              <img src={beforeLog.photo!} alt="Before" className="w-full h-48 sm:h-80 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md">
                <span className="text-[10px] font-mono tracking-widest uppercase text-white/70">Before</span>
              </div>
              <div className="absolute bottom-3 left-3 flex flex-col">
                <span className="text-white font-mono text-[10px] tracking-widest uppercase mb-1 opacity-80">{beforeLog.date}</span>
                <span className="text-white font-light tracking-wider text-sm">{beforeLog.weight} kg</span>
              </div>
            </div>
            
            {/* After */}
            <div className="flex-1 flex flex-col relative rounded-xl overflow-hidden group">
              <img src={afterLog.photo!} alt="After" className="w-full h-48 sm:h-80 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md">
                <span className="text-[10px] font-mono tracking-widest uppercase text-white/70">After</span>
              </div>
              <div className="absolute bottom-3 left-3 flex flex-col">
                <span className="text-white font-mono text-[10px] tracking-widest uppercase mb-1 opacity-80">{afterLog.date}</span>
                <span className="text-white font-light tracking-wider text-sm">{afterLog.weight} kg</span>
              </div>
            </div>
          </div>

          {/* Selectors */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/50">Select Before</label>
              <select 
                value={beforeIdx} 
                onChange={(e) => setBeforeIdx(Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              >
                {photoLogs.map((l, i) => (
                  <option key={i} value={i} className="bg-[#0F172A]">{l.date} - {l.weight}kg</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/50">Select After</label>
              <select 
                value={afterIdx} 
                onChange={(e) => setAfterIdx(Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              >
                {photoLogs.map((l, i) => (
                  <option key={i} value={i} className="bg-[#0F172A]">{l.date} - {l.weight}kg</option>
                ))}
              </select>
            </div>
          </div>

          {/* Share Button */}
          <button 
            onClick={handleShare}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 mt-auto"
          >
            <Share2 className="w-4 h-4" />
            Share Progress
          </button>
        </div>
      </div>
    </div>
  )
}

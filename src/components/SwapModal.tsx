import { X, CheckCircle2 } from 'lucide-react';
import { ALTERNATIVE_EXERCISES } from '../pages/Exercises';

interface SwapModalProps {
  onClose: () => void;
  onSwap: (altExercise: any) => void;
}

export default function SwapModal({ onClose, onSwap }: SwapModalProps) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-end sm:justify-center sm:p-4">
      <div className="bg-[#1e1b4b] w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 pb-4 shrink-0">
          <h2 className="text-xl font-light tracking-widest text-white uppercase">Swap Exercise</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-6 pt-2 space-y-4 custom-scrollbar">
          {ALTERNATIVE_EXERCISES.map(alt => (
            <div key={alt.id} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-colors cursor-pointer flex items-center gap-4 group" onClick={() => onSwap(alt)}>
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <img src={alt.imgUrl} alt={alt.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-light tracking-widest text-white mb-1">{alt.name}</h3>
                <p className="text-[10px] font-mono text-white/50">{alt.sets}</p>
              </div>
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/30 group-hover:text-indigo-400 group-hover:border-indigo-500/50 transition-colors">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

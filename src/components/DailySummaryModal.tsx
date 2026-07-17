import { X, Trophy, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DailySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCals: number;
}

export default function DailySummaryModal({ isOpen, onClose, targetCals }: DailySummaryModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-[#0F172A] border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col p-8 items-center text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 mt-4">
              <Trophy className="w-10 h-10 text-indigo-400" />
            </div>

            <h2 className="text-2xl font-light tracking-widest text-white/90 mb-2">
              DAY COMPLETE
            </h2>
            <p className="text-sm font-mono text-white/50 mb-8">
              Awesome work hitting your daily goals!
            </p>

            <div className="w-full grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                <Flame className="w-6 h-6 text-orange-400 mb-2" />
                <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase mb-1">Burned</p>
                <p className="font-light tracking-wider text-white">~450 kcal</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                <Trophy className="w-6 h-6 text-fuchsia-400 mb-2" />
                <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase mb-1">Consumed</p>
                <p className="font-light tracking-wider text-white">{targetCals} kcal</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="mt-8 w-full py-4 bg-white text-black rounded-2xl font-mono text-xs tracking-widest uppercase hover:bg-white/90 transition-colors"
            >
              Keep it up
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

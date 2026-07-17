import { useState, useEffect } from 'react';
import { X, Play, Pause, CheckCircle2, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import { WARM_UP_EXERCISES, COOL_DOWN_EXERCISES } from '../pages/Exercises';

interface Exercise {
  id: string;
  name: string;
  sets: string;
  videoUrl: string;
  imgUrl: string;
}

interface WorkoutModeProps {
  exercises: Exercise[];
  onClose: () => void;
  onComplete: () => void;
  defaultRestTime: number;
}

export default function WorkoutMode({ exercises, onClose, onComplete, defaultRestTime }: WorkoutModeProps) {
  const [fullWorkoutSequence] = useState(() => {
    const mainExercises = exercises.filter(
      ex => !ex.name.toLowerCase().includes('warm-up') && !ex.name.toLowerCase().includes('cool down')
    );
    return [
      ...WARM_UP_EXERCISES.map(e => ({ ...e, id: 'mandatory_wu_' + e.id, phase: 'Warm-up' })),
      ...mainExercises.map(e => ({ ...e, phase: 'Main Workout' })),
      ...COOL_DOWN_EXERCISES.map(e => ({ ...e, id: 'mandatory_cd_' + e.id, phase: 'Cool-down' }))
    ];
  });

  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(defaultRestTime);
  const [exerciseSecondsLeft, setExerciseSecondsLeft] = useState<number | null>(null);
  const [isExerciseTimerRunning, setIsExerciseTimerRunning] = useState(false);
  const [exerciseTotalSeconds, setExerciseTotalSeconds] = useState(0);
  
  const currentExercise = fullWorkoutSequence[currentExerciseIdx];
  const totalSets = parseInt(currentExercise?.sets.match(/(\d+)\s*sets?/i)?.[1] || '1');

  useEffect(() => {
    if (!currentExercise) return;
    const timeMatch = currentExercise.sets.match(/(\d+)\s*(min|sec)/i);
    if (timeMatch) {
      let secs = parseInt(timeMatch[1]);
      if (timeMatch[2].toLowerCase().startsWith('min')) secs *= 60;
      setExerciseTotalSeconds(secs);
      setExerciseSecondsLeft(secs);
      setIsExerciseTimerRunning(false);
    } else {
      setExerciseTotalSeconds(0);
      setExerciseSecondsLeft(null);
      setIsExerciseTimerRunning(false);
    }
  }, [currentExerciseIdx, currentSet]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isResting && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds(s => s - 1);
      }, 1000);
    } else if (isResting && restSeconds === 0) {
      setIsResting(false);
      handleNextSetOrExercise();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResting, restSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isExerciseTimerRunning && exerciseSecondsLeft !== null && exerciseSecondsLeft > 0) {
      interval = setInterval(() => {
        setExerciseSecondsLeft(s => (s !== null ? s - 1 : 0));
      }, 1000);
    } else if (isExerciseTimerRunning && exerciseSecondsLeft === 0) {
      setIsExerciseTimerRunning(false);
      handleLogSet();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isExerciseTimerRunning, exerciseSecondsLeft]);

  const handleNextSetOrExercise = () => {
    if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1);
      setIsResting(false);
    } else {
      if (currentExerciseIdx < fullWorkoutSequence.length - 1) {
        setCurrentExerciseIdx(prev => prev + 1);
        setCurrentSet(1);
        setIsResting(false);
      } else {
        onComplete();
      }
    }
  };

  const handleLogSet = () => {
    if (currentSet === totalSets && currentExerciseIdx === fullWorkoutSequence.length - 1) {
      onComplete();
    } else {
      // Start rest timer
      setRestSeconds(defaultRestTime);
      setIsResting(true);
    }
  };

  const skipRest = () => {
    setIsResting(false);
    handleNextSetOrExercise();
  };

  const skipExercise = () => {
    setIsResting(false);
    if (currentExerciseIdx < fullWorkoutSequence.length - 1) {
      setCurrentExerciseIdx(prev => prev + 1);
      setCurrentSet(1);
    } else {
      onComplete();
    }
  };

  const prevExercise = () => {
    setIsResting(false);
    if (currentExerciseIdx > 0) {
      setCurrentExerciseIdx(prev => prev - 1);
      setCurrentSet(1);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentExercise) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0F172A] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center p-4 sm:p-6 bg-black/30 backdrop-blur-md relative z-10">
        <button onClick={onClose} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white transition-colors">
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <div className="flex gap-1.5 overflow-x-auto max-w-[200px] no-scrollbar">
          {fullWorkoutSequence.map((ex, idx) => (
            <div 
              key={`${ex.id}-${idx}`} 
              className={`h-1.5 w-4 sm:w-6 shrink-0 rounded-full transition-colors ${
                idx < currentExerciseIdx ? 'bg-green-500' : 
                idx === currentExerciseIdx ? 'bg-indigo-500' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
        <div className="w-8 sm:w-10" /> {/* spacer */}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
        <div className="absolute inset-0 z-0">
          <img src={currentExercise.imgUrl} alt={currentExercise.name} className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-transparent" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center min-h-max py-8">
          {isResting ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <span className="px-3 py-1 bg-white/10 text-white/70 rounded-full text-[10px] font-mono tracking-widest uppercase mb-6 backdrop-blur-md">
                {fullWorkoutSequence[currentExerciseIdx + (currentSet < totalSets ? 0 : 1)]?.phase || 'Workout'}
              </span>
              <h2 className="text-3xl font-light tracking-widest text-white/90 uppercase mb-2">Rest</h2>
              <p className="text-white/50 font-mono text-sm tracking-widest uppercase mb-12">Prepare for {currentSet < totalSets ? `Set ${currentSet + 1}` : 'Next Exercise'}</p>
              
              <div className="relative flex items-center justify-center mb-6 sm:mb-12">
                <svg className="w-48 h-48 sm:w-64 sm:h-64 transform -rotate-90">
                  <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
                  <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="283%" strokeDashoffset={`${283 - (restSeconds / 60) * 283}%`} strokeLinecap="round" className="text-indigo-500 transition-all duration-1000 ease-linear" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-5xl sm:text-6xl font-mono tracking-wider font-light tabular-nums text-white">
                    {formatTime(restSeconds)}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setRestSeconds(prev => prev + 15)} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 font-mono text-xs uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white transition-colors">+15s</button>
                <button onClick={skipRest} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 font-mono text-xs uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white transition-colors">Skip Rest</button>
                <button onClick={() => setRestSeconds(prev => Math.max(0, prev - 15))} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 font-mono text-xs uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white transition-colors">-15s</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-300">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-mono tracking-widest uppercase mb-6 backdrop-blur-md">
                {currentExercise.phase || 'Workout'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-light tracking-widest text-white mb-2 sm:mb-4 uppercase">{currentExercise.name}</h2>
              <p className="text-indigo-400 font-mono text-xs sm:text-sm tracking-widest uppercase mb-6 sm:mb-12">{currentExercise.sets}</p>
              
              {exerciseTotalSeconds > 0 && exerciseSecondsLeft !== null && (
                <div className="relative flex flex-col items-center justify-center mb-6 sm:mb-12">
                  <div className="relative flex items-center justify-center mb-4 sm:mb-8">
                    <svg className="w-48 h-48 sm:w-64 sm:h-64 transform -rotate-90">
                      <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
                      <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="283%" strokeDashoffset={`${283 - (exerciseSecondsLeft / exerciseTotalSeconds) * 283}%`} strokeLinecap="round" className="text-green-500 transition-all duration-1000 ease-linear" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-5xl sm:text-6xl font-mono tracking-wider font-light tabular-nums text-white">
                        {formatTime(exerciseSecondsLeft)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mb-2 sm:mb-4">
                    <button 
                      onClick={() => setIsExerciseTimerRunning(!isExerciseTimerRunning)}
                      className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-colors ${!isExerciseTimerRunning ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/10 text-white'}`}
                    >
                      {isExerciseTimerRunning ? <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current ml-1" />}
                    </button>
                    {exerciseSecondsLeft !== exerciseTotalSeconds && !isExerciseTimerRunning && (
                      <button 
                        onClick={() => {
                          setExerciseSecondsLeft(exerciseTotalSeconds);
                          setIsExerciseTimerRunning(false);
                        }}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                      >
                        <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {totalSets > 1 && (
                <div className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-sm mb-6 sm:mb-12">
                  <div className="flex justify-between w-full px-4 sm:px-8">
                    {Array.from({ length: totalSets }).map((_, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1 sm:gap-2">
                        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
                          idx + 1 < currentSet ? 'bg-green-500/20 border-green-500 text-green-400' :
                          idx + 1 === currentSet ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' :
                          'border-white/20 text-white/30'
                        }`}>
                          {idx + 1 < currentSet ? <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" /> : <span className="font-mono text-sm sm:text-lg">{idx + 1}</span>}
                        </div>
                        <span className={`text-[8px] sm:text-[10px] font-mono uppercase tracking-widest ${idx + 1 === currentSet ? 'text-indigo-400' : 'text-white/30'}`}>
                          Set {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={handleLogSet}
                className="w-full max-w-sm py-4 sm:py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-sm tracking-widest uppercase shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5" />
                {totalSets === 1 ? 'Complete Exercise' : `Complete Set ${currentSet}`}
              </button>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <footer className="p-6 bg-black/50 backdrop-blur-md flex justify-between items-center relative z-10">
          <button 
            onClick={prevExercise}
            disabled={currentExerciseIdx === 0}
            className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-white/50 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          
          <button
             onClick={() => window.open(currentExercise.videoUrl, '_blank')}
             className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono tracking-widest uppercase text-indigo-400 hover:bg-white/10 hover:text-indigo-300 transition-colors"
          >
            Watch Tutorial
          </button>
          
          <button 
            onClick={skipExercise}
            className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-white/50 hover:text-white transition-colors"
          >
            Skip
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </div>
    </div>
  );
}

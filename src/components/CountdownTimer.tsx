import { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw } from 'lucide-react';

interface CountdownTimerProps {
  initialSeconds: number;
  exerciseName: string;
  onClose: () => void;
}

export default function CountdownTimer({ initialSeconds, exerciseName, onClose }: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      if (interval) clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSeconds(initialSeconds);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress circle stroke dasharray
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (seconds / initialSeconds) * circumference;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-3xl p-8 relative shadow-2xl flex flex-col items-center">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-xl font-light tracking-widest text-white/90 mb-2 text-center uppercase">{exerciseName}</h3>
        <p className="text-white/50 font-mono text-xs uppercase tracking-widest mb-8">Timer</p>

        <div className="relative flex items-center justify-center mb-10">
          {/* Background Circle */}
          <svg className="w-64 h-64 transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-white/10"
            />
            {/* Progress Circle */}
            <circle
              cx="128"
              cy="128"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-linear ${seconds > 10 ? 'text-indigo-500' : 'text-red-500'}`}
            />
          </svg>
          
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-mono tracking-wider font-light tabular-nums">
              {formatTime(seconds)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={resetTimer}
            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button 
            onClick={toggleTimer}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isActive 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)]'
            }`}
          >
            {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
}

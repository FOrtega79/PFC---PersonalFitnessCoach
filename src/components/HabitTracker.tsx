import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { format, subDays } from 'date-fns';

export default function HabitTracker() {
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [nutritionStreak, setNutritionStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const workoutsRef = collection(db, 'users', user.uid, 'completed_workouts');
        const workoutsQ = query(workoutsRef, orderBy('date', 'desc'), limit(30));
        const workoutsSnap = await getDocs(workoutsQ);
        const workouts = workoutsSnap.docs.map(d => d.data());

        const nutritionRef = collection(db, 'users', user.uid, 'completed_nutrition');
        const nutritionQ = query(nutritionRef, orderBy('date', 'desc'), limit(30));
        const nutritionSnap = await getDocs(nutritionQ);
        const nutritions = nutritionSnap.docs.map(d => d.data());

        const calculateStreak = (records: any[]) => {
          let streak = 0;
          let currentDate = new Date();
          let foundToday = false;

          const todayStr = format(currentDate, 'yyyy-MM-dd');
          const todayRecord = records.find(w => w.date === todayStr);
          
          if (todayRecord?.completed) {
            streak++;
            foundToday = true;
          }

          let checkDate = foundToday ? subDays(currentDate, 1) : currentDate;
          
          for (let i = 0; i < 30; i++) {
            const dateStr = format(checkDate, 'yyyy-MM-dd');
            const record = records.find(w => w.date === dateStr);
            
            if (record?.completed) {
              streak++;
              checkDate = subDays(checkDate, 1);
            } else {
              if (!foundToday && i === 0) {
                const yesterdayStr = format(subDays(currentDate, 1), 'yyyy-MM-dd');
                const yesterdayRecord = records.find(w => w.date === yesterdayStr);
                if (yesterdayRecord?.completed) {
                  checkDate = subDays(currentDate, 1);
                  continue;
                }
              }
              break;
            }
          }
          return streak;
        };

        setWorkoutStreak(calculateStreak(workouts));
        setNutritionStreak(calculateStreak(nutritions));

      } catch (error) {
        console.error('Error calculating streaks:', error);
      } finally {
        setLoading(false);
      }
    });
    
    return unsub;
  }, []);

  // Ring component
  const ProgressRing = ({ radius, stroke, progress, colorClass, label, value }: any) => {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const maxStreak = 7; // Target weekly streak
    const strokeDashoffset = circumference - (Math.min(progress, maxStreak) / maxStreak) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
          >
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="text-white/10"
            />
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className={`transition-all duration-1000 ease-in-out ${colorClass}`}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xl font-light tracking-wider tabular-nums">{value}</span>
          </div>
        </div>
        <span className="mt-3 text-[10px] font-mono tracking-widest uppercase text-white/50">{label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/70">Habit Streaks</h3>
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/40">Weekly Goal: 7</span>
      </div>
      
      <div className="flex justify-around items-center">
        <ProgressRing 
          radius={45} 
          stroke={6} 
          progress={workoutStreak} 
          value={workoutStreak}
          colorClass="text-indigo-400" 
          label="Workouts" 
        />
        <ProgressRing 
          radius={45} 
          stroke={6} 
          progress={nutritionStreak} 
          value={nutritionStreak}
          colorClass="text-fuchsia-400" 
          label="Nutrition" 
        />
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Trophy, Medal, Star, Flame, Target } from 'lucide-react';

export default function Achievements() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState({ currentStreak: 0, thisWeek: 0 });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const workoutsRef = collection(db, 'users', user.uid, 'completed_workouts');
        const workoutsQ = query(workoutsRef, orderBy('date', 'desc'));
        const workoutsSnap = await getDocs(workoutsQ);
        const workouts = workoutsSnap.docs.map(d => d.data());

        const nutritionRef = collection(db, 'users', user.uid, 'completed_nutrition');
        const nutritionQ = query(nutritionRef, orderBy('date', 'desc'));
        const nutritionSnap = await getDocs(nutritionQ);
        const nutritions = nutritionSnap.docs.map(d => d.data());

        // Calculations
        const totalWorkouts = workouts.filter(w => w.completed).length;

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
          
          for (let i = 0; i < 365; i++) {
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

        const workoutStreak = calculateStreak(workouts);
        const nutritionStreak = calculateStreak(nutritions);

        const earned = [];

        // First Workout
        if (totalWorkouts >= 1) {
          earned.push({ id: 'first_workout', title: 'First Workout', description: 'Completed your first workout', icon: <Medal className="w-5 h-5 text-indigo-400" /> });
        }
        
        // 3 Day Streak
        if (workoutStreak >= 3) {
          earned.push({ id: 'workout_streak_3', title: '3 Day Streak', description: 'Worked out 3 days in a row', icon: <Flame className="w-5 h-5 text-orange-400" /> });
        }
        
        // 7 Day Streak
        if (workoutStreak >= 7) {
          earned.push({ id: 'workout_streak_7', title: '7 Day Streak', description: 'Worked out 7 days in a row', icon: <Flame className="w-5 h-5 text-red-500" /> });
        }

        // Consistent
        if (totalWorkouts >= 10) {
          earned.push({ id: 'consistent_10', title: 'Consistent', description: 'Completed 10 workouts total', icon: <Trophy className="w-5 h-5 text-yellow-400" /> });
        }

        // Nutrition Pro
        if (nutritionStreak >= 3) {
          earned.push({ id: 'nutrition_streak_3', title: 'Nutrition Pro', description: 'Hit nutrition goals 3 days in a row', icon: <Star className="w-5 h-5 text-fuchsia-400" /> });
        }

        setAchievements(earned);

        // Weekly Milestones
        const today = new Date();
        const start = startOfWeek(today);
        const end = endOfWeek(today);
        const workoutsThisWeek = workouts.filter(w => {
          if (!w.completed) return false;
          const d = new Date(w.date);
          return isWithinInterval(d, { start, end });
        }).length;

        setStats({ currentStreak: workoutStreak, thisWeek: workoutsThisWeek });

      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-orange-500/30 transition-colors">
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl group-hover:bg-orange-500/30 transition-colors"></div>
          <Flame className="w-8 h-8 text-orange-400 mb-3 relative z-10" />
          <p className="text-4xl font-light tracking-widest text-white relative z-10">{stats.currentStreak} <span className="text-base text-white/40">days</span></p>
          <p className="text-[11px] font-mono tracking-widest text-white/40 uppercase mt-2 relative z-10">Current Streak</p>
        </div>
        <div className="p-6 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors"></div>
          <Target className="w-8 h-8 text-indigo-400 mb-3 relative z-10" />
          <p className="text-4xl font-light tracking-widest text-white relative z-10">{stats.thisWeek} <span className="text-base text-white/40">/ 7</span></p>
          <p className="text-[11px] font-mono tracking-widest text-white/40 uppercase mt-2 relative z-10">This Week</p>
        </div>
      </div>

      <div className="p-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl">
        <h3 className="text-xs font-mono tracking-widest uppercase text-white/60 mb-6">Achievements</h3>
        
        {achievements.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-6 font-mono">Complete workouts and nutrition to earn badges.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {achievements.map(ach => (
              <div key={ach.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center text-center gap-3 relative group overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform shadow-inner">
                  {ach.icon}
                </div>
                <div className="relative z-10">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/90">{ach.title}</p>
                  <p className="text-[10px] text-white/50 mt-1.5 leading-relaxed">{ach.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

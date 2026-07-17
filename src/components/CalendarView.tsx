import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from 'date-fns';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface WorkoutDay {
  date: string;
  completed: boolean;
  completedExercises: string[];
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [workoutHistory, setWorkoutHistory] = useState<Record<string, WorkoutDay>>({});
  const [loading, setLoading] = useState(false);
  const [exercisesMap, setExercisesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      const user = auth.currentUser;
      if (!user) return;
      setLoading(true);
      try {
        // Fetch all exercises to map names
        const exercisesSnap = await getDocs(collection(db, 'exercises'));
        const exMap: Record<string, string> = {};
        exercisesSnap.forEach(doc => {
          exMap[doc.id] = doc.data().name;
        });
        setExercisesMap(exMap);

        // Fetch workouts for the current month view
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const startStr = format(startOfWeek(monthStart), 'yyyy-MM-dd');
        const endStr = format(endOfWeek(monthEnd), 'yyyy-MM-dd');

        const workoutsRef = collection(db, 'users', user.uid, 'completed_workouts');
        const q = query(workoutsRef, where('date', '>=', startStr), where('date', '<=', endStr));
        const snap = await getDocs(q);
        
        const history: Record<string, WorkoutDay> = {};
        snap.forEach(doc => {
          const data = doc.data() as WorkoutDay;
          history[data.date] = data;
        });
        setWorkoutHistory(history);
      } catch (err) {
        console.error("Error loading calendar data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const onDateClick = (day: Date) => setSelectedDate(day);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedWorkout = workoutHistory[selectedDateStr];

  return (
    <div className="flex flex-col gap-6">
      <div className="p-6 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-mono tracking-widest uppercase text-white/90">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 border border-white/10 rounded-full hover:bg-white/5 transition-colors">
              <ChevronLeft className="w-4 h-4 text-white/70" />
            </button>
            <button onClick={nextMonth} className="p-2 border border-white/10 rounded-full hover:bg-white/5 transition-colors">
              <ChevronRight className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[10px] font-mono tracking-widest text-white/40 uppercase">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-2">
          {days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const workout = workoutHistory[dayStr];
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDate = isToday(day);

            let dayClasses = "h-10 w-10 mx-auto flex items-center justify-center rounded-full text-sm font-light transition-all cursor-pointer ";
            
            if (!isCurrentMonth) {
              dayClasses += "text-white/20 hover:text-white/40 ";
            } else if (isSelected) {
              dayClasses += "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] ";
            } else if (isTodayDate) {
              dayClasses += "border border-indigo-500 text-indigo-300 hover:bg-indigo-500/20 ";
            } else {
              dayClasses += "text-white/70 hover:bg-white/10 ";
            }

            return (
              <div key={day.toString()} className="py-1">
                <div onClick={() => onDateClick(day)} className={dayClasses + " relative"}>
                  {format(day, dateFormat)}
                  {workout && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-green-400"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
        <h3 className="text-xs font-mono tracking-widest uppercase text-white/60 mb-4">
          Summary for {format(selectedDate, 'MMM do, yyyy')}
        </h3>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-[10px] font-mono text-white/50 uppercase">Loading...</p>
          </div>
        ) : selectedWorkout ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 p-4 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 text-sm tracking-wide">Workout Logged</p>
                <p className="text-white/50 text-xs font-mono mt-1">
                  {selectedWorkout.completed ? 'Fully Completed' : 'Partially Completed'}
                </p>
              </div>
            </div>
            
            {selectedWorkout.completedExercises && selectedWorkout.completedExercises.length > 0 && (
              <div>
                <p className="text-[10px] font-mono tracking-widest uppercase text-white/40 mb-3">Exercises Completed</p>
                <div className="flex flex-col gap-2">
                  {selectedWorkout.completedExercises.map(exId => (
                    <div key={exId} className="flex items-center gap-2 text-sm text-white/80 bg-white/5 p-2 rounded-xl px-4 border border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                      {exercisesMap[exId] || `Exercise ${exId}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm font-light">No workout logged for this date.</p>
          </div>
        )}
      </div>
    </div>
  );
}

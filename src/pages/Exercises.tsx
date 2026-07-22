import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, PlayCircle, Check, Timer, Play, RefreshCw, X, Search } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import CountdownTimer from '../components/CountdownTimer';
import VideoModal from '../components/VideoModal';
import WorkoutMode from '../components/WorkoutMode';
import SwapModal from '../components/SwapModal';
import RoutineBuilder from '../components/RoutineBuilder';
import { PenLine } from 'lucide-react';

export const WARM_UP_EXERCISES = [
  {
    id: 'wu_jj',
    name: 'Jumping Jacks (Warm-up)',
    sets: '1 set of 2 mins',
    videoUrl: 'https://www.youtube.com/watch?v=bT2iY8IjEU0',
    imgUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'wu_ac',
    name: 'Arm Circles (Warm-up)',
    sets: '1 set of 2 mins',
    videoUrl: 'https://www.youtube.com/watch?v=lzR7tzI1JUI',
    imgUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'wu_hk',
    name: 'High Knees (Warm-up)',
    sets: '1 set of 2 mins',
    videoUrl: 'https://www.youtube.com/watch?v=ymdS7tM0zws',
    imgUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'wu_tt',
    name: 'Torso Twists (Warm-up)',
    sets: '1 set of 2 mins',
    videoUrl: 'https://www.youtube.com/watch?v=cLuKHx--qJw',
    imgUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'wu_bs',
    name: 'Light Squats (Warm-up)',
    sets: '1 set of 2 mins',
    videoUrl: 'https://www.youtube.com/watch?v=mGvzVjuY8SY',
    imgUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=400',
  }
];

export const COOL_DOWN_EXERCISES = [
  {
    id: 'cd_cp',
    name: 'Child\'s Pose (Cool Down)',
    sets: '1 set of 2 mins',
    videoUrl: 'https://www.youtube.com/watch?v=2MJGg-dUKh0',
    imgUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'cd_dd',
    name: 'Downward Dog (Cool Down)',
    sets: '1 set of 2 mins',
    videoUrl: 'https://www.youtube.com/watch?v=UsTTTYbBdQg',
    imgUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'cd_sff',
    name: 'Seated Forward Fold (Cool Down)',
    sets: '1 set of 2 mins',
    videoUrl: 'https://www.youtube.com/watch?v=v7SN-d4qXx0',
    imgUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'cd_bs',
    name: 'Butterfly Stretch (Cool Down)',
    sets: '1 set of 2 mins',
    videoUrl: 'https://www.youtube.com/watch?v=v7SN-d4qXx0',
    imgUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'cd_lst',
    name: 'Lying Spinal Twist (Cool Down)',
    sets: '1 set of 2 mins',
    videoUrl: 'https://www.youtube.com/watch?v=v7SN-d4qXx0',
    imgUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400',
  }
];

const getWarmUp = (prefix: string) => WARM_UP_EXERCISES.map(e => ({...e, id: prefix + '_' + e.id}));
const getCoolDown = (prefix: string) => COOL_DOWN_EXERCISES.map(e => ({...e, id: prefix + '_' + e.id}));

export const ALTERNATIVE_EXERCISES = [
  {
    id: 'alt_kp',
    name: 'Knee Push-ups',
    sets: '3 sets of 10-15 reps',
    videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    imgUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'alt_ws',
    name: 'Wall Squats',
    sets: '3 sets of 30 seconds',
    videoUrl: 'https://www.youtube.com/watch?v=mGvzVjuY8SY',
    imgUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'alt_kp2',
    name: 'Knee Plank',
    sets: '3 sets of 30-45 seconds',
    videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
    imgUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'alt_bd',
    name: 'Bird Dog',
    sets: '3 sets of 10 reps per side',
    videoUrl: 'https://www.youtube.com/watch?v=v7SN-d4qXx0',
    imgUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&q=80&w=400',
  }
];

const DEFAULT_EXERCISES = [
  ...getWarmUp('def'),
  {
    id: 'def_e1',
    name: 'Push-ups',
    sets: '3 sets of 15 reps',
    videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    imgUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'def_e2',
    name: 'Bodyweight Squats',
    sets: '3 sets of 20 reps',
    videoUrl: 'https://www.youtube.com/watch?v=mGvzVjuY8SY',
    imgUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'def_e3',
    name: 'Plank',
    sets: '3 sets of 60 seconds',
    videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
    imgUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&q=80&w=400',
  },
  ...getCoolDown('def')
];

const TOMORROW_EXERCISES = [
  ...getWarmUp('tom'),
  {
    id: 'tom_e1',
    name: 'Russian Twists',
    sets: '3 sets of 20 reps',
    videoUrl: 'https://www.youtube.com/watch?v=wkD8rjkodUI',
    imgUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 'tom_e2',
    name: 'Leg Raises',
    sets: '3 sets of 15 reps',
    videoUrl: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU',
    imgUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=400',
  },
  ...getCoolDown('tom')
];

export const ROUTINES: Record<string, { todayTitle: string, todaySubtitle: string, tomorrowTitle: string, tomorrowSubtitle: string, today: any[], tomorrow: any[] }> = {
  'Lose Weight': {
    todayTitle: 'Fat Burn Circuit',
    todaySubtitle: '40 mins • Bodyweight HIIT',
    tomorrowTitle: 'Active Recovery',
    tomorrowSubtitle: '40 mins • Light Cardio & Stretch',
    today: [
      ...getWarmUp('lw_t'),
      {
        id: 'lw_t1',
        name: 'Burpees',
        sets: '4 sets of 45 seconds',
        videoUrl: 'https://www.youtube.com/watch?v=TU8QYVW0gDU',
        imgUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&q=80&w=400',
      },
      {
        id: 'lw_t2',
        name: 'Mountain Climbers',
        sets: '4 sets of 60 seconds',
        videoUrl: 'https://www.youtube.com/watch?v=nmwgirgXLYM',
        imgUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=400',
      },
      {
        id: 'lw_t3',
        name: 'Jump Squats',
        sets: '3 sets of 20 reps',
        videoUrl: 'https://www.youtube.com/watch?v=mGvzVjuY8SY',
        imgUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&q=80&w=400',
      },
      ...getCoolDown('lw_t')
    ],
    tomorrow: [
      ...getWarmUp('lw_tom'),
      {
        id: 'lw_tom1',
        name: 'High Knees',
        sets: '3 sets of 2 mins',
        videoUrl: 'https://www.youtube.com/watch?v=ymdS7tM0zws',
        imgUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&q=80&w=400',
      },
      {
        id: 'lw_tom2',
        name: 'Jumping Jacks',
        sets: '3 sets of 2 mins',
        videoUrl: 'https://www.youtube.com/watch?v=bT2iY8IjEU0',
        imgUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=400',
      },
      ...getCoolDown('lw_tom')
    ]
  },
  'Build Muscle': {
    todayTitle: 'Upper Body Calisthenics',
    todaySubtitle: '45 mins • Bodyweight Strength',
    tomorrowTitle: 'Lower Body Calisthenics',
    tomorrowSubtitle: '45 mins • Bodyweight Strength',
    today: [
      ...getWarmUp('bm_t'),
      {
        id: 'bm_t1',
        name: 'Decline Push-ups (feet on chair)',
        sets: '4 sets of 12-15 reps',
        videoUrl: 'https://www.youtube.com/watch?v=SKPab2YC8BE',
        imgUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&q=80&w=400',
      },
      {
        id: 'bm_t2',
        name: 'Pike Push-ups',
        sets: '4 sets of 8-12 reps',
        videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
        imgUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=400',
      },
      {
        id: 'bm_t3',
        name: 'Chair Dips',
        sets: '3 sets of 12 reps',
        videoUrl: 'https://www.youtube.com/watch?v=0326dy_-CzM',
        imgUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&q=80&w=400',
      },
      ...getCoolDown('bm_t')
    ],
    tomorrow: [
      ...getWarmUp('bm_tom'),
      {
        id: 'bm_tom1',
        name: 'Assisted Pistol Squats',
        sets: '4 sets of 8 reps per leg',
        videoUrl: 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
        imgUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&q=80&w=400',
      },
      {
        id: 'bm_tom2',
        name: 'Walking Lunges',
        sets: '4 sets of 20 steps',
        videoUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs',
        imgUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=400',
      },
      {
        id: 'bm_tom3',
        name: 'Calf Raises',
        sets: '3 sets of 25 reps',
        videoUrl: 'https://www.youtube.com/watch?v=-M4-G8p8fmc',
        imgUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&q=80&w=400',
      },
      ...getCoolDown('bm_tom')
    ]
  },
  'Maintain': {
    todayTitle: 'Full Body Fitness',
    todaySubtitle: '45 mins • Strength & Conditioning',
    tomorrowTitle: 'Core & Conditioning',
    tomorrowSubtitle: '40 mins • Functional Fitness',
    today: DEFAULT_EXERCISES,
    tomorrow: TOMORROW_EXERCISES
  }
};

export default function Exercises() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<any[]>([]);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [activeTimerExercise, setActiveTimerExercise] = useState<any | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [isTomorrow, setIsTomorrow] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isWorkoutModeActive, setIsWorkoutModeActive] = useState(false);
  const [swappingExerciseId, setSwappingExerciseId] = useState<string | null>(null);
  const [showRoutineBuilder, setShowRoutineBuilder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const CATEGORIES = ['All', 'Warm-up', 'Strength', 'Cardio', 'Core', 'Cool-down'];

  const getCategoryForExercise = (name: string, id: string) => {
    const nameL = name.toLowerCase();
    if (nameL.includes('warm-up') || id.includes('wu_')) return 'Warm-up';
    if (nameL.includes('cool down') || id.includes('cd_')) return 'Cool-down';
    if (['push-up', 'squat', 'lunge', 'dip', 'calf'].some(k => nameL.includes(k))) return 'Strength';
    if (['burpee', 'mountain climber', 'jump', 'high knees'].some(k => nameL.includes(k))) return 'Cardio';
    if (['plank', 'twist', 'raise', 'dog'].some(k => nameL.includes(k))) return 'Core';
    return 'Strength'; // default fallback
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        navigate('/onboarding', { replace: true });
        return;
      }
      const docRef = doc(db, 'users', u.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        navigate('/onboarding', { replace: true });
      } else {
        setUserData(docSnap.data());
      }
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    async function loadData() {
      if (!user || !userData) return;
      
      const goal = userData.primaryGoal || 'Maintain';
      const routine = userData.customRoutine || ROUTINES[goal] || ROUTINES['Maintain'];
      
      setExercises(routine.today);

      // Fetch today's completed state
      const today = format(new Date(), 'yyyy-MM-dd');
      const workoutRef = doc(db, 'users', user.uid, 'completed_workouts', today);
      const workoutSnap = await getDoc(workoutRef);
      if (workoutSnap.exists()) {
        const data = workoutSnap.data();
        setWorkoutComplete(data.completed || false);
        setCompletedExercises(data.completedExercises || []);
      }
    }
    loadData();
  }, [user, userData]);

  const toggleExercise = async (exerciseId: string) => {
    if (!user || isTomorrow) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    
    let newCompletedExercises = [...completedExercises];
    if (newCompletedExercises.includes(exerciseId)) {
      newCompletedExercises = newCompletedExercises.filter(id => id !== exerciseId);
    } else {
      newCompletedExercises.push(exerciseId);
    }
    
    setCompletedExercises(newCompletedExercises);
    
    // Auto-complete workout if all exercises are done
    const allDone = exercises.length > 0 && newCompletedExercises.length === exercises.length;
    setWorkoutComplete(allDone);

    await setDoc(doc(db, 'users', user.uid, 'completed_workouts', today), {
      date: today,
      completed: allDone,
      completedExercises: newCompletedExercises
    }, { merge: true });
  };

  const toggleWorkout = async () => {
    if (!user || isTomorrow) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const newState = !workoutComplete;
    
    setWorkoutComplete(newState);
    
    const newCompletedExercises = newState ? exercises.map(ex => ex.id) : [];
    setCompletedExercises(newCompletedExercises);
    
    await setDoc(doc(db, 'users', user.uid, 'completed_workouts', today), {
      date: today,
      completed: newState,
      completedExercises: newCompletedExercises
    }, { merge: true });
  };

  const handleSwap = async (altExercise: any) => {
    if (!user || !swappingExerciseId) return;
    const newSwaps = { ...(userData?.swaps || {}) };
    newSwaps[swappingExerciseId] = altExercise;
    
    setUserData({ ...userData, swaps: newSwaps });
    setSwappingExerciseId(null);
    
    await setDoc(doc(db, 'users', user.uid), {
      swaps: newSwaps
    }, { merge: true });
  };

  const handleSaveRoutine = async (customRoutine: any) => {
    if (!user) return;
    setUserData({ ...userData, customRoutine });
    setShowRoutineBuilder(false);
    
    await setDoc(doc(db, 'users', user.uid), {
      customRoutine
    }, { merge: true });
  };

  const goal = userData?.primaryGoal || 'Maintain';
  const currentRoutine = userData?.customRoutine || ROUTINES[goal] || ROUTINES['Maintain'];
  
  const applySwaps = (routineExercises: any[]) => {
    if (!userData?.swaps) return routineExercises;
    return routineExercises.map(ex => {
      if (userData.swaps[ex.id]) {
        return { ...userData.swaps[ex.id], id: ex.id, originalId: userData.swaps[ex.id].id };
      }
      return ex;
    });
  };

  const getAllUniqueExercises = () => {
    const all = [
      ...WARM_UP_EXERCISES,
      ...COOL_DOWN_EXERCISES,
      ...ALTERNATIVE_EXERCISES,
      ...DEFAULT_EXERCISES,
      ...TOMORROW_EXERCISES,
      ...ROUTINES['Lose Weight'].today,
      ...ROUTINES['Lose Weight'].tomorrow,
      ...ROUTINES['Build Muscle'].today,
      ...ROUTINES['Build Muscle'].tomorrow
    ];
    
    // Remove duplicates by id or name
    const unique = new Map();
    all.forEach(ex => {
      // Create a simplified ID to avoid duplicates like lw_t_wu_jj and bm_t_wu_jj
      const simpleId = ex.id.split('_').slice(-2).join('_');
      if (!unique.has(simpleId)) {
        unique.set(simpleId, { ...ex, id: simpleId });
      }
    });
    return Array.from(unique.values());
  };

  const baseDisplayedExercises = isTomorrow ? applySwaps(currentRoutine.tomorrow) : applySwaps(exercises);
  const displayedExercises = baseDisplayedExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || getCategoryForExercise(ex.name, ex.id) === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col flex-1 text-white p-6 relative z-20 max-w-2xl mx-auto w-full pb-24">
      <header className="mb-6 pt-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-light tracking-widest uppercase text-white/90 mb-1">
              {isTomorrow ? currentRoutine.tomorrowTitle : currentRoutine.todayTitle}
            </h1>
            <p className="text-white/50 font-mono text-sm tracking-widest uppercase">
              {isTomorrow ? currentRoutine.tomorrowSubtitle : currentRoutine.todaySubtitle}
            </p>
          </div>
          <button 
            onClick={() => setShowRoutineBuilder(true)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <PenLine className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm font-light"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-[10px] font-mono tracking-widest uppercase whitespace-nowrap transition-all border ${
                activeCategory === cat 
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                  : 'bg-black/30 text-white/50 border-white/10 hover:bg-white/5 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-black/30 p-1 rounded-full border border-white/10 flex">
          <button 
            className={`px-6 py-2 rounded-full text-[10px] font-mono tracking-widest uppercase transition-colors ${!isTomorrow ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
            onClick={() => setIsTomorrow(false)}
          >
            Today
          </button>
          <button 
            className={`px-6 py-2 rounded-full text-[10px] font-mono tracking-widest uppercase transition-colors ${isTomorrow ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
            onClick={() => setIsTomorrow(true)}
          >
            Tomorrow
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        {!isTomorrow && exercises.length > 0 && !workoutComplete && (
          <button 
            onClick={() => setIsWorkoutModeActive(true)}
            className="w-full py-6 rounded-3xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all flex flex-col items-center justify-center group mb-2"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current ml-1" />
            </div>
            <span className="font-mono text-sm tracking-widest uppercase mb-1">Start Workout</span>
            <span className="text-[10px] text-white/70 uppercase tracking-widest">Guided Mode</span>
          </button>
        )}

        {displayedExercises.map((exercise) => {
          const isDone = !isTomorrow && completedExercises.includes(exercise.id);
          return (
            <div 
              key={exercise.id} 
              className={`p-4 backdrop-blur-xl border rounded-3xl shadow-xl flex gap-4 relative overflow-hidden group transition-all duration-300 ${!isTomorrow ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : ''}
                ${isDone ? 'bg-green-500/10 border-green-500/30' : 'bg-black/30 border-white/10 hover:bg-black/40 hover:border-white/20'}
              `}
              onClick={() => toggleExercise(exercise.id)}
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden relative shrink-0">
                <img src={exercise.imgUrl} alt={exercise.name} className={`w-full h-full object-cover transition-all duration-500 ${!isTomorrow ? 'group-hover:scale-110' : ''} ${isDone ? 'opacity-50 group-hover:opacity-60' : 'opacity-80 group-hover:opacity-100'}`} />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300"></div>
                {isDone && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm transition-opacity">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-start justify-between">
                  <h3 className={`text-lg font-light tracking-widest mb-1 transition-colors duration-300 ${isDone ? 'text-green-400' : 'text-white/90 group-hover:text-white'}`}>
                    {exercise.name}
                  </h3>
                  {!isTomorrow && (
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 ${isDone ? 'border-green-400 bg-green-500/20 scale-100' : 'border-white/20 group-hover:border-white/40 scale-95 group-hover:scale-100'}`}>
                      {isDone && <Check className="w-4 h-4 text-green-400" />}
                    </div>
                  )}
                </div>
                <p className="text-white/50 font-mono text-xs mb-3 transition-colors duration-300 group-hover:text-white/70">{exercise.sets}</p>
                <div className="flex items-center gap-4 mt-auto">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveVideoUrl(exercise.videoUrl);
                    }}
                    className={`inline-flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-indigo-400 hover:text-indigo-300 transition-all duration-300 w-fit ${!isTomorrow ? 'group-hover:translate-x-1' : ''}`}
                  >
                    <PlayCircle className="w-4 h-4" />
                    Watch Tutorial
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTimerExercise(exercise);
                    }}
                    className={`inline-flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-fuchsia-400 hover:text-fuchsia-300 transition-all duration-300 w-fit ${!isTomorrow ? 'group-hover:translate-x-1' : ''}`}
                  >
                    <Timer className="w-4 h-4" />
                    Start Timer
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSwappingExerciseId(exercise.id);
                    }}
                    className={`inline-flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-white/50 hover:text-white transition-all duration-300 w-fit ml-auto`}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isTomorrow && (
        <div className="mt-10">
          <button 
            onClick={toggleWorkout}
            className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-mono text-xs tracking-widest uppercase transition-all ${
              workoutComplete 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]'
            }`}
          >
            {workoutComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Workout Complete
              </>
            ) : (
              'Mark Entire Workout Complete'
            )}
          </button>
        </div>
      )}

      {activeTimerExercise && (
        <CountdownTimer 
          initialSeconds={
            activeTimerExercise.sets.toLowerCase().includes('second') 
              ? parseInt(activeTimerExercise.sets.match(/(\d+)\s*second/i)?.[1] || '60') 
              : 60
          }
          exerciseName={activeTimerExercise.name}
          onClose={() => setActiveTimerExercise(null)}
        />
      )}

      {activeVideoUrl && (
        <VideoModal 
          videoUrl={activeVideoUrl} 
          onClose={() => setActiveVideoUrl(null)} 
        />
      )}

      {isWorkoutModeActive && (
        <WorkoutMode 
          exercises={displayedExercises}
          onClose={() => setIsWorkoutModeActive(false)}
          defaultRestTime={userData?.defaultRestTime || 60}
          onComplete={() => {
            setIsWorkoutModeActive(false);
            if (!workoutComplete) {
              toggleWorkout();
            }
          }}
        />
      )}
      
      {swappingExerciseId && (
        <SwapModal 
          onClose={() => setSwappingExerciseId(null)} 
          onSwap={handleSwap} 
        />
      )}

      {showRoutineBuilder && (
        <RoutineBuilder
          onClose={() => setShowRoutineBuilder(false)}
          onSave={handleSaveRoutine}
          allExercises={getAllUniqueExercises()}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { CheckCircle2, Circle, Dumbbell, Utensils, ShoppingCart, Sparkles, Camera, Loader2, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from "motion/react";
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import HabitTracker from '../components/HabitTracker';
import DailySummaryModal from '../components/DailySummaryModal';
import RecipeModal, { RECIPES, MealId } from '../components/RecipeModal';
import GroceryListModal from '../components/GroceryListModal';
import LogMealModal from '../components/LogMealModal';
import PhotoUploadModal from '../components/PhotoUploadModal';
import BeforeAfterModal, { PhotoLog } from '../components/BeforeAfterModal';
import AndroidCompanionModal from '../components/AndroidCompanionModal';
import PWAInstallBanner from '../components/PWAInstallBanner';
import { OfflineIndicator } from '../components/OfflineIndicator';
import AICoachModal from '../components/AICoachModal';
import { ROUTINES } from './Exercises';

export default function Home() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showGroceryList, setShowGroceryList] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showBeforeAfterModal, setShowBeforeAfterModal] = useState(false);
  const [showAndroidHub, setShowAndroidHub] = useState(false);
  const [showAICoachModal, setShowAICoachModal] = useState(false);
  const [todayPhotoLog, setTodayPhotoLog] = useState<any>(null);
  const [photoLogs, setPhotoLogs] = useState<PhotoLog[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  const [selectedLogMeal, setSelectedLogMeal] = useState<string | null>(null);
  const [isTomorrow, setIsTomorrow] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [nutrition, setNutrition] = useState({
    breakfast: { completed: false, cals: 0, title: '' },
    lunch: { completed: false, cals: 0, title: '' },
    dinner: { completed: false, cals: 0, title: '' },
    extraMeals: [] as { id: string, title: string, cals: number }[]
  });
  const [user, setUser] = useState(auth.currentUser);
  const [error, setError] = useState<string | null>(null);
  const [dailyTip, setDailyTip] = useState<string | null>(null);
  const [isTipExpanded, setIsTipExpanded] = useState(false);

  useEffect(() => {
    async function fetchDailyTip() {
      if (!userData?.primaryGoal) return;
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const cacheKey = `dailyTip_${today}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setDailyTip(cached);
        return;
      }
      
      try {
        const res = await fetch('/api/daily-tip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: userData.primaryGoal })
        });
        const data = await res.json();
        if (data.tip) {
          setDailyTip(data.tip);
          localStorage.setItem(cacheKey, data.tip);
        }
      } catch (err) {
        console.error("Failed to fetch tip:", err);
      }
    }
    fetchDailyTip();
  }, [userData?.primaryGoal]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        navigate('/onboarding', { replace: true });
      }
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    // Check if launched via Android app shortcut, WebAPK quick action, or widget URL
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    let action = searchParams.get('action');
    if (!action && hash.includes('?')) {
      const queryPart = hash.split('?')[1];
      action = new URLSearchParams(queryPart).get('action');
    }

    if (action === 'snap-photo') {
      setShowPhotoModal(true);
    } else if (action === 'ai-coach') {
      setShowAICoachModal(true);
    } else if (action === 'android-hub') {
      setShowAndroidHub(true);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          navigate('/onboarding', { replace: true });
          return;
        }
        
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Load workout status
        const workoutRef = doc(db, 'users', user.uid, 'completed_workouts', today);
        const workoutSnap = await getDoc(workoutRef);
        if (workoutSnap.exists()) {
          setWorkoutComplete(workoutSnap.data().completed);
        }

        // Load nutrition status
        const nutritionRef = doc(db, 'users', user.uid, 'completed_nutrition', today);
        const nutritionSnap = await getDoc(nutritionRef);
        if (nutritionSnap.exists()) {
          const data = nutritionSnap.data();
          setNutrition({
            breakfast: typeof data.breakfast === 'object' ? data.breakfast : { completed: !!data.breakfast, cals: 0, title: '' },
            lunch: typeof data.lunch === 'object' ? data.lunch : { completed: !!data.lunch, cals: 0, title: '' },
            dinner: typeof data.dinner === 'object' ? data.dinner : { completed: !!data.dinner, cals: 0, title: '' },
            extraMeals: Array.isArray(data.extraMeals) ? data.extraMeals : []
          });
        }

        // Load daily photo status & history
        const logsRef = collection(db, 'users', user.uid, 'daily_logs');
        const logsSnap = await getDocs(logsRef);
        const allLogs: PhotoLog[] = [];
        let foundToday: any = null;

        logsSnap.forEach(d => {
          const data = d.data();
          if (data.photo) {
            allLogs.push({
              date: data.date ? format(new Date(data.date), 'MMM dd') : d.id,
              weight: data.weight || 0,
              photo: data.photo,
              angle: data.angle,
              note: data.note
            });
          }
          if (d.id === today && data.photo) {
            foundToday = data;
          }
        });
        
        setPhotoLogs(allLogs);
        setTodayPhotoLog(foundToday);
      } catch (err: any) {
        console.error("Error loading user data:", err);
        setError(err.message || 'An error occurred while loading data.');
      }
    }
    loadData();
  }, [user, navigate]);

  const toggleWorkout = async () => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const newState = !workoutComplete;
    setWorkoutComplete(newState);
    
    if (newState) {
      toast.success('Workout Completed!', { icon: '🔥' });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    
    const exercisesSnap = await getDocs(collection(db, 'exercises'));
    let newCompletedExercises: string[] = [];
    if (newState && !exercisesSnap.empty) {
      newCompletedExercises = exercisesSnap.docs.map(d => d.id);
    } else if (newState) {
      newCompletedExercises = ['e1', 'e2', 'e3'];
    }

    const isAllNutritionCompleted = nutrition.breakfast.completed && nutrition.lunch.completed && nutrition.dinner.completed;
    if (newState && isAllNutritionCompleted) {
      setShowSummaryModal(true);
    }

    await setDoc(doc(db, 'users', user.uid, 'completed_workouts', today), {
      date: today,
      completed: newState,
      completedExercises: newCompletedExercises
    }, { merge: true });
  };

  const handleLogMeal = async (meal: 'breakfast' | 'lunch' | 'dinner', title: string, cals: number) => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const newState = {
      ...nutrition,
      [meal]: { completed: true, cals, title }
    };
    setNutrition(newState);
    setSelectedLogMeal(null);
    toast.success(`${meal.charAt(0).toUpperCase() + meal.slice(1)} Logged!`, { icon: '🍽️' });

    const isAllCompleted = newState.breakfast.completed && newState.lunch.completed && newState.dinner.completed;
    
    const extraCalsOld = (nutrition.extraMeals || []).reduce((acc, m) => acc + m.cals, 0);
    const currentCals = newState.breakfast.cals + newState.lunch.cals + newState.dinner.cals + extraCalsOld;
    const previousCals = nutrition.breakfast.cals + nutrition.lunch.cals + nutrition.dinner.cals + extraCalsOld;
    
    if (isAllCompleted && !(nutrition.breakfast.completed && nutrition.lunch.completed && nutrition.dinner.completed)) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else if (currentCals >= targetCals * 0.9 && previousCals < targetCals * 0.9) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    
    if (isAllCompleted && workoutComplete) {
      setShowSummaryModal(true);
    }

    await setDoc(doc(db, 'users', user.uid, 'completed_nutrition', today), {
      date: today,
      completed: isAllCompleted,
      breakfast: newState.breakfast,
      lunch: newState.lunch,
      dinner: newState.dinner
    }, { merge: true });
  };

  const unlogMeal = async (meal: 'breakfast' | 'lunch' | 'dinner') => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const newState = {
      ...nutrition,
      [meal]: { completed: false, cals: 0, title: '' }
    };
    setNutrition(newState);

    await setDoc(doc(db, 'users', user.uid, 'completed_nutrition', today), {
      date: today,
      completed: false,
      breakfast: newState.breakfast,
      lunch: newState.lunch,
      dinner: newState.dinner
    }, { merge: true });
  };

  const handleLogExtraMeal = async (title: string, cals: number) => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const newExtraMeal = { id: Math.random().toString(36).substring(7), title, cals };
    const newState = {
      ...nutrition,
      extraMeals: [...(nutrition.extraMeals || []), newExtraMeal]
    };
    setNutrition(newState);
    setSelectedLogMeal(null);
    toast.success(`Snack Logged!`, { icon: '🍎' });

    const isAllCompleted = newState.breakfast.completed && newState.lunch.completed && newState.dinner.completed;
    
    const extraCalsNew = newState.extraMeals.reduce((acc, m) => acc + m.cals, 0);
    const currentCals = newState.breakfast.cals + newState.lunch.cals + newState.dinner.cals + extraCalsNew;
    const extraCalsOld = (nutrition.extraMeals || []).reduce((acc, m) => acc + m.cals, 0);
    const previousCals = nutrition.breakfast.cals + nutrition.lunch.cals + nutrition.dinner.cals + extraCalsOld;
    
    if (currentCals >= targetCals * 0.9 && previousCals < targetCals * 0.9) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    await setDoc(doc(db, 'users', user.uid, 'completed_nutrition', today), {
      extraMeals: newState.extraMeals
    }, { merge: true });
  };

  const unlogExtraMeal = async (id: string) => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const newState = {
      ...nutrition,
      extraMeals: (nutrition.extraMeals || []).filter(m => m.id !== id)
    };
    setNutrition(newState);

    await setDoc(doc(db, 'users', user.uid, 'completed_nutrition', today), {
      extraMeals: newState.extraMeals
    }, { merge: true });
  };

  const handleScanFoodImage = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const toastId = toast.loading('Analyzing food...', { icon: '🔍' });

    try {
      // Read file as base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64Image = await base64Promise;

      const res = await fetch('/api/scan-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to scan food');
      
      if (data.status === 'complete' && data.calories && data.title) {
        toast.success(`Found: ${data.title} (${data.calories} kcal)`, { id: toastId, icon: '✅' });
        await handleLogExtraMeal(data.title, data.calories);
      } else {
        toast.error(data.message || 'Could not identify food clearly.', { id: toastId, icon: '❌' });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error analyzing food', { id: toastId, icon: '⚠️' });
    } finally {
      setIsScanning(false);
      // reset file input
      e.target.value = '';
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/onboarding', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (error) return (
    <div className="p-6 text-red-400 text-center mt-20 flex flex-col gap-4">
      <p>Failed to load data.</p>
      <p className="text-sm opacity-80">{error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 rounded-full text-xs font-mono tracking-widest uppercase">Retry</button>
    </div>
  );

  if (!userData) return <div className="p-6 text-white/50 text-center mt-20 flex flex-col items-center gap-4">
    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    <p>Loading your plan...</p>
  </div>;

  const targetCals = userData.targetDailyCalories || (Math.round(userData.tdee) + (userData.primaryGoal === 'Lose Weight' ? -500 : userData.primaryGoal === 'Build Muscle' ? 300 : 0));

  const protein = Math.round((targetCals * 0.3) / 4);
  const carbs = Math.round((targetCals * 0.4) / 4);
  const fats = Math.round((targetCals * 0.3) / 9);

  const goal = userData.primaryGoal || 'Maintain';
  const currentRoutine = ROUTINES[goal] || ROUTINES['Maintain'];
  
  const totalConsumedCals = nutrition.breakfast.cals + nutrition.lunch.cals + nutrition.dinner.cals + (nutrition.extraMeals || []).reduce((acc, m) => acc + m.cals, 0);
  const macroChartData = [
    { name: "Protein", Consumed: Math.round(((totalConsumedCals)*0.3/4)), Target: protein },
    { name: "Carbs", Consumed: Math.round(((totalConsumedCals)*0.4/4)), Target: carbs },
    { name: "Fats", Consumed: Math.round(((totalConsumedCals)*0.3/9)), Target: fats }
  ];

  return (
    <div className="flex flex-col flex-1 text-white p-6 lg:p-10 relative z-20 max-w-7xl mx-auto w-full pb-24">
      {/* PWA Install Banner */}
      <PWAInstallBanner onOpenAndroidHub={() => setShowAndroidHub(true)} />

      <header className="flex justify-between items-start mb-8 pt-4 gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-light tracking-widest uppercase text-white/90 mb-2">
            Let's crush it today, {user?.displayName?.split(' ')[0] || 'Achiever'}!
          </h1>
          <p className="text-white/50 font-mono text-sm tracking-widest uppercase">
            {userData.startingStatus}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => setShowAndroidHub(true)}
            className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-mono tracking-widest uppercase flex items-center gap-1.5 transition-all shadow-md"
            title="Pixel & Android Companion Hub"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Pixel Hub</span>
          </button>
          <button 
            onClick={handleSignOut}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-xs font-mono tracking-widest uppercase text-white/60 hover:text-white transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>

      {dailyTip && (
        <motion.div layout onClick={() => setIsTipExpanded(!isTipExpanded)} className="mb-8 p-5 md:p-6 bg-gradient-to-r from-fuchsia-600/10 to-indigo-600/10 border border-fuchsia-500/20 rounded-3xl relative overflow-hidden flex items-start gap-4 cursor-pointer group hover:from-fuchsia-600/20 hover:to-indigo-600/20 transition-all shadow-xl">
          <div className="p-3 bg-fuchsia-500/20 rounded-2xl shrink-0 group-hover:bg-fuchsia-500/30 transition-colors shadow-inner">
            <Sparkles className="w-6 h-6 text-fuchsia-400" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-[11px] font-mono tracking-widest text-white/50 uppercase mb-2">Daily Coach Tip</p>
            <motion.p layout="position" className={`text-base font-light text-white/90 leading-relaxed ${isTipExpanded ? "" : "line-clamp-2 md:line-clamp-none"}`}>{dailyTip}</motion.p>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="bg-black/30 p-1.5 rounded-full border border-white/10 flex w-full sm:w-auto">
          <button 
            className={`flex-1 sm:flex-none px-8 py-2.5 rounded-full text-xs font-mono tracking-widest uppercase transition-all ${!isTomorrow ? 'bg-white/10 text-white shadow-md' : 'text-white/50 hover:text-white/80'}`}
            onClick={() => setIsTomorrow(false)}
          >
            Today
          </button>
          <button 
            className={`flex-1 sm:flex-none px-8 py-2.5 rounded-full text-xs font-mono tracking-widest uppercase transition-all ${isTomorrow ? 'bg-white/10 text-white shadow-md' : 'text-white/50 hover:text-white/80'}`}
            onClick={() => setIsTomorrow(true)}
          >
            Tomorrow
          </button>
        </div>
        
        <button
          onClick={() => setShowGroceryList(true)}
          className="flex items-center justify-center w-full sm:w-auto gap-3 px-6 py-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-full hover:bg-indigo-600/30 transition-all shadow-lg hover:shadow-indigo-500/20"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-xs font-mono tracking-widest uppercase">Grocery List</span>
        </button>
      </div>
      
      <div className="flex-1 flex flex-col gap-8">
        
        {/* Left Column: Workouts & Meals */}
        <div className="flex flex-col gap-8">
          
          {/* Workout Card */}
          <div className="p-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col relative overflow-hidden group cursor-pointer hover:bg-black/50 transition-all hover:border-white/20" onClick={() => !isTomorrow && navigate('/exercises')}>
            <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${!isTomorrow && workoutComplete ? 'bg-green-500' : 'bg-indigo-500'}`}></div>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${!isTomorrow && workoutComplete ? 'bg-green-500/20 text-green-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                  <Dumbbell className="w-5 h-5" />
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${!isTomorrow && workoutComplete ? 'text-green-400' : 'text-indigo-400'}`}>
                  {isTomorrow ? "Tomorrow's Workout" : "Today's Workout"}
                </span>
              </div>
              {!isTomorrow && (
                <button 
                  className="focus:outline-none z-10 hover:scale-110 transition-transform" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWorkout();
                  }}
                >
                  {workoutComplete ? (
                    <CheckCircle2 className="w-10 h-10 text-green-500 transition-all drop-shadow-md" />
                  ) : (
                    <Circle className="w-10 h-10 text-white/20 group-hover:text-white/40 transition-all" />
                  )}
                </button>
              )}
            </div>
            <h3 className="text-2xl md:text-3xl font-light tracking-wide text-white mb-3">
              {isTomorrow ? currentRoutine.tomorrowTitle : currentRoutine.todayTitle}
            </h3>
            <p className="text-white/50 font-mono text-sm leading-relaxed">
              {isTomorrow ? currentRoutine.tomorrowSubtitle : currentRoutine.todaySubtitle}
            </p>
          </div>

          {/* Meals Card */}
          <div className="p-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${(!isTomorrow && nutrition.breakfast.completed && nutrition.lunch.completed && nutrition.dinner.completed) ? 'bg-green-500' : 'bg-fuchsia-500'}`}></div>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${(!isTomorrow && nutrition.breakfast.completed && nutrition.lunch.completed && nutrition.dinner.completed) ? 'bg-green-500/20 text-green-400' : 'bg-fuchsia-500/20 text-fuchsia-400'}`}>
                  <Utensils className="w-5 h-5" />
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${(!isTomorrow && nutrition.breakfast.completed && nutrition.lunch.completed && nutrition.dinner.completed) ? 'text-green-400' : 'text-fuchsia-400'}`}>
                  {isTomorrow ? "Tomorrow's Meals" : "Today's Meals"}
                </span>
              </div>
              {(!isTomorrow && nutrition.breakfast.completed && nutrition.lunch.completed && nutrition.dinner.completed) && (
                <CheckCircle2 className="w-10 h-10 text-green-500 transition-all drop-shadow-md" />
              )}
            </div>
            
            <div className="flex flex-col md:flex-row items-center border-b border-white/10 pb-8 mb-8 gap-8">
              <div className="flex-1 w-full text-center md:text-left">
                <p className="text-white/50 font-mono text-xs tracking-widest uppercase mb-3">{!isTomorrow ? 'Consumed / Target' : 'Target'}</p>
                <p className="text-5xl font-light tracking-wider">
                  {!isTomorrow && (
                    <span className="text-green-400 mr-3">{totalConsumedCals}</span>
                  )}
                  <span className={!isTomorrow ? "text-2xl text-white/50" : ""}>
                    {!isTomorrow && '/ '}
                    {targetCals} <span className="text-lg text-white/40">kcal</span>
                  </span>
                </p>
                {!isTomorrow && (targetCals - (totalConsumedCals)) <= 100 && (targetCals - (totalConsumedCals)) > 0 && (
                  <div className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-mono tracking-widest uppercase shadow-inner">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                    Mindful Eating Zone
                  </div>
                )}
              </div>
              
              {!isTomorrow && (
                <div className="w-40 h-40 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Consumed', value: Math.min(totalConsumedCals, targetCals) },
                          { name: 'Remaining', value: Math.max(targetCals - (totalConsumedCals), 0) }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={70}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={12}
                      >
                        <Cell fill="#4ade80" />
                        <Cell fill="rgba(255,255,255,0.05)" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-mono text-white/40 uppercase tracking-widest mb-1">Left</span>
                    <span className="text-lg font-bold text-white/90">
                      {Math.max(targetCals - (totalConsumedCals), 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 rounded-3xl p-6 border border-white/5 relative overflow-hidden group shadow-inner">
                <h3 className="text-xs font-mono tracking-widest text-white/40 uppercase mb-6">Macros Chart</h3>
                <div className="h-44 w-full -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={macroChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", fontSize: "13px", padding: "12px" }}
                        itemStyle={{ color: "#fff" }}
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      />
                      <Bar dataKey="Consumed" fill="#a855f7" radius={[6, 6, 0, 0]} barSize={24} />
                      <Bar dataKey="Target" fill="rgba(255,255,255,0.1)" radius={[6, 6, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white/5 rounded-3xl p-5 border border-white/5 relative overflow-hidden group shadow-inner flex flex-col justify-center">
                  <div 
                    className="absolute left-0 bottom-0 h-1.5 bg-indigo-500/50 transition-all" 
                    style={{ width: `${Math.min(((totalConsumedCals)*0.3/4) / protein * 100, 100)}%` }}
                  />
                  <p className="text-xs font-mono tracking-widest text-white/40 uppercase mb-2">Protein (30%)</p>
                  <p className="text-xl font-light tracking-wider text-indigo-300">{protein}g</p>
                </div>
                <div className="bg-white/5 rounded-3xl p-5 border border-white/5 relative overflow-hidden group shadow-inner flex flex-col justify-center">
                  <div 
                    className="absolute left-0 bottom-0 h-1.5 bg-fuchsia-500/50 transition-all" 
                    style={{ width: `${Math.min(((totalConsumedCals)*0.4/4) / carbs * 100, 100)}%` }}
                  />
                  <p className="text-xs font-mono tracking-widest text-white/40 uppercase mb-2">Carbs (40%)</p>
                  <p className="text-xl font-light tracking-wider text-fuchsia-300">{carbs}g</p>
                </div>
                <div className="bg-white/5 rounded-3xl p-5 border border-white/5 relative overflow-hidden group shadow-inner flex flex-col justify-center">
                  <div 
                    className="absolute left-0 bottom-0 h-1.5 bg-blue-500/50 transition-all" 
                    style={{ width: `${Math.min(((totalConsumedCals)*0.3/9) / fats * 100, 100)}%` }}
                  />
                  <p className="text-xs font-mono tracking-widest text-white/40 uppercase mb-2">Fats (30%)</p>
                  <p className="text-xl font-light tracking-wider text-blue-300">{fats}g</p>
                </div>
              </div>
            </div>

            <div className="mt-2 space-y-4 font-mono text-sm text-white/70">
              {(['breakfast', 'lunch', 'dinner'] as MealId[]).map((mealId) => {
                if (!mealId) return null;
                const recipe = RECIPES[isTomorrow ? 'tomorrow' : 'today'][mealId];
                const mealPercentages = { breakfast: 0.30, lunch: 0.35, dinner: 0.35 };
                const suggestedCals = Math.round(targetCals * mealPercentages[mealId]);
                const isCompleted = !isTomorrow && nutrition[mealId].completed;

                return (
                  <div key={mealId} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 rounded-2xl transition-all shadow-sm" onClick={() => setSelectedRecipe(mealId)}>
                    <div className="flex items-center gap-4 mb-3 sm:mb-0">
                      {!isTomorrow && (
                        <button className="focus:outline-none hover:scale-110 transition-transform shrink-0" onClick={(e) => { 
                          e.stopPropagation(); 
                          if (isCompleted) {
                            unlogMeal(mealId);
                          } else {
                            setSelectedLogMeal(mealId);
                          }
                        }}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500 transition-all drop-shadow-sm" />
                          ) : (
                            <Circle className="w-6 h-6 text-white/20 transition-all group-hover:text-white/40" />
                          )}
                        </button>
                      )}
                      <div className="flex flex-col">
                        <span className="capitalize text-base font-light text-white">{mealId}</span>
                        {isCompleted && (
                          <span className="text-xs text-green-400 mt-1">{nutrition[mealId].cals} kcal</span>
                        )}
                      </div>
                    </div>
                    <span className="text-white/50 group-hover:text-white/80 transition-colors text-left sm:text-right text-sm pl-10 sm:pl-0 truncate w-full sm:w-auto">
                      {isCompleted && nutrition[mealId].title ? nutrition[mealId].title : recipe.title}
                    </span>
                  </div>
                );
              })}

              {!isTomorrow && (nutrition.extraMeals || []).map((meal) => (
                <div key={meal.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-white/5 bg-white/[0.02] rounded-2xl shadow-sm">
                  <div className="flex items-center gap-4 mb-3 sm:mb-0">
                    <button className="focus:outline-none hover:scale-110 transition-transform shrink-0" onClick={(e) => { 
                      e.stopPropagation(); 
                      unlogExtraMeal(meal.id);
                    }}>
                      <CheckCircle2 className="w-6 h-6 text-green-500 transition-all drop-shadow-sm" />
                    </button>
                    <div className="flex flex-col">
                      <span className="capitalize text-base font-light text-white">Extra Meal</span>
                      <span className="text-xs text-green-400 mt-1">{meal.cals} kcal</span>
                    </div>
                  </div>
                  <span className="text-white/70 text-left sm:text-right pl-10 sm:pl-0 text-sm truncate w-full sm:w-auto">
                    {meal.title}
                  </span>
                </div>
              ))}

              {!isTomorrow && (
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <button 
                    onClick={() => setSelectedLogMeal('extra')}
                    className="flex-1 py-4 border border-dashed border-white/20 text-white/50 rounded-2xl hover:bg-white/5 hover:text-white hover:border-white/40 transition-all text-xs font-mono tracking-widest uppercase text-center"
                  >
                    + Add Snack
                  </button>
                  <label className="flex-1 py-4 border border-dashed border-indigo-500/30 text-indigo-400 bg-indigo-500/10 rounded-2xl hover:bg-indigo-500/20 hover:text-indigo-300 transition-all text-xs font-mono tracking-widest uppercase text-center cursor-pointer flex items-center justify-center gap-2">
                    {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    {isScanning ? 'Scanning...' : 'Scan Food'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="hidden" 
                      onChange={handleScanFoodImage} 
                      disabled={isScanning}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Daily Photo Tracker & Habit Tracker */}
        <div className="flex flex-col gap-8">
          
          {/* Daily Photo Check-in Card */}
          <div className="p-6 sm:p-8 bg-gradient-to-br from-black/50 via-indigo-950/20 to-black/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-white/90">Daily Photo</h3>
                  <p className="text-[11px] text-white/50 font-light">Physique & Transformation Log</p>
                </div>
              </div>

              {todayPhotoLog && (
                <span className="px-2.5 py-1 bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] font-mono tracking-wider rounded-full uppercase">
                  Captured Today
                </span>
              )}
            </div>

            {todayPhotoLog ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-white/15 h-44 group bg-black/60 shadow-lg">
                  <img 
                    src={todayPhotoLog.photo} 
                    alt="Today's progress" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-white/70 uppercase">
                          {todayPhotoLog.angle || 'Daily Check-in'} · {todayPhotoLog.weight ? `${todayPhotoLog.weight} kg` : ''}
                        </span>
                        {todayPhotoLog.note && (
                          <p className="text-xs text-white/90 font-light truncate max-w-[200px]">{todayPhotoLog.note}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setShowPhotoModal(true)}
                        className="px-2.5 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-[10px] font-mono text-white tracking-wider uppercase transition-colors"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {photoLogs.length >= 2 ? (
                    <button
                      onClick={() => setShowBeforeAfterModal(true)}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-95 text-white rounded-xl font-mono text-xs tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <Sparkles className="w-4 h-4" /> Compare with AI
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowPhotoModal(true)}
                      className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
                    >
                      <Camera className="w-4 h-4 text-fuchsia-400" /> Log Another Photo
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-white/60 font-light leading-relaxed">
                  Capture your daily physique snap to build your visual timeline and unlock AI Progress comparisons!
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPhotoModal(true)}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-95 text-white rounded-2xl font-mono text-xs tracking-wider uppercase shadow-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Camera className="w-4 h-4" /> Snap Today's Photo
                  </button>
                  {photoLogs.length >= 2 && (
                    <button
                      onClick={() => setShowBeforeAfterModal(true)}
                      className="p-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-2xl transition-colors"
                      title="View Past Comparisons"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-300" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <HabitTracker />
          
          {/* Consistency Card */}
          <div className="flex flex-col p-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl justify-center items-center text-center opacity-70">
             <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 mb-4 flex items-center justify-center opacity-50">
               <Sparkles className="w-6 h-6 text-white" />
             </div>
             <p className="text-xs font-mono uppercase tracking-widest text-white/50 mb-2">Consistency is Key</p>
             <p className="text-sm font-light text-white/70">Show up for yourself every single day. The compounding effect of small wins builds the body you desire.</p>
          </div>
        </div>
      </div>
      
      <GroceryListModal 
        isOpen={showGroceryList}
        onClose={() => setShowGroceryList(false)}
      />
      <DailySummaryModal 
        isOpen={showSummaryModal} 
        onClose={() => setShowSummaryModal(false)} 
        targetCals={targetCals}
      />
      <RecipeModal
        mealId={selectedRecipe}
        isTomorrow={isTomorrow}
        targetCals={targetCals}
        onClose={() => setSelectedRecipe(null)}
      />
      {selectedLogMeal && selectedLogMeal !== 'extra' && (
        <LogMealModal
          mealId={selectedLogMeal}
          suggestedTitle={RECIPES['today'][selectedLogMeal as MealId]?.title}
          suggestedCals={Math.round(targetCals * { breakfast: 0.30, lunch: 0.35, dinner: 0.35 }[selectedLogMeal as MealId]!)}
          onClose={() => setSelectedLogMeal(null)}
          onLog={(title, cals) => handleLogMeal(selectedLogMeal as MealId, title, cals)}
        />
      )}
      {selectedLogMeal === 'extra' && (
        <LogMealModal
          mealId="Extra Meal"
          isExtraMeal={true}
          onClose={() => setSelectedLogMeal(null)}
          onLog={(title, cals) => handleLogExtraMeal(title, cals)}
        />
      )}

      {/* Daily Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        currentWeight={userData?.weight}
        onSuccess={(newLog) => {
          setTodayPhotoLog(newLog);
          setPhotoLogs(prev => {
            const dateStr = format(new Date(), 'MMM dd');
            const filtered = prev.filter(p => p.date !== dateStr);
            return [...filtered, {
              date: dateStr,
              weight: newLog.weight,
              photo: newLog.photo,
              angle: newLog.angle as any,
              note: newLog.note
            }];
          });
        }}
      />

      {/* Before & After Progress Comparison Modal with AI */}
      <BeforeAfterModal
        isOpen={showBeforeAfterModal}
        onClose={() => setShowBeforeAfterModal(false)}
        logs={photoLogs}
        userGoal={userData?.primaryGoal}
      />

      {/* Android & Pixel Companion Hub Modal */}
      <AndroidCompanionModal
        isOpen={showAndroidHub}
        onClose={() => setShowAndroidHub(false)}
        userData={userData}
        workoutComplete={workoutComplete}
        todayPhotoLogged={!!todayPhotoLog}
      />

      {/* AI Fitness Coach Quick Assistant Modal */}
      <AICoachModal
        isOpen={showAICoachModal}
        onClose={() => setShowAICoachModal(false)}
        onGoalDefined={(g) => {
          toast.success(`Goal updated to: ${g}`);
          setShowAICoachModal(false);
        }}
      />

      {/* Offline Status Floating Pill */}
      <OfflineIndicator />
    </div>
  );
}

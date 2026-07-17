import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { CheckCircle2, Circle, Dumbbell, Utensils, ShoppingCart, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from "motion/react";
import confetti from 'canvas-confetti';
import HabitTracker from '../components/HabitTracker';
import DailySummaryModal from '../components/DailySummaryModal';
import RecipeModal, { RECIPES, MealId } from '../components/RecipeModal';
import GroceryListModal from '../components/GroceryListModal';
import LogMealModal from '../components/LogMealModal';
import { ROUTINES } from './Exercises';

export default function Home() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showGroceryList, setShowGroceryList] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  const [selectedLogMeal, setSelectedLogMeal] = useState<string | null>(null);
  const [isTomorrow, setIsTomorrow] = useState(false);
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
    <div className="flex flex-col flex-1 text-white p-6 relative z-20 max-w-2xl mx-auto w-full pb-24">
      <header className="flex justify-between items-start mb-6 pt-4">
        <div>
          <h1 className="text-2xl font-light tracking-widest uppercase text-white/90 mb-1">
            Let's crush it today, {user?.displayName?.split(' ')[0] || 'Achiever'}!
          </h1>
          <p className="text-white/50 font-mono text-sm tracking-widest uppercase">
            {userData.startingStatus}
          </p>
        </div>
        <button 
          onClick={handleSignOut}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-mono tracking-widest uppercase text-white/60 hover:text-white transition-all mt-1"
        >
          Sign Out
        </button>
      </header>

      {dailyTip && (
        <motion.div layout onClick={() => setIsTipExpanded(!isTipExpanded)} className="mb-6 p-4 bg-gradient-to-r from-fuchsia-600/10 to-indigo-600/10 border border-fuchsia-500/20 rounded-2xl relative overflow-hidden flex items-start gap-3 cursor-pointer group">
          <div className="p-2 bg-fuchsia-500/20 rounded-xl shrink-0 group-hover:bg-fuchsia-500/30 transition-colors">
            <Sparkles className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono tracking-widest text-white/50 uppercase mb-1">Daily Coach Tip</p>
            <motion.p layout="position" className={`text-sm font-light text-white/90 leading-relaxed ${isTipExpanded ? "" : "line-clamp-2"}`}>{dailyTip}</motion.p>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between items-center mb-8">
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
        
        <button
          onClick={() => setShowGroceryList(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-full hover:bg-indigo-600/30 transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-[10px] font-mono tracking-widest uppercase hidden sm:inline">Grocery List</span>
        </button>
      </div>
      
      <div className="flex-1 flex flex-col gap-6">
        <HabitTracker />
        
        {/* Workout Card */}
        <div className="p-6 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col relative overflow-hidden group cursor-pointer" onClick={() => !isTomorrow && navigate('/exercises')}>
          <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${!isTomorrow && workoutComplete ? 'bg-green-500' : 'bg-indigo-500/50'}`}></div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Dumbbell className={`w-4 h-4 ${!isTomorrow && workoutComplete ? 'text-green-400' : 'text-indigo-400'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${!isTomorrow && workoutComplete ? 'text-green-400' : 'text-indigo-400'}`}>
                {isTomorrow ? "Tomorrow's Workout" : "Today's Workout"}
              </span>
            </div>
            {!isTomorrow && (
              <button 
                className="focus:outline-none z-10" 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWorkout();
                }}
              >
                {workoutComplete ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500 transition-all" />
                ) : (
                  <Circle className="w-8 h-8 text-white/20 group-hover:text-white/40 transition-all" />
                )}
              </button>
            )}
          </div>
          <h3 className="text-xl font-light tracking-widest text-white/90 mb-2">
            {isTomorrow ? currentRoutine.tomorrowTitle : currentRoutine.todayTitle}
          </h3>
          <p className="text-white/50 font-mono text-xs">
            {isTomorrow ? currentRoutine.tomorrowSubtitle : currentRoutine.todaySubtitle}
          </p>
        </div>

        {/* Meals Card */}
        <div className="p-6 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${(!isTomorrow && nutrition.breakfast.completed && nutrition.lunch.completed && nutrition.dinner.completed) ? 'bg-green-500' : 'bg-fuchsia-500/50'}`}></div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Utensils className={`w-4 h-4 ${(!isTomorrow && nutrition.breakfast.completed && nutrition.lunch.completed && nutrition.dinner.completed) ? 'text-green-400' : 'text-fuchsia-400'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${(!isTomorrow && nutrition.breakfast.completed && nutrition.lunch.completed && nutrition.dinner.completed) ? 'text-green-400' : 'text-fuchsia-400'}`}>
                {isTomorrow ? "Tomorrow's Meals" : "Today's Meals"}
              </span>
            </div>
            {(!isTomorrow && nutrition.breakfast.completed && nutrition.lunch.completed && nutrition.dinner.completed) && (
              <CheckCircle2 className="w-8 h-8 text-green-500 transition-all" />
            )}
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-white/10 pb-6 mb-6 gap-6">
            <div className="flex-1 w-full text-center md:text-left">
              <p className="text-white/50 font-mono text-[10px] tracking-widest uppercase mb-1">{!isTomorrow ? 'Consumed / Target' : 'Target'}</p>
              <p className="text-4xl font-light tracking-widest">
                {!isTomorrow && (
                  <span className="text-green-400 mr-2">{totalConsumedCals}</span>
                )}
                <span className={!isTomorrow ? "text-xl text-white/50" : ""}>
                  {!isTomorrow && '/ '}
                  {targetCals} <span className="text-sm text-white/40">kcal</span>
                </span>
              </p>
              {!isTomorrow && (targetCals - (totalConsumedCals)) <= 100 && (targetCals - (totalConsumedCals)) > 0 && (
                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-mono tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  Mindful Eating Zone
                </div>
              )}
            </div>
            
            {!isTomorrow && (
              <div className="w-32 h-32 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Consumed', value: Math.min(totalConsumedCals, targetCals) },
                        { name: 'Remaining', value: Math.max(targetCals - (totalConsumedCals), 0) }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={55}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={10}
                    >
                      <Cell fill="#4ade80" />
                      <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Left</span>
                  <span className="text-sm font-bold text-white/90">
                    {Math.max(targetCals - (totalConsumedCals), 0)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mb-4 relative overflow-hidden group">
            <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase mb-4">Macros Chart</h3>
            <div className="h-40 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={macroChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }}
                    itemStyle={{ color: "#fff" }}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  />
                  <Bar dataKey="Consumed" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Target" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
              <div 
                className="absolute left-0 bottom-0 h-1 bg-indigo-500/50 transition-all" 
                style={{ width: `${Math.min(((totalConsumedCals)*0.3/4) / protein * 100, 100)}%` }}
              />
              <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase mb-2">Protein</p>
              <p className="font-light tracking-wider text-indigo-300">{protein}g</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
              <div 
                className="absolute left-0 bottom-0 h-1 bg-fuchsia-500/50 transition-all" 
                style={{ width: `${Math.min(((totalConsumedCals)*0.4/4) / carbs * 100, 100)}%` }}
              />
              <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase mb-2">Carbs</p>
              <p className="font-light tracking-wider text-fuchsia-300">{carbs}g</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
              <div 
                className="absolute left-0 bottom-0 h-1 bg-blue-500/50 transition-all" 
                style={{ width: `${Math.min(((totalConsumedCals)*0.3/9) / fats * 100, 100)}%` }}
              />
              <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase mb-2">Fats</p>
              <p className="font-light tracking-wider text-blue-300">{fats}g</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 font-mono text-xs text-white/70">
            {(['breakfast', 'lunch', 'dinner'] as MealId[]).map((mealId) => {
              if (!mealId) return null;
              const recipe = RECIPES[isTomorrow ? 'tomorrow' : 'today'][mealId];
              const mealPercentages = { breakfast: 0.30, lunch: 0.35, dinner: 0.35 };
              const suggestedCals = Math.round(targetCals * mealPercentages[mealId]);
              const isCompleted = !isTomorrow && nutrition[mealId].completed;

              return (
                <div key={mealId} className="flex justify-between items-center py-3 border-b border-white/5 cursor-pointer group hover:bg-white/5 px-3 -mx-3 rounded-lg transition-colors" onClick={() => setSelectedRecipe(mealId)}>
                  <div className="flex items-center gap-3">
                    {!isTomorrow && (
                      <button className="focus:outline-none" onClick={(e) => { 
                        e.stopPropagation(); 
                        if (isCompleted) {
                          unlogMeal(mealId);
                        } else {
                          setSelectedLogMeal(mealId);
                        }
                      }}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 transition-all" />
                        ) : (
                          <Circle className="w-5 h-5 text-white/20 transition-all group-hover:text-white/40" />
                        )}
                      </button>
                    )}
                    <div className="flex flex-col">
                      <span className="capitalize text-sm font-light text-white">{mealId}</span>
                      {isCompleted && (
                        <span className="text-[10px] text-green-400 mt-1">{nutrition[mealId].cals} kcal</span>
                      )}
                    </div>
                  </div>
                  <span className="text-white/40 group-hover:text-white/60 transition-colors text-right">
                    {isCompleted && nutrition[mealId].title ? nutrition[mealId].title : recipe.title}
                  </span>
                </div>
              );
            })}

            {!isTomorrow && (nutrition.extraMeals || []).map((meal) => (
              <div key={meal.id} className="flex justify-between items-center py-3 border-b border-white/5 px-3 -mx-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <button className="focus:outline-none" onClick={(e) => { 
                    e.stopPropagation(); 
                    unlogExtraMeal(meal.id);
                  }}>
                    <CheckCircle2 className="w-5 h-5 text-green-500 transition-all" />
                  </button>
                  <div className="flex flex-col">
                    <span className="capitalize text-sm font-light text-white">Extra Meal</span>
                    <span className="text-[10px] text-green-400 mt-1">{meal.cals} kcal</span>
                  </div>
                </div>
                <span className="text-white/60 text-right">
                  {meal.title}
                </span>
              </div>
            ))}

            {!isTomorrow && (
              <button 
                onClick={() => setSelectedLogMeal('extra')}
                className="w-full py-3 mt-4 border border-dashed border-white/20 text-white/50 rounded-xl hover:bg-white/5 hover:text-white transition-colors text-xs font-mono tracking-widest uppercase text-center"
              >
                + Add Snack / Extra Meal
              </button>
            )}
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
      </div>
    </div>
  );
}

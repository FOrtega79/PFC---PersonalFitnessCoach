cat << 'INNER_EOF' > src/pages/Onboarding.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Check, Activity, Target, Flame, Sparkles } from 'lucide-react';
import AICoachModal from '../components/AICoachModal';

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(auth.currentUser);
  const [step, setStep] = useState(0); 
  const [showAICoach, setShowAICoach] = useState(false);
  
  const searchParams = new URLSearchParams(location.search);
  const isRetake = searchParams.get('retake') === 'true';

  const [formData, setFormData] = useState({
    age: '25',
    gender: 'Male',
    height: '170',
    weight: '70',
    activityLevel: 'Sedentary',
    trainingDays: '3',
    primaryGoal: 'Lose Weight',
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);
      if (currUser) {
        // Use window.location.search to ensure we have the absolute latest URL
        const currentIsRetake = new URLSearchParams(window.location.search).get('retake') === 'true';
        
        const docRef = doc(db, 'users', currUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (currentIsRetake || isRetake) {
            setFormData({
              age: data.age?.toString() || '25',
              gender: data.gender || 'Male',
              height: data.height?.toString() || '170',
              weight: data.weight?.toString() || '70',
              activityLevel: data.activityLevel || 'Sedentary',
              trainingDays: data.trainingDays?.toString() || '3',
              primaryGoal: data.primaryGoal || 'Lose Weight',
            });
            setStep(1);
            return;
          }
          navigate('/home', { replace: true });
        } else {
          setStep(1);
        }
      } else {
        setStep(0);
      }
    });
    return unsub;
  }, [navigate, isRetake]);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const calculateAndSave = async () => {
    if (!user) return;
    const age = parseInt(formData.age);
    const height = parseFloat(formData.height); // cm
    const weight = parseFloat(formData.weight); // kg
    const trainingDays = parseInt(formData.trainingDays);
    
    // BMI
    const bmi = weight / ((height / 100) * (height / 100));
    
    // BMR (Mifflin-St Jeor)
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += formData.gender === 'Male' ? 5 : -161;
    
    // TDEE
    const multipliers: Record<string, number> = {
      'Sedentary': 1.2,
      'Lightly Active': 1.375,
      'Moderately Active': 1.55,
      'Very Active': 1.725
    };
    const tdee = bmr * multipliers[formData.activityLevel];
    
    // Target Daily Calories
    const goalAdjustments: Record<string, number> = {
      'Lose Weight': -500,
      'Maintain': 0,
      'Build Muscle': 300
    };
    const targetDailyCalories = tdee + goalAdjustments[formData.primaryGoal];
    
    // Motivational Status based on BMI
    let startingStatus = "Ready to Ignite";
    if (bmi < 18.5) {
      startingStatus = "Lean Machine Ready to Build";
    } else if (bmi >= 18.5 && bmi < 24.9) {
      startingStatus = "Active Achiever";
    } else if (bmi >= 25 && bmi < 29.9) {
      startingStatus = "Foundation Builder";
    }
    
    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, {
      uid: user.uid,
      age,
      gender: formData.gender,
      height,
      weight,
      activityLevel: formData.activityLevel,
      trainingDays,
      primaryGoal: formData.primaryGoal,
      bmi: parseFloat(bmi.toFixed(1)),
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetDailyCalories: Math.round(targetDailyCalories),
      startingStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    navigate('/home', { replace: true });
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  if (step === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-white p-6 relative z-20">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm flex flex-col items-center gap-8"
        >
          <div className="w-24 h-24 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.3)]">
            <Activity className="w-12 h-12 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-light tracking-[0.2em] uppercase text-white/90 mb-2">Coach PWA</h1>
            <p className="text-white/50 font-mono text-sm tracking-widest uppercase">Start Your Journey</p>
          </div>
          <button 
            onClick={handleSignIn}
            className="w-full py-4 bg-white text-black font-mono text-xs tracking-widest uppercase rounded-2xl hover:bg-white/90 transition-colors shadow-xl flex items-center justify-center gap-3 mt-4"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <div className="flex flex-col flex-1 text-white p-6 relative z-20 max-w-md mx-auto w-full">
      <header className="flex justify-between items-center mb-8 shrink-0">
        <button 
          onClick={step > 1 ? prevStep : () => navigate('/home')} 
          className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white/70" />
        </button>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step >= i ? 'w-6 bg-indigo-500' : 'w-2 bg-white/10'}`} />
          ))}
        </div>
      </header>

      <div className="flex-1 relative">
        <AnimatePresence initial={false} mode="wait" custom={1}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0 flex flex-col gap-6 overflow-y-auto overflow-x-hidden pb-4 scrollbar-hide"
            >
              <div>
                <h3 className="text-2xl font-light tracking-wide text-white/90 mb-2">The Basics</h3>
                <p className="text-white/50 font-mono text-sm">Let's calculate your metabolic rate.</p>
              </div>

              <div className="space-y-6 mt-4">
                <div className="flex justify-between items-end">
                  <label className="block text-xs font-mono tracking-widest text-white/40 uppercase">Age</label>
                  <span className="text-3xl font-light">{formData.age}</span>
                </div>
                <input 
                  type="range" 
                  min="16" max="100" 
                  value={formData.age} 
                  onChange={e => setFormData({...formData, age: e.target.value})} 
                  className="w-full accent-indigo-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" 
                />
              </div>

              <div className="space-y-4 mt-8">
                <label className="block text-xs font-mono tracking-widest text-white/40 uppercase">Gender (For BMR)</label>
                <div className="flex gap-4">
                  {['Male', 'Female'].map(g => (
                    <button
                      key={g}
                      onClick={() => setFormData({...formData, gender: g})}
                      className={`flex-1 py-4 rounded-2xl border transition-all font-mono tracking-widest uppercase text-sm ${formData.gender === g ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-black/30 border-white/10 text-white/50 hover:bg-white/5'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={nextStep} className="w-full mt-auto mb-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs tracking-widest uppercase rounded-2xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex justify-center items-center gap-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0 flex flex-col gap-6 overflow-y-auto overflow-x-hidden pb-4 scrollbar-hide"
            >
              <div>
                <h3 className="text-2xl font-light tracking-wide text-white/90 mb-2">Metrics</h3>
                <p className="text-white/50 font-mono text-sm">Fine-tuning your daily targets.</p>
              </div>

              <div className="space-y-6 mt-4">
                <div className="flex justify-between items-end">
                  <label className="block text-xs font-mono tracking-widest text-white/40 uppercase">Height</label>
                  <span className="text-3xl font-light">{formData.height} <span className="text-sm text-white/40">cm</span></span>
                </div>
                <input 
                  type="range" 
                  min="140" max="220" 
                  value={formData.height} 
                  onChange={e => setFormData({...formData, height: e.target.value})} 
                  className="w-full accent-indigo-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" 
                />
              </div>

              <div className="space-y-6 mt-8">
                <div className="flex justify-between items-end">
                  <label className="block text-xs font-mono tracking-widest text-white/40 uppercase">Weight</label>
                  <span className="text-3xl font-light">{formData.weight} <span className="text-sm text-white/40">kg</span></span>
                </div>
                <input 
                  type="range" 
                  min="40" max="150" 
                  value={formData.weight} 
                  onChange={e => setFormData({...formData, weight: e.target.value})} 
                  className="w-full accent-indigo-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" 
                />
              </div>

              <button onClick={nextStep} className="w-full mt-auto mb-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs tracking-widest uppercase rounded-2xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex justify-center items-center gap-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0 flex flex-col gap-6 overflow-y-auto overflow-x-hidden pb-4 scrollbar-hide"
            >
              <div>
                <h3 className="text-2xl font-light tracking-wide text-white/90 mb-2">Lifestyle</h3>
                <p className="text-white/50 font-mono text-sm">How active is your day-to-day?</p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'Sedentary', desc: 'Office job, little to no exercise' },
                  { id: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
                  { id: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
                  { id: 'Very Active', desc: 'Heavy exercise 6-7 days/week' }
                ].map((level) => (
                  <div 
                    key={level.id}
                    onClick={() => setFormData({ ...formData, activityLevel: level.id })}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${formData.activityLevel === level.id ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-black/30 border-white/10 hover:bg-white/5'}`}
                  >
                    <div>
                      <p className="font-mono tracking-widest uppercase text-sm mb-1">{level.id}</p>
                      <p className="text-xs text-white/40">{level.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.activityLevel === level.id ? 'border-indigo-400 bg-indigo-500/30' : 'border-white/20'}`}>
                      {formData.activityLevel === level.id && <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full"></div>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6 mt-4">
                <div className="flex justify-between items-end">
                  <label className="block text-xs font-mono tracking-widest text-white/40 uppercase">Training Days</label>
                  <span className="text-3xl font-light">{formData.trainingDays} <span className="text-sm text-white/40">days/week</span></span>
                </div>
                <input 
                  type="range" 
                  min="1" max="7" 
                  value={formData.trainingDays} 
                  onChange={e => setFormData({...formData, trainingDays: e.target.value})} 
                  className="w-full accent-indigo-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" 
                />
              </div>

              <button onClick={nextStep} className="w-full mt-auto mb-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs tracking-widest uppercase rounded-2xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex justify-center items-center gap-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0 flex flex-col gap-6 overflow-y-auto overflow-x-hidden pb-4 scrollbar-hide"
            >
              <div>
                <h3 className="text-2xl font-light tracking-wide text-white/90 mb-2">The Goal</h3>
                <p className="text-white/50 font-mono text-sm">What are we aiming for?</p>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'Lose Weight', icon: Flame, desc: 'Caloric deficit to burn fat' },
                  { id: 'Maintain', icon: Target, desc: 'Stay healthy and maintain current weight' },
                  { id: 'Build Muscle', icon: Activity, desc: 'Caloric surplus to build strength' }
                ].map((goal) => {
                  const Icon = goal.icon;
                  return (
                    <div 
                      key={goal.id}
                      onClick={() => setFormData({ ...formData, primaryGoal: goal.id })}
                      className={`p-6 rounded-3xl border cursor-pointer transition-all flex items-center gap-4 ${formData.primaryGoal === goal.id ? 'bg-fuchsia-500/20 border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.2)]' : 'bg-black/30 border-white/10 hover:bg-white/5'}`}
                    >
                      <div className={`p-3 rounded-2xl ${formData.primaryGoal === goal.id ? 'bg-fuchsia-500/30' : 'bg-white/5'}`}>
                        <Icon className={`w-6 h-6 ${formData.primaryGoal === goal.id ? 'text-fuchsia-400' : 'text-white/40'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-mono tracking-widest uppercase text-sm mb-1">{goal.id}</p>
                        <p className="text-xs text-white/40">{goal.desc}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${formData.primaryGoal === goal.id ? 'border-fuchsia-400 bg-fuchsia-500/30' : 'border-white/20'}`}>
                        {formData.primaryGoal === goal.id && <Check className="w-4 h-4 text-fuchsia-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={() => setShowAICoach(true)} className="w-full mt-4 mb-4 py-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs tracking-widest uppercase rounded-2xl hover:bg-indigo-500/20 transition-all flex justify-center items-center gap-2"><Sparkles className="w-4 h-4" />Help me decide (AI Coach)</button>

              <button onClick={calculateAndSave} className="w-full mt-auto mb-10 py-5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:opacity-90 text-white font-mono text-xs tracking-widest uppercase rounded-2xl transition-all shadow-[0_0_30px_rgba(217,70,239,0.3)] flex justify-center items-center gap-2">
                Generate Plan <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

      <AICoachModal 
        isOpen={showAICoach}
        onClose={() => setShowAICoach(false)}
        onGoalDefined={(goal) => {
          setFormData({ ...formData, primaryGoal: goal });
        }}
      />
        </AnimatePresence>
      </div>
    </div>
  );
}
INNER_EOF

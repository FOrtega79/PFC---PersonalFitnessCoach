import { X, Target, Flame, Activity, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

interface UpdateGoalsModalProps {
  onClose: () => void;
  userData: any;
  setUserData: (data: any) => void;
}

export default function UpdateGoalsModal({ onClose, userData, setUserData }: UpdateGoalsModalProps) {
  const navigate = useNavigate();
  const [activityLevel, setActivityLevel] = useState(userData?.activityLevel || 'Moderately Active');
  const [primaryGoal, setPrimaryGoal] = useState(userData?.primaryGoal || 'Maintain');
  const [weight, setWeight] = useState(userData?.weight || 70);
  const [height, setHeight] = useState(userData?.height || 170);
  const [trainingDays, setTrainingDays] = useState(userData?.trainingDays || 3);
  
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const age = parseInt(userData?.age || '25');
      const gender = userData?.gender || 'Male';

      const parsedWeight = parseFloat(weight);
      const parsedHeight = parseFloat(height);
      const parsedTrainingDays = parseInt(trainingDays);

      // BMR (Mifflin-St Jeor)
      let bmr = (10 * parsedWeight) + (6.25 * parsedHeight) - (5 * age);
      bmr += gender === 'Male' ? 5 : -161;
      
      // TDEE
      const multipliers: Record<string, number> = {
        'Sedentary': 1.2,
        'Lightly Active': 1.375,
        'Moderately Active': 1.55,
        'Very Active': 1.725
      };
      const tdee = bmr * (multipliers[activityLevel] || 1.55);
      
      // Target Daily Calories
      const goalAdjustments: Record<string, number> = {
        'Lose Weight': -500,
        'Maintain': 0,
        'Build Muscle': 300
      };
      const targetDailyCalories = Math.round(tdee + (goalAdjustments[primaryGoal] || 0));

      const updates = {
        activityLevel,
        primaryGoal,
        targetDailyCalories,
        weight: parsedWeight,
        height: parsedHeight,
        trainingDays: parsedTrainingDays,
        tdee,
      };

      await setDoc(doc(db, 'users', auth.currentUser.uid), updates, { merge: true });
      setUserData({ ...userData, ...updates });
      onClose();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleRetakeOnboarding = () => {
    onClose();
    navigate('/onboarding?retake=true');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-end sm:justify-center">
      <div className="bg-[#0F172A] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-light tracking-widest text-white uppercase">Adjust Goals</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pb-8 pr-2">
          
          <div className="space-y-6 mt-4">
            <div className="flex justify-between items-end">
              <label className="block text-xs font-mono tracking-widest text-white/60 uppercase">Weight</label>
              <span className="text-3xl font-light text-white">{weight} <span className="text-sm text-white/40">kg</span></span>
            </div>
            <input 
              type="range" 
              min="40" max="150" 
              value={weight} 
              onChange={e => setWeight(e.target.value)} 
              className="w-full accent-indigo-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" 
            />
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <label className="block text-xs font-mono tracking-widest text-white/60 uppercase">Height</label>
              <span className="text-3xl font-light text-white">{height} <span className="text-sm text-white/40">cm</span></span>
            </div>
            <input 
              type="range" 
              min="140" max="220" 
              value={height} 
              onChange={e => setHeight(e.target.value)} 
              className="w-full accent-indigo-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" 
            />
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <label className="block text-xs font-mono tracking-widest text-white/60 uppercase">Training Days</label>
              <span className="text-3xl font-light text-white">{trainingDays} <span className="text-sm text-white/40">days/week</span></span>
            </div>
            <input 
              type="range" 
              min="1" max="7" 
              value={trainingDays} 
              onChange={e => setTrainingDays(e.target.value)} 
              className="w-full accent-indigo-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" 
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-mono tracking-widest uppercase text-white/60">Activity Level</label>
            <div className="space-y-2">
              {[
                { id: 'Sedentary', desc: 'Office job, little to no exercise' },
                { id: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
                { id: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
                { id: 'Very Active', desc: 'Heavy exercise 6-7 days/week' }
              ].map((level) => (
                <div 
                  key={level.id}
                  onClick={() => setActivityLevel(level.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${activityLevel === level.id ? 'bg-indigo-500/20 border-indigo-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div>
                    <p className="font-mono tracking-widest uppercase text-sm mb-0.5 text-white">{level.id}</p>
                    <p className="text-xs text-white/50">{level.desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activityLevel === level.id ? 'border-indigo-400' : 'border-white/30'}`}>
                    {activityLevel === level.id && <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-mono tracking-widest uppercase text-white/60">Primary Goal</label>
            <div className="space-y-2">
              {[
                { id: 'Lose Weight', icon: Flame, desc: 'Caloric deficit to burn fat' },
                { id: 'Maintain', icon: Target, desc: 'Stay healthy and maintain current weight' },
                { id: 'Build Muscle', icon: Activity, desc: 'Caloric surplus to build strength' }
              ].map((goal) => {
                const Icon = goal.icon;
                return (
                  <div 
                    key={goal.id}
                    onClick={() => setPrimaryGoal(goal.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${primaryGoal === goal.id ? 'bg-fuchsia-500/20 border-fuchsia-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <div className={`p-2 rounded-lg ${primaryGoal === goal.id ? 'bg-fuchsia-500/30 text-fuchsia-400' : 'bg-white/5 text-white/40'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-mono tracking-widest uppercase text-sm mb-0.5 text-white">{goal.id}</p>
                      <p className="text-xs text-white/50">{goal.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/10">
            <button 
              onClick={handleRetakeOnboarding}
              className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs tracking-widest uppercase transition-colors flex justify-center items-center gap-2 border border-white/10"
            >
              <RefreshCw className="w-4 h-4" /> Retake Full Onboarding
            </button>
            <p className="text-center text-[10px] text-white/40 mt-3 px-4 leading-relaxed font-mono uppercase tracking-widest">
              Need more help? Our AI coach can re-assess your goals from scratch.
            </p>
          </div>
        </div>

        <div className="pt-4 shrink-0">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-mono text-sm tracking-widest uppercase hover:opacity-90 disabled:opacity-50 transition-opacity shadow-xl"
          >
            {saving ? 'Recalculating...' : 'Update & Recalculate'}
          </button>
        </div>

      </div>
    </div>
  );
}

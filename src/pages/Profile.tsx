import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, getDocs, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Camera, Plus, X, Settings, Info, Sparkles, Tag, Upload, Trash2, Calendar, Eye, Sliders, Check, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

import Achievements from '../components/Achievements';
import SettingsModal from '../components/SettingsModal';
import BeforeAfterModal, { PhotoLog } from '../components/BeforeAfterModal';
import PhotoUploadModal from '../components/PhotoUploadModal';
import UpdateGoalsModal from '../components/UpdateGoalsModal';
import AndroidCompanionModal from '../components/AndroidCompanionModal';

const getAverages = (gender: string, age: number) => {
  const isMale = gender === 'Male';
  const avgWeight = isMale ? 90 : 77;
  const avgHeight = isMale ? 175 : 162;
  const avgBmi = parseFloat((avgWeight / ((avgHeight / 100) ** 2)).toFixed(1));
  let baseBmr = (10 * avgWeight) + (6.25 * avgHeight) - (5 * age);
  baseBmr += isMale ? 5 : -161;
  const avgBmr = Math.round(baseBmr);
  const avgTdee = Math.round(avgBmr * 1.55);

  return { weight: avgWeight, bmi: avgBmi, bmr: avgBmr, tdee: avgTdee };
};

const MetricInfo = ({ 
  explanation, 
  comparisonLabel,
  currentValue,
  averageValue,
  unit = ''
}: { 
  explanation: string, 
  comparisonLabel?: string,
  currentValue?: number,
  averageValue?: number,
  unit?: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const maxVal = Math.max(currentValue || 0, averageValue || 0) * 1.2;
  const currentPct = currentValue && maxVal ? (currentValue / maxVal) * 100 : 0;
  const avgPct = averageValue && maxVal ? (averageValue / maxVal) * 100 : 0;

  return (
    <div className="mt-3 w-full relative z-30 flex flex-col items-center">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-indigo-400 transition-colors bg-white/5 px-2 py-1 rounded-lg"
      >
        <Info className="w-3 h-3" /> {isOpen ? 'Hide Info' : 'What is this?'}
      </button>
      {isOpen && (
        <div className="mt-3 w-full p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-left animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
          <p className="text-xs text-white/80 leading-relaxed font-sans">{explanation}</p>
          
          {comparisonLabel && currentValue !== undefined && averageValue !== undefined && (
            <div className="pt-3 mt-3 border-t border-indigo-500/20">
              <p className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest mb-3">
                {comparisonLabel}
              </p>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest mb-1">
                    <span className="text-white/90">You</span>
                    <span className="text-white">{currentValue} {unit}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${currentPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest mb-1">
                    <span className="text-white/50">Average</span>
                    <span className="text-white/70">{averageValue} {unit}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/30 rounded-full transition-all duration-1000" 
                      style={{ width: `${avgPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [activeChartTab, setActiveChartTab] = useState<'weight' | 'activity'>('weight');
  const [newWeight, setNewWeight] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [progressPhoto, setProgressPhoto] = useState<string | null>(null);
  const [user, setUser] = useState(auth.currentUser);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [showAndroidHub, setShowAndroidHub] = useState(false);
  const [angleFilter, setAngleFilter] = useState<'All' | 'Front' | 'Side' | 'Back' | 'General'>('All');
  const [selectedPhotoDetail, setSelectedPhotoDetail] = useState<any | null>(null);

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
          const data = docSnap.data();
          setUserData(data);
          if (data.avatar) setAvatar(data.avatar);
        } else {
          navigate('/onboarding', { replace: true });
          return;
        }

        // Load weight logs
        const logsRef = collection(db, 'users', user.uid, 'daily_logs');
        const q = query(logsRef, orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        const logs = querySnapshot.docs.map(d => ({ ...(d.data() as any), id: d.id }));
        
        // If no logs, seed with initial weight
        if (logs.length === 0 && docSnap.exists()) {
          const initialLog = {
            date: format(new Date(docSnap.data().createdAt?.toDate() || new Date()), 'MMM dd'),
            rawDate: format(new Date(docSnap.data().createdAt?.toDate() || new Date()), 'yyyy-MM-dd'),
            timestamp: docSnap.data().createdAt?.toDate()?.toISOString() || new Date().toISOString(),
            weight: docSnap.data().weight,
            photo: null,
            angle: 'Front',
            note: ''
          };
          setWeightLogs([initialLog]);
        } else {
          const formattedLogs = logs.map((l: any) => ({
            date: format(new Date(l.date), 'MMM dd'),
            rawDate: l.date || l.id,
            timestamp: l.timestamp || l.updatedAt || l.date,
            weight: l.weight,
            photo: l.photo || null,
            angle: l.angle || 'Front',
            note: l.note || ''
          }));
          setWeightLogs(formattedLogs);
        }

        // Load workout activity
        const workoutsRef = collection(db, 'users', user.uid, 'completed_workouts');
        const workoutsQ = query(workoutsRef, orderBy('date', 'asc'));
        const workoutsSnap = await getDocs(workoutsQ);
        
        const activityData = workoutsSnap.docs.slice(-14).map(d => {
          const data = d.data();
          return {
            date: format(new Date(data.date), 'MMM dd'),
            exercises: data.completedExercises?.length || 0,
          };
        });
        setWorkoutLogs(activityData);
      } catch (err: any) {
        console.error("Error loading profile data:", err);
        setError(err.message || 'Failed to load profile data.');
      }
    }
    loadData();
  }, [user, navigate]);

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newWeight) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const w = parseFloat(parseFloat(newWeight).toFixed(1));
    
    await setDoc(doc(db, 'users', user.uid, 'daily_logs', today), {
      date: today,
      weight: w,
      photo: progressPhoto || null
    });
    
    setWeightLogs(prev => {
      const existingIdx = prev.findIndex(l => l.date === format(new Date(), 'MMM dd'));
      const newLog = { date: format(new Date(), 'MMM dd'), weight: w, photo: progressPhoto || null };
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newLog;
        return updated;
      }
      return [...prev, newLog];
    });
    setNewWeight('');
    setProgressPhoto(null);
    
    let newBmi = userData.bmi;
    let newBmr = userData.bmr;
    let newTdee = userData.tdee;
    let newTarget = userData.targetDailyCalories;

    if (userData.height && userData.age && userData.gender && userData.activityLevel) {
      newBmi = parseFloat((w / ((userData.height / 100) * (userData.height / 100))).toFixed(1));
      
      let baseBmr = (10 * w) + (6.25 * userData.height) - (5 * userData.age);
      baseBmr += userData.gender === 'Male' ? 5 : -161;
      newBmr = Math.round(baseBmr);
      
      const multipliers: Record<string, number> = {
        'Sedentary': 1.2,
        'Lightly Active': 1.375,
        'Moderately Active': 1.55,
        'Very Active': 1.725
      };
      newTdee = Math.round(newBmr * (multipliers[userData.activityLevel] || 1.2));
      
      const goalAdjustments: Record<string, number> = {
        'Lose Weight': -500,
        'Maintain': 0,
        'Build Muscle': 300
      };
      newTarget = newTdee + (goalAdjustments[userData.primaryGoal || 'Maintain'] || 0);
    }

    // update current weight and calculated metrics in user profile
    await setDoc(doc(db, 'users', user.uid), { 
      weight: w,
      bmi: newBmi,
      bmr: newBmr,
      tdee: newTdee,
      targetDailyCalories: newTarget
    }, { merge: true });

    setUserData((prev: any) => ({
      ...prev,
      weight: w,
      bmi: newBmi,
      bmr: newBmr,
      tdee: newTdee,
      targetDailyCalories: newTarget
    }));
  };

  const handleDeletePhoto = async (targetRawDate: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'daily_logs', targetRawDate), {
        photo: null
      }, { merge: true });

      setWeightLogs(prev => prev.map(l => {
        if (l.rawDate === targetRawDate || l.date === targetRawDate) {
          return { ...l, photo: null };
        }
        return l;
      }));

      if (selectedPhotoDetail && (selectedPhotoDetail.rawDate === targetRawDate || selectedPhotoDetail.date === targetRawDate)) {
        setSelectedPhotoDetail(null);
      }
      toast.success('Progress photo deleted.');
    } catch (err) {
      console.error('Error deleting progress photo:', err);
      toast.error('Failed to delete photo.');
    }
  };

  const handleProgressPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 512;
          const MAX_HEIGHT = 512;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.6 quality to save space
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setProgressPhoto(resizedDataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          setAvatar(resizedDataUrl);
          if (user) {
            await setDoc(doc(db, 'users', user.uid), { avatar: resizedDataUrl }, { merge: true });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  if (error) return (
    <div className="p-6 text-red-400 text-center mt-20 flex flex-col gap-4">
      <p>Failed to load profile.</p>
      <p className="text-sm opacity-80">{error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 rounded-full text-xs font-mono tracking-widest uppercase">Retry</button>
    </div>
  );

  if (!userData) return <div className="p-6 text-white/50 text-center mt-20 flex flex-col items-center gap-4">
    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    <p>Loading profile...</p>
  </div>;

  const averages = userData?.age && userData?.gender ? getAverages(userData.gender, userData.age) : null;

  return (
    <div className="flex flex-col flex-1 text-white p-6 lg:p-10 relative z-20 max-w-7xl mx-auto w-full pb-24">
      <header className="mb-10 pt-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-light tracking-widest uppercase text-white/90 mb-2">
            Dashboard
          </h1>
          <p className="text-white/50 font-mono text-sm tracking-widest uppercase">
            Your Progress
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAndroidHub(true)}
            className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 hover:text-white hover:bg-indigo-600/30 transition-all hover:scale-105"
            title="Pixel & Android Companion Hub"
          >
            <Smartphone className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all hover:scale-105"
            title="Settings & Reminders"
          >
            <Settings className="w-6 h-6" />
          </button>
          
          <div className="relative">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-lg">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-light text-2xl md:text-3xl text-indigo-300">{user?.displayName?.charAt(0) || 'U'}</span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-fuchsia-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-fuchsia-500 transition-colors hover:scale-110">
              <Camera className="w-3.5 h-3.5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-8">
        
        {/* Left Column */}
        <div className="flex flex-col gap-8">
          
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 gap-6">
            <div className="p-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center text-center">
              <p className="text-xs font-mono tracking-widest text-white/40 uppercase mb-3">Current Weight</p>
              <p className="text-5xl font-light tracking-widest text-indigo-300">
                {weightLogs.length > 0 ? Number(weightLogs[weightLogs.length - 1].weight).toFixed(1) : Number(userData.weight).toFixed(1)} <span className="text-xl text-white/40">kg</span>
              </p>
              <MetricInfo 
                explanation="Your total body weight. Logging this consistently at the same time every day provides the most accurate long-term trend."
                comparisonLabel={averages ? `Avg ${userData.age}yo ${userData.gender}` : undefined}
                currentValue={weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : userData.weight}
                averageValue={averages?.weight}
                unit="kg"
              />
            </div>
            <div 
              className="p-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center text-center transition-colors group relative"
            >
              <p className="text-xs font-mono tracking-widest text-white/40 uppercase mb-3">Daily Target</p>
              <p className="text-5xl font-light tracking-widest text-fuchsia-300">
                {Math.round(userData.targetDailyCalories || userData.tdee)} <span className="text-xl text-white/40">kcal</span>
              </p>
              <MetricInfo 
                explanation="Your specific calorie goal for the day based on your selected objective (Lose Weight, Maintain, Build Muscle)."
              />
            </div>
          </div>

          {/* Metabolic Profile */}
          <div className="grid grid-cols-1 gap-6">
            <div className="p-6 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center text-center">
              <p className="text-xs font-mono tracking-widest text-white/40 uppercase mb-2">BMI</p>
              <p className="text-3xl font-light tracking-widest text-teal-300">
                {userData.bmi || '--'}
              </p>
              <MetricInfo 
                explanation="Body Mass Index (BMI). A rough measure of body fat based on height and weight. Normal range is usually 18.5 to 24.9."
                comparisonLabel={averages ? `Avg ${userData.age}yo ${userData.gender}` : undefined}
                currentValue={userData.bmi}
                averageValue={averages?.bmi}
              />
            </div>
            <div className="p-6 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center text-center">
              <p className="text-xs font-mono tracking-widest text-white/40 uppercase mb-2">BMR</p>
              <p className="text-3xl font-light tracking-widest text-blue-300 flex items-baseline gap-1">
                {userData.bmr || '--'} <span className="text-sm text-white/40">kcal</span>
              </p>
              <MetricInfo 
                explanation="Basal Metabolic Rate (BMR). The number of calories your body needs to accomplish its most basic (basal) life-sustaining functions."
                comparisonLabel={averages ? `Avg ${userData.age}yo ${userData.gender}` : undefined}
                currentValue={userData.bmr}
                averageValue={averages?.bmr}
                unit="kcal"
              />
            </div>
            <div className="p-6 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center text-center">
              <p className="text-xs font-mono tracking-widest text-white/40 uppercase mb-2">TDEE</p>
              <p className="text-3xl font-light tracking-widest text-orange-300 flex items-baseline gap-1">
                {userData.tdee || '--'} <span className="text-sm text-white/40">kcal</span>
              </p>
              <MetricInfo 
                explanation="Total Daily Energy Expenditure (TDEE). The total calories you burn in a day when exercise and daily activity are taken into account."
                comparisonLabel={averages ? `Avg ${userData.age}yo ${userData.gender}` : undefined}
                currentValue={userData.tdee}
                averageValue={averages?.tdee}
                unit="kcal"
              />
            </div>
          </div>

          {/* Progress Chart */}
          <div className="p-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-mono tracking-widest uppercase text-white/60">Analytics</h3>
            </div>
            <div className="h-64 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightLogs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.2)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      domain={['dataMin - 2', 'dataMax + 2']} 
                      stroke="rgba(255,255,255,0.2)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '13px', padding: '12px' }}
                      itemStyle={{ color: '#a5b4fc' }}
                      formatter={(value: number) => [`${Number(value).toFixed(1)} kg`, 'Weight']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#818cf8" 
                      strokeWidth={4}
                      dot={{ r: 5, fill: '#1e1b4b', stroke: '#818cf8', strokeWidth: 2 }}
                      activeDot={{ r: 8, fill: '#818cf8', stroke: '#fff' }}
                    />
                  </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-8">
          
          {/* Weight Logging */}
          <div className="p-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl">
            <h3 className="text-xs font-mono tracking-widest uppercase text-white/60 mb-6">Log Weight</h3>
            <form onSubmit={handleWeightSubmit} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <input 
                  type="number" 
                  step="0.1"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  placeholder="Enter today's weight..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors shadow-inner w-full"
                />
                <button 
                  type="submit"
                  disabled={!newWeight}
                  className="px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg hover:shadow-indigo-500/20"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center justify-center gap-3 px-5 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer text-[11px] font-mono tracking-widest uppercase transition-all text-white/70 hover:text-white flex-1 shadow-inner text-center">
                  <Camera className="w-5 h-5 shrink-0" />
                  <span className="truncate">{progressPhoto ? 'Photo Selected' : 'Add Progress Photo'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleProgressPhotoChange} />
                </label>
                {progressPhoto && (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg">
                    <img src={progressPhoto} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setProgressPhoto(null)}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-black/90 backdrop-blur-md transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Adjust Goals Section */}
          <div className="p-8 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 backdrop-blur-2xl border border-indigo-500/20 rounded-[2rem] shadow-2xl flex flex-col items-center text-center gap-6 hover:from-indigo-500/20 hover:to-fuchsia-500/20 transition-all">
            <div>
              <h3 className="text-xl font-light tracking-widest uppercase text-white/90 mb-2">Adjust Your Goals</h3>
              <p className="text-xs font-mono tracking-widest text-white/50 uppercase leading-relaxed">Tweak targets, lifestyle, or retake the onboarding quiz.</p>
            </div>
            <button 
              onClick={() => setShowGoals(true)}
              className="w-full px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-mono text-xs tracking-widest uppercase transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-3"
            >
              <Settings className="w-5 h-5" /> Open Settings
            </button>
          </div>
          
          {/* Progress Photos Timeline & AI Analysis */}
          <div className="p-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-mono tracking-widest uppercase text-white/90">Progress Photos</h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] border border-indigo-500/30">
                    {weightLogs.filter(l => l.photo).length} Logged
                  </span>
                </div>
                <p className="text-[11px] text-white/40 font-light mt-0.5">Daily visual log & AI-assisted transformation analysis</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPhotoUploadModal(true)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl transition-all text-[10px] font-mono tracking-widest uppercase flex items-center gap-1.5 shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>+ Snap / Upload</span>
                </button>
                {weightLogs.filter(l => l.photo).length >= 2 ? (
                  <button
                    type="button"
                    onClick={() => setShowBeforeAfter(true)}
                    className="px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-90 text-white rounded-xl transition-all text-[10px] font-mono tracking-widest uppercase shadow-md flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Before vs. After AI</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-white/40 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    {weightLogs.filter(l => l.photo).length === 1 ? '1 more for AI analysis' : 'Upload 2+ photos to compare'}
                  </span>
                )}
              </div>
            </div>

            {/* Angle Filter Chips */}
            {weightLogs.some(l => l.photo) && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {(['All', 'Front', 'Side', 'Back', 'General'] as const).map((a) => {
                  const count = a === 'All' 
                    ? weightLogs.filter(l => l.photo).length 
                    : weightLogs.filter(l => l.photo && (l.angle === a || (!l.angle && a === 'Front'))).length;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAngleFilter(a)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                        angleFilter === a 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'bg-white/5 text-white/50 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      <span>{a}</span>
                      <span className="opacity-60 text-[9px]">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Photo Cards Grid / Carousel */}
            {weightLogs.some(l => l.photo) ? (
              <div className="flex overflow-x-auto gap-4 pb-3 -mx-2 px-2 snap-x scrollbar-hide">
                {weightLogs
                  .filter(l => l.photo && (angleFilter === 'All' || l.angle === angleFilter || (!l.angle && angleFilter === 'Front')))
                  .map((log, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedPhotoDetail(log)}
                      className="shrink-0 snap-center relative rounded-2xl overflow-hidden border border-white/10 w-36 h-48 bg-black/50 flex flex-col group shadow-md cursor-pointer hover:border-indigo-500/60 transition-all hover:scale-[1.02]"
                    >
                      <img 
                        src={log.photo} 
                        alt={`Progress on ${log.date}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent"></div>
                      
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[8px] font-mono uppercase tracking-wider text-white/90 border border-white/10">
                          {log.angle || 'Front'}
                        </span>
                      </div>

                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-col">
                        <span className="text-white font-mono text-[9px] tracking-widest uppercase mb-0.5 opacity-80">{log.date}</span>
                        <span className="text-white font-semibold tracking-wide text-xs">{Number(log.weight).toFixed(1)} kg</span>
                        {log.note && (
                          <p className="text-[9px] text-white/70 font-light truncate mt-0.5">{log.note}</p>
                        )}
                      </div>

                      <div className="absolute inset-0 bg-indigo-600/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <div className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-mono text-[9px] uppercase tracking-wider flex items-center gap-1">
                          <Eye className="w-3 h-3" /> View
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-8 px-4 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02] flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center text-white/60">
                  <Camera className="w-6 h-6 text-fuchsia-400" />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-white/80">No Progress Photos Logged Yet</p>
                  <p className="text-[11px] text-white/40 font-light mt-1 max-w-xs mx-auto">
                    Take your first daily photo. Uploading 2+ photos activates the AI-assisted Before vs. After comparison overlay!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPhotoUploadModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 rounded-xl text-white font-mono text-xs uppercase tracking-wider shadow-lg hover:opacity-90 transition-opacity"
                >
                  Snap First Photo
                </button>
              </div>
            )}
          </div>

          {/* Achievements */}
          <Achievements />

        </div>
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          userData={userData}
          setUserData={setUserData}
        />
      )}
      
      {showGoals && (
        <UpdateGoalsModal
          onClose={() => setShowGoals(false)}
          userData={userData}
          setUserData={setUserData}
        />
      )}
      
      {/* Detailed Photo Inspection & Actions Modal */}
      {selectedPhotoDetail && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setSelectedPhotoDetail(null)} />
          
          <div className="relative w-full max-w-lg bg-[#0F172A] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-white">Progress Check-in</h3>
                  <p className="text-[10px] font-mono text-white/50 tracking-wider">
                    {selectedPhotoDetail.date} · {selectedPhotoDetail.angle || 'Front'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPhotoDetail(null)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo View */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/80 max-h-96 flex items-center justify-center shadow-inner">
                <img 
                  src={selectedPhotoDetail.photo} 
                  alt={`Progress ${selectedPhotoDetail.date}`} 
                  className="w-full h-full object-contain max-h-96"
                />
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-white flex items-center gap-2">
                  <span className="text-teal-300 font-semibold">{Number(selectedPhotoDetail.weight).toFixed(1)} kg</span>
                  <span className="text-white/40">|</span>
                  <span className="text-fuchsia-300 uppercase text-[10px]">{selectedPhotoDetail.angle || 'Front'}</span>
                </div>
              </div>

              {/* Timestamp & Notes Details */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-white/60">
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <Calendar className="w-3.5 h-3.5" /> Date & Time
                  </span>
                  <span className="text-white/90">
                    {selectedPhotoDetail.timestamp ? format(new Date(selectedPhotoDetail.timestamp), 'PPpp') : selectedPhotoDetail.date}
                  </span>
                </div>
                {selectedPhotoDetail.note && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block mb-1">Check-in Note</span>
                    <p className="text-xs text-white/90 font-light leading-relaxed italic">
                      "{selectedPhotoDetail.note}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                {weightLogs.filter(l => l.photo).length >= 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhotoDetail(null);
                      setShowBeforeAfter(true);
                    }}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:opacity-90 rounded-xl text-white font-mono text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Compare in AI Tool</span>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(selectedPhotoDetail.rawDate || selectedPhotoDetail.date)}
                  className="py-3 px-4 bg-red-600/15 hover:bg-red-600/30 text-red-400 border border-red-500/20 rounded-xl font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Before & After Progress Comparison Modal with AI */}
      <BeforeAfterModal 
        isOpen={showBeforeAfter}
        onClose={() => setShowBeforeAfter(false)}
        logs={weightLogs.filter(l => l.photo)}
        userGoal={userData?.primaryGoal}
      />

      <PhotoUploadModal
        isOpen={showPhotoUploadModal}
        onClose={() => setShowPhotoUploadModal(false)}
        currentWeight={userData?.weight}
        onSuccess={(newLog) => {
          setWeightLogs(prev => {
            const dateStr = format(new Date(), 'MMM dd');
            const filtered = prev.filter(l => l.date !== dateStr);
            return [...filtered, {
              date: dateStr,
              rawDate: newLog.date,
              timestamp: new Date().toISOString(),
              weight: newLog.weight,
              photo: newLog.photo,
              angle: newLog.angle as any,
              note: newLog.note
            }];
          });
        }}
      />

      {/* Android & Pixel Companion Hub Modal */}
      <AndroidCompanionModal
        isOpen={showAndroidHub}
        onClose={() => setShowAndroidHub(false)}
        userData={userData}
        workoutComplete={false}
        todayPhotoLogged={weightLogs.some(l => l.date === format(new Date(), 'MMM dd') && l.photo)}
      />
    </div>
  );
}

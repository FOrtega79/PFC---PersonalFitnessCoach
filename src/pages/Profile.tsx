import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, getDocs, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Camera, Plus, X, Settings } from 'lucide-react';

import CalendarView from '../components/CalendarView';
import Achievements from '../components/Achievements';
import SettingsModal from '../components/SettingsModal';
import BeforeAfterModal from '../components/BeforeAfterModal';
import UpdateGoalsModal from '../components/UpdateGoalsModal';

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
        const logs = querySnapshot.docs.map(d => d.data());
        
        // If no logs, seed with initial weight
        if (logs.length === 0 && docSnap.exists()) {
          const initialLog = {
            date: format(new Date(docSnap.data().createdAt?.toDate() || new Date()), 'MMM dd'),
            weight: docSnap.data().weight,
            photo: null
          };
          setWeightLogs([initialLog]);
        } else {
          const formattedLogs = logs.map(l => ({
            date: format(new Date(l.date), 'MMM dd'),
            weight: l.weight,
            photo: l.photo || null
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
    const w = parseFloat(newWeight);
    
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
    
    // update current weight in user profile
    await setDoc(doc(db, 'users', user.uid), { weight: w }, { merge: true });
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

  return (
    <div className="flex flex-col flex-1 text-white p-6 relative z-20 max-w-2xl mx-auto w-full pb-24">
      <header className="mb-8 pt-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-light tracking-widest uppercase text-white/90 mb-1">
            Dashboard
          </h1>
          <p className="text-white/50 font-mono text-sm tracking-widest uppercase">
            Your Progress
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-light text-2xl text-indigo-300">{user?.displayName?.charAt(0) || 'U'}</span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-6 h-6 bg-fuchsia-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-fuchsia-500 transition-colors">
              <Camera className="w-3 h-3 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-6">
        
        {/* Metrics Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase mb-2">Current Weight</p>
            <p className="text-3xl font-light tracking-widest text-indigo-300">
              {weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : userData.weight} <span className="text-sm text-white/40">kg</span>
            </p>
          </div>
          <div 
            className="p-5 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center transition-colors group relative"
          >
            <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase mb-2">Daily Target</p>
            <p className="text-3xl font-light tracking-widest text-fuchsia-300">
              {Math.round(userData.targetDailyCalories || userData.tdee)} <span className="text-sm text-white/40">kcal</span>
            </p>
          </div>
        </div>

        {/* Adjust Goals Section */}
        <div className="p-6 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 backdrop-blur-xl border border-indigo-500/20 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-light tracking-widest uppercase text-white/90 mb-1">Adjust Your Goals</h3>
            <p className="text-xs font-mono tracking-widest text-white/50 uppercase">Tweak targets, lifestyle, or retake the onboarding quiz.</p>
          </div>
          <button 
            onClick={() => setShowGoals(true)}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-mono text-xs tracking-widest uppercase transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" /> Open Settings
          </button>
        </div>

        {/* Weight Logging */}
        <div className="p-6 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
          <h3 className="text-xs font-mono tracking-widest uppercase text-white/60 mb-4">Log Weight</h3>
          <form onSubmit={handleWeightSubmit} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <input 
                type="number" 
                step="0.1"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                placeholder="Enter today's weight..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button 
                type="submit"
                disabled={!newWeight}
                className="px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer text-[10px] font-mono tracking-widest uppercase transition-colors text-white/70 hover:text-white flex-1">
                <Camera className="w-4 h-4" />
                {progressPhoto ? 'Photo Selected' : 'Add Progress Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleProgressPhotoChange} />
              </label>
              {progressPhoto && (
                <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-white/10 shrink-0">
                  <img src={progressPhoto} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setProgressPhoto(null)}
                    className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5 hover:bg-black/80 backdrop-blur-md"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Progress Chart */}
        <div className="p-6 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-mono tracking-widest uppercase text-white/60">Analytics</h3>
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              <button 
                onClick={() => setActiveChartTab('weight')}
                className={`px-3 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest transition-colors ${activeChartTab === 'weight' ? 'bg-indigo-600 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
              >
                Weight
              </button>
              <button 
                onClick={() => setActiveChartTab('activity')}
                className={`px-3 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest transition-colors ${activeChartTab === 'activity' ? 'bg-indigo-600 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
              >
                Activity
              </button>
            </div>
          </div>
          <div className="h-48 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'weight' ? (
                <LineChart data={weightLogs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.2)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    domain={['dataMin - 2', 'dataMax + 2']} 
                    stroke="rgba(255,255,255,0.2)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#a5b4fc' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#818cf8" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#1e1b4b', stroke: '#818cf8', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#818cf8', stroke: '#fff' }}
                  />
                </LineChart>
              ) : (
                <BarChart data={workoutLogs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.2)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.2)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#a5b4fc' }}
                  />
                  <Bar 
                    dataKey="exercises" 
                    fill="#818cf8" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progress Photos Timeline */}
        {weightLogs.some(l => l.photo) && (
          <div className="p-6 bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-mono tracking-widest uppercase text-white/60">Progress Timeline</h3>
              {weightLogs.filter(l => l.photo).length >= 2 && (
                <button
                  onClick={() => setShowBeforeAfter(true)}
                  className="px-3 py-1 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-full hover:bg-indigo-600/30 transition-colors text-[10px] font-mono tracking-widest uppercase"
                >
                  Compare
                </button>
              )}
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-2 px-2 snap-x scrollbar-hide">
              {weightLogs.filter(l => l.photo).map((log, idx) => (
                <div key={idx} className="shrink-0 snap-center relative rounded-2xl overflow-hidden border border-white/10 w-36 h-48 bg-black/50 flex flex-col group">
                  <img src={log.photo} alt={`Progress on ${log.date}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 flex flex-col">
                    <span className="text-white font-mono text-[10px] tracking-widest uppercase mb-1 opacity-80">{log.date}</span>
                    <span className="text-white font-light tracking-wider text-sm">{log.weight} kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workout Calendar */}
        <CalendarView />

        {/* Achievements */}
        <Achievements />

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
      
      <BeforeAfterModal 
        isOpen={showBeforeAfter}
        onClose={() => setShowBeforeAfter(false)}
        logs={weightLogs}
      />
    </div>
  );
}

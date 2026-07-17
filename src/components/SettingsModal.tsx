import { X, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface SettingsModalProps {
  onClose: () => void;
  userData: any;
  setUserData: (data: any) => void;
}

export default function SettingsModal({ onClose, userData, setUserData }: SettingsModalProps) {
  const [restTime, setRestTime] = useState(userData?.defaultRestTime || 60);
  const [reminderEnabled, setReminderEnabled] = useState(userData?.reminderEnabled ?? true);
  const [reminderTime, setReminderTime] = useState(userData?.reminderTime || '18:00');
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setPermissionStatus(perm);
      if (perm === 'granted') {
        setReminderEnabled(true);
      }
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        defaultRestTime: restTime,
        reminderEnabled,
        reminderTime
      }, { merge: true });
      setUserData({ ...userData, defaultRestTime: restTime, reminderEnabled, reminderTime });
      onClose();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-end sm:justify-center">
      <div className="bg-[#1e1b4b] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-light tracking-widest text-white uppercase">Settings</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Rest Time */}
          <div className="space-y-3">
            <label className="text-xs font-mono tracking-widest uppercase text-white/60">Default Rest Time</label>
            <div className="grid grid-cols-3 gap-3">
              {[30, 60, 90].map((t) => (
                <button
                  key={t}
                  onClick={() => setRestTime(t)}
                  className={`py-3 rounded-xl font-mono text-sm tracking-widest transition-colors ${
                    restTime === t 
                     ? 'bg-indigo-600 text-white shadow-lg' 
                     : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {t}s
                </button>
              ))}
            </div>
            <p className="text-[10px] text-white/40 font-mono mt-2">Rest duration between sets in Workout Mode.</p>
          </div>

          {/* Workout Reminder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono tracking-widest uppercase text-white/60 flex items-center gap-2">
                <Bell className="w-4 h-4" /> Daily Workout Reminder
              </label>
              <button
                onClick={() => {
                  if (!reminderEnabled && permissionStatus !== 'granted') {
                    requestPermission();
                  } else {
                    setReminderEnabled(!reminderEnabled);
                  }
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${reminderEnabled ? 'bg-indigo-600' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${reminderEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            
            {reminderEnabled && (
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                <span className="text-sm text-white/80 font-light">Remind me at</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
            
            {permissionStatus === 'denied' && reminderEnabled && (
              <p className="text-[10px] text-red-400 font-mono mt-2 bg-red-400/10 p-2 rounded">
                Notifications are blocked by your browser. Please enable them in site settings.
              </p>
            )}
            <p className="text-[10px] text-white/40 font-mono mt-2">Get notified locally if you haven't logged your workout.</p>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-mono text-sm tracking-widest uppercase hover:opacity-90 disabled:opacity-50 transition-opacity mt-4 shadow-xl"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

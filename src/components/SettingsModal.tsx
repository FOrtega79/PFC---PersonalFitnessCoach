import { X, Bell, Camera, Send, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { sendAppNotification, updateAppBadge } from '../lib/notifications';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  onClose: () => void;
  userData: any;
  setUserData: (data: any) => void;
}

export default function SettingsModal({ onClose, userData, setUserData }: SettingsModalProps) {
  const [restTime, setRestTime] = useState(userData?.defaultRestTime || 60);
  const [reminderEnabled, setReminderEnabled] = useState(userData?.reminderEnabled ?? true);
  const [reminderTime, setReminderTime] = useState(userData?.reminderTime || '18:00');
  const [photoReminderEnabled, setPhotoReminderEnabled] = useState(userData?.photoReminderEnabled ?? true);
  const [photoReminderTime, setPhotoReminderTime] = useState(userData?.photoReminderTime || '09:00');
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
        toast.success('Notifications enabled!');
      } else {
        toast.error('Notifications not granted');
      }
    }
  };

  const testPhotoNotification = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser');
      return;
    }
    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      setPermissionStatus(perm);
      if (perm !== 'granted') {
        toast.error('Please allow notification permission in your browser');
        return;
      }
    }
    const success = await sendAppNotification('📸 Daily Progress Snap', {
      body: "Keep your visual transformation on track! Snap today's progress photo.",
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'test-photo-snap',
    });
    if (success) {
      await updateAppBadge(1);
      toast.success('Test notification sent to your system tray!');
    } else {
      toast.error('Could not dispatch notification.');
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        defaultRestTime: restTime,
        reminderEnabled,
        reminderTime,
        photoReminderEnabled,
        photoReminderTime
      }, { merge: true });
      setUserData({ 
        ...userData, 
        defaultRestTime: restTime, 
        reminderEnabled, 
        reminderTime,
        photoReminderEnabled,
        photoReminderTime
      });
      toast.success('Settings saved successfully');
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save settings');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1b4b] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-light tracking-widest text-white uppercase">Settings</h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
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
            <p className="text-[10px] text-white/40 font-mono mt-1">Rest duration between sets in Workout Mode.</p>
          </div>

          {/* Daily Photo Reminder */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono tracking-widest uppercase text-white/80 flex items-center gap-2">
                <Camera className="w-4 h-4 text-fuchsia-400" /> Daily Photo Reminder
              </label>
              <button
                onClick={() => {
                  if (!photoReminderEnabled && permissionStatus !== 'granted') {
                    requestPermission();
                  }
                  setPhotoReminderEnabled(!photoReminderEnabled);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${photoReminderEnabled ? 'bg-fuchsia-600' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${photoReminderEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            
            {photoReminderEnabled && (
              <div className="flex items-center justify-between bg-white/5 p-3.5 rounded-xl border border-white/5">
                <span className="text-xs text-white/80 font-light">Photo Check-in at</span>
                <input
                  type="time"
                  value={photoReminderTime}
                  onChange={(e) => setPhotoReminderTime(e.target.value)}
                  className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-fuchsia-500"
                />
              </div>
            )}
            <p className="text-[10px] text-white/40 font-mono">Reminds you daily to capture your progress photo.</p>
          </div>

          {/* Workout Reminder */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono tracking-widest uppercase text-white/80 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" /> Daily Workout Reminder
              </label>
              <button
                onClick={() => {
                  if (!reminderEnabled && permissionStatus !== 'granted') {
                    requestPermission();
                  }
                  setReminderEnabled(!reminderEnabled);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${reminderEnabled ? 'bg-indigo-600' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${reminderEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            
            {reminderEnabled && (
              <div className="flex items-center justify-between bg-white/5 p-3.5 rounded-xl border border-white/5">
                <span className="text-xs text-white/80 font-light">Workout Check-in at</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
            <p className="text-[10px] text-white/40 font-mono">Reminds you if today's workout hasn't been completed.</p>
          </div>

          {/* Notification Permission status / Test button */}
          <div className="pt-2">
            {permissionStatus === 'denied' ? (
              <p className="text-[11px] text-red-300 font-mono bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                ⚠️ Notifications are blocked in your browser. Please allow notifications in site permissions.
              </p>
            ) : (
              <button
                type="button"
                onClick={testPhotoNotification}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-3.5 h-3.5" /> Test Notification
              </button>
            )}
          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-mono text-sm tracking-widest uppercase hover:opacity-90 disabled:opacity-50 transition-opacity mt-4 shadow-xl flex items-center justify-center gap-2"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

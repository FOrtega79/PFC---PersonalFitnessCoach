import React, { useState } from 'react';
import { 
  Smartphone, 
  Bell, 
  LayoutGrid, 
  Download, 
  CheckCircle2, 
  X, 
  Zap, 
  Flame, 
  Droplets, 
  Camera, 
  Sparkles, 
  HelpCircle,
  Dumbbell,
  Copy,
  Terminal,
  Check,
  RefreshCw,
  Layers
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { sendAppNotification, requestNotificationPermission, updateAppBadge } from '../lib/notifications';
import toast from 'react-hot-toast';

interface AndroidCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData?: any;
  workoutComplete?: boolean;
  todayPhotoLogged?: boolean;
}

export default function AndroidCompanionModal({
  isOpen,
  onClose,
  userData,
  workoutComplete = false,
  todayPhotoLogged = false
}: AndroidCompanionModalProps) {
  const { isInstallable, isInstalled, install, isAndroid } = usePWAInstall();
  const [notificationPerm, setNotificationPerm] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [testingNotification, setTestingNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'shortcuts' | 'widget' | 'guide'>('widget');
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [syncingWidget, setSyncingWidget] = useState(false);

  if (!isOpen) return null;

  const handleRequestNotifications = async () => {
    try {
      const perm = await requestNotificationPermission();
      setNotificationPerm(perm);
      if (perm === 'granted') {
        toast.success('Notifications enabled on Pixel!');
        await sendAppNotification('FitCoach Notifications Active! 🚀', {
          body: 'You will receive timely workout prompts and photo check-in reminders on your Pixel.',
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'welcome-notification'
        });
        await updateAppBadge(1);
      } else {
        toast.error('Notification permission was not granted.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not request notifications.');
    }
  };

  const handleTestNotification = async () => {
    setTestingNotification(true);
    try {
      if (notificationPerm !== 'granted') {
        const perm = await requestNotificationPermission();
        setNotificationPerm(perm);
        if (perm !== 'granted') {
          toast.error('Please allow notifications first.');
          setTestingNotification(false);
          return;
        }
      }

      const sent = await sendAppNotification('Pixel 11 Pro XL Fitness Alert! 💪', {
        body: 'Keep the momentum going: 450 kcal burned today. Tap to check your daily routine!',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'pixel-test-alert',
      });

      if (sent) {
        toast.success('Push notification sent to your system tray!');
        await updateAppBadge(1);
      } else {
        toast.error('Notification dispatch failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error sending test notification.');
    } finally {
      setTestingNotification(false);
    }
  };

  const handleCopyBuildCommand = () => {
    navigator.clipboard.writeText('npx cap sync android && npx cap open android');
    setCopiedCommand(true);
    toast.success('Build command copied to clipboard!');
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const handleSimulateWidgetSync = () => {
    setSyncingWidget(true);
    setTimeout(() => {
      setSyncingWidget(false);
      toast.success('Pixel 4×2 Widget synced with latest stats!');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#0F172A] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-fuchsia-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-mono uppercase tracking-wider text-white">Pixel & Android Hub</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] border border-emerald-500/30">
                  Android Ready
                </span>
              </div>
              <p className="text-[10px] font-mono text-white/50 tracking-wider">
                Pixel 11 Pro XL Native Integration
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 bg-white/[0.02] p-1.5 gap-1 text-[11px] font-mono uppercase tracking-wider overflow-x-auto">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'status' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Install & Push</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'shortcuts' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Widgets & Shortcuts</span>
          </button>
          <button
            onClick={() => setActiveTab('widget')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'widget' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>At-a-Glance</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Device & Status Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-mono text-white/40 uppercase block mb-1">Target Device</span>
                  <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" /> Google Pixel
                  </span>
                  <span className="text-[9px] font-mono text-white/50 block mt-1">
                    {isAndroid ? 'Android Detected' : 'Optimized for Android'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-mono text-white/40 uppercase block mb-1">App Mode</span>
                  <span className={`text-xs font-semibold flex items-center gap-1.5 ${isInstalled ? 'text-emerald-400' : 'text-amber-300'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> {isInstalled ? 'Installed WebAPK' : 'Browser Mode'}
                  </span>
                  <span className="text-[9px] font-mono text-white/50 block mt-1">
                    {isInstalled ? 'Running Standalone' : 'Ready to Install'}
                  </span>
                </div>
              </div>

              {/* Install Action Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900/30 via-slate-800/40 to-fuchsia-900/20 border border-indigo-500/20 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-white font-semibold flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      Install FitCoach on Pixel
                    </h4>
                    <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                      Installs via Google Chrome WebAPK. Adds an icon to your Pixel App Drawer, full-screen standalone layout without browser address bars, and adaptive squircle icons.
                    </p>
                  </div>
                </div>

                {isInstalled ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>App is installed and running in native standalone mode on your device.</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      onClick={() => install()}
                      disabled={!isInstallable}
                      className={`flex-1 py-3 px-4 rounded-xl font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                        isInstallable
                          ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:opacity-90 text-white'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      <span>{isInstallable ? 'Install App Now' : 'Prompt Pending in Chrome'}</span>
                    </button>
                    {!isInstallable && (
                      <button
                        onClick={() => setActiveTab('guide')}
                        className="py-3 px-4 rounded-xl font-mono text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Manual 1-Tap Steps</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Push Notifications Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-white font-semibold flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-fuchsia-400" />
                    Android Push Notifications
                  </h4>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                    notificationPerm === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {notificationPerm === 'granted' ? 'Allowed' : 'Requires Permission'}
                  </span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Sends scheduled notifications to your Pixel lock screen & notification shade with custom sound, vibration patterns, and app icon badges.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  {notificationPerm !== 'granted' ? (
                    <button
                      onClick={handleRequestNotifications}
                      className="flex-1 py-2.5 px-4 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl font-mono text-xs uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Allow Notifications</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleTestNotification}
                      disabled={testingNotification}
                      className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-mono text-xs uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{testingNotification ? 'Sending Push...' : 'Send Test Notification to Pixel'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
                <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-semibold mb-1">
                  How Pixel App Shortcuts Work
                </h4>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  On your Google Pixel, <strong>long-press the FitCoach app icon</strong> on the home screen or in your app drawer. A popup menu appears with these 4 instant shortcuts. You can even <strong>drag any shortcut directly onto your home screen as a 1x1 quick widget</strong>!
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-white block">Quick Workout</span>
                    <span className="text-[10px] text-white/50 font-mono block truncate">Direct 1-tap jump to exercises & routine timer</span>
                  </div>
                  <span className="text-[9px] font-mono text-indigo-300 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                    /exercises
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center shrink-0 border border-fuchsia-500/30">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-white block">Snap Progress Photo</span>
                    <span className="text-[10px] text-white/50 font-mono block truncate">Launches daily camera physique log directly</span>
                  </div>
                  <span className="text-[9px] font-mono text-fuchsia-300 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                    /?action=snap-photo
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-white block">AI Fitness Coach</span>
                    <span className="text-[10px] text-white/50 font-mono block truncate">Opens interactive Gemini AI workout & nutrition assistant</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-300 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                    /?action=ai-coach
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-white block">Profile & Progress</span>
                    <span className="text-[10px] text-white/50 font-mono block truncate">Weight timeline & AI Before vs. After comparison</span>
                  </div>
                  <span className="text-[9px] font-mono text-purple-300 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                    /profile
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'widget' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-white/90 font-semibold mb-0.5">
                    Pixel 4×2 At-a-Glance Widget
                  </h4>
                  <p className="text-[11px] text-white/50">
                    Live home screen widget design with 1-tap deep links
                  </p>
                </div>

                <button
                  onClick={handleSimulateWidgetSync}
                  disabled={syncingWidget}
                  className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-indigo-300 flex items-center gap-1.5 transition-all"
                  title="Simulate updating widget data on Pixel"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingWidget ? 'animate-spin text-indigo-400' : ''}`} />
                  <span>{syncingWidget ? 'Syncing...' : 'Sync Widget'}</span>
                </button>
              </div>

              {/* Simulated Pixel Widget Card */}
              <div className="p-4 rounded-3xl bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-2xl space-y-3.5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                
                {/* Header line */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-mono font-semibold tracking-wider text-white">FITCOACH · TODAY</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    LIVE
                  </span>
                </div>

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-center transition-all hover:bg-white/10">
                    <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                    <span className="text-[9px] font-mono text-white/40 uppercase block">Workout</span>
                    <span className={`text-xs font-semibold ${workoutComplete ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {workoutComplete ? 'Done' : 'Pending'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-center transition-all hover:bg-white/10">
                    <Camera className="w-4 h-4 text-fuchsia-400 mx-auto mb-1" />
                    <span className="text-[9px] font-mono text-white/40 uppercase block">Daily Photo</span>
                    <span className={`text-xs font-semibold ${todayPhotoLogged ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {todayPhotoLogged ? 'Logged' : 'Pending'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-center transition-all hover:bg-white/10">
                    <Droplets className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <span className="text-[9px] font-mono text-white/40 uppercase block">Daily Goal</span>
                    <span className="text-xs font-semibold text-blue-300 truncate block">
                      {userData?.targetWeight ? `${userData.targetWeight} kg` : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Motivation footer */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/60">
                  <span>Streak: <strong>{userData?.streak || 1} Days 🔥</strong></span>
                  <span className="text-indigo-400 font-semibold">Pixel 11 Pro XL</span>
                </div>
              </div>

              {/* Native Android Project Files Status */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-indigo-300 font-semibold">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Native 4×2 Widget Source Files Ready</span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  The complete native Android widget files have been scaffolded in your project:
                </p>
                <div className="grid grid-cols-1 gap-1.5 text-[10px] font-mono">
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between">
                    <span className="text-white/80">android/.../layout/widget_at_a_glance.xml</span>
                    <span className="text-emerald-400 font-bold">4×2 Layout</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between">
                    <span className="text-white/80">android/.../FitCoachWidgetProvider.kt</span>
                    <span className="text-indigo-400 font-bold">Kotlin Receiver</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between">
                    <span className="text-white/80">android/.../xml/widget_at_a_glance_info.xml</span>
                    <span className="text-blue-400 font-bold">Provider Info</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between">
                    <span className="text-white/80">capacitor.config.ts & AndroidManifest.xml</span>
                    <span className="text-purple-400 font-bold">Configured</span>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Instructions to Install on Device */}
              <div className="space-y-3">
                <h5 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                  Steps to Add to Your Pixel 11 Pro XL
                </h5>

                <div className="space-y-2 text-xs">
                  {/* Step 1 */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-[10px] flex items-center justify-center font-mono">1</span>
                        Export to GitHub
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60">
                      In AI Studio, click the <strong>Export</strong> button (top right) and choose <strong>Save to GitHub</strong> to push this repository to your account.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-[10px] flex items-center justify-center font-mono">2</span>
                      Run Cloud Build via GitHub Actions
                    </span>
                    <p className="text-[11px] text-white/60">
                      Open your new GitHub repository, navigate to the <strong>Actions</strong> tab, and click <strong>Run workflow</strong> under "Build Android APK". GitHub will compile the APK for you in the cloud!
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-[10px] flex items-center justify-center font-mono">3</span>
                      Download & Place Widget
                    </span>
                    <ol className="text-[11px] text-white/60 list-decimal pl-4 space-y-1">
                      <li>Download the <code>fitcoach-android-apk</code> artifact from the Actions run on your Pixel.</li>
                      <li>Install the APK file.</li>
                      <li>Touch and hold any empty area on your Pixel home screen wallpaper.</li>
                      <li>Tap <strong>Widgets</strong> in the pop-up menu, scroll down to <strong>FitCoach</strong>, and drag the 4×2 widget to your screen!</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs text-white/80 font-light leading-relaxed">
              <h4 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                How to install on Google Pixel:
              </h4>
              <ol className="space-y-2.5 list-decimal pl-4">
                <li>
                  Open this application in <strong>Google Chrome</strong> on your Pixel.
                </li>
                <li>
                  Tap the <strong>three dots menu (⋮)</strong> at the top right of Chrome.
                </li>
                <li>
                  Tap <strong>"Install app"</strong> (or <strong>"Add to Home screen"</strong>).
                </li>
                <li>
                  Confirm the prompt. Chrome and Android's <strong>WebAPK system</strong> will package and install the app seamlessly.
                </li>
                <li>
                  FitCoach will now appear in your app drawer alongside your other native apps with a high-res icon, full-screen UI, and lock-screen notification support!
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/40">FitCoach PWA · Android Edition</span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

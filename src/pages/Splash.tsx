import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { Activity } from 'lucide-react';
import { motion } from 'motion/react';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRoute = async () => {
      // Minimum 2-second splash screen
      const minSplashTime = new Promise((resolve) => setTimeout(resolve, 2000));
      
      let initialUser = auth.currentUser;
      const authResolve = new Promise<void>((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          initialUser = user;
          unsubscribe();
          resolve();
        });
      });

      await Promise.all([minSplashTime, authResolve]);

      if (initialUser) {
        navigate('/home', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    };

    checkAuthAndRoute();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 text-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center gap-12 z-20"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
          <div className="w-32 h-32 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.3)] relative z-10">
            <Activity className="w-16 h-16 text-white" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-5xl font-light tracking-[0.2em] uppercase text-white/90">Coach PWA</h1>
          <div className="h-1 w-12 bg-indigo-500 mx-auto mt-4 rounded-full"></div>
          <p className="text-white/50 font-mono text-sm tracking-widest uppercase mt-6">Your personal health journey</p>
        </div>
        <div className="w-64 space-y-4">
          <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 h-full w-3/4 bg-gradient-to-r from-indigo-600 via-blue-400 to-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.6)] animate-pulse"></div>
          </div>
          <div className="flex justify-between font-mono text-[10px] tracking-widest uppercase text-white/40">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></span>
              <span>Authenticating...</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

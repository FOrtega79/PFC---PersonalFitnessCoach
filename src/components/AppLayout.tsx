import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useOutlet } from 'react-router-dom';
import { Home, Dumbbell, User, WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function AppLayout() {
  const location = useLocation();
  const currentOutlet = useOutlet();
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex flex-col flex-1 h-full max-w-md mx-auto w-full relative z-20 overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute inset-0 overflow-y-auto pb-20 no-scrollbar"
          >
            {currentOutlet}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="fixed bottom-0 inset-x-0 max-w-md mx-auto h-20 bg-[#0F172A]/80 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-around px-6 pb-safe">
        <NavItem to="/home" icon={<Home className="w-6 h-6" />} label="Home" />
        <NavItem to="/exercises" icon={<Dumbbell className="w-6 h-6" />} label="Exercises" />
        <NavItem to="/profile" icon={<User className="w-6 h-6" />} label="Profile" />
        
        {isOffline && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest flex items-center gap-2 border border-red-500/30 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Offline
          </div>
        )}
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
          isActive 
            ? 'text-indigo-400 bg-indigo-500/10' 
            : 'text-white/40 hover:text-white/70 hover:bg-white/5'
        }`
      }
    >
      {icon}
      <span className="text-[10px] font-mono tracking-widest uppercase">{label}</span>
    </NavLink>
  );
}

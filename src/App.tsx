/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Exercises from './pages/Exercises';
import Profile from './pages/Profile';
import AppLayout from './components/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useWorkoutReminder } from './hooks/useWorkoutReminder';
import { PaywallProvider } from './components/PaywallProvider';
import { Toaster } from 'react-hot-toast';

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full h-full flex flex-col flex-1"
    >
      {children}
    </motion.div>
  );
}

function MainRoutes() {
  const location = useLocation();
  const isTab = location.pathname === '/home' || location.pathname === '/exercises' || location.pathname === '/profile';
  const routeKey = isTab ? 'tabs' : location.pathname;

  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore */}
      <Routes location={location} key={routeKey}>
        <Route path="/" element={<PageTransition><Splash /></PageTransition>} />
        <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
        <Route element={<PageTransition><AppLayout /></PageTransition>}>
          <Route path="/home" element={<Home />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  useWorkoutReminder();

  return (
    <PaywallProvider>
      <HashRouter>
      <div className="h-[100dvh] w-full bg-[#030712] text-white flex justify-center overflow-hidden font-sans">
        <div className="w-full max-w-[480px] h-full bg-[#0F172A] relative flex flex-col shadow-2xl overflow-hidden border-x border-white/5">
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1e1b4b',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
                fontFamily: 'monospace',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              },
              success: {
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#1e1b4b',
                },
              },
            }}
          />
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/40 rounded-full blur-[140px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-fuchsia-900/30 rounded-full blur-[140px]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-900/10 rounded-full blur-[160px]"></div>
          </div>
          <div className="relative z-10 flex flex-col flex-1 w-full h-full">
            <ErrorBoundary>
              <MainRoutes />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </HashRouter>
    </PaywallProvider>
  );
}

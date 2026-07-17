/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Exercises from './pages/Exercises';
import Profile from './pages/Profile';
import AppLayout from './components/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useWorkoutReminder } from './hooks/useWorkoutReminder';
import { PaywallProvider } from './components/PaywallProvider';
import BiometricLock from './components/BiometricLock';

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

  useEffect(() => {
    const initStatusBar = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          // Background color applies to Android, iOS usually needs it via config or is transparent based on view
          await StatusBar.setBackgroundColor({ color: '#0F172A' });
        } catch (e) {
          console.warn('Error setting status bar:', e);
        }
      }
    };
    initStatusBar();
  }, []);

  return (
    <BiometricLock>
      <PaywallProvider>
        <BrowserRouter>
        <div className="h-[100dvh] w-full bg-[#0F172A] text-white flex flex-col relative overflow-hidden font-sans">
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
      </BrowserRouter>
      </PaywallProvider>
    </BiometricLock>
  );
}

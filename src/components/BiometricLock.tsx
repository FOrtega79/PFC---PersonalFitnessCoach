import React, { useState, useEffect } from 'react';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';
import { Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface BiometricLockProps {
  children: React.ReactNode;
}

export default function BiometricLock({ children }: BiometricLockProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkBiometric() {
      if (!Capacitor.isNativePlatform()) {
        setIsUnlocked(true);
        setHasChecked(true);
        return;
      }
      
      try {
        const result = await NativeBiometric.isAvailable();
        if (result.isAvailable) {
          setIsSupported(true);
          performAuth();
        } else {
          setIsUnlocked(true); // Fallback if not supported
        }
      } catch (err) {
        console.warn('Biometric check failed:', err);
        setIsUnlocked(true);
      } finally {
        setHasChecked(true);
      }
    }
    
    checkBiometric();
  }, []);

  const performAuth = async () => {
    try {
      const authResult = await NativeBiometric.verifyIdentity({
        reason: 'Authenticate to access your fitness profile',
        title: 'Unlock FitCoach',
        subtitle: 'Secure your progress',
        description: 'Use Face ID / Touch ID to unlock',
      });
      setIsUnlocked(true);
    } catch (err: any) {
      setError('Authentication failed. Please try again.');
      console.warn('Biometric auth failed:', err);
    }
  };

  if (!hasChecked) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isUnlocked && isSupported) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-white text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6"
        >
          <Lock className="w-10 h-10 text-indigo-400" />
        </motion.div>
        
        <h1 className="text-2xl font-light tracking-widest uppercase mb-2">App Locked</h1>
        <p className="text-white/50 font-mono text-sm tracking-widest mb-8">Secure your fitness journey</p>
        
        {error && <p className="text-red-400 text-xs font-mono uppercase tracking-widest mb-6">{error}</p>}
        
        <button 
          onClick={performAuth}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-mono text-xs tracking-widest uppercase transition-colors shadow-lg"
        >
          Unlock with FaceID / TouchID
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

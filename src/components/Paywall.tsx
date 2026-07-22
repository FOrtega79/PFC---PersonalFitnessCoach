import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Check, Lock, Sparkles, Star, Zap, Apple } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface PaywallProps {
  onClose: () => void;
  onSubscribe: () => void;
}

export default function Paywall({ onClose, onSubscribe }: PaywallProps) {
  const [showClose, setShowClose] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowClose(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[999] flex flex-col bg-[#0F172A] text-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="relative flex-1 flex flex-col p-6 pb-safe">
        {showClose && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-8">
          <div className="w-20 h-20 bg-gradient-to-br from-fuchsia-500 to-indigo-500 rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(168,85,247,0.4)]">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Unlock Pro Mode</h2>
          <p className="text-white/60 mb-8 font-light max-w-xs mx-auto">Get the most out of your fitness journey with unlimited access to premium features.</p>
          
          <div className="w-full max-w-sm space-y-4 mb-8">
            <div className="flex items-center gap-4 text-left bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="p-2 bg-indigo-500/20 rounded-xl shrink-0"><Star className="w-5 h-5 text-indigo-400" /></div>
              <div>
                <p className="font-bold text-sm">Personalized AI Coach</p>
                <p className="text-xs text-white/50 font-light">Unlimited daily tips & motivation</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-left bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="p-2 bg-fuchsia-500/20 rounded-xl shrink-0"><Zap className="w-5 h-5 text-fuchsia-400" /></div>
              <div>
                <p className="font-bold text-sm">Smart Calorie Tracking</p>
                <p className="text-xs text-white/50 font-light">AI-powered macro breakdowns</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-left bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="p-2 bg-blue-500/20 rounded-xl shrink-0"><Lock className="w-5 h-5 text-blue-400" /></div>
              <div>
                <p className="font-bold text-sm">Full Exercise Library</p>
                <p className="text-xs text-white/50 font-light">Unlock all video tutorials</p>
              </div>
            </div>
          </div>
          
          <div className="w-full max-w-sm grid grid-cols-2 gap-4 mb-8">
            <button 
              onClick={() => setSelectedTier('monthly')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center ${selectedTier === 'monthly' ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-white/10 bg-white/5 opacity-70 hover:opacity-100'}`}
            >
              <span className="text-xs font-mono uppercase tracking-widest text-white/50 mb-1">Monthly</span>
              <span className="text-2xl font-bold">$2.99</span>
              <span className="text-[10px] text-white/40 mt-1">per month</span>
            </button>
            <button 
              onClick={() => setSelectedTier('yearly')}
              className={`p-4 rounded-2xl border-2 relative transition-all flex flex-col items-center ${selectedTier === 'yearly' ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-white/10 bg-white/5 opacity-70 hover:opacity-100'}`}
            >
              <div className="absolute -top-3 inset-x-0 flex justify-center">
                <span className="bg-fuchsia-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">Save 16%</span>
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-white/50 mb-1">Yearly</span>
              <span className="text-2xl font-bold">$29.99</span>
              <span className="text-[10px] text-white/40 mt-1">per year</span>
            </button>
          </div>
          
          <button 
            onClick={onSubscribe}
            className="w-full max-w-sm bg-white text-black font-bold py-4 rounded-2xl text-lg hover:bg-gray-100 transition-colors shadow-xl shadow-white/10 mb-6 flex items-center justify-center gap-2"
          >
            <Apple className="w-5 h-5" />
            Subscribe with Apple
          </button>
          
          <div className="flex gap-4 text-[10px] text-white/40 font-mono mb-4">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <span>&bull;</span>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>&bull;</span>
            <button onClick={() => {}} className="hover:text-white transition-colors">Restore Purchases</button>
          </div>
        </div>
      </div>
    </div>
  );
}

cat << 'INNER_EOF' > src/components/PaywallProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import Paywall from './Paywall';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface PaywallContextType {
  isPro: boolean;
  showPaywall: () => void;
}

const PaywallContext = createContext<PaywallContextType>({ isPro: true, showPaywall: () => {} });

export function usePaywall() {
  return useContext(PaywallContext);
}

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const [shouldTriggerPaywall, setShouldTriggerPaywall] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsPro(data.isPro || false);
          
          if (!data.isPro) {
            let currentLoginDays = data.loginDays || 1;
            const lastLogin = data.lastLogin ? data.lastLogin.toDate() : (data.createdAt ? data.createdAt.toDate() : new Date());
            const now = new Date();
            
            // Check if it's a new calendar day
            const isNewDay = lastLogin.getDate() !== now.getDate() || 
                             lastLogin.getMonth() !== now.getMonth() || 
                             lastLogin.getFullYear() !== now.getFullYear();
                             
            if (isNewDay) {
              currentLoginDays += 1;
              await setDoc(docRef, { 
                loginDays: currentLoginDays,
                lastLogin: serverTimestamp()
              }, { merge: true });
            }
            
            // Trigger after the second day login (i.e. loginDays >= 2)
            // But if the user is testing we can just trigger it if loginDays >= 2 or if they want to test it easily we can just trigger it.
            // Let's trigger if loginDays > 1
            if (currentLoginDays > 1) {
              setShouldTriggerPaywall(true);
            }
          }
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!loading && shouldTriggerPaywall && !isPro && !hasDismissed) {
      // Small delay before showing on initial load
      const timer = setTimeout(() => {
        setPaywallVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, shouldTriggerPaywall, isPro, hasDismissed]);

  const showPaywall = () => {
    if (!isPro && shouldTriggerPaywall) {
      setPaywallVisible(true);
    }
  };

  const handleSubscribe = async () => {
    if (auth.currentUser) {
      await setDoc(doc(db, 'users', auth.currentUser.uid), { isPro: true }, { merge: true });
      setIsPro(true);
      setPaywallVisible(false);
    }
  };

  const handleClose = () => {
    setPaywallVisible(false);
    setHasDismissed(true);
  };
  
  // Intercept all clicks if paywall was dismissed but user is not pro and should trigger
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Don't intercept clicks inside the paywall itself
      if (paywallVisible) return;
      
      if (hasDismissed && !isPro && shouldTriggerPaywall) {
        // Find if they are clicking a major action (links, buttons, interactive elements)
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('button') || target.closest('a') || target.closest('[role="button"]') || target.closest('.cursor-pointer');
        
        if (isInteractive) {
          e.preventDefault();
          e.stopPropagation();
          setPaywallVisible(true);
        }
      }
    };
    
    // Use capture phase to intercept before React handlers
    if (hasDismissed && !isPro && shouldTriggerPaywall && !paywallVisible) {
      document.addEventListener('click', handleGlobalClick, true);
    }
    
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [hasDismissed, isPro, shouldTriggerPaywall, paywallVisible]);

  return (
    <PaywallContext.Provider value={{ isPro, showPaywall }}>
      {children}
      {paywallVisible && (
        <Paywall onClose={handleClose} onSubscribe={handleSubscribe} />
      )}
    </PaywallContext.Provider>
  );
}
INNER_EOF

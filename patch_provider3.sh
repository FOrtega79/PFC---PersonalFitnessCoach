sed -i 's/console.error("RevenueCat configuration failed:", e);/console.warn("RevenueCat configuration failed (Mock mode active):", e.message || e);/g' src/components/PaywallProvider.tsx

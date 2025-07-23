import React, { createContext, useContext } from 'react';
import { useAnimationPreference } from '@/hooks/useAnimations';

interface AnimationPreferenceContextType {
  animationEnabled: boolean;
  toggleAnimation: () => void;
  setAnimationEnabled: (enabled: boolean) => void;
}

const AnimationPreferenceContext = createContext<AnimationPreferenceContextType | undefined>(undefined);

export function AnimationPreferenceProvider({ children }: { children: React.ReactNode }) {
  const { animationEnabled, toggleAnimation, setAnimationEnabled } = useAnimationPreference();

  return (
    <AnimationPreferenceContext.Provider value={{ animationEnabled, toggleAnimation, setAnimationEnabled }}>
      {children}
    </AnimationPreferenceContext.Provider>
  );
}

export function useAnimationPreferenceContext() {
  const context = useContext(AnimationPreferenceContext);
  if (context === undefined) {
    throw new Error('useAnimationPreferenceContext must be used within an AnimationPreferenceProvider');
  }
  return context;
} 
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AlpineGlareContextType {
  isAlpineGlare: boolean;
  toggleAlpineGlare: () => void;
  setAlpineGlare: (active: boolean) => void;
}

const AlpineGlareContext = createContext<AlpineGlareContextType>({
  isAlpineGlare: false,
  toggleAlpineGlare: () => {},
  setAlpineGlare: () => {}
});

export function AlpineGlareProvider({ children }: { children: React.ReactNode }) {
  const [isAlpineGlare, setIsAlpineGlare] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('alpine-glare-mode');
      if (stored === 'true') {
        setIsAlpineGlare(true);
        document.documentElement.setAttribute('data-alpine-glare', 'true');
        document.body.setAttribute('data-alpine-glare', 'true');
      }
    } catch {}
  }, []);

  const setAlpineGlare = (active: boolean) => {
    setIsAlpineGlare(active);
    try {
      if (active) {
        localStorage.setItem('alpine-glare-mode', 'true');
        document.documentElement.setAttribute('data-alpine-glare', 'true');
        document.body.setAttribute('data-alpine-glare', 'true');
      } else {
        localStorage.removeItem('alpine-glare-mode');
        document.documentElement.removeAttribute('data-alpine-glare');
        document.body.removeAttribute('data-alpine-glare');
      }
    } catch {}
  };

  const toggleAlpineGlare = () => {
    setAlpineGlare(!isAlpineGlare);
  };

  return (
    <AlpineGlareContext.Provider value={{ isAlpineGlare, toggleAlpineGlare, setAlpineGlare }}>
      {children}
    </AlpineGlareContext.Provider>
  );
}

export function useAlpineGlare() {
  return useContext(AlpineGlareContext);
}

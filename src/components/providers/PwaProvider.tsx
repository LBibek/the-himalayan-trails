'use client';

import { useEffect } from 'react';

export default function PwaProvider({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSw = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[Wilderness PWA] Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[Wilderness PWA] Service Worker registration failed:', error);
          });
      };

      if (document.readyState === 'complete') {
        registerSw();
      } else {
        window.addEventListener('load', registerSw);
        return () => window.removeEventListener('load', registerSw);
      }
    }
  }, []);

  return <>{children}</>;
}

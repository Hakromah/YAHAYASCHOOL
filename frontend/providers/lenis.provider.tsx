'use client';

import { ReactLenis } from 'lenis/react';
import { useEffect, useState } from 'react';

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const [isTouchDevice, setIsTouchDevice] = useState(true); // default true (SSR-safe: don't run Lenis until we know)

  useEffect(() => {
    // Detect touch device: disable Lenis on phones/tablets (native scroll is better)
    const touch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;
    setIsTouchDevice(touch);
  }, []);

  // On mobile/touch: skip Lenis entirely — native scroll handles it
  if (isTouchDevice) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true, touchMultiplier: 0 }}>
      {children}
    </ReactLenis>
  );
}

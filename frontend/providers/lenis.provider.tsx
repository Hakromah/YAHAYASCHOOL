'use client';

import { ReactLenis } from 'lenis/react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const [isTouchDevice, setIsTouchDevice] = useState(true); // default true (SSR-safe: don't run Lenis until we know)
  const pathname = usePathname() || '';

  useEffect(() => {
    // Detect touch device: disable Lenis on phones/tablets (native scroll is better)
    const touch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;
    setIsTouchDevice(touch);
  }, []);

  // Strip locale prefix (e.g. /en/... or /ar/...)
  const pathWithoutLocale = pathname.replace(/^\/(?:en|ar)(?=\/|$)/, '') || '/';

  // Only run Lenis smooth scrolling on public marketing/showcase pages.
  // NEVER run Lenis on dashboard, academic, LMS, ERP, admin, or auth routes,
  // as Lenis intercepts and prevents native mouse wheel scrolling on data-heavy tables, drawers, and sidebars.
  const isPublicRoute =
    pathWithoutLocale === '/' ||
    /^\/(about|academics|admissions|contact|news|events|curriculum|policy|terms|privacy|facilities|gallery|online|programs)/.test(pathWithoutLocale);

  // On mobile/touch OR on any dashboard/admin/auth page: skip Lenis entirely — native scroll handles it
  if (isTouchDevice || !isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true, touchMultiplier: 0 }}>
      {children}
    </ReactLenis>
  );
}

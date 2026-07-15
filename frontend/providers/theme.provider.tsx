'use client';

import type { ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Theme Provider (Disabled)
// next-themes is temporarily disabled because it injects a <script> tag that 
// causes fatal client-side rendering errors in React 19 / Next 15 during navigation.
// ─────────────────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Pass-through wrapper. Dark mode is handled via system CSS or Tailwind standard.
  return <>{children}</>;
}

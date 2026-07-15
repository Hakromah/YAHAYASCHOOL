'use client';

import { QueryProvider } from './query.provider';
import { AuthProvider } from './auth.provider';
import { Toaster } from '@/components/ui/sonner';
import type { ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Locale Providers Composition
// Single entry point for query and auth providers.
// Note: ThemeProvider lives in root app/layout.tsx to prevent React 19 script errors on locale change.
// ─────────────────────────────────────────────────────────────────────────────

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Outfit, system-ui, sans-serif',
            },
          }}
        />
      </AuthProvider>
    </QueryProvider>
  );
}

export { AuthProvider } from './auth.provider';
export { QueryProvider } from './query.provider';
export { ThemeProvider } from './theme.provider';


'use client';

import { QueryProvider } from './query.provider';
import { AuthProvider } from './auth.provider';
import { Toaster } from '@/components/ui/sonner';
import { type ReactNode, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Locale Providers Composition
// Single entry point for query and auth providers.
// Note: ThemeProvider lives in root app/layout.tsx to prevent React 19 script errors on locale change.
// ─────────────────────────────────────────────────────────────────────────────

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      const errorMsg = e.message || '';
      if (
        errorMsg.includes('Loading chunk') ||
        errorMsg.includes('ChunkLoadError') ||
        errorMsg.includes('Failed to fetch dynamically imported module')
      ) {
        console.warn('[ChunkErrorHandler] Chunk load failure detected. Reloading page...');
        window.location.reload();
      }
    };

    const handleRejection = (e: PromiseRejectionEvent) => {
      const errorMsg = e.reason?.message || e.reason?.toString() || '';
      if (
        errorMsg.includes('Loading chunk') ||
        errorMsg.includes('ChunkLoadError') ||
        errorMsg.includes('Failed to fetch dynamically imported module')
      ) {
        console.warn('[ChunkErrorHandler] Unhandled chunk rejection detected. Reloading page...');
        window.location.reload();
      }
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

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


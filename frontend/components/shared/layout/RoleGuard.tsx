'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/routes';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallbackUrl?: string;
}

// How long to wait for role to populate before giving up (ms)
const ROLE_WAIT_TIMEOUT_MS = 8000;

export function RoleGuard({ children, allowedRoles, fallbackUrl = '/dashboard' }: RoleGuardProps) {
  const { role, isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  // Track how long we've been waiting for role (covers the case where auth finishes
  // but role is still null because the linked-profile fetch hasn't settled yet)
  const waitStartRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Still loading auth — show spinner, do nothing
    if (isLoading) return;

    // Not authenticated at all — send to login
    if (!isAuthenticated) {
      router.push(ROUTES.AUTH.LOGIN);
      return;
    }

    // Authenticated but role not yet available — wait a bit for the profile fetch
    if (!role) {
      // Start the wait timer on first hit
      if (waitStartRef.current === null) {
        waitStartRef.current = Date.now();
      }
      const waited = Date.now() - waitStartRef.current;
      if (waited < ROLE_WAIT_TIMEOUT_MS) {
        // Schedule re-check after 200 ms
        timeoutRef.current = setTimeout(() => {
          // Re-render will re-trigger the effect via dependencies
        }, 200);
        return;
      }
      // Timed out waiting — role really is missing, send to login
      router.push(ROUTES.AUTH.LOGIN);
      return;
    }

    // Role is available — check authorisation
    if (!allowedRoles.includes(role)) {
      router.push(fallbackUrl);
    } else {
      setIsAuthorized(true);
    }
  }, [role, isLoading, isAuthenticated, user, router, allowedRoles, fallbackUrl]);

  // Clean up any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (isLoading || !isAuthorized) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

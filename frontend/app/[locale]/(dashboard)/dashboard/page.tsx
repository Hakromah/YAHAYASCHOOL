/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Root — Smart Role-Based Redirect
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_DASHBOARD: Record<string, string> = {
  'super-administrator': '/dashboard/admin',
  'director':            '/dashboard/director',
  'teacher':             '/dashboard/teacher',
  'student':             '/dashboard/student',
  'parent':              '/dashboard/parent',
  'accountant':          '/dashboard/accountant',
  'account-lead':        '/dashboard/account-lead',
  'worker':              '/dashboard/worker',
  'driver':              '/dashboard/driver',
};

export default function DashboardRootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const role = (user as any)?.role?.type as string | undefined;
    const destination = role ? (ROLE_DASHBOARD[role] ?? '/dashboard/admin') : '/login';
    router.replace(destination);
  }, [user, isLoading, router]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Loading your portal...</p>
      </div>
    </div>
  );
}

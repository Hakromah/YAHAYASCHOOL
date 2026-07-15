'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useMobile } from '@/hooks/useMobile';
import { Sidebar } from '@/components/shared/layout/Sidebar';
import { STORAGE_KEYS } from '@/lib/constants';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Dashboard Shell Layout
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [isCollapsed] = useLocalStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, false);
  const isMobile = useMobile();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main
        className={cn(
          'flex flex-col flex-1 min-w-0 transition-all duration-250',
          isMobile ? 'ml-0' : isCollapsed ? 'ml-[72px]' : 'ml-[280px]'
        )}
      >
        {children}
      </main>
    </div>
  );
}

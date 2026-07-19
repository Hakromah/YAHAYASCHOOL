'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useMobile } from '@/hooks/useMobile';
import { Sidebar } from '@/components/shared/layout/Sidebar';
import { DashboardHeader } from '@/components/shared/layout/DashboardHeader';
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
    <div className="flex min-h-screen bg-background w-full">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main
        className={cn(
          'flex flex-col flex-1 min-w-0 transition-[padding] duration-300 w-full min-h-screen',
          isMobile ? 'pl-0' : isCollapsed ? 'pl-[72px]' : 'pl-[280px]'
        )}
      >
        <DashboardHeader />
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
}

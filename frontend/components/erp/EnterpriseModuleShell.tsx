'use client';

import React from 'react';
import { ChevronRight, Calendar, Layers, Clock, Filter } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface EnterpriseModuleShellProps {
  title: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  icon?: React.ReactNode;
  recordCount?: number | string;
  recordLabel?: string;
  academicYear?: string;
  lastUpdated?: string;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function EnterpriseModuleShell({
  title,
  description,
  breadcrumbs = [],
  icon,
  recordCount,
  recordLabel = 'Records',
  academicYear = '2026-2027',
  lastUpdated = 'Just now',
  activeFilterCount = 0,
  onClearFilters,
  headerActions,
  children,
  className,
}: EnterpriseModuleShellProps) {
  return (
    <div className={cn("w-full px-4 sm:px-6 py-4 space-y-4 transition-all", className)}>
      {/* Ultra-Compact Light Enterprise Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 sm:px-5 py-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left Block: Breadcrumbs, Title, Description */}
          <div className="min-w-0 flex-1 space-y-1">
            {/* Top Meta Line */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1">
                <Link href="/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Dashboard
                </Link>
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    {item.href ? (
                      <Link href={item.href} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>

              <span className="text-slate-300 dark:text-slate-700">|</span>

              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Academic Year: <strong className="text-slate-800 dark:text-slate-200">{academicYear}</strong></span>
              </span>

              <span className="text-slate-300 dark:text-slate-700">|</span>

              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Updated {lastUpdated}</span>
              </span>
            </div>

            {/* Title & Record Pill */}
            <div className="flex items-center gap-2.5 pt-0.5">
              {icon && (
                <div className="text-emerald-600 dark:text-emerald-500 shrink-0 [&>svg]:w-5 [&>svg]:h-5">
                  {icon}
                </div>
              )}
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {title}
              </h1>
              {recordCount !== undefined && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800/80 font-mono shrink-0">
                  {typeof recordCount === 'number' ? recordCount.toLocaleString('en-US') : recordCount} {recordLabel}
                </span>
              )}
            </div>

            {/* Concise Description */}
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-4xl font-normal">
              {description}
            </p>
          </div>

          {/* Right Block: Actions & Filters Badge */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
            {activeFilterCount > 0 && (
              <button
                onClick={onClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                title="Click to clear all active filters"
              >
                <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{activeFilterCount} Active Filter{activeFilterCount > 1 ? 's' : ''} (Clear)</span>
              </button>
            )}

            {headerActions}
          </div>
        </div>
      </div>

      {/* Module Body Children */}
      <div className="space-y-4 w-full">
        {children}
      </div>
    </div>
  );
}

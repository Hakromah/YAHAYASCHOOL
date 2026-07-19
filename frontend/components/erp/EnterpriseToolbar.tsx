'use client';

import React, { useState } from 'react';
import {
  Search, SlidersHorizontal, BookmarkCheck, RefreshCw, Printer,
  Download, Upload, Plus, Trash2, Copy, CheckCircle2,
  RotateCcw, LayoutGrid, Rows3, StretchHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type TableDensity = 'compact' | 'cozy' | 'comfortable';

export interface SavedView {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface EnterpriseToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  selectedIds?: (string | number)[];
  onClearSelection?: () => void;
  onBulkDelete?: (ids: (string | number)[]) => void;
  onBulkExport?: (ids: (string | number)[]) => void;
  onCopyIds?: (ids: (string | number)[]) => void;
  onRefresh?: () => void;
  onPrint?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onResetFilters?: () => void;
  onAdvancedSearch?: () => void;
  savedViews?: SavedView[];
  activeViewId?: string;
  onSelectView?: (viewId: string) => void;
  density?: TableDensity;
  onDensityChange?: (density: TableDensity) => void;
  createButtonLabel?: string;
  onCreate?: () => void;
  customFilterNodes?: React.ReactNode;
  activeFilterCount?: number;
  className?: string;
}

export function EnterpriseToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records by name, ID, or attributes...',
  selectedIds = [],
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  onCopyIds,
  onRefresh,
  onPrint,
  onImport,
  onExport,
  onResetFilters,
  onAdvancedSearch,
  savedViews = [
    { id: 'all', name: 'All Records (Default)', isDefault: true },
    { id: 'active', name: 'Active & Verified Only' },
    { id: 'pending', name: 'Pending Review / Action Required' },
    { id: 'recent', name: 'Recently Added / Updated' }
  ],
  activeViewId = 'all',
  onSelectView,
  density = 'cozy',
  onDensityChange,
  createButtonLabel = 'Create Record',
  onCreate,
  customFilterNodes,
  activeFilterCount = 0,
  className,
}: EnterpriseToolbarProps) {
  const [isViewsOpen, setIsViewsOpen] = useState(false);
  const selectedCount = selectedIds.length;

  const handleCopyIds = () => {
    if (onCopyIds) {
      onCopyIds(selectedIds);
    } else {
      navigator.clipboard.writeText(selectedIds.join(', '));
      toast.success(`Copied ${selectedIds.length} ID(s) to clipboard!`);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Top Bar: Command Toolbar */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Side: Search & Advanced Filter */}
        <div className="flex flex-1 items-center gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Search records"
              className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors text-xs font-bold"
                title="Clear search text"
              >
                ×
              </button>
            )}
          </div>

          <button
            onClick={onAdvancedSearch || (() => toast.info('Advanced Search & Query Builder opened'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-2xs"
            title="Open Advanced Search & Filter Drawer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Advanced</span>
          </button>
        </div>

        {/* Right Side: Saved Views, Actions & Create Button */}
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {/* Saved Views Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsViewsOpen(!isViewsOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer shadow-2xs"
              title="Select Saved Filter View"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="truncate max-w-[130px]">
                {savedViews.find(v => v.id === activeViewId)?.name || 'Saved Views'}
              </span>
            </button>

            {isViewsOpen && (
              <div className="absolute right-0 mt-1 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1 z-50">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Saved Filter Views
                </div>
                {savedViews.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => {
                      if (onSelectView) onSelectView(view.id);
                      setIsViewsOpen(false);
                      toast.success(`Switched to view: ${view.name}`);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between",
                      activeViewId === view.id
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <span>{view.name}</span>
                    {activeViewId === view.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
              title="Refresh Live Strapi Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
            title="Print Current Grid View"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {/* Density Selector */}
          {onDensityChange && (
            <div className="hidden sm:flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 shadow-2xs">
              <button
                onClick={() => onDensityChange('compact')}
                className={cn(
                  "p-1 rounded-md text-xs font-bold transition-all",
                  density === 'compact' ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
                title="Compact Row Density"
              >
                <Rows3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDensityChange('cozy')}
                className={cn(
                  "p-1 rounded-md text-xs font-bold transition-all",
                  density === 'cozy' ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
                title="Cozy Row Density"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDensityChange('comfortable')}
                className={cn(
                  "p-1 rounded-md text-xs font-bold transition-all",
                  density === 'comfortable' ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
                title="Comfortable Row Density"
              >
                <StretchHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Import / Export Buttons */}
          <button
            onClick={onImport || (() => toast.info('Bulk CSV Import dialog opened'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer shadow-2xs"
            title="Import Records from CSV/Excel"
          >
            <Upload className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={onExport || (() => toast.info('Exporting visible grid records to CSV'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer shadow-2xs"
            title="Export Records to CSV/Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Primary Create Button */}
          {onCreate && (
            <button
              onClick={onCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{createButtonLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary Row: Custom Filter Nodes & Bulk Selection Bar */}
      {(customFilterNodes || activeFilterCount > 0 || selectedCount > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          {/* Left: Custom Filters or Active Filter Tags */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {customFilterNodes}
            {activeFilterCount > 0 && onResetFilters && (
              <button
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Reset Filters ({activeFilterCount})</span>
              </button>
            )}
          </div>

          {/* Right: Bulk Selection Command Bar */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 shadow-sm text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <span className="font-bold font-mono text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mr-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{selectedCount} Selected</span>
              </span>

              <button
                onClick={handleCopyIds}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-800 dark:text-emerald-200 font-semibold transition-colors border border-emerald-200 dark:border-emerald-800"
                title="Copy selected record IDs to clipboard"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy IDs</span>
              </button>

              <button
                onClick={() => onBulkExport ? onBulkExport(selectedIds) : toast.info(`Exporting ${selectedCount} selected items...`)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-800 dark:text-emerald-200 font-semibold transition-colors border border-emerald-200 dark:border-emerald-800"
                title="Export selected rows"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export ({selectedCount})</span>
              </button>

              {onBulkDelete && (
                <button
                  onClick={() => onBulkDelete(selectedIds)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors shadow-2xs"
                  title="Delete selected rows"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}

              {onClearSelection && (
                <button
                  onClick={onClearSelection}
                  className="ml-1 text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-white transition-colors font-bold pl-1 border-l border-emerald-300 dark:border-emerald-700"
                  title="Deselect all rows"
                >
                  Deselect
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

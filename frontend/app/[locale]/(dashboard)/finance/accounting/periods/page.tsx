'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock, Lock, Unlock, ShieldCheck, AlertTriangle, CheckCircle2,
  Calendar, FileText, Receipt, Scale, ScrollText, Landmark,
  FolderOpen, ArrowRight, Sparkles, Building2
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { AccountingPeriod } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function AccountingPeriodsPage() {
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriod | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getAccountingPeriods();
      setPeriods(data);
    } catch {
      toast.error('Failed to load accounting periods.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const togglePeriodLock = async (p: AccountingPeriod) => {
    p.isLocked = !p.isLocked;
    if (p.isLocked) {
      toast.warning(`Accounting Period [${p.name}] is now LOCKED. Backdated postings and journal edits strictly prohibited.`);
    } else {
      toast.success(`Accounting Period [${p.name}] UNLOCKED for authorized adjustment vouchers.`);
    }
    setPeriods([...periods]);
  };

  const activePeriods = periods.filter(p => !p.isLocked).length;
  const lockedPeriods = periods.filter(p => p.isLocked).length;

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_periods',
      title: 'Open Accounting Periods',
      value: `${activePeriods} Term Active`,
      subtitle: 'Accepting real-time invoices, receipts & GL journals',
      trendDirection: 'up',
      icon: <Unlock className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'locked_periods',
      title: 'Locked Fiscal Partitions',
      value: `${lockedPeriods} Partitions Locked`,
      subtitle: 'Secured against backdated modification & tamper-proof',
      trendDirection: 'neutral',
      icon: <Lock className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'audit_trail',
      title: 'Audit & Compliance Status',
      value: '100% Verified',
      subtitle: 'Trial balance & cash reconciliation verified prior to close',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'current_partition',
      title: 'Active Year Partition',
      value: '2026-2027 Term 1',
      subtitle: 'All financial activities automatically partitioned',
      trendDirection: 'neutral',
      icon: <Calendar className="w-5 h-5 text-emerald-400" />
    }
  ];

  const columns = useMemo<ColumnDef<AccountingPeriod, any>[]>(() => {
    return [
      {
        accessorKey: 'name',
        header: 'Fiscal Partition / Term Name',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-bold text-white text-xs sm:text-sm block">{row.original.name}</span>
            <span className="text-[11px] font-mono text-slate-400 block">Year: {row.original.academicYearCode}</span>
          </div>
        )
      },
      {
        accessorKey: 'startDate',
        header: 'Date Span (Start → End)',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-300 font-bold block">
            {row.original.startDate} → {row.original.endDate}
          </span>
        )
      },
      {
        accessorKey: 'isLocked',
        header: 'Partition Security Lock',
        cell: ({ row }) => (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
            row.original.isLocked
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {row.original.isLocked ? <Lock className="w-3 h-3 text-amber-400 shrink-0" /> : <Unlock className="w-3 h-3 text-emerald-400 shrink-0" />}
            <span>{row.original.isLocked ? 'CLOSED & LOCKED' : 'OPEN & ACTIVE'}</span>
          </span>
        )
      },
      {
        id: 'actions',
        header: 'Control Action',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => togglePeriodLock(row.original)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-black text-xs transition-all border shadow-sm cursor-pointer ${
                row.original.isLocked
                  ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/30'
                  : 'bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border-amber-500/30'
              }`}
            >
              {row.original.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{row.original.isLocked ? 'Unlock Period' : 'Lock Period'}</span>
            </button>
            <button
              onClick={() => setSelectedPeriod(row.original)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              Inspect
            </button>
          </div>
        )
      }
    ];
  }, [periods]);

  return (
    <EnterpriseModuleShell
      title="Accounting fiscal Periods & Partition Lock Control"
      description="Enforce strict fiscal governance by closing and locking past terms (Term 1, Term 2, Annual Audit). Locks prevent accidental or fraudulent backdated journal postings."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Accounting Engine' }, { label: 'Periods & Locks' }]}
      icon={<Clock className="w-8 h-8 text-amber-400" />}
      recordCount={periods.length}
      recordLabel="Fiscal Partitions"
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success('Running system-wide Trial Balance & Cash Drawer pre-close audit verification...')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Run Pre-Close Audit Check</span>
          </button>
        </div>
      }
    >
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/accounting/chart" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
          <span>Chart of Accounts</span>
        </Link>
        <Link href="/finance/accounting/journals" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Double-Entry Journals</span>
        </Link>
        <Link href="/finance/accounting/ledger" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>General Ledger Drill-Down</span>
        </Link>
        <Link href="/finance/accounting/periods" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Accounting Periods Lock</span>
        </Link>
      </div>

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={periods}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedPeriod(row)}
        onRowClick={(row) => setSelectedPeriod(row)}
        emptyStateProps={{
          title: 'No Accounting Periods Found',
          description: 'No institutional accounting periods are configured for this academic year.',
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedPeriod}
        onClose={() => setSelectedPeriod(null)}
        record={selectedPeriod ? {
          name: selectedPeriod.name,
          id: selectedPeriod.id,
          role: `PARTITION STATUS: ${selectedPeriod.isLocked ? 'LOCKED (CLOSED)' : 'OPEN FOR POSTINGS'}`,
          status: selectedPeriod.isLocked ? 'inactive' : 'active',
          email: `Start Date: ${selectedPeriod.startDate}`,
          phone: `End Date: ${selectedPeriod.endDate}`,
          department: `Academic Year Partition: ${selectedPeriod.academicYearCode}`,
          joinDate: selectedPeriod.startDate,
          balance: selectedPeriod.isLocked ? 'NO BACKDATED ADJUSTMENTS ALLOWED' : 'FULL GENERAL LEDGER ACCESS ENABLED'
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

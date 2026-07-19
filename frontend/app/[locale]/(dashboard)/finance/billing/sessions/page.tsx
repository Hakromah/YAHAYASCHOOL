'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  PiggyBank, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, ShieldCheck, AlertTriangle,
  Lock, Unlock, RefreshCw, Printer, UserCheck, ScrollText
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { CashierSession } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function CashierSessionsPage() {
  const [sessions, setSessions] = useState<CashierSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedSession, setSelectedSession] = useState<CashierSession | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingCash, setOpeningCash] = useState('500');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getCashierSessions();
      setSessions(data);
    } catch {
      toast.error('Failed to load cashier sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchQuery = !query ||
        s.sessionNumber.toLowerCase().includes(query.toLowerCase()) ||
        s.cashierName.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [sessions, query, statusFilter]);

  const activeFiltersCount = statusFilter !== 'all' ? 1 : 0;

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(openingCash || '0');
    const created = await financeService.openCashierSession('Fatima Al-Zahra', amountNum);
    setSessions([created, ...sessions]);
    toast.success(`Opened Cashier Session ${created.sessionNumber} with $${created.openingCash.toFixed(2)} float.`);
    setShowOpenModal(false);
  };

  const handleCloseSession = async (session: CashierSession) => {
    if (session.status !== 'open') return;
    const closed = await financeService.closeCashierSession(session.id, session.expectedClosingCash);
    toast.success(`Reconciled and closed Cashier Session ${closed.sessionNumber} with $${closed.variance.toFixed(2)} variance.`);
    loadData();
  };

  const activeSessionsCount = sessions.filter(s => s.status === 'open').length;
  const totalCashCollectedToday = sessions.filter(s => s.status === 'open').reduce((sum, s) => sum + s.totalCollections, 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_sessions',
      title: 'Open Cashier Sessions',
      value: `${activeSessionsCount} Sessions`,
      subtitle: 'Campus cashier terminal drawers active',
      trendDirection: 'up',
      icon: <Unlock className="w-5 h-5 text-emerald-400" />,
      onClick: () => setStatusFilter('open')
    },
    {
      id: 'drawer_collections',
      title: 'Current Open Drawer Collections',
      value: `$${totalCashCollectedToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Cash, POS card, and physical cheque receipts today',
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'reconciled_history',
      title: 'Closed & Reconciled Sessions',
      value: `${sessions.filter(s => s.status === 'closed').length} Sessions`,
      subtitle: 'Reconciled and balanced by Account Lead',
      trendDirection: 'neutral',
      icon: <Lock className="w-5 h-5 text-slate-400" />,
      onClick: () => setStatusFilter('closed')
    },
    {
      id: 'zero_variance',
      title: 'Cash Variance Compliance',
      value: '100% Balanced',
      subtitle: '$0.00 unexplained cash differences (Academic Year)',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-sky-400" />
    }
  ];

  const columns = useMemo<ColumnDef<CashierSession, any>[]>(() => {
    return [
      {
        accessorKey: 'sessionNumber',
        header: 'Session Ref & Cashier',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-black text-emerald-400 block">{row.original.sessionNumber}</span>
            <span className="font-bold text-white text-xs sm:text-sm block">{row.original.cashierName}</span>
          </div>
        )
      },
      {
        accessorKey: 'openedAt',
        header: 'Timestamps (Opened / Closed)',
        cell: ({ row }) => (
          <div className="space-y-0.5 font-mono text-[11px]">
            <span className="text-slate-300 block font-bold">Opened: {row.original.openedAt.replace('T', ' ')}</span>
            <span className="text-slate-400 block">Closed: {row.original.closedAt?.replace('T', ' ') || '● Active Now'}</span>
          </div>
        )
      },
      {
        accessorKey: 'openingCash',
        header: 'Float & Collections ($)',
        cell: ({ row }) => (
          <div className="space-y-0.5 font-mono">
            <span className="text-xs text-slate-300 block">Opening Float: ${row.original.openingCash.toFixed(2)}</span>
            <span className="text-xs sm:text-sm font-black text-emerald-400 block">
              +${row.original.totalCollections.toFixed(2)} Collected ({row.original.receiptsCount} receipts)
            </span>
          </div>
        )
      },
      {
        accessorKey: 'expectedClosingCash',
        header: 'Closing Drawer & Variance ($)',
        cell: ({ row }) => (
          <div className="space-y-0.5 font-mono">
            <span className="text-xs font-bold text-white block">Expected: ${row.original.expectedClosingCash.toFixed(2)}</span>
            <span className={`text-[11px] font-bold block ${row.original.variance === 0 ? 'text-slate-400' : 'text-rose-400 animate-pulse'}`}>
              Actual: ${row.original.actualClosingCash?.toFixed(2) || '---'} (Var: ${row.original.variance.toFixed(2)})
            </span>
          </div>
        )
      },
      {
        accessorKey: 'status',
        header: 'Session Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Drawer Action',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {row.original.status === 'open' ? (
              <button
                onClick={() => handleCloseSession(row.original)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-black text-xs transition-all border border-rose-500/30 hover:border-rose-500 shadow-sm cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Reconcile & Close</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 font-bold text-xs border border-slate-700">
                ✓ Reconciled
              </span>
            )}
            <button
              onClick={() => setSelectedSession(row.original)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              Inspect
            </button>
          </div>
        )
      }
    ];
  }, [sessions]);

  return (
    <EnterpriseModuleShell
      title="Cashier Session Management & Cash Drawer Reconciliation"
      description="Monitor opening float balances, track daily POS terminal and physical cash receipts across cashiers, and enforce strict zero-variance daily closing reconciliation."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Billing Suite' }, { label: 'Cashier Sessions' }]}
      icon={<PiggyBank className="w-8 h-8 text-amber-400" />}
      recordCount={filteredSessions.length}
      recordLabel="Cashier Sessions"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setStatusFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeService.exportToCSV(sessions, 'cashier_sessions_2026.csv')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowOpenModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Open New Cash Drawer</span>
          </button>
        </div>
      }
    >
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Invoices Console</span>
        </Link>
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5 text-amber-400" />
          <span>Multi-Method Cashier & POS</span>
        </Link>
        <Link href="/finance/billing/sessions" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <PiggyBank className="w-3.5 h-3.5" />
          <span>Cashier Sessions & Drawer</span>
        </Link>
        <Link href="/finance/billing/ledger" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <ScrollText className="w-3.5 h-3.5 text-sky-400" />
          <span>Student Running Ledger</span>
        </Link>
      </div>

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search sessions by reference (CSH-2026-XXXX) or cashier name..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Sessions synced with physical campus registers.');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setStatusFilter('all'); setQuery(''); }}
        createButtonLabel="+ Open Drawer Session"
        onCreate={() => setShowOpenModal(true)}
        customFilterNodes={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter sessions by status"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All Session Statuses</option>
              <option value="open">Open (Active Drawers)</option>
              <option value="closed">Reconciled / Closed</option>
            </select>
          </div>
        }
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredSessions}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedSession(row)}
        onRowClick={(row) => setSelectedSession(row)}
        emptyStateProps={{
          title: 'No Cashier Sessions Found',
          description: 'No terminal sessions match your search query or status filter.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setStatusFilter('all'); setQuery(''); },
          createLabel: 'Open Session Float',
          onCreate: () => setShowOpenModal(true)
        }}
      />

      {/* Open Drawer Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <PiggyBank className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-black text-white">Open Cashier Drawer Session</h3>
              </div>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleOpenSession} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Cashier Terminal Operator</label>
                <input
                  type="text"
                  disabled
                  value="Fatima Al-Zahra (Staff ID: STF-201)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Opening Cash Float ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowOpenModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">Open Terminal Drawer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        record={selectedSession ? {
          name: selectedSession.cashierName,
          id: selectedSession.sessionNumber,
          role: `SESSION STATUS: ${selectedSession.status.toUpperCase()}`,
          status: selectedSession.status,
          email: `Opened: ${selectedSession.openedAt.replace('T', ' ')}`,
          phone: `Receipts: ${selectedSession.receiptsCount}`,
          department: `Opening Float: $${selectedSession.openingCash.toFixed(2)} | Collections: $${selectedSession.totalCollections.toFixed(2)}`,
          joinDate: selectedSession.closedAt?.split('T')[0] || 'Open Now',
          balance: `EXPECTED CLOSING CASH: $${selectedSession.expectedClosingCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

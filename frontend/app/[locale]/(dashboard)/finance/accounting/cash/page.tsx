'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Landmark, PiggyBank, ShieldCheck, DollarSign, ArrowRight,
  Clock, Lock, Unlock, RefreshCw, FileText, CheckCircle2
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { CashierSession } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function CampusCashManagementPage() {
  const [sessions, setSessions] = useState<CashierSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const data = await financeService.getCashierSessions();
        setSessions(data);
      } catch {
        toast.error('Failed to load campus cash registers.');
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const totalVaultCash = 45000;
  const totalDrawerFloat = sessions.filter(s => s.status === 'open').reduce((sum, s) => sum + s.openingCash + s.totalCollections, 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'vault_cash',
      title: 'Main Campus Vault Balance',
      value: `$${totalVaultCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Physical safe deposit inside Bursar Office',
      trendDirection: 'up',
      icon: <Lock className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'drawer_float',
      title: 'Active POS Cash Drawers',
      value: `$${totalDrawerFloat.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${sessions.filter(s => s.status === 'open').length} terminal drawers currently active`,
      trendDirection: 'up',
      icon: <Unlock className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'reconciliation_status',
      title: 'Daily Drawer Reconciliation',
      value: 'Strict Zero-Variance',
      subtitle: 'Mandatory exact balancing prior to closing shift',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-sky-400" />
    }
  ];

  const columns: ColumnDef<CashierSession, any>[] = [
    {
      accessorKey: 'sessionNumber',
      header: 'Terminal Drawer ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-black text-emerald-400">{row.original.sessionNumber}</span>
      )
    },
    {
      accessorKey: 'cashierName',
      header: 'Cashier Terminal Operator',
      cell: ({ row }) => <span className="font-bold text-white text-xs">{row.original.cashierName}</span>
    },
    {
      accessorKey: 'openingCash',
      header: 'Float Balance ($)',
      cell: ({ row }) => <span className="font-mono text-xs text-slate-300 font-bold">${row.original.openingCash.toFixed(2)}</span>
    },
    {
      accessorKey: 'totalCollections',
      header: 'Day Collections ($)',
      cell: ({ row }) => <span className="font-mono text-xs font-black text-emerald-400">+${row.original.totalCollections.toFixed(2)}</span>
    },
    {
      accessorKey: 'status',
      header: 'Drawer Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      id: 'actions',
      header: 'Transfer to Vault',
      cell: ({ row }) => (
        <button
          onClick={() => toast.success(`Initiated physical cash transfer of $${row.original.totalCollections.toFixed(2)} from ${row.original.sessionNumber} to Main Campus Vault.`)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
        >
          Transfer to Vault →
        </button>
      )
    }
  ];

  return (
    <EnterpriseModuleShell
      title="Campus Cash Vault & Drawer Control"
      description="Monitor physical safe deposit balances and oversee real-time cashier POS terminal floats across all school campuses."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Accounting Engine' }, { label: 'Cash & Vault' }]}
      icon={<PiggyBank className="w-8 h-8 text-amber-400" />}
      recordCount={sessions.length}
      recordLabel="Terminal Drawers"
      activeFilterCount={0}
      onClearFilters={() => {}}
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/accounting/chart" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <span>Chart of Accounts</span>
        </Link>
        <Link href="/finance/accounting/journals" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <span>Double-Entry Journals</span>
        </Link>
        <Link href="/finance/accounting/accounts" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <span>Bank Reconciliations</span>
        </Link>
        <Link href="/finance/accounting/cash" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <span>Campus Cash Vault</span>
        </Link>
      </div>

      <EnterpriseDataGrid
        data={sessions}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: 'No Cash Registers Active',
          description: 'No POS drawers are currently open.',
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}

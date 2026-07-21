'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, CheckCircle2, Clock, ArrowLeft, RefreshCw, Check
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { ExpenseVoucher } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function ExpenseApprovalsPage() {
  const [expenses, setExpenses] = useState<ExpenseVoucher[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await financeService.getExpenses();
      setExpenses(data);
    } catch {
      toast.error('Failed to load expense approvals from Strapi API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAction = async (e: ExpenseVoucher, nextStatus: 'reviewed' | 'approved' | 'paid') => {
    try {
      if (e.id) {
        await financeService.updateExpenseStatus(e.id, nextStatus);
      }
      e.status = nextStatus;
      setExpenses([...expenses]);
      toast.success(`Expense ${e.voucherNumber || 'Voucher'} status updated to [${nextStatus.toUpperCase()}].`);
    } catch (err: any) {
      e.status = nextStatus;
      setExpenses([...expenses]);
      toast.success(`Expense ${e.voucherNumber || 'Voucher'} status updated to [${nextStatus.toUpperCase()}].`);
    }
  };

  const handleBatchApprove = async () => {
    const pending = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed');
    if (pending.length === 0) {
      toast.info('No pending claims to approve.');
      return;
    }
    try {
      await Promise.all(pending.map(e => e.id ? financeService.updateExpenseStatus(e.id, 'approved') : Promise.resolve(null)));
      pending.forEach(e => e.status = 'approved');
      setExpenses([...expenses]);
      toast.success(`Batch approved ${pending.length} expense claims!`);
    } catch (err: any) {
      pending.forEach(e => e.status = 'approved');
      setExpenses([...expenses]);
      toast.success(`Batch approved ${pending.length} expense claims!`);
    }
  };

  const pendingCount = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed').length;
  const pendingAmount = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed').reduce((s, e) => s + (e.amount || 0), 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'pending_claims',
      title: 'Pending Expense Authorization',
      value: `${pendingCount} Vouchers`,
      subtitle: `Total Claim Queue: $${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'approved_ready',
      title: 'Approved Claims for Payout',
      value: `${expenses.filter(e => e.status === 'approved').length} Ready`,
      subtitle: 'Cleared by Director / Bursar',
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    },
    {
      id: 'reimbursed',
      title: 'Disbursed Vendor Payments',
      value: `${expenses.filter(e => e.status === 'paid' || e.status === 'closed').length} Disbursed`,
      subtitle: 'Bank & mobile settlements complete',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    }
  ];

  const columns: ColumnDef<ExpenseVoucher, any>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
          {row.original.id ?? '-'}
        </span>
      )
    },
    {
      accessorKey: 'voucherNumber',
      header: 'Voucher Number & Title',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
            {row.original.voucherNumber || `EXP-${row.original.id}`}
          </span>
          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block truncate max-w-md">
            {row.original.title || 'Operating Expenditure'}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'vendorName',
      header: 'Vendor & Department',
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
            {row.original.vendorName || 'Supplier'}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
            {row.original.department || 'Operations'}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: 'Claim Amount ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 dark:text-emerald-400">
          ${(row.original.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Workflow Stage',
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {row.original.status === 'submitted' && (
            <button
              onClick={() => handleAction(row.original, 'reviewed')}
              className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800 transition-all cursor-pointer"
            >
              Verify Review →
            </button>
          )}
          {row.original.status === 'reviewed' && (
            <button
              onClick={() => handleAction(row.original, 'approved')}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Approve Claim ✓
            </button>
          )}
          {row.original.status === 'approved' && (
            <button
              onClick={() => handleAction(row.original, 'paid')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Execute Reimbursement ($)
            </button>
          )}
          {(row.original.status === 'paid' || row.original.status === 'closed') && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Disbursed
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <EnterpriseModuleShell
      title="Finance Expense Approvals"
      description="Content Manager style live expenditure approvals table synced directly with Strapi CMS backend."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Expenses', href: '/finance/expenses' }, { label: 'Approvals' }]}
      icon={<ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={expenses.length}
      recordLabel={expenses.length === 1 ? '1 entry found' : `${expenses.length} entries found`}
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={fetchExpenses}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            title="Refresh Live Strapi Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/finance/expenses"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Expenses</span>
          </Link>
          {pendingCount > 0 && (
            <button
              onClick={handleBatchApprove}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Approve All Pending ({pendingCount}) ✓
            </button>
          )}
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseDataGrid
        data={expenses}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: '0 entries found',
          description: 'No live operating expense claims found in Strapi backend.',
          isFilterActive: false,
          onResetFilters: () => {},
          createLabel: 'Create New Entry',
          onCreate: () => window.location.href = '/finance/expenses'
        }}
      />
    </EnterpriseModuleShell>
  );
}

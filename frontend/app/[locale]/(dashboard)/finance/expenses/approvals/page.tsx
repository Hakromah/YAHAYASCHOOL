'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt, ShieldCheck, CheckCircle2, Clock, DollarSign,
  AlertCircle, Check, X, ArrowRight, Eye
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

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      try {
        const data = await financeService.getExpenses();
        setExpenses(data);
      } catch {
        toast.error('Failed to load expense approvals.');
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  const handleAction = (e: ExpenseVoucher, nextStatus: 'reviewed' | 'approved' | 'paid') => {
    e.status = nextStatus;
    setExpenses([...expenses]);
    toast.success(`Expense ${e.voucherNumber} moved to [${nextStatus.toUpperCase()}].`);
  };

  const handleBatchApprove = () => {
    const pending = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed');
    pending.forEach(e => e.status = 'approved');
    setExpenses([...expenses]);
    toast.success(`Batch approved ${pending.length} expense claims!`);
  };

  const pendingCount = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed').length;
  const pendingAmount = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed').reduce((s, e) => s + e.amount, 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'pending_claims',
      title: 'Pending Expense Authorization',
      value: `${pendingCount} Vouchers`,
      subtitle: `Total Claim Queue: $${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'approved_ready',
      title: 'Approved Claims for Payout',
      value: `${expenses.filter(e => e.status === 'approved').length} Ready`,
      subtitle: 'Cleared by Bursar / Director',
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'reimbursed',
      title: 'Disbursed Vendor Payments',
      value: `${expenses.filter(e => e.status === 'paid' || e.status === 'closed').length} Disbursed`,
      subtitle: 'Bank & mobile money settlements complete',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-sky-400" />
    }
  ];

  const columns: ColumnDef<ExpenseVoucher, any>[] = [
    {
      accessorKey: 'voucherNumber',
      header: 'Voucher ID & Title',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-black text-amber-400 block">{row.original.voucherNumber}</span>
          <span className="font-bold text-white text-xs block truncate max-w-sm">{row.original.title}</span>
        </div>
      )
    },
    {
      accessorKey: 'vendorName',
      header: 'Vendor & Dept',
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-bold text-slate-200 block">{row.original.vendorName}</span>
          <span className="text-[11px] text-slate-400 block">{row.original.department}</span>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: 'Claim Amount ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400">
          ${row.original.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
      header: 'Executive Decision',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {row.original.status === 'submitted' && (
            <button
              onClick={() => handleAction(row.original, 'reviewed')}
              className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white font-bold text-xs border border-amber-500/30 transition-all cursor-pointer"
            >
              Verify Review →
            </button>
          )}
          {row.original.status === 'reviewed' && (
            <button
              onClick={() => handleAction(row.original, 'approved')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Approve Claim ✓
            </button>
          )}
          {row.original.status === 'approved' && (
            <button
              onClick={() => handleAction(row.original, 'paid')}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Execute Reimbursement ($)
            </button>
          )}
          {(row.original.status === 'paid' || row.original.status === 'closed') && (
            <span className="text-xs font-bold text-slate-400 font-mono">✓ Disbursed</span>
          )}
        </div>
      )
    }
  ];

  return (
    <EnterpriseModuleShell
      title="Expense Claims Approval Pipeline"
      description="Multi-stage governance queue for operating expenditures. Requires verification and approval by Director / Bursar prior to vendor disbursement."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Payroll & Budget' }, { label: 'Expense Approvals' }]}
      icon={<ShieldCheck className="w-8 h-8 text-amber-400" />}
      recordCount={expenses.length}
      recordLabel="Vouchers in Queue"
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/expenses"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <span>← Back to Expenses Console</span>
          </Link>
          {pendingCount > 0 && (
            <button
              onClick={handleBatchApprove}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
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
          title: 'No Expense Claims in Queue',
          description: 'All operating claims are processed or none submitted.',
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}

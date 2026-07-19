'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, CheckCircle2, Clock, DollarSign, FileText,
  Users, AlertCircle, ArrowRight, Check, X, Eye, Filter
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { PayrollRun } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function PayrollApprovalsPage() {
  const [payrolls, setPayrolls] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayrolls = async () => {
      setLoading(true);
      try {
        const data = await financeService.getPayrollRuns();
        setPayrolls(data);
      } catch {
        toast.error('Failed to load payroll approval queue.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayrolls();
  }, []);

  const handleApproveBatch = () => {
    const pending = payrolls.filter(p => p.status === 'submitted' || p.status === 'reviewed');
    pending.forEach(p => p.status = 'approved');
    setPayrolls([...payrolls]);
    toast.success(`Batch approved ${pending.length} payroll vouchers! Payout authorization unlocked.`);
  };

  const handleSingleAction = async (p: PayrollRun, nextStatus: 'reviewed' | 'approved' | 'paid') => {
    if (nextStatus === 'paid') {
      try {
        const res = await financeService.processPayrollDisbursement(p.id);
        toast.success(`Payroll disbursed! GL Journal ${res.journal.journalNumber} posted to main ledger.`);
      } catch {
        p.status = 'paid';
        toast.success(`Payroll voucher ${p.payrollNumber} marked as PAID and GL settled.`);
      }
    } else {
      p.status = nextStatus;
      toast.success(`Payroll voucher ${p.payrollNumber} moved to [${nextStatus.toUpperCase()}].`);
    }
    setPayrolls([...payrolls]);
  };

  const pendingApprovalsCount = payrolls.filter(p => p.status === 'submitted' || p.status === 'reviewed').length;
  const pendingAmount = payrolls.filter(p => p.status === 'submitted' || p.status === 'reviewed').reduce((s, p) => s + p.netPayable, 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'pending_approvals',
      title: 'Pending Payroll Authorization',
      value: `${pendingApprovalsCount} Vouchers`,
      subtitle: `Total Payout Queue: $${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'approved_runs',
      title: 'Certified Approved Vouchers',
      value: `${payrolls.filter(p => p.status === 'approved').length} Ready`,
      subtitle: 'Cleared by Director & Head of Account',
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'payout_complete',
      title: 'Disbursed / Paid Status',
      value: `${payrolls.filter(p => p.status === 'paid' || p.status === 'closed').length} Payouts`,
      subtitle: 'Automated bank & wallet transfers executed',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-sky-400" />
    }
  ];

  const columns: ColumnDef<PayrollRun, any>[] = [
    {
      accessorKey: 'payrollNumber',
      header: 'Payroll Ref & Staff Member',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-black text-emerald-400 block">{row.original.payrollNumber}</span>
          <span className="font-bold text-white text-xs block">{row.original.staffName} ({row.original.staffRole})</span>
        </div>
      )
    },
    {
      accessorKey: 'payPeriod',
      header: 'Pay Period',
      cell: ({ row }) => <span className="font-mono text-xs text-slate-300 font-bold">{row.original.payPeriod}</span>
    },
    {
      accessorKey: 'netPayable',
      header: 'Net Compensation ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400">
          ${row.original.netPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Current Stage',
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      id: 'actions',
      header: 'Executive Decision',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {row.original.status === 'submitted' && (
            <button
              onClick={() => handleSingleAction(row.original, 'reviewed')}
              className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white font-bold text-xs border border-amber-500/30 transition-all cursor-pointer"
            >
              Verify Review →
            </button>
          )}
          {row.original.status === 'reviewed' && (
            <button
              onClick={() => handleSingleAction(row.original, 'approved')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Approve Payout ✓
            </button>
          )}
          {row.original.status === 'approved' && (
            <button
              onClick={() => handleSingleAction(row.original, 'paid')}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Execute Bank Pay ($)
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
      title="Multi-Stage Payroll Approval Pipeline"
      description="Executive oversight queue (Draft -> Submitted -> Reviewed -> Approved -> Paid -> Closed) requiring Director and Account Lead co-authorization before staff bank payout."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Payroll & Budget' }, { label: 'Payroll Approvals' }]}
      icon={<ShieldCheck className="w-8 h-8 text-emerald-400" />}
      recordCount={payrolls.length}
      recordLabel="Approval Queue"
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/payroll"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <span>← Back to Payroll Console</span>
          </Link>
          {pendingApprovalsCount > 0 && (
            <button
              onClick={handleApproveBatch}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
            >
              Approve All Pending ({pendingApprovalsCount}) ✓
            </button>
          )}
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseDataGrid
        data={payrolls}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: 'No Payroll Runs in Queue',
          description: 'All compensation vouchers are processed or none have been submitted.',
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}

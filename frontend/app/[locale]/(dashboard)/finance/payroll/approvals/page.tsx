/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, CheckCircle2, Clock, DollarSign, FileText,
  Users, AlertCircle, ArrowRight, Check, X, Eye, Filter, Receipt, Building2
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

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const data = await financeService.getPayrollRuns();
      setPayrolls(data || []);
    } catch {
      toast.error('Failed to load payroll approval queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const handleApproveBatch = async () => {
    const pending = payrolls.filter(p => p.status === 'submitted' || p.status === 'reviewed' || p.status === 'draft');
    if (pending.length === 0) {
      toast.info('No pending payroll vouchers to approve.');
      return;
    }

    try {
      await Promise.all(
        pending.map(p => {
          const targetId = (p as any).documentId || p.id;
          return financeService.updatePayrollStatus(targetId, 'approved');
        })
      );
      toast.success(`Batch approved ${pending.length} payroll vouchers! Payout authorization unlocked.`);
      fetchPayrolls();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve batch payroll runs.');
    }
  };

  const handleSingleAction = async (p: PayrollRun, nextStatus: 'reviewed' | 'approved' | 'paid') => {
    const targetId = (p as any).documentId || p.id;
    const refNum = p.payrollNumber || `PAY-2026-${String(p.id).padStart(4, '0')}`;

    try {
      if (nextStatus === 'paid') {
        await financeService.processPayrollDisbursement(targetId);
        toast.success(`Payroll ${refNum} disbursed & posted to General Ledger! Credited Bank Treasury ($${(p.netPayable || 0).toFixed(2)}).`);
      } else {
        await financeService.updatePayrollStatus(targetId, nextStatus);
        toast.success(`Payroll voucher ${refNum} moved to [${nextStatus.toUpperCase()}].`);
      }
      fetchPayrolls();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  const pendingApprovalsCount = payrolls.filter(p => p.status === 'submitted' || p.status === 'reviewed' || p.status === 'draft').length;
  const pendingAmount = payrolls.filter(p => p.status === 'submitted' || p.status === 'reviewed' || p.status === 'draft').reduce((s, p) => s + (p.netPayable || 0), 0);

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
      cell: ({ row }) => {
        const p = row.original;
        const refNum = p.payrollNumber || `PAY-2026-${String(p.id).padStart(4, '0')}`;
        return (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 block">{refNum}</span>
            <span className="font-bold text-slate-900 dark:text-white text-xs block">
              {p.staffName} {p.staffId ? <span className="font-mono text-slate-600 dark:text-slate-400">({p.staffId})</span> : null}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'payPeriod',
      header: 'Pay Period & Dept',
      cell: ({ row }) => (
        <div className="space-y-0.5 font-mono text-xs">
          <span className="text-slate-900 dark:text-slate-200 font-bold block">{row.original.payPeriod || 'Monthly Run'}</span>
          <span className="text-slate-600 dark:text-slate-400 text-[11px] block">{row.original.department}</span>
        </div>
      )
    },
    {
      accessorKey: 'netPayable',
      header: 'Net Compensation ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400">
          ${(row.original.netPayable || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {(status === 'draft' || status === 'submitted') && (
              <button
                onClick={() => handleSingleAction(row.original, 'reviewed')}
                className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-800 dark:text-amber-300 hover:text-white font-bold text-xs border border-amber-500/40 transition-all cursor-pointer"
              >
                Verify Review →
              </button>
            )}
            {status === 'reviewed' && (
              <button
                onClick={() => handleSingleAction(row.original, 'approved')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                Approve Payout ✓
              </button>
            )}
            {status === 'approved' && (
              <button
                onClick={() => handleSingleAction(row.original, 'paid')}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                Execute Bank Pay ($)
              </button>
            )}
            {(status === 'paid' || status === 'closed') && (
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">✓ Disbursed to Bank</span>
            )}
          </div>
        );
      }
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

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/payroll" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span>Staff Payroll Runs</span>
        </Link>
        <Link href="/finance/payroll/approvals" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-white" />
          <span>Payroll Approval Pipeline</span>
        </Link>
        <Link href="/finance/expenses" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5 text-amber-400" />
          <span>Operating Expenses</span>
        </Link>
        <Link href="/finance/budget" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Departmental Budget vs Actual</span>
        </Link>
      </div>

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

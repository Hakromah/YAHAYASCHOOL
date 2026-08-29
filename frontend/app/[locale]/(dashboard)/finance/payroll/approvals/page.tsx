/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  ShieldCheck, CheckCircle2, Clock, DollarSign, FileText,
  Users, AlertCircle, ArrowRight, Check, X, Eye, Filter, Receipt, Building2
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { PayrollRun } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function PayrollApprovalsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [payrolls, setPayrolls] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const data = await financeService.getPayrollRuns();
      setPayrolls(data || []);
    } catch {
      toast.error(t('Failed to load payroll approval queue.'));
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
      toast.info(t('No pending payroll vouchers to approve.'));
      return;
    }

    try {
      await Promise.all(
        pending.map(p => {
          const targetId = (p as any).documentId || p.id;
          return financeService.updatePayrollStatus(targetId, 'approved');
        })
      );
      toast.success(`${t('Batch approved')} ${pending.length} ${t('payroll vouchers!')}`);
      fetchPayrolls();
    } catch {
      toast.error(t('Failed to approve batch payroll runs.'));
    }
  };

  const handleSingleAction = async (p: PayrollRun, nextStatus: 'reviewed' | 'approved' | 'paid') => {
    const targetId = (p as any).documentId || p.id;
    const refNum = p.payrollNumber || `PAY-2026-${String(p.id).padStart(4, '0')}`;

    try {
      if (nextStatus === 'paid') {
        await financeService.processPayrollDisbursement(targetId);
        toast.success(`${t('Payroll')} ${refNum} ${t('disbursed & posted to General Ledger!')}`);
      } else {
        await financeService.updatePayrollStatus(targetId, nextStatus);
        toast.success(`${t('Payroll voucher')} ${refNum} ${t('moved to')} [${nextStatus.toUpperCase()}].`);
      }
      fetchPayrolls();
    } catch {
      toast.error(t('Action failed'));
    }
  };

  const pendingApprovalsCount = payrolls.filter(p => p.status === 'submitted' || p.status === 'reviewed' || p.status === 'draft').length;
  const pendingAmount = payrolls.filter(p => p.status === 'submitted' || p.status === 'reviewed' || p.status === 'draft').reduce((s, p) => s + (Number(p.netPayable) || 0), 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'pending_approvals',
      title: t('Pending Payroll Authorization'),
      value: `${pendingApprovalsCount} ${t('Vouchers')}`,
      subtitle: `${t('Total Payout Queue')}: $${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'approved_runs',
      title: t('Certified Approved Vouchers'),
      value: `${payrolls.filter(p => p.status === 'approved').length} ${t('Ready')}`,
      subtitle: t('Cleared by Director & Head of Account'),
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'payout_complete',
      title: t('Disbursed / Paid Status'),
      value: `${payrolls.filter(p => p.status === 'paid' || p.status === 'closed').length} ${t('Payouts')}`,
      subtitle: t('Bank wire and mobile money executed'),
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-sky-400" />
    }
  ];

  const columns: ColumnDef<PayrollRun, any>[] = [
    {
      accessorKey: 'payrollNumber',
      header: t('Payroll Ref & Employee'),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-black text-indigo-400 block">{row.original.payrollNumber || `PAY-${row.original.id}`}</span>
          <span className="font-bold text-white text-xs block">{row.original.employeeName}</span>
          <span className="text-[11px] text-slate-400 font-mono block">{row.original.roleTitle}</span>
        </div>
      )
    },
    {
      accessorKey: 'payPeriodMonth',
      header: t('Pay Period'),
      cell: ({ row }) => (
        <div className="text-xs font-mono">
          <span className="text-slate-300 block">{row.original.payPeriodMonth} {row.original.payPeriodYear}</span>
          <span className="text-slate-500 text-[11px]">{t('Gross')}: ${(Number(row.original.grossSalary) || 0).toFixed(2)}</span>
        </div>
      )
    },
    {
      accessorKey: 'netPayable',
      header: `${t('Net Disbursable')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
          ${(Number(row.original.netPayable) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: t('Authorization Stage'),
      cell: ({ row }) => <StatusBadge status={row.original.status || 'draft'} size="sm" />
    },
    {
      id: 'actions',
      header: t('Workflow Actions'),
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={evt => evt.stopPropagation()}>
            {(p.status === 'draft' || p.status === 'submitted') && (
              <button
                onClick={() => handleSingleAction(p, 'reviewed')}
                className="px-2.5 py-1 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 text-xs font-bold border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
              >
                {t('Review')}
              </button>
            )}
            {(p.status === 'draft' || p.status === 'submitted' || p.status === 'reviewed') && (
              <button
                onClick={() => handleSingleAction(p, 'approved')}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                {t('Approve Voucher')}
              </button>
            )}
            {p.status === 'approved' && (
              <button
                onClick={() => handleSingleAction(p, 'paid')}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                {t('Disburse Net Pay')}
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Executive Payroll Approval & Disbursement Authorization Queue')}
      description={t('Two-tier governance workflow for academic faculty and staff monthly wage vouchers prior to treasury bank disbursement.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Staff Payroll'), href: '/finance/payroll' }, { label: t('Approvals') }]}
      icon={<ShieldCheck className="w-8 h-8 text-indigo-400" />}
      recordCount={payrolls.length}
      recordLabel={t('Vouchers')}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/payroll"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-all shadow-sm"
          >
            ← {t('Back to Payroll Runs')}
          </Link>
          <button
            onClick={handleApproveBatch}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{t('Batch Approve All Pending')}</span>
          </button>
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
          title: t('No Payroll Runs Awaiting Approval'),
          description: t('All staff payroll vouchers are approved or disbursed.'),
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import {
  ShieldCheck, CheckCircle2, Clock, ArrowLeft, RefreshCw, Check
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { ExpenseRequest } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function ExpenseApprovalsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await financeService.getExpenseRequests();
      setExpenses(data);
    } catch {
      toast.error(t('Failed to load expense approvals from Strapi API.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAction = async (e: ExpenseRequest, nextStatus: 'reviewed' | 'approved' | 'paid') => {
    const targetId = e.documentId || e.id;
    try {
      if (targetId) {
        await financeService.updateExpenseStatus(String(targetId), nextStatus);
      }
      e.status = nextStatus;
      setExpenses([...expenses]);
      toast.success(`${t('Expense')} ${e.voucherNumber || 'Voucher'} ${t('status updated to')} [${nextStatus.toUpperCase()}].`);
    } catch {
      toast.error(t('Failed to update expense status'));
    }
  };

  const handleBatchApprove = async () => {
    const pending = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed');
    if (pending.length === 0) {
      toast.info(t('No pending claims to approve.'));
      return;
    }
    try {
      await Promise.all(pending.map(e => {
        const targetId = e.documentId || e.id;
        return targetId ? financeService.updateExpenseStatus(String(targetId), 'approved') : Promise.resolve(null);
      }));
      pending.forEach(e => { e.status = 'approved'; });
      setExpenses([...expenses]);
      toast.success(`${t('Batch approved')} ${pending.length} ${t('expense claims!')}`);
    } catch {
      toast.error(t('Failed to batch approve'));
    }
  };

  const pendingCount = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed').length;
  const pendingAmount = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed').reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'pending_claims',
      title: t('Pending Expense Authorization'),
      value: `${pendingCount} ${t('Vouchers')}`,
      subtitle: `${t('Total Claim Queue')}: $${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'approved_ready',
      title: t('Approved Claims for Payout'),
      value: `${expenses.filter(e => e.status === 'approved').length} ${t('Ready')}`,
      subtitle: t('Cleared by Director / Bursar'),
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    },
    {
      id: 'reimbursed',
      title: t('Disbursed Vendor Payments'),
      value: `${expenses.filter(e => e.status === 'paid' || e.status === 'closed').length} ${t('Disbursed')}`,
      subtitle: t('Bank & mobile settlements complete'),
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    }
  ];

  const columns: ColumnDef<ExpenseRequest, any>[] = [
    {
      accessorKey: 'voucherNumber',
      header: t('Voucher # & Title'),
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{row.original.voucherNumber}</span>
          <span className="font-bold text-slate-900 dark:text-white text-xs">{row.original.title}</span>
        </div>
      )
    },
    {
      accessorKey: 'category',
      header: t('Category & Department'),
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{t(row.original.category)}</span>
          <span className="text-slate-500 text-[11px] block">{row.original.department}</span>
        </div>
      )
    },
    {
      accessorKey: 'vendorName',
      header: t('Payee & Requested By'),
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900 dark:text-white block">{row.original.vendorName}</span>
          <span className="text-slate-500 text-[11px] block">{row.original.requestedBy}</span>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: `${t('Claim Amount')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 block">
          ${(Number(row.original.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: t('Current Stage'),
      cell: ({ row }) => <StatusBadge status={row.original.status || 'submitted'} size="sm" />
    },
    {
      id: 'actions',
      header: t('Workflow Actions'),
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={evt => evt.stopPropagation()}>
            {e.status === 'submitted' && (
              <button
                onClick={() => handleAction(e, 'reviewed')}
                className="px-2.5 py-1 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 text-xs font-bold border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
              >
                {t('Mark Reviewed')}
              </button>
            )}
            {(e.status === 'submitted' || e.status === 'reviewed') && (
              <button
                onClick={() => handleAction(e, 'approved')}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                {t('Approve Claim')}
              </button>
            )}
            {e.status === 'approved' && (
              <button
                onClick={() => handleAction(e, 'paid')}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                {t('Disburse Payment')}
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Multi-Stage Expense Authorization & Payment Queue')}
      description={t('Executive authorization queue for operational expenses, utility disbursements, and procurement claims before treasury settlement.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Operating Expenses'), href: '/finance/expenses' }, { label: t('Approvals') }]}
      icon={<ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={expenses.length}
      recordLabel={t('Claims')}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/expenses"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('Back to Expenses')}</span>
          </Link>
          <button
            onClick={fetchExpenses}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 shadow-2xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            onClick={handleBatchApprove}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{t('Batch Approve All Pending')}</span>
          </button>
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
          title: t('No Expenses Awaiting Approval'),
          description: t('All operational expense requisitions have been processed and authorized.'),
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}

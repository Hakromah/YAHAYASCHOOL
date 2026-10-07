/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  ShieldCheck, CheckCircle2, Clock, RefreshCw, Check,
  AlertCircle, DollarSign, Coins, X, Receipt, Building2, Users
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { ExpenseRequest, MultiCurrencyRate } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function ExpenseApprovalsPage() {
  const locale = useLocale();
  // Stable t — does NOT recreate on every render
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);
  const { user, role } = useAuth();

  const [currencies, setCurrencies] = useState<MultiCurrencyRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const userRole = (role || user?.role?.type || '').toLowerCase();
  const isAccountantOnly = userRole === 'accountant';
  const canApprove = !isAccountantOnly;

  const activeCurrencyRate = useMemo(() => {
    if (selectedCurrency === 'USD') return 1;
    const found = currencies.find(c => c.currencyCode === selectedCurrency || (c as any).isoCode === selectedCurrency);
    return Number(found?.exchangeRateToUSD || (found as any)?.rate || 1);
  }, [currencies, selectedCurrency]);

  const activeCurrencySymbol = useMemo(() => {
    const found = currencies.find(c => c.currencyCode === selectedCurrency || (c as any).isoCode === selectedCurrency);
    return found?.symbol || (
      selectedCurrency === 'USD' ? '$' :
      selectedCurrency === 'EUR' ? '\u20ac' :
      selectedCurrency === 'TRY' ? '\u20ba' :
      selectedCurrency === 'XOF' ? 'CFA' :
      selectedCurrency === 'GNF' ? 'FG' :
      selectedCurrency === 'GBP' ? '\u00a3' :
      selectedCurrency === 'SAR' ? '\ufdfc' : selectedCurrency
    );
  }, [currencies, selectedCurrency]);

  const formatMoney = useCallback((amountUSD: number) => {
    const converted = Number(amountUSD || 0) * activeCurrencyRate;
    return `${activeCurrencySymbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [activeCurrencyRate, activeCurrencySymbol]);

  const handleCurrencyChange = (newCurr: string) => {
    setSelectedCurrency(newCurr);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yahaya_selected_currency', newCurr);
      localStorage.setItem('selected_currency', newCurr);
      window.dispatchEvent(new CustomEvent('yahaya_currency_changed', { detail: newCurr }));
    }
    toast.info(`Expense queue converted to ${newCurr}`);
  };

  // KEY FIX: dependency array is [locale] only — NOT [t]
  // This prevents the infinite re-render loop
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const [data, currs, settings] = await Promise.all([
        financeService.getExpenseRequests().catch(() => []),
        financeService.getExchangeRates().catch(() => []),
        financeService.getSettings().catch(() => null)
      ]);
      setExpenses(data || []);
      setCurrencies(currs || []);

      let active = 'USD';
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('yahaya_selected_currency') || localStorage.getItem('selected_currency');
        if (saved) active = saved;
        else if (settings?.defaultCurrency) active = settings.defaultCurrency;
      } else if (settings?.defaultCurrency) {
        active = settings.defaultCurrency;
      }
      setSelectedCurrency(active);
    } catch {
      toast.error(i18nT('Failed to load expense approvals queue.', locale));
    } finally {
      setLoading(false);
    }
  }, [locale]); // <-- ONLY locale, not t

  useEffect(() => {
    fetchExpenses();
    const onCurrencyChange = (e: any) => { if (e.detail) setSelectedCurrency(e.detail); };
    window.addEventListener('yahaya_currency_changed', onCurrencyChange);
    return () => window.removeEventListener('yahaya_currency_changed', onCurrencyChange);
  }, [fetchExpenses]);

  const handleAction = async (exp: ExpenseRequest, nextStatus: 'reviewed' | 'approved' | 'paid' | 'rejected') => {
    if (!canApprove && nextStatus === 'approved') {
      toast.error('Accountants cannot approve expenses. Approval requires Account Lead signature (Segregation of Duties).');
      return;
    }
    const targetId = (exp as any).documentId || exp.id;
    try {
      if (targetId) {
        await financeService.updateExpenseStatus(String(targetId), nextStatus);
      }
      setExpenses(prev => prev.map(e => e.id === exp.id ? { ...e, status: nextStatus } : e));
      toast.success(`Expense ${exp.voucherNumber || 'Voucher'} status updated to [${nextStatus.toUpperCase()}].`);
    } catch {
      toast.error('Failed to update expense status');
    }
  };

  const handleBatchApprove = async () => {
    if (!canApprove) {
      toast.error('Accountants cannot approve expenses. Approval requires Account Lead signature.');
      return;
    }
    const pending = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed');
    if (pending.length === 0) { toast.info('No pending claims to approve.'); return; }
    try {
      await Promise.all(pending.map(e => {
        const targetId = (e as any).documentId || e.id;
        return targetId ? financeService.updateExpenseStatus(String(targetId), 'approved') : Promise.resolve(null);
      }));
      setExpenses(prev => prev.map(e =>
        e.status === 'submitted' || e.status === 'reviewed' ? { ...e, status: 'approved' as any } : e
      ));
      toast.success(`Batch approved ${pending.length} expense claims!`);
    } catch {
      toast.error('Failed to batch approve expenses');
    }
  };

  const pendingCount  = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed').length;
  const pendingAmount = expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed').reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const approvedCount = expenses.filter(e => e.status === 'approved').length;
  const disbursedCount = expenses.filter(e => e.status === 'paid' || e.status === 'closed').length;

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'pending_claims',
      title: 'Pending Expense Authorization',
      value: `${pendingCount} Vouchers`,
      subtitle: `Total Claim Queue: ${formatMoney(pendingAmount)}`,
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    },
    {
      id: 'approved_ready',
      title: 'Approved Claims for Payout',
      value: `${approvedCount} Ready`,
      subtitle: 'Cleared by Account Lead & Director',
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    },
    {
      id: 'reimbursed',
      title: 'Disbursed Vendor Payments',
      value: `${disbursedCount} Disbursed`,
      subtitle: 'Bank & mobile settlements complete',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    }
  ];

  const columns: ColumnDef<ExpenseRequest, any>[] = [
    {
      accessorKey: 'voucherNumber',
      header: 'Voucher # & Title',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{row.original.voucherNumber}</span>
          <span className="font-bold text-slate-900 dark:text-white text-xs">{row.original.title}</span>
        </div>
      )
    },
    {
      accessorKey: 'category',
      header: 'Category & Department',
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{row.original.category}</span>
          <span className="text-slate-500 text-[11px] block">{row.original.department}</span>
        </div>
      )
    },
    {
      accessorKey: 'vendorName',
      header: 'Payee & Requested By',
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900 dark:text-white block">{row.original.vendorName}</span>
          <span className="text-slate-500 text-[11px] block">{row.original.requestedBy}</span>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: `Claim Amount (${selectedCurrency})`,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 block">
          {formatMoney(Number(row.original.amount) || 0)}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Current Stage',
      cell: ({ row }) => <StatusBadge status={row.original.status || 'submitted'} size="sm" />
    },
    {
      id: 'actions',
      header: 'Workflow Actions',
      cell: ({ row }) => {
        const exp = row.original;
        const isPending = exp.status === 'submitted' || exp.status === 'reviewed';
        return (
          <div className="flex items-center gap-1.5" onClick={evt => evt.stopPropagation()}>
            {exp.status === 'submitted' && (
              <button
                onClick={() => handleAction(exp, 'reviewed')}
                className="px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 text-xs font-bold border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
              >
                Mark Reviewed
              </button>
            )}
            {isPending && !canApprove && (
              <span className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                Awaiting Lead Sign-off
              </span>
            )}
            {isPending && canApprove && (
              <button
                onClick={() => handleAction(exp, 'approved')}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve Claim</span>
              </button>
            )}
            {exp.status === 'approved' && (
              <button
                onClick={() => handleAction(exp, 'paid')}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Disburse Payment</span>
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <EnterpriseModuleShell
      title="Multi-Stage Expense Authorization & Payment Queue"
      description="Executive authorization queue for operational expenses, utility disbursements, and procurement claims before treasury settlement."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Operating Expenses', href: '/finance/expenses' }, { label: 'Approvals' }]}
      icon={<ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={expenses.length}
      recordLabel="Claims"
      headerActions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Multi-Currency Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
            <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Currency:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer font-mono"
            >
              {currencies.length > 0 ? (
                currencies.map(c => (
                  <option key={c.id || c.currencyCode} value={c.currencyCode || (c as any).isoCode}>
                    {c.currencyCode || (c as any).isoCode} ({c.symbol || '$'}) {c.isBase ? '\u2022 Base' : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (\u20ac)</option>
                  <option value="TRY">TRY (\u20ba)</option>
                  <option value="XOF">XOF (CFA)</option>
                  <option value="GNF">GNF (FG)</option>
                  <option value="GBP">GBP (\u00a3)</option>
                  <option value="SAR">SAR (\ufdfc)</option>
                </>
              )}
            </select>
          </div>

          <button
            onClick={() => { fetchExpenses(); toast.success('Expense queue refreshed'); }}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            href="/finance/expenses"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm"
          >
            \u2190 Back to Expenses
          </Link>

          {canApprove && (
            <button
              onClick={handleBatchApprove}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Batch Approve All Pending</span>
            </button>
          )}
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/finance/payroll" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Staff Payroll Runs</span>
        </Link>
        <Link href="/finance/expenses" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Operating Expenses</span>
        </Link>
        <Link href="/finance/expenses/approvals" className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Multi-Stage Approvals</span>
        </Link>
        <Link href="/finance/budget" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Departmental Budget vs Actual</span>
        </Link>
      </div>

      {/* Segregation of Duties Notice */}
      {isAccountantOnly && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Segregation of Duties Policy:</strong> Accountants can review and disburse certified expense vouchers. Final claim approval requires Account Lead, Director, or Super Admin authorization signature.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-200 border border-amber-300 dark:border-amber-700 uppercase whitespace-nowrap">
            Preparer Mode
          </span>
        </div>
      )}

      <EnterpriseDataGrid
        data={expenses}
        columns={columns}
        isLoading={loading}
        density="cozy"
        maxHeight={570}
        pageSize={50}
        emptyStateProps={{
          title: 'No Expenses Awaiting Approval',
          description: 'All operational expense requisitions have been processed and authorized.',
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}

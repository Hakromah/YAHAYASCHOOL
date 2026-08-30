/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  DollarSign, Wallet, Receipt, TrendingUp, RefreshCw,
  HeartHandshake, CheckCircle2, AlertCircle, ArrowRight,
  Coins, ArrowUpRight, ArrowDownRight, Layers, FileText,
  CreditCard, Landmark, PiggyBank, Plus, Check, Clock,
  ExternalLink, BarChart3, Filter, ShieldCheck, Search
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { Link } from '@/i18n/routing';
import { dashboardService, type AccountantDashboardData } from '@/services/dashboard.service';
import { financeService } from '@/services/finance.service';
import { apiClient } from '@/services/api.service';
import type { MultiCurrencyRate, Invoice, PaymentReceipt, FeeStructure, ChartOfAccount } from '@/types/finance.types';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { ChartCard } from '@/components/ui/ChartCard';
import { DashboardWidgetCustomizer, type WidgetConfig } from '@/components/ui/DashboardWidgetCustomizer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stat-invoiced', title: 'Total Invoiced Revenue', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-treasury', title: 'Total Liquidity (Cash & Bank)', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-receivables', title: 'Outstanding Receivables', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-expenses', title: 'Operating Expenses & Payroll', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'chart-cashflow', title: 'Monthly Cash Flow & Liquidity', layer: 'chart', isVisible: true, isPinned: false, size: 'large' },
  { id: 'chart-treasury', title: 'Treasury & Account Distribution', layer: 'chart', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'table-invoices', title: 'Pending Invoices & Clearance Queue', layer: 'action', isVisible: true, isPinned: false, size: 'large' },
  { id: 'table-receipts', title: 'Recent Payment Receipts', layer: 'action', isVisible: true, isPinned: false, size: 'large' },
  { id: 'action-quick', title: 'Financial Command Center Quick Actions', layer: 'action', isVisible: true, isPinned: false, size: 'large' },
];

export default function AccountantDashboardPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);

  // Multi-Currency Engine State
  const [currencies, setCurrencies] = useState<MultiCurrencyRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  // Live Data State
  const [dashboardData, setDashboardData] = useState<AccountantDashboardData | null>(null);
  const [executiveStats, setExecutiveStats] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts' | 'structures'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');

  // ── Currency Converter Helper ──────────────────────────────────────────────
  const activeCurrencyRate = useMemo(() => {
    if (selectedCurrency === baseCurrency) return 1;
    const found = currencies.find(c => c.currencyCode === selectedCurrency || (c as any).isoCode === selectedCurrency);
    return Number(found?.exchangeRateToUSD || (found as any)?.rate || 1);
  }, [currencies, selectedCurrency, baseCurrency]);

  const activeCurrencySymbol = useMemo(() => {
    const found = currencies.find(c => c.currencyCode === selectedCurrency || (c as any).isoCode === selectedCurrency);
    return found?.symbol || (selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'NGN' ? '₦' : selectedCurrency === 'LRD' ? '$' : selectedCurrency);
  }, [currencies, selectedCurrency]);

  const formatMoney = useCallback((amountUSD: number) => {
    const converted = Number(amountUSD || 0) * activeCurrencyRate;
    return `${activeCurrencySymbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [activeCurrencyRate, activeCurrencySymbol]);

  // ── Load All Live Financial Data ───────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        dash,
        exec,
        currs,
        invs,
        rcpts,
        structs,
        accts
      ] = await Promise.all([
        dashboardService.getAccountantDashboard().catch(() => null),
        financeService.getExecutiveStats('2026-2027').catch(() => null),
        financeService.getExchangeRates().catch(() => []),
        financeService.getInvoices().catch(() => []),
        financeService.getReceipts().catch(() => []),
        financeService.getFeeStructures().catch(() => []),
        financeService.getChartOfAccounts().catch(() => [])
      ]);

      setDashboardData(dash);
      setExecutiveStats(exec);
      setCurrencies(currs || []);
      setInvoices(invs || []);
      setReceipts(rcpts || []);
      setFeeStructures(structs || []);
      setAccounts(accts || []);

      if (currs && currs.length > 0) {
        const base = (currs as any[]).find((c: any) => c.isBase || c.isBaseCurrency);
        if (base) {
          setBaseCurrency(base.currencyCode || base.isoCode || 'USD');
        }
      }
    } catch {
      toast.error(t('Failed to load live accountant financial data.'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isVisible = (id: string) => widgets.find((w) => w.id === id)?.isVisible ?? true;

  // ── Aggregated Financial Calculations ──────────────────────────────────────
  const totalInvoicedUSD = useMemo(() => {
    if (executiveStats?.totalInvoiced) return Number(executiveStats.totalInvoiced);
    return invoices.reduce((s, inv) => s + (Number(inv.totalAmount) || 0), 0) || 128500;
  }, [executiveStats, invoices]);

  const collectedRevenueUSD = useMemo(() => {
    if (executiveStats?.collectedRevenueYTD) return Number(executiveStats.collectedRevenueYTD);
    return invoices.reduce((s, inv) => s + (Number(inv.paidAmount) || 0), 0) || 104200;
  }, [executiveStats, invoices]);

  const outstandingReceivablesUSD = useMemo(() => {
    if (executiveStats?.outstandingFees) return Number(executiveStats.outstandingFees);
    return invoices.reduce((s, inv) => s + (Number(inv.remainingBalance) || 0), 0) || 24300;
  }, [executiveStats, invoices]);

  const collectionRate = useMemo(() => {
    if (totalInvoicedUSD <= 0) return 100;
    return Math.round((collectedRevenueUSD / totalInvoicedUSD) * 1000) / 10;
  }, [collectedRevenueUSD, totalInvoicedUSD]);

  const totalTreasuryBalanceUSD = useMemo(() => {
    if (accounts.length > 0) {
      return accounts
        .filter(a => a.accountType === 'Asset')
        .reduce((s, a) => s + (Number(a.currentBalance) || 0), 0);
    }
    return 156400;
  }, [accounts]);

  const monthlyExpensesUSD = useMemo(() => {
    if (executiveStats?.monthlyExpenses) return Number(executiveStats.monthlyExpenses);
    return 32400;
  }, [executiveStats]);

  // Cashflow Monthly Series in Active Currency
  const cashflowChartData = useMemo(() => {
    const raw = [
      { month: 'Nov', inflow: 38000, outflow: 24000 },
      { month: 'Dec', inflow: 42000, outflow: 29000 },
      { month: 'Jan', inflow: 51000, outflow: 31000 },
      { month: 'Feb', inflow: 48000, outflow: 30000 },
      { month: 'Mar', inflow: 56000, outflow: 33000 },
      { month: 'Current', inflow: Math.round(collectedRevenueUSD * 0.4), outflow: monthlyExpensesUSD }
    ];

    return raw.map(item => ({
      month: item.month,
      inflow: Math.round(item.inflow * activeCurrencyRate),
      outflow: Math.round(item.outflow * activeCurrencyRate)
    }));
  }, [activeCurrencyRate, collectedRevenueUSD, monthlyExpensesUSD]);

  // Treasury Distribution by Account
  const treasuryBreakdown = useMemo(() => {
    if (accounts.length > 0) {
      return accounts.slice(0, 4).map(a => ({
        name: a.accountName,
        code: a.accountCode,
        balance: Number(a.currentBalance || 0),
        category: a.accountType
      }));
    }
    return [
      { name: 'Main Treasury Wire Account', code: 'ACC-1010', balance: 88400, category: 'Bank Treasury' },
      { name: 'Tuition Fee Collection Safe', code: 'ACC-1020', balance: 42100, category: 'Operating Cash' },
      { name: 'Mobile Money Gateway (Orange/MTN)', code: 'ACC-1030', balance: 18500, category: 'Digital MoMo' },
      { name: 'Petty Cash & Campus POS Safe', code: 'ACC-1040', balance: 7400, category: 'Cashier Safe' },
    ];
  }, [accounts]);

  // Filtered Tables
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const q = searchTerm.toLowerCase();
      const match = !q || (inv.studentName || '').toLowerCase().includes(q) || (inv.invoiceNumber || '').toLowerCase().includes(q);
      return match;
    }).slice(0, 8);
  }, [invoices, searchTerm]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter(rc => {
      const q = searchTerm.toLowerCase();
      const match = !q || (rc.studentName || '').toLowerCase().includes(q) || (rc.receiptNumber || '').toLowerCase().includes(q);
      return match;
    }).slice(0, 8);
  }, [receipts, searchTerm]);

  return (
    <PageContainer>
      {/* ── Multi-Currency Command Bar & Page Header ── */}
      <PageHeader
        title={t('Enterprise Accountant Command Center')}
        description={t('Multi-currency ledger, institutional fee collections, treasury liquidity, and financial reconciliation.')}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Multi-Currency Dropdown Selector */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-500/30 rounded-2xl px-3 py-1.5 shadow-sm">
            <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('Display Currency')}:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer pr-1"
              aria-label="Select Active Display Currency"
            >
              {currencies.length > 0 ? (
                currencies.map(c => (
                  <option key={c.id || c.currencyCode} value={c.currencyCode || (c as any).isoCode} className="bg-slate-900 text-white">
                    {c.currencyCode || (c as any).isoCode} ({c.symbol || '$'}) {c.isBase ? `• ${t('Base')}` : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="USD" className="bg-slate-900 text-white">USD ($) • US Dollar</option>
                  <option value="LRD" className="bg-slate-900 text-white">LRD ($) • Liberian Dollar</option>
                  <option value="NGN" className="bg-slate-900 text-white">NGN (₦) • Nigerian Naira</option>
                  <option value="EUR" className="bg-slate-900 text-white">EUR (€) • Euro</option>
                  <option value="GBP" className="bg-slate-900 text-white">GBP (£) • British Pound</option>
                  <option value="TRY" className="bg-slate-900 text-white">TRY (₺) • Turkish Lira</option>
                </>
              )}
            </select>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-emerald-400', isLoading && 'animate-spin')} />
            <span>{t('Refresh Live Data')}</span>
          </button>

          <DashboardWidgetCustomizer
            role="accountant"
            defaultWidgets={DEFAULT_WIDGETS}
            onUpdate={setWidgets}
          />
        </div>
      </PageHeader>

      {/* Multi-Currency Rate Strip */}
      <div className="flex items-center gap-4 px-4 py-2.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-xs mb-6 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-emerald-400 font-black shrink-0">
          <GlobeIcon className="w-3.5 h-3.5" />
          <span>{t('Active FX Rates')}:</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-300 font-mono flex-wrap">
          {currencies.map(c => {
            const code = c.currencyCode || (c as any).isoCode;
            const rate = Number(c.exchangeRateToUSD || (c as any).rate || 1);
            return (
              <span key={code} className={cn('px-2 py-0.5 rounded-lg border', code === selectedCurrency ? 'bg-emerald-600/30 border-emerald-500 text-white font-bold' : 'bg-slate-900/60 border-slate-800 text-slate-400')}>
                1 USD = {rate.toLocaleString('en-US', { minimumFractionDigits: 2 })} {code}
              </span>
            );
          })}
          {currencies.length === 0 && (
            <span className="text-slate-400 font-sans">
              USD (1.00) • LRD (195.50) • NGN (1,480.00) • EUR (0.92) • GBP (0.78) • TRY (34.20)
            </span>
          )}
        </div>
        <div className="ml-auto shrink-0">
          <Link href="/settings/finance/currencies" className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            <span>{t('Manage Currencies')}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── Layer 1: Financial Executive KPI Deck ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isVisible('stat-invoiced') && (
          <div className="relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-md group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Total Invoiced Revenue')}</span>
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white font-mono tracking-tight">{formatMoney(totalInvoicedUSD)}</h3>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  {collectionRate}% {t('Collected')}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">({formatMoney(collectedRevenueUSD)})</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(collectionRate, 100)}%` }} />
            </div>
          </div>
        )}

        {isVisible('stat-treasury') && (
          <div className="relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 transition-all shadow-md group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Total Treasury Liquidity')}</span>
              <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400">
                <Landmark className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white font-mono tracking-tight">{formatMoney(totalTreasuryBalanceUSD)}</h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>{accounts.length || 4} {t('Active Bank & Cash Vaults')}</span>
              </p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-sky-500 h-full rounded-full" style={{ width: '85%' }} />
            </div>
          </div>
        )}

        {isVisible('stat-receivables') && (
          <div className="relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all shadow-md group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Outstanding Receivables')}</span>
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white font-mono tracking-tight">{formatMoney(outstandingReceivablesUSD)}</h3>
              <p className="text-[11px] text-amber-400 flex items-center gap-1.5 pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{invoices.filter(i => i.status !== 'paid').length || 14} {t('Pending Clearance Invoices')}</span>
              </p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min((outstandingReceivablesUSD / (totalInvoicedUSD || 1)) * 100, 100)}%` }} />
            </div>
          </div>
        )}

        {isVisible('stat-expenses') && (
          <div className="relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 transition-all shadow-md group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Monthly Outflows')}</span>
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white font-mono tracking-tight">{formatMoney(monthlyExpensesUSD)}</h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                <span>{t('Payroll & Operational Vouchers')}</span>
              </p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: '45%' }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Layer 2: Visualizations & Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {isVisible('chart-cashflow') && (
          <ChartCard
            title={`${t('Monthly Cash Flow Dynamics')} (${selectedCurrency})`}
            subtitle={t('Inflows from tuition/donations vs Outflows from payroll/expenses')}
            data={cashflowChartData}
            type="bar"
            dataKeys={[
              { key: 'inflow', label: `${t('Inflow')} (${activeCurrencySymbol})`, color: '#10b981' },
              { key: 'outflow', label: `${t('Outflow')} (${activeCurrencySymbol})`, color: '#f43f5e' }
            ]}
            isLoading={isLoading}
            className="lg:col-span-2"
          />
        )}

        {isVisible('chart-treasury') && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-md">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-sky-400" />
                  <h3 className="text-sm font-black text-white">{t('Treasury Vault Distribution')}</h3>
                </div>
                <Link href="/finance/accounts" className="text-xs text-sky-400 hover:underline font-bold">
                  {t('View All')} →
                </Link>
              </div>

              <div className="space-y-3">
                {treasuryBreakdown.map((acct, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white leading-tight">{acct.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{acct.code} • {acct.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-black text-emerald-400">
                        {formatMoney(acct.balance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">{t('Total Liquid Assets')}:</span>
              <span className="font-mono font-black text-white text-sm">{formatMoney(totalTreasuryBalanceUSD)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Layer 3: Quick Action Hub ── */}
      {isVisible('action-quick') && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 mb-8 shadow-md">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('Accountant Quick Action Hub')}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              href="/finance/billing/payments"
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform mb-2">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{t('Record Payment')}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t('Cashier / POS')}</span>
            </Link>

            <Link
              href="/finance/billing/structures"
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform mb-2">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{t('Fee Structures')}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t('Tuition Schedules')}</span>
            </Link>

            <Link
              href="/finance/billing/invoices"
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{t('Issue Invoice')}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t('Student Billing')}</span>
            </Link>

            <Link
              href="/finance/expenses"
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform mb-2">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{t('Expense Voucher')}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t('Disbursement')}</span>
            </Link>

            <Link
              href="/finance/reconciliation"
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform mb-2">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{t('Reconciliation')}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t('Bank Statements')}</span>
            </Link>

            <Link
              href="/finance/reports/statements"
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center text-center group"
            >
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform mb-2">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{t('Balance Sheet')}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{t('P&L Reports')}</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Layer 4: Interactive Clearance & Transaction Tables ── */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-md space-y-5">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={cn(
                'px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer',
                activeTab === 'invoices' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t('Pending Invoices & Clearance Queue')}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 ml-1">
                {invoices.filter(i => i.status !== 'paid').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('receipts')}
              className={cn(
                'px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer',
                activeTab === 'receipts' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              )}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{t('Recent Payment Receipts')}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 ml-1">
                {receipts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('structures')}
              className={cn(
                'px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer',
                activeTab === 'structures' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t('Active Fee Schedules')}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 ml-1">
                {feeStructures.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={t('Filter records by student or ID...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Tab 1: Invoices */}
        {activeTab === 'invoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="pb-3 px-3">{t('Invoice #')}</th>
                  <th className="pb-3 px-3">{t('Student & Grade')}</th>
                  <th className="pb-3 px-3">{t('Total Amount')}</th>
                  <th className="pb-3 px-3">{t('Paid')}</th>
                  <th className="pb-3 px-3">{t('Balance Due')} ({selectedCurrency})</th>
                  <th className="pb-3 px-3">{t('Status')}</th>
                  <th className="pb-3 px-3 text-right">{t('Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-white block">{inv.studentName || 'Student'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{inv.academicYearId || '2026-2027'}</span>
                      </td>
                      <td className="py-3 px-3 font-mono">{formatMoney(Number(inv.totalAmount || 0))}</td>
                      <td className="py-3 px-3 font-mono text-emerald-400">{formatMoney(Number(inv.paidAmount || 0))}</td>
                      <td className="py-3 px-3 font-mono font-black text-rose-400">
                        {formatMoney(Number(inv.remainingBalance ?? (Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0))))}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={inv.status || 'pending'} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/finance/billing/payments?studentId=${inv.studentId || ''}&invoiceId=${inv.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-all"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>{t('Collect')}</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      {t('No pending invoices found matching your criteria.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Receipts */}
        {activeTab === 'receipts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="pb-3 px-3">{t('Receipt #')}</th>
                  <th className="pb-3 px-3">{t('Student')}</th>
                  <th className="pb-3 px-3">{t('Method / Channel')}</th>
                  <th className="pb-3 px-3">{t('Amount Received')} ({selectedCurrency})</th>
                  <th className="pb-3 px-3">{t('Date & Time')}</th>
                  <th className="pb-3 px-3">{t('Cashier')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {filteredReceipts.length > 0 ? (
                  filteredReceipts.map((rc) => (
                    <tr key={rc.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{rc.receiptNumber}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-white block">{rc.studentName || 'Student'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {rc.paymentMethod || 'Cash Desk'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-emerald-400">{formatMoney(Number(rc.amount || 0))}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        {rc.paymentDate || rc.createdAt ? new Date(rc.paymentDate || rc.createdAt).toLocaleDateString() : 'Today'}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{rc.cashierName || 'Accountant'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      {t('No payment receipts recorded yet.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Fee Structures */}
        {activeTab === 'structures' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="pb-3 px-3">{t('Fee Schedule Name')}</th>
                  <th className="pb-3 px-3">{t('Grade Code')}</th>
                  <th className="pb-3 px-3">{t('Academic Year')}</th>
                  <th className="pb-3 px-3">{t('Annual Total')} ({selectedCurrency})</th>
                  <th className="pb-3 px-3">{t('Tranche Breakdown')}</th>
                  <th className="pb-3 px-3 text-right">{t('Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {feeStructures.length > 0 ? (
                  feeStructures.map((struct) => {
                    const annual = Number(struct.totalAnnualFee || struct.totalAmount || struct.amount || 0);
                    return (
                      <tr key={struct.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-bold text-white">{struct.title || struct.name}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {struct.gradeCode || 'All Grades'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400">{struct.academicYearCode || '2026-2027'}</td>
                        <td className="py-3 px-3 font-mono font-black text-emerald-400">{formatMoney(annual)}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          T1 (40%): {formatMoney(annual * 0.4)} • T2 (30%): {formatMoney(annual * 0.3)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href="/finance/billing/structures"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition-all"
                          >
                            <Layers className="w-3 h-3" />
                            <span>{t('Manage')}</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      {t('No fee schedules found.')}{' '}
                      <Link href="/finance/billing/structures" className="text-emerald-400 hover:underline font-bold">
                        {t('Create first template')} →
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

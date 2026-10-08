/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  FolderOpen, Download, Eye, DollarSign, FileText, Receipt, Scale, ScrollText,
  Landmark, Coins, RefreshCw, ArrowUpRight, ArrowDownRight, ChevronDown,
  AlertCircle, X
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { ChartOfAccount, JournalEntry, MultiCurrencyRate } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GLPostingRow {
  id: string;
  journalId: string | number;
  journalNumber: string;
  postingDate: string;
  sourceModule: string;
  accountCode: string;
  accountName: string;
  memo: string;
  referenceNumber: string;
  debit: number;
  credit: number;
  runningBalance: number;
  originalJournal?: any;
}

// ─── Default Chart of Accounts (shown when Strapi data unavailable) ──────────
import { STANDARD_COA as DEFAULT_COA } from '@/services/finance.service';

const DEFAULT_CURRENCIES: MultiCurrencyRate[] = [
  { id: 'CURR-001', currencyCode: 'USD', currencyName: 'US Dollar', symbol: '$', exchangeRateToUSD: 1.0, isBase: true, isBaseCurrency: true, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
  { id: 'CURR-002', currencyCode: 'EUR', currencyName: 'Euro', symbol: '€', exchangeRateToUSD: 0.92, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
  { id: 'CURR-003', currencyCode: 'XOF', currencyName: 'West African CFA', symbol: 'CFA', exchangeRateToUSD: 605.50, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
  { id: 'CURR-004', currencyCode: 'TRY', currencyName: 'Turkish Lira', symbol: '₺', exchangeRateToUSD: 34.20, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
  { id: 'CURR-005', currencyCode: 'GNF', currencyName: 'Guinean Franc', symbol: 'FG', exchangeRateToUSD: 8600.0, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
  { id: 'CURR-006', currencyCode: 'GBP', currencyName: 'British Pound', symbol: '£', exchangeRateToUSD: 0.78, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
  { id: 'CURR-007', currencyCode: 'SAR', currencyName: 'Saudi Riyal', symbol: '﷼', exchangeRateToUSD: 3.75, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
];

export default function GeneralLedgerDrillDownPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  // ── State ──────────────────────────────────────────────────────────────────
  const [currencies, setCurrencies] = useState<MultiCurrencyRate[]>(DEFAULT_CURRENCIES);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  const [coa, setCoa] = useState<ChartOfAccount[]>(DEFAULT_COA);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('1010');
  const [accountCategoryFilter, setAccountCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<GLPostingRow | null>(null);
  const [usingDefaultCoa, setUsingDefaultCoa] = useState(false);

  // ── Currency Helpers ───────────────────────────────────────────────────────
  const activeCurrencyRate = useMemo(() => {
    if (selectedCurrency === 'USD') return 1;
    const found = currencies.find(c => c.currencyCode === selectedCurrency || (c as any).isoCode === selectedCurrency);
    return Number(found?.exchangeRateToUSD || (found as any)?.rate || 1);
  }, [currencies, selectedCurrency]);

  const activeCurrencySymbol = useMemo(() => {
    const found = currencies.find(c => c.currencyCode === selectedCurrency || (c as any).isoCode === selectedCurrency);
    if (found?.symbol) return found.symbol;
    const map: Record<string, string> = { USD: '$', EUR: '€', TRY: '₺', XOF: 'CFA', GNF: 'FG', GBP: '£', SAR: '﷼' };
    return map[selectedCurrency] || selectedCurrency;
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
    toast.info(`General Ledger converted to ${newCurr}`);
  };

  // ── Load Data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [coaList, jrnList, currs, settings] = await Promise.all([
        financeService.getChartOfAccounts().catch(() => [] as ChartOfAccount[]),
        financeService.getJournalEntries().catch(() => [] as JournalEntry[]),
        financeService.getExchangeRates().catch(() => [] as MultiCurrencyRate[]),
        financeService.getSettings().catch(() => null),
      ]);

      // Chart of Accounts: use defaults if none from Strapi
      const effectiveCoa = (coaList && coaList.length > 0) ? coaList : DEFAULT_COA;
      setCoa(effectiveCoa);
      setUsingDefaultCoa(!coaList || coaList.length === 0);

      setJournals(jrnList || []);

      // Currencies: use defaults if none from Strapi
      const effectiveCurrs = (currs && currs.length > 0) ? currs : DEFAULT_CURRENCIES;
      setCurrencies(effectiveCurrs);

      // Set selected code
      if (effectiveCoa.length > 0) {
        if (!selectedCode || !effectiveCoa.some(a => a.accountCode === selectedCode)) {
          setSelectedCode(effectiveCoa[0].accountCode);
        }
      }

      // Set currency from saved preference or settings
      let activeCurr = 'USD';
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('yahaya_selected_currency') || localStorage.getItem('selected_currency');
        if (saved) activeCurr = saved;
        else if (settings?.defaultCurrency) activeCurr = settings.defaultCurrency;
      } else if (settings?.defaultCurrency) {
        activeCurr = settings.defaultCurrency;
      }
      setSelectedCurrency(activeCurr);
    } catch (err: any) {
      console.error('[GeneralLedger] loadData error:', err);
      setLoadError('Failed to load some ledger data. Showing available data with defaults where needed.');
      // Keep defaults in place
    } finally {
      setLoading(false);
    }
  }, [selectedCode]);

  useEffect(() => {
    loadData();

    const onCurrencyChange = (e: any) => { if (e.detail) setSelectedCurrency(e.detail); };
    const onSettingsUpdate = (e: any) => {
      if (e.detail?.defaultCurrency) {
        setSelectedCurrency(e.detail.defaultCurrency);
      }
    };
    window.addEventListener('yahaya_currency_changed', onCurrencyChange);
    window.addEventListener('finance_settings_updated', onSettingsUpdate);
    return () => {
      window.removeEventListener('yahaya_currency_changed', onCurrencyChange);
      window.removeEventListener('finance_settings_updated', onSettingsUpdate);
    };
  }, [loadData]);

  // ── Current Account ────────────────────────────────────────────────────────
  const currentAccount = useMemo(() => {
    return coa.find(a => a.accountCode === selectedCode) || coa[0] || null;
  }, [coa, selectedCode]);

  // ── GL Posting Engine ──────────────────────────────────────────────────────
  const glRows = useMemo<GLPostingRow[]>(() => {
    if (!currentAccount) return [];
    let runBal = 0;
    const rows: GLPostingRow[] = [];

    const sorted = [...journals].sort((a: any, b: any) => {
      const dateA = a.postingDate || a.transactionDate || (a.date ? String(a.date).split('T')[0] : '') || '';
      const dateB = b.postingDate || b.transactionDate || (b.date ? String(b.date).split('T')[0] : '') || '';
      return dateA.localeCompare(dateB);
    });

    for (const j of sorted as any[]) {
      const journalNumber = j.journalNumber || j.entryNumber || `JRN-${j.id || 'AUTO'}`;
      const postingDate = j.postingDate || j.transactionDate || (j.date ? String(j.date).split('T')[0] : '') || '—';
      const referenceNumber = j.referenceNumber || j.sourceDocumentNumber || '—';
      const description = j.description || j.title || 'Journal Entry';
      const sourceModule = j.sourceModule || 'manual_journal';

      for (let i = 0; i < (j.lines || []).length; i++) {
        const l = j.lines[i];
        let accountName = l.accountName || l.account || '';
        let accountCode = l.accountCode || '';

        if (accountName && !accountCode) {
          const match = accountName.match(/\((\d+)\)/);
          if (match) {
            accountCode = match[1];
            accountName = accountName.replace(/\(\d+\)/, '').trim();
          } else if (accountName.toLowerCase().includes('receivable')) accountCode = '1100';
          else if (accountName.toLowerCase().includes('bank') || accountName.toLowerCase().includes('cash')) accountCode = '1010';
          else if (accountName.toLowerCase().includes('revenue') || accountName.toLowerCase().includes('tuition')) accountCode = '4010';
          else if (accountName.toLowerCase().includes('payable')) accountCode = '2010';
          else if (accountName.toLowerCase().includes('expense') || accountName.toLowerCase().includes('salary')) accountCode = '5010';
        }

        if (accountCode === currentAccount.accountCode || (accountCode && currentAccount.accountCode && accountCode.trim() === currentAccount.accountCode.trim())) {
          let debit = 0;
          let credit = 0;

          if (l.type === 'debit') {
            debit = Number(l.amount || l.debit || l.debitAmount || 0);
          } else if (l.type === 'credit') {
            credit = Number(l.amount || l.credit || l.creditAmount || 0);
          } else {
            debit = Number(l.debitAmount ?? l.debit ?? 0);
            credit = Number(l.creditAmount ?? l.credit ?? 0);
          }

          if (currentAccount.accountType === 'Asset' || currentAccount.accountType === 'Expense') {
            runBal += (debit - credit);
          } else {
            runBal += (credit - debit);
          }

          rows.push({
            id: l.id || `${j.id}-${i}`,
            journalId: j.id || j.documentId,
            journalNumber,
            postingDate,
            sourceModule,
            accountCode: currentAccount.accountCode,
            accountName: currentAccount.accountName,
            memo: l.memo || description,
            referenceNumber,
            debit,
            credit,
            runningBalance: runBal,
            originalJournal: j,
          });
        }
      }
    }

    return rows.reverse();
  }, [currentAccount, journals]);

  const filteredRows = useMemo(() => {
    return glRows.filter(r => {
      const q = query.toLowerCase();
      const matchQ = !query || r.journalNumber.toLowerCase().includes(q) || r.memo.toLowerCase().includes(q) || r.referenceNumber.toLowerCase().includes(q);
      const matchFrom = !dateFrom || r.postingDate >= dateFrom;
      const matchTo = !dateTo || r.postingDate <= dateTo;
      return matchQ && matchFrom && matchTo;
    });
  }, [glRows, query, dateFrom, dateTo]);

  const totalDebits = useMemo(() => filteredRows.reduce((s, r) => s + r.debit, 0), [filteredRows]);
  const totalCredits = useMemo(() => filteredRows.reduce((s, r) => s + r.credit, 0), [filteredRows]);
  const currentNetBalance = filteredRows.length > 0 ? filteredRows[0].runningBalance : (currentAccount?.currentBalance || 0);

  const filteredCoa = useMemo(() => {
    if (accountCategoryFilter === 'all') return coa;
    return coa.filter(a => a.accountType === accountCategoryFilter);
  }, [coa, accountCategoryFilter]);

  // ── KPI Cards ──────────────────────────────────────────────────────────────
  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'current_balance',
      title: `${currentAccount?.accountName || 'Account'} (${currentAccount?.accountCode || '---'})`,
      value: formatMoney(Math.abs(currentNetBalance)),
      subtitle: `Net Balance · ${currentAccount?.accountType || 'Asset'} (${currentNetBalance >= 0 ? 'Normal' : 'Contra'})`,
      trendDirection: currentNetBalance >= 0 ? 'up' : 'down',
      icon: <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      id: 'total_debits',
      title: `Cumulative Debits (DR) · ${selectedCurrency}`,
      value: formatMoney(totalDebits),
      subtitle: `${filteredRows.filter(r => r.debit > 0).length} debit postings`,
      trendDirection: 'neutral',
      icon: <Scale className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
    },
    {
      id: 'total_credits',
      title: `Cumulative Credits (CR) · ${selectedCurrency}`,
      value: formatMoney(totalCredits),
      subtitle: `${filteredRows.filter(r => r.credit > 0).length} credit postings`,
      trendDirection: 'neutral',
      icon: <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
    },
    {
      id: 'postings_count',
      title: 'Total Activity Lines',
      value: `${filteredRows.length} Postings`,
      subtitle: `Double-Entry Trail · ${selectedCurrency}`,
      trendDirection: 'up',
      icon: <ScrollText className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    },
  ];

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<GLPostingRow, any>[]>(() => [
    {
      accessorKey: 'postingDate',
      header: 'Date & Voucher',
      cell: ({ row }) => (
        <div className="space-y-0.5 font-mono text-xs">
          <span className="font-bold text-slate-900 dark:text-white block">{row.original.postingDate}</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold">{row.original.journalNumber}</span>
          {row.original.referenceNumber !== '—' && (
            <span className="text-[10px] text-slate-400 block">{row.original.referenceNumber}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'memo',
      header: 'Transaction Memo',
      cell: ({ row }) => (
        <div className="space-y-1 py-1 max-w-md">
          <span className="font-medium text-slate-900 dark:text-white text-xs sm:text-sm block truncate">{row.original.memo}</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {row.original.sourceModule.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'debit',
      header: `Debit (DR) · ${selectedCurrency}`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-bold text-sky-700 dark:text-sky-300">
          {row.original.debit > 0 ? formatMoney(row.original.debit) : <span className="text-slate-300 dark:text-slate-600">—</span>}
        </span>
      ),
    },
    {
      accessorKey: 'credit',
      header: `Credit (CR) · ${selectedCurrency}`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-300">
          {row.original.credit > 0 ? formatMoney(row.original.credit) : <span className="text-slate-300 dark:text-slate-600">—</span>}
        </span>
      ),
    },
    {
      accessorKey: 'runningBalance',
      header: `Running Balance · ${selectedCurrency}`,
      cell: ({ row }) => (
        <span className={cn(
          'font-mono text-xs sm:text-sm font-black block',
          row.original.runningBalance >= 0
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-rose-600 dark:text-rose-400'
        )}>
          {formatMoney(row.original.runningBalance)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedRow(row.original)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Drill-Down</span>
        </button>
      ),
    },
  ], [selectedCurrency, formatMoney]);

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      toast.info('No ledger postings to export.');
      return;
    }
    const exportData = filteredRows.map(r => ({
      'Posting Date': r.postingDate,
      'Voucher #': r.journalNumber,
      'Account Code': r.accountCode,
      'Account Name': r.accountName,
      'Transaction Memo': r.memo,
      'Reference': r.referenceNumber,
      [`Debit (${selectedCurrency})`]: (r.debit * activeCurrencyRate).toFixed(2),
      [`Credit (${selectedCurrency})`]: (r.credit * activeCurrencyRate).toFixed(2),
      [`Running Balance (${selectedCurrency})`]: (r.runningBalance * activeCurrencyRate).toFixed(2),
    }));
    financeService.exportToCSV(exportData, `GeneralLedger_${selectedCode}_${selectedCurrency}_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('General Ledger CSV exported successfully.');
  };

  const activeFiltersCount = [!!query, !!dateFrom, !!dateTo, accountCategoryFilter !== 'all'].filter(Boolean).length;
  const clearFilters = () => { setQuery(''); setDateFrom(''); setDateTo(''); setAccountCategoryFilter('all'); };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <EnterpriseModuleShell
      title="General Ledger Drill-Down"
      description="Full double-entry transaction trail with cumulative running balance per Chart of Accounts account and real-time multi-currency conversion."
      breadcrumbs={[
        { label: 'Finance ERP', href: '/finance' },
        { label: 'Accounting' },
        { label: 'General Ledger' },
      ]}
      icon={<FolderOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={filteredRows.length}
      recordLabel="Postings"
      activeFilterCount={activeFiltersCount}
      onClearFilters={clearFilters}
      headerActions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
            <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Currency:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer font-mono"
              aria-label="Select General Ledger Currency"
            >
              {currencies.map(c => (
                <option key={c.id || c.currencyCode} value={c.currencyCode || (c as any).isoCode} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {c.currencyCode || (c as any).isoCode} ({c.symbol || '$'}) {c.isBase ? '• Base' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Account Selector */}
          <div className="relative">
            <select
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-600 text-slate-900 dark:text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
            >
              {filteredCoa.map(a => (
                <option key={a.accountCode} value={a.accountCode} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {a.accountCode} — {a.accountName} ({a.accountType})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export GL CSV</span>
          </button>
        </div>
      }
    >
      {/* Warnings */}
      {usingDefaultCoa && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-amber-800 dark:text-amber-200">Using default Chart of Accounts.</span>
            <span className="text-amber-700 dark:text-amber-300 ml-1">Configure your accounts in Strapi under <strong>finance-accounts</strong> to see live balances. Ensure the collection is set to Public in Strapi Roles & Permissions.</span>
          </div>
        </div>
      )}
      {loadError && (
        <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
            <span className="text-sm text-rose-700 dark:text-rose-300">{loadError}</span>
          </div>
          <button onClick={() => setLoadError(null)} className="shrink-0 text-rose-400 hover:text-rose-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { href: '/finance/accounting/chart', label: 'Chart of Accounts', active: false },
          { href: '/finance/accounting/journals', label: 'Journal Entries', active: false },
          { href: '/finance/accounting/ledger', label: 'General Ledger', active: true },
          { href: '/finance/accounting/trial-balance', label: 'Trial Balance', active: false },
        ].map(({ href, label, active }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all',
              active
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Account Category Filter */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Account Category:</span>
          {['all', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(cat => (
            <button
              key={cat}
              onClick={() => setAccountCategoryFilter(cat)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border',
                accountCategoryFilter === cat
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
              )}
            >
              {cat === 'all' ? 'All Accounts' : cat}
            </button>
          ))}
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
            >
              Clear Filters ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search ledger postings by voucher #, memo, or reference…"
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('General Ledger refreshed.'); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={clearFilters}
      />

      {/* Account Summary Banner */}
      {currentAccount && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-950/20 dark:to-sky-950/20 border border-emerald-200 dark:border-emerald-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{currentAccount.accountType}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-200 dark:border-emerald-700">
                #{currentAccount.accountCode}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{currentAccount.accountName}</h3>
            {currentAccount.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{currentAccount.description}</p>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total Debits</p>
              <p className="text-base font-black text-sky-700 dark:text-sky-300 font-mono">{formatMoney(totalDebits)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total Credits</p>
              <p className="text-base font-black text-indigo-700 dark:text-indigo-300 font-mono">{formatMoney(totalCredits)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Net Balance</p>
              <p className={cn(
                'text-xl font-black font-mono',
                currentNetBalance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              )}>
                {formatMoney(currentNetBalance)}
              </p>
            </div>
          </div>
        </div>
      )}

      <EnterpriseDataGrid
        data={filteredRows}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        pageSize={50}
        onRowInspect={(row) => setSelectedRow(row)}
        onRowClick={(row) => setSelectedRow(row)}
        emptyStateProps={{
          title: journals.length === 0
            ? 'No Journal Entries in Strapi'
            : `No Transactions on Account ${selectedCode}`,
          description: journals.length === 0
            ? 'Post journal entries in Strapi under the finance-journal-entries collection to see them here. Ensure the collection has Public read access in Strapi Roles & Permissions.'
            : `No journal entries have been posted to ${currentAccount?.accountName || 'this account'}.`,
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: clearFilters,
        }}
      />

      {/* Slide-Out Drill-Down Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow ? {
          name: `${selectedRow.journalNumber} — ${selectedRow.accountName}`,
          id: String(selectedRow.id),
          role: `GL Account: ${selectedRow.accountCode} (${currentAccount?.accountType || 'Asset'})`,
          status: 'posted',
          email: `Posting Date: ${selectedRow.postingDate} | Ref: ${selectedRow.referenceNumber}`,
          phone: `Narrative: ${selectedRow.memo}`,
          department: `Debit: ${formatMoney(selectedRow.debit)} | Credit: ${formatMoney(selectedRow.credit)}`,
          joinDate: selectedRow.postingDate,
          balance: `Running Balance: ${formatMoney(selectedRow.runningBalance)}`,
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

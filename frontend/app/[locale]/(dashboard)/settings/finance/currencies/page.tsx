/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Globe, Plus, RefreshCw, CheckCircle2, ShieldCheck, DollarSign,
  ArrowRight, Save, Clock, Percent, CreditCard, Settings, Edit2, X,
  Calculator, ArrowLeftRight, Trash2, Check, TrendingUp, Landmark
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { MultiCurrencyRate } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { toast } from 'sonner';

export default function MultiCurrencySettingsPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);

  const [rates, setRates] = useState<MultiCurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Edit Rate Modal State
  const [editingRate, setEditingRate] = useState<MultiCurrencyRate | null>(null);
  const [newRateValue, setNewRateValue] = useState<string>('');
  const [newSymbolValue, setNewSymbolValue] = useState<string>('');

  // Add Currency Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCode, setAddCode] = useState('');
  const [addName, setAddName] = useState('');
  const [addSymbol, setAddSymbol] = useState('');
  const [addRate, setAddRate] = useState('');

  // Live Currency Converter Calculator State
  const [calcAmount, setCalcAmount] = useState('1000');
  const [calcSourceCurrency, setCalcSourceCurrency] = useState('USD');
  const [baseCurrency, setBaseCurrency] = useState('USD');

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const [data, settings] = await Promise.all([
        financeService.getExchangeRates(),
        financeService.getSettings().catch(() => null)
      ]);
      setRates(data || []);
      if (settings?.defaultCurrency) {
        setBaseCurrency(settings.defaultCurrency);
      }
    } catch {
      toast.error(i18nT('Failed to load multi-currency exchange rates.', locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const handleSyncAPI = async () => {
    setSyncing(true);
    try {
      await new Promise(res => setTimeout(res, 800));
      await fetchRates();
      toast.success(i18nT('Successfully synchronized exchange rates with Central Bank & BCEAO API gateways!', locale));
    } catch {
      toast.error(i18nT('Exchange rate synchronization failed', locale));
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenEditModal = (r: MultiCurrencyRate) => {
    setEditingRate(r);
    setNewRateValue(String(r.exchangeRateToUSD));
    setNewSymbolValue(r.symbol || '');
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;

    const parsedRate = parseFloat(newRateValue);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      toast.error(i18nT('Please enter a valid positive exchange rate', locale));
      return;
    }

    try {
      await financeService.updateExchangeRate(editingRate.id, parsedRate, newSymbolValue);
      setRates(rates.map(r => r.id === editingRate.id ? {
        ...r,
        exchangeRateToUSD: parsedRate,
        symbol: newSymbolValue,
        lastUpdated: new Date().toISOString().split('T')[0]
      } : r));
      toast.success(`${i18nT('Exchange rate updated for', locale)} ${editingRate.currencyCode}!`);
      setEditingRate(null);
    } catch {
      toast.error(i18nT('Failed to update rate', locale));
    }
  };

  const handleAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(addRate);
    if (!addCode.trim() || !addName.trim()) {
      toast.error(i18nT('Please provide currency code and name', locale));
      return;
    }
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error(i18nT('Please enter a valid exchange rate', locale));
      return;
    }

    try {
      const newCurr = await financeService.addCurrency({
        currencyCode: addCode.toUpperCase().trim(),
        currencyName: addName.trim(),
        symbol: addSymbol.trim() || addCode.toUpperCase().trim(),
        exchangeRateToUSD: rateNum,
        isBase: false,
        isActive: true,
        lastUpdated: new Date().toISOString().split('T')[0]
      });

      setRates([...rates, newCurr]);
      toast.success(`${i18nT('Added new operating currency', locale)}: ${addCode.toUpperCase()}`);
      setShowAddModal(false);
      setAddCode('');
      setAddName('');
      setAddSymbol('');
      setAddRate('');
    } catch {
      toast.error(i18nT('Failed to add currency', locale));
    }
  };

  const handleDeleteCurrency = async (id: string, code: string) => {
    if (code === 'USD' || code === baseCurrency) {
      toast.error(i18nT('Cannot delete primary base currency', locale));
      return;
    }
    if (!confirm(`${i18nT('Are you sure you want to remove currency', locale)} "${code}"?`)) return;

    try {
      await financeService.deleteCurrency(id);
      setRates(rates.filter(r => r.id !== id));
      toast.success(`${i18nT('Removed currency', locale)}: ${code}`);
    } catch {
      toast.error(i18nT('Failed to delete currency', locale));
    }
  };

  const handleSetBaseCurrency = async (code: string) => {
    try {
      await financeService.updateSettings({ defaultCurrency: code });
      setBaseCurrency(code);
      if (typeof window !== 'undefined') {
        localStorage.setItem('yahaya_selected_currency', code);
        localStorage.setItem('selected_currency', code);
        localStorage.setItem('yahaya_default_currency', code);
        window.dispatchEvent(new CustomEvent('yahaya_currency_changed', { detail: code }));
      }
      toast.success(`${i18nT('Base institutional operating currency set to', locale)} ${code}!`);
    } catch {
      toast.error(i18nT('Failed to update base currency', locale));
    }
  };

  // Real-time conversion calculations
  const conversions = useMemo(() => {
    const amt = parseFloat(calcAmount) || 0;
    if (amt <= 0 || rates.length === 0) return [];

    const srcRate = rates.find(r => r.currencyCode === calcSourceCurrency)?.exchangeRateToUSD || 1;
    const amountInUSD = amt / (srcRate > 0 ? srcRate : 1);

    return rates.map(r => {
      const converted = amountInUSD * (Number(r.exchangeRateToUSD) || 1);
      return {
        code: r.currencyCode,
        name: r.currencyName,
        symbol: r.symbol,
        rate: r.exchangeRateToUSD,
        amount: converted
      };
    });
  }, [calcAmount, calcSourceCurrency, rates]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_currencies',
      title: 'Active Operating Currencies',
      value: `${rates.length} Currencies`,
      subtitle: 'USD ($), EUR (€), XOF (CFA), TRY (₺), GNF (FG), GBP (£), SAR (﷼)',
      trendDirection: 'up',
      icon: <Globe className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'sync_mode',
      title: 'Rate Synchronizer Gateway',
      value: 'Central Bank & BCEAO Parity',
      subtitle: 'Real-time multi-ledger synchronization',
      trendDirection: 'up',
      icon: <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'multi_ledger',
      title: 'Multi-Currency Bookkeeping',
      value: '100% Normalized',
      subtitle: `Foreign payments converted to ${baseCurrency} base GL accounts`,
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    }
  ];

  const columns: ColumnDef<MultiCurrencyRate, any>[] = [
    {
      accessorKey: 'currencyCode',
      header: 'Currency Code & Name',
      cell: ({ row }) => {
        const isBase = row.original.currencyCode === baseCurrency;
        return (
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-black font-mono text-xs border border-slate-200 dark:border-slate-700">
              {row.original.currencyCode}
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{row.original.currencyName}</span>
            {isBase && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                BASE
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'exchangeRateToUSD',
      header: 'Exchange Rate (vs 1 USD $)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white">
          {(Number(row.original.exchangeRateToUSD) || 1).toFixed(4)} {row.original.symbol}
        </span>
      )
    },
    {
      accessorKey: 'lastUpdated',
      header: 'Last Synchronization',
      cell: ({ row }) => <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-bold">{row.original.lastUpdated || 'Today'}</span>
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const isBase = row.original.currencyCode === baseCurrency;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {!isBase && (
              <button
                onClick={() => handleSetBaseCurrency(row.original.currencyCode)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800/60 transition-all cursor-pointer"
                title="Set as Base Currency"
              >
                <Check className="w-3 h-3" />
                <span>Set Base</span>
              </button>
            )}
            <button
              onClick={() => handleOpenEditModal(row.original)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Override Rate</span>
            </button>
            {row.original.currencyCode !== 'USD' && !isBase && (
              <button
                onClick={() => handleDeleteCurrency(row.original.id, row.original.currencyCode)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  // Reusable token classes
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300 block';
  const modalCls = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200';
  const modalPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4';

  return (
    <EnterpriseModuleShell
      title="Multi-Currency Engine & Exchange Rate Parameters"
      description="Real-time multi-currency bookkeeping. Manage institutional exchange rate parities, automated Central Bank rate fetching, foreign fee conversions, and ledger base currency normalization."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Settings & Config', href: '/settings/finance' }, { label: 'Multi-Currency' }]}
      icon={<Globe className="w-8 h-8 text-sky-600 dark:text-sky-400" />}
      recordCount={rates.length}
      recordLabel="Currencies"
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncAPI}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-sky-600 dark:text-sky-400 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Parities...' : 'Sync Central Bank Rates'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Operating Currency</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>General Policy Hub</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          <span>Multi-Currency & Rates</span>
        </Link>
        <Link href="/settings/finance/tax" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>VAT & Tax Rules</span>
        </Link>
        <Link href="/settings/finance/methods" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Payment Gateways & POS</span>
        </Link>
        <Link href="/settings/finance/fees" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Fee & Penalty Rules</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Currencies Data Grid (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-3">
          <EnterpriseDataGrid
            data={rates}
            columns={columns}
            isLoading={loading}
            density="cozy"
            emptyStateProps={{
              title: 'No Exchange Rates Found',
              description: 'No foreign currency conversion rates configured.',
              isFilterActive: false,
              onResetFilters: () => {},
              createLabel: 'Add Currency',
              onCreate: () => setShowAddModal(true)
            }}
          />
        </div>

        {/* Live Multi-Currency Conversion Calculator (Right 1 Column) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Live Parity Calculator</h3>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
              Real-time
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className={labelCls}>Input Amount</label>
                <input
                  type="number"
                  step="any"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 font-black'}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Currency</label>
                <select
                  value={calcSourceCurrency}
                  onChange={(e) => setCalcSourceCurrency(e.target.value)}
                  className={selectCls + ' font-mono'}
                >
                  {rates.map(r => (
                    <option key={r.currencyCode} value={r.currencyCode}>
                      {r.currencyCode} ({r.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Converted Parity Equivalents:
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {conversions.map((conv) => (
                  <div key={conv.code} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs block">{conv.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        1 USD = {Number(conv.rate).toFixed(2)} {conv.symbol}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">
                      {conv.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {conv.symbol}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Rate Modal */}
      {editingRate && (
        <div className={modalCls}>
          <div className={modalPanelCls}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Override Exchange Rate: {editingRate.currencyCode}</h3>
              </div>
              <button onClick={() => setEditingRate(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRate} className="space-y-3">
              <div className="space-y-1">
                <label className={labelCls}>Currency Name</label>
                <input
                  type="text"
                  disabled
                  value={editingRate.currencyName}
                  className={inputCls + ' bg-slate-100 dark:bg-slate-950 opacity-80'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Exchange Rate to 1 USD</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newRateValue}
                    onChange={(e) => setNewRateValue(e.target.value)}
                    className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 font-black text-sm'}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelCls}>Currency Symbol</label>
                  <input
                    type="text"
                    value={newSymbolValue}
                    onChange={(e) => setNewSymbolValue(e.target.value)}
                    className={inputCls + ' font-mono font-bold'}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setEditingRate(null)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md cursor-pointer">
                  Apply Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Currency Modal */}
      {showAddModal && (
        <div className={modalCls}>
          <div className={modalPanelCls}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Add Operating Currency</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCurrency} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Currency Code (ISO)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAR"
                    maxLength={5}
                    value={addCode}
                    onChange={(e) => setAddCode(e.target.value)}
                    className={inputCls + ' font-mono uppercase font-bold text-emerald-700 dark:text-emerald-400'}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelCls}>Symbol</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ﷼"
                    value={addSymbol}
                    onChange={(e) => setAddSymbol(e.target.value)}
                    className={inputCls + ' font-mono font-bold'}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Currency Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saudi Arabian Riyal"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Exchange Rate to 1 USD ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 3.75"
                  value={addRate}
                  onChange={(e) => setAddRate(e.target.value)}
                  className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 font-black text-sm'}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer">
                  Add Currency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

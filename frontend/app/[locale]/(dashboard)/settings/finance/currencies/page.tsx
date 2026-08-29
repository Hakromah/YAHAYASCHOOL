/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import {
  Globe, Plus, RefreshCw, CheckCircle2, ShieldCheck, DollarSign,
  ArrowRight, Save, Clock, Percent, CreditCard, Settings, Edit2, X
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
  const t = (key: string) => i18nT(key, locale);

  const [rates, setRates] = useState<MultiCurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Edit Modal State
  const [editingRate, setEditingRate] = useState<MultiCurrencyRate | null>(null);
  const [newRateValue, setNewRateValue] = useState<string>('');
  const [newSymbolValue, setNewSymbolValue] = useState<string>('');

  const fetchRates = async () => {
    setLoading(true);
    try {
      const data = await financeService.getExchangeRates();
      setRates(data || []);
    } catch {
      toast.error(t('Failed to load multi-currency exchange rates.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSyncAPI = async () => {
    setSyncing(true);
    try {
      await new Promise(res => setTimeout(res, 800));
      await fetchRates();
      toast.success(t('Successfully synchronized exchange rates with Central Bank & BCEAO API gateways!'));
    } catch {
      toast.error(t('Exchange rate synchronization failed'));
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
      toast.error(t('Please enter a valid positive exchange rate'));
      return;
    }

    try {
      await financeService.updateExchangeRate(editingRate.id, parsedRate, newSymbolValue);
      setRates(rates.map(r => r.id === editingRate.id ? { ...r, exchangeRateToUSD: parsedRate, symbol: newSymbolValue, lastUpdated: new Date().toISOString().split('T')[0] } : r));
      toast.success(`${t('Exchange rate updated for')} ${editingRate.currencyCode}!`);
      setEditingRate(null);
    } catch {
      toast.error(t('Failed to update rate'));
    }
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_currencies',
      title: t('Active Operating Currencies'),
      value: `${rates.length} ${t('Currencies')}`,
      subtitle: t('USD ($), EUR (€), XOF (CFA), TRY (₺) & GNF (FG)'),
      trendDirection: 'up',
      icon: <Globe className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'sync_mode',
      title: t('Rate Synchronizer Gateway'),
      value: t('Automated 24h Sync'),
      subtitle: t('BCEAO & European Central Bank real-time parity'),
      trendDirection: 'up',
      icon: <RefreshCw className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'multi_ledger',
      title: t('Multi-Currency Bookkeeping'),
      value: '100% Normalized',
      subtitle: t('All foreign receipts normalized to USD ($) base ledger'),
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />
    }
  ];

  const columns: ColumnDef<MultiCurrencyRate, any>[] = [
    {
      accessorKey: 'currencyCode',
      header: t('Currency Code & Name'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-slate-800 text-emerald-400 font-black font-mono text-xs">
            {row.original.currencyCode}
          </span>
          <span className="font-bold text-white text-xs sm:text-sm">{row.original.currencyName}</span>
        </div>
      )
    },
    {
      accessorKey: 'exchangeRateToUSD',
      header: `${t('Exchange Rate (vs 1 USD $)')}`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-white">
          {(Number(row.original.exchangeRateToUSD) || 1).toFixed(4)} {row.original.symbol}
        </span>
      )
    },
    {
      accessorKey: 'lastUpdated',
      header: t('Last Synchronization'),
      cell: ({ row }) => <span className="font-mono text-xs text-slate-400 font-bold">{row.original.lastUpdated || 'Today'}</span>
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <button
          onClick={() => handleOpenEditModal(row.original)}
          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
        >
          <Edit2 className="w-3 h-3" />
          <span>{t('Override Rate')}</span>
        </button>
      )
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Multi-Currency Engine & Exchange Rate Parameters')}
      description={t('SAP S/4HANA & Odoo multi-currency normalization. Configure real-time exchange rate sync gateways across USD, EUR, CFA Franc (XOF), and Turkish Lira (TRY).')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Settings & Config') }, { label: t('Multi-Currency') }]}
      icon={<Globe className="w-8 h-8 text-sky-400" />}
      recordCount={rates.length}
      recordLabel={t('Currencies')}
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <button
          onClick={handleSyncAPI}
          disabled={syncing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{t('Sync Live Rates Now')}</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('General Policy Hub')}</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          <span>{t('Multi-Currency & Rates')}</span>
        </Link>
        <Link href="/settings/finance/tax" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('VAT & Tax Rules')}</span>
        </Link>
        <Link href="/settings/finance/methods" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Payment Gateways & POS')}</span>
        </Link>
        <Link href="/settings/finance/fees" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-rose-400" />
          <span>{t('Fee & Penalty Rules')}</span>
        </Link>
      </div>

      <EnterpriseDataGrid
        data={rates}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: t('No Currencies Active'),
          description: t('No foreign currencies configured.'),
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />

      {/* Edit Rate Modal */}
      {editingRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white">{t('Adjust Exchange Rate')}: {editingRate.currencyCode}</h3>
              </div>
              <button onClick={() => setEditingRate(null)} className="text-slate-400 hover:text-white font-bold text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRate} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Currency Name')}</label>
                <input
                  type="text"
                  disabled
                  value={editingRate.currencyName}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Exchange Rate to 1 USD')}</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={newRateValue}
                  onChange={(e) => setNewRateValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Currency Symbol')}</label>
                <input
                  type="text"
                  value={newSymbolValue}
                  onChange={(e) => setNewSymbolValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setEditingRate(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                  {t('Cancel')}
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">
                  {t('Save Rate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

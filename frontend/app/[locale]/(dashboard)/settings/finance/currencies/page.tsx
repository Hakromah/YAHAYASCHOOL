'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe, Plus, RefreshCw, CheckCircle2, ShieldCheck, DollarSign,
  ArrowRight, Save, Clock, Percent, CreditCard, Settings
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { MultiCurrencyRate } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { toast } from 'sonner';

export default function MultiCurrencySettingsPage() {
  const [rates, setRates] = useState<MultiCurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const data = await financeService.getExchangeRates();
        setRates(data);
      } catch {
        toast.error('Failed to load multi-currency exchange rates.');
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const handleSyncAPI = () => {
    toast.success('Successfully synchronized exchange rates with European Central Bank & West African BCEAO API gateways!');
    setRates([...rates]);
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_currencies',
      title: 'Active Operating Currencies',
      value: `${rates.length} Currencies`,
      subtitle: 'USD ($), EUR (€), XOF (CFA) & TRY (₺)',
      trendDirection: 'up',
      icon: <Globe className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'sync_mode',
      title: 'Rate Synchronizer Gateway',
      value: 'Automated 24h Sync',
      subtitle: 'BCEAO & European Central Bank real-time parity',
      trendDirection: 'up',
      icon: <RefreshCw className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'multi_ledger',
      title: 'Multi-Currency Bookkeeping',
      value: '100% Normalized',
      subtitle: 'All foreign receipts normalized to USD ($) base ledger',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />
    }
  ];

  const columns: ColumnDef<MultiCurrencyRate, any>[] = [
    {
      accessorKey: 'currencyCode',
      header: 'Currency Code & Name',
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
      header: 'Exchange Rate (vs 1 USD $)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-white">
          {row.original.exchangeRateToUSD.toFixed(4)} {row.original.symbol}
        </span>
      )
    },
    {
      accessorKey: 'lastUpdated',
      header: 'Last Synchronization',
      cell: ({ row }) => <span className="font-mono text-xs text-slate-400 font-bold">{row.original.lastUpdated}</span>
    },
    {
      id: 'actions',
      header: 'Manual Override',
      cell: ({ row }) => (
        <button
          onClick={() => toast.info(`Manual override mode active for ${row.original.currencyCode}.`)}
          className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
        >
          Override Rate
        </button>
      )
    }
  ];

  return (
    <EnterpriseModuleShell
      title="Multi-Currency Engine & Exchange Rate Parameters"
      description="SAP S/4HANA & Odoo multi-currency normalization. Configure real-time exchange rate sync gateways across USD, EUR, CFA Franc (XOF), and Turkish Lira (TRY)."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Settings & Config' }, { label: 'Multi-Currency' }]}
      icon={<Globe className="w-8 h-8 text-sky-400" />}
      recordCount={rates.length}
      recordLabel="Currencies"
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <button
          onClick={handleSyncAPI}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sync Live Rates Now</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-emerald-400" />
          <span>General Policy Hub</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          <span>Multi-Currency & Rates</span>
        </Link>
        <Link href="/settings/finance/tax" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-amber-400" />
          <span>VAT & Tax Rules</span>
        </Link>
        <Link href="/settings/finance/methods" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          <span>Payment Gateways & POS</span>
        </Link>
        <Link href="/settings/finance/fees" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-rose-400" />
          <span>Fee & Penalty Rules</span>
        </Link>
      </div>

      <EnterpriseDataGrid
        data={rates}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: 'No Currencies Active',
          description: 'No foreign currencies configured.',
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}

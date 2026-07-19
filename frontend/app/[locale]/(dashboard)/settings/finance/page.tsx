'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings, Save, ShieldCheck, DollarSign, Globe, Percent,
  CreditCard, Award, AlertTriangle, CheckCircle2, Clock,
  RefreshCw, Building2, Landmark, FileText
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { FinanceSettings } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { toast } from 'sonner';

export default function FinanceSettingsOverviewPage() {
  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [fiscalYearStart, setFiscalYearStart] = useState('July 1');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [lateFeeRule, setLateFeeRule] = useState('5% after 15 days of invoice maturity');
  const [enableFinancialHolds, setEnableFinancialHolds] = useState(true);
  const [autoReceiptNumbering, setAutoReceiptNumbering] = useState('REC-2026-XXXXXX');
  const [doubleEntryParity, setDoubleEntryParity] = useState('Enforce strict Debits == Credits (SAP S/4HANA standard)');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await financeService.getSettings();
        setSettings(data);
        setFiscalYearStart(data.fiscalYearStart || 'July 1');
        setDefaultCurrency(data.defaultCurrency || 'USD');
      } catch {
        toast.error('Failed to load institutional finance settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await financeService.updateSettings({
      fiscalYearStart,
      defaultCurrency,
      taxRate: settings?.taxRate || 0,
      lateFeePolicy: lateFeeRule,
      enableInstallments: settings?.enableInstallments || true,
      enableScholarships: settings?.enableScholarships || true,
      autoInvoiceNumbering: settings?.autoInvoiceNumbering || 'INV-2026-XXXXXX',
      autoReceiptNumbering
    });
    toast.success('Institutional financial governance policies saved successfully!');
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'fiscal_year',
      title: 'Institutional Fiscal Year Partition',
      value: `Starts ${fiscalYearStart}`,
      subtitle: 'Academic Year 2026-2027 active partition',
      trendDirection: 'up',
      icon: <Clock className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'base_currency',
      title: 'Base Institutional Currency',
      value: `${defaultCurrency} ($ USD)`,
      subtitle: 'Multi-currency exchange rates active for EUR/XOF/TRY',
      trendDirection: 'up',
      icon: <Globe className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'accounting_standard',
      title: 'Double-Entry Accounting Standard',
      value: 'Strict SAP / Odoo Parity',
      subtitle: 'Every transaction requires balanced GL debit & credit postings',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'holds_engine',
      title: 'Automated Academic Financial Holds',
      value: enableFinancialHolds ? 'ENABLED' : 'DISABLED',
      subtitle: 'Automatically locks report cards & exam permits on overdue balance',
      trendDirection: enableFinancialHolds ? 'up' : 'down',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
    }
  ];

  return (
    <EnterpriseModuleShell
      title="Institutional Finance Governance & ERP Settings"
      description="SAP S/4HANA & Odoo financial configuration hub. Define global fiscal year boundaries, base operating currencies, tax exemptions, and automated academic financial holds."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Settings & Config' }, { label: 'Finance Settings' }]}
      icon={<Settings className="w-8 h-8 text-emerald-400" />}
      recordCount={5}
      recordLabel="Policy Parameters"
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Policy Parameters</span>
        </button>
      }
    >
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5" />
          <span>General Policy Hub</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-400" />
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

      {/* Settings Form Grid */}
      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Core Fiscal Partitioning */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Landmark className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">1. Fiscal Year & Currency Engine</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Fiscal Year Start Date (Annual Partitioning)</label>
              <input
                type="text"
                value={fiscalYearStart}
                onChange={(e) => setFiscalYearStart(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Default Institutional Operating Currency</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="USD">USD ($) — United States Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="XOF">XOF (CFA) — West African CFA Franc</option>
                <option value="TRY">TRY (₺) — Turkish Lira</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Receipt Serial Numbering Rule</label>
              <input
                type="text"
                value={autoReceiptNumbering}
                onChange={(e) => setAutoReceiptNumbering(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Governance & Holds Automation */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">2. Compliance & Academic Holds Engine</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Automated Late Penalty Rule</label>
              <input
                type="text"
                value={lateFeeRule}
                onChange={(e) => setLateFeeRule(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Automated Academic Financial Holds</span>
                  <span className="text-[11px] text-slate-400 block">Blocks report cards, certificates & exam permits when fee balance is overdue &gt; 15 days</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableFinancialHolds}
                  onChange={(e) => setEnableFinancialHolds(e.target.checked)}
                  aria-label="Toggle automated academic financial holds"
                  className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Double-Entry Ledger Integrity Rule</label>
              <input
                type="text"
                disabled
                value={doubleEntryParity}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold opacity-80"
              />
            </div>
          </div>
        </div>
      </form>
    </EnterpriseModuleShell>
  );
}

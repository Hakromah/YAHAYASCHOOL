/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import {
  Settings, Save, ShieldCheck, DollarSign, Globe, Percent,
  CreditCard, Award, AlertTriangle, CheckCircle2, Clock,
  RefreshCw, Building2, Landmark, FileText
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import type { FinanceSettings } from '@/types/finance.types';
import type { AcademicYear } from '@/types/erp.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { toast } from 'sonner';

export default function FinanceSettingsOverviewPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [activeYearName, setActiveYearName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Form states with clean defaults
  const [fiscalYearStart, setFiscalYearStart] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [lateFeeRule, setLateFeeRule] = useState('');
  const [enableFinancialHolds, setEnableFinancialHolds] = useState(true);
  const [autoReceiptNumbering, setAutoReceiptNumbering] = useState('');
  const [doubleEntryParity, setDoubleEntryParity] = useState('Enforce strict Debits == Credits (SAP S/4HANA standard)');

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, years] = await Promise.all([
        financeService.getSettings(),
        erpService.getAcademicYears().catch(() => [])
      ]);
      setSettings(settingsData);
      setFiscalYearStart(settingsData.fiscalYearStart || '2026-09-01');
      setDefaultCurrency(settingsData.defaultCurrency || 'USD');
      setLateFeeRule(settingsData.lateFeeRule || settingsData.lateFeePolicy || '5% after 15 days of invoice maturity');
      setEnableFinancialHolds(settingsData.enableFinancialHolds ?? true);
      setAutoReceiptNumbering(settingsData.autoReceiptNumbering || 'REC-2026-XXXXXX');

      if (years && years.length > 0) {
        setAcademicYears(years);
        const curr = years.find(y => y.isCurrent || y.recordStatus === 'active' || y.status === 'current') || years[0];
        if (curr?.name) setActiveYearName(curr.name);
      }
    } catch {
      toast.error(t('Failed to load institutional finance settings.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await financeService.updateSettings({
        fiscalYearStart,
        defaultCurrency,
        lateFeePolicy: lateFeeRule,
        lateFeeRule,
        enableFinancialHolds,
        autoReceiptNumbering,
        doubleEntryParity
      });
      toast.success(t('Institutional financial governance policies saved successfully!'));
    } catch {
      toast.error(t('Failed to save settings'));
    }
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'fiscal_year',
      title: t('Institutional Fiscal Year Partition'),
      value: fiscalYearStart ? `${t('Starts')} ${fiscalYearStart}` : t('Active Partition'),
      subtitle: activeYearName ? `${t('Academic Year')} ${activeYearName} ${t('active partition')}` : t('Annual academic partition'),
      trendDirection: 'up',
      icon: <Clock className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'base_currency',
      title: t('Base Institutional Currency'),
      value: `${defaultCurrency} (${defaultCurrency === 'USD' ? '$ USD' : defaultCurrency})`,
      subtitle: t('Multi-currency exchange rates active for EUR/XOF/TRY'),
      trendDirection: 'up',
      icon: <Globe className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'accounting_standard',
      title: t('Double-Entry Accounting Standard'),
      value: t('Strict SAP / Odoo Parity'),
      subtitle: t('Every transaction requires balanced GL debit & credit postings'),
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'holds_engine',
      title: t('Automated Academic Financial Holds'),
      value: enableFinancialHolds ? t('ENABLED') : t('DISABLED'),
      subtitle: t('Automatically locks report cards & exam permits on overdue balance'),
      trendDirection: enableFinancialHolds ? 'up' : 'down',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Institutional Finance Governance & ERP Settings')}
      description={t('SAP S/4HANA & Odoo financial configuration hub. Define global fiscal year boundaries, base operating currencies, tax exemptions, and automated academic financial holds.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Settings & Config') }, { label: t('Finance Settings') }]}
      icon={<Settings className="w-8 h-8 text-emerald-400" />}
      recordCount={5}
      recordLabel={t('Policy Parameters')}
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{t('Save Policy Parameters')}</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5" />
          <span>{t('General Policy Hub')}</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-400" />
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

      {/* Settings Form Grid */}
      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Core Fiscal Partitioning */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Landmark className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">1. {t('Fiscal Year & Currency Engine')}</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{t('Fiscal Year Start Date (Annual Partitioning)')}</label>
              <input
                type="text"
                value={fiscalYearStart}
                onChange={(e) => setFiscalYearStart(e.target.value)}
                placeholder="e.g. 2026-09-01"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{t('Default Institutional Operating Currency')}</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="USD">USD ($) — United States Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="XOF">XOF (CFA) — West African CFA Franc</option>
                <option value="TRY">TRY (₺) — Turkish Lira</option>
                <option value="GNF">GNF (FG) — Guinean Franc</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{t('Receipt Serial Numbering Rule')}</label>
              <input
                type="text"
                value={autoReceiptNumbering}
                onChange={(e) => setAutoReceiptNumbering(e.target.value)}
                placeholder="REC-2026-XXXXXX"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Governance & Holds Automation */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">2. {t('Compliance & Academic Holds Engine')}</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">{t('Automated Late Penalty Rule')}</label>
              <input
                type="text"
                value={lateFeeRule}
                onChange={(e) => setLateFeeRule(e.target.value)}
                placeholder="e.g. 5% after 15 days of invoice maturity"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">{t('Automated Academic Financial Holds')}</span>
                  <span className="text-[11px] text-slate-400 block">{t('Blocks report cards, certificates & exam permits when fee balance is overdue > 15 days')}</span>
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
              <label className="text-xs font-bold text-slate-300">{t('Double-Entry Ledger Integrity Rule')}</label>
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

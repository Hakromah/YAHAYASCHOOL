/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Settings, Save, ShieldCheck, DollarSign, Globe, Percent,
  CreditCard, AlertTriangle, CheckCircle2, Clock,
  RefreshCw, Building2, Landmark, FileText, ArrowRight,
  Sliders, Smartphone, QrCode, ExternalLink, PiggyBank,
  Lock, Check, AlertCircle, FileCheck, Layers, BadgeCheck
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import type { FinanceSettings, MultiCurrencyRate } from '@/types/finance.types';
import type { AcademicYear } from '@/types/erp.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { toast } from 'sonner';

export default function FinanceSettingsOverviewPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);

  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [activeYearName, setActiveYearName] = useState<string>('');
  const [currencies, setCurrencies] = useState<MultiCurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Pillar 1: Fiscal Year & Base Currency Engine
  const [fiscalYearStart, setFiscalYearStart] = useState('2026-09-01');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [invoiceGracePeriodDays, setInvoiceGracePeriodDays] = useState('14');
  const [autoReceiptNumbering, setAutoReceiptNumbering] = useState('REC-2026-XXXXXX');

  // Pillar 2: Credit Control & Academic Financial Holds
  const [enableFinancialHolds, setEnableFinancialHolds] = useState(true);
  const [holdsDays, setHoldsDays] = useState('15');
  const [holdsMinDebt, setHoldsMinDebt] = useState('50.00');
  const [lateFeeRule, setLateFeeRule] = useState('5% after 14 days of invoice maturity');
  const [holdReportCards, setHoldReportCards] = useState(true);
  const [holdCertificates, setHoldCertificates] = useState(true);
  const [holdExamPermits, setHoldExamPermits] = useState(true);
  const [holdLibraryAccess, setHoldLibraryAccess] = useState(false);

  // Pillar 3: Cashier POS & Drawer Governance
  const [standardOpeningFloat, setStandardOpeningFloat] = useState('200.00');
  const [maxDrawerDiscrepancyTolerance, setMaxDrawerDiscrepancyTolerance] = useState('5.00');
  const [requireSupervisorDiscrepancySignoff, setRequireSupervisorDiscrepancySignoff] = useState(true);
  const [autoReconcileZReport, setAutoReconcileZReport] = useState(true);

  // Pillar 4: Double-Entry & Waqf Endowment Safeguards
  const [doubleEntryParity] = useState('Enforce strict Debits == Credits (SAP S/4HANA & Odoo standard)');
  const [waqfMaxSubsidyPercentage, setWaqfMaxSubsidyPercentage] = useState('100');
  const [lockClosedPeriods, setLockClosedPeriods] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsData, years, ratesData] = await Promise.all([
        financeService.getSettings(),
        erpService.getAcademicYears(locale).catch(() => []),
        financeService.getExchangeRates().catch(() => [])
      ]);

      setSettings(settingsData);
      setCurrencies(ratesData || []);

      if (settingsData) {
        setFiscalYearStart(settingsData.fiscalYearStart || '2026-09-01');
        setDefaultCurrency(settingsData.defaultCurrency || 'USD');
        setLateFeeRule(settingsData.lateFeeRule || settingsData.lateFeePolicy || '5% after 14 days of invoice maturity');
        setEnableFinancialHolds(settingsData.enableFinancialHolds ?? true);
        setAutoReceiptNumbering(settingsData.autoReceiptNumbering || 'REC-2026-XXXXXX');
        if (settingsData.holdsDays) setHoldsDays(String(settingsData.holdsDays));
        if (settingsData.holdsMinDebt) setHoldsMinDebt(String(settingsData.holdsMinDebt));
        if (settingsData.standardOpeningFloat) setStandardOpeningFloat(String(settingsData.standardOpeningFloat));
        if (settingsData.maxDrawerDiscrepancyTolerance) setMaxDrawerDiscrepancyTolerance(String(settingsData.maxDrawerDiscrepancyTolerance));
        if (settingsData.waqfMaxSubsidyPercentage) setWaqfMaxSubsidyPercentage(String(settingsData.waqfMaxSubsidyPercentage));
      }

      if (years && years.length > 0) {
        setAcademicYears(years);
        const curr = years.find((y: AcademicYear) => y.isCurrent || y.recordStatus === 'active' || y.status === 'current') || years[0];
        if (curr?.name) setActiveYearName(curr.name);
        if (curr?.startDate) setFiscalYearStart(curr.startDate);
      }
    } catch {
      toast.error(i18nT('Failed to load institutional finance settings.', locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<FinanceSettings> = {
        fiscalYearStart,
        defaultCurrency,
        lateFeePolicy: lateFeeRule,
        lateFeeRule,
        enableFinancialHolds,
        autoReceiptNumbering,
        doubleEntryParity,
        holdsDays: parseInt(holdsDays, 10) || 15,
        holdsMinDebt: parseFloat(holdsMinDebt) || 50,
        standardOpeningFloat: parseFloat(standardOpeningFloat) || 200,
        maxDrawerDiscrepancyTolerance: parseFloat(maxDrawerDiscrepancyTolerance) || 5,
        waqfMaxSubsidyPercentage: parseFloat(waqfMaxSubsidyPercentage) || 100,
        requireSupervisorDiscrepancySignoff,
        autoReconcileZReport,
        lockClosedPeriods,
        restrictions: {
          holdReportCards,
          holdCertificates,
          holdExamPermits,
          holdLibraryAccess
        }
      };

      await financeService.updateSettings(payload);

      if (typeof window !== 'undefined') {
        localStorage.setItem('yahaya_selected_currency', defaultCurrency);
        localStorage.setItem('selected_currency', defaultCurrency);
        localStorage.setItem('yahaya_default_currency', defaultCurrency);
        window.dispatchEvent(new CustomEvent('yahaya_currency_changed', { detail: defaultCurrency }));
      }

      toast.success(i18nT('Institutional financial governance policies saved successfully!', locale));
    } catch {
      toast.error(i18nT('Failed to save settings', locale));
    } finally {
      setSaving(false);
    }
  };

  const selectedCurrencyObj = useMemo(() => {
    return currencies.find(c => c.currencyCode === defaultCurrency) || {
      currencyCode: defaultCurrency,
      symbol: '$',
      currencyName: 'US Dollar'
    };
  }, [currencies, defaultCurrency]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'fiscal_year',
      title: 'Institutional Fiscal Partition',
      value: fiscalYearStart ? `Starts ${fiscalYearStart}` : 'Active Partition',
      subtitle: activeYearName ? `Academic Year ${activeYearName} active in DB` : 'Annual academic partition',
      trendDirection: 'up',
      icon: <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'base_currency',
      title: 'Base Institutional Currency',
      value: `${defaultCurrency} (${selectedCurrencyObj.symbol || '$'})`,
      subtitle: `${currencies.length} operating currencies configured with live rates`,
      trendDirection: 'up',
      icon: <Globe className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'accounting_standard',
      title: 'Double-Entry Accounting Standard',
      value: 'Strict SAP / Odoo Parity',
      subtitle: 'Every transaction requires balanced GL debit & credit postings',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'holds_engine',
      title: 'Automated Academic Financial Holds',
      value: enableFinancialHolds ? 'ACTIVE (ENFORCED)' : 'PAUSED (MANUAL)',
      subtitle: `Overdue > ${holdsDays} days & debt > $${holdsMinDebt} triggers lock`,
      trendDirection: enableFinancialHolds ? 'up' : 'down',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
    }
  ];

  // Reusable styling tokens
  const cardPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5';
  const headerCls = 'flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300 block';
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';

  return (
    <EnterpriseModuleShell
      title="Institutional Finance Governance & ERP Settings"
      description="SAP S/4HANA & Odoo financial configuration hub. Define global fiscal year boundaries, base operating currencies, multi-currency parity links, VAT rules, and automated academic financial holds."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Settings & Config' }, { label: 'Finance Settings' }]}
      icon={<Settings className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={4}
      recordLabel="Governance Pillars"
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => { loadData(); toast.success('Settings synchronized with Strapi backend'); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Reload</span>
          </button>
          <button
            onClick={() => handleSaveSettings()}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Governance Policies...' : 'Save All Policies'}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5" />
          <span>General Policy Hub</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
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

      {/* Main Settings & Policy Grid */}
      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Pillar 1: Fiscal Year & Base Operating Currency */}
        <div className={cardPanelCls}>
          <div className={headerCls}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">1. Fiscal Year & Currency Engine</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Partition dates, default base currency & auto-receipt sequence</p>
              </div>
            </div>
            <Link
              href="/settings/finance/currencies"
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-bold flex items-center gap-1"
            >
              <span>Manage Rates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {/* Academic Fiscal Year from DB */}
            <div className="space-y-1">
              <label className={labelCls}>Active Academic Year Partition (from Database)</label>
              <select
                value={activeYearName}
                onChange={(e) => {
                  setActiveYearName(e.target.value);
                  const matched = academicYears.find(y => y.name === e.target.value);
                  if (matched?.startDate) setFiscalYearStart(matched.startDate);
                }}
                className={selectCls}
              >
                {academicYears.map(y => (
                  <option key={y.id} value={y.name}>
                    {y.name} {y.isCurrent ? '(Current Active)' : ''} — {y.startDate || '2026-09-01'} → {y.endDate || '2027-06-30'}
                  </option>
                ))}
                {academicYears.length === 0 && <option value="AY 2026-2027">AY 2026-2027 (Default)</option>}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Fiscal Year Start Date</label>
                <input
                  type="date"
                  value={fiscalYearStart}
                  onChange={(e) => setFiscalYearStart(e.target.value)}
                  className={inputCls + ' font-mono'}
                />
              </div>

              {/* Dynamic Currency Select from Multi-Currency Database */}
              <div className="space-y-1">
                <label className={labelCls}>Default Base Currency</label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className={selectCls + ' font-mono text-emerald-700 dark:text-emerald-400'}
                >
                  {currencies.map(c => (
                    <option key={c.currencyCode} value={c.currencyCode}>
                      {c.currencyCode} ({c.symbol}) — {c.currencyName}
                    </option>
                  ))}
                  {currencies.length === 0 && (
                    <>
                      <option value="USD">USD ($) — US Dollar</option>
                      <option value="EUR">EUR (€) — Euro</option>
                      <option value="XOF">XOF (CFA) — CFA Franc</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Receipt Serial Numbering Pattern</label>
                <input
                  type="text"
                  value={autoReceiptNumbering}
                  onChange={(e) => setAutoReceiptNumbering(e.target.value)}
                  placeholder="REC-2026-XXXXXX"
                  className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 font-bold'}
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Standard Invoice Maturity (Days)</label>
                <input
                  type="number"
                  value={invoiceGracePeriodDays}
                  onChange={(e) => setInvoiceGracePeriodDays(e.target.value)}
                  className={inputCls + ' font-mono'}
                />
              </div>
            </div>

            {/* Live Parity Snapshot Widget */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Live Foreign Parity Links (vs 1 USD):
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">BCEAO / ECB Central Rates</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono font-bold">
                {currencies.slice(0, 6).map(c => (
                  <span key={c.currencyCode} className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs">
                    {c.currencyCode}: <strong className="text-emerald-600 dark:text-emerald-400">{Number(c.exchangeRateToUSD).toFixed(2)}</strong> {c.symbol}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Credit Control & Academic Financial Holds */}
        <div className={cardPanelCls}>
          <div className={headerCls}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">2. Credit Control & Academic Holds</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Automated locking on report cards, exam passes & certificates</p>
              </div>
            </div>
            <Link
              href="/settings/finance/fees"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
            >
              <span>Penalty Rules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {/* Toggle Master Holds Guard */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Automated Academic Financial Holds Engine</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Restricts student privileges automatically when tuition remains unpaid past threshold</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableFinancialHolds}
                  onChange={(e) => setEnableFinancialHolds(e.target.checked)}
                  aria-label="Toggle automated academic financial holds"
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Overdue Hold Trigger (Days past maturity)</label>
                <input
                  type="number"
                  value={holdsDays}
                  onChange={(e) => setHoldsDays(e.target.value)}
                  className={inputCls + ' font-mono'}
                  placeholder="15"
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Minimum Overdue Debt Ceiling ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={holdsMinDebt}
                  onChange={(e) => setHoldsMinDebt(e.target.value)}
                  className={inputCls + ' font-mono text-rose-600 dark:text-rose-400 font-bold'}
                  placeholder="50.00"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Automated Late Penalty Rule Description</label>
              <input
                type="text"
                value={lateFeeRule}
                onChange={(e) => setLateFeeRule(e.target.value)}
                placeholder="e.g. 5% after 14 days of invoice maturity"
                className={inputCls}
              />
            </div>

            {/* Restricted Services Checklist */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                Privileges Suspended Under Active Financial Hold:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={holdReportCards}
                    onChange={(e) => setHoldReportCards(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Report Cards & Transcripts</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={holdCertificates}
                    onChange={(e) => setHoldCertificates(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Graduation Certificates</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={holdExamPermits}
                    onChange={(e) => setHoldExamPermits(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Exam Hall Entry Passes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={holdLibraryAccess}
                    onChange={(e) => setHoldLibraryAccess(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Library Borrowing Privileges</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 3: Cashier POS & Drawer Settlement Governance */}
        <div className={cardPanelCls}>
          <div className={headerCls}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">3. Cashier POS & Drawer Controls</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Opening float defaults, discrepancy limits & Z-Report sealing</p>
              </div>
            </div>
            <Link
              href="/settings/finance/methods"
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-bold flex items-center gap-1"
            >
              <span>Gateways</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Default Opening Cash Float ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={standardOpeningFloat}
                  onChange={(e) => setStandardOpeningFloat(e.target.value)}
                  className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 font-bold'}
                  placeholder="200.00"
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Max Drawer Discrepancy Tolerance ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={maxDrawerDiscrepancyTolerance}
                  onChange={(e) => setMaxDrawerDiscrepancyTolerance(e.target.value)}
                  className={inputCls + ' font-mono text-amber-700 dark:text-amber-400 font-bold'}
                  placeholder="5.00"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Require Supervisor Sign-Off on Variance</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Blocks closing if drawer cash shortage/overage exceeds discrepancy tolerance</span>
                </div>
                <input
                  type="checkbox"
                  checked={requireSupervisorDiscrepancySignoff}
                  onChange={(e) => setRequireSupervisorDiscrepancySignoff(e.target.checked)}
                  aria-label="Toggle supervisor sign-off requirement"
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Auto-Reconcile POS Z-Reports at Midnight</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Automatically closes unsealed cashier sessions at End of Day</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoReconcileZReport}
                  onChange={(e) => setAutoReconcileZReport(e.target.checked)}
                  aria-label="Toggle auto reconcile Z-reports"
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 4: Double-Entry Compliance & Waqf Safeguards */}
        <div className={cardPanelCls}>
          <div className={headerCls}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">4. Accounting Standard & Waqf Safeguards</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Strict GL double-entry parity & endowment subsidy caps</p>
              </div>
            </div>
            <Link
              href="/settings/finance/tax"
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-bold flex items-center gap-1"
            >
              <span>Tax Rules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className={labelCls}>Double-Entry Ledger Integrity Rule</label>
              <input
                type="text"
                disabled
                value={doubleEntryParity}
                className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-slate-100 dark:bg-slate-950 opacity-90'}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Max Waqf Endowment Subsidy Cap (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={waqfMaxSubsidyPercentage}
                  onChange={(e) => setWaqfMaxSubsidyPercentage(e.target.value)}
                  className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 font-bold'}
                  placeholder="100"
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Closed Fiscal Period Governance</label>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Lock Past Periods</span>
                  <input
                    type="checkbox"
                    checked={lockClosedPeriods}
                    onChange={(e) => setLockClosedPeriods(e.target.checked)}
                    aria-label="Toggle lock on past accounting periods"
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Quick Governance Links Card */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/settings/finance/tax"
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <Percent className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono group-hover:text-amber-600 dark:group-hover:text-amber-400 font-bold">0% / 18%</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block mt-2">VAT & Tax Rules</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Educational exemptions</span>
              </Link>

              <Link
                href="/settings/finance/methods"
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-bold">5 Active</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block mt-2">Payment Channels</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Stripe, Orange, Wave, POS</span>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </EnterpriseModuleShell>
  );
}

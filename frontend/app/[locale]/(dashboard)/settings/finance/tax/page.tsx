/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Percent, Plus, Save, ShieldCheck, CheckCircle2, AlertCircle,
  Building2, Settings, Globe, CreditCard, DollarSign, Edit2, X
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface TaxRuleItem {
  id: string;
  name: string;
  ratePercentage: number;
  appliesTo: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
}

export default function VATAndTaxRulesSettingsPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);

  const [taxRules, setTaxRules] = useState<TaxRuleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TaxRuleItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formRate, setFormRate] = useState('');
  const [formAppliesTo, setFormAppliesTo] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);

  const fetchTaxRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeService.getTaxRules();
      setTaxRules(data || []);
    } catch {
      toast.error(i18nT('Failed to load tax rules.', locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchTaxRules();
  }, [fetchTaxRules]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormRate('');
    setFormAppliesTo('');
    setFormIsDefault(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: TaxRuleItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormRate(String(item.ratePercentage));
    setFormAppliesTo(item.appliesTo);
    setFormIsDefault(item.isDefault);
    setShowModal(true);
  };

  const handleSaveTaxRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = parseFloat(formRate);
    if (!formName.trim()) {
      toast.error(i18nT('Please enter tax bracket title', locale));
      return;
    }
    if (isNaN(parsedRate) || parsedRate < 0) {
      toast.error(i18nT('Please enter a valid rate percentage', locale));
      return;
    }

    try {
      if (editingItem) {
        const updated: TaxRuleItem = {
          ...editingItem,
          name: formName,
          ratePercentage: parsedRate,
          appliesTo: formAppliesTo,
          isDefault: formIsDefault
        };
        await financeService.saveTaxRule(updated);
        setTaxRules(taxRules.map(r => r.id === editingItem.id ? updated : r));
        toast.success(`${i18nT('Tax rule updated', locale)}: ${formName}`);
      } else {
        const newRule: TaxRuleItem = {
          id: `TAX-${Date.now().toString().slice(-4)}`,
          name: formName,
          ratePercentage: parsedRate,
          appliesTo: formAppliesTo || 'All Transactions',
          isDefault: formIsDefault,
          status: 'active'
        };
        await financeService.saveTaxRule(newRule);
        setTaxRules([...taxRules, newRule]);
        toast.success(`${i18nT('Tax bracket created', locale)}: ${formName}`);
      }
      setShowModal(false);
    } catch {
      toast.error(i18nT('Failed to save tax rule', locale));
    }
  };

  const handleToggleRule = async (rule: TaxRuleItem) => {
    const nextStatus = rule.status === 'active' ? 'inactive' : 'active';
    const updated = { ...rule, status: nextStatus as 'active' | 'inactive' };
    await financeService.saveTaxRule(updated);
    setTaxRules(taxRules.map(r => r.id === rule.id ? updated : r));
    toast.success(`${i18nT('Tax bracket', locale)} [${rule.name}] ${i18nT('status updated', locale)}.`);
  };

  const tuitionTaxRule = taxRules.find(r => r.appliesTo.toLowerCase().includes('tuition') || r.isDefault);
  const auxiliaryTaxRule = taxRules.find(r => r.appliesTo.toLowerCase().includes('auxiliary') || r.ratePercentage > 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'tuition_tax',
      title: 'Tuition Statutory Tax Rate',
      value: `${tuitionTaxRule ? tuitionTaxRule.ratePercentage : 0}% Rate`,
      subtitle: 'Verified institutional educational exempt status',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'auxiliary_vat',
      title: 'Auxiliary Supplies VAT Rate',
      value: `${auxiliaryTaxRule ? auxiliaryTaxRule.ratePercentage : 18}% Standard`,
      subtitle: 'Applicable to cafeteria, uniforms & commercial sales',
      trendDirection: 'neutral',
      icon: <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    },
    {
      id: 'rules_active',
      title: 'Configured Tax Brackets',
      value: `${taxRules.length} Brackets`,
      subtitle: 'Automated tax computation engine active',
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    }
  ];

  const columns: ColumnDef<TaxRuleItem, any>[] = [
    {
      accessorKey: 'name',
      header: 'Tax Bracket Title & Code',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">{row.original.name}</span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">ID: {row.original.id}</span>
        </div>
      )
    },
    {
      accessorKey: 'ratePercentage',
      header: 'Tax Rate (%)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
          {(Number(row.original.ratePercentage) || 0).toFixed(1)}%
        </span>
      )
    },
    {
      accessorKey: 'appliesTo',
      header: 'Applicable Domain Scope',
      cell: ({ row }) => <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{row.original.appliesTo}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEditModal(row.original)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => handleToggleRule(row.original)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            {row.original.status === 'active' ? 'Disable' : 'Enable'}
          </button>
        </div>
      )
    }
  ];

  // Reusable token classes
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300 block';
  const modalCls = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200';
  const modalPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4';

  return (
    <EnterpriseModuleShell
      title="VAT & Institutional Tax Rules Console"
      description="SAP S/4HANA tax computation engine. Define educational tax exemptions, auxiliary supplies VAT brackets, and vendor withholding rules."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Settings & Config', href: '/settings/finance' }, { label: 'VAT & Tax Rules' }]}
      icon={<Percent className="w-8 h-8 text-amber-600 dark:text-amber-400" />}
      recordCount={taxRules.length}
      recordLabel="Tax Brackets"
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Add Tax Bracket</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>General Policy Hub</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Multi-Currency & Rates</span>
        </Link>
        <Link href="/settings/finance/tax" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5" />
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

      <EnterpriseDataGrid
        data={taxRules}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: 'No Tax Rules Found',
          description: 'No institutional tax brackets configured.',
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />

      {/* Add / Edit Tax Modal */}
      {showModal && (
        <div className={modalCls}>
          <div className={modalPanelCls}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{editingItem ? 'Edit Tax Bracket' : 'Create Tax Bracket'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTaxRule} className="space-y-3">
              <div className="space-y-1">
                <label className={labelCls}>Bracket Name & Classification</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Educational Tuition Exemption"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Tax Rate Percentage (%)</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  placeholder="e.g. 18.0 or 0.0"
                  value={formRate}
                  onChange={(e) => setFormRate(e.target.value)}
                  className={inputCls + ' font-mono text-amber-700 dark:text-amber-400 font-bold'}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Applies To (Domain Scope)</label>
                <input
                  type="text"
                  placeholder="e.g. Academic Tuition & Waqf Grants"
                  value={formAppliesTo}
                  onChange={(e) => setFormAppliesTo(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsDefault}
                    onChange={(e) => setFormIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Set as default baseline tax rule</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer">
                  Save Tax Bracket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

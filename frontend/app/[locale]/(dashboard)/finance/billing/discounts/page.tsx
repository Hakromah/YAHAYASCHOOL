/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Sparkles, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Award, Layers,
  ArrowRight, ShieldCheck, Users, Percent, Building2, X
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { DiscountRule } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function DiscountsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountRule | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'sibling' | 'staff' | 'hafiz' | 'early_payment' | 'custom'>('sibling');
  const [value, setValue] = useState('');
  const [isPercentage, setIsPercentage] = useState(true);
  const [minEnrollmentMonths, setMinEnrollmentMonths] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getDiscountRules();
      setDiscounts(data);
    } catch {
      toast.error('Failed to load discount rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDiscounts = useMemo(() => {
    return discounts.filter(d => {
      if (!query) return true;
      return (d.name || '').toLowerCase().includes(query.toLowerCase());
    });
  }, [discounts, query]);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !value) {
      toast.error('Policy name and discount value are required.');
      return;
    }
    const valNum = parseFloat(value || '0');

    try {
      const created: DiscountRule = {
        id: `DSC-${Date.now()}`,
        name,
        type,
        value: valNum,
        isPercentage,
        minEnrollmentMonths: parseInt(minEnrollmentMonths || '0', 10),
        isActive: true,
        activeBeneficiariesCount: 0
      };

      setDiscounts([created, ...discounts]);
      toast.success(`Created discount policy: ${created.name}`);
      setName('');
      setValue('');
      setMinEnrollmentMonths('');
      setShowCreateModal(false);
    } catch {
      toast.error('Failed to create discount rule');
    }
  };

  const totalBeneficiaries = useMemo(() => discounts.reduce((s, d) => s + (Number(d.activeBeneficiariesCount) || 0), 0), [discounts]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_rules',
      title: 'Active Discount Policies',
      value: `${discounts.filter(d => d.isActive).length} Policies`,
      subtitle: `${discounts.length} total automated deduction rules`,
      trendDirection: 'up',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'beneficiaries',
      title: 'Scholars Benefiting',
      value: `${totalBeneficiaries} Scholars`,
      subtitle: 'Covering siblings, teaching faculty & Hafiz milestones',
      trendDirection: 'up',
      icon: <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'sibling_rules',
      title: 'Sibling Discount Tiering',
      value: 'Automated',
      subtitle: 'Multi-sibling automatic discounts applied on billing',
      trendDirection: 'neutral',
      icon: <Percent className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    }
  ];

  const columns = useMemo<ColumnDef<DiscountRule, any>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Policy Name & Tier',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">{row.original.name}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">Type: {row.original.type.toUpperCase()}</span>
        </div>
      )
    },
    {
      accessorKey: 'type',
      header: 'Classification',
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
          {row.original.type}
        </span>
      )
    },
    {
      accessorKey: 'value',
      header: 'Deduction Rate',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400 block">
          {row.original.isPercentage ? `${row.original.value}%` : `$${row.original.value.toFixed(2)}`} Off
        </span>
      )
    },
    {
      accessorKey: 'activeBeneficiariesCount',
      header: 'Active Scholars',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
          {row.original.activeBeneficiariesCount} Scholars
        </span>
      )
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'active' : 'inactive'} size="sm" />
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedDiscount(row.original)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </button>
      )
    }
  ], []);

  // Form input classes
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';

  return (
    <EnterpriseModuleShell
      title="Tuition Discounts & Fee Concession Policy Rules"
      description="Configure multi-sibling discounts, staff child exemptions, Hafiz milestones, and early settlement fee incentives."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Billing Suite' }, { label: 'Discounts' }]}
      icon={<Sparkles className="w-8 h-8 text-amber-500" />}
      recordCount={filteredDiscounts.length}
      recordLabel="Policies"
      activeFilterCount={0}
      onClearFilters={() => setQuery('')}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/billing/scholarships"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Award className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Scholarships & Grants</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Create Discount Policy</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Student Invoices</span>
        </Link>
        <Link href="/finance/billing/scholarships" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Scholarships & Grants</span>
        </Link>
        <Link href="/finance/billing/discounts" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Discount Policies</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search discount policies by rule name..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Discount rules refreshed');
        }}
        activeFilterCount={0}
        onResetFilters={() => setQuery('')}
        createButtonLabel="+ New Policy"
        onCreate={() => setShowCreateModal(true)}
      />

      <EnterpriseDataGrid
        data={filteredDiscounts}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        onRowInspect={(row) => setSelectedDiscount(row)}
        onRowClick={(row) => setSelectedDiscount(row)}
        emptyStateProps={{
          title: 'No Discount Rules Found',
          description: 'No discount policies match your search.',
          isFilterActive: query.length > 0,
          onResetFilters: () => setQuery(''),
          createLabel: 'Create First Policy',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Create Automated Discount Policy</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Policy Title / Concession Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sibling Discount (2nd Child)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rule Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="sibling">Sibling Discount</option>
                    <option value="staff">Staff Child Exemption</option>
                    <option value="hafiz">Hafiz Milestone</option>
                    <option value="early_payment">Early Settlement Incentive</option>
                    <option value="custom">Custom Policy</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deduction Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="15"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 font-bold'}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedDiscount}
        onClose={() => setSelectedDiscount(null)}
        record={selectedDiscount ? {
          name: selectedDiscount.name,
          id: selectedDiscount.id,
          role: `DISCOUNT POLICY (${selectedDiscount.type.toUpperCase()})`,
          status: selectedDiscount.isActive ? 'active' : 'inactive',
          email: `Rate: ${selectedDiscount.isPercentage ? `${selectedDiscount.value}%` : `$${selectedDiscount.value}`}`,
          phone: `Beneficiaries: ${selectedDiscount.activeBeneficiariesCount} scholars`,
          department: `Type: ${selectedDiscount.type}`,
          joinDate: selectedDiscount.type,
          balance: `ACTIVE RULE`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

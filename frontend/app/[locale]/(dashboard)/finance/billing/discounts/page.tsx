'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Award, Layers,
  ArrowRight, ShieldCheck, Users, Percent, Building2
} from 'lucide-react';
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
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountRule | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [name, setName] = useState('Imam Child 50% Tuition Exemption');
  const [type, setType] = useState<'sibling' | 'staff' | 'hafiz' | 'early_payment' | 'custom'>('staff');
  const [value, setValue] = useState('50');
  const [isPercentage, setIsPercentage] = useState(true);
  const [minEnrollmentMonths, setMinEnrollmentMonths] = useState('6');

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
      return d.name.toLowerCase().includes(query.toLowerCase());
    });
  }, [discounts, query]);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const valNum = parseFloat(value || '10');

    const created = await financeService.createDiscountRule({
      name,
      type,
      value: valNum,
      isPercentage,
      minEnrollmentMonths: parseInt(minEnrollmentMonths || '0', 10)
    });

    setDiscounts([created, ...discounts]);
    toast.success(`Created discount policy rule: ${created.name}`);
    setShowCreateModal(false);
  };

  const totalBeneficiaries = useMemo(() => discounts.reduce((s, d) => s + d.activeBeneficiariesCount, 0), [discounts]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_rules',
      title: 'Active Discount Policies',
      value: `${discounts.filter(d => d.isActive).length} Policies`,
      subtitle: `${discounts.length} total automated deduction rules`,
      trendDirection: 'up',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'beneficiaries',
      title: 'Scholars Benefiting',
      value: `${totalBeneficiaries} Scholars`,
      subtitle: 'Covering siblings, teaching faculty & Hafiz milestones',
      trendDirection: 'up',
      icon: <Users className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'sibling_rules',
      title: 'Sibling Discount Tiering',
      value: 'Up to 25% Off',
      subtitle: '2nd Sibling: 10% | 3rd+: 25% automatic discount',
      trendDirection: 'neutral',
      icon: <Percent className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'staff_rules',
      title: 'Staff & Faculty Benefit',
      value: 'Automatic Apply',
      subtitle: 'Imam & Senior Teacher child fee exemptions active',
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    }
  ];

  const columns = useMemo<ColumnDef<DiscountRule, any>[]>(() => {
    return [
      {
        accessorKey: 'name',
        header: 'Discount Policy Name & Category',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-bold text-white text-xs sm:text-sm block">{row.original.name}</span>
            <span className="text-[11px] font-mono uppercase text-slate-400 block">{row.original.type} Category</span>
          </div>
        )
      },
      {
        accessorKey: 'value',
        header: 'Deduction Value',
        cell: ({ row }) => (
          <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
            {row.original.isPercentage ? `${row.original.value}% Off Base Fee` : `-$${row.original.value.toFixed(2)} Fixed Reduction`}
          </span>
        )
      },
      {
        accessorKey: 'activeBeneficiariesCount',
        header: 'Enrolled Scholars',
        cell: ({ row }) => (
          <span className="font-bold text-white text-xs sm:text-sm block">
            {row.original.activeBeneficiariesCount} Scholars Enrolled
          </span>
        )
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            row.original.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
          }`}>
            ● {row.original.isActive ? 'Active Policy' : 'Suspended'}
          </span>
        )
      },
      {
        id: 'actions',
        header: 'Inspect',
        cell: ({ row }) => (
          <button
            onClick={() => setSelectedDiscount(row.original)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect</span>
          </button>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Sibling & Staff Discount Policies"
      description="Manage institutional discount rules for multi-child families, teaching staff benefits, early payment incentives, and Hafiz milestones with automatic invoice application."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Billing Suite' }, { label: 'Discounts' }]}
      icon={<Sparkles className="w-8 h-8 text-amber-400" />}
      recordCount={filteredDiscounts.length}
      recordLabel="Discount Policies"
      activeFilterCount={0}
      onClearFilters={() => setQuery('')}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeService.exportToCSV(discounts, 'discount_rules_2026.csv')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Create Discount Rule</span>
          </button>
        </div>
      }
    >
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Invoices Console</span>
        </Link>
        <Link href="/finance/billing/scholarships" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-sky-400" />
          <span>Scholarships & Waqf Grants</span>
        </Link>
        <Link href="/finance/billing/discounts" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sibling & Staff Discounts</span>
        </Link>
        <Link href="/finance/billing/ledger" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Student Running Ledger</span>
        </Link>
      </div>

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search discount policies by rule name..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Discount rules synchronized with fee invoice calculation engine.');
        }}
        activeFilterCount={0}
        onResetFilters={() => setQuery('')}
        createButtonLabel="+ Create Rule"
        onCreate={() => setShowCreateModal(true)}
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredDiscounts}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedDiscount(row)}
        onRowClick={(row) => setSelectedDiscount(row)}
        emptyStateProps={{
          title: 'No Discount Policies Found',
          description: 'No active discount rules match your search query.',
          isFilterActive: query.length > 0,
          onResetFilters: () => setQuery(''),
          createLabel: 'Create Discount Rule',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-amber-400" />
                <h3 className="text-base font-black text-white">Establish Discount Policy Rule</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateDiscount} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Policy Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Discount Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="sibling">Sibling Discount Tier</option>
                    <option value="staff">Teaching Faculty Benefit</option>
                    <option value="hafiz">Hifz Memorization Achievement</option>
                    <option value="early_payment">Early Payment Settlement</option>
                    <option value="custom">Custom Policy</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Deduction Value ({isPercentage ? '%' : '$ USD'})</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={isPercentage}
                    onChange={(e) => setIsPercentage(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Is Percentage deduction (% of base fee)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">Create Policy Rule</button>
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
          role: `CATEGORY: ${selectedDiscount.type.toUpperCase()}`,
          status: selectedDiscount.isActive ? 'active' : 'inactive',
          email: `Min Enrollment: ${selectedDiscount.minEnrollmentMonths || 0} months`,
          phone: `Beneficiaries: ${selectedDiscount.activeBeneficiariesCount} Scholars`,
          department: `Deduction Rate: ${selectedDiscount.isPercentage ? `${selectedDiscount.value}%` : `$${selectedDiscount.value} USD`}`,
          joinDate: selectedDiscount.type,
          balance: `${selectedDiscount.activeBeneficiariesCount} ACTIVE SCHOLARS APPLIED`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

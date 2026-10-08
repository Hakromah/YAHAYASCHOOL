/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Award, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, HeartHandshake, Sparkles,
  ArrowRight, ShieldCheck, User, Building2, Layers, X
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { Scholarship } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function ScholarshipsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'merit' | 'need' | 'waqf_sponsored' | 'staff_child'>('waqf_sponsored');
  const [coveragePercentage, setCoveragePercentage] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [totalAllocated, setTotalAllocated] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getScholarships();
      setScholarships(data);
    } catch {
      toast.error('Failed to load scholarship grants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredScholarships = useMemo(() => {
    return scholarships.filter(s => {
      const matchQuery = !query ||
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        (s.sponsorName && s.sponsorName.toLowerCase().includes(query.toLowerCase()));
      const matchType = typeFilter === 'all' || s.type === typeFilter;
      return matchQuery && matchType;
    });
  }, [scholarships, query, typeFilter]);

  const activeFiltersCount = typeFilter !== 'all' ? 1 : 0;

  const handleCreateScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !coveragePercentage) {
      toast.error('Grant title and coverage percentage are required.');
      return;
    }
    const coverageNum = parseFloat(coveragePercentage || '100');
    const allocNum = parseFloat(totalAllocated || '0');

    try {
      const created = await financeService.createScholarship({
        name,
        type,
        coveragePercentage: coverageNum,
        maxAmount: allocNum,
        sponsorName: sponsorName || undefined,
        totalAllocated: allocNum,
        totalDisbursed: 0,
        activeRecipientsCount: 0
      });

      setScholarships([created, ...scholarships]);
      toast.success(`Created scholarship grant: ${created.name}`);
      setName('');
      setCoveragePercentage('');
      setSponsorName('');
      setTotalAllocated('');
      setShowCreateModal(false);
    } catch {
      toast.error('Failed to create scholarship grant');
    }
  };

  const totalFundAllocated = useMemo(() => scholarships.reduce((s, x) => s + (Number(x.totalAllocated) || 0), 0), [scholarships]);
  const totalFundDisbursed = useMemo(() => scholarships.reduce((s, x) => s + (Number(x.totalDisbursed) || 0), 0), [scholarships]);
  const totalScholarsBenefiting = useMemo(() => scholarships.reduce((s, x) => s + (Number(x.activeRecipientsCount) || 0), 0), [scholarships]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_fund',
      title: 'Total Waqf & Scholarship Fund',
      value: `$${totalFundAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${scholarships.length} active institutional endowment grants`,
      trendDirection: 'up',
      icon: <Award className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'disbursed',
      title: 'Disbursed to Student Accounts',
      value: `$${totalFundDisbursed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${totalFundAllocated > 0 ? ((totalFundDisbursed / totalFundAllocated) * 100).toFixed(1) : 0}% utilization rate`,
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'recipients',
      title: 'Active Beneficiaries (Scholars)',
      value: `${totalScholarsBenefiting} Scholars`,
      subtitle: 'Full and partial tuition waiver recipients',
      trendDirection: 'up',
      icon: <User className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'sponsors',
      title: 'Endowment Grant Sponsors',
      value: `${scholarships.filter(s => s.sponsorName).length} Partners`,
      subtitle: 'Waqf institutions and private benefactors',
      trendDirection: 'neutral',
      icon: <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    }
  ];

  const columns = useMemo<ColumnDef<Scholarship, any>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Grant Name & Sponsor',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">{row.original.name}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">Sponsor: {row.original.sponsorName || 'School General Endowment'}</span>
        </div>
      )
    },
    {
      accessorKey: 'type',
      header: 'Classification',
      cell: ({ row }) => {
        const type = row.original.type;
        const color = type === 'merit' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' :
          type === 'need' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
          type === 'staff_child' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
          'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}>
            {type.replace('_', ' ')}
          </span>
        );
      }
    },
    {
      accessorKey: 'coveragePercentage',
      header: 'Tuition Waiver Coverage',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400 block">
          {row.original.coveragePercentage}% Waiver
        </span>
      )
    },
    {
      accessorKey: 'totalAllocated',
      header: 'Endowment Pool ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white block">
          ${(Number(row.original.totalAllocated) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'activeRecipientsCount',
      header: 'Scholars Supported',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
          {row.original.activeRecipientsCount} Scholars
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedScholarship(row.original)}
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
      title="Scholarships & Waqf Endowment Grants Console"
      description="Configure merit grants, orphan sponsorships, and financial need fee exemptions. Automatically integrates into student invoicing."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Billing Suite' }, { label: 'Scholarships' }]}
      icon={<Award className="w-8 h-8 text-sky-600 dark:text-sky-400" />}
      recordCount={filteredScholarships.length}
      recordLabel="Grants"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setTypeFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/billing/discounts"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Discount Rules</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Create Scholarship Grant</span>
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
        <Link href="/finance/billing/scholarships" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" />
          <span>Scholarships & Grants</span>
        </Link>
        <Link href="/finance/billing/discounts" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Discount Policies</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search scholarships by grant title or sponsor name..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Scholarship grants refreshed');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setTypeFilter('all'); setQuery(''); }}
        createButtonLabel="+ New Grant"
        onCreate={() => setShowCreateModal(true)}
      />

      <EnterpriseDataGrid
        data={filteredScholarships}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        onRowInspect={(row) => setSelectedScholarship(row)}
        onRowClick={(row) => setSelectedScholarship(row)}
        emptyStateProps={{
          title: 'No Scholarship Grants Found',
          description: 'No grants or endowments match your filter criteria.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setTypeFilter('all'); setQuery(''); },
          createLabel: 'Create First Grant',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Create Scholarship Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Award className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Create Scholarship / Endowment Grant</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateScholarship} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Grant Title / Award Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hifz Excellence Grant"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Grant Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="waqf_sponsored">Waqf Sponsored</option>
                    <option value="merit">Merit Based</option>
                    <option value="need">Financial Need</option>
                    <option value="staff_child">Staff Child</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tuition Waiver (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    placeholder="100"
                    value={coveragePercentage}
                    onChange={(e) => setCoveragePercentage(e.target.value)}
                    className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 font-bold'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sponsor Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Barakah Waqf"
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Endowment Pool ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="25000"
                    value={totalAllocated}
                    onChange={(e) => setTotalAllocated(e.target.value)}
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
                  Save Scholarship Grant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedScholarship}
        onClose={() => setSelectedScholarship(null)}
        record={selectedScholarship ? {
          name: selectedScholarship.name,
          id: selectedScholarship.id,
          role: `SCHOLARSHIP (${selectedScholarship.type.toUpperCase()})`,
          status: 'active',
          email: `Sponsor: ${selectedScholarship.sponsorName || 'General Endowment'}`,
          phone: `Coverage: ${selectedScholarship.coveragePercentage}% Tuition Waiver`,
          department: `Recipients: ${selectedScholarship.activeRecipientsCount} scholars`,
          joinDate: selectedScholarship.type,
          balance: `ENDOWMENT POOL: $${(Number(selectedScholarship.totalAllocated) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Award, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, HeartHandshake, Sparkles,
  ArrowRight, ShieldCheck, User, Building2, Layers
} from 'lucide-react';
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
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Scholarship form state
  const [name, setName] = useState('Imam Shafi’i Excellence Grant');
  const [type, setType] = useState<'merit' | 'need' | 'waqf_sponsored' | 'staff_child'>('waqf_sponsored');
  const [coveragePercentage, setCoveragePercentage] = useState('100');
  const [sponsorName, setSponsorName] = useState('Al-Barakah Waqf Trust');
  const [totalAllocated, setTotalAllocated] = useState('25000');

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
    const coverageNum = parseFloat(coveragePercentage || '100');
    const allocNum = parseFloat(totalAllocated || '10000');

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
    setShowCreateModal(false);
  };

  const totalFundAllocated = useMemo(() => scholarships.reduce((s, x) => s + x.totalAllocated, 0), [scholarships]);
  const totalFundDisbursed = useMemo(() => scholarships.reduce((s, x) => s + x.totalDisbursed, 0), [scholarships]);
  const totalScholarsBenefiting = useMemo(() => scholarships.reduce((s, x) => s + x.activeRecipientsCount, 0), [scholarships]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_fund',
      title: 'Total Waqf & Scholarship Fund',
      value: `$${totalFundAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${scholarships.length} active institutional endowment grants`,
      trendDirection: 'up',
      icon: <Award className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'disbursed',
      title: 'Disbursed to Student Accounts',
      value: `$${totalFundDisbursed.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${Math.round((totalFundDisbursed / (totalFundAllocated || 1)) * 100)}% fund utilization rate`,
      trendDirection: 'up',
      icon: <HeartHandshake className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'recipients',
      title: 'Active Beneficiary Scholars',
      value: `${totalScholarsBenefiting} Scholars`,
      subtitle: 'Covering Hifz, orphan support, & academic merit',
      trendDirection: 'up',
      icon: <User className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'waqf_grants',
      title: 'Waqf Sponsored Grants',
      value: `${scholarships.filter(s => s.type === 'waqf_sponsored').length} Endowments`,
      subtitle: 'Directly linked to waqf treasury sponsorships',
      trendDirection: 'up',
      icon: <Building2 className="w-5 h-5 text-amber-400" />,
      onClick: () => setTypeFilter('waqf_sponsored')
    }
  ];

  const columns = useMemo<ColumnDef<Scholarship, any>[]>(() => {
    return [
      {
        accessorKey: 'name',
        header: 'Scholarship Grant Name & Sponsor',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-bold text-white text-xs sm:text-sm block">{row.original.name}</span>
            <span className="text-[11px] text-slate-400 block truncate max-w-xs">{row.original.sponsorName || '● Institutional General Fund'}</span>
          </div>
        )
      },
      {
        accessorKey: 'type',
        header: 'Grant Type & Coverage',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[11px] uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {row.original.type === 'waqf_sponsored' ? 'Waqf Endowment' : row.original.type === 'merit' ? 'Academic Merit' : 'Need-Based Grant'}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 block">{row.original.coveragePercentage}% Tuition Coverage</span>
          </div>
        )
      },
      {
        accessorKey: 'activeRecipientsCount',
        header: 'Active Recipients',
        cell: ({ row }) => (
          <span className="font-bold text-white text-xs sm:text-sm block">
            {row.original.activeRecipientsCount} Scholars Enrolled
          </span>
        )
      },
      {
        accessorKey: 'totalAllocated',
        header: 'Allocated vs. Disbursed ($)',
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="space-y-0.5 font-mono">
              <span className="text-xs font-bold text-slate-200 block">Alloc: ${s.totalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span className="text-xs font-black text-emerald-400 block">Used: ${s.totalDisbursed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
            ● Active Grant
          </span>
        )
      },
      {
        id: 'actions',
        header: 'Inspect',
        cell: ({ row }) => (
          <button
            onClick={() => setSelectedScholarship(row.original)}
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
      title="Scholarship Grants & Waqf Sponsorships"
      description="Manage institutional merit awards, orphan Hifz sponsorships, and Al-Barakah Waqf Trust endowments with automated tuition deductions."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Billing Suite' }, { label: 'Scholarships' }]}
      icon={<Award className="w-8 h-8 text-sky-400" />}
      recordCount={filteredScholarships.length}
      recordLabel="Scholarship Grants"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setTypeFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeService.exportToCSV(scholarships, 'scholarship_grants_2026.csv')}
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
            <span>+ Create Scholarship Fund</span>
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
        <Link href="/finance/billing/scholarships" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" />
          <span>Scholarships & Waqf Grants</span>
        </Link>
        <Link href="/finance/billing/discounts" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
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
        searchPlaceholder="Search scholarship grants by name or sponsor trust..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Scholarship grants synchronized with institutional endowment ledger.');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setTypeFilter('all'); setQuery(''); }}
        createButtonLabel="+ Create Grant"
        onCreate={() => setShowCreateModal(true)}
        customFilterNodes={
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter grants by type"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All Grant Types</option>
              <option value="waqf_sponsored">Waqf Sponsored Endowment</option>
              <option value="merit">Academic Excellence Merit</option>
              <option value="need">Orphan / Need-Based Grant</option>
            </select>
          </div>
        }
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredScholarships}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedScholarship(row)}
        onRowClick={(row) => setSelectedScholarship(row)}
        emptyStateProps={{
          title: 'No Scholarships Found',
          description: 'No scholarship grants match your search query or type filter.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setTypeFilter('all'); setQuery(''); },
          createLabel: 'Create New Grant Fund',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Award className="w-6 h-6 text-sky-400" />
                <h3 className="text-base font-black text-white">Create Scholarship / Waqf Endowment Fund</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateScholarship} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Grant Title</label>
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
                  <label className="text-xs font-bold text-slate-300">Endowment Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="waqf_sponsored">Waqf Sponsored Trust</option>
                    <option value="merit">Academic Merit Award</option>
                    <option value="need">Need-Based Financial Aid</option>
                    <option value="staff_child">Staff Child Exemption</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Tuition Coverage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={coveragePercentage}
                    onChange={(e) => setCoveragePercentage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Sponsor Name / Trust</label>
                  <input
                    type="text"
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Total Allocated Fund ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={totalAllocated}
                    onChange={(e) => setTotalAllocated(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">Establish Grant Fund</button>
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
          role: `GRANT TYPE: ${selectedScholarship.type.toUpperCase()}`,
          status: selectedScholarship.isActive ? 'active' : 'inactive',
          email: `Sponsor: ${selectedScholarship.sponsorName || 'Institutional'}`,
          phone: `Recipients: ${selectedScholarship.activeRecipientsCount} Scholars`,
          department: `Fund Allocated: $${selectedScholarship.totalAllocated.toFixed(2)} | Disbursed: $${selectedScholarship.totalDisbursed.toFixed(2)}`,
          joinDate: `${selectedScholarship.coveragePercentage}% Coverage`,
          balance: `REMAINING FUND CAPACITY: $${(selectedScholarship.totalAllocated - selectedScholarship.totalDisbursed).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

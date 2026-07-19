'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Award, Coins, Sparkles,
  ArrowRight, ShieldCheck, Settings, BookOpen, GraduationCap, ScrollText
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { FeeStructure } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function FeeStructuresPage() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Structure Form state
  const [name, setName] = useState('Grade 12 - Advanced Hifz & Science Track');
  const [academicYearCode, setAcademicYearCode] = useState('2026-2027');
  const [gradeCode, setGradeCode] = useState('GRADE-12');
  const [tuitionFee, setTuitionFee] = useState('1450');
  const [libraryFee, setLibraryFee] = useState('180');
  const [labFee, setLabFee] = useState('220');
  const [examFee, setExamFee] = useState('150');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getFeeStructures();
      setStructures(data);
    } catch {
      toast.error('Failed to load fee structure templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStructures = useMemo(() => {
    return structures.filter(s => {
      if (!query) return true;
      return s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.gradeCode.toLowerCase().includes(query.toLowerCase());
    });
  }, [structures, query]);

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    const tNum = parseFloat(tuitionFee || '0');
    const libNum = parseFloat(libraryFee || '0');
    const labNum = parseFloat(labFee || '0');
    const examNum = parseFloat(examFee || '0');
    const total = tNum + libNum + labNum + examNum;

    const newStruct: FeeStructure = {
      id: `FEE-${Date.now()}`,
      name,
      academicYearCode,
      gradeCode,
      totalAnnualFee: total,
      isActive: true,
      createdAt: new Date().toISOString(),
      items: [
        { id: `ITM-${Date.now()}-1`, description: 'Termly Tuition & Academic Fee', category: 'Tuition', amount: tNum, isMandatory: true, isRecurring: true },
        { id: `ITM-${Date.now()}-2`, description: 'Campus Library & Digital Database Access', category: 'Library', amount: libNum, isMandatory: true, isRecurring: true },
        { id: `ITM-${Date.now()}-3`, description: 'Science & Robotics Laboratory Materials', category: 'Laboratory', amount: labNum, isMandatory: false, isRecurring: true },
        { id: `ITM-${Date.now()}-4`, description: 'End of Year Certification & Exam Assessment', category: 'Examination', amount: examNum, isMandatory: true, isRecurring: false }
      ]
    };

    setStructures([newStruct, ...structures]);
    toast.success(`Created fee structure template: ${newStruct.name}`);
    setShowCreateModal(false);
  };

  const totalTemplates = structures.length;
  const activeTemplates = useMemo(() => structures.filter(s => s.isActive).length, [structures]);
  const avgAnnualFee = useMemo(() => {
    if (structures.length === 0) return 0;
    return structures.reduce((s, x) => s + x.totalAnnualFee, 0) / structures.length;
  }, [structures]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_templates',
      title: 'Active Fee Templates',
      value: `${activeTemplates} Templates`,
      subtitle: `${totalTemplates} total structures across primary, junior & senior high`,
      trendDirection: 'up',
      icon: <Layers className="w-5 h-5 text-sky-400" />,
      onClick: () => toast.info('Displaying all institutional fee models.')
    },
    {
      id: 'avg_fee',
      title: 'Average Annual Tuition Rate',
      value: `$${avgAnnualFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Standard base tuition across all tracks',
      trendDirection: 'neutral',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'installment_ready',
      title: 'Installment Plan Automation',
      value: '100% Active',
      subtitle: 'Automatic Termly / Monthly 3-split schedule support',
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'late_fee_rules',
      title: 'Late Fee Assessment Rule',
      value: '14 Days Grace',
      subtitle: 'Auto-assesses $50 or 5% penalty upon due date expiry',
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-amber-400" />
    }
  ];

  const columns = useMemo<ColumnDef<FeeStructure, any>[]>(() => {
    return [
      {
        accessorKey: 'name',
        header: 'Fee Structure Template Name & Grade',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-bold text-white text-xs sm:text-sm block">{row.original.name}</span>
            <span className="text-[11px] text-slate-400 font-mono uppercase block">{row.original.gradeCode} • {row.original.academicYearCode}</span>
          </div>
        )
      },
      {
        accessorKey: 'items',
        header: 'Itemized Breakdown',
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1">
            {row.original.items.map((itm, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300">
                {itm.category}: ${itm.amount.toFixed(2)}
              </span>
            ))}
          </div>
        )
      },
      {
        accessorKey: 'totalAnnualFee',
        header: 'Total Annual Fee ($)',
        cell: ({ row }) => (
          <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
            ${row.original.totalAnnualFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            ● {row.original.isActive ? 'Active Template' : 'Archived'}
          </span>
        )
      },
      {
        id: 'actions',
        header: 'Inspect & Clone',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedStructure(row.original)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
            <button
              onClick={() => {
                toast.success(`Cloned fee structure template: ${row.original.name}`);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 cursor-pointer"
              title="Clone Template"
            >
              Clone
            </button>
          </div>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Dynamic Fee Structures & Grade Templates"
      description="Configure institutional tuition rates, laboratory fees, library access charges, and examination assessments separated by Academic Year (2026-2027) and grade level tracks."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Billing Suite' }, { label: 'Fee Structures' }]}
      icon={<Layers className="w-8 h-8" />}
      recordCount={filteredStructures.length}
      recordLabel="Fee Templates"
      activeFilterCount={0}
      onClearFilters={() => setQuery('')}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeService.exportToCSV(structures, 'fee_structures_2026.csv')}
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
            <span>+ Create Fee Template</span>
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
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5 text-amber-400" />
          <span>Multi-Method Cashier & POS</span>
        </Link>
        <Link href="/finance/billing/structures" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>Fee Structures & Templates</span>
        </Link>
        <Link href="/finance/billing/ledger" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <ScrollText className="w-3.5 h-3.5 text-sky-400" />
          <span>Student Running Ledger</span>
        </Link>
      </div>

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search templates by structure name or grade code..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Fee structure templates synced with active term catalog.');
        }}
        activeFilterCount={0}
        onResetFilters={() => setQuery('')}
        createButtonLabel="+ New Fee Template"
        onCreate={() => setShowCreateModal(true)}
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredStructures}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedStructure(row)}
        onRowClick={(row) => setSelectedStructure(row)}
        onRowEdit={(row) => setSelectedStructure(row)}
        emptyStateProps={{
          title: 'No Fee Structures Found',
          description: 'No active institutional fee structure templates match your current search.',
          isFilterActive: query.length > 0,
          onResetFilters: () => setQuery(''),
          createLabel: 'Create New Template',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Create Grade Fee Structure Template</h3>
                  <p className="text-xs text-slate-400 font-mono">Applies to all scholars enrolled in selected grade track</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm px-3 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStructure} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Template Title / Description</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Grade Level Code</label>
                  <input
                    type="text"
                    required
                    value={gradeCode}
                    onChange={(e) => setGradeCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Academic Year Partition</label>
                  <input
                    type="text"
                    required
                    value={academicYearCode}
                    onChange={(e) => setAcademicYearCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider">Itemized Fee Allocations ($ USD)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Tuition Fee Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={tuitionFee}
                      onChange={(e) => setTuitionFee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Library & Archive Fee</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={libraryFee}
                      onChange={(e) => setLibraryFee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Laboratory Materials</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={labFee}
                      onChange={(e) => setLabFee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Examination Assessment</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={examFee}
                      onChange={(e) => setExamFee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div>
                  <span className="text-xs text-slate-400">Calculated Annual Template Total:</span>
                  <span className="text-xl font-black font-mono text-emerald-400 block">
                    ${(parseFloat(tuitionFee || '0') + parseFloat(libraryFee || '0') + parseFloat(labFee || '0') + parseFloat(examFee || '0')).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30"
                  >
                    Create Template
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedStructure}
        onClose={() => setSelectedStructure(null)}
        record={selectedStructure ? {
          name: selectedStructure.name,
          id: selectedStructure.id,
          role: `${selectedStructure.gradeCode} TEMPLATE (${selectedStructure.academicYearCode})`,
          status: selectedStructure.isActive ? 'active' : 'inactive',
          email: `Created: ${selectedStructure.createdAt.split('T')[0]}`,
          phone: `Items: ${selectedStructure.items.length}`,
          department: `Fee Breakdown: ${selectedStructure.items.map(i => `${i.category}: $${i.amount}`).join(' | ')}`,
          joinDate: selectedStructure.academicYearCode,
          balance: `TOTAL ANNUAL TEMPLATE RATE: $${selectedStructure.totalAnnualFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Award, ShieldCheck,
  AlertTriangle, ArrowRight, Sparkles, Users, PieChart
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { DepartmentalBudget } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function DepartmentalBudgetsPage() {
  const [budgets, setBudgets] = useState<DepartmentalBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedBudget, setSelectedBudget] = useState<DepartmentalBudget | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Budget Form state
  const [departmentName, setDepartmentName] = useState('Sports & Athletics Department');
  const [headOfDepartment, setHeadOfDepartment] = useState('Coach Bilal Ibn Rabah');
  const [allocatedAmount, setAllocatedAmount] = useState('18000');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getBudgets();
      setBudgets(data);
    } catch {
      toast.error('Failed to load departmental budgets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => {
      if (!query) return true;
      return b.departmentName.toLowerCase().includes(query.toLowerCase()) ||
        b.headOfDepartment.toLowerCase().includes(query.toLowerCase());
    });
  }, [budgets, query]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const allocNum = parseFloat(allocatedAmount || '0');

    const created = await financeService.createDepartmentalBudget({
      academicYearCode: '2026-2027',
      departmentName,
      headOfDepartment,
      allocatedAmount: allocNum,
      spentAmount: 0,
      remainingAmount: allocNum,
      utilizationPercentage: 0,
      status: 'on_track'
    });

    setBudgets([created, ...budgets]);
    toast.success(`Created Budget Allocation for ${departmentName} ($${allocNum.toFixed(2)})`);
    setShowCreateModal(false);
  };

  const totalAllocated = useMemo(() => budgets.reduce((s, b) => s + b.allocatedAmount, 0), [budgets]);
  const totalSpent = useMemo(() => budgets.reduce((s, b) => s + b.spentAmount, 0), [budgets]);
  const totalRemaining = useMemo(() => budgets.reduce((s, b) => s + b.remainingAmount, 0), [budgets]);
  const avgUtilization = useMemo(() => {
    if (totalAllocated === 0) return 0;
    return (totalSpent / totalAllocated) * 100;
  }, [totalAllocated, totalSpent]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_allocated',
      title: 'Total Institutional Budget Ceiling',
      value: `$${totalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${budgets.length} campus cost center departments`,
      trendDirection: 'up',
      icon: <Building2 className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'total_spent',
      title: 'Total YTD Departmental Spend',
      value: `$${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${avgUtilization.toFixed(1)}% total institutional budget utilization`,
      trendDirection: 'neutral',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'remaining_capacity',
      title: 'Available Budget Reserves',
      value: `$${totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Uncommitted operating capital ceiling',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'variance_alerts',
      title: 'Departmental Variance Warning',
      value: `${budgets.filter(b => b.status === 'warning' || b.status === 'exceeded').length} Alerts`,
      subtitle: 'Cost centers approaching or exceeding 90% allocation',
      trendDirection: budgets.filter(b => b.status === 'warning' || b.status === 'exceeded').length > 0 ? 'down' : 'up',
      icon: <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
    }
  ];

  const columns = useMemo<ColumnDef<DepartmentalBudget, any>[]>(() => {
    return [
      {
        accessorKey: 'departmentName',
        header: 'Department Cost Center & HOD',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-bold text-white text-xs sm:text-sm block">{row.original.departmentName}</span>
            <span className="text-[11px] text-slate-400 block font-mono">HOD: {row.original.headOfDepartment}</span>
          </div>
        )
      },
      {
        accessorKey: 'utilizationPercentage',
        header: 'Budget Utilization vs Actual Spend',
        cell: ({ row }) => {
          const b = row.original;
          const u = b.utilizationPercentage;
          return (
            <div className="space-y-1.5 w-full max-w-xs">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-300 font-bold">${b.spentAmount.toFixed(2)} spent</span>
                <span className={`font-black ${u > 90 ? 'text-rose-400' : u > 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {u.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all rounded-full ${
                    u > 90 ? 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse' :
                    u > 75 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                    'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  }`}
                  style={{ width: `${Math.min(u, 100)}%` }}
                />
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'allocatedAmount',
        header: 'Annual Allocation ($)',
        cell: ({ row }) => (
          <span className="font-mono text-xs sm:text-sm font-black text-white block">
            ${row.original.allocatedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        )
      },
      {
        accessorKey: 'remainingAmount',
        header: 'Remaining Reserve ($)',
        cell: ({ row }) => (
          <span className={`font-mono text-xs sm:text-sm font-black block ${row.original.remainingAmount <= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            ${row.original.remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        )
      },
      {
        accessorKey: 'status',
        header: 'Budget Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Inspect',
        cell: ({ row }) => (
          <button
            onClick={() => setSelectedBudget(row.original)}
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
      title="Departmental Budget vs Actual Spend & Variance Reporting"
      description="SAP S/4HANA departmental cost-center control. Monitor annual budget allocations across all departments, track real-time expenditure utilization, and prevent unauthorized overspending."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Payroll & Budget' }, { label: 'Departmental Budgets' }]}
      icon={<Building2 className="w-8 h-8 text-sky-400" />}
      recordCount={filteredBudgets.length}
      recordLabel="Cost Centers"
      activeFilterCount={0}
      onClearFilters={() => setQuery('')}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/budget/departments"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>Line Item Control</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Allocate Department Budget</span>
          </button>
        </div>
      }
    >
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/payroll" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>Staff Payroll Runs</span>
        </Link>
        <Link href="/finance/expenses" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5 text-amber-400" />
          <span>Operating Expenses</span>
        </Link>
        <Link href="/finance/budget" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          <span>Departmental Budget vs Actual</span>
        </Link>
        <Link href="/finance/budget/departments" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <PieChart className="w-3.5 h-3.5 text-sky-400" />
          <span>Line Item Allocations</span>
        </Link>
      </div>

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search budgets by department cost center name or Head of Department (HOD)..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Departmental budget figures refreshed from real-time expense postings.');
        }}
        activeFilterCount={0}
        onResetFilters={() => setQuery('')}
        createButtonLabel="+ Allocate Budget"
        onCreate={() => setShowCreateModal(true)}
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredBudgets}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedBudget(row)}
        onRowClick={(row) => setSelectedBudget(row)}
        emptyStateProps={{
          title: 'No Departmental Budgets Found',
          description: 'No cost centers have been assigned budget ceilings for this academic year.',
          isFilterActive: query.length > 0,
          onResetFilters: () => setQuery(''),
          createLabel: 'Allocate Cost Center Budget',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-6 h-6 text-sky-400" />
                <h3 className="text-base font-black text-white">Allocate Departmental Cost Center Ceiling</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Department / Cost Center Name</label>
                <input
                  type="text"
                  required
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Head of Department (HOD)</label>
                  <input
                    type="text"
                    required
                    value={headOfDepartment}
                    onChange={(e) => setHeadOfDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Annual Allocation Ceiling ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={allocatedAmount}
                    onChange={(e) => setAllocatedAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">Set Budget Ceiling</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedBudget}
        onClose={() => setSelectedBudget(null)}
        record={selectedBudget ? {
          name: selectedBudget.departmentName,
          id: selectedBudget.id,
          role: `HOD: ${selectedBudget.headOfDepartment}`,
          status: selectedBudget.status,
          email: `Academic Year: ${selectedBudget.academicYearCode}`,
          phone: `Utilization: ${selectedBudget.utilizationPercentage.toFixed(1)}%`,
          department: `Spent: $${selectedBudget.spentAmount.toFixed(2)}`,
          joinDate: selectedBudget.status,
          balance: `ANNUAL ALLOCATION: $${selectedBudget.allocatedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

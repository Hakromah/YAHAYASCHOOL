'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, PieChart, ShieldCheck, Clock, DollarSign,
  AlertTriangle, ArrowRight, CheckCircle2, Plus
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { DepartmentalBudget } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function DepartmentLineItemControlPage() {
  const [budgets, setBudgets] = useState<DepartmentalBudget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBudgets = async () => {
      setLoading(true);
      try {
        const data = await financeService.getBudgets();
        setBudgets(data);
      } catch {
        toast.error('Failed to load departmental line item allocations.');
      } finally {
        setLoading(false);
      }
    };
    fetchBudgets();
  }, []);

  const totalAllocated = budgets.reduce((s, b) => s + b.allocatedAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spentAmount, 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'allocated',
      title: 'Total Line Item Allocation Ceiling',
      value: `$${totalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${budgets.length} institutional departments`,
      trendDirection: 'up',
      icon: <Building2 className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'spent',
      title: 'Real-Time Line Item Drawdown',
      value: `$${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${((totalSpent / (totalAllocated || 1)) * 100).toFixed(1)}% total drawdown`,
      trendDirection: 'neutral',
      icon: <PieChart className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'governance',
      title: 'Line Item Transfer Governance',
      value: 'Restricted (HOD/Director)',
      subtitle: 'Mandatory approval for inter-department budget reallocations',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />
    }
  ];

  const columns: ColumnDef<DepartmentalBudget, any>[] = [
    {
      accessorKey: 'departmentName',
      header: 'Department & Cost Center HOD',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-white text-xs block">{row.original.departmentName}</span>
          <span className="text-[11px] text-slate-400 font-mono block">HOD: {row.original.headOfDepartment}</span>
        </div>
      )
    },
    {
      accessorKey: 'allocatedAmount',
      header: 'Line Item Allocation ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-white">
          ${row.original.allocatedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'spentAmount',
      header: 'Disbursed Drawdown ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-amber-400">
          ${row.original.spentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'remainingAmount',
      header: 'Available Line Capacity ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400">
          ${row.original.remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Reallocate Line Item',
      cell: ({ row }) => (
        <button
          onClick={() => toast.success(`Initiated line-item transfer wizard for ${row.original.departmentName}.`)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
        >
          Reallocate Funds →
        </button>
      )
    }
  ];

  return (
    <EnterpriseModuleShell
      title="Departmental Line Item Allocation Control"
      description="Manage fine-grained cost-center allocations within institutional budgets and govern inter-departmental capital transfers."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Payroll & Budget' }, { label: 'Line Item Allocations' }]}
      icon={<PieChart className="w-8 h-8 text-sky-400" />}
      recordCount={budgets.length}
      recordLabel="Departments"
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <Link
          href="/finance/budget"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <span>← Back to Budget Analytics</span>
        </Link>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseDataGrid
        data={budgets}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: 'No Line Item Budgets',
          description: 'No cost centers configured.',
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}

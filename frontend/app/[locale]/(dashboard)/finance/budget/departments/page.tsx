/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Building2, PieChart, ShieldCheck, TrendingUp, UserCheck
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { DepartmentBudget } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function DepartmentLineItemControlPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const [budgets, setBudgets] = useState<DepartmentBudget[]>([]);
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

  const totalAllocated = useMemo(() => budgets.reduce((s, b) => s + (Number(b.allocatedAmount) || 0), 0), [budgets]);
  const totalSpent     = useMemo(() => budgets.reduce((s, b) => s + (Number(b.spentAmount) || 0), 0), [budgets]);
  const totalRemaining = useMemo(() => budgets.reduce((s, b) => s + (Number(b.remainingAmount) || 0), 0), [budgets]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'allocated',
      title: 'Total Line Item Allocation Ceiling',
      value: `$${totalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${budgets.length} institutional departments`,
      trendDirection: 'up',
      icon: <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'spent',
      title: 'Real-Time Line Item Drawdown',
      value: `$${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(1) : 0}% total drawdown`,
      trendDirection: 'neutral',
      icon: <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'remaining',
      title: 'Available Uncommitted Capital',
      value: `$${totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Unspent department reserves',
      trendDirection: 'up',
      icon: <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    },
    {
      id: 'governance',
      title: 'Line Item Transfer Governance',
      value: 'Restricted (HOD/Director)',
      subtitle: 'Mandatory approval for inter-department budget reallocations',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    }
  ];

  const columns: ColumnDef<DepartmentBudget, any>[] = [
    {
      accessorKey: 'departmentName',
      header: 'Department & Cost Center HOD',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 dark:text-white text-xs block">
            {row.original.departmentName || row.original.budgetTitle}
          </span>
          <span className="text-[11px] text-slate-500 font-mono block flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 inline" />
            {typeof row.original.headOfDepartment === 'string' ? row.original.headOfDepartment : (row.original.headOfDepartment?.name || 'Department Lead')}
          </span>
          <span className="text-[10px] font-mono text-slate-400">{row.original.code || `CC-${row.original.id}`}</span>
        </div>
      )
    },
    {
      accessorKey: 'allocatedAmount',
      header: 'Line Item Allocation ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white">
          ${(Number(row.original.allocatedAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'spentAmount',
      header: 'Disbursed Drawdown ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-amber-700 dark:text-amber-400">
          ${(Number(row.original.spentAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'remainingAmount',
      header: 'Available Line Capacity ($)',
      cell: ({ row }) => {
        const rem = Number(row.original.remainingAmount) || 0;
        return (
          <span className={`font-mono text-xs sm:text-sm font-black ${rem <= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            ${rem.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      accessorKey: 'utilizationPercentage',
      header: 'Utilization',
      cell: ({ row }) => {
        const u = Number(row.original.utilizationPercentage || 0);
        return (
          <div className="space-y-1 min-w-[100px]">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className={`font-black ${u > 90 ? 'text-rose-600 dark:text-rose-400' : u > 75 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{u.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${u > 90 ? 'bg-rose-500' : u > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(u, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Capacity Status',
      cell: ({ row }) => <StatusBadge status={row.original.status || 'on_track'} size="sm" />
    }
  ];

  return (
    <EnterpriseModuleShell
      title="Departmental Line Item Fiscal Control"
      description="Granular sub-ledger spending constraints preventing department budget overflows across academic disciplines."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Payroll & Budget', href: '/finance/budget' }, { label: 'Department Control' }]}
      icon={<Building2 className="w-8 h-8 text-sky-600 dark:text-sky-400" />}
      recordCount={budgets.length}
      recordLabel="Departments"
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/budget/approvals"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Budget Approvals
          </Link>
          <Link
            href="/finance/budget"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm"
          >
            ← Back to Global Budget
          </Link>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Sub-Nav */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/finance/budget" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all">
          Budget Overview
        </Link>
        <Link href="/finance/budget/departments" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <PieChart className="w-3.5 h-3.5" />
          Line Item Allocations
        </Link>
        <Link href="/finance/budget/approvals" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all">
          Approvals
        </Link>
      </div>

      <EnterpriseDataGrid
        data={budgets}
        columns={columns}
        isLoading={loading}
        density="cozy"
        maxHeight={570}
        emptyStateProps={{
          title: 'No Department Line Items Found',
          description: 'No departmental cost centers found. Create budgets in the Budget Overview page.',
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}

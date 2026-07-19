'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign, Plus, Settings, Globe, Percent, CreditCard,
  ShieldCheck, CheckCircle2, AlertTriangle, Save, Award
} from 'lucide-react';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface FeeStructureParameter {
  id: string;
  name: string;
  gradeLevel: string;
  annualAmount: number;
  installmentAllowed: boolean;
  scholarshipEligible: boolean;
  status: 'active' | 'inactive';
}

export default function AcademicFeeParametersPage() {
  const [feeStructures, setFeeStructures] = useState<FeeStructureParameter[]>([
    {
      id: 'FEE-HIFZ-PREP',
      name: 'Quran Hifz Intensive & Foundation Program',
      gradeLevel: 'Grade 1 - 3 (Primary Hifz)',
      annualAmount: 1800,
      installmentAllowed: true,
      scholarshipEligible: true,
      status: 'active'
    },
    {
      id: 'FEE-STEM-MID',
      name: 'STEM & Robotics Secondary Partition',
      gradeLevel: 'Grade 7 - 9 (Middle School)',
      annualAmount: 2600,
      installmentAllowed: true,
      scholarshipEligible: true,
      status: 'active'
    },
    {
      id: 'FEE-ADV-HIGH',
      name: 'Advanced Baccalaureate & Cambridge Partition',
      gradeLevel: 'Grade 10 - 12 (High School)',
      annualAmount: 3400,
      installmentAllowed: true,
      scholarshipEligible: true,
      status: 'active'
    }
  ]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'fee_partitions',
      title: 'Active Fee Partitions',
      value: `${feeStructures.length} Grade Structures`,
      subtitle: 'Automated invoice generation active for AY 2026-2027',
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'installment_rule',
      title: 'Installment Payment Plan Rule',
      value: '3 Term Split (40/30/30)',
      subtitle: 'Parent billing center supports flexible tranche schedules',
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'scholarship_rule',
      title: 'Waqf & Merit Scholarship Deductions',
      value: 'Enabled Across Grades',
      subtitle: 'Direct GL credit off-setting from institutional endowment fund',
      trendDirection: 'up',
      icon: <Award className="w-5 h-5 text-amber-400" />
    }
  ];

  const columns: ColumnDef<FeeStructureParameter, any>[] = [
    {
      accessorKey: 'name',
      header: 'Fee Structure Title & Partition',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-white text-xs sm:text-sm block">{row.original.name}</span>
          <span className="text-[11px] font-mono text-slate-400 block">{row.original.gradeLevel} • ID: {row.original.id}</span>
        </div>
      )
    },
    {
      accessorKey: 'annualAmount',
      header: 'Annual Tuition Ceiling ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400">
          ${row.original.annualAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'installmentAllowed',
      header: 'Installment Tranches',
      cell: ({ row }) => (
        <span className="text-xs font-bold text-sky-400 font-mono">
          {row.original.installmentAllowed ? '✓ 3-Term Tranches Allowed' : 'Full Payment Only'}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      id: 'actions',
      header: 'Inspect Parameters',
      cell: ({ row }) => (
        <button
          onClick={() => toast.success(`Inspecting fee parameters for ${row.original.name}.`)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
        >
          Adjust Fee →
        </button>
      )
    }
  ];

  return (
    <EnterpriseModuleShell
      title="Academic Fee Parameters & Penalty Rules Console"
      description="SAP S/4HANA & Odoo academic billing setup. Define baseline grade-level tuition rates, installment tranche schedules, and Waqf scholarship eligibility rules."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Settings & Config' }, { label: 'Fee Parameters' }]}
      icon={<DollarSign className="w-8 h-8 text-rose-400" />}
      recordCount={feeStructures.length}
      recordLabel="Fee Structures"
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <button
          onClick={() => toast.success('Added new grade-level fee structure partition for AY 2026-2027.')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Grade Fee Structure</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-emerald-400" />
          <span>General Policy Hub</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span>Multi-Currency & Rates</span>
        </Link>
        <Link href="/settings/finance/tax" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-amber-400" />
          <span>VAT & Tax Rules</span>
        </Link>
        <Link href="/settings/finance/methods" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          <span>Payment Gateways & POS</span>
        </Link>
        <Link href="/settings/finance/fees" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5" />
          <span>Fee & Penalty Rules</span>
        </Link>
      </div>

      <EnterpriseDataGrid
        data={feeStructures}
        columns={columns}
        isLoading={false}
        density="cozy"
        emptyStateProps={{
          title: 'No Fee Parameters',
          description: 'No grade fee structures defined.',
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}

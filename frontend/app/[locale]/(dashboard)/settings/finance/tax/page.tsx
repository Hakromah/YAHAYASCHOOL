'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Percent, Plus, Save, ShieldCheck, CheckCircle2, AlertCircle,
  Building2, Settings, Globe, CreditCard, DollarSign
} from 'lucide-react';
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
  const [taxRules, setTaxRules] = useState<TaxRuleItem[]>([
    {
      id: 'TAX-001',
      name: 'Educational Tuition Exemption (Shariah & Statutory)',
      ratePercentage: 0,
      appliesTo: 'Academic Tuition & Waqf Grants',
      isDefault: true,
      status: 'active'
    },
    {
      id: 'TAX-002',
      name: 'Auxiliary Services & Uniforms VAT',
      ratePercentage: 18,
      appliesTo: 'Cafeteria, Textbooks & School Uniforms',
      isDefault: false,
      status: 'active'
    },
    {
      id: 'TAX-003',
      name: 'Withholding Tax on International Transfers',
      ratePercentage: 5,
      appliesTo: 'Overseas Vendor & Consultant Claims',
      isDefault: false,
      status: 'active'
    }
  ]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'tuition_tax',
      title: 'Tuition VAT Exemption',
      value: '0% Statutory Rate',
      subtitle: 'Verified institutional educational status',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'auxiliary_vat',
      title: 'Auxiliary Supplies VAT Rate',
      value: '18% Standard',
      subtitle: 'Applicable to cafeteria and commercial supplies',
      trendDirection: 'neutral',
      icon: <Percent className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'rules_active',
      title: 'Configured Tax Brackets',
      value: `${taxRules.length} Brackets`,
      subtitle: 'Automated tax computation engine integrated',
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-sky-400" />
    }
  ];

  const columns: ColumnDef<TaxRuleItem, any>[] = [
    {
      accessorKey: 'name',
      header: 'Tax Bracket Title & Code',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-white text-xs sm:text-sm block">{row.original.name}</span>
          <span className="text-[11px] font-mono text-slate-400 block">ID: {row.original.id}</span>
        </div>
      )
    },
    {
      accessorKey: 'ratePercentage',
      header: 'Tax Rate (%)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-amber-400">
          {row.original.ratePercentage.toFixed(1)}%
        </span>
      )
    },
    {
      accessorKey: 'appliesTo',
      header: 'Applicable Domain Scope',
      cell: ({ row }) => <span className="font-bold text-slate-300 text-xs">{row.original.appliesTo}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      id: 'actions',
      header: 'Toggle Rule',
      cell: ({ row }) => (
        <button
          onClick={() => {
            row.original.status = row.original.status === 'active' ? 'inactive' : 'active';
            setTaxRules([...taxRules]);
            toast.success(`Tax bracket [${row.original.name}] status toggled.`);
          }}
          className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
        >
          {row.original.status === 'active' ? 'Disable Rule' : 'Enable Rule'}
        </button>
      )
    }
  ];

  return (
    <EnterpriseModuleShell
      title="VAT & Institutional Tax Rules Console"
      description="SAP S/4HANA tax computation engine. Define educational tax exemptions, auxiliary supplies VAT brackets, and vendor withholding rules."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Settings & Config' }, { label: 'VAT & Tax Rules' }]}
      icon={<Percent className="w-8 h-8 text-amber-400" />}
      recordCount={taxRules.length}
      recordLabel="Tax Brackets"
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <button
          onClick={() => toast.success('Added new custom institutional tax bracket rule.')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Tax Bracket</span>
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
        <Link href="/settings/finance/tax" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5" />
          <span>VAT & Tax Rules</span>
        </Link>
        <Link href="/settings/finance/methods" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          <span>Payment Gateways & POS</span>
        </Link>
        <Link href="/settings/finance/fees" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-rose-400" />
          <span>Fee & Penalty Rules</span>
        </Link>
      </div>

      <EnterpriseDataGrid
        data={taxRules}
        columns={columns}
        isLoading={false}
        density="cozy"
        emptyStateProps={{
          title: 'No Tax Rules',
          description: 'No tax rules defined.',
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}

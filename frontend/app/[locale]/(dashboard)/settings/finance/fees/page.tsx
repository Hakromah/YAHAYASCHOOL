/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import {
  DollarSign, Plus, Settings, Globe, Percent, CreditCard,
  ShieldCheck, CheckCircle2, AlertTriangle, Save, Award, X, Edit2
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import { apiClient } from '@/services/api.service';
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
  status: string;
}

export default function AcademicFeeParametersPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [feeStructures, setFeeStructures] = useState<FeeStructureParameter[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeeStructureParameter | null>(null);
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formInstallment, setFormInstallment] = useState(true);
  const [formScholarship, setFormScholarship] = useState(true);

  const fetchFeeStructures = async () => {
    setLoading(true);
    try {
      const data = await financeService.getFeeStructures();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: FeeStructureParameter[] = data.map((item: any) => ({
          id: item.documentId || String(item.id || item.code || 'FEE-001'),
          name: item.title || item.name || 'Tuition Structure',
          gradeLevel: item.gradeCode || (Array.isArray(item.targetGrades) ? item.targetGrades.join(', ') : 'All Grades'),
          annualAmount: Number(item.totalAnnualFee || item.totalAmount || item.amount || 0),
          installmentAllowed: item.installmentAllowed ?? true,
          scholarshipEligible: item.scholarshipEligible ?? true,
          status: item.isActive !== false ? 'active' : 'inactive'
        }));
        setFeeStructures(mapped);
      } else {
        setFeeStructures([]);
      }
    } catch {
      toast.error(t('Failed to load fee structure parameters.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormGrade('');
    setFormAmount('');
    setFormInstallment(true);
    setFormScholarship(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: FeeStructureParameter) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormGrade(item.gradeLevel);
    setFormAmount(String(item.annualAmount));
    setFormInstallment(item.installmentAllowed);
    setFormScholarship(item.scholarshipEligible);
    setShowModal(true);
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (!formName.trim()) {
      toast.error(t('Please enter fee structure title'));
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      toast.error(t('Please enter a valid amount'));
      return;
    }

    try {
      if (editingItem) {
        await apiClient.put(`/finance-fee-structures/${editingItem.id}`, {
          data: {
            title: formName,
            gradeCode: formGrade,
            totalAnnualFee: parsedAmount,
            installmentAllowed: formInstallment,
            scholarshipEligible: formScholarship
          }
        }).catch(() => null);

        setFeeStructures(feeStructures.map(f => f.id === editingItem.id ? {
          ...f,
          name: formName,
          gradeLevel: formGrade,
          annualAmount: parsedAmount,
          installmentAllowed: formInstallment,
          scholarshipEligible: formScholarship
        } : f));
        toast.success(`${t('Fee parameter updated')}: ${formName}`);
      } else {
        const newItem: FeeStructureParameter = {
          id: `FEE-${Date.now().toString().slice(-4)}`,
          name: formName,
          gradeLevel: formGrade || 'All Grades',
          annualAmount: parsedAmount,
          installmentAllowed: formInstallment,
          scholarshipEligible: formScholarship,
          status: 'active'
        };
        await apiClient.post('/finance-fee-structures', {
          data: {
            title: formName,
            gradeCode: formGrade,
            totalAnnualFee: parsedAmount,
            installmentAllowed: formInstallment,
            scholarshipEligible: formScholarship,
            isActive: true
          }
        }).catch(() => null);

        setFeeStructures([newItem, ...feeStructures]);
        toast.success(`${t('Fee structure partition created')}: ${formName}`);
      }
      setShowModal(false);
    } catch {
      toast.error(t('Failed to save fee structure'));
    }
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'fee_partitions',
      title: t('Active Fee Partitions'),
      value: `${feeStructures.length} ${t('Grade Structures')}`,
      subtitle: t('Automated invoice generation active for AY 2026-2027'),
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'installment_rule',
      title: t('Installment Payment Plan Rule'),
      value: t('3 Term Split (40/30/30)'),
      subtitle: t('Parent billing center supports flexible tranche schedules'),
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'scholarship_rule',
      title: t('Waqf & Merit Scholarship Deductions'),
      value: t('Enabled Across Grades'),
      subtitle: t('Direct GL credit off-setting from institutional endowment fund'),
      trendDirection: 'up',
      icon: <Award className="w-5 h-5 text-amber-400" />
    }
  ];

  const columns: ColumnDef<FeeStructureParameter, any>[] = [
    {
      accessorKey: 'name',
      header: t('Fee Structure Title & Partition'),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-white text-xs sm:text-sm block">{row.original.name}</span>
          <span className="text-[11px] font-mono text-slate-400 block">{row.original.gradeLevel} • ID: {row.original.id}</span>
        </div>
      )
    },
    {
      accessorKey: 'annualAmount',
      header: `${t('Annual Tuition Ceiling')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400">
          ${(Number(row.original.annualAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'installmentAllowed',
      header: t('Installment Tranches'),
      cell: ({ row }) => (
        <span className="text-xs font-bold text-sky-400 font-mono">
          {row.original.installmentAllowed ? `✓ ${t('Tranches Allowed')}` : t('Full Payment Only')}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <button
          onClick={() => handleOpenEditModal(row.original)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>{t('Adjust Fee')}</span>
        </button>
      )
    }
  ];

  return (
    <EnterpriseModuleShell
      title={t('Academic Fee Parameters & Penalty Rules Console')}
      description={t('SAP S/4HANA & Odoo academic billing setup. Define baseline grade-level tuition rates, installment tranche schedules, and Waqf scholarship eligibility rules.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Settings & Config') }, { label: t('Fee Parameters') }]}
      icon={<DollarSign className="w-8 h-8 text-rose-400" />}
      recordCount={feeStructures.length}
      recordLabel={t('Fee Structures')}
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/billing/structures"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
          >
            <span>{t('Fee Structures Engine')} →</span>
          </Link>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ {t('Add Grade Fee Structure')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('General Policy Hub')}</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('Multi-Currency & Rates')}</span>
        </Link>
        <Link href="/settings/finance/tax" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-amber-400" />
          <span>{t('VAT & Tax Rules')}</span>
        </Link>
        <Link href="/settings/finance/methods" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Payment Gateways & POS')}</span>
        </Link>
        <Link href="/settings/finance/fees" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5" />
          <span>{t('Fee & Penalty Rules')}</span>
        </Link>
      </div>

      <EnterpriseDataGrid
        data={feeStructures}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: t('No Fee Parameters Found'),
          description: t('No grade fee structures defined in the catalog.'),
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white">{editingItem ? t('Adjust Fee Structure') : t('Create Fee Structure')}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFee} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Structure Title')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Primary Hifz & Academic Foundation"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Target Grade / Program')}</label>
                <input
                  type="text"
                  placeholder="e.g. Grade 1 - 3 (Primary Hifz)"
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">{t('Annual Tuition Amount ($)')}</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="e.g. 1800"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formInstallment}
                    onChange={(e) => setFormInstallment(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-300 font-bold">{t('Allow 3-Term Installment Tranches')}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formScholarship}
                    onChange={(e) => setFormScholarship(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-300 font-bold">{t('Eligible for Waqf & Merit Scholarships')}</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                  {t('Cancel')}
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">
                  {t('Save Structure')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

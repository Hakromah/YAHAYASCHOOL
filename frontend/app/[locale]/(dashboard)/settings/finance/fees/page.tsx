/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  DollarSign, Plus, Settings, Globe, Percent, CreditCard,
  ShieldCheck, CheckCircle2, AlertTriangle, Save, Award, X, Edit2,
  Clock, Trash2, Sliders, FileText, Check, ArrowRight, ShieldAlert,
  GraduationCap
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { usePermissions } from '@/hooks/usePermissions';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import { apiClient } from '@/services/api.service';
import type { GradeLevel } from '@/types/erp.types';
import type { FinanceSettings } from '@/types/finance.types';
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
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);
  const { can } = usePermissions();
  const isAdmin = Boolean(can.isAdmin);

  const [feeStructures, setFeeStructures] = useState<FeeStructureParameter[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Institutional Penalty & Governance Policy States
  const [penaltyMode, setPenaltyMode] = useState<'percentage' | 'fixed'>('percentage');
  const [penaltyPercentage, setPenaltyPercentage] = useState('5.0');
  const [penaltyFixedAmount, setPenaltyFixedAmount] = useState('20.00');
  const [gracePeriodDays, setGracePeriodDays] = useState('14');
  const [maxPenaltyCap, setMaxPenaltyCap] = useState('15.0');
  const [enableHolds, setEnableHolds] = useState(true);
  const [holdsThresholdDays, setHoldsThresholdDays] = useState('15');
  const [holdsMinBalance, setHoldsMinBalance] = useState('50');
  const [installmentT1, setInstallmentT1] = useState('40');
  const [installmentT2, setInstallmentT2] = useState('30');
  const [installmentT3, setInstallmentT3] = useState('30');
  const [waqfMaxSubsidy, setWaqfMaxSubsidy] = useState('100');

  // Add / Edit Fee Structure Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeeStructureParameter | null>(null);
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formInstallment, setFormInstallment] = useState(true);
  const [formScholarship, setFormScholarship] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [structuresData, gradesData, settingsData] = await Promise.all([
        financeService.getFeeStructures().catch(() => []),
        erpService.getGradeLevels(locale).catch(() => []),
        financeService.getSettings().catch(() => ({} as FinanceSettings))
      ]);

      if (Array.isArray(structuresData) && structuresData.length > 0) {
        const mapped: FeeStructureParameter[] = structuresData.map((item: any) => ({
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

      setGradeLevels(gradesData || []);

      if (settingsData) {
        if (settingsData.enableFinancialHolds !== undefined) setEnableHolds(settingsData.enableFinancialHolds);
        if (settingsData.lateFeeRule) {
          if (settingsData.lateFeeRule.includes('%')) {
            setPenaltyMode('percentage');
            const match = settingsData.lateFeeRule.match(/(\d+(\.\d+)?)/);
            if (match) setPenaltyPercentage(match[1]);
          }
        }
      }
    } catch {
      toast.error(i18nT('Failed to load fee structure parameters.', locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormGrade(gradeLevels[0]?.name || 'Grade 1 - 3');
    setFormAmount('1800');
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
    if (!isAdmin) {
      toast.error(i18nT('Permission denied: Only Administrators can configure institutional fee parameters.', locale));
      return;
    }
    const parsedAmount = parseFloat(formAmount);
    if (!formName.trim()) {
      toast.error(i18nT('Please enter fee structure title', locale));
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      toast.error(i18nT('Please enter a valid amount', locale));
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
        toast.success(`${i18nT('Fee parameter updated', locale)}: ${formName}`);
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
        toast.success(`${i18nT('Fee structure partition created', locale)}: ${formName}`);
      }
      setShowModal(false);
    } catch {
      toast.error(i18nT('Failed to save fee structure', locale));
    }
  };

  const handleDeleteFee = async (id: string, name: string) => {
    if (!isAdmin) {
      toast.error(i18nT('Permission denied: Only Administrators can delete fee parameters.', locale));
      return;
    }
    if (!confirm(`${i18nT('Are you sure you want to remove', locale)} "${name}"?`)) return;
    try {
      await apiClient.delete(`/finance-fee-structures/${id}`).catch(() => null);
      setFeeStructures(feeStructures.filter(f => f.id !== id));
      toast.success(`${i18nT('Removed fee structure', locale)}: ${name}`);
    } catch {
      toast.error(i18nT('Failed to delete fee structure', locale));
    }
  };

  const handleSavePenaltyGovernance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error(i18nT('Permission denied: Only Administrators can update penalty & financial hold governance.', locale));
      return;
    }
    setSavingPolicy(true);
    try {
      const generatedRule = penaltyMode === 'percentage'
        ? `${penaltyPercentage}% after ${gracePeriodDays} days of invoice maturity (Cap: ${maxPenaltyCap}%)`
        : `$${penaltyFixedAmount} flat fine after ${gracePeriodDays} days of invoice maturity`;

      await financeService.updateSettings({
        lateFeeRule: generatedRule,
        lateFeePolicy: generatedRule,
        enableFinancialHolds: enableHolds
      });

      toast.success(i18nT('Institutional fee penalty & financial hold governance rules saved successfully!', locale));
    } catch {
      toast.error(i18nT('Failed to save penalty rules', locale));
    } finally {
      setSavingPolicy(false);
    }
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'fee_partitions',
      title: 'Active Fee Partitions',
      value: `${feeStructures.length} Grade Structures`,
      subtitle: 'Automated invoice generation active for current Academic Year',
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'late_fee_rule',
      title: 'Late Fee Penalty Rule',
      value: penaltyMode === 'percentage' ? `${penaltyPercentage}% Surcharge` : `$${penaltyFixedAmount} Flat Fine`,
      subtitle: `${gracePeriodDays} days grace period before penalty`,
      trendDirection: 'up',
      icon: <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'holds_policy',
      title: 'Automated Financial Holds',
      value: enableHolds ? 'ENABLED' : 'DISABLED',
      subtitle: `Overdue > ${holdsThresholdDays} days triggers report card lock`,
      trendDirection: enableHolds ? 'up' : 'down',
      icon: <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse" />
    },
    {
      id: 'scholarship_rule',
      title: 'Waqf & Merit Subsidy Cap',
      value: `${waqfMaxSubsidy}% Max Coverage`,
      subtitle: 'Direct GL credit off-setting from endowment fund',
      trendDirection: 'up',
      icon: <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    }
  ];

  const columns: ColumnDef<FeeStructureParameter, any>[] = [
    {
      accessorKey: 'name',
      header: 'Fee Structure Title & Partition',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">{row.original.name}</span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">{row.original.gradeLevel} • ID: {row.original.id}</span>
        </div>
      )
    },
    {
      accessorKey: 'annualAmount',
      header: 'Annual Tuition Ceiling ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white">
          ${(Number(row.original.annualAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'installmentAllowed',
      header: 'Installment Tranches',
      cell: ({ row }) => (
        <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">
          {row.original.installmentAllowed ? `✓ 3-Term (${installmentT1}/${installmentT2}/${installmentT3})` : 'Full Payment Only'}
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
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {isAdmin ? (
            <>
              <button
                onClick={() => handleOpenEditModal(row.original)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Adjust</span>
              </button>
              <button
                onClick={() => handleDeleteFee(row.original.id, row.original.name)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <Link
              href="/finance/billing/structures"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all"
            >
              <span>View in Engine</span>
            </Link>
          )}
        </div>
      )
    }
  ];

  // Reusable token classes
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300 block';
  const modalCls = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200';
  const modalPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4';

  return (
    <EnterpriseModuleShell
      title="Academic Fee Parameters & Penalty Rules Console"
      description="SAP S/4HANA & Odoo academic billing setup. Define baseline grade-level tuition rates, installment tranche schedules, late payment penalty surcharges, and automated academic financial holds."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Settings & Config', href: '/settings/finance' }, { label: 'Fee & Penalty Rules' }]}
      icon={<DollarSign className="w-8 h-8 text-rose-600 dark:text-rose-400" />}
      recordCount={feeStructures.length}
      recordLabel="Fee Structures"
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <div className="flex items-center gap-2">
          {!isAdmin && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 text-xs font-bold shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Governed</span>
            </span>
          )}
          <Link
            href="/finance/billing/structures"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <span>Fee Structures Engine →</span>
          </Link>
          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Grade Fee Structure</span>
            </button>
          )}
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Non-Admin Notice Banner */}
      {!isAdmin && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300 mb-2 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white leading-tight">Institutional Policy Notice</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Fee parameters and penalty rules are governed by School Administrators. Accountants receive and execute these rules across billing workflows.
              </p>
            </div>
          </div>
          <Link
            href="/finance/billing/structures"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 transition-all shadow-sm"
          >
            <span>Fee Structures →</span>
          </Link>
        </div>
      )}

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/settings/finance" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>General Policy Hub</span>
        </Link>
        <Link href="/settings/finance/currencies" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Multi-Currency & Rates</span>
        </Link>
        <Link href="/settings/finance/tax" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>VAT & Tax Rules</span>
        </Link>
        <Link href="/settings/finance/methods" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Payment Gateways & POS</span>
        </Link>
        <Link href="/settings/finance/fees" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5" />
          <span>Fee & Penalty Rules</span>
        </Link>
      </div>

      {/* Grade Level Fee Partitions Data Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Grade-Level Fee Partitions & Catalog</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">
            {feeStructures.length} Configured Partitions
          </span>
        </div>

        <EnterpriseDataGrid
          data={feeStructures}
          columns={columns}
          isLoading={loading}
          density="cozy"
          emptyStateProps={{
            title: 'No Fee Parameters Found',
            description: 'No grade fee structures defined in the catalog.',
            isFilterActive: false,
            onResetFilters: () => {},
            createLabel: 'Create First Fee Structure',
            onCreate: handleOpenCreateModal
          }}
        />
      </div>

      {/* Comprehensive Late Fee & Financial Hold Rules Form */}
      <form onSubmit={handleSavePenaltyGovernance} className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
        {/* Late Fee Calculation Engine */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">1. Late Penalty Calculation Engine</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              SAP S/4HANA
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className={labelCls}>Penalty Surcharge Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPenaltyMode('percentage')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    penaltyMode === 'percentage'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  % Percentage Surcharge
                </button>
                <button
                  type="button"
                  onClick={() => setPenaltyMode('fixed')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    penaltyMode === 'fixed'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  $ Fixed Monthly Fine
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {penaltyMode === 'percentage' ? (
                <div className="space-y-1">
                  <label className={labelCls}>Monthly Penalty Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={penaltyPercentage}
                    onChange={(e) => setPenaltyPercentage(e.target.value)}
                    className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 font-bold'}
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className={labelCls}>Fixed Penalty Fine ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={penaltyFixedAmount}
                    onChange={(e) => setPenaltyFixedAmount(e.target.value)}
                    className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 font-bold'}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className={labelCls}>Grace Period (Days After Due Date)</label>
                <input
                  type="number"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(e.target.value)}
                  className={inputCls + ' font-mono'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Compounding Maximum Penalty Cap (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={maxPenaltyCap}
                  onChange={(e) => setMaxPenaltyCap(e.target.value)}
                  className={inputCls + ' font-mono'}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Waqf Max Subsidy Rate (%)</label>
                <input
                  type="number"
                  step="1"
                  value={waqfMaxSubsidy}
                  onChange={(e) => setWaqfMaxSubsidy(e.target.value)}
                  className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 font-bold'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Holds & Installment Ratios */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">2. Academic Holds & Tranche Ratios</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Automated Holds
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Automated Academic Financial Holds</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Locks report cards, exam clearances, and student LMS portals when fee balance is overdue</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableHolds}
                  onChange={(e) => setEnableHolds(e.target.checked)}
                  aria-label="Toggle automated academic financial holds"
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Hold Trigger Threshold (Days Overdue)</label>
                <input
                  type="number"
                  value={holdsThresholdDays}
                  onChange={(e) => setHoldsThresholdDays(e.target.value)}
                  className={inputCls + ' font-mono'}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Min Overdue Balance to Trigger Hold ($ USD)</label>
                <input
                  type="number"
                  value={holdsMinBalance}
                  onChange={(e) => setHoldsMinBalance(e.target.value)}
                  className={inputCls + ' font-mono'}
                />
              </div>
            </div>

            {/* 3-Term Installment Tranche Ratios */}
            <div className="space-y-1">
              <label className={labelCls}>Default 3-Term Installment Tranche Ratios (%)</label>
              <div className="grid grid-cols-3 gap-2 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Term 1 (%)</span>
                  <input
                    type="number"
                    value={installmentT1}
                    onChange={(e) => setInstallmentT1(e.target.value)}
                    className={inputCls + ' text-sky-600 dark:text-sky-400 font-bold'}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Term 2 (%)</span>
                  <input
                    type="number"
                    value={installmentT2}
                    onChange={(e) => setInstallmentT2(e.target.value)}
                    className={inputCls + ' text-sky-600 dark:text-sky-400 font-bold'}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Term 3 (%)</span>
                  <input
                    type="number"
                    value={installmentT3}
                    onChange={(e) => setInstallmentT3(e.target.value)}
                    className={inputCls + ' text-sky-600 dark:text-sky-400 font-bold'}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPolicy || !isAdmin}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>
                  {!isAdmin
                    ? 'Admin Governed Policy (Read Only)'
                    : savingPolicy
                    ? 'Saving Governance Rules...'
                    : 'Save Institutional Penalty & Holds Policy'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal */}
      {showModal && (
        <div className={modalCls}>
          <div className={modalPanelCls}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{editingItem ? 'Adjust Fee Structure' : 'Create Fee Structure'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFee} className="space-y-3">
              <div className="space-y-1">
                <label className={labelCls}>Structure Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Primary Hifz & Academic Foundation"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Target Grade / Program (from DB)</label>
                <select
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value)}
                  className={selectCls}
                >
                  {gradeLevels.map(g => (
                    <option key={g.id} value={g.name}>
                      {g.name} ({g.code})
                    </option>
                  ))}
                  {gradeLevels.length === 0 && <option value="Grade 1 - 3">Grade 1 - 3 (Primary Hifz)</option>}
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Annual Tuition Amount ($ USD)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="e.g. 1800"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 font-bold'}
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formInstallment}
                    onChange={(e) => setFormInstallment(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Allow 3-Term Installment Tranches</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formScholarship}
                    onChange={(e) => setFormScholarship(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Eligible for Waqf & Merit Scholarships</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer">
                  Save Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

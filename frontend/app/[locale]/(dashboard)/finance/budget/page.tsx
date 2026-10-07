/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Building2, Plus, Download, Eye,
  DollarSign, ShieldCheck,
  AlertTriangle, Users, PieChart,
  GraduationCap, UserCheck, Edit2, Trash2, ArrowLeftRight, X,
  TrendingUp, Printer,
  FileCheck
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import type { DepartmentBudget } from '@/types/finance.types';
import type { Section, Teacher, AcademicYear } from '@/types/erp.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface BudgetLineCategory {
  name: string;
  amount: number;
}

export default function DepartmentalBudgetsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

  const [budgets, setBudgets] = useState<DepartmentBudget[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & UI
  const [query, setQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals
  const [inspectedBudget, setInspectedBudget] = useState<DepartmentBudget | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<DepartmentBudget | null>(null);

  // Form
  const [formSectionId, setFormSectionId] = useState('');
  const [formDepartmentName, setFormDepartmentName] = useState('');
  const [formCostCenterCode, setFormCostCenterCode] = useState('');
  const [formHeadOfDepartment, setFormHeadOfDepartment] = useState('');
  const [formAcademicYearCode, setFormAcademicYearCode] = useState('2026-2027');
  const [formAllocatedAmount, setFormAllocatedAmount] = useState('');
  const [formCategories, setFormCategories] = useState<BudgetLineCategory[]>([
    { name: 'Instructional Supplies & Curriculum', amount: 0 },
    { name: 'Laboratory & Digital Equipment', amount: 0 },
    { name: 'Field Activities & Academic Competitions', amount: 0 },
    { name: 'Faculty Continuous Professional Dev.', amount: 0 }
  ]);

  // Transfer
  const [transferSourceId, setTransferSourceId] = useState('');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetData, sectionData, teacherData, yearData] = await Promise.all([
        financeService.getBudgets().catch(() => []),
        erpService.getSections(locale).catch(() => []),
        erpService.getTeachers({ pageSize: 100 }, locale).then(r => r.data).catch(() => []),
        erpService.getAcademicYears(locale).catch(() => [])
      ]);

      setBudgets(budgetData || []);
      setSections(sectionData || []);
      setTeachers(teacherData || []);
      setAcademicYears(yearData || []);

      if (yearData && yearData.length > 0) {
        const curr = yearData.find((y: AcademicYear) => y.isCurrent || y.recordStatus === 'active' || y.status === 'current') || yearData[0];
        if (curr?.name) setFormAcademicYearCode(curr.name);
      }
    } catch {
      toast.error('Failed to load departmental budgets.');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSectionSelect = (secId: string) => {
    setFormSectionId(secId);
    if (!secId || secId === 'custom') return;
    const matched = sections.find(s => String(s.id) === secId || s.documentId === secId);
    if (matched) {
      setFormDepartmentName(matched.name);
      setFormCostCenterCode(`CC-${matched.code || String(matched.id)}`);
      if (matched.academicHead?.name) {
        setFormHeadOfDepartment(matched.academicHead.name);
      } else if (matched.homeroomTeacher?.name) {
        setFormHeadOfDepartment(matched.homeroomTeacher.name);
      } else if (teachers.length > 0) {
        setFormHeadOfDepartment(teachers[0].name);
      }
    }
  };

  const handleOpenCreateModal = () => {
    setEditingBudget(null);
    setFormSectionId('');
    setFormDepartmentName('');
    setFormCostCenterCode(`CC-${Date.now().toString().slice(-4)}`);
    setFormHeadOfDepartment(teachers[0]?.name || '');
    setFormAllocatedAmount('');
    setFormCategories([
      { name: 'Instructional Supplies & Curriculum', amount: 0 },
      { name: 'Laboratory & Digital Equipment', amount: 0 },
      { name: 'Field Activities & Academic Competitions', amount: 0 },
      { name: 'Faculty Continuous Professional Dev.', amount: 0 }
    ]);
    if (sections.length > 0) handleSectionSelect(String(sections[0].id));
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (budget: DepartmentBudget) => {
    setEditingBudget(budget);
    setFormDepartmentName(budget.departmentName || budget.budgetTitle || '');
    setFormCostCenterCode(budget.code || `CC-${budget.id}`);
    setFormHeadOfDepartment(typeof budget.headOfDepartment === 'string' ? budget.headOfDepartment : (budget.headOfDepartment?.name || ''));
    setFormAcademicYearCode(budget.academicYearCode || '2026-2027');
    setFormAllocatedAmount(String(budget.allocatedAmount || 0));
    setShowEditModal(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const allocNum = parseFloat(formAllocatedAmount || '0');
    if (!formDepartmentName.trim()) { toast.error('Please specify the department / academic section name'); return; }
    if (isNaN(allocNum) || allocNum <= 0) { toast.error('Allocation ceiling amount must be greater than zero'); return; }

    try {
      if (editingBudget) {
        const updated: DepartmentBudget = {
          ...editingBudget,
          departmentName: formDepartmentName,
          budgetTitle: formDepartmentName,
          code: formCostCenterCode,
          headOfDepartment: formHeadOfDepartment,
          academicYearCode: formAcademicYearCode,
          allocatedAmount: allocNum,
          remainingAmount: allocNum - Number(editingBudget.spentAmount || 0),
          utilizationPercentage: allocNum > 0 ? Number(((Number(editingBudget.spentAmount || 0) / allocNum) * 100).toFixed(1)) : 0,
          status: (Number(editingBudget.spentAmount || 0) / allocNum) > 0.9 ? 'exceeded' : (Number(editingBudget.spentAmount || 0) / allocNum) > 0.75 ? 'warning' : 'on_track'
        };
        await financeService.updateDepartmentalBudget(editingBudget.id, updated);
        setBudgets(budgets.map(b => b.id === editingBudget.id ? updated : b));
        if (inspectedBudget?.id === editingBudget.id) setInspectedBudget(updated);
        toast.success(`Updated budget allocation for ${formDepartmentName}`);
        setShowEditModal(false);
      } else {
        const newBudget: Partial<DepartmentBudget> = {
          code: formCostCenterCode || `CC-${Date.now().toString().slice(-4)}`,
          departmentName: formDepartmentName,
          budgetTitle: formDepartmentName,
          headOfDepartment: formHeadOfDepartment || (teachers[0]?.name ?? 'Section Lead'),
          academicYearCode: formAcademicYearCode,
          allocatedAmount: allocNum,
          committedAmount: 0,
          spentAmount: 0,
          remainingAmount: allocNum,
          varianceAmount: 0,
          utilizationPercentage: 0,
          currency: 'USD',
          status: 'on_track',
          categories: formCategories.filter(c => c.amount > 0)
        };
        const created = await financeService.createDepartmentalBudget(newBudget);
        setBudgets([created, ...budgets]);
        toast.success(`Allocated new budget ceiling for ${formDepartmentName} ($${allocNum.toLocaleString()})`);
        setShowCreateModal(false);
      }
    } catch {
      toast.error('Failed to save budget allocation');
    }
  };

  const handleDeleteBudget = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove budget ceiling for "${name}"?`)) return;
    try {
      await financeService.deleteDepartmentalBudget(id);
      setBudgets(budgets.filter(b => b.id !== id));
      toast.success(`Removed budget ${name}`);
      if (inspectedBudget?.id === id) setInspectedBudget(null);
    } catch {
      toast.error('Failed to delete budget');
    }
  };

  const handleTransferFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount || '0');
    if (!transferSourceId || !transferTargetId) { toast.error('Please select both source and destination cost centers'); return; }
    if (transferSourceId === transferTargetId) { toast.error('Source and destination cost centers cannot be identical'); return; }
    if (isNaN(amountNum) || amountNum <= 0) { toast.error('Please enter a valid transfer amount'); return; }
    const src = budgets.find(b => b.id === transferSourceId);
    const tgt = budgets.find(b => b.id === transferTargetId);
    if (!src || !tgt) return;
    if (Number(src.remainingAmount || 0) < amountNum) {
      toast.error(`Insufficient reserve in source cost center: ${src.departmentName} ($${Number(src.remainingAmount).toFixed(2)})`);
      return;
    }
    try {
      await financeService.reallocateBudget(transferSourceId, transferTargetId, amountNum, transferNotes);
      const nextBudgets = budgets.map(b => {
        if (b.id === transferSourceId) return { ...b, allocatedAmount: Number(b.allocatedAmount) - amountNum, remainingAmount: Number(b.remainingAmount) - amountNum };
        if (b.id === transferTargetId) return { ...b, allocatedAmount: Number(b.allocatedAmount) + amountNum, remainingAmount: Number(b.remainingAmount) + amountNum };
        return b;
      });
      setBudgets(nextBudgets);
      if (inspectedBudget) {
        const upd = nextBudgets.find(b => b.id === inspectedBudget.id);
        if (upd) setInspectedBudget(upd);
      }
      toast.success(`Successfully reallocated $${amountNum.toLocaleString()} from ${src.departmentName} to ${tgt.departmentName}`);
      setShowTransferModal(false);
      setTransferAmount('');
      setTransferNotes('');
    } catch {
      toast.error('Fund reallocation failed');
    }
  };

  const handleExportCSV = () => {
    const dataToExport = filteredBudgets.map(b => ({
      Code: b.code || b.id,
      Department: b.departmentName || b.budgetTitle,
      HOD: typeof b.headOfDepartment === 'string' ? b.headOfDepartment : b.headOfDepartment?.name,
      AcademicYear: b.academicYearCode,
      AllocatedUSD: Number(b.allocatedAmount || 0).toFixed(2),
      SpentUSD: Number(b.spentAmount || 0).toFixed(2),
      RemainingUSD: Number(b.remainingAmount || 0).toFixed(2),
      UtilizationRate: `${Number(b.utilizationPercentage || 0).toFixed(1)}%`,
      Status: b.status || 'on_track'
    }));
    financeService.exportToCSV(dataToExport, `departmental-budgets-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Budget spreadsheet downloaded');
  };

  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => {
      const dName = (b.departmentName || b.budgetTitle || '').toLowerCase();
      const hName = (typeof b.headOfDepartment === 'string' ? b.headOfDepartment : (b.headOfDepartment?.name || '')).toLowerCase();
      const code = (b.code || '').toLowerCase();
      const matchQ = !query || dName.includes(query.toLowerCase()) || hName.includes(query.toLowerCase()) || code.includes(query.toLowerCase());
      const matchSection = selectedSectionFilter === 'all' || dName.includes(selectedSectionFilter.toLowerCase());
      const matchYear = selectedYearFilter === 'all' || b.academicYearCode === selectedYearFilter;
      const matchStatus = selectedStatusFilter === 'all' || b.status === selectedStatusFilter;
      return matchQ && matchSection && matchYear && matchStatus;
    });
  }, [budgets, query, selectedSectionFilter, selectedYearFilter, selectedStatusFilter]);

  const activeFiltersCount = [selectedSectionFilter !== 'all', selectedYearFilter !== 'all', selectedStatusFilter !== 'all', query.length > 0].filter(Boolean).length;

  const totalAllocated = useMemo(() => budgets.reduce((s, b) => s + (Number(b.allocatedAmount) || 0), 0), [budgets]);
  const totalSpent    = useMemo(() => budgets.reduce((s, b) => s + (Number(b.spentAmount) || 0), 0), [budgets]);
  const totalRemaining = useMemo(() => budgets.reduce((s, b) => s + (Number(b.remainingAmount) || 0), 0), [budgets]);
  const avgUtilization = useMemo(() => totalAllocated === 0 ? 0 : (totalSpent / totalAllocated) * 100, [totalAllocated, totalSpent]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_allocated',
      title: 'Total Institutional Budget Ceiling',
      value: `$${totalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${budgets.length} campus cost center departments (${sections.length} sections in DB)`,
      trendDirection: 'up',
      icon: <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'total_spent',
      title: 'Total YTD Departmental Spend',
      value: `$${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${avgUtilization.toFixed(1)}% total institutional budget utilization`,
      trendDirection: 'neutral',
      icon: <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'remaining_capacity',
      title: 'Available Budget Reserves',
      value: `$${totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Uncommitted operating capital ceiling',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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

  const columns = useMemo<ColumnDef<DepartmentBudget, any>[]>(() => [
    {
      accessorKey: 'departmentName',
      header: 'Academic Section / Cost Center & HOD',
      cell: ({ row }) => {
        const b = row.original;
        const hodName = typeof b.headOfDepartment === 'string' ? b.headOfDepartment : (b.headOfDepartment?.name || 'Section Lead');
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">{b.departmentName || b.budgetTitle}</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1 font-bold">
                <UserCheck className="w-3 h-3" /> {hodName}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">• {b.code || `CC-${b.id}`}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'utilizationPercentage',
      header: 'Budget Utilization vs Actual Spend',
      cell: ({ row }) => {
        const b = row.original;
        const u = Number(b.utilizationPercentage || 0);
        return (
          <div className="space-y-1.5 w-full max-w-xs">
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-slate-600 dark:text-slate-300 font-bold">${Number(b.spentAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} spent</span>
              <span className={`font-black ${u > 90 ? 'text-rose-600 dark:text-rose-400' : u > 75 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {u.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-300 dark:border-slate-700">
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
        <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white block">
          ${Number(row.original.allocatedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'remainingAmount',
      header: 'Remaining Reserve ($)',
      cell: ({ row }) => {
        const rem = Number(row.original.remainingAmount || 0);
        return (
          <span className={`font-mono text-xs sm:text-sm font-black block ${rem <= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            ${rem.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status || 'on_track'} size="sm" />
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setInspectedBudget(b)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Inspect budget document"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
            <button
              onClick={() => handleOpenEditModal(b)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Edit budget ceiling"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteBudget(b.id, b.departmentName || b.budgetTitle)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Delete budget"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    }
  ], [budgets, inspectedBudget]);

  // ── Input classes ──────────────────────────────────────────────────────────
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300';
  const modalCls = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200';
  const modalPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto';

  return (
    <EnterpriseModuleShell
      title="Departmental Budget vs Actual Spend & Variance Reporting"
      description="Monitor annual budget allocations across all academic sections & departments, track real-time expenditure utilization, and prevent unauthorized overspending."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Payroll & Budget' }, { label: 'Departmental Budgets' }]}
      icon={<Building2 className="w-8 h-8 text-sky-600 dark:text-sky-400" />}
      recordCount={filteredBudgets.length}
      recordLabel="Cost Centers"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setQuery(''); setSelectedSectionFilter('all'); setSelectedYearFilter('all'); setSelectedStatusFilter('all'); }}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Transfer Funds</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Allocate Section Budget</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/finance/payroll" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Staff Payroll Runs</span>
        </Link>
        <Link href="/finance/expenses" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <span>Operating Expenses</span>
        </Link>
        <Link href="/finance/budget" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          <span>Departmental Budget vs Actual</span>
        </Link>
        <Link href="/finance/budget/departments" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <PieChart className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Line Item Allocations</span>
        </Link>
        <Link href="/finance/budget/approvals" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Budget Approvals</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search budgets by department, cost center, or Head of Department..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Departmental budget figures refreshed'); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setQuery(''); setSelectedSectionFilter('all'); setSelectedYearFilter('all'); setSelectedStatusFilter('all'); }}
        createButtonLabel="+ Allocate Budget"
        onCreate={handleOpenCreateModal}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              aria-label="Filter by Academic Section"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[200px]"
            >
              <option value="all">All Sections (DB)</option>
              {sections.map(s => (
                <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
              ))}
            </select>
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              aria-label="Filter by Academic Year"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Fiscal Years</option>
              {academicYears.map(y => (
                <option key={y.id} value={y.name}>{y.name} {y.isCurrent ? '(Current)' : ''}</option>
              ))}
            </select>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              aria-label="Filter by Budget Status"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Health Statuses</option>
              <option value="on_track">On Track (&lt; 75%)</option>
              <option value="warning">Warning (75% - 90%)</option>
              <option value="exceeded">Exceeded (&gt; 90%)</option>
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredBudgets}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        onRowInspect={(row) => setInspectedBudget(row)}
        onRowClick={(row) => setInspectedBudget(row)}
        emptyStateProps={{
          title: 'No Departmental Budgets Found',
          description: 'No cost centers have been assigned budget ceilings for this academic year.',
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: () => { setQuery(''); setSelectedSectionFilter('all'); setSelectedYearFilter('all'); setSelectedStatusFilter('all'); },
          createLabel: 'Allocate Cost Center Budget',
          onCreate: handleOpenCreateModal
        }}
      />

      {/* Budget Inspector Modal */}
      {inspectedBudget && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 sm:p-8 max-w-3xl w-full space-y-6`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                      {inspectedBudget.code || `CC-${inspectedBudget.id}`}
                    </span>
                    <StatusBadge status={inspectedBudget.status || 'on_track'} size="sm" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {inspectedBudget.departmentName || inspectedBudget.budgetTitle}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => handleOpenEditModal(inspectedBudget)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Ceiling</span>
                </button>
                <button
                  onClick={() => setInspectedBudget(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Financial Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Annual Ceiling', value: `$${Number(inspectedBudget.allocatedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'text-slate-900 dark:text-white' },
                { label: 'Disbursed Spend', value: `$${Number(inspectedBudget.spentAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'text-amber-700 dark:text-amber-400' },
                { label: 'Available Reserve', value: `$${Number(inspectedBudget.remainingAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: Number(inspectedBudget.remainingAmount || 0) <= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400' },
                { label: 'Utilization', value: `${Number(inspectedBudget.utilizationPercentage || 0).toFixed(1)}%`, color: Number(inspectedBudget.utilizationPercentage || 0) > 90 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">{label}</span>
                  <span className={`text-base sm:text-lg font-black font-mono mt-1 block ${color}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Utilization Bar */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Budget Utilization & Consumption Rate
                </span>
                <span className="text-slate-500 font-mono">
                  ${Number(inspectedBudget.spentAmount || 0).toFixed(2)} / ${Number(inspectedBudget.allocatedAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-300 dark:border-slate-700">
                <div
                  className={`h-full transition-all rounded-full ${
                    Number(inspectedBudget.utilizationPercentage || 0) > 90 ? 'bg-gradient-to-r from-rose-600 to-rose-400' :
                    Number(inspectedBudget.utilizationPercentage || 0) > 75 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                    'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  }`}
                  style={{ width: `${Math.min(Number(inspectedBudget.utilizationPercentage || 0), 100)}%` }}
                />
              </div>
            </div>

            {/* Governance Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Responsible Section Head / HOD
                </h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300">
                    {typeof inspectedBudget.headOfDepartment === 'string' ? inspectedBudget.headOfDepartment[0] : 'H'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">
                      {typeof inspectedBudget.headOfDepartment === 'string' ? inspectedBudget.headOfDepartment : (inspectedBudget.headOfDepartment?.name || 'Section Lead')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Authorized Faculty Lead • {inspectedBudget.academicYearCode || '2026-2027'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Fiscal Governance Standard
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Cost center governed under double-entry compliance rules. Overspending requires prior financial reallocation approved by the Director.
                </p>
              </div>
            </div>

            {/* Categories */}
            {inspectedBudget.categories && inspectedBudget.categories.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Itemized Category Allocations</h4>
                <div className="space-y-2">
                  {inspectedBudget.categories.map((cat: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{cat.name}</span>
                      <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">${Number(cat.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Certified Cost Center Ledger Record • {inspectedBudget.academicYearCode}</span>
              </div>
              <span className="font-mono text-[11px]">ID: {inspectedBudget.id}</span>
            </div>
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 max-w-2xl w-full space-y-5`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Allocate Section / Department Budget Ceiling</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls + ' flex items-center gap-1.5'}>
                    <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Academic Section (from Database)
                  </label>
                  <select value={formSectionId} onChange={(e) => handleSectionSelect(e.target.value)} className={selectCls}>
                    <option value="">-- Select Academic Section --</option>
                    {sections.map(s => (<option key={s.id} value={String(s.id)}>{s.name} ({s.code})</option>))}
                    <option value="custom">-- Custom Department / Faculty --</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls + ' flex items-center gap-1.5'}>
                    <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    Section Head / HOD (from Faculty DB)
                  </label>
                  <select value={formHeadOfDepartment} onChange={(e) => setFormHeadOfDepartment(e.target.value)} required className={selectCls}>
                    {teachers.map(teach => (<option key={teach.id} value={teach.name}>{teach.name} ({teach.schoolId || 'Faculty'})</option>))}
                    {teachers.length === 0 && <option value="Section Head">Section Head</option>}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Department / Cost Center Name</label>
                  <input type="text" required placeholder="e.g. Primary Quran & Hifz Division" value={formDepartmentName} onChange={(e) => setFormDepartmentName(e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Cost Center GL Code</label>
                  <input type="text" required placeholder="e.g. CC-HIFZ-01" value={formCostCenterCode} onChange={(e) => setFormCostCenterCode(e.target.value)} className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400'} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Academic Fiscal Year</label>
                  <select value={formAcademicYearCode} onChange={(e) => setFormAcademicYearCode(e.target.value)} className={selectCls}>
                    {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                    {academicYears.length === 0 && <option value="2026-2027">2026-2027</option>}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Total Annual Allocation Ceiling ($ USD)</label>
                  <input type="number" step="0.01" required placeholder="25000" value={formAllocatedAmount} onChange={(e) => setFormAllocatedAmount(e.target.value)} className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 text-sm font-black'} />
                </div>
              </div>
              {/* Category Breakdown */}
              <div className="space-y-2">
                <label className={labelCls}>Budget Line Item Categories</label>
                {formCategories.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => setFormCategories(prev => prev.map((c, i) => i === idx ? { ...c, name: e.target.value } : c))}
                      className={inputCls + ' flex-1'}
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cat.amount || ''}
                      onChange={(e) => setFormCategories(prev => prev.map((c, i) => i === idx ? { ...c, amount: parseFloat(e.target.value) || 0 } : c))}
                      placeholder="0.00"
                      className={inputCls + ' w-32 font-mono'}
                    />
                    <button type="button" onClick={() => setFormCategories(prev => prev.filter((_, i) => i !== idx))} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setFormCategories(prev => [...prev, { name: '', amount: 0 }])} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Category Line
                </button>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer">Authorize Budget Ceiling</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {showEditModal && editingBudget && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 max-w-md w-full space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Adjust Budget Ceiling: {editingBudget.departmentName}</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveBudget} className="space-y-3">
              <div className="space-y-1">
                <label className={labelCls}>Department Name</label>
                <input type="text" required value={formDepartmentName} onChange={(e) => setFormDepartmentName(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Head of Department / Section Lead</label>
                <select value={formHeadOfDepartment} onChange={(e) => setFormHeadOfDepartment(e.target.value)} className={selectCls}>
                  {teachers.map(teach => (<option key={teach.id} value={teach.name}>{teach.name}</option>))}
                  {teachers.length === 0 && <option value={formHeadOfDepartment}>{formHeadOfDepartment}</option>}
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Annual Allocation Ceiling ($)</label>
                <input type="number" step="0.01" required value={formAllocatedAmount} onChange={(e) => setFormAllocatedAmount(e.target.value)} className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 text-sm font-black'} />
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Currently Spent YTD:</span>
                  <span className="text-slate-900 dark:text-white font-bold">${Number(editingBudget.spentAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>New Remaining Reserve:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">${(parseFloat(formAllocatedAmount || '0') - Number(editingBudget.spentAmount || 0)).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md cursor-pointer">Update Ceiling</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {showTransferModal && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 max-w-md w-full space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Reallocate Inter-Departmental Budget Reserves</h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-xs cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleTransferFunds} className="space-y-3">
              <div className="space-y-1">
                <label className={labelCls}>Source Cost Center (Debit Reserve)</label>
                <select
                  value={transferSourceId}
                  onChange={(e) => setTransferSourceId(e.target.value)}
                  required
                  className={selectCls}
                >
                  <option value="">-- Select Source Department --</option>
                  {budgets.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.departmentName} (${Number(b.remainingAmount || 0).toFixed(0)} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Destination Cost Center (Credit Reserve)</label>
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  required
                  className={selectCls}
                >
                  <option value="">-- Select Destination Department --</option>
                  {budgets.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Transfer Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 text-sm font-black'}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Reallocation Justification / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Reallocation for urgent STEM robotics kit purchase"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md cursor-pointer">Execute Reallocation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

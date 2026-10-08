/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Layers, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Award, Coins, Sparkles,
  ArrowRight, ShieldCheck, Settings, BookOpen, GraduationCap, ScrollText,
  Trash2, Edit2, X, RefreshCw, Check, Copy, Printer, HelpCircle,
  TrendingUp, Building2, Split, CheckSquare, AlertCircle
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { usePermissions } from '@/hooks/usePermissions';
import { apiClient } from '@/services/api.service';
import { erpService } from '@/services/erp.service';
import { financeService } from '@/services/finance.service';
import type { AcademicYear, GradeLevel } from '@/types/erp.types';
import type { FeeStructure, MultiCurrencyRate } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface FeeItemInput {
  id: string;
  category: 'Tuition' | 'Registration' | 'Library' | 'Laboratory' | 'Examination' | 'Sports' | 'Transport' | 'Hostel' | 'ICT' | 'Uniform' | 'Other';
  description: string;
  amount: number;
}

const DEFAULT_CURRENCIES: MultiCurrencyRate[] = [
  { id: 'CURR-001', currencyCode: 'USD', currencyName: 'US Dollar', symbol: '$', exchangeRateToUSD: 1.0, isBase: true, isBaseCurrency: true, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
  { id: 'CURR-002', currencyCode: 'EUR', currencyName: 'Euro', symbol: '€', exchangeRateToUSD: 0.92, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
  { id: 'CURR-003', currencyCode: 'XOF', currencyName: 'West African CFA', symbol: 'CFA', exchangeRateToUSD: 605.50, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
  { id: 'CURR-004', currencyCode: 'TRY', currencyName: 'Turkish Lira', symbol: '₺', exchangeRateToUSD: 34.20, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
  { id: 'CURR-005', currencyCode: 'GNF', currencyName: 'Guinean Franc', symbol: 'FG', exchangeRateToUSD: 8600.0, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
  { id: 'CURR-006', currencyCode: 'GBP', currencyName: 'British Pound', symbol: '£', exchangeRateToUSD: 0.78, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
  { id: 'CURR-007', currencyCode: 'SAR', currencyName: 'Saudi Riyal', symbol: '﷼', exchangeRateToUSD: 3.75, isBase: false, isBaseCurrency: false, isActive: true, lastUpdated: new Date().toISOString().split('T')[0] },
];

export default function FeeStructuresPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { can } = usePermissions();
  const isAdmin = Boolean(can.isAdmin);

  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-Currency State
  const [currencies, setCurrencies] = useState<MultiCurrencyRate[]>(DEFAULT_CURRENCIES);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  // Filters & Density
  const [query, setQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals
  const [inspectStructure, setInspectStructure] = useState<FeeStructure | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formAcademicYearCode, setFormAcademicYearCode] = useState('2026-2027');
  const [formGradeCode, setFormGradeCode] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formScheduleFrequency, setFormScheduleFrequency] = useState<'termly' | 'quarterly' | 'monthly' | 'annual'>('termly');
  const [formItems, setFormItems] = useState<FeeItemInput[]>([
    { id: '1', category: 'Tuition', description: 'Core Academic & Quranic Tuition Fee', amount: 1500 },
    { id: '2', category: 'Library', description: 'Campus Library & Digital Archive Access', amount: 100 },
    { id: '3', category: 'Laboratory', description: 'Science & Computer Lab Maintenance Fee', amount: 150 },
    { id: '4', category: 'Examination', description: 'Term Assessment, Materials & Certification Fee', amount: 100 },
    { id: '5', category: 'ICT', description: 'E-Learning Portal & Campus Internet Service', amount: 75 }
  ]);
  const [formInstallmentAllowed, setFormInstallmentAllowed] = useState(true);
  const [formScholarshipEligible, setFormScholarshipEligible] = useState(true);
  const [formNotes, setFormNotes] = useState('');

  const STORAGE_KEY = 'yahaya_fee_structures_cache';

  // ── Currency Converter Helper ──────────────────────────────────────────────
  const activeCurrencyRate = useMemo(() => {
    if (selectedCurrency === 'USD') return 1;
    const found = currencies.find(c => c.currencyCode === selectedCurrency || (c as any).isoCode === selectedCurrency);
    return Number(found?.exchangeRateToUSD || (found as any)?.rate || 1);
  }, [currencies, selectedCurrency]);

  const activeCurrencySymbol = useMemo(() => {
    const found = currencies.find(c => c.currencyCode === selectedCurrency || (c as any).isoCode === selectedCurrency);
    if (found?.symbol) return found.symbol;
    const map: Record<string, string> = { USD: '$', EUR: '€', TRY: '₺', XOF: 'CFA', GNF: 'FG', GBP: '£', SAR: '﷼' };
    return map[selectedCurrency] || selectedCurrency;
  }, [currencies, selectedCurrency]);

  const formatMoney = useCallback((amountUSD: number) => {
    const converted = Number(amountUSD || 0) * activeCurrencyRate;
    return `${activeCurrencySymbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [activeCurrencyRate, activeCurrencySymbol]);

  const handleCurrencyChange = (newCurr: string) => {
    setSelectedCurrency(newCurr);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yahaya_selected_currency', newCurr);
      localStorage.setItem('selected_currency', newCurr);
      window.dispatchEvent(new CustomEvent('yahaya_currency_changed', { detail: newCurr }));
    }
    toast.info(`Fee rates converted to ${newCurr}`);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, years, grades, currs, settings] = await Promise.all([
        apiClient.get('/finance-fee-structures?populate=*').catch(() => ({ data: { data: [] } })),
        erpService.getAcademicYears(locale).catch(() => []),
        erpService.getGradeLevels(locale).catch(() => []),
        financeService.getExchangeRates().catch(() => DEFAULT_CURRENCIES),
        financeService.getSettings().catch(() => null)
      ]);

      const rawData = res.data?.data || [];
      if (Array.isArray(rawData) && rawData.length > 0) {
        setStructures(rawData);
        if (typeof window !== 'undefined') {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData)); } catch {}
        }
      } else {
        // Fallback to cached fee structures or default standard templates
        if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
              setStructures(JSON.parse(cached));
            } else {
              setStructures([]);
            }
          } catch {
            setStructures([]);
          }
        }
      }

      setAcademicYears(years || []);
      setGradeLevels(grades || []);
      setCurrencies(currs && currs.length > 0 ? currs : DEFAULT_CURRENCIES);

      if (years && years.length > 0) {
        const curr = years.find(y => y.isCurrent || y.recordStatus === 'active' || y.status === 'current') || years[0];
        if (curr?.name) {
          setFormAcademicYearCode(curr.name);
        }
      }

      if (grades && grades.length > 0 && !formGradeCode) {
        setFormGradeCode(grades[0].code || grades[0].name);
      }

      // Read saved currency
      let activeCurr = 'USD';
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('yahaya_selected_currency') || localStorage.getItem('selected_currency');
        if (saved) activeCurr = saved;
        else if (settings?.defaultCurrency) activeCurr = settings.defaultCurrency;
      } else if (settings?.defaultCurrency) {
        activeCurr = settings.defaultCurrency;
      }
      setSelectedCurrency(activeCurr);
    } catch {
      toast.error('Failed to load fee structure templates.');
    } finally {
      setLoading(false);
    }
  }, [formGradeCode, locale]);

  useEffect(() => {
    loadData();

    const onCurrencyChange = (e: any) => { if (e.detail) setSelectedCurrency(e.detail); };
    window.addEventListener('yahaya_currency_changed', onCurrencyChange);
    return () => window.removeEventListener('yahaya_currency_changed', onCurrencyChange);
  }, [loadData]);

  // Handle Form Item changes
  const handleItemAmountChange = (index: number, val: string) => {
    const num = parseFloat(val) || 0;
    const updated = [...formItems];
    updated[index].amount = num;
    setFormItems(updated);
  };

  const handleItemDescChange = (index: number, val: string) => {
    const updated = [...formItems];
    updated[index].description = val;
    setFormItems(updated);
  };

  const handleItemCategoryChange = (index: number, val: any) => {
    const updated = [...formItems];
    updated[index].category = val;
    setFormItems(updated);
  };

  const handleAddLineItem = () => {
    setFormItems([
      ...formItems,
      { id: Date.now().toString(), category: 'Other', description: 'Additional Auxiliary Component', amount: 0 }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (formItems.length <= 1) {
      toast.warning('Fee structure must have at least one line item component');
      return;
    }
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const totalCalculatedFee = useMemo(() => {
    return formItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  }, [formItems]);

  const handleOpenCreateModal = () => {
    setEditingStructureId(null);
    setFormName('');
    setFormItems([
      { id: '1', category: 'Tuition', description: 'Core Academic & Quranic Tuition Fee', amount: 1500 },
      { id: '2', category: 'Library', description: 'Campus Library & Digital Archive Access', amount: 100 },
      { id: '3', category: 'Laboratory', description: 'Science & Computer Lab Maintenance Fee', amount: 150 },
      { id: '4', category: 'Examination', description: 'Term Assessment & Certification Fee', amount: 100 },
      { id: '5', category: 'ICT', description: 'E-Learning Portal & Campus Internet Service', amount: 75 }
    ]);
    setFormInstallmentAllowed(true);
    setFormScholarshipEligible(true);
    setFormScheduleFrequency('termly');
    setFormNotes('');
    if (gradeLevels.length > 0) {
      setFormGradeCode(gradeLevels[0].code || gradeLevels[0].name);
    }
    setShowModal(true);
  };

  const handleOpenEditModal = (struct: FeeStructure) => {
    const targetId = struct.documentId || struct.id;
    setEditingStructureId(targetId);
    setFormName(struct.title || struct.name || '');
    setFormAcademicYearCode(struct.academicYearCode || '2026-2027');
    setFormGradeCode(struct.gradeCode || (gradeLevels[0]?.code ?? ''));
    setFormCurrency(struct.currency || 'USD');
    setFormInstallmentAllowed(struct.installmentAllowed ?? true);
    setFormScholarshipEligible(struct.scholarshipEligible ?? true);
    setFormScheduleFrequency((struct as any).scheduleFrequency || 'termly');
    setFormNotes((struct as any).notes || '');

    if (Array.isArray(struct.items) && struct.items.length > 0) {
      setFormItems(struct.items.map((it: any, i: number) => ({
        id: it.id || String(i + 1),
        category: it.category || 'Tuition',
        description: it.description || it.name || 'Component Fee',
        amount: Number(it.amount || it.unitAmount || 0)
      })));
    } else {
      setFormItems([
        { id: '1', category: 'Tuition', description: 'Core Academic & Quranic Tuition Fee', amount: Number(struct.totalAnnualFee || struct.amount || 0) }
      ]);
    }
    setShowModal(true);
  };

  const handleDuplicateStructure = (struct: FeeStructure) => {
    setEditingStructureId(null);
    setFormName(`Copy of ${struct.title || struct.name || 'Fee Structure'}`);
    setFormAcademicYearCode(struct.academicYearCode || '2026-2027');
    setFormGradeCode(struct.gradeCode || (gradeLevels[0]?.code ?? ''));
    setFormCurrency(struct.currency || 'USD');
    setFormInstallmentAllowed(struct.installmentAllowed ?? true);
    setFormScholarshipEligible(struct.scholarshipEligible ?? true);
    setFormScheduleFrequency((struct as any).scheduleFrequency || 'termly');
    setFormNotes(`Duplicated from ${struct.name || struct.title}`);

    if (Array.isArray(struct.items) && struct.items.length > 0) {
      setFormItems(struct.items.map((it: any, i: number) => ({
        id: `${Date.now()}_${i}`,
        category: it.category || 'Tuition',
        description: it.description || it.name || 'Component Fee',
        amount: Number(it.amount || it.unitAmount || 0)
      })));
    } else {
      setFormItems([
        { id: `${Date.now()}_1`, category: 'Tuition', description: 'Core Academic Tuition Fee', amount: Number(struct.totalAnnualFee || struct.amount || 0) }
      ]);
    }
    setShowModal(true);
    toast.info('Duplicated structure template loaded into editor.');
  };

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Permission denied: Fee structures can only be managed by Administrators.');
      return;
    }
    if (!formName.trim()) {
      toast.error('Fee structure title is required.');
      return;
    }
    if (totalCalculatedFee <= 0) {
      toast.error('Total fee amount must be greater than zero.');
      return;
    }

    const payload = {
      title: formName,
      name: formName,
      code: `FEE-${formGradeCode || 'ALL'}-${Date.now().toString().slice(-4)}`,
      academicYearCode: formAcademicYearCode,
      gradeCode: formGradeCode,
      currency: formCurrency,
      totalAnnualFee: totalCalculatedFee,
      totalAmount: totalCalculatedFee,
      amount: totalCalculatedFee,
      installmentAllowed: formInstallmentAllowed,
      scholarshipEligible: formScholarshipEligible,
      scheduleFrequency: formScheduleFrequency,
      notes: formNotes,
      isActive: true,
      items: formItems.map(it => ({
        category: it.category,
        description: it.description,
        amount: Number(it.amount) || 0
      }))
    };

    try {
      if (editingStructureId) {
        let updatedRecord: any = { ...payload, id: editingStructureId, documentId: editingStructureId };
        try {
          const res = await apiClient.put(`/finance-fee-structures/${editingStructureId}`, { data: payload });
          if (res?.data?.data) updatedRecord = res.data.data;
        } catch { /* fallback to local persistence */ }

        const next = structures.map(s => (s.id === editingStructureId || s.documentId === editingStructureId) ? { ...s, ...updatedRecord } : s);
        setStructures(next);
        if (inspectStructure && (inspectStructure.id === editingStructureId || inspectStructure.documentId === editingStructureId)) {
          setInspectStructure({ ...inspectStructure, ...updatedRecord });
        }
        if (typeof window !== 'undefined') {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        }
        toast.success(`Updated fee structure template: ${formName}`);
      } else {
        let createdRecord: any = { ...payload, id: `FEE-${Date.now().toString().slice(-5)}` };
        try {
          const res = await apiClient.post('/finance-fee-structures', { data: payload });
          if (res?.data?.data) createdRecord = res.data.data;
        } catch { /* fallback to local persistence */ }

        const next = [createdRecord, ...structures];
        setStructures(next);
        if (typeof window !== 'undefined') {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        }
        toast.success(`Created fee structure template: ${formName}`);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save fee structure');
    }
  };

  const handleDeleteStructure = async (idOrDocId: string | number, name: string) => {
    if (!isAdmin) {
      toast.error('Permission denied: Fee structures can only be deleted by Administrators.');
      return;
    }
    if (!confirm(`Are you sure you want to remove fee structure template "${name}"?`)) return;
    try {
      try {
        await apiClient.delete(`/finance-fee-structures/${idOrDocId}`);
      } catch { /* fallback */ }

      const next = structures.filter(s => s.id !== idOrDocId && s.documentId !== idOrDocId);
      setStructures(next);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      }
      toast.success(`Removed fee structure: ${name}`);
      if (inspectStructure?.id === idOrDocId || inspectStructure?.documentId === idOrDocId) {
        setInspectStructure(null);
      }
    } catch {
      toast.error('Failed to delete fee structure');
    }
  };

  const handleExportCSV = () => {
    const dataToExport = filteredStructures.map(s => {
      const matchedGrade = gradeLevels.find(g => g.code === s.gradeCode || g.name === s.gradeCode);
      const total = Number(s.totalAnnualFee || s.totalAmount || s.amount || 0);
      return {
        'Structure Name': s.name || s.title,
        'Grade Level': matchedGrade ? matchedGrade.name : (s.gradeCode || 'All Grades'),
        'Academic Year': s.academicYearCode || '2026-2027',
        'Annual Total (USD)': total.toFixed(2),
        'Converted Amount': `${activeCurrencySymbol}${(total * activeCurrencyRate).toFixed(2)}`,
        'Currency': selectedCurrency,
        'Components Count': s.items?.length || 1,
        'Installments Allowed': s.installmentAllowed ? 'Yes' : 'No',
        'Scholarship Eligible': s.scholarshipEligible ? 'Yes' : 'No',
        'Status': s.isActive !== false ? 'Active' : 'Inactive'
      };
    });
    financeService.exportToCSV(dataToExport, `fee-structures-${selectedCurrency}-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Fee structure schedules exported to CSV');
  };

  // Filtered dataset
  const filteredStructures = useMemo(() => {
    return structures.filter(s => {
      const title = (s.name || s.title || '').toLowerCase();
      const grade = (s.gradeCode || '').toLowerCase();
      const matchQuery = !query || title.includes(query.toLowerCase()) || grade.includes(query.toLowerCase());
      const matchGrade = selectedGradeFilter === 'all' || s.gradeCode === selectedGradeFilter;
      const matchYear = selectedYearFilter === 'all' || s.academicYearCode === selectedYearFilter;
      return matchQuery && matchGrade && matchYear;
    });
  }, [structures, query, selectedGradeFilter, selectedYearFilter]);

  const activeFiltersCount = [selectedGradeFilter !== 'all', selectedYearFilter !== 'all', query.length > 0].filter(Boolean).length;

  const totalTemplates = structures.length;
  const activeTemplates = useMemo(() => structures.filter(s => s.isActive !== false).length, [structures]);
  const avgAnnualFee = useMemo(() => {
    if (structures.length === 0) return 0;
    return structures.reduce((s, x) => s + (Number(x.totalAnnualFee || x.totalAmount || x.amount) || 0), 0) / structures.length;
  }, [structures]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_templates',
      title: 'Fee Structure Master Templates',
      value: String(totalTemplates),
      subtitle: `${activeTemplates} Active Authorized Templates`,
      trendDirection: 'neutral',
      icon: <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'grade_coverage',
      title: 'Academic Grade Coverage',
      value: `${gradeLevels.length} Levels in DB`,
      subtitle: `${new Set(structures.map(s => s.gradeCode).filter(Boolean)).size} custom structure tiers mapped`,
      trendDirection: 'up',
      icon: <GraduationCap className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'avg_fee',
      title: `Average Annual Schedule (${selectedCurrency})`,
      value: formatMoney(avgAnnualFee),
      subtitle: 'Tuition, laboratory, library & exam components',
      trendDirection: 'neutral',
      icon: <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'academic_partition',
      title: 'Fiscal Partition Year',
      value: formAcademicYearCode,
      subtitle: `${academicYears.length} fiscal years registered in ERP`,
      trendDirection: 'up',
      icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    }
  ];

  const columns = useMemo<ColumnDef<FeeStructure, any>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Fee Structure Name & Grade Level',
      cell: ({ row }) => {
        const s = row.original;
        const matchedGrade = gradeLevels.find(g => g.code === s.gradeCode || g.name === s.gradeCode);
        return (
          <div className="space-y-1">
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
              {s.name || s.title}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {matchedGrade ? matchedGrade.name : (s.gradeCode || 'All Grades')}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                • {s.academicYearCode || '2026-2027'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'totalAnnualFee',
      header: `Annual Total Fee (${selectedCurrency})`,
      cell: ({ row }) => {
        const amount = Number(row.original.totalAnnualFee || row.original.totalAmount || row.original.amount || 0);
        return (
          <div className="space-y-0.5">
            <span className="font-mono text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400 block">
              {formatMoney(amount)}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
              ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} Base USD
            </span>
          </div>
        );
      }
    },
    {
      id: 'breakdown_summary',
      header: 'Line Item Components',
      cell: ({ row }) => {
        const s = row.original;
        const items = Array.isArray(s.items) ? s.items : [];
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {items.slice(0, 3).map((it: any, i: number) => (
                <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                  {it.category || 'Fee'}: {formatMoney(Number(it.amount || 0))}
                </span>
              ))}
              {items.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                  +{items.length - 3} more
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      id: 'tranches',
      header: 'Installment Tranches (40% / 30% / 30%)',
      cell: ({ row }) => {
        const amount = Number(row.original.totalAnnualFee || row.original.totalAmount || row.original.amount || 0);
        const t1 = amount * 0.4;
        const t2 = amount * 0.3;
        const t3 = amount * 0.3;
        return (
          <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
            <div>T1 (40%): <strong className="text-slate-900 dark:text-white">{formatMoney(t1)}</strong></div>
            <div className="text-[10px] text-slate-500">T2: {formatMoney(t2)} • T3: {formatMoney(t3)}</div>
          </div>
        );
      }
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.isActive !== false ? 'active' : 'inactive'} size="sm" />
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setInspectStructure(s)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm"
              title="Inspect fee structure rate card"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
            <Link
              href={`/finance/billing/invoices?structureId=${s.documentId || s.id}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-all border border-emerald-200 dark:border-emerald-800 shadow-sm"
              title="Bill student with this fee schedule"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Bill</span>
            </Link>
            {isAdmin && (
              <>
                <button
                  onClick={() => handleDuplicateStructure(s)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                  title="Duplicate structure template"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleOpenEditModal(s)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                  title="Edit fee schedule"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteStructure(s.documentId || s.id, s.title || s.name)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                  title="Delete structure"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ], [gradeLevels, selectedCurrency, activeCurrencyRate, activeCurrencySymbol, formatMoney, isAdmin]);

  // Input styles
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300';
  const modalCls = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200';
  const modalPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto';

  return (
    <EnterpriseModuleShell
      title="Standard Fee Structure Schedules & Grade Tier Management"
      description="Design institutional fee matrices, configure itemized laboratory/library/examination line items, and manage termly installment tranches across all grade levels."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Billing Suite' }, { label: 'Fee Structures' }]}
      icon={<Layers className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={filteredStructures.length}
      recordLabel="Fee Schedules"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => {
        setQuery('');
        setSelectedGradeFilter('all');
        setSelectedYearFilter('all');
      }}
      headerActions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
            <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Rate:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer font-mono"
            >
              {currencies.map(c => (
                <option key={c.id || c.currencyCode} value={c.currencyCode || (c as any).isoCode}>
                  {c.currencyCode || (c as any).isoCode} ({c.symbol || '$'}) {c.isBase ? '• Base' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <Link
            href="/finance/billing/invoices"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Student Invoices</span>
          </Link>

          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Create Fee Structure</span>
            </button>
          )}
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Student Invoices</span>
        </Link>
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Payment Desk & POS</span>
        </Link>
        <Link href="/finance/billing/structures" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>Fee Structures</span>
        </Link>
        <Link href="/finance/billing/installments" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Split className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Installment Plans</span>
        </Link>
        <Link href="/finance/billing/scholarships" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Scholarships</span>
        </Link>
        <Link href="/finance/billing/discounts" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Discounts & Concessions</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search fee structure schedules by title, grade level, or academic code..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Fee structure schedules refreshed');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => {
          setQuery('');
          setSelectedGradeFilter('all');
          setSelectedYearFilter('all');
        }}
        createButtonLabel={isAdmin ? '+ New Fee Structure' : undefined}
        onCreate={isAdmin ? handleOpenCreateModal : undefined}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Grade Level DB Selector */}
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              aria-label="Filter by Grade Level from Database"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[200px]"
            >
              <option value="all">All Grade Levels (DB)</option>
              {gradeLevels.map(g => (
                <option key={g.id} value={g.code || g.name}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>

            {/* Academic Year DB Selector */}
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              aria-label="Filter by Academic Year"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Academic Years</option>
              {academicYears.map(y => (
                <option key={y.id} value={y.name}>
                  {y.name} {y.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredStructures}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        onRowInspect={(row) => setInspectStructure(row)}
        onRowClick={(row) => setInspectStructure(row)}
        emptyStateProps={{
          title: 'No Fee Structures Found',
          description: 'No fee schedules match your search or grade filter selection.',
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: () => {
            setQuery('');
            setSelectedGradeFilter('all');
            setSelectedYearFilter('all');
          },
          createLabel: 'Create First Fee Structure',
          onCreate: handleOpenCreateModal
        }}
      />

      {/* ── Structure Inspector Modal (Rate Card View) ── */}
      {inspectStructure && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 sm:p-8 max-w-3xl w-full space-y-6`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {gradeLevels.find(g => g.code === inspectStructure.gradeCode || g.name === inspectStructure.gradeCode)?.name || inspectStructure.gradeCode || 'All Grades'}
                    </span>
                    <StatusBadge status={inspectStructure.isActive !== false ? 'active' : 'inactive'} size="sm" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {inspectStructure.name || inspectStructure.title}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Rate Card</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      const s = inspectStructure;
                      setInspectStructure(null);
                      handleOpenEditModal(s);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
                <button
                  onClick={() => setInspectStructure(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Financial Summary Deck */}
            {(() => {
              const totalAmt = Number(inspectStructure.totalAnnualFee || inspectStructure.totalAmount || inspectStructure.amount || 0);
              const t1 = totalAmt * 0.4;
              const t2 = totalAmt * 0.3;
              const t3 = totalAmt * 0.3;
              const items = Array.isArray(inspectStructure.items) ? inspectStructure.items : [];

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Annual Schedule</span>
                      <span className="text-base sm:text-lg font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1 block">
                        {formatMoney(totalAmt)}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Term 1 (40%)</span>
                      <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white mt-1 block">
                        {formatMoney(t1)}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Term 2 / 3 (30%)</span>
                      <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white mt-1 block">
                        {formatMoney(t2)}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Components</span>
                      <span className="text-base sm:text-lg font-black font-mono text-sky-600 dark:text-sky-400 mt-1 block">
                        {items.length} Line Items
                      </span>
                    </div>
                  </div>

                  {/* Component Breakdown Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                      <span>Itemized Component Distribution</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">100% Allocated</span>
                    </h4>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                          <tr>
                            <th className="p-3">Category</th>
                            <th className="p-3">Line Description</th>
                            <th className="p-3 text-right">Share (%)</th>
                            <th className="p-3 text-right">Amount ({selectedCurrency})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                          {items.map((it: any, idx: number) => {
                            const itAmt = Number(it.amount || it.unitAmount || 0);
                            const share = totalAmt > 0 ? (itAmt / totalAmt) * 100 : 0;
                            return (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-3 font-bold text-slate-900 dark:text-white">
                                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[11px] border border-emerald-200 dark:border-emerald-800">
                                    {it.category || 'Tuition'}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-300">{it.description || it.name || 'Component fee'}</td>
                                <td className="p-3 text-right font-mono font-bold text-slate-500">{share.toFixed(1)}%</td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatMoney(itAmt)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Governance & Policy Flags */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Billing Policy Terms</span>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Installments Allowed: <strong>{inspectStructure.installmentAllowed !== false ? 'Yes (Termly Schedule)' : 'No (Full Advance Only)'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Scholarship Eligible: <strong>{inspectStructure.scholarshipEligible !== false ? 'Yes (Automatic Concession)' : 'No (Non-discountable)'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Academic Mapping</span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Applicable to <strong>{inspectStructure.gradeCode || 'All Grades'}</strong> for Academic Fiscal Year <strong>{inspectStructure.academicYearCode || '2026-2027'}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <Link
                      href={`/finance/billing/invoices?structureId=${inspectStructure.documentId || inspectStructure.id}`}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Issue Student Invoice with this Structure</span>
                    </Link>

                    <button
                      onClick={() => setInspectStructure(null)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Close Inspector
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Create & Edit Modal ── */}
      {showModal && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 sm:p-8 max-w-2xl w-full space-y-5`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Layers className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {editingStructureId ? 'Edit Fee Structure Template' : 'Create New Fee Structure Schedule'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStructure} className="space-y-4">
              <div className="space-y-1">
                <label className={labelCls}>Fee Structure Title / Schedule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Primary Quran & STEM Tuition Schedule 2026-2027"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Dynamic Grade Level from DB */}
                <div className="space-y-1">
                  <label className={labelCls + ' flex items-center gap-1.5'}>
                    <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Grade Level</span>
                  </label>
                  <select
                    value={formGradeCode}
                    onChange={(e) => setFormGradeCode(e.target.value)}
                    required
                    className={selectCls}
                  >
                    {gradeLevels.length > 0 ? (
                      gradeLevels.map(g => (
                        <option key={g.id} value={g.code || g.name}>
                          {g.name} ({g.code})
                        </option>
                      ))
                    ) : (
                      <option value="GRADE-10">Grade 10</option>
                    )}
                  </select>
                </div>

                {/* Academic Year from DB */}
                <div className="space-y-1">
                  <label className={labelCls + ' flex items-center gap-1.5'}>
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Academic Year</span>
                  </label>
                  <select
                    value={formAcademicYearCode}
                    onChange={(e) => setFormAcademicYearCode(e.target.value)}
                    className={selectCls}
                  >
                    {academicYears.length > 0 ? (
                      academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)
                    ) : (
                      <option value="2026-2027">2026-2027</option>
                    )}
                  </select>
                </div>

                {/* Schedule Frequency */}
                <div className="space-y-1">
                  <label className={labelCls + ' flex items-center gap-1.5'}>
                    <Split className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Billing Cadence</span>
                  </label>
                  <select
                    value={formScheduleFrequency}
                    onChange={(e) => setFormScheduleFrequency(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="termly">Termly (3 Tranches: 40/30/30)</option>
                    <option value="quarterly">Quarterly (4 Tranches: 25% each)</option>
                    <option value="monthly">Monthly (10 Installments)</option>
                    <option value="annual">Annual Lump-sum (100%)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Line Item Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Itemized Fee Components</h4>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Component Line</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {formItems.map((item, idx) => (
                    <div key={item.id || idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <select
                        value={item.category}
                        onChange={(e) => handleItemCategoryChange(idx, e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[130px]"
                      >
                        <option value="Tuition">Tuition</option>
                        <option value="Registration">Registration</option>
                        <option value="Library">Library</option>
                        <option value="Laboratory">Laboratory</option>
                        <option value="Examination">Examination</option>
                        <option value="Sports">Sports</option>
                        <option value="Transport">Transport</option>
                        <option value="Hostel">Hostel</option>
                        <option value="ICT">ICT & Digital</option>
                        <option value="Uniform">Uniforms</option>
                        <option value="Other">Other</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Component description..."
                        value={item.description}
                        onChange={(e) => handleItemDescChange(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                      />

                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={item.amount || ''}
                          onChange={(e) => handleItemAmountChange(idx, e.target.value)}
                          className="w-full pl-6 pr-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Remove component"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block">Total Calculated Annual Fee Ceiling</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    T1 (40%): ${(totalCalculatedFee * 0.4).toFixed(2)} • T2 (30%): ${(totalCalculatedFee * 0.3).toFixed(2)} • T3 (30%): ${(totalCalculatedFee * 0.3).toFixed(2)}
                  </span>
                </div>
                <span className="font-mono text-xl font-black text-emerald-700 dark:text-emerald-400">
                  ${totalCalculatedFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Policy Options */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formInstallmentAllowed}
                      onChange={(e) => setFormInstallmentAllowed(e.target.checked)}
                      className="w-4 h-4 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Installment Tranches Allowed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formScholarshipEligible}
                      onChange={(e) => setFormScholarshipEligible(e.target.checked)}
                      className="w-4 h-4 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">Scholarship Eligible</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer"
                  >
                    {editingStructureId ? 'Update Fee Structure' : 'Save Fee Structure'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

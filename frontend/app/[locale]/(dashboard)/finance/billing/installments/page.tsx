/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  DollarSign, CheckCircle2, AlertTriangle,
  FileText, ArrowRight, Percent,
  Layers, ShieldCheck, Clock, Split
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import type { Invoice } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface InstallmentRow {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  studentName: string;
  admissionNumber?: string;
  installmentIndex: number;
  totalInstallments: number;
  dueDate: string;
  amount: number;
  remainingBalance: number;
  status: 'paid' | 'pending_payment' | 'partially_paid' | 'overdue';
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InstallmentPlansPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [density, setDensity]   = useState<TableDensity>('cozy');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getInvoices();
      setInvoices(data || []);
    } catch {
      toast.error('Failed to load installment plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Flatten invoices to individual installment milestones
  const allInstallments = useMemo<InstallmentRow[]>(() => {
    const rows: InstallmentRow[] = [];
    const today = new Date().toISOString().split('T')[0];

    invoices.forEach(inv => {
      const studentTitle = inv.studentName || (inv.student ? `${inv.student.firstName || ''} ${inv.student.lastName || ''}`.trim() : 'Student');
      const instList = inv.installments || [];

      if (instList.length > 0) {
        instList.forEach((inst: any, idx: number) => {
          let st = (inst.status || 'pending_payment') as any;
          if (st === 'pending_payment' && inst.dueDate && inst.dueDate < today && (inst.remainingBalance ?? inst.amount) > 0) {
            st = 'overdue';
          }

          rows.push({
            id: `${inv.id}-inst-${idx + 1}`,
            invoiceId: String(inv.id),
            invoiceNumber: inv.invoiceNumber,
            studentName: studentTitle,
            admissionNumber: (inv.student as any)?.admissionNumber || inv.admissionNumber,
            installmentIndex: idx + 1,
            totalInstallments: instList.length,
            dueDate: inst.dueDate ? String(inst.dueDate).split('T')[0] : '—',
            amount: Number(inst.amount || 0),
            remainingBalance: Number(inst.remainingBalance ?? (st === 'paid' ? 0 : inst.amount)),
            status: st,
          });
        });
      } else {
        // Single payment plan represented as 1 installment
        let st: any = inv.status === 'paid' ? 'paid' : (inv.status === 'partially_paid' ? 'partially_paid' : 'pending_payment');
        if (st === 'pending_payment' && inv.dueDate && inv.dueDate < today && Number(inv.remainingBalance ?? inv.totalAmount) > 0) {
          st = 'overdue';
        }
        rows.push({
          id: `${inv.id}-single`,
          invoiceId: String(inv.id),
          invoiceNumber: inv.invoiceNumber,
          studentName: studentTitle,
          admissionNumber: (inv.student as any)?.admissionNumber || inv.admissionNumber,
          installmentIndex: 1,
          totalInstallments: 1,
          dueDate: inv.dueDate || '—',
          amount: Number(inv.totalAmount || 0),
          remainingBalance: Number(inv.remainingBalance ?? (st === 'paid' ? 0 : inv.totalAmount)),
          status: st,
        });
      }
    });

    return rows;
  }, [invoices]);

  const filteredInstallments = useMemo(() => {
    return allInstallments.filter(r => {
      const q = query.toLowerCase();
      const matchQ = !query ||
        r.invoiceNumber.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        (r.admissionNumber && r.admissionNumber.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [allInstallments, query, statusFilter]);

  const totalAmount       = useMemo(() => allInstallments.reduce((s, r) => s + r.amount, 0), [allInstallments]);
  const totalOutstanding  = useMemo(() => allInstallments.reduce((s, r) => s + r.remainingBalance, 0), [allInstallments]);
  const totalOverdue      = useMemo(() => allInstallments.filter(r => r.status === 'overdue').reduce((s, r) => s + r.remainingBalance, 0), [allInstallments]);
  const paidCount         = useMemo(() => allInstallments.filter(r => r.status === 'paid').length, [allInstallments]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_installments',
      title: 'Total Active Installments',
      value: `$${fmt(totalAmount)}`,
      subtitle: `${allInstallments.length} total scheduled payment milestones`,
      trendDirection: 'neutral',
      icon: <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
    },
    {
      id: 'total_outstanding',
      title: 'Outstanding Installments',
      value: `$${fmt(totalOutstanding)}`,
      subtitle: `${allInstallments.filter(r => r.remainingBalance > 0).length} tranches pending settlement`,
      trendDirection: totalOutstanding > 0 ? 'down' : 'up',
      icon: <DollarSign className="w-5 h-5 text-amber-500" />,
    },
    {
      id: 'overdue_installments',
      title: 'Overdue Milestones',
      value: `$${fmt(totalOverdue)}`,
      subtitle: `${allInstallments.filter(r => r.status === 'overdue').length} tranches past due date`,
      trendDirection: totalOverdue > 0 ? 'down' : 'up',
      icon: <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />,
    },
    {
      id: 'settled_installments',
      title: 'Fully Settled Tranches',
      value: `${paidCount} Paid`,
      subtitle: `${allInstallments.length > 0 ? ((paidCount / allInstallments.length) * 100).toFixed(0) : 100}% tranche completion rate`,
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
  ];

  const columns = useMemo<ColumnDef<InstallmentRow, any>[]>(() => [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice & Tranche Index',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-black text-sky-700 dark:text-sky-400 block">{r.invoiceNumber}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Tranche {r.installmentIndex} of {r.totalInstallments}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'studentName',
      header: 'Student Scholar & Admission ID',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="space-y-0.5">
            <p className="font-bold text-slate-900 dark:text-white text-xs">{r.studentName}</p>
            {r.admissionNumber && (
              <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 block">{r.admissionNumber}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Maturity / Due Date',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
          {row.original.dueDate}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Tranche Amount ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">
          ${fmt(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'remainingBalance',
      header: 'Outstanding ($)',
      cell: ({ row }) => (
        <span className={`font-mono text-xs font-black whitespace-nowrap ${row.original.remainingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
          ${fmt(row.original.remainingBalance)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Settlement Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Link
          href={`/finance/billing/payments?invoiceNumber=${row.original.invoiceNumber}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-all border border-emerald-200 dark:border-emerald-800 shadow-sm"
        >
          <span>Collect</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      ),
    },
  ], []);

  const clearFilters = () => { setStatusFilter('all'); setQuery(''); };

  return (
    <EnterpriseModuleShell
      title="Tuition Installment Plans & Deferred Schedules"
      description="Structured 4-quarter and custom deferred tuition schedules. Automated maturity tracking with direct cashier collection workflows."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Billing & Invoicing' }, { label: 'Installments' }]}
      icon={<Percent className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={filteredInstallments.length}
      recordLabel="Payment Milestones"
      activeFilterCount={statusFilter !== 'all' ? 1 : 0}
      onClearFilters={clearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/billing/invoices"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>View Invoices</span>
          </Link>
          <Link
            href="/finance/billing/payments"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <DollarSign className="w-4 h-4 stroke-[3]" />
            <span>Collect Payment</span>
          </Link>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/finance/billing/structures" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Fee Structures</span>
        </Link>
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Invoices</span>
        </Link>
        <Link href="/finance/billing/installments" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5" />
          <span>Installment Plans</span>
        </Link>
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Payments & Receipts</span>
        </Link>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        {['all', 'pending_payment', 'partially_paid', 'paid', 'overdue'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === st
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {st === 'all' ? 'All Milestones' : st.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search by invoice, student name, or admission number..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Installment plans refreshed.'); }}
        activeFilterCount={statusFilter !== 'all' ? 1 : 0}
        onResetFilters={clearFilters}
        createButtonLabel="+ Create Invoice Plan"
        onCreate={() => toast.info('Generate new installment plans via Invoices > Create Invoice.')}
      />

      <EnterpriseDataGrid
        data={filteredInstallments}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        emptyStateProps={{
          title: 'No Installment Plans Found',
          description: 'No payment plan tranches match your active search or filter parameters.',
          isFilterActive: statusFilter !== 'all' || query.length > 0,
          onResetFilters: clearFilters,
          createLabel: 'Generate Student Invoice',
          onCreate: () => {},
        }}
      />
    </EnterpriseModuleShell>
  );
}

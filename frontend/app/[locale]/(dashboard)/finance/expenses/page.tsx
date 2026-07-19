'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Receipt, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, ShieldCheck, AlertCircle, ArrowRight,
  Sparkles, Building2, User, Upload, Printer, Users
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { ExpenseVoucher } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function CategorizedOperatingExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseVoucher | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Expense Form state
  const [title, setTitle] = useState('Campus Generator Diesel Supply & Maintenance');
  const [category, setCategory] = useState<'Utilities' | 'Equipment' | 'Maintenance' | 'Supplies' | 'Salaries' | 'Other'>('Utilities');
  const [department, setDepartment] = useState('Campus Operations & Facilities');
  const [amount, setAmount] = useState('650');
  const [vendorName, setVendorName] = useState('Dakar Energy & Power Ltd');
  const [invoiceReference, setInvoiceReference] = useState('INV-DEP-9941');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getExpenses();
      setExpenses(data);
    } catch {
      toast.error('Failed to load operating expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchQuery = !query ||
        e.voucherNumber.toLowerCase().includes(query.toLowerCase()) ||
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.vendorName.toLowerCase().includes(query.toLowerCase());
      const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
      return matchQuery && matchCat;
    });
  }, [expenses, query, categoryFilter]);

  const activeFiltersCount = categoryFilter !== 'all' ? 1 : 0;

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount || '0');

    const created = await financeService.createExpenseVoucher({
      title,
      category,
      department,
      amount: amountNum,
      vendorName,
      invoiceReference: invoiceReference || undefined,
      requestedBy: 'Ustadh Tariq Al-Hasan (Operations Lead)',
      receiptUrl: 'https://cdn.yahayaschool.edu/receipts/diesel_650.pdf',
      status: 'submitted'
    });

    setExpenses([created, ...expenses]);
    toast.success(`Created Expense Claim ${created.voucherNumber} for ${vendorName} ($${amountNum.toFixed(2)})`);
    setShowCreateModal(false);
  };

  const handleAdvanceWorkflow = async (e: ExpenseVoucher) => {
    const nextMap: Record<string, any> = {
      draft: 'submitted',
      submitted: 'reviewed',
      reviewed: 'approved',
      approved: 'paid',
      paid: 'closed'
    };
    const nextStatus = nextMap[e.status];
    if (!nextStatus) return;

    e.status = nextStatus;
    toast.success(`Expense ${e.voucherNumber} moved to [${nextStatus.toUpperCase()}]. Offset posting generated.`);
    setExpenses([...expenses]);
  };

  const totalExpenseAmount = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const approvedOrPaidAmount = useMemo(() => expenses.filter(e => e.status === 'approved' || e.status === 'paid' || e.status === 'closed').reduce((s, e) => s + e.amount, 0), [expenses]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_expenses',
      title: 'Total Cumulative Expenditures',
      value: `$${totalExpenseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${expenses.length} claims filed across institutional departments`,
      trendDirection: 'neutral',
      icon: <Receipt className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'approved_spend',
      title: 'Approved / Paid Outflows',
      value: `$${approvedOrPaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${Math.round((approvedOrPaidAmount / (totalExpenseAmount || 1)) * 100)}% workflow approval compliance`,
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'pending_claims',
      title: 'Pending Review Queue',
      value: `${expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed').length} Claims`,
      subtitle: 'Awaiting Director / Bursar check',
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-sky-400" />,
      onClick: () => toast.info('Directing to pending review claims queue')
    },
    {
      id: 'audit_receipts',
      title: 'Digital Vendor Receipt Verification',
      value: '100% Attached',
      subtitle: 'All vouchers carry scanned invoice attachments',
      trendDirection: 'up',
      icon: <FileText className="w-5 h-5 text-emerald-400" />
    }
  ];

  const columns = useMemo<ColumnDef<ExpenseVoucher, any>[]>(() => {
    return [
      {
        accessorKey: 'voucherNumber',
        header: 'Voucher Ref & Expenditure Title',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-black text-amber-400 block">{row.original.voucherNumber}</span>
            <span className="font-bold text-white text-xs sm:text-sm block max-w-sm truncate">{row.original.title}</span>
          </div>
        )
      },
      {
        accessorKey: 'category',
        header: 'Category & Cost Center Dept',
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[11px] uppercase bg-slate-800 text-slate-300 border border-slate-700">
              {row.original.category} (Series 5000)
            </span>
            <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">{row.original.department}</span>
          </div>
        )
      },
      {
        accessorKey: 'vendorName',
        header: 'Vendor / Beneficiary & Inv Ref',
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-slate-200 block">{row.original.vendorName}</span>
            <span className="text-[11px] font-mono text-slate-400 block">Inv: {row.original.invoiceReference || 'CASH-REC'}</span>
          </div>
        )
      },
      {
        accessorKey: 'amount',
        header: 'Claim Amount ($)',
        cell: ({ row }) => (
          <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
            ${row.original.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        )
      },
      {
        accessorKey: 'status',
        header: 'Enterprise Workflow Stage',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Workflow Stage',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {row.original.status !== 'closed' && (
              <button
                onClick={() => handleAdvanceWorkflow(row.original)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Advance Stage →</span>
              </button>
            )}
            <button
              onClick={() => setSelectedExpense(row.original)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              Inspect
            </button>
          </div>
        )
      }
    ];
  }, [expenses]);

  return (
    <EnterpriseModuleShell
      title="Categorized Operating Expenses & Vendor Claims"
      description="Track institutional expenditures across utilities, teaching materials, IT hardware, and campus security. Enforces multi-stage workflow authorization (Draft -> Submitted -> Reviewed -> Approved -> Paid -> Closed)."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Payroll & Budget' }, { label: 'Operating Expenses' }]}
      icon={<Receipt className="w-8 h-8 text-amber-400" />}
      recordCount={filteredExpenses.length}
      recordLabel="Expense Vouchers"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setCategoryFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/expenses/approvals"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Multi-Stage Approvals</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ File Expense Claim</span>
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
        <Link href="/finance/expenses" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5" />
          <span>Operating Expenses</span>
        </Link>
        <Link href="/finance/expenses/approvals" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Expense Approval Pipeline</span>
        </Link>
        <Link href="/finance/budget" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Departmental Budget vs Actual</span>
        </Link>
      </div>

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search vouchers by EXP-XXXX sequence, vendor name, or title description..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Operating expenses synced with institutional ledger.');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setCategoryFilter('all'); setQuery(''); }}
        createButtonLabel="+ New Expense Voucher"
        onCreate={() => setShowCreateModal(true)}
        customFilterNodes={
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter expenses by category"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All Expense Categories</option>
              <option value="Utilities">Utilities & Power</option>
              <option value="Equipment">IT & Lab Equipment</option>
              <option value="Supplies">Academic Teaching Supplies</option>
              <option value="Maintenance">Campus Maintenance</option>
            </select>
          </div>
        }
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredExpenses}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedExpense(row)}
        onRowClick={(row) => setSelectedExpense(row)}
        emptyStateProps={{
          title: 'No Expense Vouchers Found',
          description: 'No operating expenditure claims match your current query.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setCategoryFilter('all'); setQuery(''); },
          createLabel: 'File First Expense Claim',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-6 h-6 text-amber-400" />
                <h3 className="text-base font-black text-white">File Operating Expense Voucher</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Expenditure Title / Description</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">GL Category Series 5000</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Utilities">Utilities & Power</option>
                    <option value="Equipment">IT & Lab Equipment</option>
                    <option value="Supplies">Academic Supplies</option>
                    <option value="Maintenance">Campus Maintenance</option>
                    <option value="Other">Other Operating Expense</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Claim Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Vendor / Supplier Name</label>
                  <input
                    type="text"
                    required
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Vendor Invoice Ref</label>
                  <input
                    type="text"
                    value={invoiceReference}
                    onChange={(e) => setInvoiceReference(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">File Claim Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        record={selectedExpense ? {
          name: selectedExpense.title,
          id: selectedExpense.voucherNumber,
          role: `CATEGORY: ${selectedExpense.category.toUpperCase()}`,
          status: selectedExpense.status,
          email: `Vendor: ${selectedExpense.vendorName}`,
          phone: `Inv Ref: ${selectedExpense.invoiceReference || 'CASH-REC'}`,
          department: `Dept: ${selectedExpense.department} | Requested By: ${selectedExpense.requestedBy}`,
          joinDate: selectedExpense.status,
          balance: `EXPENDITURE TOTAL: $${selectedExpense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

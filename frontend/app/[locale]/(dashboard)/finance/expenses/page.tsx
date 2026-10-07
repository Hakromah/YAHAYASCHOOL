/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Receipt, Plus, Download, Eye, CheckCircle2,
  Clock, DollarSign, ShieldCheck,
  Building2, Users, X, RefreshCw
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { useAuth } from '@/hooks/useAuth';
import { financeService } from '@/services/finance.service';
import type { ExpenseRequest } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function CategorizedOperatingExpensesPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);
  const { user } = useAuth();

  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Utilities' | 'Equipment' | 'Maintenance' | 'Supplies' | 'Salaries' | 'Other'>('Utilities');
  const [department, setDepartment] = useState('');
  const [amount, setAmount] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [invoiceReference, setInvoiceReference] = useState('');

  // Stable loadData — depends only on locale
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeService.getExpenseRequests();
      setExpenses(data);
    } catch {
      toast.error(i18nT('Failed to load operating expenses.', locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchQuery = !query ||
        (e.voucherNumber || '').toLowerCase().includes(query.toLowerCase()) ||
        (e.title || '').toLowerCase().includes(query.toLowerCase()) ||
        (e.vendorName || '').toLowerCase().includes(query.toLowerCase()) ||
        (e.department || '').toLowerCase().includes(query.toLowerCase());
      const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
      return matchQuery && matchCat;
    });
  }, [expenses, query, categoryFilter]);

  const activeFiltersCount = categoryFilter !== 'all' ? 1 : 0;

  const handleCreateExpense = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!title.trim() || !amount) {
      toast.error('Title and expense amount are required.');
      return;
    }
    const amountNum = parseFloat(amount || '0');
    const requestedBy = (user as any)?.name || (user as any)?.username || 'Finance Officer';
    try {
      const created = await financeService.createExpenseRequest({
        voucherNumber: `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        title,
        category,
        department: department || 'Campus Operations & Facilities',
        amount: amountNum,
        vendorName: vendorName || 'Direct Vendor',
        invoiceReference: invoiceReference || undefined,
        requestedBy,
        status: 'submitted'
      });
      setExpenses(prev => [created, ...prev]);
      toast.success(`Created Expense Claim ${created.voucherNumber || 'EXP'} ($${amountNum.toFixed(2)})`);
      setTitle(''); setDepartment(''); setAmount(''); setVendorName(''); setInvoiceReference('');
      setShowCreateModal(false);
    } catch {
      toast.error('Failed to create expense claim');
    }
  };

  const handleAdvanceWorkflow = async (exp: ExpenseRequest) => {
    const nextMap: Record<string, string> = { draft: 'submitted', submitted: 'reviewed', reviewed: 'approved', approved: 'paid' };
    const next = nextMap[exp.status || 'submitted'] || 'paid';
    const targetId = (exp as any).documentId || exp.id;
    try {
      await financeService.updateExpenseStatus(String(targetId), next);
      setExpenses(prev => prev.map(e => e.id === exp.id ? { ...e, status: next as any } : e));
      toast.success(`Expense ${exp.voucherNumber} advanced to ${next.toUpperCase()}`);
    } catch {
      toast.error('Failed to advance workflow');
    }
  };

  const totalExpenses    = useMemo(() => expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0), [expenses]);
  const pendingApprovals = useMemo(() => expenses.filter(e => e.status === 'submitted' || e.status === 'reviewed').length, [expenses]);
  const disbursedTotal   = useMemo(() => expenses.filter(e => e.status === 'paid').reduce((s, e) => s + (Number(e.amount) || 0), 0), [expenses]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_expenses',
      title: 'Total Incurred Operating Expenses (YTD)',
      value: `$${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${expenses.length} claims and disbursement vouchers`,
      trendDirection: 'up',
      icon: <Receipt className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      isActive: categoryFilter === 'all',
      onClick: () => setCategoryFilter('all')
    },
    {
      id: 'pending_approvals',
      title: 'Pending Multi-Stage Approvals',
      value: `${pendingApprovals} Claims`,
      subtitle: 'Requisitions awaiting Director authorization',
      trendDirection: pendingApprovals > 0 ? 'down' : 'up',
      icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      onClick: () => toast.info('Inspect approval queue in Approvals view.')
    },
    {
      id: 'disbursed_funds',
      title: 'Disbursed & Settled Capital Outflows',
      value: `$${disbursedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Settled via commercial bank or mobile money',
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    }
  ];

  const columns = useMemo<ColumnDef<ExpenseRequest, any>[]>(() => [
    {
      accessorKey: 'voucherNumber',
      header: 'Voucher # & Title',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400 block">{row.original.voucherNumber}</span>
          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block max-w-sm truncate">{row.original.title}</span>
        </div>
      )
    },
    {
      accessorKey: 'category',
      header: 'Category & Department',
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
            {row.original.category}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-xs">{row.original.department}</span>
        </div>
      )
    },
    {
      accessorKey: 'vendorName',
      header: 'Vendor / Payee',
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-bold text-slate-900 dark:text-slate-200 block">{row.original.vendorName}</span>
          {row.original.invoiceReference && <span className="text-[10px] text-slate-400 font-mono">Ref: {row.original.invoiceReference}</span>}
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: 'Claim Amount ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 block">
          -${(Number(row.original.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Workflow Status',
      cell: ({ row }) => <StatusBadge status={row.original.status || 'submitted'} size="sm" />
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const exp = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(evt) => evt.stopPropagation()}>
            {exp.status !== 'paid' && (
              <button
                onClick={() => handleAdvanceWorkflow(exp)}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                {exp.status === 'submitted' ? 'Review' : exp.status === 'reviewed' ? 'Approve' : 'Disburse'}
              </button>
            )}
            <button
              onClick={() => setSelectedExpense(exp)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              Inspect
            </button>
          </div>
        );
      }
    }
  ], [locale]);

  // Shared input/select class names
  const inputCls = 'w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300';

  return (
    <EnterpriseModuleShell
      title="Operating Expenses & Supplier Claims Console"
      description="Multi-stage expense requisition lifecycle (Draft \u2192 Submitted \u2192 Reviewed \u2192 Approved \u2192 Paid). Automated GL posting upon disbursement."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Payroll & Budget' }, { label: 'Operating Expenses' }]}
      icon={<Receipt className="w-8 h-8 text-rose-600 dark:text-rose-400" />}
      recordCount={filteredExpenses.length}
      recordLabel="Claims"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setCategoryFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/expenses/approvals"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Approval Queue</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Create Expense Claim</span>
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
        <Link href="/finance/expenses" className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5" />
          <span>Operating Expenses</span>
        </Link>
        <Link href="/finance/expenses/approvals" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Multi-Stage Approvals</span>
        </Link>
        <Link href="/finance/budget" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Departmental Budget vs Actual</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search expenses by voucher #, title, vendor name, or department..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Operating expenses refreshed'); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setCategoryFilter('all'); setQuery(''); }}
        createButtonLabel="+ New Expense Claim"
        onCreate={() => setShowCreateModal(true)}
        customFilterNodes={
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Utilities">Utilities</option>
              <option value="Equipment">Equipment & IT</option>
              <option value="Supplies">Teaching Supplies</option>
              <option value="Maintenance">Maintenance & Repairs</option>
              <option value="Salaries">Staff Salaries</option>
              <option value="Other">Other</option>
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredExpenses}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        pageSize={50}
        onRowInspect={(row) => setSelectedExpense(row)}
        onRowClick={(row) => setSelectedExpense(row)}
        emptyStateProps={{
          title: 'No Expenses Found',
          description: 'No operating expenses match your search or filter criteria.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setCategoryFilter('all'); setQuery(''); },
          createLabel: 'Log First Expense Claim',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Create Operating Expense Claim</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="space-y-1">
                <label className={labelCls}>Expense Title / Purpose</label>
                <input
                  type="text" required
                  placeholder="e.g. Science Lab Consumables & Reagents"
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>GL Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as any)} className={selectCls}>
                    <option value="Utilities">Utilities (5020)</option>
                    <option value="Equipment">Equipment & IT (5030)</option>
                    <option value="Supplies">Teaching Supplies (5040)</option>
                    <option value="Maintenance">Maintenance & Repairs (5050)</option>
                    <option value="Salaries">Staff Salaries & Benefits (5010)</option>
                    <option value="Other">Other Operating Expense</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Department / Cost Center</label>
                  <input
                    type="text" placeholder="e.g. Science Department"
                    value={department} onChange={(e) => setDepartment(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Vendor / Supplier Name</label>
                  <input
                    type="text" placeholder="e.g. Dakar Lab Supplies Ltd"
                    value={vendorName} onChange={(e) => setVendorName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Claim Amount ($ USD)</label>
                  <input
                    type="number" step="0.01" required placeholder="450"
                    value={amount} onChange={(e) => setAmount(e.target.value)}
                    className={inputCls + ' font-mono text-rose-600 dark:text-rose-400 font-black'}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Invoice / Reference Number (optional)</label>
                <input
                  type="text" placeholder="e.g. INV-2026-4421"
                  value={invoiceReference} onChange={(e) => setInvoiceReference(e.target.value)}
                  className={inputCls + ' font-mono'}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer">Submit Expense Claim</button>
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
          role: `VENDOR: ${selectedExpense.vendorName || 'Direct'}`,
          status: selectedExpense.status || 'submitted',
          email: `Requested By: ${selectedExpense.requestedBy || 'Staff'}`,
          phone: `Category: ${selectedExpense.category}`,
          department: `Dept: ${selectedExpense.department}`,
          joinDate: selectedExpense.status,
          balance: `AMOUNT: $${(Number(selectedExpense.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

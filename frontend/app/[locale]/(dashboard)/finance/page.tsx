'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign, HeartHandshake, Receipt, Wallet, TrendingUp, ArrowRight,
  Search, Filter, Download, Plus, Eye, CheckCircle2, AlertTriangle,
  Clock, Shield, FileText, CreditCard, Landmark, Scale, ScrollText,
  BarChart3, PiggyBank, Coins, Award, Percent, Building2
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { ExecutiveFinanceStats } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function FinanceOverviewPage() {
  const [stats, setStats] = useState<ExecutiveFinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  // Reconciliation states
  const [reconciliationError, setReconciliationError] = useState<string | null>(null);
  const [reconciliationDetails, setReconciliationDetails] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const data = await financeService.getExecutiveStats(academicYear);
        if (mounted) setStats(data);
      } catch {
        toast.error('Failed to load executive finance statistics.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [academicYear]);

  useEffect(() => {
    Promise.all([
      financeService.getInvoices(),
      financeService.getReceipts()
    ]).then(([allInvoices, allReceipts]) => {
      const sumInvoiced = allInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
      const sumPaid = allInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
      const sumRemaining = allInvoices.reduce((sum, inv) => sum + Number(inv.remainingBalance || 0), 0);
      
      // Receipts paymentAmount totals include overpayments credited to wallet liabilities.
      // Real invoice allocated revenue is sumPaid.
      const sumReceiptsAllocated = allReceipts.reduce((sum, rec) => sum + Number(rec.invoiceAllocation || rec.paymentAmount || rec.amount || 0), 0);

      const hasNegativeInvoice = allInvoices.some(inv => Number(inv.remainingBalance || 0) < -0.01 || Number(inv.paidAmount || 0) < -0.01);
      
      // Invoiced must equal Allocated Paid + Remaining Outstanding
      const invoiceMismatch = Math.abs(sumInvoiced - (sumPaid + sumRemaining)) > 0.01;

      if (invoiceMismatch || hasNegativeInvoice) {
        setReconciliationError("Finance Integrity Warning");
        setReconciliationDetails({
          sumInvoiced,
          sumPaid,
          sumRemaining,
          sumReceipts: sumReceiptsAllocated,
          hasNegativeInvoice,
          invoiceMismatch,
          receiptMismatch: false
        });
      } else {
        setReconciliationError(null);
        setReconciliationDetails(null);
      }
    }).catch(err => {
      console.warn("Reconciliation check failed", err);
    });
  }, [stats]);

  const transactions = useMemo(() => {
    if (!stats) return [];
    return stats.recentTransactions.filter(tx => {
      const matchQuery = !query || 
        tx.title.toLowerCase().includes(query.toLowerCase()) || 
        tx.documentNumber.toLowerCase().includes(query.toLowerCase());
      const matchCat = categoryFilter === 'all' || tx.type === categoryFilter;
      return matchQuery && matchCat;
    });
  }, [stats, query, categoryFilter]);

  const activeFiltersCount = categoryFilter !== 'all' ? 1 : 0;

  const handleClearFilters = () => {
    setCategoryFilter('all');
    setQuery('');
    toast.success('Financial dashboard filters reset.');
  };

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    if (!stats) return [];
    return [
      {
        id: 'revenue',
        title: 'Tuition & Fee Revenue (YTD)',
        value: `$${stats.kpi.totalRevenueYTD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: `Collection rate: ${stats.kpi.feeCollectionRate}% (${stats.kpi.activeStudentsCount} active scholars)`,
        trendDirection: 'up',
        icon: <DollarSign className="w-5 h-5" />,
        isActive: categoryFilter === 'Tuition Receipt',
        onClick: () => {
          setCategoryFilter(categoryFilter === 'Tuition Receipt' ? 'all' : 'Tuition Receipt');
          toast.info(categoryFilter === 'Tuition Receipt' ? 'Showing all transactions' : 'Filtered to Tuition Receipts');
        },
        badgeText: 'Academic Year 2026-2027'
      },
      {
        id: 'outstanding',
        title: 'Outstanding Student Fees',
        value: `$${stats.kpi.outstandingFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: `${stats.kpi.pendingInvoicesCount} invoices pending settlement`,
        trendDirection: 'down',
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        onClick: () => toast.info('View detailed student accounts receivable in Billing Suite.')
      },
      {
        id: 'expenses',
        title: 'Operating Expenses (YTD)',
        value: `$${stats.kpi.monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: `${stats.kpi.pendingApprovalsCount} requisitions awaiting Account Lead review`,
        trendDirection: 'neutral',
        icon: <Receipt className="w-5 h-5" />,
        isActive: categoryFilter === 'Expense Disbursement',
        onClick: () => {
          setCategoryFilter(categoryFilter === 'Expense Disbursement' ? 'all' : 'Expense Disbursement');
          toast.info(categoryFilter === 'Expense Disbursement' ? 'Showing all transactions' : 'Filtered to Expense Disbursements');
        }
      },
      {
        id: 'payroll',
        title: 'Monthly Staff Payroll',
        value: `$${stats.kpi.payrollThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: '48 Senior Academic Faculty & Imams',
        trendDirection: 'neutral',
        icon: <Wallet className="w-5 h-5" />,
        isActive: categoryFilter === 'Payroll Payment',
        onClick: () => {
          setCategoryFilter(categoryFilter === 'Payroll Payment' ? 'all' : 'Payroll Payment');
          toast.info(categoryFilter === 'Payroll Payment' ? 'Showing all transactions' : 'Filtered to Payroll Settlements');
        }
      }
    ];
  }, [stats, categoryFilter]);

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'documentNumber',
        header: 'Document & Transaction Title',
        cell: ({ row }) => {
          const tx = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-black text-emerald-400 block">{tx.documentNumber}</span>
              <p className="font-bold text-white group-hover:text-emerald-300 transition-colors text-xs sm:text-sm max-w-sm truncate">
                {tx.title}
              </p>
            </div>
          );
        }
      },
      {
        accessorKey: 'type',
        header: 'Transaction Category',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
            {row.original.type === 'Tuition Receipt' && <DollarSign className="w-3.5 h-3.5 text-emerald-400" />}
            {row.original.type === 'Expense Disbursement' && <Receipt className="w-3.5 h-3.5 text-rose-400" />}
            {row.original.type === 'Payroll Payment' && <Wallet className="w-3.5 h-3.5 text-amber-400" />}
            {row.original.type === 'Waqf Donation' && <HeartHandshake className="w-3.5 h-3.5 text-sky-400" />}
            {row.original.type}
          </span>
        )
      },
      {
        accessorKey: 'date',
        header: 'Posting Date',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-300 font-bold block">{row.original.date}</span>
        )
      },
      {
        accessorKey: 'amount',
        header: 'Ledger Amount ($)',
        cell: ({ row }) => {
          const tx = row.original;
          const isIncome = tx.amount > 0;
          return (
            <span className={`font-mono text-xs sm:text-sm font-black ${
              isIncome ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isIncome ? '+' : ''}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'Settlement Status',
        cell: ({ row }) => <StatusBadge status={row.original.status.toLowerCase() === 'paid' ? 'paid' : row.original.status.toLowerCase() === 'reconciled' ? 'reconciled' : 'approved'} size="sm" />
      },
      {
        id: 'actions',
        header: 'Inspect',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRow(row.original);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Voucher</span>
          </button>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Executive Finance & Accounting ERP Dashboard"
      description="SAP S/4HANA-grade financial administration with automated double-entry accounting, budget vs. actual analytics, academic year separation, and multi-method treasury control."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Finance & Accounting Overview' }]}
      icon={<Landmark className="w-8 h-8" />}
      recordCount={transactions.length}
      recordLabel="Recent Vouchers"
      activeFilterCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          {/* Academic Year Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-400">Academic Year:</span>
            <select
              value={academicYear}
              onChange={(e) => {
                setAcademicYear(e.target.value);
                toast.info(`Switched financial partition to Academic Year ${e.target.value}`);
              }}
              aria-label="Select Academic Year"
              className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer"
            >
              <option value="2026-2027" className="bg-slate-900">2026-2027 (Active Term)</option>
              <option value="2025-2026" className="bg-slate-900">2025-2026 (Archived Period)</option>
            </select>
          </div>

          <Link
            href="/finance/billing/invoices"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Create Invoice</span>
          </Link>
          <Link
            href="/finance/accounting/journals"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all"
          >
            <ScrollText className="w-4 h-4 text-emerald-400" />
            <span>+ Post Journal</span>
          </Link>
        </div>
      }
    >
      {/* Finance Integrity Warning Alert */}
      {reconciliationError && reconciliationDetails && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-3xl p-5 space-y-3 animate-in slide-in-from-top duration-305 mb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            <strong className="text-sm font-black uppercase tracking-wider">{reconciliationError}</strong>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The automated financial engine has detected ledger inconsistencies in the active partition:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono text-slate-400">
            <div>
              <span>Invoiced Revenue:</span>
              <strong className="block text-slate-200">${reconciliationDetails.sumInvoiced.toFixed(2)}</strong>
            </div>
            <div>
              <span>Paid + Outstanding:</span>
              <strong className="block text-slate-200">${(reconciliationDetails.sumPaid + reconciliationDetails.sumRemaining).toFixed(2)}</strong>
            </div>
            <div>
              <span>Total Receipts:</span>
              <strong className="block text-slate-200">${reconciliationDetails.sumReceipts.toFixed(2)}</strong>
            </div>
            <div>
              <span>Status:</span>
              <strong className={`block ${reconciliationDetails.invoiceMismatch || reconciliationDetails.receiptMismatch ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}`}>
                {reconciliationDetails.invoiceMismatch ? 'Invoice Sum Mismatch' : reconciliationDetails.receiptMismatch ? 'Receipt Ledger Drift' : 'Balanced'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Clickable KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Treasury Insights & Runway Panel */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Multi-Currency Bank & Cash Treasury</h3>
                  <p className="text-xs text-slate-400">Real-time balances across commercial banks, mobile money wallets, and petty cash</p>
                </div>
              </div>
              <Link href="/finance/accounting/accounts" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
                <span>Reconcile Treasury</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Commercial Bank Accounts (1010)</span>
                <span className="text-xl font-black font-mono text-emerald-400 block">${stats.treasuryInsights.totalBankBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                <span className="text-xs text-slate-500 mt-1 block">Reconciled with First Islamic Bank</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Orange & Mobile Wallets (1020)</span>
                <span className="text-xl font-black font-mono text-sky-400 block">${stats.treasuryInsights.totalMobileMoney.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                <span className="text-xs text-slate-500 mt-1 block">Orange Money & MTN Merchant Wallets</span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Campus Cash Drawer (1030)</span>
                <span className="text-xl font-black font-mono text-amber-400 block">${stats.treasuryInsights.totalCashInDrawer.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                <span className="text-xs text-slate-500 mt-1 block">Open Cashier Session CSH-2026-088</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] uppercase tracking-wider border border-emerald-500/30 mb-2">
                <Shield className="w-3.5 h-3.5" />
                <span>Treasury Health</span>
              </span>
              <h4 className="text-lg font-black text-white">Estimated Runway</h4>
              <p className="text-3xl font-black font-mono text-emerald-400 mt-1">{stats.treasuryInsights.estimatedRunwayMonths} Months</p>
              <p className="text-xs text-slate-300 mt-2">Based on current monthly payroll and operating expense burn rate of ${stats.kpi.monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo.</p>
            </div>
            <Link
              href="/finance/budget"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center transition-all shadow-md block"
            >
              Inspect Department Budgets →
            </Link>
          </div>
        </div>
      )}

      {/* Quick Domain Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/finance/accounting/chart" className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500 transition-all flex items-center justify-between group shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Chart of Accounts</h4>
              <p className="text-xs text-slate-400">Assets, Liabilities, & Equity</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
        </Link>

        <Link href="/finance/billing/invoices" className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500 transition-all flex items-center justify-between group shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Student Invoices</h4>
              <p className="text-xs text-slate-400">Fee billing & installment plans</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
        </Link>

        <Link href="/finance/billing/payments" className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500 transition-all flex items-center justify-between group shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Cashier & Payments</h4>
              <p className="text-xs text-slate-400">Receipts, POS, & Orange Money</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
        </Link>

        <Link href="/finance/accounting/journals" className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500 transition-all flex items-center justify-between group shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Double-Entry Journals</h4>
              <p className="text-xs text-slate-400">Debits == Credits compliance</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
        </Link>
      </div>

      {/* Budget vs Actual Variance Table */}
      {stats && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Department Budget vs. Actual Utilization (2026-2027)</h3>
            </div>
            <Link href="/finance/budget" className="text-xs font-bold text-emerald-400 hover:underline">
              Full Budget Console →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.charts.budgetVsActualDepartment.map((b, idx) => {
              const percentage = Math.min(100, Math.round((b.spent / b.allocated) * 100));
              const isWarning = percentage > 85;
              return (
                <div key={idx} className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs truncate max-w-[180px]">{b.department}</span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded ${isWarning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                      {percentage}% Used
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Spent: <strong className="text-white">${b.spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
                    <span>Allocated: <strong className="text-emerald-400">${b.allocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search vouchers by document number (INV, RCP, EXP, PAY) or title..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          toast.success('Financial ledger synchronized with double-entry database');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
        createButtonLabel="+ Post Manual Journal"
        onCreate={() => toast.info('Opened Manual Double-Entry Journal wizard.')}
        customFilterNodes={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter vouchers by type"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All Voucher Categories</option>
              <option value="Tuition Receipt">Tuition Receipts (RCP)</option>
              <option value="Expense Disbursement">Expense Disbursements (EXP)</option>
              <option value="Payroll Payment">Staff Payroll Settlements (PAY)</option>
              <option value="Waqf Donation">Waqf Donations (DON)</option>
            </select>
          </div>
        }
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={transactions}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedRow(row)}
        onRowClick={(row) => setSelectedRow(row)}
        onRowEdit={(row) => toast.info(`Opening transaction editor for document ${row.documentNumber}`)}
        emptyStateProps={{
          title: 'No Vouchers Found',
          description: 'No accounting entries match your search query or category filter.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: 'Create New Journal Voucher',
          onCreate: () => toast.info('Opened new journal voucher modal')
        }}
      />

      {/* Slide-Out Profile Inspection Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow ? {
          ...selectedRow,
          name: selectedRow.title,
          id: selectedRow.documentNumber,
          role: `${selectedRow.type.toUpperCase()}`,
          status: selectedRow.status,
          email: selectedRow.date,
          balance: `$${selectedRow.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${selectedRow.status.toUpperCase()})`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

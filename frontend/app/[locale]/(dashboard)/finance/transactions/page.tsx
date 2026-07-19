'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FolderOpen, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Scale, ScrollText,
  Landmark, ShieldCheck, ArrowRight, Sparkles, Award
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { FinancialLedgerTransaction } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function GlobalTransactionsExplorerPage() {
  const [transactions, setTransactions] = useState<FinancialLedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedTx, setSelectedTx] = useState<FinancialLedgerTransaction | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getGlobalTransactions();
      setTransactions(data);
    } catch {
      toast.error('Failed to load global transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchQuery = !query ||
        t.transactionId.toLowerCase().includes(query.toLowerCase()) ||
        t.description.toLowerCase().includes(query.toLowerCase()) ||
        (t.referenceId && t.referenceId.toLowerCase().includes(query.toLowerCase())) ||
        (t.partyName && t.partyName.toLowerCase().includes(query.toLowerCase()));
      const matchType = typeFilter === 'all' || t.type === typeFilter;
      return matchQuery && matchType;
    });
  }, [transactions, query, typeFilter]);

  const activeFiltersCount = typeFilter !== 'all' ? 1 : 0;

  const totalCreditInflows = useMemo(() => transactions.filter(t => t.creditAmount > 0).reduce((s, t) => s + t.creditAmount, 0), [transactions]);
  const totalDebitOutflows = useMemo(() => transactions.filter(t => t.debitAmount > 0).reduce((s, t) => s + t.debitAmount, 0), [transactions]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_inflows',
      title: 'Global Ledger Inflows (+)',
      value: `$${totalCreditInflows.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Tuition collections, Waqf grants & deposits',
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'total_outflows',
      title: 'Global Ledger Outflows (-)',
      value: `$${totalDebitOutflows.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Staff payroll, operating expenses & supplier claims',
      trendDirection: 'neutral',
      icon: <Receipt className="w-5 h-5 text-rose-400" />
    },
    {
      id: 'net_movement',
      title: 'Net System Cash Position',
      value: `$${(totalCreditInflows - totalDebitOutflows).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Combined institutional cash surplus',
      trendDirection: 'up',
      icon: <Landmark className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'tx_volume',
      title: 'Ledger Activity Volume',
      value: `${transactions.length} Postings`,
      subtitle: 'All double-entry lines cross-indexed chronologically',
      trendDirection: 'up',
      icon: <ScrollText className="w-5 h-5 text-amber-400" />
    }
  ];

  const columns = useMemo<ColumnDef<FinancialLedgerTransaction, any>[]>(() => {
    return [
      {
        accessorKey: 'transactionId',
        header: 'Voucher Ref & Module Type',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-black text-emerald-400 block">{row.original.transactionId}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
              {row.original.type.toUpperCase()}
            </span>
          </div>
        )
      },
      {
        accessorKey: 'description',
        header: 'Description & Party Beneficiary',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-bold text-white text-xs sm:text-sm block max-w-sm truncate">{row.original.description}</span>
            {row.original.partyName && <span className="text-[11px] text-slate-400 block">Party: {row.original.partyName}</span>}
          </div>
        )
      },
      {
        accessorKey: 'date',
        header: 'Posting Date & Ref ID',
        cell: ({ row }) => (
          <div className="space-y-0.5 font-mono text-[11px]">
            <span className="text-slate-300 font-bold block">{row.original.date}</span>
            <span className="text-slate-400 block">{row.original.referenceId || 'CASH-POS'}</span>
          </div>
        )
      },
      {
        accessorKey: 'creditAmount',
        header: 'Inflow / Credit ($)',
        cell: ({ row }) => (
          <span className={`font-mono text-xs sm:text-sm font-black ${row.original.creditAmount > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
            {row.original.creditAmount > 0 ? `+$${row.original.creditAmount.toFixed(2)}` : '---'}
          </span>
        )
      },
      {
        accessorKey: 'debitAmount',
        header: 'Outflow / Debit ($)',
        cell: ({ row }) => (
          <span className={`font-mono text-xs sm:text-sm font-black ${row.original.debitAmount > 0 ? 'text-rose-400' : 'text-slate-600'}`}>
            {row.original.debitAmount > 0 ? `-$${row.original.debitAmount.toFixed(2)}` : '---'}
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
        header: 'Inspect',
        cell: ({ row }) => (
          <button
            onClick={() => setSelectedTx(row.original)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Global Financial Transaction Explorer & Ledger Search"
      description="Omni-channel institutional ledger search. Query and cross-examine every student fee receipt, payroll disbursement, vendor claim, and double-entry journal across the entire school."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Donations & Audit' }, { label: 'Global Transactions' }]}
      icon={<FolderOpen className="w-8 h-8 text-sky-400" />}
      recordCount={filteredTransactions.length}
      recordLabel="Ledger Transactions"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setTypeFilter('all'); setQuery(''); }}
      headerActions={
        <button
          onClick={() => financeService.exportToCSV(transactions, 'global_financial_transactions_2026.csv')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Full Ledger CSV</span>
        </button>
      }
    >
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/donations" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-emerald-400" />
          <span>Waqf & Donations</span>
        </Link>
        <Link href="/finance/reports" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Financial Statements (SAP/Odoo)</span>
        </Link>
        <Link href="/finance/audit" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>Immutable Audit Trail</span>
        </Link>
        <Link href="/finance/transactions" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Global Ledger Search</span>
        </Link>
      </div>

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search all institutional transactions by ID (PAY/EXP/INV/REC/JRN), party name, or description..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Omni-channel ledger transactions refreshed.');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setTypeFilter('all'); setQuery(''); }}
        customFilterNodes={
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter transactions by type"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All Module Postings</option>
              <option value="payment">Student Fee Receipts (REC)</option>
              <option value="invoice">Billing Invoices (INV)</option>
              <option value="payroll">Staff Payroll Runs (PAY)</option>
              <option value="expense">Operating Expenses (EXP)</option>
              <option value="journal">Double-Entry Journals (JRN)</option>
            </select>
          </div>
        }
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredTransactions}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedTx(row)}
        onRowClick={(row) => setSelectedTx(row)}
        emptyStateProps={{
          title: 'No Ledger Postings Found',
          description: 'No financial transactions match your current search across institutional modules.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setTypeFilter('all'); setQuery(''); }
        }}
      />

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        record={selectedTx ? {
          name: selectedTx.description,
          id: selectedTx.transactionId,
          role: `MODULE: ${selectedTx.type.toUpperCase()}`,
          status: selectedTx.status,
          email: `Date: ${selectedTx.date}`,
          phone: `Party: ${selectedTx.partyName || 'N/A'}`,
          department: `Ref ID: ${selectedTx.referenceId || 'N/A'}`,
          joinDate: selectedTx.academicYearCode,
          balance: selectedTx.creditAmount > 0 ? `CREDIT INFLOW: +$${selectedTx.creditAmount.toFixed(2)}` : `DEBIT OUTFLOW: -$${selectedTx.debitAmount.toFixed(2)}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

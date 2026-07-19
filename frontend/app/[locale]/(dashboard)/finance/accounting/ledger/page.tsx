'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FolderOpen, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Scale, ScrollText,
  Landmark, ShieldCheck, ArrowRight, Printer, Sparkles
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { ChartOfAccount, JournalEntry, JournalLine } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface GLPostingRow {
  id: string;
  journalNumber: string;
  postingDate: string;
  accountCode: string;
  accountName: string;
  memo: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export default function GeneralLedgerDrillDownPage() {
  const [coa, setCoa] = useState<ChartOfAccount[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('1010');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<GLPostingRow | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const coaList = await financeService.getChartOfAccounts();
      const jrnList = await financeService.getJournalEntries();
      setCoa(coaList);
      setJournals(jrnList);
      if (coaList.length > 0 && !selectedCode) {
        setSelectedCode(coaList[0].accountCode);
      }
    } catch {
      toast.error('Failed to load General Ledger data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentAccount = useMemo(() => {
    return coa.find(a => a.accountCode === selectedCode) || coa[0] || null;
  }, [coa, selectedCode]);

  const glRows = useMemo<GLPostingRow[]>(() => {
    if (!currentAccount) return [];
    let runBal = 0;
    const rows: GLPostingRow[] = [];

    // Chronological order from oldest to newest for running balance
    const sorted = [...journals].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));

    for (const j of sorted) {
      for (const line of j.lines) {
        if (line.accountCode === currentAccount.accountCode) {
          if (currentAccount.accountType === 'Asset' || currentAccount.accountType === 'Expense') {
            runBal += ((line.debitAmount || 0) - (line.creditAmount || 0));
          } else {
            runBal += ((line.creditAmount || 0) - (line.debitAmount || 0));
          }
          rows.push({
            id: line.id,
            journalNumber: j.journalNumber,
            postingDate: j.transactionDate,
            accountCode: line.accountCode,
            accountName: line.accountName,
            memo: line.memo || j.title,
            debit: line.debitAmount || 0,
            credit: line.creditAmount || 0,
            runningBalance: runBal
          });
        }
      }
    }

    return rows.reverse(); // Show most recent at top
  }, [currentAccount, journals]);

  const filteredRows = useMemo(() => {
    return glRows.filter(r => {
      if (!query) return true;
      return r.journalNumber.toLowerCase().includes(query.toLowerCase()) ||
        r.memo.toLowerCase().includes(query.toLowerCase());
    });
  }, [glRows, query]);

  const totalDebits = useMemo(() => glRows.reduce((s, r) => s + r.debit, 0), [glRows]);
  const totalCredits = useMemo(() => glRows.reduce((s, r) => s + r.credit, 0), [glRows]);

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    if (!currentAccount) return [];
    return [
      {
        id: 'account_bal',
        title: `${currentAccount.accountCode} — GL Account Balance`,
        value: `$${currentAccount.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: `Category: ${currentAccount.accountType} (${currentAccount.currency})`,
        trendDirection: 'up',
        icon: <Landmark className="w-5 h-5 text-emerald-400" />
      },
      {
        id: 'total_debits',
        title: 'Period Debits Posted (DR)',
        value: `$${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: `${glRows.filter(r => r.debit > 0).length} debit entries`,
        trendDirection: 'neutral',
        icon: <Scale className="w-5 h-5 text-sky-400" />
      },
      {
        id: 'total_credits',
        title: 'Period Credits Posted (CR)',
        value: `$${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: `${glRows.filter(r => r.credit > 0).length} credit entries`,
        trendDirection: 'neutral',
        icon: <Scale className="w-5 h-5 text-amber-400" />
      },
      {
        id: 'net_movement',
        title: 'Net Period Activity',
        value: `$${Math.abs(totalDebits - totalCredits).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: totalDebits >= totalCredits ? 'Net Debit Movement' : 'Net Credit Movement',
        trendDirection: 'up',
        icon: <ScrollText className="w-5 h-5 text-emerald-400" />
      }
    ];
  }, [currentAccount, totalDebits, totalCredits, glRows]);

  const columns = useMemo<ColumnDef<GLPostingRow, any>[]>(() => {
    return [
      {
        accessorKey: 'journalNumber',
        header: 'Voucher Ref & Date',
        cell: ({ row }) => (
          <div className="space-y-0.5 font-mono">
            <span className="text-xs font-black text-emerald-400 block">{row.original.journalNumber}</span>
            <span className="text-[11px] text-slate-400 block">{row.original.postingDate}</span>
          </div>
        )
      },
      {
        accessorKey: 'memo',
        header: 'Posting Description / Memo',
        cell: ({ row }) => (
          <span className="font-bold text-white text-xs block max-w-md truncate">{row.original.memo}</span>
        )
      },
      {
        accessorKey: 'debit',
        header: 'Debit Amount (DR $)',
        cell: ({ row }) => (
          <span className={`font-mono text-xs sm:text-sm font-black ${row.original.debit > 0 ? 'text-sky-400' : 'text-slate-600'}`}>
            {row.original.debit > 0 ? `$${row.original.debit.toFixed(2)}` : '---'}
          </span>
        )
      },
      {
        accessorKey: 'credit',
        header: 'Credit Amount (CR $)',
        cell: ({ row }) => (
          <span className={`font-mono text-xs sm:text-sm font-black ${row.original.credit > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
            {row.original.credit > 0 ? `$${row.original.credit.toFixed(2)}` : '---'}
          </span>
        )
      },
      {
        accessorKey: 'runningBalance',
        header: 'Running Balance ($)',
        cell: ({ row }) => (
          <span className="font-mono text-xs sm:text-sm font-black text-amber-400">
            ${row.original.runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        )
      },
      {
        id: 'actions',
        header: 'Voucher Inspect',
        cell: ({ row }) => (
          <button
            onClick={() => setSelectedRow(row.original)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Journal</span>
          </button>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="General Ledger (GL) Account Drill-Down & Activity Statement"
      description="Inspect real-time chronological debits, credits, and running balances for every individual account in the institutional Chart of Accounts hierarchy."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Accounting Engine' }, { label: 'GL Drill-Down' }]}
      icon={<FolderOpen className="w-8 h-8 text-sky-400" />}
      recordCount={filteredRows.length}
      recordLabel="GL Postings"
      activeFilterCount={query ? 1 : 0}
      onClearFilters={() => setQuery('')}
      headerActions={
        <div className="flex items-center gap-2">
          {/* Account Selector Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-400">Account:</span>
            <select
              value={selectedCode}
              onChange={(e) => {
                setSelectedCode(e.target.value);
                toast.info(`Switched GL drill-down to ${e.target.value}`);
              }}
              aria-label="Select GL Account"
              className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer max-w-[220px] truncate"
            >
              {coa.map(a => (
                <option key={a.accountCode} value={a.accountCode} className="bg-slate-900">
                  {a.accountCode} - {a.accountName} ({a.accountType})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => toast.success(`Printing certified General Ledger activity statement for ${currentAccount?.accountCode}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print GL Statement</span>
          </button>
        </div>
      }
    >
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/accounting/chart" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
          <span>Chart of Accounts</span>
        </Link>
        <Link href="/finance/accounting/journals" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Double-Entry Journals</span>
        </Link>
        <Link href="/finance/accounting/ledger" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5" />
          <span>General Ledger Drill-Down</span>
        </Link>
        <Link href="/finance/accounting/periods" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Accounting Periods Lock</span>
        </Link>
      </div>

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search postings by journal ref (JRN-XXXX) or memo description..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('GL drill-down refreshed.');
        }}
        activeFilterCount={query ? 1 : 0}
        onResetFilters={() => setQuery('')}
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredRows}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedRow(row)}
        onRowClick={(row) => setSelectedRow(row)}
        emptyStateProps={{
          title: 'No GL Postings Found',
          description: 'No journal debits or credits have been posted to this specific account yet.',
          isFilterActive: query.length > 0,
          onResetFilters: () => setQuery('')
        }}
      />

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow ? {
          name: selectedRow.memo,
          id: selectedRow.journalNumber,
          role: `ACCOUNT: ${selectedRow.accountCode} (${selectedRow.accountName})`,
          status: 'posted',
          email: `Date: ${selectedRow.postingDate}`,
          phone: selectedRow.debit > 0 ? `DEBIT: $${selectedRow.debit.toFixed(2)}` : `CREDIT: $${selectedRow.credit.toFixed(2)}`,
          department: `Category: ${currentAccount?.accountType}`,
          joinDate: selectedRow.postingDate,
          balance: `RUNNING BALANCE AFTER POSTING: $${selectedRow.runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

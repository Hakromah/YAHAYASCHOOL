/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  FolderOpen, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Scale, ScrollText,
  Landmark, ShieldCheck, ArrowRight, Printer, Sparkles
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
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
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);

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
      toast.error(t('Failed to load General Ledger data.'));
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
      for (const line of (j.lines || [])) {
        if (line.accountCode === currentAccount.accountCode) {
          if (currentAccount.accountType === 'Asset' || currentAccount.accountType === 'Expense') {
            runBal += ((Number(line.debitAmount) || 0) - (Number(line.creditAmount) || 0));
          } else {
            runBal += ((Number(line.creditAmount) || 0) - (Number(line.debitAmount) || 0));
          }
          rows.push({
            id: line.id,
            journalNumber: j.journalNumber,
            postingDate: j.transactionDate,
            accountCode: line.accountCode,
            accountName: line.accountName,
            memo: line.memo || j.title,
            debit: Number(line.debitAmount) || 0,
            credit: Number(line.creditAmount) || 0,
            runningBalance: runBal
          });
        }
      }
    }

    return rows.reverse();
  }, [currentAccount, journals]);

  const filteredRows = useMemo(() => {
    return glRows.filter(r => {
      if (!query) return true;
      return r.journalNumber.toLowerCase().includes(query.toLowerCase()) ||
        r.memo.toLowerCase().includes(query.toLowerCase()) ||
        r.accountName.toLowerCase().includes(query.toLowerCase());
    });
  }, [glRows, query]);

  const totalDebits = useMemo(() => glRows.reduce((s, r) => s + r.debit, 0), [glRows]);
  const totalCredits = useMemo(() => glRows.reduce((s, r) => s + r.credit, 0), [glRows]);
  const currentNetBalance = glRows.length > 0 ? glRows[0].runningBalance : 0;

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'current_balance',
      title: `${currentAccount?.accountName || t('Account')} (${currentAccount?.accountCode || '---'})`,
      value: `$${Math.abs(currentNetBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${t('Current Certified Net Ledger Balance')} (${currentAccount?.accountType || 'Asset'})`,
      trendDirection: 'up',
      icon: <Landmark className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'total_debits',
      title: t('Cumulative Period Debits'),
      value: `$${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${glRows.filter(r => r.debit > 0).length} ${t('Debit Transactions Posted')}`,
      trendDirection: 'neutral',
      icon: <Scale className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'total_credits',
      title: t('Cumulative Period Credits'),
      value: `$${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${glRows.filter(r => r.credit > 0).length} ${t('Credit Transactions Posted')}`,
      trendDirection: 'neutral',
      icon: <Receipt className="w-5 h-5 text-indigo-400" />
    },
    {
      id: 'postings_count',
      title: t('Total Activity Lines'),
      value: `${glRows.length} ${t('Postings')}`,
      subtitle: t('Chronological Double-Entry Ledger Feed'),
      trendDirection: 'up',
      icon: <ScrollText className="w-5 h-5 text-amber-400" />
    }
  ];

  const columns = useMemo<ColumnDef<GLPostingRow, any>[]>(() => [
    {
      accessorKey: 'postingDate',
      header: t('Date & Voucher Ref'),
      cell: ({ row }) => (
        <div className="space-y-0.5 font-mono text-xs">
          <span className="font-bold text-white block">{row.original.postingDate}</span>
          <span className="text-[11px] text-emerald-400 block font-semibold">{row.original.journalNumber}</span>
        </div>
      )
    },
    {
      accessorKey: 'memo',
      header: t('Transaction Memo & Description'),
      cell: ({ row }) => (
        <span className="font-medium text-white text-xs sm:text-sm block max-w-md truncate">
          {row.original.memo}
        </span>
      )
    },
    {
      accessorKey: 'debit',
      header: `${t('Debit')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-bold text-sky-300">
          {row.original.debit > 0 ? `$${row.original.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
        </span>
      )
    },
    {
      accessorKey: 'credit',
      header: `${t('Credit')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-bold text-indigo-300">
          {row.original.credit > 0 ? `$${row.original.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
        </span>
      )
    },
    {
      accessorKey: 'runningBalance',
      header: `${t('Running Balance')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
          ${row.original.runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    }
  ], [locale]);

  return (
    <EnterpriseModuleShell
      title={t('General Ledger Drill-Down & Account Card')}
      description={t('Full double-entry transaction trail with cumulative running balance calculations per Chart of Accounts classification.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Accounting Engine') }, { label: t('General Ledger') }]}
      icon={<FolderOpen className="w-8 h-8 text-sky-400" />}
      recordCount={filteredRows.length}
      recordLabel={t('Postings')}
      activeFilterCount={0}
      onClearFilters={() => setQuery('')}
      headerActions={
        <div className="flex items-center gap-2">
          {/* Account Selector Dropdown */}
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
          >
            {coa.map(a => (
              <option key={a.accountCode} value={a.accountCode}>
                {a.accountCode} — {a.accountName} ({a.accountType})
              </option>
            ))}
          </select>
          <button
            onClick={() => financeService.exportToCSV(glRows, `GL_${selectedCode}_2026.csv`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t('Export GL CSV')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/accounting/chart" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('Chart of Accounts (16 GL)')}</span>
        </Link>
        <Link href="/finance/accounting/journals" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t('Manual Journal Entries')}</span>
        </Link>
        <Link href="/finance/accounting/ledger" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5" />
          <span>{t('General Ledger')}</span>
        </Link>
        <Link href="/finance/accounting/trial-balance" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('Trial Balance Equilibrium')}</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search ledger postings by journal voucher #, memo, or narrative...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success(t('General Ledger refreshed'));
        }}
        activeFilterCount={0}
        onResetFilters={() => setQuery('')}
      />

      <EnterpriseDataGrid
        data={filteredRows}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedRow(row)}
        onRowClick={(row) => setSelectedRow(row)}
        emptyStateProps={{
          title: `${t('No Transactions on Account')} ${selectedCode}`,
          description: `${t('No journal entries have been posted to')} ${currentAccount?.accountName || 'this account'}.`,
          isFilterActive: query.length > 0,
          onResetFilters: () => setQuery('')
        }}
      />

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow ? {
          name: selectedRow.journalNumber,
          id: selectedRow.id,
          role: `GL ACCOUNT: ${selectedRow.accountCode} - ${selectedRow.accountName}`,
          status: 'posted',
          email: `Posting Date: ${selectedRow.postingDate}`,
          phone: `Memo: ${selectedRow.memo}`,
          department: `Debit: $${selectedRow.debit.toFixed(2)} | Credit: $${selectedRow.credit.toFixed(2)}`,
          joinDate: selectedRow.postingDate,
          balance: `RUNNING BAL: $${selectedRow.runningBalance.toFixed(2)}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

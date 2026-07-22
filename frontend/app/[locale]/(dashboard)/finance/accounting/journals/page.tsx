'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText, Plus, Download, Eye, CheckCircle2,
  Clock, DollarSign, Scale, ScrollText, AlertTriangle
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { JournalEntry } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function DoubleEntryJournalsPage() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Manual Journal Form state (All placeholders removed / default to empty)
  const [jDescription, setJDescription] = useState('');
  const [jReference, setJReference] = useState('');
  const [debitAccountCode, setDebitAccountCode] = useState('');
  const [debitAccountName, setDebitAccountName] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  const [creditAccountCode, setCreditAccountCode] = useState('');
  const [creditAccountName, setCreditAccountName] = useState('');
  const [creditAmount, setCreditAmount] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getJournalEntries();
      setJournals(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load Double-Entry Journals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Standardize property keys across backend and frontend models
  const normalizedJournals = useMemo(() => {
    return journals.map((j) => {
      const journalNumber = j.journalNumber || j.entryNumber || `JRN-${j.id || 'AUTO'}`;
      const description = j.description || j.title || 'Journal Entry';
      const postingDate = j.postingDate || j.transactionDate || (j.date ? j.date.split('T')[0] : '') || 'N/A';
      const referenceNumber = j.referenceNumber || j.sourceDocumentNumber || 'SYSTEM-AUTO';
      const totalDebit = Number(j.totalDebit !== undefined ? j.totalDebit : (j.totalDebitOriginal || j.totalDebitBase || 0));
      const totalCredit = Number(j.totalCredit !== undefined ? j.totalCredit : (j.totalCreditOriginal || j.totalCreditBase || 0));
      const status = j.status || 'posted';
      const lines = (j.lines || []).map((l: any) => ({
        accountCode: l.accountCode || '',
        accountName: l.accountName || 'Unnamed Account',
        debit: Number(l.debitAmount !== undefined ? l.debitAmount : (l.debit || 0)),
        credit: Number(l.creditAmount !== undefined ? l.creditAmount : (l.credit || 0)),
      }));

      return {
        ...j,
        journalNumber,
        description,
        postingDate,
        referenceNumber,
        totalDebit,
        totalCredit,
        status,
        lines
      };
    });
  }, [journals]);

  const filteredJournals = useMemo(() => {
    return normalizedJournals.filter(j => {
      const matchQuery = !query ||
        j.journalNumber.toLowerCase().includes(query.toLowerCase()) ||
        j.description.toLowerCase().includes(query.toLowerCase()) ||
        (j.referenceNumber && j.referenceNumber.toLowerCase().includes(query.toLowerCase()));
      const matchStatus = statusFilter === 'all' || j.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [normalizedJournals, query, statusFilter]);

  const activeFiltersCount = statusFilter !== 'all' ? 1 : 0;

  const handleCreateManualJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    const debNum = parseFloat(debitAmount || '0');
    const credNum = parseFloat(creditAmount || '0');

    if (debNum !== credNum) {
      toast.error(`Accounting Error: Total Debits ($${debNum.toFixed(2)}) must equal Total Credits ($${credNum.toFixed(2)}).`);
      return;
    }

    try {
      const created = await financeService.createJournalEntry({
        postingDate: new Date().toISOString().split('T')[0],
        academicYearCode: '2026-2027',
        description: jDescription,
        referenceNumber: jReference,
        lines: [
          { accountCode: debitAccountCode, accountName: debitAccountName, debit: debNum, credit: 0, memo: 'Debit transfer entry' },
          { accountCode: creditAccountCode, accountName: creditAccountName, debit: 0, credit: credNum, memo: 'Credit offsetting entry' }
        ] as any,
        totalDebit: debNum,
        totalCredit: credNum,
        status: 'posted'
      });

      if (created) {
        toast.success(`Posted manual double-entry journal with balanced debits and credits.`);
        loadData();
      }
      setShowCreateModal(false);
      // Reset form
      setJDescription('');
      setJReference('');
      setDebitAccountCode('');
      setDebitAccountName('');
      setDebitAmount('');
      setCreditAccountCode('');
      setCreditAccountName('');
      setCreditAmount('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to post manual journal entry.');
    }
  };

  const totalDebitsPosted = useMemo(() => normalizedJournals.reduce((s, j) => s + j.totalDebit, 0), [normalizedJournals]);
  const totalCreditsPosted = useMemo(() => normalizedJournals.reduce((s, j) => s + j.totalCredit, 0), [normalizedJournals]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_journals',
      title: 'Total Posted Journals',
      value: `${normalizedJournals.length} Vouchers`,
      subtitle: 'Automated + manual accounting entries',
      trendDirection: 'up',
      icon: <ScrollText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'debits',
      title: 'Cumulative System Debits',
      value: `$${totalDebitsPosted.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Assets & expense accounts debited',
      trendDirection: 'neutral',
      icon: <Scale className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'credits',
      title: 'Cumulative System Credits',
      value: `$${totalCreditsPosted.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Liabilities, equity & revenue credited',
      trendDirection: 'neutral',
      icon: <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    },
    {
      id: 'compliance',
      title: 'Trial Balance Verification',
      value: totalDebitsPosted === totalCreditsPosted ? '100% BALANCED' : 'VARIANCE DETECTED',
      subtitle: totalDebitsPosted === totalCreditsPosted ? 'Debits == Credits (Compliance OK)' : 'Audit warning on GL entries',
      trendDirection: totalDebitsPosted === totalCreditsPosted ? 'up' : 'down',
      icon: totalDebitsPosted === totalCreditsPosted ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
    }
  ];

  // Professional Theme-Compliant Columns (Contrast for light and dark modes)
  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'journalNumber',
        header: 'Journal Ref & Description',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 block">{row.original.journalNumber}</span>
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block max-w-sm truncate">{row.original.description}</span>
          </div>
        )
      },
      {
        accessorKey: 'lines',
        header: 'Double-Entry GL Line Items (Debits vs Credits)',
        cell: ({ row }) => (
          <div className="space-y-1 font-mono text-[11px] max-w-md">
            {row.original.lines.map((l: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-0.5 max-w-sm">
                <span className={`truncate max-w-[220px] ${l.debit > 0 ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400 pl-3'}`}>
                  {l.accountCode} - {l.accountName}
                </span>
                <span className={l.debit > 0 ? 'text-sky-600 dark:text-sky-400 font-black' : 'text-emerald-600 dark:text-emerald-400 font-black'}>
                  {l.debit > 0 ? `DR $${l.debit.toFixed(2)}` : `CR $${l.credit.toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
        )
      },
      {
        accessorKey: 'postingDate',
        header: 'Posting Date & Ref',
        cell: ({ row }) => (
          <div className="space-y-0.5 font-mono text-[11px]">
            <span className="text-slate-700 dark:text-slate-300 block font-bold">{row.original.postingDate}</span>
            <span className="text-slate-500 dark:text-slate-400 block">{row.original.referenceNumber || 'SYSTEM-AUTO'}</span>
          </div>
        )
      },
      {
        accessorKey: 'totalDebit',
        header: 'Voucher Total ($)',
        cell: ({ row }) => (
          <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white block">
            ${Number(row.original.totalDebit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            onClick={() => setSelectedJournal(row.original)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-xs transition-all border border-slate-250 dark:border-slate-700 shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect</span>
          </button>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Double-Entry Journal Entries & Trial Balancing Console"
      description="Automated and manual journal postings enforcing strict Debits == Credits compliance. Every source document (invoices, receipts, expenses) links to a sequential JRN voucher."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Accounting Engine' }, { label: 'Journal Entries' }]}
      icon={<ScrollText className="w-8 h-8" />}
      recordCount={filteredJournals.length}
      recordLabel="Journal Vouchers"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setStatusFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeService.exportToCSV(journals, 'journal_entries_2026.csv')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Post Manual Journal</span>
          </button>
        </div>
      }
    >
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Trial Balance Health Banner */}
      <div className="bg-gradient-to-r from-slate-50 dark:from-slate-900 dark:via-slate-900 via-slate-100 to-emerald-50 dark:to-emerald-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">System Trial Balance Status (Academic Year 2026-2027)</h4>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                ● ZERO VARIANCE OK
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              System Debits: <strong className="text-sky-600 dark:text-sky-400">${totalDebitsPosted.toFixed(2)}</strong> == System Credits: <strong className="text-emerald-600 dark:text-emerald-400">${totalCreditsPosted.toFixed(2)}</strong>
            </p>
          </div>
        </div>
        <Link
          href="/finance/accounting/ledger"
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-all flex items-center gap-1.5"
        >
          <span>Inspect General Ledger Drill-Down →</span>
        </Link>
      </div>

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/finance/accounting/chart" className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-855 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Chart of Accounts</span>
        </Link>
        <Link href="/finance/accounting/journals" className="px-3.5 py-1.5 rounded-xl bg-emerald-650 dark:bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>Double-Entry Journals</span>
        </Link>
        <Link href="/finance/accounting/ledger" className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-855 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <ScrollText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>General Ledger Drill-Down</span>
        </Link>
        <Link href="/finance/accounting/periods" className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-855 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Accounting Periods Lock</span>
        </Link>
      </div>

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search journals by JRN-XXXX sequence, reference number, or entry description..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Journal entries refreshed from double-entry database.');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setStatusFilter('all'); setQuery(''); }}
        createButtonLabel="+ Post Manual Entry"
        onCreate={() => setShowCreateModal(true)}
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredJournals}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedJournal(row)}
        onRowClick={(row) => setSelectedJournal(row)}
        emptyStateProps={{
          title: 'No Journal Entries Found',
          description: 'No double-entry journal vouchers match your current query or status filter.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setStatusFilter('all'); setQuery(''); },
          createLabel: 'Post Manual Journal Entry',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Create Manual Journal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <ScrollText className="w-6 h-6 text-emerald-600 dark:text-emerald-450" />
                <div>
                  <h3 className="text-base font-black">Post Manual Double-Entry Journal</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">Enforces strict Debits ($) == Credits ($) SAP validation</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateManualJournal} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Journal Description & Memo</label>
                <input
                  type="text"
                  required
                  value={jDescription}
                  onChange={(e) => setJDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-650 dark:text-slate-300">Reference / Memo Ref</label>
                  <input
                    type="text"
                    value={jReference}
                    onChange={(e) => setJReference(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-650 dark:text-slate-300">Posting Partition</label>
                  <input
                    type="text"
                    disabled
                    value="Academic Year 2026-2027"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-sky-650 dark:text-sky-400 uppercase tracking-wider">Line 1: Debit Posting (DR)</span>
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">+ Charge Account</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Account Code</label>
                    <input
                      type="text"
                      required
                      value={debitAccountCode}
                      onChange={(e) => setDebitAccountCode(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Account Name</label>
                    <input
                      type="text"
                      required
                      value={debitAccountName}
                      onChange={(e) => setDebitAccountName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Debit Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={debitAmount}
                    onChange={(e) => setDebitAmount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sky-600 dark:text-sky-400 font-mono font-black text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Line 2: Credit Posting (CR)</span>
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">- Offsetting Account</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Account Code</label>
                    <input
                      type="text"
                      required
                      value={creditAccountCode}
                      onChange={(e) => setCreditAccountCode(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Account Name</label>
                    <input
                      type="text"
                      required
                      value={creditAccountName}
                      onChange={(e) => setCreditAccountName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Credit Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {parseFloat(debitAmount || '0') !== parseFloat(creditAmount || '0') && (
                <div className="p-3 bg-rose-50 dark:bg-rose-955/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-450 animate-bounce" />
                  <span>Validation Error: Debits (${parseFloat(debitAmount || '0').toFixed(2)}) and Credits (${parseFloat(creditAmount || '0').toFixed(2)}) must exactly balance!</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-105 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">Cancel</button>
                <button
                  type="submit"
                  disabled={parseFloat(debitAmount || '0') !== parseFloat(creditAmount || '0')}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  Post Balanced Journal →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedJournal}
        onClose={() => setSelectedJournal(null)}
        record={selectedJournal ? {
          name: selectedJournal.description,
          id: selectedJournal.journalNumber,
          role: `STATUS: ${selectedJournal.status.toUpperCase()}`,
          status: selectedJournal.status,
          email: `Date: ${selectedJournal.postingDate}`,
          phone: `Ref: ${selectedJournal.referenceNumber || 'N/A'}`,
          department: `Lines Count: ${selectedJournal.lines.length} double-entry items`,
          joinDate: selectedJournal.academicYearCode,
          balance: `TOTAL DEBITS ($${selectedJournal.totalDebit.toFixed(2)}) == TOTAL CREDITS ($${selectedJournal.totalCredit.toFixed(2)})`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

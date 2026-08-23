'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  FileText, Plus, Download, Eye, CheckCircle2, X,
  Clock, Scale, ScrollText, AlertTriangle, ChevronDown,
  Trash2, RefreshCw, BookOpen, Hash, Calendar
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { JournalEntry, ChartOfAccount, AccountingPeriod } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: string;   // string for controlled input, parsed on submit
  credit: string;
  memo: string;
}

const emptyLine = (): JournalLine => ({
  id: crypto.randomUUID(),
  accountCode: '',
  accountName: '',
  debit: '',
  credit: '',
  memo: '',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ─── Account Picker ───────────────────────────────────────────────────────────

function AccountPicker({
  value, onChange, accounts, placeholder = 'Search account...',
}: {
  value: string;
  onChange: (code: string, name: string) => void;
  accounts: ChartOfAccount[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const selected = accounts.find(a => a.accountCode === value);
  const filtered = useMemo(() =>
    accounts.filter(a =>
      !q || a.accountCode.includes(q) || a.accountName.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 30),
    [accounts, q]
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-left text-xs font-mono hover:border-emerald-500 focus:outline-none focus:border-emerald-500 transition-colors"
      >
        {selected
          ? <span className="text-slate-900 dark:text-white font-bold truncate">{selected.accountCode} — {selected.accountName}</span>
          : <span className="text-slate-400">{placeholder}</span>
        }
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <input
              autoFocus
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Filter accounts..."
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-4">No accounts found</p>
            )}
            {filtered.map(a => (
              <button
                key={a.accountCode}
                type="button"
                onClick={() => { onChange(a.accountCode, a.accountName); setOpen(false); setQ(''); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              >
                <span className="font-mono font-black text-[10px] text-emerald-600 dark:text-emerald-400 w-10 shrink-0">{a.accountCode}</span>
                <span className="text-xs text-slate-800 dark:text-white truncate">{a.accountName}</span>
                <span className="ml-auto text-[10px] text-slate-400 shrink-0">{a.accountType}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Journal Detail Panel ──────────────────────────────────────────────────────

function JournalDetailPanel({
  journal,
  onClose,
}: {
  journal: any;
  onClose: () => void;
}) {
  const isBalanced = Math.abs(journal.totalDebit - journal.totalCredit) < 0.01;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <ScrollText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 block">{journal.journalNumber}</span>
              <h3 className="font-black text-slate-900 dark:text-white text-sm truncate max-w-xs">{journal.description}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meta strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100 dark:bg-slate-800 shrink-0">
          {[
            { label: 'Posting Date', value: journal.postingDate || '—' },
            { label: 'Reference', value: journal.referenceNumber || 'SYSTEM-AUTO' },
            { label: 'Period', value: journal.academicYearCode || '—' },
            { label: 'Status', value: journal.status?.toUpperCase() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white dark:bg-slate-900 p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5 font-mono">{value}</p>
            </div>
          ))}
        </div>

        {/* GL Lines */}
        <div className="overflow-y-auto flex-1 p-5 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Double-Entry GL Lines</h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${isBalanced ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700'}`}>
              {isBalanced ? '✓ BALANCED' : '⚠ VARIANCE'}
            </span>
          </div>

          {/* Lines table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="text-left px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Account</th>
                  <th className="text-left px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Memo</th>
                  <th className="text-right px-3 py-2 font-bold text-sky-600 dark:text-sky-400">DR ($)</th>
                  <th className="text-right px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400">CR ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(journal.lines || []).map((l: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-3 py-2">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{l.accountCode}</span>
                      <span className="text-slate-600 dark:text-slate-300 ml-1.5">{l.accountName}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 italic">{l.memo || '—'}</td>
                    <td className="px-3 py-2 text-right font-mono font-black text-sky-600 dark:text-sky-400">
                      {l.debit > 0 ? fmt(l.debit) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {l.credit > 0 ? fmt(l.credit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/60 border-t-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={2} className="px-3 py-2 font-black text-slate-700 dark:text-slate-200">TOTALS</td>
                  <td className="px-3 py-2 text-right font-mono font-black text-sky-600 dark:text-sky-400">{fmt(journal.totalDebit)}</td>
                  <td className="px-3 py-2 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">{fmt(journal.totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Journal Modal ──────────────────────────────────────────────────────

function CreateJournalModal({
  accounts,
  periods,
  onClose,
  onSaved,
}: {
  accounts: ChartOfAccount[];
  periods: AccountingPeriod[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [postingDate, setPostingDate] = useState(todayISO());
  const [periodId, setPeriodId] = useState(periods[0]?.id || '');
  const [lines, setLines] = useState<JournalLine[]>([emptyLine(), emptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  // The selected period label for display
  const selectedPeriod = periods.find(p => String(p.id) === String(periodId));

  const totalDebit  = lines.reduce((s, l) => s + (parseFloat(l.debit)  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01;
  const hasLines    = lines.some(l => l.accountCode && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0));

  const updateLine = (id: string, field: keyof JournalLine, val: string) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: val } : l));
  };

  const updateLineAccount = (id: string, code: string, name: string) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, accountCode: code, accountName: name } : l));
  };

  const addLine = () => setLines(prev => [...prev, emptyLine()]);
  const removeLine = (id: string) => {
    if (lines.length <= 2) { toast.error('A journal entry requires at least 2 lines.'); return; }
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) { toast.error('Description is required.'); return; }
    if (!hasLines) { toast.error('Add at least one debit and one credit line.'); return; }
    if (!isBalanced) {
      toast.error(`Debits (\$${fmt(totalDebit)}) must equal Credits (\$${fmt(totalCredit)}).`);
      return;
    }

    const validLines = lines.filter(l => l.accountCode && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0));

    setSubmitting(true);
    try {
      await financeService.postManualJournalEntry({
        journalNumber: `JRN-MAN-${Date.now()}`,
        transactionDate: postingDate,
        date: postingDate,
        title: description,
        description,
        sourceDocumentNumber: reference || undefined,
        sourceModule: 'manual_journal',
        academicYearCode: selectedPeriod?.periodNumber || periodId || '2026-2027',
        totalDebit,
        totalCredit,
        status: 'posted',
        lines: validLines.map(l => ({
          accountCode: l.accountCode,
          accountName: l.accountName,
          debitAmount: parseFloat(l.debit)  || 0,
          creditAmount: parseFloat(l.credit) || 0,
          debit: parseFloat(l.debit)  || 0,
          credit: parseFloat(l.credit) || 0,
          memo: l.memo || description,
        })),
      });
      toast.success('Manual journal entry posted successfully.');
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to post manual journal entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <ScrollText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">Post Manual Journal Entry</h3>
              <p className="text-[11px] text-slate-400 font-mono">Debits must equal Credits (double-entry rule)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">

            {/* Row 1: Description + Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Description / Memo <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g. Tuition fee revenue recognition Q1"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Source Reference</label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="INV-2026-XXXX / RCP-XXXX"
                />
              </div>
            </div>

            {/* Row 2: Date + Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Posting Date
                </label>
                <input
                  type="date"
                  value={postingDate}
                  onChange={e => setPostingDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Accounting Period
                </label>
                {periods.length > 0 ? (
                  <select
                    value={periodId}
                    onChange={e => setPeriodId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {periods.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.periodNumber || p.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value="General Ledger Period"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-mono"
                  />
                )}
              </div>
            </div>

            {/* GL Lines */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Journal Lines (DR / CR)
                </label>
                <button
                  type="button"
                  onClick={addLine}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 text-[11px] font-bold transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <Plus className="w-3 h-3" /> Add Line
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_1fr_80px_80px_24px] gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <span>Account</span>
                  <span>Memo</span>
                  <span className="text-sky-600 dark:text-sky-400 text-right">Debit ($)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-right">Credit ($)</span>
                  <span />
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lines.map((line, idx) => (
                    <div key={line.id} className="grid grid-cols-[1fr_1fr_80px_80px_24px] gap-2 px-3 py-2 items-center">
                      {/* Account picker */}
                      <AccountPicker
                        value={line.accountCode}
                        onChange={(code, name) => updateLineAccount(line.id, code, name)}
                        accounts={accounts}
                        placeholder={`Line ${idx + 1} account…`}
                      />
                      {/* Memo */}
                      <input
                        type="text"
                        value={line.memo}
                        onChange={e => updateLine(line.id, 'memo', e.target.value)}
                        placeholder="memo…"
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      {/* Debit */}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit}
                        onChange={e => {
                          updateLine(line.id, 'debit', e.target.value);
                          if (e.target.value) updateLine(line.id, 'credit', '');
                        }}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-mono font-black text-xs text-right focus:outline-none focus:border-sky-500 transition-colors"
                      />
                      {/* Credit */}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit}
                        onChange={e => {
                          updateLine(line.id, 'credit', e.target.value);
                          if (e.target.value) updateLine(line.id, 'debit', '');
                        }}
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono font-black text-xs text-right focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="p-1 rounded text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totals row */}
                <div className="grid grid-cols-[1fr_1fr_80px_80px_24px] gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t-2 border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 col-span-2">TOTALS</span>
                  <span className={`text-right font-mono font-black text-sm ${isBalanced ? 'text-sky-600 dark:text-sky-400' : 'text-rose-500'}`}>
                    {fmt(totalDebit)}
                  </span>
                  <span className={`text-right font-mono font-black text-sm ${isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {fmt(totalCredit)}
                  </span>
                  <span />
                </div>
              </div>

              {/* Balance validation banner */}
              {totalDebit > 0 && totalCredit > 0 && !isBalanced && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                  Variance: Debits (${fmt(totalDebit)}) ≠ Credits (${fmt(totalCredit)}) — difference: ${fmt(Math.abs(totalDebit - totalCredit))}
                </div>
              )}
              {isBalanced && totalDebit > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Trial balance check passed — Debits == Credits == ${fmt(totalDebit)}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isBalanced || !hasLines}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Post Journal Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DoubleEntryJournalsPage() {
  const [journals, setJournals]       = useState<JournalEntry[]>([]);
  const [accounts, setAccounts]       = useState<ChartOfAccount[]>([]);
  const [periods, setPeriods]         = useState<AccountingPeriod[]>([]);
  const [loading, setLoading]         = useState(true);
  const [query, setQuery]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [density, setDensity]         = useState<TableDensity>('cozy');
  const [selectedJournal, setSelectedJournal] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [jData, coaData, periodData] = await Promise.all([
        financeService.getJournalEntries(),
        financeService.getChartOfAccounts(),
        financeService.getAccountingPeriods(),
      ]);
      setJournals(jData || []);
      setAccounts(coaData || []);
      setPeriods(periodData || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load journal entries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Normalise field aliases across different Strapi schema versions
  const normalizedJournals = useMemo(() => {
    return journals.map((j: any) => {
      const journalNumber   = j.journalNumber || j.entryNumber || `JRN-${j.id || 'AUTO'}`;
      const description     = j.description   || j.title       || 'Journal Entry';
      const postingDate     = j.postingDate    || j.transactionDate || (j.date ? String(j.date).split('T')[0] : '') || '—';
      const referenceNumber = j.referenceNumber || j.sourceDocumentNumber || '—';
      const sourceModule    = j.sourceModule   || 'manual_journal';
      const totalDebit      = Number(j.totalDebit  ?? j.totalDebitOriginal  ?? j.totalDebitBase  ?? 0);
      const totalCredit     = Number(j.totalCredit ?? j.totalCreditOriginal ?? j.totalCreditBase ?? 0);
      const status          = j.status || 'posted';
      const lines           = (j.lines || []).map((l: any) => ({
        id:          l.id || '',
        accountCode: l.accountCode  || '',
        accountName: l.accountName  || 'Unnamed Account',
        debit:       Number(l.debitAmount  ?? l.debit  ?? 0),
        credit:      Number(l.creditAmount ?? l.credit ?? 0),
        memo:        l.memo || '',
      }));

      return { ...j, journalNumber, description, postingDate, referenceNumber, sourceModule, totalDebit, totalCredit, status, lines };
    });
  }, [journals]);

  const filteredJournals = useMemo(() => {
    return normalizedJournals.filter(j => {
      const q2     = query.toLowerCase();
      const matchQ = !query ||
        j.journalNumber.toLowerCase().includes(q2) ||
        j.description.toLowerCase().includes(q2) ||
        j.referenceNumber.toLowerCase().includes(q2);
      const matchStatus = statusFilter === 'all' || j.status === statusFilter;
      const matchModule = moduleFilter === 'all' || j.sourceModule === moduleFilter;
      const matchFrom   = !dateFrom || j.postingDate >= dateFrom;
      const matchTo     = !dateTo   || j.postingDate <= dateTo;
      return matchQ && matchStatus && matchModule && matchFrom && matchTo;
    });
  }, [normalizedJournals, query, statusFilter, moduleFilter, dateFrom, dateTo]);

  const activeFiltersCount = [
    statusFilter !== 'all',
    moduleFilter !== 'all',
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  // KPI aggregates
  const totalDebitsPosted  = useMemo(() => normalizedJournals.reduce((s, j) => s + j.totalDebit,  0), [normalizedJournals]);
  const totalCreditsPosted = useMemo(() => normalizedJournals.reduce((s, j) => s + j.totalCredit, 0), [normalizedJournals]);
  const postedCount        = normalizedJournals.filter(j => j.status === 'posted').length;
  const draftCount         = normalizedJournals.filter(j => j.status === 'draft').length;
  const isTrialBalanced    = Math.abs(totalDebitsPosted - totalCreditsPosted) < 0.01;

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_journals',
      title: 'Total Journal Vouchers',
      value: `${normalizedJournals.length}`,
      subtitle: `${postedCount} posted · ${draftCount} draft`,
      trendDirection: 'up',
      icon: <ScrollText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      id: 'debits',
      title: 'Cumulative Debits',
      value: `$${fmt(totalDebitsPosted)}`,
      subtitle: 'Assets & expense accounts debited',
      trendDirection: 'neutral',
      icon: <Scale className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
    },
    {
      id: 'credits',
      title: 'Cumulative Credits',
      value: `$${fmt(totalCreditsPosted)}`,
      subtitle: 'Liabilities, equity & revenue credited',
      trendDirection: 'neutral',
      icon: <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    },
    {
      id: 'compliance',
      title: 'Trial Balance Status',
      value: isTrialBalanced ? 'BALANCED' : 'VARIANCE',
      subtitle: isTrialBalanced
        ? `Variance: $0.00 — Audit OK`
        : `Variance: $${fmt(Math.abs(totalDebitsPosted - totalCreditsPosted))}`,
      trendDirection: isTrialBalanced ? 'up' : 'down',
      icon: isTrialBalanced
        ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        : <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />,
    },
  ];

  const columns = useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorKey: 'journalNumber',
      header: 'Journal / Description',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-mono text-[11px] font-black text-emerald-600 dark:text-emerald-400 block">{row.original.journalNumber}</span>
          <span className="font-bold text-slate-900 dark:text-white text-xs block max-w-xs truncate">{row.original.description}</span>
          <span className="text-[10px] text-slate-400 font-mono block">{row.original.referenceNumber !== '—' ? row.original.referenceNumber : ''}</span>
        </div>
      ),
    },
    {
      accessorKey: 'sourceModule',
      header: 'Source',
      cell: ({ row }) => {
        const m: Record<string, { label: string; color: string }> = {
          student_billing: { label: 'Billing',   color: 'bg-blue-100   text-blue-700   dark:bg-blue-950/40   dark:text-blue-300'   },
          payroll:         { label: 'Payroll',   color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
          expenses:        { label: 'Expenses',  color: 'bg-amber-100  text-amber-700  dark:bg-amber-950/40  dark:text-amber-300'  },
          donations:       { label: 'Donations', color: 'bg-pink-100   text-pink-700   dark:bg-pink-950/40   dark:text-pink-300'   },
          manual_journal:  { label: 'Manual',    color: 'bg-slate-100  text-slate-700  dark:bg-slate-800     dark:text-slate-300'  },
          closing_entry:   { label: 'Closing',   color: 'bg-rose-100   text-rose-700   dark:bg-rose-950/40   dark:text-rose-300'   },
        };
        const cfg = m[row.original.sourceModule] || { label: row.original.sourceModule, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' };
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
        );
      },
    },
    {
      accessorKey: 'lines',
      header: 'GL Lines (DR / CR)',
      cell: ({ row }) => (
        <div className="space-y-0.5 font-mono text-[10px] max-w-xs">
          {(row.original.lines || []).slice(0, 4).map((l: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className={`truncate ${l.debit > 0 ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-400 pl-2'}`}>
                {l.accountCode} {l.accountName}
              </span>
              <span className={`shrink-0 font-black ${l.debit > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {l.debit > 0 ? `DR ${fmt(l.debit)}` : `CR ${fmt(l.credit)}`}
              </span>
            </div>
          ))}
          {(row.original.lines || []).length > 4 && (
            <span className="text-slate-400 italic">+{row.original.lines.length - 4} more lines…</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'postingDate',
      header: 'Date',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
          {row.original.postingDate}
        </span>
      ),
    },
    {
      accessorKey: 'totalDebit',
      header: 'Amount ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">
          ${fmt(Number(row.original.totalDebit || 0))}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedJournal(row.original)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-all border border-slate-200 dark:border-slate-700 cursor-pointer whitespace-nowrap"
        >
          <Eye className="w-3 h-3" /> Inspect
        </button>
      ),
    },
  ], []);

  const clearFilters = () => { setStatusFilter('all'); setModuleFilter('all'); setDateFrom(''); setDateTo(''); setQuery(''); };

  return (
    <EnterpriseModuleShell
      title="Double-Entry Journal Entries"
      description="Automated and manual journal postings enforcing strict Debits = Credits compliance. Every source document links to a sequential JRN voucher."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Accounting Engine' }, { label: 'Journal Entries' }]}
      icon={<ScrollText className="w-8 h-8" />}
      recordCount={filteredJournals.length}
      recordLabel="Journal Vouchers"
      activeFilterCount={activeFiltersCount}
      onClearFilters={clearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeService.exportToCSV(journals, `journal_entries_${todayISO()}.csv`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Post Manual Entry
          </button>
        </div>
      }
    >
      {/* KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Trial Balance Banner */}
      <div className={`rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${
        isTrialBalanced
          ? 'bg-gradient-to-r from-slate-50 via-slate-50 to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 border-slate-200 dark:border-slate-800'
          : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isTrialBalanced ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-rose-100 dark:bg-rose-950/50'}`}>
            <Scale className={`w-5 h-5 ${isTrialBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">System Trial Balance</h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                isTrialBalanced
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                  : 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700'
              }`}>
                {isTrialBalanced ? '● ZERO VARIANCE' : '⚠ VARIANCE DETECTED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              Debits: <strong className="text-sky-600 dark:text-sky-400">${fmt(totalDebitsPosted)}</strong>
              {' '}— Credits: <strong className="text-emerald-600 dark:text-emerald-400">${fmt(totalCreditsPosted)}</strong>
              {!isTrialBalanced && <strong className="text-rose-500 ml-2">| Δ ${fmt(Math.abs(totalDebitsPosted - totalCreditsPosted))}</strong>}
            </p>
          </div>
        </div>
        <Link
          href="/finance/accounting/ledger"
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-all flex items-center gap-1.5 shrink-0"
        >
          Open General Ledger →
        </Link>
      </div>

      {/* Accounting sub-navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { href: '/finance/accounting/chart',   label: 'Chart of Accounts',       icon: <BookOpen className="w-3.5 h-3.5" />,    active: false },
          { href: '/finance/accounting/journals', label: 'Journal Entries',          icon: <FileText className="w-3.5 h-3.5" />,    active: true  },
          { href: '/finance/accounting/ledger',   label: 'General Ledger',           icon: <ScrollText className="w-3.5 h-3.5" />,  active: false },
          { href: '/finance/accounting/periods',  label: 'Accounting Periods',       icon: <Clock className="w-3.5 h-3.5" />,       active: false },
          { href: '/finance/accounting/trial-balance', label: 'Trial Balance',       icon: <Scale className="w-3.5 h-3.5" />,       active: false },
        ].map(({ href, label, icon, active }) => (
          <Link
            key={href}
            href={href}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              active
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {icon}{label}
          </Link>
        ))}
      </div>

      {/* Advanced filters row */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="posted">Posted</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Source</label>
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Sources</option>
            <option value="student_billing">Student Billing</option>
            <option value="payroll">Payroll</option>
            <option value="expenses">Expenses</option>
            <option value="donations">Donations</option>
            <option value="manual_journal">Manual Entry</option>
            <option value="closing_entry">Closing Entry</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
        {activeFiltersCount > 0 && (
          <button onClick={clearFilters} className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-100 transition-colors">
            Clear filters ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search by JRN-XXXX reference, description, or source document…"
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Journal entries refreshed.'); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={clearFilters}
        createButtonLabel="+ Post Manual Entry"
        onCreate={() => setShowCreateModal(true)}
      />

      {/* Data Grid */}
      <EnterpriseDataGrid
        data={filteredJournals}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={setSelectedJournal}
        onRowClick={setSelectedJournal}
        emptyStateProps={{
          title: 'No Journal Entries Found',
          description: 'No double-entry journal vouchers match your current filters.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: clearFilters,
          createLabel: 'Post Manual Journal Entry',
          onCreate: () => setShowCreateModal(true),
        }}
      />

      {/* Journal Detail Panel */}
      {selectedJournal && (
        <JournalDetailPanel
          journal={selectedJournal}
          onClose={() => setSelectedJournal(null)}
        />
      )}

      {/* Create Journal Modal */}
      {showCreateModal && (
        <CreateJournalModal
          accounts={accounts}
          periods={periods}
          onClose={() => setShowCreateModal(false)}
          onSaved={loadData}
        />
      )}
    </EnterpriseModuleShell>
  );
}

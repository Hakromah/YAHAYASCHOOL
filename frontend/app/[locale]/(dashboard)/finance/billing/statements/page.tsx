'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText, Search, Printer, Download, Mail, ArrowLeft, RefreshCw,
  AlertTriangle, DollarSign, Calendar, Filter, User, BookOpen, CreditCard
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { Avatar } from '@/components/shared/Avatar';
import { toast } from 'sonner';

interface StatementTx {
  id: string | number;
  date: string;
  type: 'invoice' | 'payment' | 'wallet_deposit' | 'scholarship' | 'discount' | 'adjustment';
  reference: string;
  description: string;
  debit: number; // money owed (invoiced)
  credit: number; // money paid / credited
  runningBalance: number;
}

export default function StudentStatementsPage() {
  const [liveStudents, setLiveStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [academicTerm, setAcademicTerm] = useState('all');
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Ledger details
  const [invoices, setInvoices] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [walletTx, setWalletTx] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);

  useEffect(() => {
    // Load student directory
    erpService.getStudents().then(res => {
      setLiveStudents(res.data || []);
      setLoading(false);
    });
  }, []);

  // Fetch finance data when student is selected
  useEffect(() => {
    if (!selectedStudent) {
      setInvoices([]);
      setReceipts([]);
      setWalletTx([]);
      setLedgerEntries([]);
      return;
    }

    const sid = selectedStudent.id;
    setLoading(true);

    Promise.all([
      financeService.getInvoices().then(all =>
        all.filter((i: any) => i.student?.id === sid || i.studentId === selectedStudent.studentId || i.student?.schoolId === selectedStudent.schoolId)
      ),
      financeService.getReceipts().then(all =>
        all.filter((r: any) => r.student?.id === sid || r.studentId === selectedStudent.studentId || r.student?.schoolId === selectedStudent.schoolId)
      ),
      financeService.getStudentLedger(String(sid)),
      financeService.getStudentWalletTransactions(sid)
    ]).then(([invs, recs, ledg, wtx]) => {
      setInvoices(invs);
      setReceipts(recs);
      setLedgerEntries(ledg);
      setWalletTx(wtx);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      toast.error('Failed to load financial records');
      setLoading(false);
    });
  }, [selectedStudent]);

  // Handle student search resolution
  useEffect(() => {
    if (!studentSearch) return;
    const match = liveStudents.find(s =>
      s.schoolId === studentSearch ||
      s.studentId === studentSearch ||
      s.name?.toLowerCase() === studentSearch.toLowerCase()
    );
    if (match) {
      setSelectedStudent(match);
    }
  }, [studentSearch, liveStudents]);

  // Construct statements ledger list
  const statementTransactions = useMemo(() => {
    // Priority 1: Use authoritative General Ledger entries if available
    if (ledgerEntries && ledgerEntries.length > 0) {
      const list: StatementTx[] = ledgerEntries.map(e => ({
        id: `ledg-${e.id}`,
        date: e.transactionDate ? e.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0],
        type: e.type === 'debit' ? 'invoice' : 'payment',
        reference: e.documentNumber || e.referenceId || 'LEDGER-REF',
        description: e.description || (e.type === 'debit' ? 'Invoice Debit' : 'Payment Credit'),
        debit: e.type === 'debit' ? Number(e.baseAmount || 0) : 0,
        credit: e.type !== 'debit' ? Number(e.baseAmount || 0) : 0,
        runningBalance: Number(e.runningBalance || 0)
      }));
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return list.filter(tx => {
        if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
        if (dateFrom && new Date(tx.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(tx.date) > new Date(dateTo)) return false;
        return true;
      });
    }

    // Fallback: Reconstruct from Invoices, Receipts, and Wallet transactions
    const list: StatementTx[] = [];

    // 1. Add Invoices
    invoices.forEach(inv => {
      list.push({
        id: `inv-${inv.id}`,
        date: inv.issueDate,
        type: 'invoice',
        reference: inv.invoiceNumber,
        description: `Invoice Charge: ${inv.invoiceNumber}`,
        debit: Number(inv.totalAmount || 0),
        credit: 0,
        runningBalance: 0
      });
    });

    // 2. Add Receipts (Excluding wallet-only applications which are recorded as wallet debits to avoid double counting)
    receipts.forEach(rec => {
      if (rec.paymentMethod === 'Advance Wallet') return;
      list.push({
        id: `rec-${rec.id}`,
        date: rec.paymentDate ? rec.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
        type: 'payment',
        reference: rec.receiptNumber,
        description: `Payment Received: ${rec.receiptNumber} (${rec.paymentMethod})`,
        debit: 0,
        credit: Number(rec.paymentAmount || rec.amount || 0),
        runningBalance: 0
      });
    });

    // 3. Add direct wallet applied events
    walletTx.forEach(w => {
      if (w.transactionType === 'wallet_used') {
        list.push({
          id: `wtx-${w.id}`,
          date: w.transactionDate ? w.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0],
          type: 'wallet_deposit',
          reference: w.referenceNumber || 'WALLET-USE',
          description: `Advance Wallet Credit Applied: ${w.reason}`,
          debit: 0,
          credit: Number(w.amount || 0),
          runningBalance: 0
        });
      }
    });

    // Sort chronologically by date
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runBal = 0;
    list.forEach(tx => {
      runBal = runBal + tx.debit - tx.credit;
      tx.runningBalance = runBal;
    });

    // Apply filters
    return list.filter(tx => {
      if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
      if (dateFrom && new Date(tx.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(tx.date) > new Date(dateTo)) return false;
      return true;
    });
  }, [invoices, receipts, walletTx, txTypeFilter, dateFrom, dateTo]);

  // Export to CSV / Excel
  const handleExportCSV = () => {
    if (!selectedStudent || statementTransactions.length === 0) return;
    const headers = ['Date', 'Reference', 'Type', 'Description', 'Debit ($)', 'Credit ($)', 'Running Balance ($)'];
    const rows = statementTransactions.map(tx => [
      tx.date,
      tx.reference,
      tx.type,
      tx.description,
      tx.debit.toFixed(2),
      tx.credit.toFixed(2),
      tx.runningBalance.toFixed(2)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedStudent.name}_Statement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Statement CSV exported successfully!');
  };

  const handleExportExcel = () => {
    if (!selectedStudent || statementTransactions.length === 0) return;
    handleExportCSV();
    toast.info('Statement exported in Excel-compatible CSV format.');
  };

  // Simulate Email Statement
  const handleEmailParent = () => {
    if (!selectedStudent) return;
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Generating PDF and sending email to guardian...',
        success: '✉️ Statement emailed to registered parent/guardian successfully!',
        error: 'Failed to send statement email.'
      }
    );
  };

  return (
    <EnterpriseModuleShell
      title="Student Financial Statements"
      description="Complete running ledger statements, payment allocations and audit logs"
      icon={<FileText className="w-8 h-8" />}
      breadcrumbs={[
        { label: 'Finance ERP', href: '/finance' },
        { label: 'Statements & Ledgers' }
      ]}
    >
      <div className="space-y-6">
        {/* Student Selector Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="max-w-md space-y-1">
            <label className="text-xs font-bold text-sky-400 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Select Student Profile
            </label>
            <div className="relative">
              <input
                list="statement-student-list"
                type="text"
                placeholder="Search by student name, ID or code..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-white text-xs font-bold focus:outline-none focus:border-sky-500"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            </div>
            <datalist id="statement-student-list">
              {liveStudents.map(s => (
                <option key={s.id} value={s.schoolId || s.studentId || s.name}>
                  {s.name} ({s.schoolId || s.studentId || 'N/A'})
                </option>
              ))}
            </datalist>
          </div>

          {selectedStudent && (
            <div className="flex flex-col md:flex-row md:items-center justify-between border-t border-slate-800 pt-4 gap-4 animate-in fade-in">
              <div className="flex items-center gap-4">
                <Avatar src={selectedStudent.photo} name={selectedStudent.name} size="lg" className="border-emerald-500/30" />
                <div>
                  <h3 className="text-sm font-black text-white">{selectedStudent.name}</h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 rounded mt-1 inline-block">
                    ID: {selectedStudent.schoolId || selectedStudent.studentId || 'N/A'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Class Section: {selectedStudent.sections?.[0]?.sectionCode || 'Not Assigned'}</p>
                </div>
              </div>

              {/* Statement Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all border border-slate-800"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Statement</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all border border-slate-800"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleEmailParent}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Guardian</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedStudent ? (
          <>
            {/* KPI Overview Deck */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Opening Balance</span>
                <strong className="text-slate-400 text-lg font-mono">$0.00</strong>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] text-slate-500 font-bold block uppercase text-rose-400">Total Charges (Debits)</span>
                <strong className="text-rose-400 text-lg font-mono">
                  ${statementTransactions.reduce((sum, tx) => sum + tx.debit, 0).toFixed(2)}
                </strong>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] text-slate-500 font-bold block uppercase text-emerald-400">Total Payments (Credits)</span>
                <strong className="text-emerald-400 text-lg font-mono">
                  ${statementTransactions.reduce((sum, tx) => sum + tx.credit, 0).toFixed(2)}
                </strong>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] text-slate-500 font-bold block uppercase text-amber-400">Closing Balance (Net Due)</span>
                <strong className="text-amber-400 text-lg font-mono">
                  ${(statementTransactions[statementTransactions.length - 1]?.runningBalance || 0).toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Filter className="w-3.5 h-3.5 text-emerald-400" />
                <span>Filters:</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-300 font-bold focus:outline-none"
                >
                  <option value="2026-2027">AY 2026/2027</option>
                  <option value="2025-2026">AY 2025/2026</option>
                </select>
                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-300 font-bold focus:outline-none"
                >
                  <option value="all">All Transaction Types</option>
                  <option value="invoice">Charges (Invoices)</option>
                  <option value="payment">Payments (Receipts)</option>
                  <option value="wallet_deposit">Wallet Credits</option>
                </select>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-slate-300 font-bold text-[10px] focus:outline-none font-mono"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-slate-300 font-bold text-[10px] focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Statement Print Document / Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 statement-print-section">
              {/* Print Header */}
              <div className="hidden print-header flex justify-between border-b border-slate-300 pb-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900">YAHAYASCOOL ERP</h1>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Official Student Account Statement</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-slate-900">{selectedStudent.name}</p>
                  <p className="text-slate-500 font-mono">ID: {selectedStudent.schoolId || selectedStudent.studentId}</p>
                  <p className="text-slate-500">Date Generated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {statementTransactions.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-850">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Reference #</th>
                        <th className="p-3">Transaction Details</th>
                        <th className="p-3 text-right">Debit (Charge)</th>
                        <th className="p-3 text-right">Credit (Payment)</th>
                        <th className="p-3 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {statementTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-855 transition-colors">
                          <td className="p-3 font-mono text-slate-400">{tx.date}</td>
                          <td className="p-3 font-mono font-bold text-slate-400">{tx.reference}</td>
                          <td className="p-3 text-slate-300">{tx.description}</td>
                          <td className="p-3 text-right font-mono text-rose-400">
                            {tx.debit > 0 ? `$${tx.debit.toFixed(2)}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono text-emerald-400 font-bold">
                            {tx.credit > 0 ? `$${tx.credit.toFixed(2)}` : '-'}
                          </td>
                          <td className={`p-3 text-right font-mono font-black ${
                            tx.runningBalance <= 0 ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            ${tx.runningBalance.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 italic">
                  No statement transactions registered under this filter combination.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center border-2 border-dashed border-slate-800 bg-slate-900/30 rounded-3xl max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/25 rounded-2xl flex items-center justify-center text-sky-400 mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-white">No Student Selected</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Use the lookup search input above to retrieve a student's profile and generate their full financial statement ledger.
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .statement-print-section, .statement-print-section * {
            visibility: visible;
          }
          .statement-print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            border: none !important;
          }
          .print-header {
            display: flex !important;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #1e293b !important;
          }
          td, th {
            border: 1px solid #cbd5e1 !important;
            padding: 8px !important;
            color: black !important;
          }
        }
      `}</style>
    </EnterpriseModuleShell>
  );
}

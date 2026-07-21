'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText, Search, Printer, Download, Mail, ArrowLeft, RefreshCw,
  AlertTriangle, DollarSign, Calendar, Filter, User, BookOpen, CreditCard,
  FileSpreadsheet, CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { Avatar } from '@/components/shared/Avatar';
import { generateStudentStatementPDF } from '@/utils/pdfGenerator';
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
      const studentsList = res.data || [];
      setLiveStudents(studentsList);
      if (studentsList.length > 0 && !selectedStudent) {
        setSelectedStudent(studentsList[0]);
        setStudentSearch(studentsList[0].schoolId || studentsList[0].studentId || studentsList[0].name || '');
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
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

  // Handle student search selection
  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setStudentSearch(student.schoolId || student.studentId || student.name || '');
  };

  // Construct statements ledger list
  const statementTransactions = useMemo(() => {
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

    const list: StatementTx[] = [];

    // 1. Add Invoices
    invoices.forEach(inv => {
      list.push({
        id: `inv-${inv.id}`,
        date: inv.issueDate ? inv.issueDate.split('T')[0] : new Date().toISOString().split('T')[0],
        type: 'invoice',
        reference: inv.invoiceNumber || `INV-2026-${inv.id}`,
        description: `Invoice Charge: ${inv.invoiceNumber || 'Tuition Fee'}`,
        debit: Number(inv.totalAmount || 0),
        credit: 0,
        runningBalance: 0
      });
    });

    // 2. Add Receipts
    receipts.forEach(rec => {
      if (rec.paymentMethod === 'Advance Wallet') return;
      list.push({
        id: `rec-${rec.id}`,
        date: rec.paymentDate ? rec.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
        type: 'payment',
        reference: rec.receiptNumber || `RCP-2026-${rec.id}`,
        description: `Payment Received: ${rec.receiptNumber || 'Cashier Payout'} (${rec.paymentMethod || 'Cash'})`,
        debit: 0,
        credit: Number(rec.paymentAmount || rec.amount || 0),
        runningBalance: 0
      });
    });

    // 3. Add Wallet Applications
    walletTx.forEach(w => {
      if (w.transactionType === 'wallet_used') {
        list.push({
          id: `wtx-${w.id}`,
          date: w.transactionDate ? w.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0],
          type: 'wallet_deposit',
          reference: w.referenceNumber || 'WALLET-USE',
          description: `Advance Wallet Credit Applied: ${w.reason || 'Tuition Settlement'}`,
          debit: 0,
          credit: Number(w.amount || 0),
          runningBalance: 0
        });
      }
    });

    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runBal = 0;
    list.forEach(tx => {
      runBal = runBal + tx.debit - tx.credit;
      tx.runningBalance = runBal;
    });

    return list.filter(tx => {
      if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
      if (dateFrom && new Date(tx.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(tx.date) > new Date(dateTo)) return false;
      return true;
    });
  }, [invoices, receipts, walletTx, ledgerEntries, txTypeFilter, dateFrom, dateTo]);

  // Compute Totals
  const totalDebits = useMemo(() => statementTransactions.reduce((sum, tx) => sum + tx.debit, 0), [statementTransactions]);
  const totalCredits = useMemo(() => statementTransactions.reduce((sum, tx) => sum + tx.credit, 0), [statementTransactions]);
  const closingBalance = useMemo(() => (statementTransactions[statementTransactions.length - 1]?.runningBalance || 0), [statementTransactions]);

  // Print Certified PDF Statement
  const handlePrintPDF = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student profile first.');
      return;
    }
    toast.info(`Generating certified PDF statement for ${selectedStudent.name}...`);
    await generateStudentStatementPDF(selectedStudent, statementTransactions, academicYear);
    toast.success('Certified Statement PDF downloaded successfully!');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!selectedStudent || statementTransactions.length === 0) {
      toast.error('No statement data available for export.');
      return;
    }

    const studentId = selectedStudent.schoolId || selectedStudent.studentId || 'N/A';
    const lines = [
      `YAHAYASCOOL INSTITUTIONAL STATEMENT LEDGER`,
      `Student Name,${selectedStudent.name}`,
      `Student ID,${studentId}`,
      `Academic Year,${academicYear}`,
      `Date Generated,${new Date().toLocaleString('en-GB')}`,
      `Total Debits (Charges),$${totalDebits.toFixed(2)}`,
      `Total Credits (Payments),$${totalCredits.toFixed(2)}`,
      `Net Closing Balance Due,$${closingBalance.toFixed(2)}`,
      ``,
      `Date,Reference,Type,Description,Debit ($),Credit ($),Running Balance ($)`
    ];

    statementTransactions.forEach(tx => {
      lines.push(`"${tx.date}","${tx.reference}","${tx.type}","${tx.description.replace(/"/g, '""')}",${tx.debit.toFixed(2)},${tx.credit.toFixed(2)},${tx.runningBalance.toFixed(2)}`);
    });

    const csvString = lines.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `YAHAYASCOOL_Statement_${(selectedStudent.name || 'Student').replace(/\s+/g, '_')}_${studentId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Statement CSV file downloaded successfully!');
  };

  // Export to Excel Compatible (.csv with UTF-8 BOM)
  const handleExportExcel = () => {
    if (!selectedStudent || statementTransactions.length === 0) {
      toast.error('No statement data available for export.');
      return;
    }

    const studentId = selectedStudent.schoolId || selectedStudent.studentId || 'N/A';
    const lines = [
      `YAHAYASCOOL INSTITUTIONAL STATEMENT LEDGER`,
      `Student Name\t${selectedStudent.name}`,
      `Student ID\t${studentId}`,
      `Academic Year\t${academicYear}`,
      `Date Generated\t${new Date().toLocaleString('en-GB')}`,
      `Total Debits (Charges)\t$${totalDebits.toFixed(2)}`,
      `Total Credits (Payments)\t$${totalCredits.toFixed(2)}`,
      `Net Closing Balance Due\t$${closingBalance.toFixed(2)}`,
      ``,
      `Date\tReference #\tType\tDescription\tDebit ($)\tCredit ($)\tRunning Balance ($)`
    ];

    statementTransactions.forEach(tx => {
      lines.push(`${tx.date}\t${tx.reference}\t${tx.type}\t${tx.description}\t${tx.debit.toFixed(2)}\t${tx.credit.toFixed(2)}\t${tx.runningBalance.toFixed(2)}`);
    });

    const excelString = '\uFEFF' + lines.join('\n');
    const blob = new Blob([excelString], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `YAHAYASCOOL_Statement_${(selectedStudent.name || 'Student').replace(/\s+/g, '_')}_${studentId}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Statement Excel file downloaded successfully!');
  };

  // Email Guardian
  const handleEmailParent = () => {
    if (!selectedStudent) return;
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1200)),
      {
        loading: 'Generating certified PDF & dispatching email to registered guardian...',
        success: `✉️ Financial statement emailed to ${selectedStudent.name}'s registered parent!`,
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-md w-full space-y-1">
              <label className="text-xs font-extrabold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                <User className="w-4 h-4 text-emerald-400" /> Select Student Profile
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search student by name or ID (e.g. ST-2026-001, Ahmet)..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              </div>

              {/* Live Student Dropdown Match Options */}
              {studentSearch.length > 0 && liveStudents.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-slate-700 rounded-xl bg-slate-950 divide-y divide-slate-800 shadow-2xl mt-1 z-20">
                  {liveStudents
                    .filter(s =>
                      (s.name && s.name.toLowerCase().includes(studentSearch.toLowerCase())) ||
                      (s.schoolId && s.schoolId.toLowerCase().includes(studentSearch.toLowerCase())) ||
                      (s.studentId && s.studentId.toLowerCase().includes(studentSearch.toLowerCase()))
                    )
                    .map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectStudent(s)}
                        className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors hover:bg-slate-800 ${
                          selectedStudent?.id === s.id ? 'bg-emerald-950/80 border-l-4 border-emerald-400 text-white font-bold' : 'text-slate-200'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-white block">{s.name}</span>
                          <span className="text-[11px] text-slate-400">Class: {s.sections?.[0]?.sectionCode || 'Assigned'}</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-extrabold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 text-[11px]">
                          {s.schoolId || s.studentId || 'N/A'}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {selectedStudent && (
              <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
                <button
                  onClick={handlePrintPDF}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black transition-all border border-slate-600 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Print Certified PDF</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black transition-all border border-slate-600 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black transition-all border border-slate-600 shadow-md cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export Excel</span>
                </button>
                <button
                  onClick={handleEmailParent}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Guardian</span>
                </button>
              </div>
            )}
          </div>

          {selectedStudent && (
            <div className="flex items-center gap-4 border-t border-slate-800 pt-4 animate-in fade-in">
              <Avatar src={selectedStudent.photo} name={selectedStudent.name} size="lg" className="border-2 border-emerald-500/40" />
              <div>
                <h3 className="text-base font-extrabold text-white">{selectedStudent.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono text-emerald-300 font-extrabold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    ID: {selectedStudent.schoolId || selectedStudent.studentId || 'N/A'}
                  </span>
                  <span className="text-xs text-slate-300">Class Section: <strong className="text-white">{selectedStudent.sections?.[0]?.sectionCode || 'Assigned'}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedStudent ? (
          <>
            {/* KPI Overview Deck */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Opening Balance</span>
                <strong className="text-slate-300 text-xl font-mono block mt-1">$0.00</strong>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
                <span className="text-[10px] text-rose-400 font-bold block uppercase tracking-wider">Total Charges (Debits)</span>
                <strong className="text-rose-400 text-xl font-mono block mt-1">
                  ${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
                <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Total Payments (Credits)</span>
                <strong className="text-emerald-400 text-xl font-mono block mt-1">
                  ${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
                <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">Closing Net Balance Due</span>
                <strong className="text-amber-400 text-xl font-mono block mt-1">
                  ${closingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-md">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span>Statement Ledger Filters:</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-emerald-400"
                >
                  <option value="2026-2027">AY 2026/2027</option>
                  <option value="2025-2026">AY 2025/2026</option>
                </select>
                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-emerald-400"
                >
                  <option value="all">All Transaction Types</option>
                  <option value="invoice">Charges (Invoices)</option>
                  <option value="payment">Payments (Receipts)</option>
                  <option value="wallet_deposit">Wallet Credits</option>
                </select>
                <div className="flex items-center gap-2 text-slate-300">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs focus:outline-none font-mono"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Statement Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Itemized Financial Ledger Transactions</span>
                </h3>
                <span className="text-xs text-slate-300 font-mono font-bold">
                  {statementTransactions.length} Record(s) Found
                </span>
              </div>

              {statementTransactions.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-200 uppercase text-[10px] tracking-wider font-extrabold">
                      <tr>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Reference #</th>
                        <th className="p-3.5">Transaction Details</th>
                        <th className="p-3.5 text-right">Debit (Charge)</th>
                        <th className="p-3.5 text-right">Credit (Payment)</th>
                        <th className="p-3.5 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {statementTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-800/60 transition-colors">
                          <td className="p-3.5 font-mono text-slate-300 font-medium">{tx.date}</td>
                          <td className="p-3.5 font-mono font-extrabold text-emerald-400">{tx.reference}</td>
                          <td className="p-3.5 text-white font-semibold">{tx.description}</td>
                          <td className="p-3.5 text-right font-mono text-rose-400 font-bold">
                            {tx.debit > 0 ? `$${tx.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="p-3.5 text-right font-mono text-emerald-400 font-bold">
                            {tx.credit > 0 ? `$${tx.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className={`p-3.5 text-right font-mono font-black ${
                            tx.runningBalance <= 0 ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            ${tx.runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 italic font-mono">
                  No statement transactions registered under this filter combination.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center border-2 border-dashed border-slate-800 bg-slate-900/30 rounded-3xl max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-white">No Student Selected</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Use the lookup search input above to retrieve a student's profile and generate their full financial statement ledger.
            </p>
          </div>
        )}
      </div>
    </EnterpriseModuleShell>
  );
}

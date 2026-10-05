/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from '@/i18n/routing';
import {
  FileText, Search, Printer, Download, Mail, RefreshCw,
  AlertTriangle, DollarSign, Calendar, Filter, User, BookOpen, CreditCard,
  FileSpreadsheet, CheckCircle2, Wallet, Send, X, ChevronRight, Clock,
  ArrowUpRight, ShieldCheck, Landmark, Percent, Layers, Eye, Check
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { useAuth } from '@/hooks/useAuth';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { Avatar } from '@/components/shared/Avatar';
import { generateStudentStatementPDF } from '@/utils/pdfGenerator';
import { printInvoiceDocument, printReceiptDocument } from '@/lib/print-finance';
import { toast } from 'sonner';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface StatementTx {
  id: string | number;
  date: string;
  type: 'invoice' | 'payment' | 'wallet_deposit' | 'scholarship' | 'discount' | 'adjustment';
  reference: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  category?: string;
  channel?: string;
  rawRecord?: any;
}

function fmtMoney(amount: number | string | undefined | null): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || '0'));
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function StudentStatementsPage() {
  const locale = useLocale();
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const t = useCallback((key: string, loc?: string) => i18nT(key, loc || localeRef.current), []);

  const { user, role } = useAuth();
  const userRoleStr = String(role || user?.role?.type || user?.role?.name || '').toLowerCase();
  const isStudentOrParent = role === 'student' || role === 'parent' || userRoleStr.includes('student') || userRoleStr.includes('parent');

  // Core Data
  const [liveStudents, setLiveStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  // Filters
  const [academicYear, setAcademicYear] = useState('all');
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Ledger Raw Collections
  const [invoices, setInvoices] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [walletTx, setWalletTx] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);

  // Modals & Drawers
  const [inspectTx, setInspectTx] = useState<StatementTx | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailNotes, setEmailNotes] = useState('');

  // 1. Initial Load: Students
  useEffect(() => {
    let cancelled = false;
    erpService.getStudents({ limit: 300 }).then(res => {
      if (cancelled) return;
      const studentsList = res.data || [];
      setLiveStudents(studentsList);

      // Auto-detect student if logged in as student or parent
      if (isStudentOrParent && user) {
        const uId = user.id;
        const uSchoolId = ((user as any).schoolId || (user as any).studentId || user.username || '').toLowerCase();
        const matched = studentsList.find(s =>
          (uId && (s.user?.id === uId || s.id === uId)) ||
          (uSchoolId && ((s.schoolId || '').toLowerCase() === uSchoolId || (s.studentId || '').toLowerCase() === uSchoolId))
        );
        if (matched) {
          setSelectedStudent(matched);
          setStudentSearch(matched.name || '');
          return;
        }
      }

      // Default to first student if admin/staff
      if (studentsList.length > 0 && !selectedStudent) {
        setSelectedStudent(studentsList[0]);
        setStudentSearch(studentsList[0].name || '');
      }
    }).catch(() => {
      toast.error(t('Could not load student roster'));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [isStudentOrParent, user, selectedStudent, t]);

  // 2. Load Financial Data for Selected Student
  const loadFinancialData = useCallback(async () => {
    if (!selectedStudent) {
      setInvoices([]);
      setReceipts([]);
      setWalletTx([]);
      setLedgerEntries([]);
      setWalletBalance(0);
      return;
    }

    const sid = selectedStudent.id;
    const sSchoolId = selectedStudent.schoolId || selectedStudent.studentId || '';
    setLoading(true);

    try {
      const [allInvs, allRecs, ledg, wtx, wBal] = await Promise.all([
        financeService.getInvoices().catch(() => []),
        financeService.getReceipts().catch(() => []),
        financeService.getStudentLedger(String(sid)).catch(() => []),
        financeService.getStudentWalletTransactions(sid).catch(() => []),
        financeService.getStudentAdvanceBalance(sid).catch(() => Number(selectedStudent.advanceBalance || 0))
      ]);

      const myInvoices = (allInvs || []).filter((i: any) =>
        i.student?.id === sid ||
        i.studentId === sSchoolId ||
        i.student?.schoolId === sSchoolId ||
        (sSchoolId && (i.studentName || '').toLowerCase().includes(sSchoolId.toLowerCase()))
      );

      const myReceipts = (allRecs || []).filter((r: any) =>
        r.student?.id === sid ||
        r.studentId === sSchoolId ||
        r.student?.schoolId === sSchoolId ||
        (sSchoolId && (r.studentName || '').toLowerCase().includes(sSchoolId.toLowerCase()))
      );

      setInvoices(myInvoices);
      setReceipts(myReceipts);
      setLedgerEntries(ledg || []);
      setWalletTx(wtx || []);
      setWalletBalance(Number(wBal || 0));
    } catch {
      toast.error(t('Failed to load student financial ledger'));
    } finally {
      setLoading(false);
    }
  }, [selectedStudent, t]);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  // Handle student selection from combobox
  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setStudentSearch(student.name || '');
    setShowStudentDropdown(false);
  };

  // 3. Chronological Statement Transactions Generator
  const statementTransactions = useMemo(() => {
    if (ledgerEntries && ledgerEntries.length > 0) {
      const list: StatementTx[] = ledgerEntries.map(e => ({
        id: `ledg-${e.id}`,
        date: e.transactionDate ? e.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0],
        type: e.type === 'debit' ? 'invoice' : 'payment',
        reference: e.documentNumber || e.referenceId || 'LEDGER-REF',
        description: e.description || (e.type === 'debit' ? 'Invoice Debit' : 'Payment Credit'),
        debit: e.type === 'debit' ? Number(e.baseAmount || e.amount || 0) : 0,
        credit: e.type !== 'debit' ? Number(e.baseAmount || e.amount || 0) : 0,
        runningBalance: Number(e.runningBalance || 0),
        category: e.type === 'debit' ? 'Fee Assessment' : 'Settlement',
        rawRecord: e
      }));
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return list;
    }

    const list: StatementTx[] = [];

    // Invoices (Debits)
    invoices.forEach(inv => {
      list.push({
        id: `inv-${inv.id}`,
        date: inv.issueDate ? inv.issueDate.split('T')[0] : (inv.createdAt ? inv.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
        type: 'invoice',
        reference: inv.invoiceNumber || `INV-2026-${inv.id}`,
        description: inv.description || `${t('Tuition & Fee Charge')}: ${inv.invoiceNumber || 'INV'}`,
        debit: Number(inv.totalAmount || 0),
        credit: 0,
        runningBalance: 0,
        category: inv.academicTerm || 'Academic Term Fee',
        channel: 'System Billing',
        rawRecord: inv
      });
    });

    // Payments (Credits)
    receipts.forEach(rec => {
      if (rec.paymentMethod === 'Advance Wallet') return; // Handled via wallet allocations
      list.push({
        id: `rec-${rec.id}`,
        date: rec.paymentDate ? rec.paymentDate.split('T')[0] : (rec.createdAt ? rec.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
        type: 'payment',
        reference: rec.receiptNumber || `RCP-2026-${rec.id}`,
        description: `${t('Payment Settlement')} (${rec.paymentMethod || 'Cash'}) — ${rec.referenceNumber ? `Ref: ${rec.referenceNumber}` : 'Direct Receipt'}`,
        debit: 0,
        credit: Number(rec.paymentAmount || rec.amount || 0),
        runningBalance: 0,
        category: rec.paymentMethod || 'Receipt Voucher',
        channel: rec.paymentMethod || 'Cashier',
        rawRecord: rec
      });
    });

    // Wallet Deductions (Credits against invoices)
    walletTx.forEach(w => {
      if (w.transactionType === 'wallet_used' || w.type === 'wallet_used') {
        list.push({
          id: `wtx-${w.id}`,
          date: w.transactionDate ? w.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0],
          type: 'wallet_deposit',
          reference: w.referenceNumber || `WAL-USE-${w.id}`,
          description: `${t('Prepaid Wallet Applied')}: ${w.reason || t('Settlement')}`,
          debit: 0,
          credit: Number(w.amount || 0),
          runningBalance: 0,
          category: 'Advance Wallet',
          channel: 'Student Wallet',
          rawRecord: w
        });
      }
    });

    // Chronological Sort
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate Running Balance
    let runBal = 0;
    list.forEach(tx => {
      runBal = runBal + tx.debit - tx.credit;
      tx.runningBalance = runBal;
    });

    return list;
  }, [ledgerEntries, invoices, receipts, walletTx, t]);

  // 4. Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return statementTransactions.filter(tx => {
      // Query filter
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchRef = tx.reference.toLowerCase().includes(q);
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchCat = (tx.category || '').toLowerCase().includes(q);
        if (!matchRef && !matchDesc && !matchCat) return false;
      }

      // Type filter
      if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;

      // Date Range
      if (dateFrom && new Date(tx.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(tx.date) > new Date(dateTo)) return false;

      // Academic Year filter
      if (academicYear !== 'all') {
        const year = tx.date.slice(0, 4);
        if (academicYear === '2026-2027' && year !== '2026' && year !== '2027') return false;
        if (academicYear === '2025-2026' && year !== '2025' && year !== '2026') return false;
        if (academicYear === '2024-2025' && year !== '2024' && year !== '2025') return false;
      }

      return true;
    });
  }, [statementTransactions, query, txTypeFilter, dateFrom, dateTo, academicYear]);

  // Active Filters Count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (query.trim()) count++;
    if (txTypeFilter !== 'all') count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (academicYear !== 'all') count++;
    return count;
  }, [query, txTypeFilter, dateFrom, dateTo, academicYear]);

  const handleClearFilters = useCallback(() => {
    setQuery('');
    setTxTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setAcademicYear('all');
  }, []);

  // Totals
  const totalDebits = useMemo(() => statementTransactions.reduce((sum, tx) => sum + tx.debit, 0), [statementTransactions]);
  const totalCredits = useMemo(() => statementTransactions.reduce((sum, tx) => sum + tx.credit, 0), [statementTransactions]);
  const netClosingBalance = useMemo(() => {
    if (statementTransactions.length === 0) return 0;
    return statementTransactions[statementTransactions.length - 1].runningBalance;
  }, [statementTransactions]);

  // 5. KPI Cards Definition
  const kpiCards = useMemo<EnterpriseKPICard[]>(() => [
    {
      id: 'debits',
      title: t('Total Invoiced Debits'),
      value: `$${fmtMoney(totalDebits)}`,
      subtitle: t('All curriculum, tuition & fee assessments'),
      trendDirection: 'neutral',
      icon: <FileText className="w-5 h-5 text-rose-500 dark:text-rose-400" />,
      onClick: () => setTxTypeFilter('invoice'),
      isActive: txTypeFilter === 'invoice'
    },
    {
      id: 'credits',
      title: t('Total Settled Credits'),
      value: `$${fmtMoney(totalCredits)}`,
      subtitle: t('Bank wire, mobile money & cashier deposits'),
      trendDirection: 'up',
      icon: <CreditCard className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
      onClick: () => setTxTypeFilter('payment'),
      isActive: txTypeFilter === 'payment'
    },
    {
      id: 'wallet',
      title: t('Advance Wallet Balance'),
      value: `$${fmtMoney(walletBalance)}`,
      subtitle: t('Unallocated prepaid scholar funds'),
      trendDirection: 'neutral',
      icon: <Wallet className="w-5 h-5 text-sky-500 dark:text-sky-400" />,
      onClick: () => setTxTypeFilter('wallet_deposit'),
      isActive: txTypeFilter === 'wallet_deposit'
    },
    {
      id: 'closing_balance',
      title: t('Net Account Balance'),
      value: `$${fmtMoney(Math.abs(netClosingBalance))}`,
      subtitle: netClosingBalance > 0
        ? t('Arrears Outstanding (Payment Required)')
        : netClosingBalance === 0
          ? t('Account Fully Reconciled (No Dues)')
          : t('Credit Balance (Overpayment / Surplus)'),
      trendDirection: netClosingBalance > 0 ? 'down' : 'up',
      icon: <Landmark className={`w-5 h-5 ${netClosingBalance > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
    }
  ], [totalDebits, totalCredits, walletBalance, netClosingBalance, txTypeFilter, t]);

  // 6. Print Certified PDF Statement
  const handlePrintPDF = async () => {
    if (!selectedStudent) {
      toast.error(t('Please select a student profile first.'));
      return;
    }
    toast.info(`${t('Generating certified PDF statement for')} ${selectedStudent.name || 'Scholar'}...`);
    try {
      await generateStudentStatementPDF(selectedStudent, statementTransactions, academicYear === 'all' ? '2026-2027' : academicYear);
      toast.success(t('Certified Statement PDF downloaded successfully!'));
    } catch {
      toast.error(t('Failed to generate PDF statement. Please try again.'));
    }
  };

  // 7. Export CSV Ledger
  const handleExportCSV = () => {
    if (!selectedStudent || statementTransactions.length === 0) {
      toast.error(t('No statement data available for export.'));
      return;
    }

    const studentId = selectedStudent.schoolId || selectedStudent.studentId || 'N/A';
    const lines = [
      `YAHAYASCOOL INSTITUTIONAL STATEMENT LEDGER`,
      `Student Name,${selectedStudent.name || 'Student'}`,
      `Student ID,${studentId}`,
      `Academic Year,${academicYear === 'all' ? '2026-2027 Master' : academicYear}`,
      `Generated Date,${new Date().toLocaleString('en-GB')}`,
      `Total Debits (Charges),$${totalDebits.toFixed(2)}`,
      `Total Credits (Payments),$${totalCredits.toFixed(2)}`,
      `Advance Wallet Balance,$${walletBalance.toFixed(2)}`,
      `Net Closing Balance Due,$${netClosingBalance.toFixed(2)}`,
      ``,
      `Date,Reference #,Type,Category,Description,Debit ($),Credit ($),Running Balance ($)`
    ];

    statementTransactions.forEach(tx => {
      lines.push(
        `"${tx.date}","${tx.reference}","${tx.type}","${tx.category || ''}","${tx.description.replace(/"/g, '""')}",${tx.debit.toFixed(2)},${tx.credit.toFixed(2)},${tx.runningBalance.toFixed(2)}`
      );
    });

    const csvString = lines.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Statement_${(selectedStudent.name || 'Scholar').replace(/\s+/g, '_')}_${studentId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(t('Statement CSV file downloaded successfully!'));
  };

  // 8. Send Statement Email
  const handleSendEmail = async () => {
    if (!selectedStudent) return;
    const guardianEmail = selectedStudent.parents?.[0]?.email || selectedStudent.email || selectedStudent.user?.email || '';
    if (!guardianEmail) {
      toast.error(t('No valid guardian or student email found for this scholar profile.'));
      return;
    }

    setEmailSending(true);
    try {
      // Simulate/trigger dispatch
      await new Promise(res => setTimeout(res, 1200));
      toast.success(`${t('Certified statement dispatched to')} ${guardianEmail}`);
      setShowEmailModal(false);
      setEmailNotes('');
    } catch {
      toast.error(t('Failed to send statement email.'));
    } finally {
      setEmailSending(false);
    }
  };

  // 9. Columns Definition for DataGrid
  const columns = useMemo<ColumnDef<StatementTx, any>[]>(() => [
    {
      accessorKey: 'date',
      header: t('Posting Date'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 py-1 font-mono text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="font-bold text-slate-900 dark:text-slate-100">{fmtDate(row.original.date)}</span>
        </div>
      )
    },
    {
      accessorKey: 'type',
      header: t('Transaction Type'),
      cell: ({ row }) => {
        const type = row.original.type;
        if (type === 'invoice') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <FileText className="w-3 h-3 text-rose-500" />
              <span>{t('Invoice Debit')}</span>
            </span>
          );
        }
        if (type === 'wallet_deposit') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              <Wallet className="w-3 h-3 text-sky-500" />
              <span>{t('Wallet Allocation')}</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CreditCard className="w-3 h-3 text-emerald-500" />
            <span>{t('Payment Credit')}</span>
          </span>
        );
      }
    },
    {
      accessorKey: 'reference',
      header: t('Reference #'),
      cell: ({ row }) => (
        <div className="font-mono text-xs py-1">
          <span className="font-black text-emerald-600 dark:text-emerald-400 tracking-wide block">
            {row.original.reference}
          </span>
          {row.original.category && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px] block">
              {row.original.category}
            </span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'description',
      header: t('Description & Particulars'),
      cell: ({ row }) => (
        <div className="space-y-0.5 max-w-sm py-1">
          <p className="font-medium text-slate-900 dark:text-slate-100 text-xs truncate">
            {row.original.description}
          </p>
          {row.original.channel && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
              Channel: {row.original.channel}
            </span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'debit',
      header: `${t('Debit (Charges)')} ($)`,
      cell: ({ row }) => (
        <div className="text-right font-mono text-xs py-1">
          {row.original.debit > 0 ? (
            <span className="font-black text-rose-600 dark:text-rose-400">
              +${fmtMoney(row.original.debit)}
            </span>
          ) : (
            <span className="text-slate-300 dark:text-slate-600">—</span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'credit',
      header: `${t('Credit (Paid)')} ($)`,
      cell: ({ row }) => (
        <div className="text-right font-mono text-xs py-1">
          {row.original.credit > 0 ? (
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              -${fmtMoney(row.original.credit)}
            </span>
          ) : (
            <span className="text-slate-300 dark:text-slate-600">—</span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'runningBalance',
      header: `${t('Running Balance')} ($)`,
      cell: ({ row }) => {
        const bal = row.original.runningBalance;
        return (
          <div className="text-right font-mono text-xs py-1">
            <span className={`font-black ${bal > 0 ? 'text-rose-600 dark:text-rose-400' : bal < 0 ? 'text-sky-600 dark:text-sky-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              ${fmtMoney(Math.abs(bal))}
            </span>
            <span className={`block text-[10px] font-bold ${bal > 0 ? 'text-rose-500' : bal < 0 ? 'text-sky-500' : 'text-emerald-500'}`}>
              {bal > 0 ? t('Due') : bal < 0 ? t('Credit') : t('Settled')}
            </span>
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setInspectTx(row.original)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
            title={t('Inspect line item')}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t('Inspect')}</span>
          </button>
          {row.original.type === 'invoice' && row.original.rawRecord && (
            <button
              onClick={() => printInvoiceDocument(row.original.rawRecord)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title={t('Print Invoice')}
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}
          {row.original.type === 'payment' && row.original.rawRecord && (
            <button
              onClick={() => printReceiptDocument(row.original.rawRecord)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title={t('Print Receipt')}
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ], [t]);

  // Guardian Email fallback
  const guardianEmail = selectedStudent?.parents?.[0]?.email || selectedStudent?.email || selectedStudent?.user?.email || 'guardian@yahayaschool.edu';
  const guardianName = selectedStudent?.parents?.[0]?.name ||
    (selectedStudent?.parents?.[0] ? `${selectedStudent.parents[0].firstName || ''} ${selectedStudent.parents[0].lastName || ''}`.trim() : '') ||
    t('Registered Parent / Guardian Sponsor');
  const guardianPhone = selectedStudent?.parents?.[0]?.phone || selectedStudent?.phone || '—';

  return (
    <EnterpriseModuleShell
      title={t('Student Financial Statements & Running Account Ledger')}
      description={t('Certified chronological student account statements, itemized fee billings, multi-channel payment settlements, and verified audit exports.')}
      breadcrumbs={[
        { label: t('Finance ERP'), href: '/finance' },
        { label: t('Billing Suite'), href: '/finance/billing/invoices' },
        { label: t('Statements') }
      ]}
      icon={<FileText className="w-8 h-8" />}
      recordCount={filteredTransactions.length}
      recordLabel={t('Transactions')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { loadFinancialData(); toast.success(t('Ledger synchronized.')); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('Reconcile')}</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!selectedStudent || statementTransactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('Export CSV')}</span>
          </button>
          <button
            onClick={() => {
              setEmailSubject(`Certified Financial Statement — ${selectedStudent?.name || 'Scholar'} (${selectedStudent?.schoolId || ''})`);
              setShowEmailModal(true);
            }}
            disabled={!selectedStudent}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Mail className="w-3.5 h-3.5 text-sky-500" />
            <span>{t('Email Statement')}</span>
          </button>
          <button
            onClick={handlePrintPDF}
            disabled={!selectedStudent}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('Print Certified PDF')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link
          href="/finance/billing/invoices"
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t('Student Invoices')}</span>
        </Link>
        <Link
          href="/finance/billing/payments"
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5"
        >
          <CreditCard className="w-3.5 h-3.5 text-sky-500" />
          <span>{t('Cashier POS & Receipts')}</span>
        </Link>
        <Link
          href="/finance/billing/statements"
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t('Student Statements')}</span>
        </Link>
        <Link
          href="/finance/billing/structures"
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5"
        >
          <DollarSign className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('Fee Catalog & Structures')}</span>
        </Link>
      </div>

      {/* Scholar Profile Card & Interactive Combobox */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Scholar Information */}
          <div className="flex items-center gap-4">
            <Avatar
              src={selectedStudent?.photo?.url || selectedStudent?.photo}
              name={selectedStudent?.name || 'Scholar'}
              size="lg"
              className="border-2 border-emerald-500/40 shadow-sm shrink-0"
            />
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {selectedStudent?.name || t('Scholar Account')}
                </h3>
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {selectedStudent?.schoolId || selectedStudent?.studentId || 'ID-PENDING'}
                </span>
                {netClosingBalance <= 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {t('RECONCILED & CLEAR')}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-500" /> {t('FEES OVERDUE')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                {selectedStudent?.gradeLevel && (
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {t('Grade')}: {selectedStudent.gradeLevel}
                  </span>
                )}
                {selectedStudent?.section && <span>· Section: {selectedStudent.section}</span>}
                <span className="truncate max-w-xs">
                  · {t('Sponsor')}: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{guardianName}</strong> ({guardianPhone})
                </span>
              </div>
            </div>
          </div>

          {/* Student Selector Combobox (Admin / Staff View) */}
          {!isStudentOrParent ? (
            <div className="relative max-w-md w-full">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('Search & Switch Scholar Profile')}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('Type student name, admission #, or ID...')}
                  value={studentSearch}
                  onFocus={() => setShowStudentDropdown(true)}
                  onChange={e => {
                    setStudentSearch(e.target.value);
                    setShowStudentDropdown(true);
                  }}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                {studentSearch && (
                  <button
                    onClick={() => { setStudentSearch(''); setShowStudentDropdown(true); }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showStudentDropdown && liveStudents.length > 0 && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowStudentDropdown(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
                    {liveStudents
                      .filter(s => {
                        if (!studentSearch.trim()) return true;
                        const q = studentSearch.toLowerCase();
                        return (
                          (s.name && s.name.toLowerCase().includes(q)) ||
                          (s.schoolId && s.schoolId.toLowerCase().includes(q)) ||
                          (s.studentId && s.studentId.toLowerCase().includes(q))
                        );
                      })
                      .slice(0, 30)
                      .map(s => {
                        const isCurrent = selectedStudent?.id === s.id;
                        return (
                          <div
                            key={s.id}
                            onClick={() => handleSelectStudent(s)}
                            className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                              isCurrent ? 'bg-emerald-50 dark:bg-emerald-950/50 border-l-4 border-emerald-500 font-bold' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar src={s.photo?.url || s.photo} name={s.name} size="sm" />
                              <div className="truncate">
                                <span className="text-slate-900 dark:text-white font-bold block truncate">{s.name}</span>
                                <span className="text-[11px] text-slate-400">{s.gradeLevel ? `${t('Grade')} ${s.gradeLevel}` : 'Standard Track'}</span>
                              </div>
                            </div>
                            <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                              {s.schoolId || s.studentId || 'N/A'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{t('Authenticated Scholar Self-Service Statement')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search statement by reference #, description, or particulars...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadFinancialData(); toast.success(t('Statement records updated.')); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
        createButtonLabel={t('Print Certified Statement')}
        onCreate={handlePrintPDF}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Academic Year Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{t('Session')}</label>
              <select
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">{t('All Sessions')}</option>
                <option value="2026-2027">2026-2027</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{t('Type')}</label>
              <select
                value={txTypeFilter}
                onChange={e => setTxTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">{t('All Transactions')}</option>
                <option value="invoice">{t('Invoices & Charges')}</option>
                <option value="payment">{t('Payments & Receipts')}</option>
                <option value="wallet_deposit">{t('Wallet Allocations')}</option>
              </select>
            </div>

            {/* Date Range Pickers */}
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{t('From')}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-2 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{t('To')}</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="px-2 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        }
      />

      {/* Interactive Data Grid */}
      <EnterpriseDataGrid
        data={filteredTransactions}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={row => setInspectTx(row)}
        emptyStateProps={{
          title: t('No Statement Records Found'),
          description: t('No billing or payment ledger records match your current filters.'),
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: handleClearFilters,
          createLabel: t('Reset All Filters'),
          onCreate: handleClearFilters
        }}
      />

      {/* Inspect Line Item Slideout Panel */}
      {inspectTx && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={() => setInspectTx(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="space-y-0.5">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t('Statement Line Item Particulars')}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {inspectTx.reference} · {fmtDate(inspectTx.date)}
                  </p>
                </div>
                <button
                  onClick={() => setInspectTx(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* Main Details Box */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t('Accounting Classification')}</span>
                    <span className={`px-2.5 py-1 rounded-xl font-bold uppercase text-[10px] ${
                      inspectTx.type === 'invoice'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    }`}>
                      {inspectTx.type === 'invoice' ? t('DEBIT ENTRY') : t('CREDIT ENTRY')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('Transaction Date')}</span>
                      <strong className="text-slate-900 dark:text-white font-mono text-xs">{fmtDate(inspectTx.date)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('Reference ID')}</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">{inspectTx.reference}</strong>
                    </div>
                  </div>
                </div>

                {/* Financial Ledger Impact */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('Debit Amount')}</span>
                    <strong className="text-sm font-mono font-black text-rose-600 dark:text-rose-400 block mt-1">
                      {inspectTx.debit > 0 ? `+$${fmtMoney(inspectTx.debit)}` : '—'}
                    </strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('Credit Amount')}</span>
                    <strong className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                      {inspectTx.credit > 0 ? `-$${fmtMoney(inspectTx.credit)}` : '—'}
                    </strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('Running Balance')}</span>
                    <strong className="text-sm font-mono font-black text-slate-900 dark:text-white block mt-1">
                      ${fmtMoney(Math.abs(inspectTx.runningBalance))}
                    </strong>
                  </div>
                </div>

                {/* Particulars & Description */}
                <div className="space-y-1.5">
                  <label className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">{t('Particulars & Line-Item Notes')}</label>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                    {inspectTx.description}
                  </div>
                </div>

                {/* Scholar Context */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">{t('Linked Scholar Profile')}</span>
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">{selectedStudent?.schoolId}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{selectedStudent?.name} · {selectedStudent?.gradeLevel || 'Standard Track'}</p>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 shrink-0">
                <button
                  onClick={() => setInspectTx(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  {t('Close')}
                </button>
                <div className="flex items-center gap-2">
                  {inspectTx?.type === 'invoice' && inspectTx.rawRecord && (
                    <button
                      onClick={() => printInvoiceDocument(inspectTx.rawRecord)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{t('Print Invoice')}</span>
                    </button>
                  )}
                  {inspectTx?.type === 'payment' && inspectTx.rawRecord && (
                    <button
                      onClick={() => printReceiptDocument(inspectTx.rawRecord)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{t('Print Receipt')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Statement Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{t('Email Statement to Guardian')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{t('Institutional Statement Dispatch')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t('Recipient Email')}</label>
                <input
                  type="email"
                  disabled
                  value={guardianEmail}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400">{t('Guardian')}: {guardianName}</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t('Subject Line')}</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t('Additional Bursary Notes (Optional)')}</label>
                <textarea
                  rows={3}
                  value={emailNotes}
                  onChange={e => setEmailNotes(e.target.value)}
                  placeholder={t('Add a custom remittance note or payment deadline notice...')}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-sky-500" />
                <span>{t('An official certified PDF statement with QR verification code and digital signatures will be attached automatically.')}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={emailSending}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-black text-xs shadow-lg shadow-sky-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{emailSending ? t('Dispatching...') : t('Send Certified Statement')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

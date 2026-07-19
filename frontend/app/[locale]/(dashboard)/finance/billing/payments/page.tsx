'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CreditCard, DollarSign, QrCode, Search, Filter, Download, Plus,
  Eye, CheckCircle2, Clock, PiggyBank, Landmark, ScrollText,
  FileText, Shield, ArrowRight, Printer, Sparkles, AlertCircle,
  Smartphone, Building2, User, RefreshCw
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import type { PaymentReceipt, PaymentMethodType, Invoice } from '@/types/finance.types';
import type { Student } from '@/types/erp.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';
import { printReceiptDocument } from '@/lib/print-finance';

function CashierPaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialInvoiceNumber = searchParams.get('invoiceNumber');

  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState<PaymentReceipt | null>(null);

  // Live Directory Data for Students
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentInvoices, setStudentInvoices] = useState<Invoice[]>([]);
  
  // Computed Debt & Wallet
  const [totalDebt, setTotalDebt] = useState(0);
  const [advancePaymentBalance, setAdvancePaymentBalance] = useState(0);

  // New Payment Form state
  const [payStudentSearch, setPayStudentSearch] = useState('');
  const [payInvoiceNumber, setPayInvoiceNumber] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethodType>('Bank Transfer');
  const [payReference, setPayReference] = useState('');
  const [payBankOrOperator, setPayBankOrOperator] = useState('');
  const [payCurrency, setPayCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [useWallet, setUseWallet] = useState(true);
  const [liveCurrencies, setLiveCurrencies] = useState<any[]>([]);

  // E2E Verification Test States
  const [verifyingE2E, setVerifyingE2E] = useState(false);
  const [e2eResult, setE2EResult] = useState<any>(null);
  const [showE2EModal, setShowE2EModal] = useState(false);

  const handleRunE2EVerification = async () => {
    setVerifyingE2E(true);
    setShowE2EModal(true);
    setE2EResult(null);
    try {
      const res = await financeService.verifyE2EScenario();
      setE2EResult(res);
      toast.success('Mandatory E2E Accounting Scenario PASSED 100%!');
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'E2E Verification Failed';
      const logs = err?.response?.data?.error?.logs || err?.response?.data?.logs || [];
      setE2EResult({ success: false, error: msg, logs });
      toast.error('E2E Verification Failed');
    }
    setVerifyingE2E(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getReceipts();
      setReceipts(data);
      
      const [studentsRes, currenciesRes] = await Promise.all([
        erpService.getStudents({ limit: 100 }),
        financeService.getExchangeRates()
      ]);
      setLiveStudents(studentsRes.data);
      setLiveCurrencies(currenciesRes);
    } catch {
      toast.error('Failed to load payment receipts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle URL Parameter Prefill
  useEffect(() => {
    if (initialInvoiceNumber) {
      setPayInvoiceNumber(initialInvoiceNumber);
      setShowPayModal(true);
      // Clean URL silently
      router.replace('/finance/billing/payments');
      
      // Try to find matching invoice to prefill data
      financeService.getInvoices().then(invoices => {
        const inv = invoices.find(i => i.invoiceNumber === initialInvoiceNumber);
        if (inv) {
          const sName = inv.student
            ? `${inv.student.firstName || ''} ${inv.student.lastName || ''}`.trim() || inv.student.name || inv.studentName || ''
            : inv.studentName || '';
          setPayStudentSearch(sName);
          const bal = inv.remainingBalance ?? (inv.totalAmount || 0);
          setPayAmount(bal.toString());
          toast.info(`Prefilled modal with Invoice ${initialInvoiceNumber}`);
        }
      });
    }
  }, [initialInvoiceNumber, router]);

  // Handle Student Selection & Debt Calculation
  useEffect(() => {
    if (!payStudentSearch) {
      setSelectedStudent(null);
      setStudentInvoices([]);
      setTotalDebt(0);
      setAdvancePaymentBalance(0);
      return;
    }

    const matched = liveStudents.find(s => {
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim();
      return (s.name || '').toLowerCase() === payStudentSearch.toLowerCase() ||
        fullName.toLowerCase() === payStudentSearch.toLowerCase() ||
        s.studentId === payStudentSearch ||
        s.schoolId === payStudentSearch;
    });
    
    if (matched) {
      setSelectedStudent(matched);
      
      // Read advance balance directly from the student object (populated via fields query)
      // Fall back to a dedicated API call if not in the object
      const directAdvanceBal = Number((matched as any).advanceBalance || 0);
      
      Promise.all([
        financeService.getInvoices(),
        directAdvanceBal > 0
          ? Promise.resolve(directAdvanceBal)
          : erpService.getStudentAdvanceBalance(matched.id)
      ]).then(([allInvoices, advBal]) => {
        const theirInvoices = allInvoices.filter(i => 
          (i.student?.id === matched.id || i.studentId === matched.studentId || i.student?.schoolId === matched.schoolId) && i.status !== 'paid'
        );
        setStudentInvoices(theirInvoices);
        const debt = theirInvoices.reduce((acc, inv) => acc + (inv.remainingBalance ?? (inv.totalAmount || 0)), 0);
        setTotalDebt(debt);
        setAdvancePaymentBalance(advBal);
        
        // Auto-select the first invoice if none selected
        if (theirInvoices.length > 0 && !payInvoiceNumber) {
          setPayInvoiceNumber(theirInvoices[0].invoiceNumber);
        }
      });
    } else {
      setSelectedStudent(null);
      setStudentInvoices([]);
      setTotalDebt(0);
      setAdvancePaymentBalance(0);
    }
  }, [payStudentSearch, liveStudents]);

  const targetInvoice = useMemo(() => {
    return studentInvoices.find(i => i.invoiceNumber === payInvoiceNumber) || null;
  }, [payInvoiceNumber, studentInvoices]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      const matchQuery = !query ||
        r.receiptNumber.toLowerCase().includes(query.toLowerCase()) ||
        r.studentName.toLowerCase().includes(query.toLowerCase()) ||
        (r.referenceNumber && r.referenceNumber.toLowerCase().includes(query.toLowerCase()));
      const matchMethod = methodFilter === 'all' || r.paymentMethod === methodFilter;
      return matchQuery && matchMethod;
    });
  }, [receipts, query, methodFilter]);

  const activeFiltersCount = methodFilter !== 'all' ? 1 : 0;

  const handleClearFilters = () => {
    setMethodFilter('all');
    setQuery('');
    toast.success('Payment filters reset.');
  };

  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payAmount || '0');

    if (!selectedStudent) {
      toast.error('Please select a valid registered student to post ledger entry.');
      return;
    }

    if (!targetInvoice) {
      toast.error('Please select or assign a valid invoice to record payment.');
      return;
    }

    const invoiceRemaining = targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0;
    const walletApplied = (useWallet && advancePaymentBalance > 0)
      ? Math.min(advancePaymentBalance, invoiceRemaining)
      : 0;

    // Validation: Total payment must be greater than zero
    if (amountNum + walletApplied <= 0) {
      toast.error("Payment amount must be greater than zero.");
      return;
    }

    try {
      // ── COMBINED / WALLET PAYMENT path: use atomic combined-payment endpoint ──
      if (walletApplied > 0) {
        const { default: axios } = await import('axios');
        const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';

        const res = await axios.post(`${strapiUrl}/api/finance-receipts/combined-payment`, {
          invoiceId: targetInvoice.documentId || targetInvoice.id,
          walletAmount: walletApplied,
          cashAmount: amountNum,
          paymentMethod: payMethod,
          currency: payCurrency,
        });

        const data = res.data;
        toast.success(`✅ Receipt ${data.receiptNumber} posted successfully!`);
        
        if (walletApplied > 0) {
          toast.success(`💰 Applied $${walletApplied.toFixed(2)} from student's Advance Wallet.`);
        }
        if (amountNum > 0) {
          toast.success(`💵 Received $${amountNum.toFixed(2)} via ${payMethod}.`);
        }

        setAdvancePaymentBalance(Number(data.newAdvanceBalance ?? 0));

        // Re-fetch invoices and load data
        const allInvoices = await financeService.getInvoices();
        const theirInvoices = allInvoices.filter(i =>
          (i.student?.id === selectedStudent.id || i.student?.schoolId === selectedStudent.schoolId) && i.status !== 'paid'
        );
        setStudentInvoices(theirInvoices);
        const newDebt = theirInvoices.reduce((acc, inv) => acc + (inv.remainingBalance ?? (inv.totalAmount || 0)), 0);
        setTotalDebt(newDebt);

      } else {
        // ── Standard payment path (no wallet applied) ─────────────────────────
        const invoiceCurrency = targetInvoice?.invoiceCurrency?.code || 'USD';
        const rateToInvoice = payCurrency === invoiceCurrency ? 1 : parseFloat(exchangeRate || '1');
        const amountInInvoiceCurrency = amountNum * rateToInvoice;
        const overpaymentInPayCurrency = targetInvoice
          ? Math.max(0, amountInInvoiceCurrency - invoiceRemaining) / rateToInvoice
          : amountNum;

        const { receipt } = await financeService.postPaymentReceipt({
          invoice: targetInvoice ? (targetInvoice.documentId || targetInvoice.id as any) : undefined,
          student: (selectedStudent.documentId || selectedStudent.id) as any,
          receiptNumber: `RCP-2026-${Math.floor(Math.random() * 100000)}`,
          paymentAmount: amountNum,
          exchangeRateToInvoice: rateToInvoice,
          exchangeRateToBase: payCurrency === 'USD' ? 1 : 1,
          baseAmount: amountNum,
          paymentMethod: payMethod as any,
          providerTransactionId: payReference,
          paymentDate: new Date().toISOString() as any,
          status: 'completed' as any
        });

        toast.success(`✅ Receipt ${receipt.receiptNumber} posted successfully!`);

        if (overpaymentInPayCurrency > 0.005) {
          toast.success(
            `💰 $${overpaymentInPayCurrency.toFixed(2)} excess credited to ${selectedStudent.firstName || 'Student'}'s Advance Payment Wallet!`,
            { duration: 6000 }
          );
        }

        // Re-fetch invoices and wallet balance
        const [allInvoices, newAdvBal] = await Promise.all([
          financeService.getInvoices(),
          erpService.getStudentAdvanceBalance(selectedStudent.id)
        ]);

        const theirInvoices = allInvoices.filter(i =>
          (i.student?.id === selectedStudent.id || i.student?.schoolId === selectedStudent.schoolId) && i.status !== 'paid'
        );
        setStudentInvoices(theirInvoices);
        const newDebt = theirInvoices.reduce((acc, inv) => acc + (inv.remainingBalance ?? (inv.totalAmount || 0)), 0);
        setTotalDebt(newDebt);
        setAdvancePaymentBalance(newAdvBal);
      }

      setShowPayModal(false);
      loadData();
      // Reset Form
      setPayStudentSearch('');
      setPayInvoiceNumber('');
      setPayAmount('');
      setPayReference('');
      setPayBankOrOperator('');
      setPayCurrency('USD');
      setExchangeRate('1');
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to post payment settlement.';
      toast.error(msg);
    }
  };

  const totalCollected = useMemo(() => receipts.reduce((s, r) => s + r.amount, 0), [receipts]);
  const bankTotal = useMemo(() => receipts.filter(r => r.paymentMethod === 'Bank Transfer' || r.paymentMethod === 'Cheque').reduce((s, r) => s + r.amount, 0), [receipts]);
  const mobileTotal = useMemo(() => receipts.filter(r => r.paymentMethod.includes('Money') || r.paymentMethod.includes('Mobile') || r.paymentMethod === 'Wave Mobile').reduce((s, r) => s + r.amount, 0), [receipts]);
  const cashTotal = useMemo(() => receipts.filter(r => r.paymentMethod === 'Cash' || r.paymentMethod === 'Stripe Card').reduce((s, r) => s + r.amount, 0), [receipts]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'collections',
      title: 'Total Receipts & POS Collections',
      value: `$${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${receipts.length} verified transaction vouchers posted`,
      trendDirection: 'up',
      icon: <CreditCard className="w-5 h-5" />,
      onClick: () => toast.info('Displaying all cashier receipts and settlements.')
    },
    {
      id: 'bank',
      title: 'Commercial Bank & Wire Transfers',
      value: `$${bankTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Deposited directly to Account 1010',
      trendDirection: 'up',
      icon: <Landmark className="w-5 h-5 text-emerald-400" />,
      isActive: methodFilter === 'Bank Transfer',
      onClick: () => setMethodFilter(methodFilter === 'Bank Transfer' ? 'all' : 'Bank Transfer')
    },
    {
      id: 'mobile',
      title: 'Mobile Wallet Integrations',
      value: `$${mobileTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Instant mobile gateway deposits (Account 1020)',
      trendDirection: 'up',
      icon: <Smartphone className="w-5 h-5 text-sky-400" />,
      isActive: methodFilter === 'Orange Money',
      onClick: () => setMethodFilter(methodFilter === 'Orange Money' ? 'all' : 'Orange Money')
    },
    {
      id: 'cash',
      title: 'Campus Cash Drawer Collections',
      value: `$${cashTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Open Cashier Session: CSH-2026-088 (Reconciled)',
      trendDirection: 'neutral',
      icon: <PiggyBank className="w-5 h-5 text-amber-400" />,
      isActive: methodFilter === 'Cash',
      onClick: () => setMethodFilter(methodFilter === 'Cash' ? 'all' : 'Cash')
    }
  ];

  const columns = useMemo<ColumnDef<PaymentReceipt, any>[]>(() => {
    return [
      {
        accessorKey: 'receiptNumber',
        header: 'Receipt # & Invoice Ref',
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-black text-emerald-400 block">{r.receiptNumber}</span>
              <span className="text-[11px] text-slate-400 block font-mono">Inv: {r.invoiceNumber || 'INV-GENERAL'}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'studentName',
        header: 'Student Scholar & Parent Sponsor',
        cell: ({ row }) => {
          const r = row.original;
          const sName = r.studentName || (r.student ? `${r.student.firstName || ''} ${r.student.lastName || ''}`.trim() : 'Unknown Scholar');
          const sId = r.studentId || r.student?.schoolId || 'N/A';
          const pName = r.parentName || 'N/A';
          return (
            <div className="space-y-0.5 text-xs">
              <span className="font-bold text-white block truncate max-w-xs">
                {sName} <span className="font-mono text-[10px] text-sky-400">({sId})</span>
              </span>
              <span className="text-[11px] text-slate-400 block truncate max-w-xs">Parent: {pName}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Payment Method & Gateway Ref',
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-slate-200">
              {row.original.paymentMethod.includes('Bank') && <Landmark className="w-3.5 h-3.5 text-emerald-400" />}
              {row.original.paymentMethod.includes('Money') && <Smartphone className="w-3.5 h-3.5 text-sky-400" />}
              {row.original.paymentMethod.includes('Wave') && <Smartphone className="w-3.5 h-3.5 text-blue-400" />}
              {row.original.paymentMethod === 'Cash' && <PiggyBank className="w-3.5 h-3.5 text-amber-400" />}
              <span>{row.original.paymentMethod}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 block truncate max-w-xs">{row.original.referenceNumber || row.original.bankName}</span>
          </div>
        )
      },
      {
        accessorKey: 'paymentDate',
        header: 'Date & Cashier',
        cell: ({ row }) => (
          <div className="space-y-0.5 font-mono text-[11px]">
            <span className="text-slate-300 block font-bold">{row.original.paymentDate.split('T')[0]}</span>
            <span className="text-slate-400 block truncate max-w-xs">{row.original.cashierName}</span>
          </div>
        )
      },
      {
        accessorKey: 'amount',
        header: 'Revenue & Allocation ($)',
        cell: ({ row }) => {
          const r = row.original as any;
          const invAlloc = r.invoiceAllocation ?? r.amount ?? 0;
          const wAlloc = r.walletAllocation ?? r.paymentMetadata?.walletAmount ?? 0;
          const overpay = r.walletCreditGenerated ?? r.paymentMetadata?.overpayment ?? 0;

          return (
            <div className="space-y-0.5 font-mono text-xs">
              <span className="font-black text-emerald-400 block" title="Allocated Revenue">
                +${invAlloc.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              {(wAlloc > 0 || overpay > 0) && (
                <div className="text-[10px] text-slate-400 space-y-0.2">
                  {wAlloc > 0 && <span className="block text-sky-400">Wallet Used: ${wAlloc.toFixed(2)}</span>}
                  {overpay > 0 && <span className="block text-amber-400">Overpay Credit: ${overpay.toFixed(2)}</span>}
                </div>
              )}
            </div>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Verify QR & Print',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowQrModal(row.original)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>QR Verify</span>
            </button>
            <button
              onClick={() => {
                printReceiptDocument(row.original);
              }}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Multi-Method Cashier Payment Console & POS"
      description="Process and reconcile multi-currency payments across banking, mobile wallets, and campus drawer."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Payments' }]}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/reports"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            Reconciliation Required: 2
          </Link>
          <button
            onClick={() => setShowPayModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>
      }
    >
      {/* Dynamic KPI Dashboard */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Invoices Console</span>
        </Link>
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Multi-Method Cashier & POS</span>
        </Link>
        <Link href="/finance/billing/statements" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Student Statements</span>
        </Link>

        <button
          onClick={handleRunE2EVerification}
          disabled={verifyingE2E}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
        >
          <CheckCircle2 className={`w-3.5 h-3.5 ${verifyingE2E ? 'animate-spin' : ''}`} />
          <span>{verifyingE2E ? 'Testing E2E Scenario...' : 'Run E2E Reconciliation Test'}</span>
        </button>
      </div>

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search receipts by sequence (RCP-2026-XXXX), scholar name, or reference number..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Receipt ledger synced with bank reconciliation feeds.');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
        createButtonLabel="+ Record Payment"
        onCreate={() => setShowPayModal(true)}
        customFilterNodes={
          <div className="flex items-center gap-2">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              aria-label="Filter payments by method"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All Payment Methods</option>
              <option value="Bank Transfer">Bank Transfer & Wire</option>
              <option value="Orange Money">Orange Money Mobile</option>
              <option value="Cash">Cash Deposit / Drawer</option>
              <option value="Stripe Card">Stripe / POS Terminal</option>
            </select>
          </div>
        }
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredReceipts}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedReceipt(row)}
        onRowClick={(row) => setSelectedReceipt(row)}
        onRowEdit={(row) => setSelectedReceipt(row)}
        emptyStateProps={{
          title: 'No Payment Receipts Found',
          description: 'No payment transactions match your search query or payment method filter.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: 'Record New Payment',
          onCreate: () => setShowPayModal(true)
        }}
      />

      {/* Advanced Record Payment & Settlement Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Record Advanced Cashier Payment</h3>
                  <p className="text-xs text-slate-400 font-mono">Ledger Reconciliation & Pre-payment Handler</p>
                </div>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm px-3 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostPayment} className="space-y-5">
              
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-sky-400 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> 1. Scholar Ledger Lookup
                  </label>
                  <input
                    list="student-list"
                    type="text"
                    required
                    placeholder="Search by student name or ID..."
                    value={payStudentSearch}
                    onChange={(e) => setPayStudentSearch(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-bold focus:outline-none focus:border-sky-500"
                  />
                  <datalist id="student-list">
                    {liveStudents.map(s => (
                      <option key={s.id} value={s.schoolId || s.studentId || s.name}>
                        {s.name} ({s.schoolId || s.studentId || 'N/A'})
                      </option>
                    ))}
                  </datalist>
                </div>

                {selectedStudent && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1.5">
                      <span className="text-slate-400">Selected Scholar Profile:</span>
                      <strong className="text-sky-400 font-mono text-right">
                        {selectedStudent.name} • {selectedStudent.schoolId || selectedStudent.studentId || 'N/A'}
                      </strong>
                    </div>

                    <div className={`grid gap-3 mt-1 ${advancePaymentBalance > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Active Debt</span>
                        <strong className={`block text-lg font-mono mt-1 ${totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          ${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </strong>
                        {totalDebt <= 0 && <span className="text-[10px] text-emerald-500 font-bold">✓ No outstanding balance</span>}
                      </div>
                      {advancePaymentBalance > 0 && (
                        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3">
                          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">💰 Advance Wallet</span>
                          <strong className="block text-lg font-mono text-emerald-300 mt-1">
                            +${advancePaymentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </strong>
                          {targetInvoice && advancePaymentBalance > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const remaining = targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0;
                                setUseWallet(true);
                                if (advancePaymentBalance >= remaining) {
                                  setPayAmount('0');
                                } else {
                                  setPayAmount((remaining - advancePaymentBalance).toFixed(2));
                                }
                              }}
                              className="mt-1.5 text-[10px] font-bold text-emerald-300 hover:text-white bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/40 px-2 py-0.5 rounded transition-colors cursor-pointer"
                            >
                              Apply to Invoice →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Target Invoice (Optional)</label>
                  <select
                    value={payInvoiceNumber}
                    onChange={(e) => {
                      const invNo = e.target.value;
                      setPayInvoiceNumber(invNo);
                      const inv = studentInvoices.find(i => i.invoiceNumber === invNo);
                      if (inv) {
                        const bal = inv.remainingBalance ?? (inv.totalAmount || 0);
                        // If we are applying wallet, default external payment to the difference or the full balance
                        const walletAppliedVal = useWallet ? Math.min(advancePaymentBalance, bal) : 0;
                        setPayAmount(Math.max(0, bal - walletAppliedVal).toString());
                        setPayCurrency(inv.invoiceCurrency?.code || 'USD');
                      } else {
                        setPayAmount('');
                        setPayCurrency('USD');
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">General Advance Deposit (No Invoice)</option>
                    {studentInvoices.map(inv => (
                      <option key={inv.id} value={inv.invoiceNumber}>
                        {inv.invoiceNumber} (${(inv.remainingBalance ?? inv.totalAmount).toLocaleString()} - {inv.invoiceCurrency?.code || 'USD'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    {useWallet && targetInvoice && advancePaymentBalance > 0 ? 'Additional Cash/External Amount' : 'Payment Amount'} ({payCurrency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required={!(useWallet && targetInvoice && advancePaymentBalance >= (targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0))}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-sm font-mono font-black focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethodType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Bank Transfer">Bank Transfer / Wire</option>
                    <option value="Orange Money">Orange Money Mobile Wallet</option>
                    <option value="MTN Money">MTN Mobile Money</option>
                    <option value="Wave Mobile">Wave Mobile Money</option>
                    <option value="Cash">Cash Deposit (Campus Drawer)</option>
                    <option value="Stripe Card">Stripe / Credit Card POS</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Payment Currency</label>
                  <select
                    value={payCurrency}
                    onChange={(e) => setPayCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="LRD">LRD (L$)</option>
                    <option value="EUR">EUR (€)</option>
                    {liveCurrencies.map(c => (
                      <option key={c.id} value={c.currencyCode}>{c.currencyCode}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Gateway Trans ID / Bank</label>
                  <input
                    type="text"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Real-time Wallet Allocation Calculator & Breakdown */}
              {targetInvoice && advancePaymentBalance > 0 && (
                <div className="bg-slate-950/80 border border-emerald-500/20 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top duration-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Wallet Allocation Calculator</span>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={useWallet}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setUseWallet(val);
                          const remaining = targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0;
                          const applied = val ? Math.min(advancePaymentBalance, remaining) : 0;
                          setPayAmount(Math.max(0, remaining - applied).toString());
                        }}
                        className="rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>Apply Wallet Balance</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Invoice Amount</span>
                      <strong className="text-slate-200 text-sm">
                        ${(targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0).toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-500 font-bold block uppercase">Wallet Applied</span>
                      <strong className="text-emerald-400 text-sm">
                        -${((useWallet ? Math.min(advancePaymentBalance, targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0) : 0)).toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-500 font-bold block uppercase">Remaining Due</span>
                      <strong className="text-amber-400 text-sm">
                        ${Math.max(0, (targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0) - (useWallet ? Math.min(advancePaymentBalance, targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0) : 0)).toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold block uppercase">Cash/External Received</span>
                      <strong className="text-emerald-300 text-sm">
                        ${(parseFloat(payAmount || '0')).toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-sky-400 font-bold block uppercase">Change/Refund</span>
                      <strong className="text-sky-300 text-sm">
                        ${Math.max(0, parseFloat(payAmount || '0') - Math.max(0, (targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0) - (useWallet ? Math.min(advancePaymentBalance, targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0) : 0))).toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-500 font-bold block uppercase">Outstanding Balance</span>
                      <strong className="text-rose-400 text-sm">
                        ${Math.max(0, Math.max(0, (targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0) - (useWallet ? Math.min(advancePaymentBalance, targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0) : 0)) - parseFloat(payAmount || '0')).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Currency Conversion Module */}
              {payInvoiceNumber && targetInvoice && (targetInvoice.invoiceCurrency?.code || 'USD') !== payCurrency && (
                <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top duration-200">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Currency Conversion Calculator</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Exchange Rate</label>
                      <input
                        type="number"
                        step="0.0001"
                        required
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                        1 {payCurrency} = {exchangeRate} {targetInvoice.invoiceCurrency?.code || 'USD'}
                      </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Settlement Value Applied to Invoice</span>
                      <strong className="block text-sm font-mono text-emerald-400 mt-1">
                        {(parseFloat(payAmount || '0') * parseFloat(exchangeRate || '1')).toLocaleString('en-US', { minimumFractionDigits: 2 })} {targetInvoice.invoiceCurrency?.code || 'USD'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Double-Entry Accounting Ledger Preview</span>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {(() => {
                    const remaining = targetInvoice ? (targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0) : 0;
                    const applied = (useWallet && targetInvoice && advancePaymentBalance > 0) ? Math.min(advancePaymentBalance, remaining) : 0;
                    const cash = parseFloat(payAmount || '0');
                    return (
                      <>
                        {applied > 0 && (
                          <>
                            <strong>DEBIT:</strong> Account 2100 (Advance Wallet Liability) (+${applied.toFixed(2)} USD)
                            <br />
                          </>
                        )}
                        {cash > 0 && (
                          <>
                            <strong>DEBIT:</strong> Account {payMethod === 'Cash' ? '1030 (Cash Drawer)' : payMethod.includes('Money') ? '1020 (Mobile Wallets)' : '1010 (Commercial Bank)'} (+${cash.toFixed(2)} {payCurrency})
                            <br />
                          </>
                        )}
                        <strong>CREDIT:</strong> Account 1200 (Accounts Receivable) (+${Math.min(applied + cash, remaining).toFixed(2)} {targetInvoice?.invoiceCurrency?.code || payCurrency})
                      </>
                    );
                  })()}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30"
                >
                  Post Ledger Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code & Public Verification Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowQrModal(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-emerald-400">{showQrModal.receiptNumber}</span>
              <button onClick={() => setShowQrModal(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                  showQrModal.qrPayloadUrl || `${window.location.origin}/verify/receipt/${showQrModal.receiptNumber}`
                )}`}
                alt="Verification QR Code"
                className="w-40 h-40 object-contain rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Public Verification QR Code</h3>
              <p className="text-xs text-slate-400">Scan to verify cryptographic receipt authenticity on YAHAYASCOOL Verification Portal</p>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl mt-3 text-[11px] font-mono text-emerald-400 break-all">
                {showQrModal.qrPayloadUrl}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left bg-slate-950/60 p-3 rounded-xl text-xs border border-slate-800/80">
              <div>
                <span className="text-slate-400 block text-[11px]">Scholar Name:</span>
                <strong className="text-white block truncate">{showQrModal.studentName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Amount Settled:</span>
                <strong className="text-emerald-400 font-mono block">${showQrModal.amount.toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Payment Method:</span>
                <strong className="text-slate-200 block">{showQrModal.paymentMethod}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Verification Code:</span>
                <strong className="text-sky-400 font-mono block text-[11px]">{showQrModal.verificationCode}</strong>
              </div>
            </div>

            <button
              onClick={() => {
                toast.success(`Sent verification receipt link for ${showQrModal.studentName} via SMS / WhatsApp.`);
                setShowQrModal(null);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-md"
            >
              Share via WhatsApp / Email →
            </button>
          </div>
        </div>
      )}

      {/* E2E Accounting Scenario Verification Modal */}
      {showE2EModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">E2E Accounting Integrity Suite</h3>
                  <p className="text-xs text-slate-400 font-mono">Mandatory $10,016 Accounting Scenario Execution</p>
                </div>
              </div>
              <button
                onClick={() => setShowE2EModal(false)}
                className="text-slate-400 hover:text-white font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            {verifyingE2E ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-xs font-bold font-mono">Executing 7-Step Accounting Scenario & Assertion Guards...</p>
              </div>
            ) : e2eResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl border ${e2eResult.success ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
                  <strong className="text-sm font-black uppercase tracking-wider block mb-1">
                    {e2eResult.success ? '✅ MANDATORY E2E SCENARIO PASSED 100%' : '❌ E2E SCENARIO FAILED'}
                  </strong>
                  <p className="text-xs">{e2eResult.message || e2eResult.error}</p>
                </div>

                {e2eResult.summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">TOTAL INVOICED</span>
                      <strong className="text-white text-sm">${Number(e2eResult.summary.totalInvoiced).toFixed(2)}</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">COLLECTED REVENUE</span>
                      <strong className="text-emerald-400 text-sm">${Number(e2eResult.summary.totalCollected).toFixed(2)}</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">OUTSTANDING DUE</span>
                      <strong className="text-slate-300 text-sm">${Number(e2eResult.summary.outstandingBalance).toFixed(2)}</strong>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">FINAL WALLET BAL</span>
                      <strong className="text-amber-400 text-sm">${Number(e2eResult.summary.finalWalletBalance).toFixed(2)}</strong>
                    </div>
                  </div>
                )}

                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-2">
                  <span className="text-xs font-bold text-slate-400 font-mono block">Step Execution Logs:</span>
                  <div className="font-mono text-[11px] space-y-1 text-slate-300 max-h-60 overflow-y-auto pr-2">
                    {e2eResult.logs?.map((l: string, i: number) => (
                      <p key={i} className={l.includes('PASSED') || l.includes('STEP') ? 'text-emerald-400 font-bold' : l.includes('FAILED') ? 'text-rose-400 font-bold' : ''}>
                        {l}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <SlideOutDrawer
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        record={selectedReceipt ? {
          name: selectedReceipt.studentName,
          id: selectedReceipt.receiptNumber,
          role: `RECEIPT FOR ${selectedReceipt.admissionNumber}`,
          status: selectedReceipt.status,
          email: `Cashier: ${selectedReceipt.cashierName}`,
          phone: selectedReceipt.paymentDate.split('T')[0],
          department: `Method: ${selectedReceipt.paymentMethod} | Ref: ${selectedReceipt.referenceNumber || 'N/A'}`,
          joinDate: selectedReceipt.verificationCode,
          balance: `$${selectedReceipt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} SETTLED (REMAINING DUE: $${selectedReceipt.remainingStudentBalance.toFixed(2)})`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

export default function CashierPaymentsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-white font-mono">Loading Payment Gateway...</div>}>
      <CashierPaymentsContent />
    </Suspense>
  );
}

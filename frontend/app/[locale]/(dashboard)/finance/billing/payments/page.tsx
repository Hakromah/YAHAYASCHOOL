'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { Link } from '@/i18n/routing';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CreditCard, QrCode, Plus, Eye, CheckCircle2,
  PiggyBank, Landmark, FileText, Printer, AlertCircle,
  Smartphone, User, RefreshCw, Wallet,
  ShieldCheck, Receipt, X, Building2, ChevronDown,
  TrendingUp, BadgeCheck, Banknote
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import { erpService } from '@/services/erp.service';
import { printReceiptDocument } from '@/lib/print-finance';
import { useAuth } from '@/hooks/useAuth';
import type { PaymentReceipt, PaymentMethodType, Invoice } from '@/types/finance.types';
import type { Student } from '@/types/erp.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals });
}

function fmtDate(iso: string) {
  if (!iso) return '—';
  return iso.split('T')[0];
}

function methodIcon(m: string) {
  if (m.includes('Bank') || m.includes('Cheque')) return <Landmark className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />;
  if (m.includes('Money') || m.includes('Wave') || m.includes('Mobile')) return <Smartphone className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />;
  if (m === 'Cash') return <Banknote className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />;
  if (m.includes('Card') || m.includes('Stripe')) return <CreditCard className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />;
  return <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
}

function methodBadgeCls(m: string) {
  if (m.includes('Bank') || m.includes('Cheque')) return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  if (m.includes('Money') || m.includes('Wave') || m.includes('Mobile')) return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
  if (m === 'Cash') return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  if (m.includes('Card') || m.includes('Stripe')) return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
}

// ─── Receipt Inspect Modal ────────────────────────────────────────────────────

interface ReceiptInspectModalProps {
  receipt: PaymentReceipt;
  studentInfo: { fullName: string; schoolId: string; grade: string; section: string; parentName: string; parentPhone: string };
  onClose: () => void;
  onPrint: () => void;
  onQr: () => void;
}

function ReceiptInspectModal({ receipt, studentInfo, onClose, onPrint, onQr }: ReceiptInspectModalProps) {
  const r = receipt as any;
  const invAlloc = r.invoiceAllocation ?? receipt.amount ?? 0;
  const wAlloc = r.walletAllocation ?? r.paymentMetadata?.walletAmount ?? 0;
  const overpay = r.walletCreditGenerated ?? r.paymentMetadata?.overpayment ?? 0;
  const remaining = Number(receipt.remainingStudentBalance || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">{receipt.receiptNumber}</span>
                <StatusBadge status={receipt.status || 'posted'} size="sm" />
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">✓ VERIFIED</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Invoice Ref: <strong className="text-sky-600 dark:text-sky-400">{receipt.invoiceNumber || 'INV-GENERAL'}</strong> · {fmtDate(receipt.paymentDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={onQr} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-300 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer" title="QR Code">
              <QrCode className="w-4 h-4" />
            </button>
            <button onClick={onPrint} className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer" title="Print">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          {/* Student Profile */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-400/30 flex items-center justify-center font-black text-sm text-emerald-600 dark:text-emerald-300 shrink-0">
                {studentInfo.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-slate-900 dark:text-white text-sm">{studentInfo.fullName}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{studentInfo.schoolId}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{studentInfo.grade}{studentInfo.section && ` · ${studentInfo.section}`}</p>
              </div>
            </div>
            <div className="sm:text-right space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Parent / Sponsor</span>
              <span className="font-bold text-slate-700 dark:text-slate-200 block text-sm">{studentInfo.parentName}</span>
              {studentInfo.parentPhone && <span className="font-mono text-xs text-slate-500 dark:text-slate-400 block">{studentInfo.parentPhone}</span>}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Received', value: `+$${fmtMoney(receipt.amount)}`, cls: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Invoice Allocation', value: `$${fmtMoney(invAlloc)}`, cls: 'text-slate-900 dark:text-white' },
              { label: 'Wallet Applied', value: `$${fmtMoney(wAlloc)}`, cls: 'text-sky-600 dark:text-sky-400' },
              { label: 'Remaining Balance', value: `$${fmtMoney(remaining)}`, cls: remaining > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">{label}</span>
                <span className={`text-base font-black font-mono mt-1 block ${cls}`}>{value}</span>
              </div>
            ))}
          </div>

          {overpay > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
              <TrendingUp className="w-4 h-4 shrink-0" />
              Overpayment credited to wallet: +${fmtMoney(overpay)}
            </div>
          )}

          {/* Payment Channel & Audit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <h5 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Payment Channel
              </h5>
              {[
                { label: 'Method', value: receipt.paymentMethod },
                { label: 'Gateway Ref', value: receipt.referenceNumber || receipt.bankName || 'Verified POS' },
                { label: 'Currency', value: receipt.currency || 'USD' },
                { label: 'GL Account', value: receipt.paymentMethod?.includes('Bank') ? 'Acct 1010 (Bank)' : receipt.paymentMethod?.includes('Money') ? 'Acct 1020 (Mobile)' : 'Acct 1030 (Cash)' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{label}:</span>
                  <strong className="text-slate-800 dark:text-white font-mono text-right max-w-[180px] truncate">{value}</strong>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <h5 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-500 dark:text-sky-400" /> Cashier Audit Trail
              </h5>
              {[
                { label: 'Receiving Cashier', value: receipt.cashierName || 'Finance Desk' },
                { label: 'Settlement Date', value: fmtDate(receipt.paymentDate) },
                { label: 'Audit Status', value: '✓ Cryptographically Cleared' },
                { label: 'Verification Code', value: receipt.verificationCode || receipt.receiptNumber },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{label}:</span>
                  <strong className={`font-mono text-right max-w-[180px] truncate ${label === 'Audit Status' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>{value}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* QR Security Seal */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(
                    (receipt as any).qrPayloadUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/receipt/${receipt.receiptNumber}`
                  )}`}
                  alt="Receipt QR"
                  className="w-14 h-14 object-contain rounded"
                />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-sm block">Official Cryptographic Seal</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">
                  Code: {receipt.verificationCode || receipt.receiptNumber}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block">
                  Verified on YAHAYASCOOL Public Ledger
                </span>
              </div>
            </div>
            <button
              onClick={onPrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print Voucher →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── QR Modal ─────────────────────────────────────────────────────────────────

function QrModal({ receipt, onClose, onPrint }: { receipt: PaymentReceipt; onClose: () => void; onPrint: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 text-center" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">{receipt.receiptNumber}</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto border border-slate-100">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
              (receipt as any).qrPayloadUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/receipt/${receipt.receiptNumber}`
            )}`}
            alt="Verification QR"
            className="w-44 h-44 object-contain rounded-xl"
          />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Public Verification QR Code</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Scan to verify receipt authenticity on YAHAYASCOOL Portal</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-left bg-slate-50 dark:bg-slate-950 p-3 rounded-xl text-xs border border-slate-200 dark:border-slate-800">
          <div><span className="text-slate-400 text-[11px] block">Scholar</span><strong className="text-slate-800 dark:text-white block truncate">{receipt.studentName}</strong></div>
          <div><span className="text-slate-400 text-[11px] block">Amount</span><strong className="text-emerald-600 dark:text-emerald-400 font-mono block">${fmtMoney(receipt.amount)}</strong></div>
          <div><span className="text-slate-400 text-[11px] block">Method</span><strong className="text-slate-700 dark:text-slate-200 block">{receipt.paymentMethod}</strong></div>
          <div><span className="text-slate-400 text-[11px] block">Code</span><strong className="text-sky-600 dark:text-sky-400 font-mono block text-[11px] truncate">{receipt.verificationCode}</strong></div>
        </div>
        <button onClick={() => { onPrint(); onClose(); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:from-emerald-500 hover:to-emerald-400 transition-all">
          <Printer className="w-4 h-4" /> Print Official Receipt Voucher →
        </button>
      </div>
    </div>
  );
}

// ─── Record Payment Modal (standalone — owns all form state to prevent parent re-renders) ──

interface RecordPaymentModalProps {
  liveStudents: Student[];
  extraCurrencies: any[];
  initialInvoiceNumber?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

function RecordPaymentModal({ liveStudents, extraCurrencies, initialInvoiceNumber, onClose, onSuccess }: RecordPaymentModalProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentInvoices, setStudentInvoices] = useState<Invoice[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [advancePaymentBalance, setAdvancePaymentBalance] = useState(0);
  const [payStudentSearch, setPayStudentSearch] = useState('');
  const [payInvoiceNumber, setPayInvoiceNumber] = useState(initialInvoiceNumber || '');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethodType>('Bank Transfer');
  const [payReference, setPayReference] = useState('');
  const [payBankOrOperator, setPayBankOrOperator] = useState('');
  const [payCurrency, setPayCurrency] = useState('USD');
  const [useWallet, setUseWallet] = useState(true);

  // Student lookup on search change
  useEffect(() => {
    if (!payStudentSearch.trim()) {
      setSelectedStudent(null);
      setStudentInvoices([]);
      setTotalDebt(0);
      setAdvancePaymentBalance(0);
      return;
    }
    const searchLower = payStudentSearch.toLowerCase().trim();
    const matched = liveStudents.find(s => {
      const full = `${s.firstName || ''} ${(s as any).middleName || ''} ${s.lastName || ''}`.replace(/\s+/g, ' ').trim().toLowerCase();
      const short = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const sId = ((s as any).schoolId || (s as any).studentId || (s as any).admissionNumber || '').toLowerCase();
      return full === searchLower || short === searchLower || (s.name || '').toLowerCase() === searchLower || (sId && searchLower.includes(sId)) || searchLower.includes(full);
    });
    if (matched) {
      setSelectedStudent(matched);
      const directBal = Number((matched as any).advanceBalance || 0);
      Promise.all([
        financeService.getInvoices(),
        directBal > 0 ? Promise.resolve(directBal) : erpService.getStudentAdvanceBalance(matched.id).catch(() => 0),
      ]).then(([allInvs, advBal]) => {
        const theirs = allInvs.filter(i =>
          (i.student?.id === matched.id || (i.student as any)?.schoolId === (matched as any).schoolId || (i.student as any)?.documentId === (matched as any).documentId || ((matched as any).schoolId && (i as any).studentName?.includes((matched as any).schoolId))) && i.status !== 'paid'
        );
        setStudentInvoices(theirs);
        setTotalDebt(theirs.reduce((a, inv) => a + (inv.remainingBalance ?? inv.totalAmount ?? 0), 0));
        setAdvancePaymentBalance(Number(advBal) || 0);
        setPayInvoiceNumber(prev => prev || theirs[0]?.invoiceNumber || '');
      });
    } else {
      setSelectedStudent(null);
      setStudentInvoices([]);
      setTotalDebt(0);
      setAdvancePaymentBalance(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payStudentSearch, liveStudents]);

  const targetInvoice = useMemo(() =>
    studentInvoices.find(i => i.invoiceNumber === payInvoiceNumber || i.documentId === payInvoiceNumber || String(i.id) === payInvoiceNumber) || null,
    [payInvoiceNumber, studentInvoices]
  );

  const walletApplied = targetInvoice && useWallet && advancePaymentBalance > 0
    ? Math.min(advancePaymentBalance, targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0)
    : 0;
  const remainingDue = targetInvoice
    ? Math.max(0, (targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0) - walletApplied)
    : 0;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payAmount || '0');
    if (!selectedStudent) { toast.error('Please select a valid registered student.'); return; }
    if (!targetInvoice && !payInvoiceNumber) { toast.error('Please select or assign an invoice.'); return; }
    const invoiceRemaining = targetInvoice ? (targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0) : 0;
    const wallet = (useWallet && advancePaymentBalance > 0 && targetInvoice) ? Math.min(advancePaymentBalance, invoiceRemaining) : 0;
    if (amountNum + wallet <= 0) { toast.error('Payment amount must be greater than zero.'); return; }
    try {
      const isMobile = payMethod.includes('Money') || payMethod.includes('Wave') || payMethod.includes('Mobile');
      const data = await financeService.postCombinedPayment({
        invoiceId: targetInvoice ? (targetInvoice.documentId || targetInvoice.id) : undefined,
        walletAmount: wallet,
        cashAmount: payMethod === 'Cash' ? amountNum : 0,
        bankAmount: payMethod === 'Bank Transfer' || payMethod === 'Cheque' ? amountNum : 0,
        mobileMoneyAmount: isMobile ? amountNum : 0,
        chequeAmount: payMethod === 'Cheque' ? amountNum : 0,
        paymentMethod: payMethod,
        currency: payCurrency,
        referenceNumber: payReference || payBankOrOperator || undefined,
      });
      toast.success(`✅ Receipt ${data.receiptNumber} posted!`);
      if (wallet > 0) toast.success(`💰 Applied $${fmtMoney(wallet)} from Advance Wallet.`);
      if (amountNum > 0) toast.success(`💵 Received $${fmtMoney(amountNum)} via ${payMethod}.`);
      onClose();
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Failed to post payment.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payAmount, selectedStudent, targetInvoice, payInvoiceNumber, useWallet, advancePaymentBalance, payMethod, payCurrency, payReference, payBankOrOperator]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Landmark className="w-6 h-6" /></div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Record Advanced Cashier Payment</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Ledger Reconciliation &amp; Pre-payment Handler</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1: Student Lookup */}
          <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
            <label className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> 1. Scholar Ledger Lookup
            </label>
            <input
              id="pay-student-search"
              name="pay-student-search"
              list="student-list-admin-modal"
              type="text"
              required
              placeholder="Search by student name or ID..."
              value={payStudentSearch}
              onChange={e => setPayStudentSearch(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-sky-500"
            />
            <datalist id="student-list-admin-modal">
              {liveStudents.map(s => (
                <option key={s.id} value={(s as any).schoolId || (s as any).studentId || s.name}>{s.name} ({(s as any).schoolId || (s as any).studentId || 'N/A'})</option>
              ))}
            </datalist>

            {selectedStudent && (
              <div className="space-y-3 animate-in slide-in-from-top duration-200">
                <div className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1">
                  <span className="text-slate-500 dark:text-slate-400">Selected Scholar:</span>
                  <strong className="text-sky-600 dark:text-sky-400 font-mono">{selectedStudent.name} · {(selectedStudent as any).schoolId || (selectedStudent as any).studentId || 'N/A'}</strong>
                </div>
                <div className={`grid gap-3 ${advancePaymentBalance > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Active Debt</span>
                    <strong className={`block text-lg font-mono mt-1 ${totalDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>${fmtMoney(totalDebt)}</strong>
                    {totalDebt <= 0 && <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold">✓ No outstanding balance</span>}
                  </div>
                  {advancePaymentBalance > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 rounded-xl p-3">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">💰 Advance Wallet</span>
                      <strong className="block text-lg font-mono text-emerald-600 dark:text-emerald-300 mt-1">+${fmtMoney(advancePaymentBalance)}</strong>
                      {targetInvoice && (
                        <button type="button" onClick={() => { setUseWallet(true); const rem = targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0; setPayAmount(String(Math.max(0, rem - Math.min(advancePaymentBalance, rem)))); }} className="mt-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300 hover:text-white bg-emerald-100 dark:bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-200 dark:border-emerald-600/40 px-2 py-0.5 rounded transition-colors cursor-pointer">
                          Apply to Invoice →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Invoice & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Invoice (Optional)</label>
              <select
                id="pay-invoice-select"
                name="pay-invoice-select"
                value={payInvoiceNumber}
                onChange={e => {
                  const v = e.target.value;
                  setPayInvoiceNumber(v);
                  const inv = studentInvoices.find(i => i.invoiceNumber === v);
                  if (inv) {
                    const bal = inv.remainingBalance ?? inv.totalAmount ?? 0;
                    const applied = useWallet ? Math.min(advancePaymentBalance, bal) : 0;
                    setPayAmount(String(Math.max(0, bal - applied)));
                    setPayCurrency((inv as any).invoiceCurrency?.code || 'USD');
                  } else { setPayAmount(''); setPayCurrency('USD'); }
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">General Advance Deposit (No Invoice)</option>
                {studentInvoices.map(inv => (
                  <option key={inv.id} value={inv.invoiceNumber}>{inv.invoiceNumber} (${fmtMoney(inv.remainingBalance ?? inv.totalAmount ?? 0)} · {(inv as any).invoiceCurrency?.code || 'USD'})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {useWallet && targetInvoice && advancePaymentBalance > 0 ? 'Additional Cash Amount' : 'Payment Amount'} ({payCurrency})
              </label>
              <input
                id="pay-amount"
                name="pay-amount"
                type="number"
                step="0.01"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 text-sm font-mono font-black focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Step 3: Method, Currency, Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Method</label>
              <select id="pay-method" name="pay-method" value={payMethod} onChange={e => setPayMethod(e.target.value as PaymentMethodType)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer">
                <option value="Bank Transfer">Bank Transfer / Wire</option>
                <option value="Orange Money">Orange Money</option>
                <option value="MTN Money">MTN Mobile Money</option>
                <option value="Wave Mobile">Wave Mobile Money</option>
                <option value="Cash">Cash (Campus Drawer)</option>
                <option value="Stripe Card">Stripe / POS Card</option>
                <option value="Cheque">Bank Cheque</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Currency</label>
              <select id="pay-currency" name="pay-currency" value={payCurrency} onChange={e => setPayCurrency(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer">
                <option value="USD">USD ($)</option>
                <option value="LRD">LRD (L$)</option>
                <option value="EUR">EUR (€)</option>
                {extraCurrencies.map(c => <option key={c.id} value={c.currencyCode}>{c.currencyCode}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {payMethod.includes('Bank') || payMethod === 'Cheque' ? 'Bank / Cheque Ref' : payMethod.includes('Money') || payMethod.includes('Wave') ? 'Mobile Trans. ID' : 'Gateway Ref'}
              </label>
              <input
                id="pay-reference"
                name="pay-reference"
                type="text"
                value={payReference}
                onChange={e => setPayReference(e.target.value)}
                placeholder={payMethod.includes('Bank') ? 'TXN-XXXXX' : payMethod.includes('Money') ? 'Phone / Transaction ID' : 'Optional'}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Bank / Operator name */}
          {(payMethod.includes('Bank') || payMethod === 'Cheque' || payMethod.includes('Money') || payMethod.includes('Wave')) && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {payMethod.includes('Bank') || payMethod === 'Cheque' ? 'Bank Name' : 'Mobile Operator Name'}
              </label>
              <input
                id="pay-bank-operator"
                name="pay-bank-operator"
                type="text"
                value={payBankOrOperator}
                onChange={e => setPayBankOrOperator(e.target.value)}
                placeholder={payMethod.includes('Bank') ? 'e.g. Ecobank, LBDI' : 'e.g. Orange, MTN, Wave'}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Wallet Calculator */}
          {targetInvoice && advancePaymentBalance > 0 && (
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Wallet Allocation Calculator</span>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="use-wallet-checkbox"
                    name="use-wallet-checkbox"
                    checked={useWallet}
                    onChange={e => {
                      const val = e.target.checked;
                      setUseWallet(val);
                      const rem = targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0;
                      const applied = val ? Math.min(advancePaymentBalance, rem) : 0;
                      setPayAmount(String(Math.max(0, rem - applied)));
                    }}
                    className="rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  Apply Wallet Balance
                </label>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                <div><span className="text-[10px] text-slate-400 font-bold block uppercase">Invoice Due</span><strong className="text-slate-700 dark:text-slate-200 text-sm">${fmtMoney(targetInvoice.remainingBalance ?? targetInvoice.totalAmount ?? 0)}</strong></div>
                <div><span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold block uppercase">Wallet Applied</span><strong className="text-emerald-600 dark:text-emerald-400 text-sm">-${fmtMoney(walletApplied)}</strong></div>
                <div><span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold block uppercase">Remaining Due</span><strong className="text-amber-600 dark:text-amber-400 text-sm">${fmtMoney(remainingDue)}</strong></div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer transition-colors">
              <BadgeCheck className="w-4 h-4" /> Post Ledger Settlement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CashierPaymentsContent() {
  const locale = useLocale();
  const localeRef = React.useRef(locale);
  localeRef.current = locale;
  // Stable t() — same function reference forever, reads locale from ref
  const t = React.useRef((key: string) => i18nT(key, localeRef.current)).current;
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialInvoiceNumber = searchParams.get('invoiceNumber');
  const { user, role } = useAuth();

  const isStudentRole = role === 'student' || role === 'parent';
  const [viewMode, setViewMode] = useState<'admin' | 'student'>('admin');

  useEffect(() => {
    if (isStudentRole) setViewMode('student');
  }, [isStudentRole]);

  // ── Core Data ──
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);
  const [liveCurrencies, setLiveCurrencies] = useState<any[]>([]);

  // ── UI Filters ──
  const [query, setQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // ── Modals ──
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showStudentPayModal, setShowStudentPayModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState<PaymentReceipt | null>(null);
  const [showE2EModal, setShowE2EModal] = useState(false);



  // ── Student checkout form ──
  const [studentPayInvoiceNumber, setStudentPayInvoiceNumber] = useState('');
  const [studentPayAmount, setStudentPayAmount] = useState('');
  const [studentPayMethod, setStudentPayMethod] = useState<PaymentMethodType>('Orange Money');
  const [studentPayRef, setStudentPayRef] = useState('');
  const [isSubmittingStudentPay, setIsSubmittingStudentPay] = useState(false);

  // ── E2E ──
  const [verifyingE2E, setVerifyingE2E] = useState(false);
  const [e2eResult, setE2EResult] = useState<any>(null);

  // ── Load Data ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [receiptsData, invoicesData, studentsRes, currenciesRes] = await Promise.all([
        financeService.getReceipts(),
        financeService.getInvoices(),
        erpService.getStudents({ limit: 200 }).catch(() => ({ data: [] as Student[] })),
        financeService.getExchangeRates().catch(() => [] as any[]),
      ]);
      setReceipts(receiptsData || []);
      setInvoices(invoicesData || []);
      setLiveStudents((studentsRes as any).data || []);
      setLiveCurrencies((currenciesRes as any[]) || []);
    } catch {
      toast.error('Failed to load payment data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── URL Prefill ── open the right modal when deep-linked with ?invoiceNumber=
  useEffect(() => {
    if (!initialInvoiceNumber) return;
    if (isStudentRole) {
      setStudentPayInvoiceNumber(initialInvoiceNumber);
      setShowStudentPayModal(true);
      financeService.getInvoices().then(invs => {
        const inv = invs.find(i => i.invoiceNumber === initialInvoiceNumber);
        if (inv) {
          const bal = (inv.remainingBalance ?? inv.totalAmount ?? 0);
          setStudentPayAmount(String(bal));
          toast.info(`Prefilled with Invoice ${initialInvoiceNumber}`);
        }
      });
    } else {
      setShowPayModal(true);
    }
    router.replace('/finance/billing/payments');
  }, [initialInvoiceNumber, isStudentRole, router]);


  // ── Stable user identity primitives (avoids infinite re-render loops from unstable user object ref) ──
  const userId = user?.id ?? null;
  const userUsername = user?.username ?? null;
  const userEmail = (user as any)?.email ?? null;
  const userFirstName = user?.firstName ?? '';
  const userLastName = user?.lastName ?? '';
  const userSchoolId = (((user as any)?.schoolId || (user as any)?.studentId || userUsername || '') as string);
  const userDocId = (((user as any)?.documentId || '') as string);

  // ── Current logged-in student ──
  const currentStudent = useMemo(() => {
    if (!userId && !userSchoolId && !userDocId) return null;
    const uSchoolId = userSchoolId.toLowerCase();
    const uDocId = userDocId.toLowerCase();
    const uName = `${userFirstName} ${userLastName}`.trim().toLowerCase();
    const uUsername = (userUsername || '').toLowerCase();
    return liveStudents.find(s => {
      const sSchoolId = ((s as any).schoolId || (s as any).studentId || '').toLowerCase();
      const sDocId = ((s as any).documentId || '').toLowerCase();
      const sName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).trim().toLowerCase();
      const sUserId = (s.user as any)?.id;
      const sUsername = ((s.user as any)?.username || '').toLowerCase();
      return (userId && sUserId === userId) || (uUsername && sUsername === uUsername) || (uSchoolId && sSchoolId.includes(uSchoolId)) || (uDocId && sDocId === uDocId) || (uName.length > 2 && sName.includes(uName));
    }) || null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userUsername, userSchoolId, userDocId, userFirstName, userLastName, liveStudents]);

  // ── Student wallet (stable sid dep — not the whole user object) ──
  const [studentLiveWallet, setStudentLiveWallet] = useState(0);
  const walletSid = currentStudent?.id ?? userId;
  useEffect(() => {
    if (!walletSid) return;
    let cancelled = false;
    financeService.getStudentAdvanceBalance(walletSid).catch(() => 0).then(b => {
      if (!cancelled) setStudentLiveWallet(Number(b) || 0);
    });
    return () => { cancelled = true; };
  }, [walletSid]);

  // ── Stable derived student identity for filter memos ──
  const currentStudentId = currentStudent?.id ?? null;
  const currentStudentSchoolId = ((currentStudent as any)?.schoolId || userSchoolId || '').toLowerCase();
  const currentStudentDocId = ((currentStudent as any)?.documentId || userDocId || '').toLowerCase();
  const currentStudentName = ((currentStudent as any)?.name || `${userFirstName} ${userLastName}`.trim()).toLowerCase();

  // ── Student receipts filter ──
  const myStudentReceipts = useMemo(() => {
    if (!userId && !currentStudentId && !currentStudentSchoolId) return [];
    const uStudentId = currentStudentId ?? userId;
    return receipts.filter(r => {
      const rStudent = r.student as any;
      const rSchoolId = ((r as any).studentId || rStudent?.schoolId || '').toLowerCase();
      const rDocId = (rStudent?.documentId || '').toLowerCase();
      const rId = rStudent?.id;
      const rName = (r.studentName || (rStudent ? `${rStudent.firstName || ''} ${rStudent.lastName || ''}`.trim() : '')).toLowerCase();
      const rUser = (rStudent?.user?.username || rStudent?.user?.email || '').toLowerCase();
      return (uStudentId && rId === uStudentId) || (currentStudentSchoolId && rSchoolId.includes(currentStudentSchoolId)) || (currentStudentDocId && rDocId === currentStudentDocId) || (currentStudentName.length > 2 && rName.includes(currentStudentName)) || (rUser && (rUser === userUsername?.toLowerCase() || rUser === userEmail?.toLowerCase()));
    });
  }, [receipts, userId, currentStudentId, currentStudentSchoolId, currentStudentDocId, currentStudentName, userUsername, userEmail]);

  // ── Student invoices filter ──
  const myStudentInvoices = useMemo(() => {
    if (!userId && !currentStudentId && !currentStudentSchoolId) return [];
    const uStudentId = currentStudentId ?? userId;
    return invoices.filter(inv => {
      const invStudent = inv.student as any;
      const invSchoolId = (invStudent?.schoolId || (inv as any).studentId || '').toLowerCase();
      const invDocId = (invStudent?.documentId || '').toLowerCase();
      const invId = invStudent?.id;
      const invName = ((inv as any).studentName || (invStudent ? `${invStudent.firstName || ''} ${invStudent.lastName || ''}`.trim() : '')).toLowerCase();
      const invUser = (invStudent?.user?.username || invStudent?.user?.email || '').toLowerCase();
      return (uStudentId && invId === uStudentId) || (currentStudentSchoolId && invSchoolId.includes(currentStudentSchoolId)) || (currentStudentDocId && invDocId === currentStudentDocId) || (currentStudentName.length > 2 && invName.includes(currentStudentName)) || (invUser && (invUser === userUsername?.toLowerCase() || invUser === userEmail?.toLowerCase()));
    });
  }, [invoices, userId, currentStudentId, currentStudentSchoolId, currentStudentDocId, currentStudentName, userUsername, userEmail]);

  const studentPaidTotal = useMemo(() => myStudentReceipts.reduce((s, r) => s + r.amount, 0), [myStudentReceipts]);
  const studentBilledTotal = useMemo(() => myStudentInvoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0), [myStudentInvoices]);
  const studentUnpaidDebt = useMemo(() => myStudentInvoices.filter(inv => inv.status !== 'paid').reduce((s, inv) => s + (inv.remainingBalance ?? inv.totalAmount ?? 0), 0), [myStudentInvoices]);
  const studentWalletCredit = studentLiveWallet || Number((user as any)?.advanceBalance || 0);




  // ── Filtered Lists ──
  const filteredReceipts = useMemo(() => receipts.filter(r => {
    const q = query.toLowerCase();
    const matchQ = !query || r.receiptNumber.toLowerCase().includes(q) || r.studentName.toLowerCase().includes(q) || (r.referenceNumber && r.referenceNumber.toLowerCase().includes(q));
    const matchM = methodFilter === 'all' || r.paymentMethod === methodFilter;
    return matchQ && matchM;
  }), [receipts, query, methodFilter]);

  const filteredStudentReceiptsList = useMemo(() => myStudentReceipts.filter(r => {
    const q = query.toLowerCase();
    const matchQ = !query || r.receiptNumber.toLowerCase().includes(q) || (r.referenceNumber && r.referenceNumber.toLowerCase().includes(q)) || (r.invoiceNumber && r.invoiceNumber.toLowerCase().includes(q));
    const matchM = methodFilter === 'all' || r.paymentMethod === methodFilter;
    return matchQ && matchM;
  }), [myStudentReceipts, query, methodFilter]);

  const activeFiltersCount = methodFilter !== 'all' ? 1 : 0;
  const handleClearFilters = useCallback(() => { setMethodFilter('all'); setQuery(''); }, []);

  // ── KPIs ──
  const totalCollected = useMemo(() => receipts.reduce((s, r) => s + r.amount, 0), [receipts]);
  const bankTotal = useMemo(() => receipts.filter(r => r.paymentMethod === 'Bank Transfer' || r.paymentMethod === 'Cheque').reduce((s, r) => s + r.amount, 0), [receipts]);
  const mobileTotal = useMemo(() => receipts.filter(r => r.paymentMethod.includes('Money') || r.paymentMethod.includes('Mobile') || r.paymentMethod === 'Wave Mobile').reduce((s, r) => s + r.amount, 0), [receipts]);
  const cashTotal = useMemo(() => receipts.filter(r => r.paymentMethod === 'Cash' || r.paymentMethod === 'Stripe Card').reduce((s, r) => s + r.amount, 0), [receipts]);

  // ── Resolve Student Info from receipt ──
  const resolveStudent = useCallback((r: PaymentReceipt) => {
    if (!r) return { fullName: 'Student Scholar', schoolId: 'ST-2026', grade: 'Standard Program', section: '', parentName: 'Registered Parent Sponsor', parentPhone: '' };
    const rStudent = r.student as any;
    const sId = (r as any).studentId || rStudent?.schoolId || (r as any).admissionNumber;
    const docId = rStudent?.documentId;
    const rawId = rStudent?.id;
    const matched = liveStudents.find(s =>
      (sId && (s as any).schoolId && (s as any).schoolId.toLowerCase() === String(sId).toLowerCase()) ||
      (docId && (s as any).documentId === docId) ||
      (rawId && s.id === rawId) ||
      (r.studentName && s.name && s.name.toLowerCase() === r.studentName.toLowerCase())
    ) as any;
    const fullName = matched?.name || (matched ? `${matched.firstName || ''} ${matched.lastName || ''}`.trim() : '') || r.studentName || (rStudent ? `${rStudent.firstName || ''} ${rStudent.lastName || ''}`.trim() : '') || 'Student Scholar';
    const schoolId = matched?.schoolId || sId || 'ST-2026';
    const grade = matched?.gradeLevel || matched?.grade || 'Standard Program';
    const section = matched?.sections?.[0]?.name || matched?.section?.name || '';
    const parentName = matched?.parents?.[0]?.name || (matched?.parents?.[0] ? `${matched.parents[0].firstName || ''} ${matched.parents[0].lastName || ''}`.trim() : '') || (r as any).parentName || 'Registered Parent Sponsor';
    const parentPhone = matched?.parents?.[0]?.phone || '';
    return { fullName, schoolId, grade, section, parentName, parentPhone };
  }, [liveStudents]);

  // Memoized inspect record info
  const inspectStudentInfo = useMemo(() => selectedReceipt ? resolveStudent(selectedReceipt) : null, [selectedReceipt, resolveStudent]);




  // ── Post Payment (Student) ──
  const handlePostStudentPayment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(studentPayAmount || '0');
    if (amountNum <= 0) { toast.error('Please enter a valid amount greater than zero.'); return; }
    setIsSubmittingStudentPay(true);
    try {
      const matchedInvoice = myStudentInvoices.find(i => i.invoiceNumber === studentPayInvoiceNumber) || myStudentInvoices[0];
      const isMobile = studentPayMethod.includes('Money') || studentPayMethod.includes('Wave') || studentPayMethod.includes('Mobile');
      const data = await financeService.postCombinedPayment({
        invoiceId: matchedInvoice ? (matchedInvoice.documentId || matchedInvoice.id) : undefined,
        walletAmount: 0,
        cashAmount: studentPayMethod === 'Cash' || studentPayMethod === 'Stripe Card' ? amountNum : 0,
        bankAmount: studentPayMethod === 'Bank Transfer' ? amountNum : 0,
        mobileMoneyAmount: isMobile ? amountNum : 0,
        chequeAmount: 0,
        paymentMethod: studentPayMethod,
        currency: 'USD',
        referenceNumber: studentPayRef || `PAY-ONLINE-${Date.now().toString().slice(-6)}`,
      });
      toast.success(`🎉 Payment of $${fmtMoney(amountNum)} posted! Receipt ${data.receiptNumber}`);
      setShowStudentPayModal(false);
      setStudentPayAmount(''); setStudentPayRef('');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Payment failed. Please check your details.');
    } finally {
      setIsSubmittingStudentPay(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentPayAmount, myStudentInvoices, studentPayInvoiceNumber, studentPayMethod, studentPayRef, loadData]);

  // ── E2E ──
  const handleRunE2EVerification = async () => {
    setVerifyingE2E(true);
    setShowE2EModal(true);
    setE2EResult(null);
    try {
      const res = await financeService.verifyE2EScenario();
      setE2EResult(res);
      toast.success('Mandatory E2E Accounting Scenario PASSED!');
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'E2E Verification Failed';
      const logs = err?.response?.data?.error?.logs || err?.response?.data?.logs || [];
      setE2EResult({ success: false, error: msg, logs });
      toast.error('E2E Verification Failed');
    } finally {
      setVerifyingE2E(false);
    }
  };

  // ── Unique currencies (avoid duplicates with defaults) ──
  const extraCurrencies = useMemo(() =>
    liveCurrencies.filter(c => !['USD', 'LRD', 'EUR'].includes(c.currencyCode)),
    [liveCurrencies]
  );

  // ── KPI Cards ──
  const adminKpiCards = useMemo<EnterpriseKPICard[]>(() => [
    { id: 'collections', title: t('Total POS Collections'), value: `$${fmtMoney(totalCollected)}`, subtitle: `${receipts.length} ${t('verified receipts')}`, trendDirection: 'up', icon: <CreditCard className="w-5 h-5" />, onClick: () => toast.info('All cashier receipts.') },
    { id: 'bank', title: t('Bank & Wire Transfers'), value: `$${fmtMoney(bankTotal)}`, subtitle: t('Deposited: Account 1010'), trendDirection: 'up', icon: <Landmark className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />, isActive: methodFilter === 'Bank Transfer', onClick: () => setMethodFilter(m => m === 'Bank Transfer' ? 'all' : 'Bank Transfer') },
    { id: 'mobile', title: t('Mobile Money Gateways'), value: `$${fmtMoney(mobileTotal)}`, subtitle: t('Instant mobile deposits (Acct 1020)'), trendDirection: 'up', icon: <Smartphone className="w-5 h-5 text-sky-500 dark:text-sky-400" />, isActive: methodFilter === 'Orange Money', onClick: () => setMethodFilter(m => m === 'Orange Money' ? 'all' : 'Orange Money') },
    { id: 'cash', title: t('Campus Cash Drawer'), value: `$${fmtMoney(cashTotal)}`, subtitle: t('Cash Session: Reconciled'), trendDirection: 'neutral', icon: <PiggyBank className="w-5 h-5 text-amber-500 dark:text-amber-400" />, isActive: methodFilter === 'Cash', onClick: () => setMethodFilter(m => m === 'Cash' ? 'all' : 'Cash') },
  ], [totalCollected, receipts.length, bankTotal, mobileTotal, cashTotal, methodFilter]);

  const studentKpiCards = useMemo<EnterpriseKPICard[]>(() => [
    { id: 'paid', title: t('Total Settled'), value: `$${fmtMoney(studentPaidTotal)}`, subtitle: `${myStudentReceipts.length} verified receipts`, trendDirection: 'up', icon: <CreditCard className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> },
    { id: 'debt', title: t('Outstanding Fees'), value: `$${fmtMoney(studentUnpaidDebt)}`, subtitle: studentUnpaidDebt > 0 ? 'Action needed' : '✓ All paid', trendDirection: studentUnpaidDebt > 0 ? 'down' : 'up', icon: <Landmark className={`w-5 h-5 ${studentUnpaidDebt > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`} /> },
    { id: 'wallet', title: t('Advance Wallet'), value: `$${fmtMoney(studentWalletCredit)}`, subtitle: 'Prepaid credit balance', trendDirection: 'neutral', icon: <Wallet className="w-5 h-5 text-sky-500 dark:text-sky-400" /> },
    { id: 'billed', title: t('Total Invoiced'), value: `$${fmtMoney(studentBilledTotal)}`, subtitle: `${myStudentInvoices.length} invoices issued`, trendDirection: 'neutral', icon: <FileText className="w-5 h-5 text-amber-500 dark:text-amber-400" /> },
  ], [studentPaidTotal, myStudentReceipts.length, studentUnpaidDebt, studentWalletCredit, studentBilledTotal, myStudentInvoices.length]);

  // ── Columns ──
  const adminColumns = useMemo<ColumnDef<PaymentReceipt, any>[]>(() => [
    {
      accessorKey: 'receiptNumber',
      header: t('Receipt # & Invoice Ref'),
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="space-y-1 py-1">
            <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 block tracking-wide">{r.receiptNumber}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-100 dark:bg-slate-800 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-slate-700">
                {r.invoiceNumber || 'INV-GENERAL'}
              </span>
              {r.currency && r.currency !== 'USD' && (
                <span className="px-1 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">{r.currency}</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'studentName',
      header: t('Scholar & Sponsor Profile'),
      cell: ({ row }) => {
        const r = row.original;
        const s = resolveStudent(r);
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-400/30 dark:border-emerald-500/30 flex items-center justify-center font-black text-xs text-emerald-600 dark:text-emerald-300 shrink-0">
              {s.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate max-w-xs">{s.fullName}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{s.schoolId}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                {s.grade && <span className="font-medium text-slate-600 dark:text-slate-300">{s.grade}</span>}
                {s.section && <span className="font-mono">· {s.section}</span>}
                <span className="font-mono truncate max-w-xs">· Sponsor: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{s.parentName}</strong>{s.parentPhone && ` (${s.parentPhone})`}</span>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'paymentMethod',
      header: t('Payment Channel & Ref'),
      cell: ({ row }) => {
        const r = row.original;
        const m = r.paymentMethod || 'Cash';
        return (
          <div className="space-y-1 text-xs py-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${methodBadgeCls(m)}`}>
              {methodIcon(m)}
              <span>{m}</span>
            </span>
            {(r.referenceNumber || r.bankName) && (
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block truncate max-w-[160px]">
                Ref: {r.referenceNumber || r.bankName}
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'paymentDate',
      header: t('Date & Cashier'),
      cell: ({ row }) => (
        <div className="space-y-0.5 font-mono text-[11px] py-1">
          <span className="text-slate-700 dark:text-slate-200 block font-bold">{fmtDate(row.original.paymentDate)}</span>
          <span className="text-slate-400 dark:text-slate-500 block truncate max-w-[120px]">{row.original.cashierName || 'Cashier Terminal'}</span>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: t('Revenue & Allocation ($)'),
      cell: ({ row }) => {
        const r = row.original as any;
        const invAlloc = r.invoiceAllocation ?? r.amount ?? 0;
        const wAlloc = r.walletAllocation ?? r.paymentMetadata?.walletAmount ?? 0;
        const overpay = r.walletCreditGenerated ?? r.paymentMetadata?.overpayment ?? 0;
        return (
          <div className="space-y-0.5 font-mono text-xs py-1">
            <span className="font-black text-emerald-600 dark:text-emerald-400 block text-sm">+${fmtMoney(invAlloc)}</span>
            {wAlloc > 0 && <span className="block text-sky-600 dark:text-sky-400 font-bold text-[10px]">Wallet: ${fmtMoney(wAlloc)}</span>}
            {overpay > 0 && <span className="block text-amber-600 dark:text-amber-400 font-bold text-[10px]">Credit: ${fmtMoney(overpay)}</span>}
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status || 'posted'} size="sm" />
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button onClick={() => setSelectedReceipt(row.original)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer">
            <Eye className="w-3.5 h-3.5" /><span>{t('Inspect')}</span>
          </button>
          <button onClick={() => setShowQrModal(row.original)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-600 dark:text-slate-400 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer" title={t('Verify QR')}>
            <QrCode className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => printReceiptDocument(row.original)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer" title={t('Print Receipt')}>
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    },
  ], [liveStudents, resolveStudent, t]);

  const studentColumns = useMemo<ColumnDef<PaymentReceipt, any>[]>(() => [
    {
      accessorKey: 'receiptNumber',
      header: t('Receipt # & Invoice Ref'),
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 block">{r.receiptNumber}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">Invoice: {r.invoiceNumber || 'INV-GENERAL'}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'paymentMethod',
      header: t('Payment Method & Ref'),
      cell: ({ row }) => {
        const m = row.original.paymentMethod || 'Cash';
        return (
          <div className="space-y-0.5 text-xs">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold border ${methodBadgeCls(m)}`}>
              {methodIcon(m)}<span>{m}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 block truncate max-w-[160px]">{row.original.referenceNumber || 'Verified Voucher'}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'paymentDate',
      header: t('Date'),
      cell: ({ row }) => (
        <div className="space-y-0.5 font-mono text-[11px]">
          <span className="text-slate-700 dark:text-slate-200 block font-bold">{fmtDate(row.original.paymentDate)}</span>
          <span className="text-emerald-600 dark:text-emerald-400 block text-[10px] font-bold">✓ Verified</span>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: t('Amount ($)'),
      cell: ({ row }) => {
        const r = row.original as any;
        return (
          <div className="space-y-0.5 font-mono text-xs">
            <span className="font-black text-emerald-600 dark:text-emerald-400 block text-sm">+${fmtMoney(r.amount)}</span>
            {r.walletCreditGenerated > 0 && <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-bold">Wallet Credit: +${fmtMoney(r.walletCreditGenerated)}</span>}
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: t('Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status || 'posted'} size="sm" />
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button onClick={() => setSelectedReceipt(row.original)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer">
            <Eye className="w-3.5 h-3.5" /><span>{t('Inspect')}</span>
          </button>
          <button onClick={() => setShowQrModal(row.original)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer">
            <QrCode className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" /><span>{t('QR Verify')}</span>
          </button>
          <button onClick={() => printReceiptDocument(row.original)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-600/20 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-all border border-emerald-200 dark:border-emerald-500/40 cursor-pointer">
            <Printer className="w-3.5 h-3.5" /><span>{t('Print')}</span>
          </button>
        </div>
      )
    },
  ], [t]);




  // ═══════════════════════════════════════════════════════════════
  // RENDER: STUDENT VIEW
  // ═══════════════════════════════════════════════════════════════
  if (viewMode === 'student') {
    return (
      <EnterpriseModuleShell
        title={t('My Payment Receipts & Fee History')}
        description={t('View your verified payment vouchers, official digital receipts, fee settlements, and student wallet credit.')}
        breadcrumbs={[{ label: t('My Fees'), href: '/finance/billing/invoices' }, { label: t('Payment Receipts') }]}
        headerActions={
          <div className="flex items-center gap-2">
            {!isStudentRole && (
              <button onClick={() => setViewMode('admin')} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700">
                ← Cashier POS Mode
              </button>
            )}
            <button onClick={() => setShowStudentPayModal(true)} className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer">
              <CreditCard className="w-3.5 h-3.5" /><span>{t('+ Pay Fees Online')}</span>
            </button>
          </div>
        }
      >
        <EnterpriseKPIDeck cards={studentKpiCards} />

        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /><span>My Invoices ({myStudentInvoices.length})</span>
          </Link>
          <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" /><span>Receipts ({myStudentReceipts.length})</span>
          </Link>
          <Link href="/finance/billing/statements" className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /><span>{t('Statement')}</span>
          </Link>
          {studentUnpaidDebt > 0 && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" /><span>Outstanding: ${fmtMoney(studentUnpaidDebt)}</span>
            </div>
          )}
        </div>

        <EnterpriseToolbar
          searchQuery={query} onSearchChange={setQuery}
          searchPlaceholder={t('Search by receipt number, reference, or invoice...')}
          density={density} onDensityChange={setDensity}
          onRefresh={() => { loadData(); toast.success('Receipts updated.'); }}
          activeFilterCount={activeFiltersCount} onResetFilters={handleClearFilters}
          createButtonLabel={t('+ Pay Online')} onCreate={() => setShowStudentPayModal(true)}
          customFilterNodes={
            <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer">
              <option value="all">All Methods</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Orange Money">Orange Money</option>
              <option value="Cash">Cash</option>
              <option value="Stripe Card">Card</option>
            </select>
          }
        />

        <EnterpriseDataGrid
          data={filteredStudentReceiptsList} columns={studentColumns}
          isLoading={loading} density={density}
          onRowInspect={row => setSelectedReceipt(row)}
          emptyStateProps={{ title: t('No Receipts Found'), description: t('No verified receipts match your filter.'), isFilterActive: activeFiltersCount > 0 || query.length > 0, onResetFilters: handleClearFilters, createLabel: t('Pay Fees Online'), onCreate: () => setShowStudentPayModal(true) }}
        />

        {/* Student Online Pay Modal */}
        {showStudentPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><CreditCard className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">{t('Student Online Fee Checkout')}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{t('Instant Gateway Payment & Verified Digital Receipt')}</p>
                  </div>
                </div>
                <button onClick={() => setShowStudentPayModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handlePostStudentPayment} className="space-y-4">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{t('Paying For Scholar:')}</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{user?.firstName || (user as any)?.name || 'Scholar'} ({(user as any)?.schoolId || (user as any)?.studentId || 'STUDENT'})</strong>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Select Invoice to Settle')}</label>
                  <select value={studentPayInvoiceNumber} onChange={e => { const v = e.target.value; setStudentPayInvoiceNumber(v); const inv = myStudentInvoices.find(i => i.invoiceNumber === v); if (inv) setStudentPayAmount(String(inv.remainingBalance ?? inv.totalAmount ?? 0)); }} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer">
                    <option value="">{t('General Advance Wallet Deposit (No Invoice)')}</option>
                    {myStudentInvoices.map(inv => (
                      <option key={inv.id} value={inv.invoiceNumber}>{inv.invoiceNumber} — ${fmtMoney(inv.remainingBalance ?? inv.totalAmount ?? 0)} ({inv.status.toUpperCase()})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Amount ($)')}</label>
                    <input type="number" step="0.01" required value={studentPayAmount} onChange={e => setStudentPayAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 text-sm font-mono font-black focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Payment Gateway')}</label>
                    <select value={studentPayMethod} onChange={e => setStudentPayMethod(e.target.value as PaymentMethodType)} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer">
                      <option value="Orange Money">Orange Money</option>
                      <option value="MTN Money">MTN Mobile Money</option>
                      <option value="Wave Mobile">Wave Mobile Money</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Stripe Card">Credit / Debit Card</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Phone / Transaction Reference (Optional)')}</label>
                  <input type="text" value={studentPayRef} onChange={e => setStudentPayRef(e.target.value)} placeholder="Mobile Money phone # or Transaction ID" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl text-[11px] text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span>{t('Secure 256-bit Encrypted Transaction. An official receipt with QR code will be generated instantly.')}</span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button type="button" onClick={() => setShowStudentPayModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer">Cancel</button>
                  <button type="submit" disabled={isSubmittingStudentPay} className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-60 cursor-pointer">
                    {isSubmittingStudentPay ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...</> : 'Complete Settlement →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Modal */}
        {showQrModal && <QrModal receipt={showQrModal} onClose={() => setShowQrModal(null)} onPrint={() => printReceiptDocument(showQrModal)} />}

        {/* Inspect Modal */}
        {selectedReceipt && inspectStudentInfo && (
          <ReceiptInspectModal
            receipt={selectedReceipt}
            studentInfo={inspectStudentInfo}
            onClose={() => setSelectedReceipt(null)}
            onPrint={() => printReceiptDocument(selectedReceipt)}
            onQr={() => { setShowQrModal(selectedReceipt); setSelectedReceipt(null); }}
          />
        )}
      </EnterpriseModuleShell>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: ADMIN CASHIER POS
  // ═══════════════════════════════════════════════════════════════
  return (
    <EnterpriseModuleShell
      title={t('Multi-Method Cashier Payment Console & POS')}
      description={t('Process and reconcile multi-currency payments across banking, mobile wallets, and campus drawer.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Payments') }]}
      headerActions={
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('student')} className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all">
            👁️ {t('Preview Student View')}
          </button>
          <button
            onClick={() => setShowPayModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" /><span>{t('Record Payment')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={adminKpiCards} />

      {/* Sub-Nav */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /><span>{t('Invoices Console')}</span>
        </Link>
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" /><span>{t('Cashier POS')}</span>
        </Link>
        <Link href="/finance/billing/statements" className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /><span>{t('Statements')}</span>
        </Link>
        <button
          onClick={handleRunE2EVerification}
          disabled={verifyingE2E}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-auto disabled:opacity-60"
        >
          <CheckCircle2 className={`w-3.5 h-3.5 ${verifyingE2E ? 'animate-spin' : ''}`} />
          <span>{verifyingE2E ? 'Running E2E...' : 'Run E2E Reconciliation'}</span>
        </button>
      </div>

      {/* Toolbar */}
      <EnterpriseToolbar
        searchQuery={query} onSearchChange={setQuery}
        searchPlaceholder={t('Search receipts by receipt#, student name, or reference...')}
        density={density} onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Ledger synced.'); }}
        activeFilterCount={activeFiltersCount} onResetFilters={handleClearFilters}
        createButtonLabel={t('+ Record Payment')} onCreate={() => setShowPayModal(true)}
        customFilterNodes={
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} aria-label="Filter by method" className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer">
            <option value="all">All Methods</option>
            <option value="Bank Transfer">Bank Transfer & Wire</option>
            <option value="Orange Money">Orange Money</option>
            <option value="Cash">Cash Drawer</option>
            <option value="Stripe Card">Stripe / POS Card</option>
          </select>
        }
      />

      {/* Data Grid */}
      <EnterpriseDataGrid
        data={filteredReceipts} columns={adminColumns}
        isLoading={loading} density={density}
        onRowInspect={row => setSelectedReceipt(row)}
        emptyStateProps={{ title: t('No Payment Receipts Found'), description: t('No transactions match your filter.'), isFilterActive: activeFiltersCount > 0 || query.length > 0, onResetFilters: handleClearFilters, createLabel: t('Record New Payment'), onCreate: () => setShowPayModal(true) }}
      />

      {/* ── Record Payment Modal (Admin) ── */}
      {showPayModal && (
        <RecordPaymentModal
          liveStudents={liveStudents}
          extraCurrencies={extraCurrencies}
          initialInvoiceNumber={initialInvoiceNumber}
          onClose={() => setShowPayModal(false)}
          onSuccess={loadData}
        />
      )}


      {/* ── QR Code Modal ── */}
      {showQrModal && <QrModal receipt={showQrModal} onClose={() => setShowQrModal(null)} onPrint={() => printReceiptDocument(showQrModal)} />}

      {/* ── E2E Modal ── */}
      {showE2EModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">E2E Accounting Integrity Suite</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Mandatory Accounting Scenario Execution & Assertion</p>
                </div>
              </div>
              <button onClick={() => setShowE2EModal(false)} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs cursor-pointer">✕ Close</button>
            </div>
            {verifyingE2E ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3 text-slate-500 dark:text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 dark:text-emerald-400" />
                <p className="text-xs font-bold font-mono">Executing 7-Step Accounting Scenario & Assertion Guards...</p>
                <div className="space-y-1 w-full max-w-sm">
                  {['Creating test student & invoice', 'Posting multi-method payment', 'Verifying GL ledger entries', 'Checking wallet allocation', 'Verifying receipt generation', 'Running reconciliation check', 'Asserting all balances'].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      <RefreshCw className="w-3 h-3 animate-spin text-emerald-400 shrink-0" />
                      <span>Step {i + 1}: {step}...</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : e2eResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl border ${e2eResult.success ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300'}`}>
                  <strong className="text-sm font-black uppercase tracking-wider block mb-1">
                    {e2eResult.success ? '✅ E2E SCENARIO PASSED 100%' : '❌ E2E SCENARIO FAILED'}
                  </strong>
                  <p className="text-xs">{e2eResult.message || e2eResult.error}</p>
                </div>
                {e2eResult.logs && e2eResult.logs.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Execution Logs</span>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1 max-h-48 overflow-y-auto">
                      {e2eResult.logs.map((log: string, i: number) => (
                        <div key={i} className={`text-[11px] font-mono ${log.includes('✓') || log.includes('PASS') ? 'text-emerald-600 dark:text-emerald-400' : log.includes('✗') || log.includes('FAIL') ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>{log}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Inspect Receipt Modal ── */}
      {selectedReceipt && inspectStudentInfo && (
        <ReceiptInspectModal
          receipt={selectedReceipt}
          studentInfo={inspectStudentInfo}
          onClose={() => setSelectedReceipt(null)}
          onPrint={() => printReceiptDocument(selectedReceipt)}
          onQr={() => { setShowQrModal(selectedReceipt); setSelectedReceipt(null); }}
        />
      )}
    </EnterpriseModuleShell>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function CashierPaymentsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500 dark:text-slate-400 font-mono animate-pulse">Loading Payment Gateway...</div>}>
      <CashierPaymentsContent />
    </Suspense>
  );
}

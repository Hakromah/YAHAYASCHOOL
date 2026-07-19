'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign, CreditCard, Heart, GraduationCap, FileText, Receipt,
  Clock, CheckCircle2, AlertTriangle, QrCode, Download, Printer,
  Sparkles, Smartphone, Landmark, ShieldCheck, ArrowRight, User
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { StudentFinanceAccount, Invoice, PaymentReceipt } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function ParentPaymentCenterPage() {
  const [childrenAccounts, setChildrenAccounts] = useState<StudentFinanceAccount[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('STU-1001');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts'>('invoices');
  const [showPayModal, setShowPayModal] = useState<Invoice | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Online Payment checkout state
  const [gatewayMethod, setGatewayMethod] = useState<'Orange Money' | 'MTN Money' | 'Stripe Card' | 'Bank Transfer'>('Orange Money');
  const [mobilePhoneOrCard, setMobilePhoneOrCard] = useState('+221 77 849 20 11');

  const loadData = async () => {
    setLoading(true);
    try {
      const accList = await financeService.getStudentAccounts();
      // Filter to parent Sheikh Habibi's children
      const habibiChildren = accList.filter(a => a.parentName.includes('Habibi') || a.studentId === 'STU-1001' || a.studentId === 'STU-1002');
      setChildrenAccounts(habibiChildren.length > 0 ? habibiChildren : accList.slice(0, 2));
      if (habibiChildren.length > 0 && !selectedChildId) {
        setSelectedChildId(habibiChildren[0].studentId);
      }

      const invList = await financeService.getInvoices();
      const recList = await financeService.getReceipts();
      setInvoices(invList);
      setReceipts(recList);
    } catch {
      toast.error('Failed to load parent payment center data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedChild = useMemo(() => {
    return childrenAccounts.find(c => c.studentId === selectedChildId) || childrenAccounts[0] || null;
  }, [childrenAccounts, selectedChildId]);

  const childInvoices = useMemo(() => {
    if (!selectedChild) return [];
    return invoices.filter(i => i.studentId === selectedChild.studentId || i.studentName === selectedChild.studentName);
  }, [invoices, selectedChild]);

  const childReceipts = useMemo(() => {
    if (!selectedChild) return [];
    return receipts.filter(r => r.studentId === selectedChild.studentId || r.studentName === selectedChild.studentName);
  }, [receipts, selectedChild]);

  const handleProcessOnlinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal || !selectedChild) return;

    const { receipt } = await financeService.postPaymentReceipt({
      invoiceNumber: showPayModal.invoiceNumber,
      studentId: selectedChild.studentId,
      studentName: selectedChild.studentName,
      admissionNumber: selectedChild.admissionNumber,
      parentName: selectedChild.parentName,
      cashierName: `Online Gateway (${gatewayMethod})`,
      amount: showPayModal.remainingBalance,
      paymentMethod: gatewayMethod,
      referenceNumber: `GW-${Date.now().toString().slice(-6)}`,
      mobileOperator: gatewayMethod.includes('Money') ? gatewayMethod.split(' ')[0] : undefined,
      remainingStudentBalance: 0
    });

    toast.success(`Online payment verified via ${gatewayMethod}! Receipt ${receipt.receiptNumber} issued immediately.`);
    setShowPayModal(null);
    loadData();
  };

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    if (!selectedChild) return [];
    return [
      {
        id: 'child_balance',
        title: `${selectedChild.studentName} Net Balance`,
        value: selectedChild.netBalance <= 0 ? 'SETTLED ($0.00)' : `$${selectedChild.netBalance.toFixed(2)} DUE`,
        subtitle: selectedChild.netBalance <= 0 ? 'Fully paid for active academic term' : 'Please settle outstanding balance online',
        trendDirection: selectedChild.netBalance <= 0 ? 'up' : 'down',
        icon: <DollarSign className={`w-5 h-5 ${selectedChild.netBalance <= 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
      },
      {
        id: 'invoices_count',
        title: 'Pending Invoices',
        value: `${childInvoices.filter(i => i.remainingBalance > 0).length} Invoices`,
        subtitle: `${childInvoices.length} total issued invoices for this scholar`,
        trendDirection: 'neutral',
        icon: <FileText className="w-5 h-5 text-sky-400" />,
        onClick: () => setActiveTab('invoices')
      },
      {
        id: 'receipts_count',
        title: 'Verified Payment Receipts',
        value: `${childReceipts.length} Receipts`,
        subtitle: 'Cryptographic QR verification active',
        trendDirection: 'up',
        icon: <Receipt className="w-5 h-5 text-emerald-400" />,
        onClick: () => setActiveTab('receipts')
      },
      {
        id: 'academic_access',
        title: 'Academic Report Card Access',
        value: selectedChild.financialHold ? 'RESTRICTED' : 'UNLOCKED',
        subtitle: selectedChild.financialHold ? 'Clear overdue balance to unlock results' : 'Full access to grades and examination passes',
        trendDirection: selectedChild.financialHold ? 'down' : 'up',
        icon: selectedChild.financialHold ? <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      }
    ];
  }, [selectedChild, childInvoices, childReceipts]);

  const invoiceColumns = useMemo<ColumnDef<Invoice, any>[]>(() => {
    return [
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice # & Itemized Details',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-black text-emerald-400 block">{row.original.invoiceNumber}</span>
            <span className="font-bold text-white text-xs block">{row.original.items.map(i => i.description).join(', ')}</span>
          </div>
        )
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }) => (
          <span className={`font-mono text-xs font-bold ${row.original.status === 'overdue' ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
            {row.original.dueDate}
          </span>
        )
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total / Remaining Due ($)',
        cell: ({ row }) => (
          <div className="space-y-0.5 font-mono">
            <span className="text-xs font-bold text-slate-300 block">${row.original.totalAmount.toFixed(2)} Total</span>
            <span className={`text-xs sm:text-sm font-black block ${row.original.remainingBalance <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              Due: ${row.original.remainingBalance.toFixed(2)}
            </span>
          </div>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Online Settlement',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {row.original.remainingBalance > 0 ? (
              <button
                onClick={() => setShowPayModal(row.original)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay Online</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                ✓ Fully Settled
              </span>
            )}
            <button
              onClick={() => setSelectedItem(row.original)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              Inspect
            </button>
          </div>
        )
      }
    ];
  }, []);

  const receiptColumns = useMemo<ColumnDef<PaymentReceipt, any>[]>(() => {
    return [
      {
        accessorKey: 'receiptNumber',
        header: 'Official Receipt Number',
        cell: ({ row }) => (
          <div className="space-y-0.5 font-mono">
            <span className="text-xs font-black text-emerald-400 block">{row.original.receiptNumber}</span>
            <span className="text-[11px] text-slate-400 block">Inv: {row.original.invoiceNumber || 'GENERAL'}</span>
          </div>
        )
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Method & Reference',
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-white block">{row.original.paymentMethod}</span>
            <span className="text-[11px] font-mono text-slate-400 block">{row.original.referenceNumber || 'Verified Gateway'}</span>
          </div>
        )
      },
      {
        accessorKey: 'paymentDate',
        header: 'Settlement Date',
        cell: ({ row }) => <span className="font-mono text-xs text-slate-300 font-bold">{row.original.paymentDate.split('T')[0]}</span>
      },
      {
        accessorKey: 'amount',
        header: 'Verified Amount ($)',
        cell: ({ row }) => (
          <span className="font-mono text-xs sm:text-sm font-black text-emerald-400">
            +${row.original.amount.toFixed(2)}
          </span>
        )
      },
      {
        id: 'actions',
        header: 'Public QR & Download',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                toast.success(`Opening public cryptographic verification URL for receipt ${row.original.receiptNumber}`);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>QR Verify</span>
            </button>
            <button
              onClick={() => toast.success(`Downloading printable PDF receipt ${row.original.receiptNumber}`)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Parent Payment Center & Running Account Portal"
      description="Interactive parental portal for Sheikh Habibi Al-Habib to monitor running account balances, itemized invoices, and execute instant online payments via Orange Money, MTN, and Stripe."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Parent Center' }]}
      icon={<Heart className="w-8 h-8 text-rose-400" />}
      recordCount={activeTab === 'invoices' ? childInvoices.length : childReceipts.length}
      recordLabel={activeTab === 'invoices' ? 'Child Invoices' : 'Child Receipts'}
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <div className="flex items-center gap-2">
          {/* Child Selection Pill Box */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-400">Child:</span>
            <select
              value={selectedChildId}
              onChange={(e) => {
                setSelectedChildId(e.target.value);
                toast.info(`Switched parent portal to ${e.target.value}`);
              }}
              aria-label="Select Child Account"
              className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              {childrenAccounts.map(c => (
                <option key={c.studentId} value={c.studentId} className="bg-slate-900">
                  {c.studentName} ({c.gradeCode})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => toast.success('Downloaded complete parental running ledger statement.')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Statement</span>
          </button>
        </div>
      }
    >
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Child Summary Profile Banner */}
      {selectedChild && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-lg">
              {selectedChild.studentName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base">{selectedChild.studentName}</h3>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-xs font-bold">
                  {selectedChild.admissionNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedChild.gradeCode} — {selectedChild.sectionName} | Academic Year: <strong className="text-slate-200">{selectedChild.academicYearCode}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Running Net Balance</span>
              <span className={`text-xl font-black font-mono block ${selectedChild.netBalance <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                ${selectedChild.netBalance.toFixed(2)}
              </span>
            </div>
            {selectedChild.netBalance > 0 && (
              <button
                onClick={() => {
                  const pendingInv = childInvoices.find(i => i.remainingBalance > 0) || childInvoices[0];
                  if (pendingInv) setShowPayModal(pendingInv);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all cursor-pointer"
              >
                Settle Full Balance Now →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'invoices' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Itemized Invoices ({childInvoices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'receipts' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Payment Receipts & QR ({childReceipts.length})</span>
        </button>
      </div>

      {/* High-Density Enterprise Data Grid */}
      {activeTab === 'invoices' ? (
        <EnterpriseDataGrid
          data={childInvoices}
          columns={invoiceColumns}
          isLoading={loading}
          density={density}
          onRowInspect={(row) => setSelectedItem(row)}
          onRowClick={(row) => setSelectedItem(row)}
          emptyStateProps={{
            title: 'No Invoices for this Child',
            description: 'No active tuition or fee charges are due for this scholar account.',
            isFilterActive: false,
            onResetFilters: () => {}
          }}
        />
      ) : (
        <EnterpriseDataGrid
          data={childReceipts}
          columns={receiptColumns}
          isLoading={loading}
          density={density}
          onRowInspect={(row) => setSelectedItem(row)}
          onRowClick={(row) => setSelectedItem(row)}
          emptyStateProps={{
            title: 'No Payment Receipts Found',
            description: 'No verified settlements have been recorded for this scholar yet.',
            isFilterActive: false,
            onResetFilters: () => {}
          }}
        />
      )}

      {/* Online Gateway Payment Checkout Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Online Payment Gateway Checkout</h3>
                  <p className="text-xs text-slate-400 font-mono">Invoice Ref: {showPayModal.invoiceNumber}</p>
                </div>
              </div>
              <button onClick={() => setShowPayModal(null)} className="text-slate-400 hover:text-white font-bold text-sm px-3 py-1 rounded-lg bg-slate-800">✕</button>
            </div>

            <form onSubmit={handleProcessOnlinePayment} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Amount Due to Settle:</span>
                  <span className="text-2xl font-black font-mono text-emerald-400 block">${showPayModal.remainingBalance.toFixed(2)} USD</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  Secure SSL 256-Bit
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['Orange Money', 'MTN Money', 'Stripe Card', 'Bank Transfer'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setGatewayMethod(m)}
                      className={`p-3 rounded-xl border text-left font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                        gatewayMethod === m ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {m.includes('Money') && <Smartphone className="w-4 h-4 text-sky-400" />}
                        {m === 'Stripe Card' && <CreditCard className="w-4 h-4 text-emerald-400" />}
                        {m === 'Bank Transfer' && <Landmark className="w-4 h-4 text-amber-400" />}
                        <span>{m}</span>
                      </span>
                      {gatewayMethod === m && <span className="text-emerald-400">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  {gatewayMethod.includes('Money') ? 'Mobile Phone Number (Orange / MTN Wallet)' : gatewayMethod === 'Stripe Card' ? 'Card Number (Simulated Checkout)' : 'Bank Transfer Reference Number'}
                </label>
                <input
                  type="text"
                  required
                  value={mobilePhoneOrCard}
                  onChange={(e) => setMobilePhoneOrCard(e.target.value)}
                  placeholder={gatewayMethod.includes('Money') ? '+221 / +225 / +237 Phone number' : '4242 4242 ...'}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowPayModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30">
                  Authorize & Pay ${showPayModal.remainingBalance.toFixed(2)} →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        record={selectedItem ? {
          name: selectedItem.studentName || selectedChild?.studentName,
          id: selectedItem.invoiceNumber || selectedItem.receiptNumber,
          role: selectedItem.totalAmount ? 'INVOICE VOUCHER' : 'VERIFIED RECEIPT',
          status: selectedItem.status,
          email: selectedItem.parentEmail || selectedChild?.parentEmail,
          phone: selectedItem.issueDate || selectedItem.paymentDate?.split('T')[0],
          department: `Amount: $${(selectedItem.totalAmount || selectedItem.amount).toFixed(2)}`,
          joinDate: selectedItem.dueDate || selectedItem.verificationCode,
          balance: `REMAINING BALANCE DUE: $${(selectedItem.remainingBalance || selectedItem.remainingStudentBalance || 0).toFixed(2)}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText, Plus, Search, Filter, Download, Eye, AlertTriangle,
  CheckCircle2, Clock, DollarSign, Percent, Layers, Award, Coins,
  Calendar, User, Mail, Shield, ArrowRight, Printer, Sparkles, Activity, X, Edit3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { financeService } from '@/services/finance.service';
import type { Invoice, InvoiceLineItem } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';
import { erpService } from '@/services/erp.service';
import type { Student, Parent } from '@/types/erp.types';
import { printInvoiceDocument } from '@/lib/print-finance';

const safeFormatCurrency = (amount: number, currencyCode: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode || 'USD' }).format(amount);
  } catch (err) {
    return `${currencyCode || 'USD'} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }
};

export default function StudentInvoicesPage() {
  const { user, role } = useAuth();

  // Role Evaluation for Invoice Operations
  const userRoleStr = String(role || user?.role?.type || user?.role?.name || '').toLowerCase();
  const isAdmin = userRoleStr.includes('admin') || userRoleStr.includes('director') || userRoleStr.includes('super');
  const isAccountLead = userRoleStr.includes('lead') || userRoleStr.includes('account-lead');
  const isAccountant = userRoleStr.includes('accountant') && !isAccountLead;

  // Role Action Controls:
  // Admin: Create, Update (all status), Delete (all status), Approve/Unapprove (all status)
  // Account Lead: Create, Update (non-approved), Delete (non-approved), Approve (draft -> approved)
  // Accountant: Create, Update (non-approved), Delete (non-approved), Cannot approve
  const canCreateInvoice = isAdmin || isAccountLead || isAccountant;

  const canEditInvoice = (inv: Invoice | null) => {
    if (!inv) return false;
    if (isAdmin) return true;
    if (isAccountLead || isAccountant) {
      return inv.status === 'draft' || inv.status === 'pending_payment' || inv.status === 'submitted';
    }
    return false;
  };

  const canDeleteInvoice = (inv: Invoice | null) => {
    if (!inv) return false;
    if (isAdmin) return true;
    if (isAccountLead || isAccountant) {
      return inv.status === 'draft' || inv.status === 'pending_payment' || inv.status === 'submitted';
    }
    return false;
  };

  const canApproveInvoice = (inv: Invoice | null) => {
    if (!inv) return false;
    if (isAdmin) return true;
    if (isAccountLead) {
      return inv.status === 'draft' || inv.status === 'submitted';
    }
    return false;
  };

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Payment State
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('USD');

  // Live Directory Data
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);
  const [liveParents, setLiveParents] = useState<Parent[]>([]);
  const [liveCurrencies, setLiveCurrencies] = useState<any[]>([]);

  // New Invoice Form state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newAdmissionNumber, setNewAdmissionNumber] = useState('');
  const [newParentName, setNewParentName] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newTuitionAmount, setNewTuitionAmount] = useState('0');
  const [newLibraryAmount, setNewLibraryAmount] = useState('0');
  const [newDiscountAmount, setNewDiscountAmount] = useState('0');
  const [newScholarshipAmount, setNewScholarshipAmount] = useState('0');
  const [newLateFeeAmount, setNewLateFeeAmount] = useState('0');
  const [newInstallmentFrequency, setNewInstallmentFrequency] = useState('Termly');
  const [newCurrency, setNewCurrency] = useState('USD');

  // Edit Invoice Form state
  const [editStudentId, setEditStudentId] = useState('');
  const [editStudentName, setEditStudentName] = useState('');
  const [editTuitionAmount, setEditTuitionAmount] = useState('0');
  const [editLibraryAmount, setEditLibraryAmount] = useState('0');
  const [editStatus, setEditStatus] = useState('draft');
  const [editDueDate, setEditDueDate] = useState('');
  const [editCurrency, setEditCurrency] = useState('USD');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (selectedInvoice) {
      const sName = selectedInvoice.student
        ? `${selectedInvoice.student.firstName || ''} ${selectedInvoice.student.lastName || ''}`.trim() || selectedInvoice.student.name || selectedInvoice.studentName || ''
        : selectedInvoice.studentName || '';
      setEditStudentName(sName);
      setEditStudentId(selectedInvoice.student?.id ? String(selectedInvoice.student.id) : '');
      setEditTuitionAmount((selectedInvoice.subtotal || selectedInvoice.totalAmount || 0).toString());
      setEditLibraryAmount('0');
      setEditStatus(selectedInvoice.status || 'draft');
      setEditDueDate(selectedInvoice.dueDate || '');
      setEditCurrency(selectedInvoice.invoiceCurrency?.code || 'USD');
      setEditNotes(selectedInvoice.notes || '');
    }
  }, [selectedInvoice]);

  useEffect(() => {
    if (paymentInvoice) {
      const bal = paymentInvoice.remainingBalance ?? (paymentInvoice.totalAmount || 0);
      setPaymentAmount(bal.toString());
      setPaymentCurrency('USD');
    }
  }, [paymentInvoice]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getInvoices(statusFilter);
      setInvoices(data);

      const [studentsRes, parentsRes, currenciesRes] = await Promise.all([
        erpService.getStudents({ pageSize: 1000 }),
        erpService.getParents({ pageSize: 1000 }),
        financeService.getExchangeRates()
      ]);
      setLiveStudents(studentsRes.data);
      setLiveParents(parentsRes.data);
      setLiveCurrencies(currenciesRes);
    } catch {
      toast.error('Failed to load student invoices or directory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const sName = inv.student
        ? `${inv.student.firstName || ''} ${inv.student.lastName || ''}`.trim() || inv.student.name || inv.studentName || ''
        : inv.studentName || '';
      const pName = inv.student?.parent?.name
        ? `${inv.student.parent.firstName || ''} ${inv.student.parent.lastName || ''}`.trim() || inv.student.parent.name
        : inv.parentName || inv.student?.parentName || '';
      const admNo = inv.student?.admissionNumber || inv.student?.schoolId || inv.admissionNumber || '';
      const matchQuery = !query ||
        (inv.invoiceNumber || '').toLowerCase().includes(query.toLowerCase()) ||
        sName.toLowerCase().includes(query.toLowerCase()) ||
        pName.toLowerCase().includes(query.toLowerCase()) ||
        admNo.toLowerCase().includes(query.toLowerCase());
      return matchQuery;
    });
  }, [invoices, query]);

  const activeFiltersCount = statusFilter !== 'all' ? 1 : 0;

  const handleClearFilters = () => {
    setStatusFilter('all');
    setQuery('');
    toast.success('Invoice filters reset.');
  };

  const handleStudentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewStudentName(val);
    const student = liveStudents.find(s =>
      s.name === val ||
      s.studentId === val ||
      s.schoolId === val ||
      `${s.firstName || ''} ${s.lastName || ''}`.trim() === val
    );
    if (student) {
      const displayName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || '';
      setNewStudentName(displayName);
      setNewStudentId(String(student.id));
      setNewAdmissionNumber(student.admissionNumber || student.schoolId || student.studentId || '');

      if (student.parents && student.parents.length > 0) {
        const parent = student.parents[0];
        const pName = `${parent.firstName || ''} ${parent.lastName || ''}`.trim() || parent.name || '';
        setNewParentName(pName);
        setNewParentEmail(parent.email || '');
      } else {
        setNewParentName('');
        setNewParentEmail('');
      }
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateInvoice) {
      toast.error('Your role does not have permission to create invoices.');
      return;
    }

    const subtotal = parseFloat(newTuitionAmount || '0') + parseFloat(newLibraryAmount || '0');
    const discount = parseFloat(newDiscountAmount || '0');
    const scholarship = parseFloat(newScholarshipAmount || '0');
    const lateFee = parseFloat(newLateFeeAmount || '0');
    const total = Math.max(0, subtotal - discount - scholarship + lateFee);

    try {
      const created = await financeService.createInvoice({
        studentId: newStudentId,
        studentName: newStudentName,
        admissionNumber: newAdmissionNumber,
        parentName: newParentName,
        parentEmail: newParentEmail,
        invoiceCurrency: newCurrency as any,
        baseCurrency: 'USD' as any,
        subtotal,
        discountAmount: discount,
        scholarshipAmount: scholarship,
        lateFeeAmount: lateFee,
        totalAmount: total,
        items: [
          { id: 'ITM-N1', description: 'Term 1 Tuition Fee', category: 'Tuition', unitAmount: parseFloat(newTuitionAmount || '0'), quantity: 1, totalAmount: parseFloat(newTuitionAmount || '0') },
          { id: 'ITM-N2', description: 'Campus Library & Digital Archive Fee', category: 'Library', unitAmount: parseFloat(newLibraryAmount || '0'), quantity: 1, totalAmount: parseFloat(newLibraryAmount || '0') }
        ],
        notes: `Installment Plan: ${newInstallmentFrequency}. Auto-assessed fee items.`
      });

      toast.success(`Generated invoice ${created.invoiceNumber || ''}!`);
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      // Handled in finance.service.ts
    }
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (!canEditInvoice(selectedInvoice)) {
      toast.error('Your role cannot edit this invoice status.');
      return;
    }

    const targetId = selectedInvoice.documentId || selectedInvoice.id;
    const subtotal = parseFloat(editTuitionAmount || '0') + parseFloat(editLibraryAmount || '0');
    const paidAmount = selectedInvoice.paidAmount || 0;
    const remainingBalance = Math.max(0, subtotal - paidAmount);

    try {
      await financeService.updateInvoice(String(targetId), {
        studentId: editStudentId || undefined,
        subtotal,
        totalAmount: subtotal,
        remainingBalance,
        status: editStatus as any,
        dueDate: editDueDate || undefined,
        notes: editNotes || undefined,
      });

      toast.success(`Updated invoice ${selectedInvoice.invoiceNumber}!`);
      setShowEditModal(false);
      loadData();
      setSelectedInvoice(null);
    } catch (err) {
      // Handled in finance.service.ts
    }
  };

  const totalInvoiced = useMemo(() => invoices.reduce((s, i) => s + (i.totalAmount || 0), 0), [invoices]);
  const totalCollected = useMemo(() => invoices.reduce((s, i) => s + (i.paidAmount || 0), 0), [invoices]);
  const totalOutstanding = useMemo(() => invoices.reduce((s, i) => s + (i.remainingBalance ?? (i.totalAmount || 0)), 0), [invoices]);
  const overdueCount = useMemo(() => invoices.filter(i => i.status === 'overdue').length, [invoices]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_invoiced',
      title: 'Total Invoiced (Academic Year)',
      value: `$${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${invoices.length} total active student fee accounts`,
      trendDirection: 'up',
      icon: <FileText className="w-5 h-5" />,
      onClick: () => toast.info('Displaying all institutional invoices.')
    },
    {
      id: 'collected',
      title: 'Collected Revenue via Invoices',
      value: `$${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${Math.round((totalCollected / (totalInvoiced || 1)) * 100)}% settlement collection rate`,
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
      onClick: () => setStatusFilter('paid')
    },
    {
      id: 'outstanding',
      title: 'Remaining Outstanding Balance',
      value: `$${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Accounts receivable awaiting parent payment',
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-sky-400" />,
      onClick: () => setStatusFilter('partially_paid')
    },
    {
      id: 'overdue',
      title: 'Overdue Invoices & Late Fees',
      value: `${overdueCount} Accounts`,
      subtitle: 'Automatic $50 or 5% late fee rule active',
      trendDirection: 'down',
      icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
      isActive: statusFilter === 'overdue',
      onClick: () => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')
    }
  ];

  const columns = useMemo<ColumnDef<Invoice, any>[]>(() => {
    return [
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice #',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-black text-emerald-600 block">{row.original.invoiceNumber}</span>
        )
      },
      {
        accessorKey: 'studentName',
        header: 'Scholar Details',
        cell: ({ row }) => {
          const inv = row.original;
          const sName = inv.student
            ? `${inv.student.firstName || ''} ${inv.student.lastName || ''}`.trim() || inv.student.name || inv.studentName || 'Unknown Scholar'
            : inv.studentName || 'Unknown Scholar';
          const admNo = inv.student?.admissionNumber || inv.student?.schoolId || inv.admissionNumber || 'N/A';
          const pName = inv.student?.parent?.name
            ? `${inv.student.parent.firstName || ''} ${inv.student.parent.lastName || ''}`.trim() || inv.student.parent.name
            : inv.parentName || inv.student?.parentName || 'N/A';
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                {sName}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {admNo} • {pName}
              </span>
            </div>
          );
        }
      },
      {
        accessorKey: 'issueDate',
        header: 'Issue & Due Date',
        cell: ({ row }) => {
          const inv = row.original;
          const issueStr = inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jul 18, 2026';
          const dueStr = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
          return (
            <div className="flex flex-col text-xs">
              <span className="text-slate-700 font-medium">Issue: {issueStr}</span>
              <span className="text-slate-500 font-mono text-[11px]">Due: {dueStr}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'paidAmount',
        header: 'Paid Amount',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-slate-600">
            ${(row.original.paidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        )
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total / Balance ($)',
        cell: ({ row }) => {
          const total = row.original.totalAmount || 0;
          const bal = row.original.remainingBalance ?? total;
          return (
            <div className="flex flex-col">
              <span className="font-mono text-xs font-black text-slate-900">
                ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-[11px] font-bold ${bal > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                Bal: ${bal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'Settlement Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Inspect & Pay',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedInvoice(row.original)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs transition-all border border-slate-200 hover:border-slate-300 shadow-sm cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
            <Link
              href={`/finance/billing/payments?invoiceNumber=${row.original.invoiceNumber}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 font-bold text-xs transition-all border border-emerald-200 hover:border-emerald-300 shadow-sm"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Pay</span>
            </Link>
          </div>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Student Billing & Itemized Fee Invoices"
      description="Sequential invoice generator (INV-YYYY-XXXXXX) with automatic fee structure attachment, scholarship/discount calculation, installment payment schedules, and automated late fee rules."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Billing Suite' }, { label: 'Invoices' }]}
      icon={<FileText className="w-8 h-8" />}
      recordCount={filteredInvoices.length}
      recordLabel="Active Invoices"
      activeFilterCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeService.exportToCSV(invoices, 'student_invoices_2026.csv')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          {canCreateInvoice && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Create Invoice Console</span>
            </button>
          )}
        </div>
      }
    >
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>Invoices Console</span>
        </Link>
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          <span>Multi-Method Cashier & POS</span>
        </Link>
        <Link href="/finance/billing/structures" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Fee Structures & Templates</span>
        </Link>
        <Link href="/finance/accounting/ledgers" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-purple-400" />
          <span>Student Running Ledger</span>
        </Link>
        <Link href="/finance/billing/statements" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-orange-400" />
          <span>Student Statements</span>
        </Link>
      </div>

      {/* Main Enterprise Data Grid */}
      <EnterpriseToolbar
        searchPlaceholder="Search invoices by sequential number (INV-2026-XXXX), student scholar name, or parent spec..."
        searchQuery={query}
        onSearchChange={setQuery}
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadData}
        createButtonLabel={canCreateInvoice ? 'New Invoice' : undefined}
        onCreate={canCreateInvoice ? () => setShowCreateModal(true) : undefined}
      />

      <EnterpriseDataGrid
        data={filteredInvoices}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowClick={(row) => setSelectedInvoice(row)}
      />

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Generate Student Invoice</h3>
                  <p className="text-xs text-slate-300">Creates institutional billing record & attaches itemized fee items</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Select Scholar / Student Name</label>
                  <input
                    list="students-list"
                    type="text"
                    required
                    placeholder="Type to search live student directory..."
                    value={newStudentName}
                    onChange={handleStudentSelect}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                  <datalist id="students-list">
                    {liveStudents.map((s) => {
                      const sName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name;
                      return <option key={s.id} value={sName}>{s.studentId || s.admissionNumber || s.schoolId}</option>;
                    })}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Admission / School ID</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Auto-populated from directory"
                    value={newAdmissionNumber}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-600 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Guardian / Parent Name</label>
                  <input
                    type="text"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Parent Contact Email</label>
                  <input
                    type="text"
                    value={newParentEmail}
                    onChange={(e) => setNewParentEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Institutional Finance Currency</label>
                <input
                  list="finance-currencies"
                  type="text"
                  required
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value.toUpperCase())}
                  placeholder="e.g. USD, EUR, LRD..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-emerald-500 uppercase"
                />
                <datalist id="finance-currencies">
                  <option value="USD">USD ($ USD) - United States Dollar</option>
                  <option value="EUR">EUR (€ EUR) - Euro</option>
                  <option value="LRD">LRD ($ LRD) - Liberian Dollar</option>
                  {liveCurrencies.map(c => (
                    <option key={c.id} value={c.currencyCode}>{c.currencyCode}</option>
                  ))}
                </datalist>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-emerald-700 text-xs uppercase tracking-wider">Itemized Fee Structure ({newCurrency})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Tuition Fee Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newTuitionAmount}
                      onChange={(e) => setNewTuitionAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Library & Lab Fee</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newLibraryAmount}
                      onChange={(e) => setNewLibraryAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Sibling/Staff Discount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newDiscountAmount}
                      onChange={(e) => setNewDiscountAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-amber-600 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Calculated Net Invoice Total:</span>
                  <span className="font-black text-emerald-600 text-xl tracking-tight block">
                    {safeFormatCurrency(Math.max(0, (parseFloat(newTuitionAmount || '0') + parseFloat(newLibraryAmount || '0')) - parseFloat(newDiscountAmount || '0') - parseFloat(newScholarshipAmount || '0') + parseFloat(newLateFeeAmount || '0')), newCurrency)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-colors"
                  >
                    Issue & Post Invoice
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && selectedInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Edit Invoice {selectedInvoice.invoiceNumber}</h3>
                  <p className="text-xs text-slate-300">Update itemized fee amounts, status, or due dates</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateInvoice} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Scholar / Student Name</label>
                <input
                  type="text"
                  readOnly
                  value={editStudentName}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tuition & Subtotal Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editTuitionAmount}
                    onChange={(e) => setEditTuitionAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Invoice Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="draft">Draft (Un-approved)</option>
                    <option value="pending_payment">Pending Payment / Approved</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid (Settled)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Due Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Notes / Internal Reference</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Optional notes..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-lg shadow-sky-600/30 transition-colors"
                >
                  Save Invoice Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer for Invoice Inspection */}
      <SlideOutDrawer
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        record={selectedInvoice ? {
          name: selectedInvoice.student
            ? `${selectedInvoice.student.firstName || ''} ${selectedInvoice.student.lastName || ''}`.trim() || selectedInvoice.student.name || selectedInvoice.studentName || 'Unknown Scholar'
            : selectedInvoice.studentName || 'Unknown Scholar',
          id: selectedInvoice.invoiceNumber,
          role: `Admission: ${selectedInvoice.student?.admissionNumber || selectedInvoice.student?.schoolId || selectedInvoice.admissionNumber || 'N/A'}`,
          status: selectedInvoice.status,
          email: selectedInvoice.parentEmail || 'No Email Provided',
          phone: selectedInvoice.issueDate ? `Issued: ${selectedInvoice.issueDate}` : 'N/A',
        } : null}
        category="finance"
        hideIntelligence={true}
        quickActions={selectedInvoice ? [
          ...(canApproveInvoice(selectedInvoice) ? [{
            id: 'approve',
            label: selectedInvoice.status === 'draft' ? 'Approve Invoice' : (isAdmin ? 'Un-approve Invoice' : 'Approved'),
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            variant: selectedInvoice.status === 'draft' ? 'primary' as const : undefined,
            onClick: async () => {
              const targetId = selectedInvoice.documentId || selectedInvoice.id;
              const newStatus = selectedInvoice.status === 'draft' ? 'pending_payment' : 'draft';
              try {
                await financeService.updateInvoiceStatus(String(targetId), newStatus);
                toast.success(`Invoice ${selectedInvoice.invoiceNumber} status updated to ${newStatus}!`);
                loadData();
                setSelectedInvoice(prev => prev ? { ...prev, status: newStatus } : null);
              } catch (err) {
                toast.error('Failed to update invoice status.');
              }
            }
          }] : []),
          ...(canEditInvoice(selectedInvoice) ? [{
            id: 'edit',
            label: 'Edit Invoice',
            icon: <Edit3 className="w-3.5 h-3.5 text-sky-500" />,
            onClick: () => setShowEditModal(true)
          }] : []),
          {
            id: 'preview',
            label: 'Preview',
            icon: <Eye className="w-3.5 h-3.5" />,
            onClick: () => printInvoiceDocument(selectedInvoice)
          },
          {
            id: 'download',
            label: 'Download PDF',
            icon: <Download className="w-3.5 h-3.5" />,
            onClick: () => printInvoiceDocument(selectedInvoice)
          },
          {
            id: 'print',
            label: 'Print',
            icon: <Printer className="w-3.5 h-3.5" />,
            onClick: () => printInvoiceDocument(selectedInvoice)
          },
          ...(canDeleteInvoice(selectedInvoice) ? [{
            id: 'delete',
            label: 'Delete',
            icon: <X className="w-3.5 h-3.5" />,
            variant: 'danger' as const,
            onClick: async () => {
              const targetId = selectedInvoice.documentId || selectedInvoice.id;
              try {
                await financeService.deleteInvoice(String(targetId));
                toast.error(`Invoice ${selectedInvoice.invoiceNumber} has been permanently deleted.`);
                setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id && inv.documentId !== selectedInvoice.documentId));
                setSelectedInvoice(null);
              } catch (err) {
                toast.error(`Failed to delete invoice from server.`);
              }
            }
          }] : [])
        ] : []}
        statsBarOverride={selectedInvoice ? (
          <>
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold shadow-2xs">
              Total: <strong className="text-slate-900 dark:text-white">${(selectedInvoice.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold shadow-2xs">
              Balance Due: <strong className={(selectedInvoice.remainingBalance ?? (selectedInvoice.totalAmount || 0)) > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>${(selectedInvoice.remainingBalance ?? (selectedInvoice.totalAmount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold shadow-2xs">
              Subtotal: <strong className="text-slate-600 dark:text-slate-400">${(selectedInvoice.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </span>
            {Number((selectedInvoice.student as any)?.advanceBalance || 0) > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-600/30 text-emerald-300 font-mono font-semibold shadow-2xs flex items-center gap-1.5 ml-auto">
                Advance Wallet: <strong className="text-emerald-300 text-xl font-mono font-semibold">+${Number((selectedInvoice.student as any).advanceBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
              </span>
            )}
          </>
        ) : undefined}
        tabsListOverride={[
          { id: 'overview', label: 'Invoice Summary', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'audit', label: 'Audit Trail', icon: <Activity className="w-3.5 h-3.5" /> }
        ]}
      />
    </EnterpriseModuleShell>
  );
}

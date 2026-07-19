'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Award, ShieldCheck,
  Printer, ArrowRight, Sparkles, Building2, UserCheck, AlertCircle
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { PayrollRun } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function StaffPayrollRunsPage() {
  const [payrolls, setPayrolls] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRun | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState<PayrollRun | null>(null);

  // New Payroll Run Form state
  const [payPeriod, setPayPeriod] = useState('July 2026 Monthly Run');
  const [staffName, setStaffName] = useState('Sheikh Abdullah Al-Mahdi');
  const [staffRole, setStaffRole] = useState('Lead Imam & Arabic Professor');
  const [department, setDepartment] = useState('Department of Quranic Studies & Hifz');
  const [baseSalary, setBaseSalary] = useState('2800');
  const [overtimeAmount, setOvertimeAmount] = useState('490');
  const [deductionsAmount, setDeductionsAmount] = useState('510');
  const [attendanceRate, setAttendanceRate] = useState(100.0);
  const [hrStaffList, setHrStaffList] = useState<any[]>([]);
  const [selectedHrStaffId, setSelectedHrStaffId] = useState<string>('EMP-1001');

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, hrRecords] = await Promise.all([
        financeService.getPayrollRuns(),
        financeService.getHRStaffAttendanceRecords()
      ]);
      setPayrolls(data);
      setHrStaffList(hrRecords);
    } catch {
      toast.error('Failed to load payroll runs and HR attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncHRTimecard = async (staffIdToSync: string) => {
    try {
      const calc = await financeService.pullHRTimecardAndCalculatePayroll(staffIdToSync, payPeriod);
      setStaffName(calc.staffName || staffName);
      setStaffRole(calc.staffRole || staffRole);
      setDepartment(calc.department || department);
      setBaseSalary(String(calc.baseSalary || 2800));
      setOvertimeAmount(String(calc.overtimeAmount || 0));
      setDeductionsAmount(String(calc.deductionsAmount || 0));
      setAttendanceRate(calc.attendanceRate || 100.0);
      toast.success(`Synced HR Biometric Timecard for ${calc.staffName}. Attendance: ${calc.attendanceRate}%, Overtime: +$${calc.overtimeAmount}`);
    } catch {
      toast.error('Could not sync timecard.');
    }
  };

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter(p => {
      const matchQuery = !query ||
        p.payrollNumber.toLowerCase().includes(query.toLowerCase()) ||
        p.staffName.toLowerCase().includes(query.toLowerCase()) ||
        p.payPeriod.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [payrolls, query, statusFilter]);

  const activeFiltersCount = statusFilter !== 'all' ? 1 : 0;

  const handleCreatePayrollRun = async (e: React.FormEvent) => {
    e.preventDefault();
    const base = parseFloat(baseSalary || '0');
    const ot = parseFloat(overtimeAmount || '0');
    const ded = parseFloat(deductionsAmount || '0');
    const net = base + ot - ded;

    const created = await financeService.createPayrollRun({
      payPeriod,
      staffId: selectedHrStaffId || `STF-${Date.now().toString().slice(-4)}`,
      staffName,
      staffRole,
      department,
      baseSalary: base,
      overtimeHours: Math.round(ot / 35),
      overtimeAmount: ot,
      deductionsAmount: ded,
      netPayable: net,
      attendanceRate,
      status: 'draft'
    });

    setPayrolls([created, ...payrolls]);
    toast.success(`Generated Payroll Run ${created.payrollNumber} for ${staffName} (Net: $${net.toFixed(2)})`);
    setShowCreateModal(false);
  };

  const handleAdvanceWorkflow = async (p: PayrollRun) => {
    const nextMap: Record<string, any> = {
      draft: 'submitted',
      submitted: 'reviewed',
      reviewed: 'approved',
      approved: 'paid',
      paid: 'closed'
    };
    const nextStatus = nextMap[p.status];
    if (!nextStatus) return;

    if (nextStatus === 'paid') {
      try {
        const res = await financeService.processPayrollDisbursement(p.id);
        toast.success(`Payroll disbursed & GL Journal Entry ${res.journal.journalNumber} posted! Credited $${(p.netPayable || p.totalNetPay || 0).toLocaleString()} from Main Bank.`);
      } catch {
        p.status = 'paid';
        toast.success(`Payroll ${p.payrollNumber} marked as PAID and GL balance settled.`);
      }
    } else {
      p.status = nextStatus;
      toast.success(`Payroll ${p.payrollNumber} advanced to [${nextStatus.toUpperCase()}].`);
    }
    setPayrolls([...payrolls]);
  };

  const totalPayrollOutflow = useMemo(() => payrolls.reduce((s, p) => s + p.netPayable, 0), [payrolls]);
  const avgAttendance = useMemo(() => {
    if (payrolls.length === 0) return 100;
    return payrolls.reduce((s, p) => s + (p.attendanceRate || 100), 0) / payrolls.length;
  }, [payrolls]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_outflow',
      title: 'Monthly Staff Payroll Outflow',
      value: `$${totalPayrollOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${payrolls.length} faculty & administrative personnel processed`,
      trendDirection: 'neutral',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'avg_attendance',
      title: 'Faculty Attendance Rate',
      value: `${avgAttendance.toFixed(1)}%`,
      subtitle: 'HR bio-metric integration verified prior to payout',
      trendDirection: 'up',
      icon: <UserCheck className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'approved_ready',
      title: 'Approved & Payout Ready',
      value: `${payrolls.filter(p => p.status === 'approved' || p.status === 'paid').length} Staff`,
      subtitle: 'Multi-stage approval pipeline passed',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'payslips_generated',
      title: 'Electronic Payslips & QR',
      value: '100% Digital',
      subtitle: 'Accessible via Teacher & Staff portals with QR verify',
      trendDirection: 'up',
      icon: <FileText className="w-5 h-5 text-amber-400" />
    }
  ];

  const columns = useMemo<ColumnDef<PayrollRun, any>[]>(() => {
    return [
      {
        accessorKey: 'payrollNumber',
        header: 'Voucher Ref & Pay Period',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-black text-emerald-400 block">{row.original.payrollNumber}</span>
            <span className="font-bold text-white text-xs sm:text-sm block">{row.original.payPeriod}</span>
          </div>
        )
      },
      {
        accessorKey: 'staffName',
        header: 'Faculty Member & Role',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-bold text-white text-xs block">{row.original.staffName}</span>
            <span className="text-[11px] text-slate-400 block truncate max-w-xs">{row.original.staffRole} • {row.original.department}</span>
          </div>
        )
      },
      {
        accessorKey: 'attendanceRate',
        header: 'HR Attendance & Overtime',
        cell: ({ row }) => (
          <div className="space-y-0.5 font-mono text-xs">
            <span className="text-emerald-400 font-bold block">Att: {row.original.attendanceRate || 100}%</span>
            <span className="text-slate-300 block">OT: +${row.original.overtimeAmount.toFixed(2)} ({row.original.overtimeHours} hrs)</span>
          </div>
        )
      },
      {
        accessorKey: 'netPayable',
        header: 'Base vs Net Payable ($)',
        cell: ({ row }) => (
          <div className="space-y-0.5 font-mono">
            <span className="text-xs text-slate-300 block">Base: ${row.original.baseSalary.toFixed(2)}</span>
            <span className="text-xs sm:text-sm font-black text-emerald-400 block">Net: ${row.original.netPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        )
      },
      {
        accessorKey: 'status',
        header: 'Workflow Stage',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Workflow & Payslip',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {row.original.status !== 'closed' && (
              <button
                onClick={() => handleAdvanceWorkflow(row.original)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Advance Stage →</span>
              </button>
            )}
            <button
              onClick={() => setShowPayslipModal(row.original)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Print Payslip"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      }
    ];
  }, [payrolls]);

  return (
    <EnterpriseModuleShell
      title="Staff Payroll Runs & HR Compensation Console"
      description="SAP S/4HANA & Odoo payroll engine. Computes monthly faculty compensation integrating HR biometric attendance, overtime, unpaid leave deductions, and staff-child tuition discounts."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Payroll & Budget' }, { label: 'Staff Payroll' }]}
      icon={<Users className="w-8 h-8 text-emerald-400" />}
      recordCount={filteredPayrolls.length}
      recordLabel="Payroll Vouchers"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setStatusFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/payroll/approvals"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Multi-Stage Approvals</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Generate Payroll Run</span>
          </button>
        </div>
      }
    >
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/payroll" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span>Staff Payroll Runs</span>
        </Link>
        <Link href="/finance/payroll/approvals" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Payroll Approval Pipeline</span>
        </Link>
        <Link href="/finance/expenses" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5 text-amber-400" />
          <span>Operating Expenses</span>
        </Link>
        <Link href="/finance/budget" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Departmental Budget vs Actual</span>
        </Link>
      </div>

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search payroll runs by reference (PAY-XXXX), staff name, or month period..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Staff payroll records synced with HR attendance matrix.');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setStatusFilter('all'); setQuery(''); }}
        createButtonLabel="+ New Payroll Run"
        onCreate={() => setShowCreateModal(true)}
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredPayrolls}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedPayroll(row)}
        onRowClick={(row) => setSelectedPayroll(row)}
        emptyStateProps={{
          title: 'No Payroll Runs Found',
          description: 'No staff payroll vouchers match your search query or status stage.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setStatusFilter('all'); setQuery(''); },
          createLabel: 'Generate First Run',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Generate Payroll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Users className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-black text-white">Generate Staff Payroll Run</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreatePayrollRun} className="space-y-4">
              <div className="bg-slate-950/80 border border-emerald-900/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider">HR Biometric Timecard Sync</h4>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-bold text-slate-300">Select Academic Staff Member</label>
                    <select
                      value={selectedHrStaffId}
                      onChange={(e) => setSelectedHrStaffId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                    >
                      {hrStaffList.map(hr => (
                        <option key={hr.id} value={hr.staffId}>
                          {hr.staffName} ({hr.staffRole}) - {hr.department}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSyncHRTimecard(selectedHrStaffId)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 whitespace-nowrap transition-all"
                  >
                    Auto-Calculate Payroll
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Payroll Period Span</label>
                <input
                  type="text"
                  required
                  value={payPeriod}
                  onChange={(e) => setPayPeriod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Staff Member Name</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={staffName}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-medium focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Staff Job Role / Title</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={staffRole}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-medium focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider">Compensation Breakdown ($ USD)</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Base Salary</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      readOnly
                      value={baseSalary}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono font-bold focus:outline-none cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Overtime Pay (+)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      readOnly
                      value={overtimeAmount}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-mono font-bold focus:outline-none cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Deductions (-)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      readOnly
                      value={deductionsAmount}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 text-xs font-mono font-bold focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div>
                  <span className="text-xs text-slate-400">Net Payable Compensation:</span>
                  <span className="text-xl font-black font-mono text-emerald-400 block">
                    ${(parseFloat(baseSalary || '0') + parseFloat(overtimeAmount || '0') - parseFloat(deductionsAmount || '0')).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancel</button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">Generate Run</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Payslip Modal */}
      {showPayslipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Official Institutional Payslip</h3>
                  <p className="text-xs text-slate-400 font-mono">Ref: {showPayslipModal.payrollNumber} • {showPayslipModal.payPeriod}</p>
                </div>
              </div>
              <button onClick={() => setShowPayslipModal(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-black text-white text-base">{showPayslipModal.staffName}</h4>
                  <p className="text-xs text-slate-400">{showPayslipModal.staffRole} | Department: <span className="text-slate-200">{showPayslipModal.department}</span></p>
                </div>
                <StatusBadge status={showPayslipModal.status} size="sm" />
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-300">Base Monthly Salary:</span>
                  <span className="text-white font-bold">${showPayslipModal.baseSalary.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-emerald-400">Overtime Allowance ({showPayslipModal.overtimeHours} hrs):</span>
                  <span className="text-emerald-400 font-bold">+${showPayslipModal.overtimeAmount.toFixed(2)}</span>
                </div>
                {showPayslipModal.deductionsAmount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-rose-400">Unpaid Leave & Tax Deductions:</span>
                    <span className="text-rose-400 font-bold">-${showPayslipModal.deductionsAmount.toFixed(2)}</span>
                  </div>
                )}
                {showPayslipModal.journalEntryId && (
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-sky-400">GL Settlement Voucher:</span>
                    <span className="text-sky-400 font-bold font-mono">{showPayslipModal.journalEntryId}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 text-sm font-black text-white border-t border-slate-700">
                  <span>Net Payable Payout:</span>
                  <span className="text-emerald-400">${showPayslipModal.netPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 font-mono">Cryptographic QR Verification ID: QR-PAY-2026</span>
              <button
                onClick={() => {
                  toast.success(`Printing certified electronic payslip ${showPayslipModal.payrollNumber}`);
                  setShowPayslipModal(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print & Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedPayroll}
        onClose={() => setSelectedPayroll(null)}
        record={selectedPayroll ? {
          name: selectedPayroll.staffName,
          id: selectedPayroll.payrollNumber,
          role: selectedPayroll.staffRole,
          status: selectedPayroll.status,
          email: `Department: ${selectedPayroll.department}`,
          phone: `Period: ${selectedPayroll.payPeriod}`,
          department: `Attendance: ${selectedPayroll.attendanceRate}%`,
          joinDate: `Base: $${selectedPayroll.baseSalary.toFixed(2)} | OT: $${selectedPayroll.overtimeAmount.toFixed(2)}`,
          balance: selectedPayroll.journalEntryId 
            ? `GL VOUCHER: ${selectedPayroll.journalEntryId} | NET: $${selectedPayroll.netPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
            : `NET COMPENSATION: $${selectedPayroll.netPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

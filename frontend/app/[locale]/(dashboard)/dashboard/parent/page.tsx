/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  GraduationCap, DollarSign, Calendar, Bell, CheckCircle2,
  RefreshCw, ArrowRight, AlertTriangle, FileText, Wallet,
  ChevronDown, ChevronUp, CreditCard, Clock, User, PiggyBank,
  TrendingUp, AlertCircle, BookOpen, Shield
} from 'lucide-react';

import { dashboardService, type ParentDashboardData } from '@/services/dashboard.service';
import { erpService } from '@/services/erp.service';
import { financeService } from '@/services/finance.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { DashboardWidgetCustomizer, type WidgetConfig } from '@/components/ui/DashboardWidgetCustomizer';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Student } from '@/types/erp.types';
import type { Invoice } from '@/types/finance.types';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stat-children', title: 'Linked Wards', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-fees', title: 'Fee Status', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-wallet', title: 'Advance Wallet', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-events', title: 'Upcoming Events', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'children-finance', title: 'Children Finance Detail', layer: 'chart', isVisible: true, isPinned: true, size: 'large' },
  { id: 'action-announcements', title: 'School Notices & Fee Due Reminders', layer: 'action', isVisible: true, isPinned: false, size: 'large' },
];

interface ChildFinanceProfile {
  student: Student;
  invoices: Invoice[];
  advanceBalance: number;
  totalDebt: number;
  totalPaid: number;
}

export default function ParentDashboardPage() {
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [childProfiles, setChildProfiles] = useState<ChildFinanceProfile[]>([]);
  const [expandedChild, setExpandedChild] = useState<number | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setFinanceLoading(true);
    try {
      const [dashRes, studentsRes, allInvoices] = await Promise.all([
        dashboardService.getParentDashboard().catch(() => null),
        erpService.getStudents({ limit: 200 }),
        financeService.getInvoices().catch(() => [] as Invoice[]),
      ]);

      setData(dashRes);

      // Build finance profiles for each child
      const profiles: ChildFinanceProfile[] = await Promise.all(
        studentsRes.data.slice(0, 10).map(async (student) => {
          const studentInvoices = allInvoices.filter(
            (inv) =>
              inv.student?.id === student.id ||
              inv.student?.schoolId === student.schoolId ||
              (inv as any).studentId === student.studentId
          );
          const advanceBalance = Number((student as any).advanceBalance || 0) ||
            await erpService.getStudentAdvanceBalance(student.id).catch(() => 0);
          const totalDebt = studentInvoices
            .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
            .reduce((acc, inv) => acc + (inv.remainingBalance ?? inv.totalAmount ?? 0), 0);
          const totalPaid = studentInvoices
            .filter((i) => i.status === 'paid' || (i.paidAmount ?? 0) > 0)
            .reduce((acc, inv) => acc + (inv.paidAmount ?? 0), 0);

          return { student, invoices: studentInvoices, advanceBalance, totalDebt, totalPaid };
        })
      );

      setChildProfiles(profiles);
    } catch (err) {
      toast.error('Failed to load parent live dashboard data');
    } finally {
      setIsLoading(false);
      setFinanceLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isVisible = (id: string) => widgets.find((w) => w.id === id)?.isVisible ?? true;

  const totalAdvanceWallet = useMemo(
    () => childProfiles.reduce((s, p) => s + p.advanceBalance, 0),
    [childProfiles]
  );
  const totalOutstanding = useMemo(
    () => childProfiles.reduce((s, p) => s + p.totalDebt, 0),
    [childProfiles]
  );

  const statusColor: Record<string, string> = {
    paid: 'text-emerald-400 bg-emerald-900/40 border-emerald-600/40',
    partially_paid: 'text-amber-400 bg-amber-900/40 border-amber-600/40',
    pending_payment: 'text-sky-400 bg-sky-900/40 border-sky-600/40',
    overdue: 'text-rose-400 bg-rose-900/40 border-rose-600/40',
    draft: 'text-slate-400 bg-slate-800/60 border-slate-600/40',
    submitted: 'text-violet-400 bg-violet-900/40 border-violet-600/40',
    approved: 'text-blue-400 bg-blue-900/40 border-blue-600/40',
    cancelled: 'text-slate-500 bg-slate-800/40 border-slate-700/40',
    refunded: 'text-orange-400 bg-orange-900/40 border-orange-600/40',
  };

  return (
    <PageContainer>
      <PageHeader
        title="Parent & Guardian Finance Portal"
        description="Track your children's school fee invoices, advance wallet balances, payment history, and school announcements — all in one place."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span>Refresh Live Data</span>
          </button>
          <DashboardWidgetCustomizer
            role="parent"
            defaultWidgets={DEFAULT_WIDGETS}
            onUpdate={setWidgets}
          />
        </div>
      </PageHeader>

      {/* ── Summary KPI Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isVisible('stat-children') && (
          <StatCard
            title="Linked Wards"
            value={formatNumber(childProfiles.length || data?.childrenCount || 0)}
            subtitle="Registered children profiles"
            icon={GraduationCap}
            color="text-emerald-500"
            bgColor="bg-emerald-500/10"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-fees') && (
          <StatCard
            title="Total Outstanding Fees"
            value={totalOutstanding > 0 ? `$${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Cleared'}
            subtitle={totalOutstanding > 0 ? 'Balance due across all children' : 'All term invoices settled'}
            icon={totalOutstanding > 0 ? AlertCircle : CheckCircle2}
            color={totalOutstanding > 0 ? 'text-rose-500' : 'text-emerald-600'}
            bgColor={totalOutstanding > 0 ? 'bg-rose-500/10' : 'bg-emerald-600/10'}
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-wallet') && (
          <StatCard
            title="Advance Payment Wallet"
            value={totalAdvanceWallet > 0 ? `$${totalAdvanceWallet.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
            subtitle={totalAdvanceWallet > 0 ? 'Available credit for future invoices' : 'No pre-credit balance'}
            icon={PiggyBank}
            color={totalAdvanceWallet > 0 ? 'text-emerald-400' : 'text-slate-400'}
            bgColor={totalAdvanceWallet > 0 ? 'bg-emerald-500/10' : 'bg-slate-500/10'}
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-events') && (
          <StatCard
            title="Upcoming Events"
            value={formatNumber(data?.upcomingEvents || 0)}
            subtitle="School activities scheduled"
            icon={Calendar}
            color="text-amber-500"
            bgColor="bg-amber-500/10"
            isLoading={isLoading}
          />
        )}
      </div>

      {/* ── Main Content Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Children Finance Cards ─────────────────────────────────────── */}
        {isVisible('children-finance') && (
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Children Finance Profiles
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">{childProfiles.length} Ward(s) Linked</span>
            </div>

            {financeLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse bg-slate-800/60 rounded-2xl h-32 border border-slate-700/40" />
                ))}
              </div>
            ) : childProfiles.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-10 text-center">
                <User className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-semibold">No children profiles linked yet.</p>
                <p className="text-slate-500 text-xs mt-1">Contact the school registrar to link your wards to this account.</p>
              </div>
            ) : (
              childProfiles.map((profile, idx) => {
                const { student, invoices, advanceBalance, totalDebt, totalPaid } = profile;
                const isExpanded = expandedChild === idx;
                const pendingInvoices = invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled');
                const paidInvoices = invoices.filter((i) => i.status === 'paid');

                return (
                  <div
                    key={student.id}
                    className={cn(
                      'rounded-2xl border transition-all duration-300',
                      totalDebt > 0
                        ? 'bg-slate-900/80 border-rose-600/20'
                        : 'bg-slate-900/80 border-emerald-600/20'
                    )}
                  >
                    {/* Child Header */}
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className={cn(
                          'w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shrink-0',
                          totalDebt > 0 ? 'bg-rose-900/40 text-rose-300' : 'bg-emerald-900/40 text-emerald-300'
                        )}>
                          {student.firstName?.[0] || '?'}{student.lastName?.[0] || ''}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">
                            {student.firstName} {student.middleName ? student.middleName + ' ' : ''}{student.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">{student.schoolId || student.studentId}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {totalDebt > 0 ? (
                              <span className="text-[10px] bg-rose-900/40 text-rose-400 border border-rose-600/30 px-2 py-0.5 rounded-full font-bold">
                                ${totalDebt.toFixed(2)} Outstanding
                              </span>
                            ) : (
                              <span className="text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-600/30 px-2 py-0.5 rounded-full font-bold">
                                ✓ Fees Cleared
                              </span>
                            )}
                            {advanceBalance > 0 && (
                              <span className="text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-600/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                <PiggyBank className="w-2.5 h-2.5" />
                                ${advanceBalance.toFixed(2)} Wallet Credit
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Summary pills + expand toggle */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:flex flex-col items-end gap-0.5">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Total Paid</span>
                          <span className="text-sm font-black text-emerald-400 font-mono">${totalPaid.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => setExpandedChild(isExpanded ? null : idx)}
                          className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Invoice Section */}
                    {isExpanded && (
                      <div className="border-t border-slate-800 px-4 pb-4 pt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">

                        {/* Advance Wallet Banner */}
                        {advanceBalance > 0 && (
                          <div className="flex items-center gap-3 bg-emerald-950/50 border border-emerald-600/30 rounded-xl px-4 py-3">
                            <PiggyBank className="w-5 h-5 text-emerald-400 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-emerald-300">Advance Payment Wallet — Available Credit</p>
                              <p className="text-lg font-black text-emerald-400 font-mono">+${advanceBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                              <p className="text-[10px] text-emerald-600 mt-0.5">This credit will be applied automatically to future invoices or can be applied by the finance desk.</p>
                            </div>
                          </div>
                        )}

                        {/* Pending Invoices */}
                        {pendingInvoices.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-rose-400 tracking-wider mb-2 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Pending Invoices
                            </p>
                            <div className="space-y-2">
                              {pendingInvoices.map((inv) => (
                                <div key={inv.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white font-mono">{inv.invoiceNumber}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="text-right">
                                      <p className="text-[10px] text-slate-500">Remaining</p>
                                      <p className="text-sm font-black text-rose-400 font-mono">${(inv.remainingBalance ?? inv.totalAmount ?? 0).toFixed(2)}</p>
                                    </div>
                                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', statusColor[inv.status] || 'text-slate-400 bg-slate-800 border-slate-700')}>
                                      {inv.status?.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Paid Invoices */}
                        {paidInvoices.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-2 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Settled Invoices
                            </p>
                            <div className="space-y-2">
                              {paidInvoices.map((inv) => (
                                <div key={inv.id} className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-300 font-mono">{inv.invoiceNumber}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      Paid: {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="text-right">
                                      <p className="text-[10px] text-slate-500">Total</p>
                                      <p className="text-sm font-black text-emerald-400 font-mono">${(inv.totalAmount ?? 0).toFixed(2)}</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-emerald-400 bg-emerald-900/40 border-emerald-600/40">
                                      paid
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {invoices.length === 0 && (
                          <p className="text-xs text-slate-500 text-center py-4">No invoices generated yet for this child.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Right Column: Announcements ────────────────────────────────── */}
        {isVisible('action-announcements') && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span>School Notices & Directives</span>
              </h2>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
                {(data?.announcements && data.announcements.length > 0) ? (
                  data.announcements.map((ann: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <p className="text-xs font-bold text-foreground">{ann.title || 'School Notice'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{ann.content || ann.message || ''}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No active notices published yet.
                  </div>
                )}
              </div>
            </div>

            {/* Finance Help Card */}
            <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Finance Help Desk</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                For payment issues or to apply your child's advance wallet to a new invoice, contact the school's Finance Department or Account Lead.
              </p>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <CreditCard className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Advance wallet auto-applied to next invoice</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Finance desk open: Sun–Thu, 8am–4pm</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <TrendingUp className="w-3 h-3 text-sky-400 shrink-0" />
                  <span>All payments reflected within 24hrs</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

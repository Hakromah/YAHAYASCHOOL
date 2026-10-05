/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from '@/i18n/routing';
import {
  PiggyBank, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, ShieldCheck, AlertTriangle,
  Lock, Unlock, RefreshCw, Printer, UserCheck, ScrollText, X,
  Smartphone, Landmark, CreditCard, Layers, Calendar, ArrowRight,
  TrendingUp, Check, AlertCircle, Sparkles, Building2
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { useAuth } from '@/hooks/useAuth';
import { financeService } from '@/services/finance.service';
import type { CashierSession, PaymentReceipt } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function fmtDateTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

// ─── Print Z-Report Slip ─────────────────────────────────────────────────────

function printCashierZReport(session: CashierSession) {
  const schoolLogoUrl = window.location.origin + '/yahaya-logo.jpeg';
  const cashCollected = Number(session.cashCollections || 0);
  const digitalCollected = Number(session.digitalCollections || 0);
  const totalRev = Number(session.totalCollections || 0);
  const openFloat = Number(session.openingCash || 0);
  const expectedCash = Number(session.expectedClosingCash || (openFloat + cashCollected));
  const countedCash = session.actualClosingCash !== undefined ? Number(session.actualClosingCash) : expectedCash;
  const variance = countedCash - expectedCash;

  const receiptsList: PaymentReceipt[] = session.receipts || [];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>POS Z-Report - ${session.sessionNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Inter:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body {
          font-family: 'JetBrains Mono', monospace;
          color: #0f172a;
          margin: 0;
          padding: 24px;
          background-color: #ffffff;
          line-height: 1.4;
          max-width: 480px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #0f172a;
          padding-bottom: 16px;
          margin-bottom: 16px;
        }
        .logo {
          width: 50px;
          height: 50px;
          margin-bottom: 8px;
        }
        .title {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .subtitle {
          font-size: 11px;
          color: #475569;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 4px;
        }
        .divider {
          border-bottom: 1px dashed #cbd5e1;
          margin: 12px 0;
        }
        .section-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .total-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          margin: 12px 0;
        }
        .grand-total {
          font-size: 15px;
          font-weight: 800;
          display: flex;
          justify-content: space-between;
        }
        .variance-line {
          font-weight: 700;
          color: ${variance === 0 ? '#16a34a' : variance > 0 ? '#0284c7' : '#dc2626'};
        }
        .signatures {
          margin-top: 30px;
          padding-top: 16px;
          border-top: 1px dashed #0f172a;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
        }
        .sig-block {
          width: 45%;
          text-align: center;
        }
        .sig-line {
          border-bottom: 1px solid #0f172a;
          margin-top: 35px;
          margin-bottom: 4px;
        }
        @media print {
          body { padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img class="logo" src="${schoolLogoUrl}" alt="Logo" onerror="this.style.display='none'">
        <div class="title">YAHAYASCOOL ACADEMY</div>
        <div class="subtitle">Cashier Terminal POS Z-Report / Audit Slip</div>
        <div class="subtitle">Campus Bursary & Treasury Reconciliation</div>
      </div>

      <div class="meta-row">
        <span>SESSION ID:</span>
        <strong>${session.sessionNumber}</strong>
      </div>
      <div class="meta-row">
        <span>CASHIER OPERATOR:</span>
        <strong>${session.cashierName}</strong>
      </div>
      <div class="meta-row">
        <span>TERMINAL STATUS:</span>
        <strong>${(session.status || 'CLOSED').toUpperCase()}</strong>
      </div>
      <div class="meta-row">
        <span>OPENED AT:</span>
        <span>${fmtDateTime(session.openedAt)}</span>
      </div>
      <div class="meta-row">
        <span>CLOSED / AUDITED:</span>
        <span>${session.closedAt ? fmtDateTime(session.closedAt) : 'ACTIVE / OPEN'}</span>
      </div>

      <div class="divider"></div>

      <div class="section-title">REVENUE & DRAWER AUDIT BREAKDOWN</div>
      <div class="meta-row">
        <span>Initial Opening Float:</span>
        <span>$${fmtMoney(openFloat)}</span>
      </div>
      <div class="meta-row">
        <span>Physical Cash Received:</span>
        <span>+$${fmtMoney(cashCollected)}</span>
      </div>
      <div class="meta-row">
        <span>Digital & Bank Wire Settlements:</span>
        <span>+$${fmtMoney(digitalCollected)}</span>
      </div>
      <div class="meta-row">
        <span>Total Verified Receipts (${receiptsList.length}):</span>
        <strong>+$${fmtMoney(totalRev)}</strong>
      </div>

      <div class="total-box">
        <div class="meta-row">
          <span>EXPECTED DRAWER CASH:</span>
          <strong>$${fmtMoney(expectedCash)}</strong>
        </div>
        <div class="meta-row">
          <span>ACTUAL COUNTED CASH:</span>
          <strong>$${fmtMoney(countedCash)}</strong>
        </div>
        <div class="meta-row variance-line">
          <span>AUDIT VARIANCE:</span>
          <span>${variance >= 0 ? `+$${fmtMoney(variance)}` : `-$${fmtMoney(Math.abs(variance))}`} (${variance === 0 ? 'BALANCED' : variance > 0 ? 'OVERAGE' : 'SHORTAGE'})</span>
        </div>
      </div>

      ${session.notes ? `
        <div style="font-size: 10px; color: #475569; margin-top: 8px;">
          <strong>NOTES:</strong> ${session.notes}
        </div>
      ` : ''}

      <div class="signatures">
        <div class="sig-block">
          <div class="sig-line"></div>
          <div>Cashier Signature</div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div>Bursar / Supervisor</div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 9px; color: #94a3b8;">
        Generated Automatically by YAHAYASCOOL ERP • POS Engine
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  } else {
    toast.error('Could not open print window. Please allow popups.');
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CashierSessionsPage() {
  const locale = useLocale();
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const t = useCallback((key: string, loc?: string) => i18nT(key, loc || localeRef.current), []);

  const { user } = useAuth();
  const cashierUserName = (user as any)?.name || user?.username || 'Finance Cashier';

  // Core Data
  const [sessions, setSessions] = useState<CashierSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Grid
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals & Panels
  const [selectedSession, setSelectedSession] = useState<CashierSession | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingCash, setOpeningCash] = useState('200');
  const [terminalLocation, setTerminalLocation] = useState('Campus Cashier Drawer 1');
  const [isSubmittingOpen, setIsSubmittingOpen] = useState(false);

  // Reconcile Drawer Modal
  const [reconcileSession, setReconcileSession] = useState<CashierSession | null>(null);
  const [actualCountedCash, setActualCountedCash] = useState('');
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  // 1. Load Live Sessions from Strapi
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeService.getCashierSessions();
      setSessions(data || []);
    } catch {
      toast.error(t('Failed to load cashier sessions from Strapi.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Open Cashier Session in Strapi
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(openingCash || '0');
    if (isNaN(amountNum) || amountNum < 0) {
      toast.error(t('Please enter a valid opening float amount.'));
      return;
    }

    setIsSubmittingOpen(true);
    try {
      const created = await financeService.createCashierSession({
        cashierName: cashierUserName,
        openingCash: amountNum,
        cashierUserId: user?.id ? String(user.id) : undefined
      });

      toast.success(`${t('Opened Cashier Session')} ${created.sessionNumber} with $${fmtMoney(amountNum)} float.`);
      setShowOpenModal(false);
      setOpeningCash('200');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || t('Failed to open cashier session in Strapi.'));
    } finally {
      setIsSubmittingOpen(false);
    }
  };

  // 3. Reconcile & Close Cashier Session in Strapi
  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileSession) return;

    const countedNum = parseFloat(actualCountedCash || '0');
    if (isNaN(countedNum) || countedNum < 0) {
      toast.error(t('Please enter the actual physical cash counted in drawer.'));
      return;
    }

    const openFloat = Number(reconcileSession.openingCash || 0);
    const cashIntake = Number(reconcileSession.cashCollections || 0);
    const expected = Number(reconcileSession.expectedClosingCash || (openFloat + cashIntake));

    setIsSubmittingClose(true);
    try {
      await financeService.closeCashierSession(
        reconcileSession.id,
        reconcileSession.sessionNumber,
        countedNum,
        expected,
        reconcileNotes
      );

      toast.success(`${t('Reconciled and closed Cashier Session')} ${reconcileSession.sessionNumber}.`);
      setReconcileSession(null);
      setActualCountedCash('');
      setReconcileNotes('');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || t('Failed to close session.'));
    } finally {
      setIsSubmittingClose(false);
    }
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const q = query.toLowerCase().trim();
      const matchQuery = !q ||
        (s.sessionNumber || '').toLowerCase().includes(q) ||
        (s.cashierName || '').toLowerCase().includes(q) ||
        (s.schoolId || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [sessions, query, statusFilter]);

  const activeFiltersCount = statusFilter !== 'all' ? 1 : 0;

  // KPI Calculations
  const activeSessions = useMemo(() => sessions.filter(s => s.status === 'open'), [sessions]);
  const closedSessions = useMemo(() => sessions.filter(s => s.status === 'closed'), [sessions]);
  const activeOpenCash = useMemo(() =>
    activeSessions.reduce((sum, s) => sum + (Number(s.openingCash) || 0) + (Number(s.cashCollections) || 0), 0),
    [activeSessions]
  );
  const totalDigitalCollected = useMemo(() =>
    sessions.reduce((sum, s) => sum + (Number(s.digitalCollections) || 0), 0),
    [sessions]
  );
  const totalGrossCollections = useMemo(() =>
    sessions.reduce((sum, s) => sum + (Number(s.totalCollections) || 0), 0),
    [sessions]
  );

  const kpiCards = useMemo<EnterpriseKPICard[]>(() => [
    {
      id: 'active_sessions',
      title: t('Active Cashier Terminals'),
      value: `${activeSessions.length} ${t('Drawers')}`,
      subtitle: `${sessions.length} ${t('total sessions registered')}`,
      trendDirection: 'up',
      icon: <Unlock className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
      onClick: () => setStatusFilter(f => f === 'open' ? 'all' : 'open'),
      isActive: statusFilter === 'open'
    },
    {
      id: 'drawer_collections',
      title: t('Live Open Drawer Cash Float'),
      value: `$${fmtMoney(activeOpenCash)}`,
      subtitle: t('Opening floats plus physical cash in drawers'),
      trendDirection: 'up',
      icon: <PiggyBank className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
    },
    {
      id: 'digital_collections',
      title: t('Mobile & Gateway Collections'),
      value: `$${fmtMoney(totalDigitalCollected)}`,
      subtitle: t('Orange Money, MTN, Wave & Bank Wire deposits'),
      trendDirection: 'up',
      icon: <Smartphone className="w-5 h-5 text-sky-500 dark:text-sky-400" />
    },
    {
      id: 'reconciled_history',
      title: t('Total Gross POS Intake'),
      value: `$${fmtMoney(totalGrossCollections)}`,
      subtitle: `${closedSessions.length} ${t('audited & sealed sessions')}`,
      trendDirection: 'neutral',
      icon: <Landmark className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
      onClick: () => setStatusFilter(f => f === 'closed' ? 'all' : 'closed'),
      isActive: statusFilter === 'closed'
    }
  ], [activeSessions.length, sessions.length, statusFilter, activeOpenCash, totalDigitalCollected, totalGrossCollections, closedSessions.length, t]);

  // DataGrid Columns Definition
  const columns = useMemo<ColumnDef<CashierSession, any>[]>(() => [
    {
      accessorKey: 'sessionNumber',
      header: t('Session ID & Timing'),
      cell: ({ row }) => {
        const s = row.original;
        const isOpen = s.status === 'open';
        return (
          <div className="space-y-1 py-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                {s.sessionNumber}
              </span>
              {isOpen ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t('ACTIVE')}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {t('SEALED')}
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>{t('Opened')}: {fmtDateTime(s.openedAt)}</span>
              {s.closedAt && <span className="block">{t('Closed')}: {fmtDateTime(s.closedAt)}</span>}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'cashierName',
      header: t('Cashier Operator'),
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-2.5 py-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-400/30 flex items-center justify-center font-black text-xs text-emerald-600 dark:text-emerald-300 shrink-0">
              {s.cashierName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                {s.cashierName}
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block">
                {s.schoolId || 'MAIN-CAMPUS'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'openingCash',
      header: `${t('Opening Float')} ($)`,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 py-1 block">
          ${fmtMoney(row.original.openingCash)}
        </span>
      )
    },
    {
      accessorKey: 'totalCollections',
      header: `${t('Collections Breakdown')} ($)`,
      cell: ({ row }) => {
        const s = row.original;
        const total = Number(s.totalCollections || 0);
        const cash = Number(s.cashCollections || 0);
        const digital = Number(s.digitalCollections || 0);
        const count = s.receiptsCount || s.receipts?.length || 0;
        return (
          <div className="space-y-0.5 font-mono text-xs py-1">
            <span className="font-black text-emerald-600 dark:text-emerald-400 block text-sm">
              +${fmtMoney(total)}
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
              <span>Cash: ${fmtMoney(cash)}</span>
              <span>· Digital: ${fmtMoney(digital)}</span>
              <span className="font-bold text-sky-600 dark:text-sky-400">({count} {t('receipts')})</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'expectedClosingCash',
      header: `${t('Expected Cash In Drawer')} ($)`,
      cell: ({ row }) => {
        const s = row.original;
        const openFloat = Number(s.openingCash || 0);
        const cashIntake = Number(s.cashCollections || 0);
        const expected = Number(s.expectedClosingCash || (openFloat + cashIntake));
        return (
          <div className="font-mono text-xs py-1">
            <span className="font-black text-slate-900 dark:text-slate-100 block">
              ${fmtMoney(expected)}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
              Float (${fmtMoney(openFloat)}) + Cash (${fmtMoney(cashIntake)})
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'variance',
      header: t('Audit Variance'),
      cell: ({ row }) => {
        const s = row.original;
        if (s.status === 'open') {
          return (
            <span className="text-[11px] font-mono text-slate-400 italic">
              {t('Awaiting Close Count')}
            </span>
          );
        }
        const v = Number(s.variance || 0);
        if (v === 0) {
          return (
            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" /> $0.00 {t('Balanced')}
            </span>
          );
        }
        if (v > 0) {
          return (
            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
              +${fmtMoney(v)} {t('Overage')}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
            -${fmtMoney(Math.abs(v))} {t('Shortage')}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            {s.status === 'open' ? (
              <button
                onClick={() => {
                  const openFloat = Number(s.openingCash || 0);
                  const cashIntake = Number(s.cashCollections || 0);
                  const expected = Number(s.expectedClosingCash || (openFloat + cashIntake));
                  setActualCountedCash(String(expected));
                  setReconcileNotes('');
                  setReconcileSession(s);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t('Reconcile & Close')}</span>
              </button>
            ) : (
              <button
                onClick={() => printCashierZReport(s)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                title={t('Print Z-Report Slip')}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t('Z-Report')}</span>
              </button>
            )}
            <button
              onClick={() => setSelectedSession(s)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title={t('Inspect session particulars')}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    }
  ], [t]);

  return (
    <EnterpriseModuleShell
      title={t('Cashier POS Sessions & Drawer Reconciliation')}
      description={t('Real-time terminal drawer sessions, multi-channel payment reconciliation, daily physical cash audits, and end-of-day Z-Report generation.')}
      breadcrumbs={[
        { label: t('Finance ERP'), href: '/finance' },
        { label: t('Billing Suite'), href: '/finance/billing/invoices' },
        { label: t('Cashier Sessions') }
      ]}
      icon={<PiggyBank className="w-8 h-8 text-emerald-500" />}
      recordCount={filteredSessions.length}
      recordLabel={t('Sessions')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setStatusFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/billing/payments"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>{t('Payment Desk & POS')}</span>
          </Link>
          <button
            onClick={() => setShowOpenModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('+ Open Cashier Session')}</span>
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
          <span>{t('Payment Desk & POS')}</span>
        </Link>
        <Link
          href="/finance/billing/statements"
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('Student Statements')}</span>
        </Link>
        <Link
          href="/finance/billing/sessions"
          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5"
        >
          <PiggyBank className="w-3.5 h-3.5" />
          <span>{t('Cashier Sessions')}</span>
        </Link>
        <Link
          href="/finance/billing/structures"
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5"
        >
          <Building2 className="w-3.5 h-3.5 text-purple-500" />
          <span>{t('Fee Catalog & Structures')}</span>
        </Link>
      </div>

      {/* Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search sessions by session ID, cashier operator, or campus...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success(t('Cashier sessions refreshed from Strapi.'));
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setStatusFilter('all'); setQuery(''); }}
        createButtonLabel={t('+ Open Session')}
        onCreate={() => setShowOpenModal(true)}
        customFilterNodes={
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">{t('Status')}</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">{t('All Sessions')}</option>
              <option value="open">{t('Active / Open')}</option>
              <option value="closed">{t('Audited / Closed')}</option>
            </select>
          </div>
        }
      />

      {/* Data Grid */}
      <EnterpriseDataGrid
        data={filteredSessions}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={row => setSelectedSession(row)}
        emptyStateProps={{
          title: t('No Cashier Sessions Found'),
          description: t('No drawer sessions match your filter criteria. Open a session to begin logging cashier collections.'),
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setStatusFilter('all'); setQuery(''); },
          createLabel: t('Open First Session'),
          onCreate: () => setShowOpenModal(true)
        }}
      />

      {/* Open Session Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t('Open New Cashier Terminal Drawer')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {t('Live Strapi Session Registration')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOpenModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenSession} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {t('Assigned Cashier Officer')}
                </label>
                <input
                  type="text"
                  readOnly
                  value={cashierUserName}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {t('Terminal Location / Drawer Code')}
                </label>
                <input
                  type="text"
                  value={terminalLocation}
                  onChange={e => setTerminalLocation(e.target.value)}
                  placeholder="e.g. Campus Cashier Drawer 1"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {t('Initial Opening Cash Float ($ USD)')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="200.00"
                  value={openingCash}
                  onChange={e => setOpeningCash(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400">
                  {t('Physical cash placed in drawer to provide change to paying students/parents.')}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOpen}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{isSubmittingOpen ? t('Opening Drawer...') : t('Open Drawer & Start Session')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reconcile & Close Drawer Modal */}
      {reconcileSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t('Reconcile & Seal Cashier Drawer')}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {reconcileSession.sessionNumber} · {reconcileSession.cashierName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReconcileSession(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseSession} className="space-y-4 text-xs">
              {/* Drawer Ledger Summary */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{t('Initial Float')}:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">${fmtMoney(reconcileSession.openingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{t('Physical Cash Collected')}:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+${fmtMoney(reconcileSession.cashCollections)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{t('Digital & Wire Intake')}:</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400">+${fmtMoney(reconcileSession.digitalCollections)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold">
                  <span className="text-slate-900 dark:text-white">{t('Expected Physical Cash In Drawer')}:</span>
                  <span className="font-mono text-sm text-slate-900 dark:text-white">
                    ${fmtMoney(Number(reconcileSession.expectedClosingCash || ((Number(reconcileSession.openingCash) || 0) + (Number(reconcileSession.cashCollections) || 0))))}
                  </span>
                </div>
              </div>

              {/* Physical Cash Count Input */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {t('Actual Physical Cash Counted in Drawer ($ USD)')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={actualCountedCash}
                  onChange={e => setActualCountedCash(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-sm font-black focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Live Variance Calculation Display */}
              {actualCountedCash !== '' && (
                (() => {
                  const counted = parseFloat(actualCountedCash || '0');
                  const exp = Number(reconcileSession.expectedClosingCash || ((Number(reconcileSession.openingCash) || 0) + (Number(reconcileSession.cashCollections) || 0)));
                  const diff = counted - exp;
                  return (
                    <div className={`p-3 rounded-2xl border text-xs font-mono flex items-center justify-between ${
                      diff === 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : diff > 0
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300'
                          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    }`}>
                      <span className="font-bold">
                        {diff === 0 ? `✓ ${t('Drawer Balanced Exactly')}` : diff > 0 ? `▲ ${t('Cash Overage Detected')}` : `▼ ${t('Cash Shortage Detected')}`}
                      </span>
                      <strong className="text-sm">
                        {diff >= 0 ? `+$${fmtMoney(diff)}` : `-$${fmtMoney(Math.abs(diff))}`}
                      </strong>
                    </div>
                  );
                })()
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {t('Reconciliation & Supervisor Notes (Optional)')}
                </label>
                <textarea
                  rows={2}
                  value={reconcileNotes}
                  onChange={e => setReconcileNotes(e.target.value)}
                  placeholder={t('Enter drawer audit comments or discrepancy rationale...')}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReconcileSession(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClose}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSubmittingClose ? t('Sealing...') : t('Seal Drawer & Close Session')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Session Particulars Slideout Panel */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={() => setSelectedSession(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t('Cashier Terminal Session Audit')}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {selectedSession.sessionNumber} · {selectedSession.cashierName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* Status Box */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t('Terminal Status')}</span>
                    <span className={`px-2.5 py-1 rounded-xl font-bold uppercase text-[10px] ${
                      selectedSession.status === 'open'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {selectedSession.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('Opened At')}</span>
                      <strong className="text-slate-900 dark:text-white text-xs">{fmtDateTime(selectedSession.openedAt)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('Closed At')}</span>
                      <strong className="text-slate-900 dark:text-white text-xs">{fmtDateTime(selectedSession.closedAt)}</strong>
                    </div>
                  </div>
                </div>

                {/* Collections Breakdown Grid */}
                <div className="grid grid-cols-3 gap-3 font-mono">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('Opening Float')}</span>
                    <strong className="text-sm font-black text-slate-900 dark:text-white block mt-1">
                      ${fmtMoney(selectedSession.openingCash)}
                    </strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('Cash Intake')}</span>
                    <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                      +${fmtMoney(selectedSession.cashCollections)}
                    </strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('Digital/Wire')}</span>
                    <strong className="text-sm font-black text-sky-600 dark:text-sky-400 block mt-1">
                      +${fmtMoney(selectedSession.digitalCollections)}
                    </strong>
                  </div>
                </div>

                {/* Audit Reconciliation Box */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('Expected In Drawer')}:</span>
                    <strong className="text-slate-900 dark:text-white">
                      ${fmtMoney(Number(selectedSession.expectedClosingCash || ((Number(selectedSession.openingCash) || 0) + (Number(selectedSession.cashCollections) || 0))))}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('Actual Counted')}:</span>
                    <strong className="text-slate-900 dark:text-white">
                      ${fmtMoney(selectedSession.actualClosingCash !== undefined ? selectedSession.actualClosingCash : selectedSession.expectedClosingCash)}
                    </strong>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-xs">
                    <span>{t('Reconciliation Variance')}:</span>
                    <span className={Number(selectedSession.variance || 0) === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {Number(selectedSession.variance || 0) >= 0 ? `+$${fmtMoney(selectedSession.variance || 0)}` : `-$${fmtMoney(Math.abs(selectedSession.variance || 0))}`}
                    </span>
                  </div>
                </div>

                {/* Receipts list in this session */}
                <div className="space-y-2">
                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    {t('Receipts Processed In This Session')} ({selectedSession.receipts?.length || selectedSession.receiptsCount || 0})
                  </h4>
                  {selectedSession.receipts && selectedSession.receipts.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
                      {selectedSession.receipts.map((r: PaymentReceipt) => (
                        <div key={r.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <div>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">{r.receiptNumber}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{r.studentName} · {r.paymentMethod}</span>
                          </div>
                          <strong className="font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                            +${fmtMoney(r.amount || r.paymentAmount)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs italic p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                      {t('No receipts recorded in this session yet.')}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 shrink-0">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  {t('Close')}
                </button>
                <button
                  onClick={() => printCashierZReport(selectedSession)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('Print Z-Report Slip')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

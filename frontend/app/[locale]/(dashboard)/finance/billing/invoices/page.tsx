/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@/i18n/routing';
import {
  FileText, Plus, Search, Filter, Download, Eye, AlertTriangle,
  CheckCircle2, Clock, DollarSign, Percent, Layers, Award, Coins,
  Calendar, User, Mail, Shield, ArrowRight, Printer, Sparkles, Activity, X, Edit3,
  StickyNote, Phone, Check, ChevronRight, UserCheck, School, CreditCard, Tag,
  Receipt, Wallet
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { useAuth } from '@/hooks/useAuth';
import { financeService } from '@/services/finance.service';
import type { Invoice, InvoiceLineItem } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';
import { erpService } from '@/services/erp.service';
import type { Student, Parent } from '@/types/erp.types';
import { printInvoiceDocument } from '@/lib/print-finance';

// ─── Floating Portal Note Popover ───────────────────────────────────────────

interface FloatingNoteCardProps {
  data: {
    invoice: Invoice;
    anchorRect: { top: number; left: number; bottom: number; right: number; width: number; height: number };
  };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClickInspect: (inv: Invoice) => void;
}

function FloatingInvoiceNoteCard({ data, onMouseEnter, onMouseLeave, onClickInspect }: FloatingNoteCardProps) {
  const { invoice, anchorRect } = data;
  const popoverWidth = 360;

  // Horizontal position (constrained within viewport)
  let left = anchorRect.left;
  if (typeof window !== 'undefined') {
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }
    if (left < 16) left = 16;
  }

  // Vertical position: place below by default, or flip above if close to bottom
  const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - anchorRect.bottom : 500;
  const showAbove = spaceBelow < 260 && anchorRect.top > 260;
  const top = showAbove ? undefined : anchorRect.bottom + 8;
  const bottom = showAbove && typeof window !== 'undefined' ? window.innerHeight - anchorRect.top + 8 : undefined;

  const total = Number(invoice.totalAmount || invoice.subtotal || 0);
  const paid = Number(invoice.paidAmount || 0);
  const balance = Number(invoice.remainingBalance ?? (total - paid));
  const sName = invoice.student
    ? `${invoice.student.firstName || ''} ${invoice.student.lastName || ''}`.trim() || invoice.student.name || invoice.studentName || 'Scholar'
    : invoice.studentName || 'Scholar';
  const schoolId = invoice.student?.schoolId || invoice.student?.admissionNumber || invoice.admissionNumber || 'N/A';
  const notesText = invoice.notes?.trim() || '';

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: top !== undefined ? `${top}px` : undefined,
        bottom: bottom !== undefined ? `${bottom}px` : undefined,
        left: `${left}px`,
        width: `${popoverWidth}px`,
        zIndex: 99999,
      }}
      className="bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100 pointer-events-auto select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
            <StickyNote className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase font-mono tracking-tight">
              Invoice Note &amp; Remarks
            </h4>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              {invoice.invoiceNumber}
            </span>
          </div>
        </div>
        <StatusBadge status={invoice.status || 'draft'} size="sm" />
      </div>

      {/* Scholar mini info */}
      <div className="flex items-center justify-between text-[11px] font-mono bg-slate-50 dark:bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
        <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[210px]">{sName}</span>
        <span className="text-slate-500 font-mono text-[10px]">ID: {schoolId}</span>
      </div>

      {/* Prominent Note Box */}
      <div className="p-3.5 rounded-xl bg-amber-50/95 dark:bg-slate-950/90 border border-amber-200 dark:border-amber-800/70 shadow-inner">
        {notesText ? (
          <p className="text-xs text-slate-900 dark:text-amber-100 font-sans font-medium whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto pr-1">
            {notesText}
          </p>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            No special administrative notes or instructions attached to this invoice.
          </p>
        )}
      </div>

      {/* Metadata & Footer */}
      <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
        <span>Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upon Receipt'}</span>
        <span className={balance > 0 ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
          Bal: ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Click to inspect action */}
      <button
        onClick={() => onClickInspect(invoice)}
        className="w-full py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
      >
        <Eye className="w-3 h-3" />
        <span>Click to inspect full invoice dossier →</span>
      </button>
    </div>
  );
}

// ─── Invoice Inspect Modal ──────────────────────────────────────────────────

interface InvoiceInspectModalProps {
  invoice: Invoice;
  onClose: () => void;
  onEdit: (inv: Invoice) => void;
  onPrint: () => void;
  canEdit: boolean;
  canApprove: boolean;
  onStatusChange: (inv: Invoice, newStatus: string) => Promise<void>;
  onDelete?: (inv: Invoice) => Promise<void>;
}

function InvoiceInspectModal({
  invoice,
  onClose,
  onEdit,
  onPrint,
  canEdit,
  canApprove,
  onStatusChange,
  onDelete
}: InvoiceInspectModalProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const studentName = invoice.student
    ? `${invoice.student.firstName || ''} ${invoice.student.lastName || ''}`.trim() || invoice.student.name || invoice.studentName || 'Unknown Scholar'
    : invoice.studentName || 'Unknown Scholar';

  const studentId = invoice.student?.admissionNumber || invoice.student?.schoolId || invoice.student?.studentId || invoice.admissionNumber || 'N/A';
  const parentName = invoice.student?.parents?.[0]
    ? `${invoice.student.parents[0].firstName || ''} ${invoice.student.parents[0].lastName || ''}`.trim() || invoice.student.parents[0].name
    : invoice.parentName || 'Registered Parent Profile';

  const parentEmail = invoice.student?.parents?.[0]?.email || invoice.parentEmail || '';
  const parentPhone = invoice.student?.parents?.[0]?.phone || '';

  const subtotal = Number(invoice.subtotal ?? invoice.totalAmount ?? 0);
  const paid = Number(invoice.paidAmount ?? 0);
  const total = Number(invoice.totalAmount ?? subtotal);
  const balance = Number(invoice.remainingBalance ?? (total - paid));
  const discount = Number(invoice.discountAmount ?? 0);
  const scholarship = Number(invoice.scholarshipAmount ?? 0);
  const lateFee = Number(invoice.lateFeeAmount ?? 0);

  const paymentPercentage = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  const items: InvoiceLineItem[] = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : [
        {
          id: 'ITM-DEF-1',
          category: 'Tuition',
          description: 'Tuition Fee Assessment (Academic Period)',
          unitAmount: subtotal,
          quantity: 1,
          totalAmount: subtotal
        }
      ];

  const handleQuickStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await onStatusChange(invoice, newStatus);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                  {invoice.invoiceNumber}
                </span>
                <StatusBadge status={invoice.status || 'draft'} size="sm" />
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono">
                  ✓ VERIFIED BILLING
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Issue: <strong>{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Current Period'}</strong>
                {' • '}
                Due: <strong className={balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upon Receipt'}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canEdit && (
              <button
                onClick={() => onEdit(invoice)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 font-bold text-xs transition-all border border-sky-200 dark:border-sky-800 cursor-pointer"
                title="Edit Invoice"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            <button
              onClick={onPrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          {/* Scholar & Parent Profile Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-400/30 flex items-center justify-center font-black text-sm text-emerald-700 dark:text-emerald-300 shrink-0">
                {studentName.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base">{studentName}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-800">
                    ID: {studentId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {invoice.student?.gradeLevel ? `Grade ${invoice.student.gradeLevel}` : 'Student Scholar'}
                  {invoice.academicYearId ? ` • Academic Year ${invoice.academicYearId}` : ''}
                </p>
              </div>
            </div>

            <div className="sm:text-right space-y-0.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Parent / Sponsor Account
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs sm:text-sm">
                {parentName}
              </span>
              <div className="flex items-center sm:justify-end gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {parentPhone && <span>{parentPhone}</span>}
                {parentPhone && parentEmail && <span>•</span>}
                {parentEmail && <span className="truncate max-w-[180px]">{parentEmail}</span>}
              </div>
            </div>
          </div>

          {/* 4 Financial Dimension Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Total Invoiced',
                value: `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                sub: 'Gross assessed fees',
                cls: 'text-slate-900 dark:text-white'
              },
              {
                label: 'Paid Amount',
                value: `$${paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                sub: `${paymentPercentage}% settled`,
                cls: 'text-emerald-600 dark:text-emerald-400'
              },
              {
                label: 'Balance Due',
                value: `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                sub: balance <= 0 ? 'Fully settled' : 'Outstanding',
                cls: balance > 0 ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-emerald-600 dark:text-emerald-400'
              },
              {
                label: 'Collection Progress',
                value: `${paymentPercentage}%`,
                sub: invoice.status?.replace(/_/g, ' ') || 'draft',
                cls: paymentPercentage >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'
              }
            ].map(({ label, value, sub, cls }) => (
              <div key={label} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">{label}</span>
                <span className={`text-base sm:text-lg font-mono font-black block ${cls}`}>{value}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block capitalize">{sub}</span>
              </div>
            ))}
          </div>

          {/* Payment Progress Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Settlement Progress
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                ${paid.toLocaleString('en-US', { minimumFractionDigits: 2 })} / ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  paymentPercentage >= 100 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                  paymentPercentage > 0 ? 'bg-gradient-to-r from-sky-500 to-emerald-400' : 'bg-slate-400'
                }`}
                style={{ width: `${Math.max(3, paymentPercentage)}%` }}
              />
            </div>
          </div>

          {/* ── PROMINENT INVOICE NOTES & REMARKS SECTION ── */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-amber-950/20 dark:to-transparent border-2 border-amber-300 dark:border-amber-700/80 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-700 dark:text-amber-300">
                  <StickyNote className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider font-mono">
                    Invoice Notes &amp; Administrative Remarks
                  </h4>
                  <span className="text-[10px] text-amber-800/80 dark:text-amber-400/80 font-mono">
                    Official billing remarks, payment installment guidelines &amp; instructions
                  </span>
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={() => onEdit(invoice)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-200 text-xs font-bold transition-all cursor-pointer border border-amber-300 dark:border-amber-700 shadow-2xs"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{invoice.notes ? 'Edit Note' : '+ Add Note'}</span>
                </button>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-amber-200/80 dark:border-amber-800/60 shadow-inner">
              {invoice.notes && invoice.notes.trim() ? (
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap font-medium leading-relaxed">
                  {invoice.notes}
                </p>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 italic">
                  <span>No administrative notes or special instructions recorded for this invoice.</span>
                  {canEdit && (
                    <button
                      onClick={() => onEdit(invoice)}
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline not-italic cursor-pointer"
                    >
                      + Add Note Now
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Itemized Fee Breakdown Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              Itemized Fee Lines ({items.length})
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Item Description</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Total ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                        {item.description || 'Academic fee line item'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-500">
                        {item.quantity || 1}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        ${Number(item.unitAmount || item.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ${Number(item.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Adjustments & Ledger Net Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                Financial Ledger Adjustments
              </span>
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Gross Subtotal:</span>
                  <span>${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount Deduction:</span>
                    <span>-${discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {scholarship > 0 && (
                  <div className="flex justify-between text-sky-600 dark:text-sky-400">
                    <span>Scholarship Grant:</span>
                    <span>-${scholarship.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {lateFee > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>Late Assessment Fee:</span>
                    <span>+${lateFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white text-sm">
                  <span>Net Invoiced Total:</span>
                  <span>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                  Settlement &amp; POS Actions
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Proceed to the Cashier &amp; POS payment desk to record cash, bank transfer, or mobile money settlements for this invoice.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/finance/billing/payments?invoiceNumber=${invoice.invoiceNumber}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Receive Payment →</span>
                </Link>
                <button
                  onClick={onPrint}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                  title="Print Invoice Slip"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Installment Schedule if present */}
          {Array.isArray(invoice.installments) && invoice.installments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Installment Payment Schedule
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {invoice.installments.map((inst, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Tranche {idx + 1}</span>
                      <StatusBadge status={inst.status || 'pending_payment'} size="sm" />
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block">
                      ${Number(inst.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Due: {inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>ID: {invoice.id || invoice.documentId}</span>
            <span>•</span>
            <span>Status: <strong className="uppercase">{invoice.status}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {canApprove && invoice.status === 'draft' && (
              <button
                disabled={updatingStatus}
                onClick={() => handleQuickStatus('pending_payment')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Authorize Invoice</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Student Invoices Page ─────────────────────────────────────────────

export default function StudentInvoicesPage() {
  const locale = useLocale();
  const t = (key: string, loc?: string) => i18nT(key, loc || locale);
  const { user, role } = useAuth();

  // Role Evaluation for Invoice Operations
  const userRoleStr = String(role || user?.role?.type || user?.role?.name || '').toLowerCase();
  const isAdmin = userRoleStr.includes('admin') || userRoleStr.includes('director') || userRoleStr.includes('super');
  const isAccountLead = userRoleStr.includes('lead') || userRoleStr.includes('account-lead');
  const isAccountant = userRoleStr.includes('accountant') && !isAccountLead;

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

  // Hover Note State (rendered via React Portal for crystal clarity and 0 table clipping)
  const [hoveredNote, setHoveredNote] = useState<{
    invoice: Invoice;
    anchorRect: { top: number; left: number; bottom: number; right: number; width: number; height: number };
  } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Live Directory Data
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);
  const [liveParents, setLiveParents] = useState<Parent[]>([]);

  // New Invoice Form state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newAdmissionNumber, setNewAdmissionNumber] = useState('');
  const [newParentName, setNewParentName] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newTuitionAmount, setNewTuitionAmount] = useState('');
  const [newLibraryAmount, setNewLibraryAmount] = useState('');
  const [newDiscountAmount, setNewDiscountAmount] = useState('');
  const [newScholarshipAmount, setNewScholarshipAmount] = useState('');
  const [newLateFeeAmount, setNewLateFeeAmount] = useState('');
  const [newInstallmentFrequency, setNewInstallmentFrequency] = useState('Termly');
  const [newCurrency, setNewCurrency] = useState('USD');
  const [newNotes, setNewNotes] = useState('');

  // Edit Invoice Form state
  const [editStudentId, setEditStudentId] = useState('');
  const [editStudentName, setEditStudentName] = useState('');
  const [editTuitionAmount, setEditTuitionAmount] = useState('');
  const [editStatus, setEditStatus] = useState('draft');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    const inv = invoiceToEdit;
    if (inv) {
      const sName = inv.student
        ? `${inv.student.firstName || ''} ${inv.student.lastName || ''}`.trim() || inv.student.name || inv.studentName || ''
        : inv.studentName || '';
      setEditStudentName(sName);
      setEditStudentId(inv.student?.id ? String(inv.student.id) : '');
      setEditTuitionAmount((inv.totalAmount || inv.subtotal || 0).toString());
      setEditStatus(inv.status || 'draft');
      setEditDueDate(inv.dueDate ? inv.dueDate.split('T')[0] : '');
      setEditNotes(inv.notes || '');
    }
  }, [invoiceToEdit]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeService.getInvoices(statusFilter);
      setInvoices(data);

      const [studentsRes, parentsRes] = await Promise.all([
        erpService.getStudents({ pageSize: 1000 }).catch(() => ({ data: [] })),
        erpService.getParents({ pageSize: 1000 }).catch(() => ({ data: [] }))
      ]);
      setLiveStudents(studentsRes.data || []);
      setLiveParents(parentsRes.data || []);
    } catch {
      toast.error(t('Failed to load student invoices or directory data.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const sName = inv.student
        ? `${inv.student.firstName || ''} ${inv.student.lastName || ''}`.trim() || inv.student.name || inv.studentName || ''
        : inv.studentName || '';
      const pName = inv.student?.parent?.name
        ? `${inv.student.parent.firstName || ''} ${inv.student.parent.lastName || ''}`.trim() || inv.student.parent.name
        : inv.parentName || inv.student?.parentName || '';
      const admNo = inv.student?.admissionNumber || inv.student?.schoolId || inv.admissionNumber || '';
      const notesStr = inv.notes || '';
      const matchQuery = !query ||
        (inv.invoiceNumber || '').toLowerCase().includes(query.toLowerCase()) ||
        sName.toLowerCase().includes(query.toLowerCase()) ||
        pName.toLowerCase().includes(query.toLowerCase()) ||
        admNo.toLowerCase().includes(query.toLowerCase()) ||
        notesStr.toLowerCase().includes(query.toLowerCase());
      return matchQuery;
    });
  }, [invoices, query]);

  const activeFiltersCount = statusFilter !== 'all' ? 1 : 0;

  const handleClearFilters = () => {
    setStatusFilter('all');
    setQuery('');
    toast.success(t('Invoice filters reset.'));
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
      toast.error(t('Your role does not have permission to create invoices.'));
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
          { id: 'ITM-N1', description: 'Term Tuition Assessment Fee', category: 'Tuition', unitAmount: parseFloat(newTuitionAmount || '0'), quantity: 1, totalAmount: parseFloat(newTuitionAmount || '0') },
          ...(parseFloat(newLibraryAmount || '0') > 0 ? [{ id: 'ITM-N2', description: 'Campus Library & Digital Archive Fee', category: 'Library', unitAmount: parseFloat(newLibraryAmount || '0'), quantity: 1, totalAmount: parseFloat(newLibraryAmount || '0') }] : [])
        ],
        notes: newNotes || `Installment Plan: ${newInstallmentFrequency}. Auto-assessed fee items.`
      });

      toast.success(`${t('Generated invoice')} ${created.invoiceNumber || ''}!`);
      setShowCreateModal(false);
      setNewStudentName('');
      setNewTuitionAmount('');
      setNewLibraryAmount('');
      setNewDiscountAmount('');
      setNewScholarshipAmount('');
      setNewLateFeeAmount('');
      setNewNotes('');
      loadData();
    } catch {
      toast.error(t('Failed to create invoice'));
    }
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const inv = invoiceToEdit;
    if (!inv) return;
    if (!canEditInvoice(inv)) {
      toast.error(t('Your role cannot edit this invoice status.'));
      return;
    }

    const targetId = inv.documentId || inv.id;
    const totalAmount = parseFloat(editTuitionAmount || '0');
    const paidAmount = Number(inv.paidAmount || 0);
    const remainingBalance = Math.max(0, totalAmount - paidAmount);

    try {
      const updated = await financeService.updateInvoice(String(targetId), {
        studentId: editStudentId || undefined,
        subtotal: totalAmount,
        totalAmount,
        remainingBalance,
        status: editStatus as any,
        dueDate: editDueDate || undefined,
        notes: editNotes,
      });

      toast.success(`${t('Updated invoice')} ${inv.invoiceNumber}!`);
      setShowEditModal(false);
      setInvoiceToEdit(null);
      if (selectedInvoice && (selectedInvoice.id === inv.id || selectedInvoice.documentId === inv.documentId)) {
        setSelectedInvoice({
          ...selectedInvoice,
          ...updated,
          notes: editNotes,
          status: editStatus as any,
          totalAmount,
          remainingBalance,
          dueDate: editDueDate || selectedInvoice.dueDate
        });
      }
      loadData();
    } catch {
      toast.error(t('Failed to update invoice'));
    }
  };

  const handleStatusChange = async (inv: Invoice, newStatus: string) => {
    const targetId = inv.documentId || inv.id;
    try {
      await financeService.updateInvoiceStatus(String(targetId), newStatus);
      toast.success(`Invoice ${inv.invoiceNumber} status updated to ${newStatus}!`);
      if (selectedInvoice && (selectedInvoice.id === inv.id || selectedInvoice.documentId === inv.documentId)) {
        setSelectedInvoice(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
      loadData();
    } catch {
      toast.error('Failed to update invoice status.');
    }
  };

  const handleDeleteInvoice = async (inv: Invoice) => {
    if (!confirm(`Are you sure you want to permanently delete invoice ${inv.invoiceNumber}?`)) return;
    const targetId = inv.documentId || inv.id;
    try {
      await financeService.deleteInvoice(String(targetId));
      toast.success(`Invoice ${inv.invoiceNumber} deleted.`);
      setSelectedInvoice(null);
      setInvoices(prev => prev.filter(i => i.id !== inv.id && i.documentId !== inv.documentId));
    } catch {
      toast.error('Failed to delete invoice.');
    }
  };

  const handleRowMouseEnter = (inv: Invoice, e: React.MouseEvent<HTMLElement>) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredNote({
      invoice: inv,
      anchorRect: {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
        width: rect.width,
        height: rect.height
      }
    });
  };

  const handleRowMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredNote(null);
    }, 150);
  };

  const totalInvoiced = useMemo(() => invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0), [invoices]);
  const totalCollected = useMemo(() => invoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0), [invoices]);
  const totalOutstanding = useMemo(() => invoices.reduce((s, i) => s + (Number(i.remainingBalance ?? (Number(i.totalAmount || 0) - Number(i.paidAmount || 0)))), 0), [invoices]);
  const overdueCount = useMemo(() => invoices.filter(i => i.status === 'overdue').length, [invoices]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_invoiced',
      title: t('Total Invoiced (Academic Year)'),
      value: `$${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${invoices.length} ${t('total active student fee accounts')}`,
      trendDirection: 'up',
      icon: <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      onClick: () => toast.info(t('Displaying all institutional invoices.'))
    },
    {
      id: 'collected',
      title: t('Collected Revenue via Invoices'),
      value: `$${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${Math.round((totalCollected / (totalInvoiced || 1)) * 100)}% ${t('settlement collection rate')}`,
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
      onClick: () => setStatusFilter('paid')
    },
    {
      id: 'outstanding',
      title: t('Remaining Outstanding Balance'),
      value: `$${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: t('Accounts receivable awaiting parent payment'),
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
      onClick: () => setStatusFilter('partially_paid')
    },
    {
      id: 'overdue',
      title: t('Overdue Invoices'),
      value: `${overdueCount} ${t('Accounts')}`,
      subtitle: t('Automatic late fee rules active'),
      trendDirection: 'down',
      icon: <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" />,
      isActive: statusFilter === 'overdue',
      onClick: () => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')
    }
  ];

  const columns = useMemo<ColumnDef<Invoice, any>[]>(() => [
    {
      accessorKey: 'invoiceNumber',
      header: t('Invoice # & Notes'),
      cell: ({ row }) => {
        const inv = row.original;
        const noteText = inv.notes?.trim() || '';
        const hasNote = noteText.length > 0;

        return (
          <div
            className="inline-flex items-center gap-1.5 py-1 px-1.5 rounded-xl cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/80"
            onMouseEnter={(e) => handleRowMouseEnter(inv, e)}
            onMouseLeave={handleRowMouseLeave}
            onClick={() => setSelectedInvoice(inv)}
          >
            <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline">
              {inv.invoiceNumber}
            </span>
            {hasNote && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold shadow-2xs transition-transform hover:scale-105"
                title="Hover to view complete invoice note"
              >
                <StickyNote className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Note</span>
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'studentName',
      header: t('Scholar Details'),
      cell: ({ row }) => {
        const inv = row.original;
        const sName = inv.student
          ? `${inv.student.firstName || ''} ${inv.student.lastName || ''}`.trim() || inv.student.name || inv.studentName || 'Unknown Scholar'
          : inv.studentName || 'Unknown Scholar';
        const admNo = inv.student?.admissionNumber || inv.student?.schoolId || inv.admissionNumber || 'N/A';
        const pName = inv.student?.parents?.[0]?.name || inv.parentName || 'N/A';
        return (
          <div
            className="flex flex-col space-y-0.5 cursor-pointer"
            onMouseEnter={(e) => handleRowMouseEnter(inv, e)}
            onMouseLeave={handleRowMouseLeave}
            onClick={() => setSelectedInvoice(inv)}
          >
            <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px] text-xs hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {sName}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {admNo} • {pName}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'issueDate',
      header: t('Issue & Due Date'),
      cell: ({ row }) => {
        const inv = row.original;
        const issueStr = inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        const dueStr = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
        return (
          <div className="flex flex-col text-xs space-y-0.5">
            <span className="text-slate-700 dark:text-slate-300 font-medium">Issue: {issueStr || '---'}</span>
            <span className="text-slate-500 font-mono text-[11px]">Due: {dueStr}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'paidAmount',
      header: t('Paid Amount'),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
          ${(Number(row.original.paidAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'totalAmount',
      header: `${t('Total / Balance')} ($)`,
      cell: ({ row }) => {
        const total = Number(row.original.totalAmount) || 0;
        const bal = Number(row.original.remainingBalance ?? (total - Number(row.original.paidAmount || 0)));
        return (
          <div className="flex flex-col space-y-0.5">
            <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
              ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-[11px] font-bold font-mono ${bal > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              Bal: ${bal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: t('Settlement Status'),
      cell: ({ row }) => <StatusBadge status={row.original.status || 'draft'} size="sm" />
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedInvoice(row.original)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{t('Inspect')}</span>
          </button>
          <Link
            href={`/finance/billing/payments?invoiceNumber=${row.original.invoiceNumber}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-all border border-emerald-200 dark:border-emerald-800 shadow-2xs"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{t('Pay')}</span>
          </Link>
        </div>
      )
    }
  ], [locale]);

  return (
    <EnterpriseModuleShell
      title={t('Student Billing & Itemized Fee Invoices')}
      description={t('Sequential invoice generator (INV-YYYY-XXXXXX) with automatic fee structure attachment, scholarship/discount calculation, installment payment schedules, and automated late fee rules.')}
      breadcrumbs={[{ label: t('Finance ERP'), href: '/finance' }, { label: t('Billing Suite') }, { label: t('Invoices') }]}
      icon={<FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={filteredInvoices.length}
      recordLabel={t('Invoices')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeService.exportToCSV(invoices, 'invoices_2026.csv')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>{t('Export CSV')}</span>
          </button>
          {canCreateInvoice && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('Generate Invoice')}</span>
            </button>
          )}
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>{t('Student Invoices')}</span>
        </Link>
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t('Payment Desk & POS')}</span>
        </Link>
        <Link href="/finance/billing/statements" className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-sky-500" />
          <span>{t('Student Statements')}</span>
        </Link>
        <Link href="/finance/billing/structures" className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('Fee Structures')}</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('Search invoices by invoice number, scholar name, parent, admission #, or notes...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success(t('Invoices refreshed'));
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
        createButtonLabel="+ Generate Invoice"
        onCreate={() => setShowCreateModal(true)}
        customFilterNodes={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Settlement Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid (Cleared)</option>
            <option value="overdue">Overdue</option>
          </select>
        }
      />

      <EnterpriseDataGrid
        data={filteredInvoices}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={480}
        pageSize={50}
        onRowInspect={(row) => setSelectedInvoice(row)}
        onRowClick={(row) => setSelectedInvoice(row)}
        emptyStateProps={{
          title: t('No Invoices Found'),
          description: t('No billing records match your search query or status filter.'),
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: t('Generate First Invoice'),
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* ── Floating Portal Note Popover (Crystal Clear & Never Clipped) ── */}
      {mounted && hoveredNote && typeof document !== 'undefined' && createPortal(
        <FloatingInvoiceNoteCard
          data={hoveredNote}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={() => {
            setHoveredNote(null);
          }}
          onClickInspect={(inv) => {
            setHoveredNote(null);
            setSelectedInvoice(inv);
          }}
        />,
        document.body
      )}

      {/* ── Comprehensive Invoice Inspect Modal ── */}
      {selectedInvoice && (
        <InvoiceInspectModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onEdit={(inv) => {
            setInvoiceToEdit(inv);
            setShowEditModal(true);
          }}
          onPrint={() => printInvoiceDocument(selectedInvoice)}
          canEdit={canEditInvoice(selectedInvoice)}
          canApprove={canApproveInvoice(selectedInvoice)}
          onStatusChange={handleStatusChange}
          onDelete={canDeleteInvoice(selectedInvoice) ? handleDeleteInvoice : undefined}
        />
      )}

      {/* ── Create Invoice Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{t('Generate Student Fee Invoice')}</h3>
                  <p className="text-xs text-slate-500 font-mono">Automatic fee calculation with ledger recognition</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Select Scholar / Student')}</label>
                <input
                  type="text"
                  list="students-list-create"
                  required
                  value={newStudentName}
                  onChange={handleStudentSelect}
                  placeholder={t('Type student name or admission number...')}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
                <datalist id="students-list-create">
                  {liveStudents.map(s => (
                    <option key={s.id} value={`${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name}>
                      {s.admissionNumber || s.schoolId} - Grade {s.gradeLevel || 'N/A'}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Tuition Fee Amount ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1200"
                    value={newTuitionAmount}
                    onChange={(e) => setNewTuitionAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Library & Archive Fee ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="50"
                    value={newLibraryAmount}
                    onChange={(e) => setNewLibraryAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Discount Amount ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={newDiscountAmount}
                    onChange={(e) => setNewDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Scholarship Credit ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={newScholarshipAmount}
                    onChange={(e) => setNewScholarshipAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Late Assessment Fee ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={newLateFeeAmount}
                    onChange={(e) => setNewLateFeeAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Notes field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                  <span>Invoice Notes &amp; Administrative Remarks</span>
                </label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Enter billing remarks, payment terms, or special discount instructions..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer transition-colors"
                >
                  {t('Generate Invoice')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Invoice Modal ── */}
      {showEditModal && invoiceToEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-6 h-6 text-sky-500" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{t('Edit Invoice')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{invoiceToEdit.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setInvoiceToEdit(null); }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateInvoice} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Scholar / Student Name')}</label>
                <input
                  type="text"
                  readOnly
                  value={editStudentName}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Total Amount ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editTuitionAmount}
                    onChange={(e) => setEditTuitionAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Invoice Status')}</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="draft">{t('Draft')}</option>
                    <option value="pending_payment">{t('Pending Payment')}</option>
                    <option value="partially_paid">{t('Partially Paid')}</option>
                    <option value="paid">{t('Paid')}</option>
                    <option value="overdue">{t('Overdue')}</option>
                    <option value="cancelled">{t('Cancelled')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('Due Date')}</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-sky-500 cursor-pointer"
                />
              </div>

              {/* Notes Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                  <span>Invoice Notes &amp; Administrative Remarks</span>
                </label>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder={t('Internal billing notes, payment instructions, or special terms...')}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500 resize-none font-sans leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setInvoiceToEdit(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md cursor-pointer transition-colors"
                >
                  {t('Save Invoice Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

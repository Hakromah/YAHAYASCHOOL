'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ScrollText, Search, Filter, Download, Printer, AlertTriangle,
  CheckCircle2, Clock, DollarSign, FileText, Receipt, User,
  Mail, Phone, ShieldAlert, ArrowRight, Sparkles, Building2, Eye
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { StudentFinanceAccount, StudentLedgerEntry } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function StudentRunningLedgerPage() {
  const [accounts, setAccounts] = useState<StudentFinanceAccount[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('STU-1001');
  const [ledgerEntries, setLedgerEntries] = useState<StudentLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedEntry, setSelectedEntry] = useState<StudentLedgerEntry | null>(null);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const accList = await financeService.getStudentAccounts();
      setAccounts(accList);
      if (accList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(accList[0].studentId);
      }
    } catch {
      toast.error('Failed to load student finance accounts.');
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async (stuId: string) => {
    setLoading(true);
    try {
      const entries = await financeService.getStudentLedger(stuId);
      setLedgerEntries(entries);
    } catch {
      toast.error('Failed to load student ledger entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadLedger(selectedStudentId);
    }
  }, [selectedStudentId]);

  const currentAccount = useMemo(() => {
    return accounts.find(a => a.studentId === selectedStudentId) || accounts[0] || null;
  }, [accounts, selectedStudentId]);

  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter(e => {
      if (!query) return true;
      return e.documentNumber.toLowerCase().includes(query.toLowerCase()) ||
        e.description.toLowerCase().includes(query.toLowerCase());
    });
  }, [ledgerEntries, query]);

  const handleClearFilters = () => {
    setQuery('');
    toast.success('Ledger query cleared.');
  };

  const toggleFinancialHold = async () => {
    if (!currentAccount) return;
    currentAccount.financialHold = !currentAccount.financialHold;
    if (currentAccount.financialHold) {
      currentAccount.holdReasons = ['report_cards', 'certificates'];
      toast.warning(`Financial Hold ENABLED for ${currentAccount.studentName}. Report cards and examination passes restricted.`);
    } else {
      currentAccount.holdReasons = [];
      toast.success(`Financial Hold RELEASED for ${currentAccount.studentName}. Academic access restored.`);
    }
    setAccounts([...accounts]);
  };

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    if (!currentAccount) return [];
    return [
      {
        id: 'net_balance',
        title: 'Running Net Account Balance',
        value: currentAccount.netBalance < 0 
          ? `-$${Math.abs(currentAccount.netBalance).toFixed(2)} (Credit)` 
          : `$${currentAccount.netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: currentAccount.netBalance <= 0 ? 'Account fully settled / in credit' : 'Outstanding balance due',
        trendDirection: currentAccount.netBalance <= 0 ? 'up' : 'down',
        icon: <DollarSign className={`w-5 h-5 ${currentAccount.netBalance <= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />,
        onClick: () => toast.info(`Account status for ${currentAccount.studentName}`)
      },
      {
        id: 'invoiced',
        title: 'Total Cumulative Invoiced',
        value: `$${currentAccount.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: `Academic Year ${currentAccount.academicYearCode}`,
        trendDirection: 'neutral',
        icon: <FileText className="w-5 h-5 text-sky-400" />,
        onClick: () => toast.info('Total debits posted to this scholar.')
      },
      {
        id: 'paid',
        title: 'Total Cumulative Receipts',
        value: `$${currentAccount.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        subtitle: `${Math.round((currentAccount.totalPaid / (currentAccount.totalInvoiced || 1)) * 100)}% payment compliance`,
        trendDirection: 'up',
        icon: <Receipt className="w-5 h-5 text-emerald-400" />,
        onClick: () => toast.info('Total credits posted to this scholar.')
      },
      {
        id: 'hold_status',
        title: 'Institutional Hold Guard',
        value: currentAccount.financialHold ? 'HOLD ACTIVE' : 'NO HOLDS',
        subtitle: currentAccount.financialHold ? 'Restricted: Report cards & certificates' : 'Full academic privileges enabled',
        trendDirection: currentAccount.financialHold ? 'down' : 'up',
        icon: currentAccount.financialHold ? <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        onClick: toggleFinancialHold
      }
    ];
  }, [currentAccount]);

  const columns = useMemo<ColumnDef<StudentLedgerEntry, any>[]>(() => {
    return [
      {
        accessorKey: 'documentNumber',
        header: 'Document Ref & Date',
        cell: ({ row }) => {
          const e = row.original;
          const isDebit = e.type === 'debit';
          return (
            <div className="space-y-0.5 font-mono">
              <span className={`text-xs font-black block ${isDebit ? 'text-sky-400' : 'text-emerald-400'}`}>{e.documentNumber}</span>
              <span className="text-[11px] text-slate-400 block">{e.transactionDate}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'type',
        header: 'Posting Type',
        cell: ({ row }) => (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold uppercase ${
            row.original.type === 'debit'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {row.original.type === 'debit' ? '▲ Debit (Charge)' : '▼ Credit (Payment)'}
          </span>
        )
      },
      {
        accessorKey: 'description',
        header: 'Itemized Description & Memo',
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-white block max-w-md truncate">{row.original.description}</span>
            <span className="text-[11px] text-slate-400 block font-mono">Posted by: {row.original.postedBy}</span>
          </div>
        )
      },
      {
        accessorKey: 'amount',
        header: 'Transaction Amount ($)',
        cell: ({ row }) => {
          const e = row.original;
          const isDebit = e.type === 'debit';
          return (
            <span className={`font-mono text-xs sm:text-sm font-black ${isDebit ? 'text-sky-400' : 'text-emerald-400'}`}>
              {isDebit ? '+' : '-'}${e.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          );
        }
      },
      {
        accessorKey: 'runningBalance',
        header: 'Running Balance ($)',
        cell: ({ row }) => {
          const bal = row.original.runningBalance;
          return (
            <span className={`font-mono text-xs sm:text-sm font-black ${bal <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              ${bal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          );
        }
      },
      {
        id: 'actions',
        header: 'Inspect',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEntry(row.original);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Voucher</span>
          </button>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Student Financial Ledger & Running Account Statement"
      description="Interactive double-entry account statement viewable per scholar. Monitors every debit invoice and credit payment with automated running balances and institutional financial hold enforcements."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Billing Suite' }, { label: 'Running Ledger' }]}
      icon={<ScrollText className="w-8 h-8" />}
      recordCount={filteredEntries.length}
      recordLabel="Ledger Rows"
      activeFilterCount={query ? 1 : 0}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          {/* Scholar Account Selector Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <User className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-400">Select Scholar:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                toast.info(`Switched ledger view to scholar account ${e.target.value}`);
              }}
              aria-label="Select Scholar Account"
              className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              {accounts.map(acc => (
                <option key={acc.studentId} value={acc.studentId} className="bg-slate-900">
                  {acc.studentName} ({acc.admissionNumber})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              toast.success(`Printing certified running statement for ${currentAccount?.studentName}`);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Official Statement</span>
          </button>
        </div>
      }
    >
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Financial Hold Alert & Quick Actions Panel */}
      {currentAccount && (
        <div className={`border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
          currentAccount.financialHold
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-lg shadow-rose-900/20'
            : 'bg-slate-900/80 border-slate-800 text-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${currentAccount.financialHold ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {currentAccount.financialHold ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm sm:text-base text-white">
                  {currentAccount.studentName} ({currentAccount.gradeCode} — {currentAccount.sectionName})
                </h4>
                <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase font-mono ${
                  currentAccount.financialHold ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {currentAccount.financialHold ? '● HOLD ACTIVE' : '● ACCOUNT CLEAR'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Parent Contact: <strong>{currentAccount.parentName}</strong> ({currentAccount.parentPhone} | {currentAccount.parentEmail})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFinancialHold}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer border ${
                currentAccount.financialHold
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                  : 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border-rose-500/30'
              }`}
            >
              {currentAccount.financialHold ? '✓ Release Financial Hold' : '⚠ Enforce Financial Hold'}
            </button>
            <Link
              href={`/finance/billing/payments?studentId=${currentAccount.studentId}`}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center gap-1"
            >
              <span>+ Record Payment</span>
            </Link>
          </div>
        </div>
      )}

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/billing/invoices" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Invoices Console</span>
        </Link>
        <Link href="/finance/billing/payments" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5 text-amber-400" />
          <span>Multi-Method Cashier & POS</span>
        </Link>
        <Link href="/finance/billing/ledger" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <ScrollText className="w-3.5 h-3.5" />
          <span>Student Running Ledger</span>
        </Link>
      </div>

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search running ledger by document ref (INV-YYYY-XXXX / RCP-YYYY-XXXX) or description..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          if (selectedStudentId) loadLedger(selectedStudentId);
          toast.success('Running ledger refreshed from official double-entry ledger.');
        }}
        activeFilterCount={query ? 1 : 0}
        onResetFilters={handleClearFilters}
        createButtonLabel="+ Post Manual Charge / Credit"
        onCreate={() => toast.info('Opened Manual Charge/Credit adjustment wizard for this scholar.')}
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredEntries}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedEntry(row)}
        onRowClick={(row) => setSelectedEntry(row)}
        onRowEdit={(row) => setSelectedEntry(row)}
        emptyStateProps={{
          title: 'No Ledger Entries Found',
          description: 'No debits or credits match your search query for this scholar account.',
          isFilterActive: query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: 'Post Initial Ledger Entry',
          onCreate: () => toast.info('Post initial tuition debit')
        }}
      />

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        record={selectedEntry ? {
          name: selectedEntry.description,
          id: selectedEntry.documentNumber,
          role: `${selectedEntry.type.toUpperCase()} ENTRY (${selectedEntry.academicYearCode})`,
          status: selectedEntry.type === 'debit' ? 'Charge' : 'Payment',
          email: `Posted by: ${selectedEntry.postedBy}`,
          phone: selectedEntry.transactionDate,
          department: `Amount: $${selectedEntry.amount.toFixed(2)}`,
          joinDate: currentAccount?.admissionNumber || 'STU',
          balance: `RUNNING BALANCE AFTER POSTING: $${selectedEntry.runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

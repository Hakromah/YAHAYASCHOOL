'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Scale, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Landmark, Layers,
  FolderOpen, Folder, ArrowRight, Sparkles, Building2, ChevronRight
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { ChartOfAccount, AccountType } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Account form state
  const [code, setCode] = useState('1040');
  const [name, setName] = useState('Petty Cash - Quran Department');
  const [type, setType] = useState<AccountType>('Asset');
  const [normalBalance, setNormalBalance] = useState<'debit' | 'credit'>('debit');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getChartOfAccounts();
      setAccounts(data);
    } catch {
      toast.error('Failed to load Chart of Accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      const matchQuery = !query ||
        a.accountCode.toLowerCase().includes(query.toLowerCase()) ||
        a.accountName.toLowerCase().includes(query.toLowerCase());
      const matchType = typeFilter === 'all' || a.accountType === typeFilter;
      return matchQuery && matchType;
    });
  }, [accounts, query, typeFilter]);

  const activeFiltersCount = typeFilter !== 'all' ? 1 : 0;

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const created: ChartOfAccount = {
      id: `COA-${Date.now()}`,
      accountCode: code,
      accountName: name,
      accountType: type as AccountType,
      isControlAccount: false,
      currency: 'USD',
      currentBalance: 0,
      isActive: true
    };
    setAccounts([created, ...accounts]);
    toast.success(`Created General Ledger account: ${code} - ${name}`);
    setShowCreateModal(false);
  };

  const totalAssets = useMemo(() => accounts.filter(a => a.accountType === 'Asset').reduce((s, x) => s + x.currentBalance, 0), [accounts]);
  const totalLiabilities = useMemo(() => accounts.filter(a => a.accountType === 'Liability').reduce((s, x) => s + x.currentBalance, 0), [accounts]);
  const totalEquity = useMemo(() => accounts.filter(a => a.accountType === 'Equity').reduce((s, x) => s + x.currentBalance, 0), [accounts]);
  const totalRevenue = useMemo(() => accounts.filter(a => a.accountType === 'Revenue').reduce((s, x) => s + x.currentBalance, 0), [accounts]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'assets',
      title: 'Total Assets (Series 1000)',
      value: `$${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Bank accounts, mobile wallets, cash & AR balances',
      trendDirection: 'up',
      icon: <Landmark className="w-5 h-5 text-emerald-400" />,
      isActive: typeFilter === 'Asset',
      onClick: () => setTypeFilter(typeFilter === 'Asset' ? 'all' : 'Asset')
    },
    {
      id: 'liabilities',
      title: 'Total Liabilities (Series 2000)',
      value: `$${totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Vendor payables, accrued salaries & prepaid tuition',
      trendDirection: 'neutral',
      icon: <FileText className="w-5 h-5 text-amber-400" />,
      isActive: typeFilter === 'Liability',
      onClick: () => setTypeFilter(typeFilter === 'Liability' ? 'all' : 'Liability')
    },
    {
      id: 'equity',
      title: 'Institutional Equity (Series 3000)',
      value: `$${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'School capital reserves & Al-Barakah Waqf trust fund',
      trendDirection: 'up',
      icon: <Scale className="w-5 h-5 text-sky-400" />,
      isActive: typeFilter === 'Equity',
      onClick: () => setTypeFilter(typeFilter === 'Equity' ? 'all' : 'Equity')
    },
    {
      id: 'revenue',
      title: 'YTD Revenue (Series 4000)',
      value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Tuition collections, waqf donations & fee revenue',
      trendDirection: 'up',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
      isActive: typeFilter === 'Revenue',
      onClick: () => setTypeFilter(typeFilter === 'Revenue' ? 'all' : 'Revenue')
    }
  ];

  const columns = useMemo<ColumnDef<ChartOfAccount, any>[]>(() => {
    return [
      {
        accessorKey: 'accountCode',
        header: 'GL Account Code & Hierarchy',
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="flex items-center gap-2 font-mono">
              <span className={`px-2 py-1 rounded-md text-xs font-black ${
                a.accountType === 'Asset' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                a.accountType === 'Liability' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                a.accountType === 'Equity' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                a.accountType === 'Revenue' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' :
                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {a.accountCode}
              </span>
              <span className="font-bold text-white text-xs sm:text-sm">{a.accountName}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'accountType',
        header: 'Account Category & Normal Balance',
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-slate-200 block">{row.original.accountType}</span>
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Currency: {row.original.currency}</span>
          </div>
        )
      },
      {
        accessorKey: 'currentBalance',
        header: 'Current GL Ledger Balance ($)',
        cell: ({ row }) => {
          const a = row.original;
          return (
            <span className={`font-mono text-xs sm:text-sm font-black ${
              a.currentBalance >= 0 ? 'text-white' : 'text-rose-400'
            }`}>
              ${a.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          );
        }
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
            ● Active GL Account
          </span>
        )
      },
      {
        id: 'actions',
        header: 'Drill-Down GL',
        cell: ({ row }) => (
          <Link
            href={`/finance/accounting/ledger?code=${row.original.accountCode}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-emerald-500 shadow-sm"
          >
            <span>Drill-Down</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Chart of Accounts (COA) & General Ledger Hierarchy"
      description="SAP S/4HANA double-entry account classification. Organizes institutional assets (1000), liabilities (2000), equity (3000), revenue (4000), and expenditures (5000) for real-time trial balancing."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Accounting Engine' }, { label: 'Chart of Accounts' }]}
      icon={<Scale className="w-8 h-8" />}
      recordCount={filteredAccounts.length}
      recordLabel="GL Accounts"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setTypeFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeService.exportToCSV(accounts, 'chart_of_accounts_2026.csv')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export COA</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Create GL Account</span>
          </button>
        </div>
      }
    >
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/accounting/chart" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5" />
          <span>Chart of Accounts</span>
        </Link>
        <Link href="/finance/accounting/journals" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Double-Entry Journals</span>
        </Link>
        <Link href="/finance/accounting/ledger" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>General Ledger Drill-Down</span>
        </Link>
        <Link href="/finance/accounting/periods" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Accounting Periods Lock</span>
        </Link>
      </div>

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search accounts by 4-digit GL code (e.g. 1010, 4010) or account name..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Chart of Accounts balances synced from general ledger postings.');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setTypeFilter('all'); setQuery(''); }}
        createButtonLabel="+ New GL Account"
        onCreate={() => setShowCreateModal(true)}
        customFilterNodes={
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter accounts by type"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="all">All GL Categories</option>
              <option value="Asset">1000 Series (Assets)</option>
              <option value="Liability">2000 Series (Liabilities)</option>
              <option value="Equity">3000 Series (Equity)</option>
              <option value="Revenue">4000 Series (Revenue)</option>
              <option value="Expense">5000 Series (Expenses)</option>
            </select>
          </div>
        }
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredAccounts}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedAccount(row)}
        onRowClick={(row) => setSelectedAccount(row)}
        emptyStateProps={{
          title: 'No Accounts Found',
          description: 'No Chart of Accounts entries match your search or classification filter.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setTypeFilter('all'); setQuery(''); },
          createLabel: 'Create GL Account',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Scale className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-black text-white">Create General Ledger Account</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Account Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">GL Classification</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const t = e.target.value as AccountType;
                      setType(t);
                      if (t === 'Asset' || t === 'Expense') setNormalBalance('debit');
                      else setNormalBalance('credit');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Asset">Asset (1000)</option>
                    <option value="Liability">Liability (2000)</option>
                    <option value="Equity">Equity (3000)</option>
                    <option value="Revenue">Revenue (4000)</option>
                    <option value="Expense">Expense (5000)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Account Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Normal Balance Direction</label>
                <select
                  value={normalBalance}
                  onChange={(e) => setNormalBalance(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="debit">Debit Normal (Assets & Expenses)</option>
                  <option value="credit">Credit Normal (Liabilities, Equity & Revenue)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedAccount}
        onClose={() => setSelectedAccount(null)}
        record={selectedAccount ? {
          name: selectedAccount.accountName,
          id: selectedAccount.accountCode,
          role: 'COA RECORD',
          status: selectedAccount.isActive ? 'active' : 'inactive',
          email: `Type: ${selectedAccount.accountType}`,
          phone: `Currency: ${selectedAccount.currency}`,
          department: `GL Code: ${selectedAccount.accountCode}`,
          joinDate: selectedAccount.accountCode.slice(0, 1) + '000 Series',
          balance: `CURRENT BALANCE: $${selectedAccount.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

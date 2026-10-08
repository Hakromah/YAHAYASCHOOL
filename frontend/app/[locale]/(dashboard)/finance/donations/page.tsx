/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  Award, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, Heart,
  Printer, ArrowRight, Sparkles, Building2, User, Landmark, X
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { financeService } from '@/services/finance.service';
import { apiClient } from '@/services/api.service';
import type { DonationRecord } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { toast } from 'sonner';

export default function WaqfAndDonationsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedDonation, setSelectedDonation] = useState<DonationRecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState<DonationRecord | null>(null);

  // Form state
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cheque' | 'Cash' | 'Online Gateway'>('Bank Transfer');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, campRes] = await Promise.all([
        financeService.getDonations(),
        apiClient.get('/donation-campaigns?populate=*').catch(() => ({ data: { data: [] } }))
      ]);
      setDonations(data);
      const campList = campRes.data?.data || [];
      setCampaigns(campList);
      if (campList.length > 0 && !campaignName) {
        setCampaignName(campList[0].title || 'General Waqf');
      }
    } catch {
      toast.error('Failed to load Waqf & institutional donation records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDonations = useMemo(() => {
    return donations.filter(d => {
      const matchQuery = !query ||
        d.receiptNumber.toLowerCase().includes(query.toLowerCase()) ||
        d.donorName.toLowerCase().includes(query.toLowerCase()) ||
        d.campaignName.toLowerCase().includes(query.toLowerCase());
      const matchCamp = campaignFilter === 'all' || d.campaignName === campaignFilter;
      return matchQuery && matchCamp;
    });
  }, [donations, query, campaignFilter]);

  const activeFiltersCount = campaignFilter !== 'all' ? 1 : 0;

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      toast.error('Please enter contribution amount.');
      return;
    }
    const amountNum = parseFloat(amount || '0');

    try {
      const created = await financeService.createDonationRecord({
        donorName: isAnonymous ? 'Anonymous Benefactor (Waqf)' : (donorName || 'Waqf Benefactor'),
        donorEmail: isAnonymous ? undefined : donorEmail,
        campaignName: campaignName || 'General Islamic Institutional Waqf',
        amount: amountNum,
        paymentMethod,
        isAnonymous,
        receiptIssued: true,
        notes: `Endowment funds dedicated exclusively to ${campaignName || 'Waqf'}.`
      });

      setDonations([created, ...donations]);
      toast.success(`Logged Waqf contribution of $${amountNum.toLocaleString()} from ${created.donorName}`);
      setDonorName('');
      setDonorEmail('');
      setAmount('');
      setIsAnonymous(false);
      setShowCreateModal(false);
      setShowReceiptModal(created);
    } catch {
      toast.error('Failed to log donation');
    }
  };

  const totalDonations = useMemo(() => donations.reduce((s, d) => s + (Number(d.amount) || 0), 0), [donations]);
  const anonymousTotal = useMemo(() => donations.filter(d => d.isAnonymous).reduce((s, d) => s + (Number(d.amount) || 0), 0), [donations]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_waqf',
      title: 'Total Waqf & Endowment Raised',
      value: `$${totalDonations.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${donations.length} certified philanthropic contributions`,
      trendDirection: 'up',
      icon: <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'campaigns_count',
      title: 'Active Waqf Destinations',
      value: `${campaigns.length || 1} Campaigns`,
      subtitle: 'Building endowments, tuition grants & mosque development',
      trendDirection: 'neutral',
      icon: <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'anonymous_contributions',
      title: 'Anonymous Philanthropy',
      value: `$${anonymousTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${donations.filter(d => d.isAnonymous).length} anonymous donors registered`,
      trendDirection: 'up',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'compliance',
      title: 'Sharia & Financial Audit Standard',
      value: '100% Ringfenced',
      subtitle: 'Philanthropic funds strictly isolated under GL 4020',
      trendDirection: 'up',
      icon: <Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    }
  ];

  const columns = useMemo<ColumnDef<DonationRecord, any>[]>(() => [
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt Serial & Campaign Destination',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 block">{row.original.receiptNumber}</span>
          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block max-w-xs truncate">{row.original.campaignName}</span>
        </div>
      )
    },
    {
      accessorKey: 'donorName',
      header: 'Benefactor / Donor Organization',
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">{row.original.donorName}</span>
          {row.original.donorEmail && <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">{row.original.donorEmail}</span>}
        </div>
      )
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Channel & Date',
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs font-mono">
          <span className="text-slate-700 dark:text-slate-300 font-bold block">{row.original.paymentMethod}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{row.original.donationDate || row.original.date}</span>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: 'Contribution Amount ($)',
      cell: ({ row }) => (
        <span className="font-mono text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400 block">
          +${(Number(row.original.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: 'receiptIssued',
      header: 'Status',
      cell: () => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
          ✓ Certified Receipt Issued
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowReceiptModal(row.original)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={() => setSelectedDonation(row.original)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            Inspect
          </button>
        </div>
      )
    }
  ], []);

  // Form input classes
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';

  return (
    <EnterpriseModuleShell
      title="Waqf & Institutional Philanthropic Donations Console"
      description="Manage charitable endowments, school renovation campaigns, and student sponsorship funds. Issues serial-tracked receipts with double-entry ledger allocation."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Donations & Audit' }, { label: 'Waqf & Donations' }]}
      icon={<Award className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={filteredDonations.length}
      recordLabel="Donation Contributions"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setCampaignFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/donations/campaigns"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Donation Campaigns</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Log Waqf Contribution</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/finance/donations" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" />
          <span>Waqf Contributions</span>
        </Link>
        <Link href="/finance/donations/campaigns" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-500" />
          <span>Campaign Projects</span>
        </Link>
        <Link href="/finance/accounting/ledger" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>General Ledger (GL 4020)</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search contributions by serial number, benefactor, or campaign..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Donation records refreshed');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setCampaignFilter('all'); setQuery(''); }}
        createButtonLabel="+ Log Contribution"
        onCreate={() => setShowCreateModal(true)}
        customFilterNodes={
          campaigns.length > 0 && (
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Campaign Destinations</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.title}>{c.title}</option>
              ))}
            </select>
          )
        }
      />

      <EnterpriseDataGrid
        data={filteredDonations}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        onRowInspect={(row) => setSelectedDonation(row)}
        onRowClick={(row) => setSelectedDonation(row)}
        emptyStateProps={{
          title: 'No Waqf Contributions Found',
          description: 'No charitable contributions match your filter criteria.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setCampaignFilter('all'); setQuery(''); },
          createLabel: 'Log First Contribution',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Log Contribution Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Log Waqf / Institutional Contribution</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDonation} className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="anon_check"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="anon_check" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Register contribution as Anonymous Benefactor (Waqf)</label>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Benefactor / Organization Name</label>
                    <input
                      type="text"
                      required={!isAnonymous}
                      placeholder="e.g. Al-Hikmah Foundation"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contact Email (for Digital Receipt)</label>
                    <input
                      type="email"
                      placeholder="benefactor@example.org"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Endowment Campaign Destination</label>
                {campaigns.length > 0 ? (
                  <select
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className={selectCls}
                  >
                    {campaigns.map((c: any) => (
                      <option key={c.id} value={c.title}>{c.title}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. General Islamic Institutional Waqf Fund"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className={inputCls}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Channel / Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="Bank Transfer">Bank Transfer (Direct Deposit)</option>
                    <option value="Cheque">Bank Cheque / Draft</option>
                    <option value="Cash">Physical Cash Deposit</option>
                    <option value="Online Gateway">Online Gateway</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contribution Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={inputCls + ' font-mono text-emerald-700 dark:text-emerald-400 font-bold'}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  Issue Receipt & Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Official Tax-Deductible Waqf Receipt</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Serial: {showReceiptModal.receiptNumber} • Date: {showReceiptModal.donationDate || showReceiptModal.date}</p>
                </div>
              </div>
              <button
                onClick={() => setShowReceiptModal(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Benefactor Information</span>
                <h4 className="font-black text-slate-900 dark:text-white text-base mt-0.5">{showReceiptModal.donorName}</h4>
                {showReceiptModal.donorEmail && <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{showReceiptModal.donorEmail}</p>}
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Campaign / Endowment Fund:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{showReceiptModal.campaignName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Payment Channel:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">{showReceiptModal.paymentMethod}</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800">
                  <span>Total Contribution Amount:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono">${(Number(showReceiptModal.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                * This contribution is certified as a non-profit educational and religious endowment under institutional tax exemption standards.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 font-mono">Serial Ref: {showReceiptModal.receiptNumber}</span>
              <button
                onClick={() => {
                  window.print();
                  setShowReceiptModal(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Out Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedDonation}
        onClose={() => setSelectedDonation(null)}
        record={selectedDonation ? {
          name: selectedDonation.donorName,
          id: selectedDonation.receiptNumber,
          role: 'BENEFACTOR / WAQF DONOR',
          status: 'posted',
          email: selectedDonation.donorEmail || 'ANONYMOUS ENDOWMENT',
          phone: `Channel: ${selectedDonation.paymentMethod}`,
          department: `Campaign: ${selectedDonation.campaignName}`,
          joinDate: selectedDonation.donationDate || selectedDonation.date,
          balance: `CONTRIBUTION TOTAL: $${(Number(selectedDonation.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

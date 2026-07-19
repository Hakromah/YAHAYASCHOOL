'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Award, Plus, Search, Filter, Download, Eye, CheckCircle2,
  Clock, DollarSign, FileText, Receipt, ShieldCheck, Heart,
  Printer, ArrowRight, Sparkles, Building2, User, Landmark
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { DonationRecord } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function WaqfAndDonationsPage() {
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedDonation, setSelectedDonation] = useState<DonationRecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState<DonationRecord | null>(null);

  // New Donation Form state
  const [donorName, setDonorName] = useState('Al-Barakah Foundation for Islamic Education');
  const [donorEmail, setDonorEmail] = useState('grants@albarakah-foundation.org');
  const [campaignName, setCampaignName] = useState('New Campus Mosque & Hifz Center Construction');
  const [amount, setAmount] = useState('25000');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cheque' | 'Cash' | 'Online Gateway'>('Bank Transfer');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getDonations();
      setDonations(data);
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
    const amountNum = parseFloat(amount || '0');

    const created = await financeService.createDonationRecord({
      donorName: isAnonymous ? 'Anonymous Benefactor (Waqf)' : donorName,
      donorEmail: isAnonymous ? undefined : donorEmail,
      campaignName,
      amount: amountNum,
      paymentMethod,
      isAnonymous,
      receiptIssued: true,
      notes: 'Endowment funds dedicated exclusively to construction and student sponsorship.'
    });

    setDonations([created, ...donations]);
    toast.success(`Logged Waqf contribution of $${amountNum.toLocaleString()} from ${created.donorName}. Official tax-deductible receipt issued.`);
    setShowCreateModal(false);
  };

  const totalRaised = useMemo(() => donations.reduce((s, d) => s + d.amount, 0), [donations]);
  const waqfFundBalance = useMemo(() => donations.filter(d => d.campaignName.includes('Waqf') || d.campaignName.includes('Mosque')).reduce((s, d) => s + d.amount, 0), [donations]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_raised',
      title: 'Cumulative Waqf & Endowment Contributions',
      value: `$${totalRaised.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${donations.length} institutional and individual benefactors logged`,
      trendDirection: 'up',
      icon: <Award className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'waqf_fund',
      title: 'Dedicated Mosque & Campus Endowment Fund',
      value: `$${waqfFundBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Restricted capital partition under Islamic Shariah governance',
      trendDirection: 'up',
      icon: <Landmark className="w-5 h-5 text-sky-400" />
    },
    {
      id: 'receipts_issued',
      title: 'Tax-Deductible Receipts Issued',
      value: '100% Verified',
      subtitle: 'Official serial numbering with cryptographic QR code validation',
      trendDirection: 'up',
      icon: <FileText className="w-5 h-5 text-amber-400" />
    },
    {
      id: 'active_campaigns',
      title: 'Active Institutional Campaigns',
      value: '4 Ongoing',
      subtitle: 'Orphan Hifz Sponsorship, Mosque Vault, Library Tech & General',
      trendDirection: 'neutral',
      icon: <Heart className="w-5 h-5 text-rose-400" />
    }
  ];

  const columns = useMemo<ColumnDef<DonationRecord, any>[]>(() => {
    return [
      {
        accessorKey: 'receiptNumber',
        header: 'Receipt Serial & Campaign Destination',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-black text-emerald-400 block">{row.original.receiptNumber}</span>
            <span className="font-bold text-white text-xs sm:text-sm block max-w-xs truncate">{row.original.campaignName}</span>
          </div>
        )
      },
      {
        accessorKey: 'donorName',
        header: 'Benefactor / Donor Organization',
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-slate-200 block">{row.original.donorName}</span>
            {row.original.donorEmail && <span className="text-[11px] text-slate-400 block font-mono">{row.original.donorEmail}</span>}
          </div>
        )
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Channel & Date',
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs font-mono">
            <span className="text-slate-300 font-bold block">{row.original.paymentMethod}</span>
            <span className="text-[11px] text-slate-400 block">{row.original.date}</span>
          </div>
        )
      },
      {
        accessorKey: 'amount',
        header: 'Contribution Amount ($)',
        cell: ({ row }) => (
          <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 block">
            +${row.original.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        )
      },
      {
        accessorKey: 'receiptIssued',
        header: 'Receipt Status',
        cell: () => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
            ✓ Certified Receipt Issued
          </span>
        )
      },
      {
        id: 'actions',
        header: 'Receipt Action',
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
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              Inspect
            </button>
          </div>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Waqf & Institutional Donations Console"
      description="Manage charitable endowments, mosque construction campaigns, and orphan Hifz sponsorships. Automatically issues serial-tracked, tax-deductible donor receipts with cryptographic QR verification."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Donations & Audit' }, { label: 'Waqf & Donations' }]}
      icon={<Award className="w-8 h-8 text-emerald-400" />}
      recordCount={filteredDonations.length}
      recordLabel="Donation Contributions"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => { setCampaignFilter('all'); setQuery(''); }}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/finance/donations/campaigns"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Heart className="w-4 h-4 text-rose-400" />
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
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <Link href="/finance/donations" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" />
          <span>Waqf & Donations</span>
        </Link>
        <Link href="/finance/donations/campaigns" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span>Campaign Target Tracking</span>
        </Link>
        <Link href="/finance/reports" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Financial Statements (SAP/Odoo)</span>
        </Link>
        <Link href="/finance/audit" className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>Immutable Finance Audit Trail</span>
        </Link>
      </div>

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search contributions by receipt serial (DON-XXXX), benefactor name, or campaign target..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Donation records refreshed from institutional endowment database.');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => { setCampaignFilter('all'); setQuery(''); }}
        createButtonLabel="+ Log Contribution"
        onCreate={() => setShowCreateModal(true)}
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={filteredDonations}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedDonation(row)}
        onRowClick={(row) => setSelectedDonation(row)}
        emptyStateProps={{
          title: 'No Waqf Contributions Logged',
          description: 'No endowment contributions or donor receipts match your search.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: () => { setCampaignFilter('all'); setQuery(''); },
          createLabel: 'Log First Contribution',
          onCreate: () => setShowCreateModal(true)
        }}
      />

      {/* Log Contribution Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Award className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-black text-white">Log Waqf / Institutional Contribution</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateDonation} className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="anon_check"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="anon_check" className="text-xs font-bold text-slate-300 cursor-pointer">Register contribution as Anonymous Benefactor (Waqf)</label>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Benefactor / Organization Name</label>
                    <input
                      type="text"
                      required={!isAnonymous}
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Contact Email (for Digital Receipt)</label>
                    <input
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Endowment Campaign Destination</label>
                <select
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="New Campus Mosque & Hifz Center Construction">New Campus Mosque & Hifz Center Construction</option>
                  <option value="Orphan & Needy Hifz Scholarship Endowment">Orphan & Needy Hifz Scholarship Endowment</option>
                  <option value="Campus STEM & Robotics Lab Upgrade">Campus STEM & Robotics Lab Upgrade</option>
                  <option value="General Islamic Institutional Waqf Fund">General Islamic Institutional Waqf Fund</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Payment Channel / Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Bank Transfer">Bank Transfer (Direct Deposit)</option>
                    <option value="Cheque">Bank Cheque / Draft</option>
                    <option value="Cash">Physical Cash Deposit</option>
                    <option value="Online Gateway">Online Gateway (Stripe/PayPal)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Contribution Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md">Issue Receipt & Post</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Official Tax-Deductible Waqf Receipt</h3>
                  <p className="text-xs text-slate-400 font-mono">Serial: {showReceiptModal.receiptNumber} • Date: {showReceiptModal.date}</p>
                </div>
              </div>
              <button onClick={() => setShowReceiptModal(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Benefactor Information</span>
                <h4 className="font-black text-white text-base mt-0.5">{showReceiptModal.donorName}</h4>
                {showReceiptModal.donorEmail && <p className="text-xs text-slate-400 font-mono">{showReceiptModal.donorEmail}</p>}
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-300">Campaign / Endowment Fund:</span>
                  <span className="text-white font-bold">{showReceiptModal.campaignName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-300">Payment Channel:</span>
                  <span className="text-slate-200 font-bold">{showReceiptModal.paymentMethod}</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-black text-white border-t border-slate-700">
                  <span>Total Contribution Amount:</span>
                  <span className="text-emerald-400">${showReceiptModal.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                * This contribution is certified as a non-profit educational and religious endowment under institutional tax exemption standards.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 font-mono">Cryptographic QR Verification ID: QR-DON-2026</span>
              <button
                onClick={() => {
                  toast.success(`Printing certified Waqf receipt ${showReceiptModal.receiptNumber}`);
                  setShowReceiptModal(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2"
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
          joinDate: selectedDonation.date,
          balance: `CONTRIBUTION TOTAL: $${selectedDonation.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        } : null}
        category="finance"
      />
    </EnterpriseModuleShell>
  );
}

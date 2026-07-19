'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart, Award, ShieldCheck, DollarSign, ArrowRight,
  Clock, CheckCircle2, Plus, Users, PieChart
} from 'lucide-react';
import { financeService } from '@/services/finance.service';
import type { DonationRecord } from '@/types/finance.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface CampaignSummary {
  id: string;
  name: string;
  targetAmount: number;
  raisedAmount: number;
  donorsCount: number;
  status: 'active' | 'completed' | 'on_hold';
}

export default function DonationCampaignsPage() {
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      try {
        const data = await financeService.getDonations();
        setDonations(data);
      } catch {
        toast.error('Failed to load campaigns.');
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

  const campaigns: CampaignSummary[] = [
    {
      id: 'CMP-001',
      name: 'New Campus Mosque & Hifz Center Construction',
      targetAmount: 250000,
      raisedAmount: 120000,
      donorsCount: 45,
      status: 'active'
    },
    {
      id: 'CMP-002',
      name: 'Orphan & Needy Hifz Scholarship Endowment',
      targetAmount: 80000,
      raisedAmount: 65400,
      donorsCount: 112,
      status: 'active'
    },
    {
      id: 'CMP-003',
      name: 'Campus STEM & Robotics Lab Upgrade',
      targetAmount: 50000,
      raisedAmount: 50000,
      donorsCount: 28,
      status: 'completed'
    },
    {
      id: 'CMP-004',
      name: 'General Islamic Institutional Waqf Fund',
      targetAmount: 500000,
      raisedAmount: 312500,
      donorsCount: 89,
      status: 'active'
    }
  ];

  const totalTarget = campaigns.reduce((s, c) => s + c.targetAmount, 0);
  const totalRaised = campaigns.reduce((s, c) => s + c.raisedAmount, 0);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_target',
      title: 'Institutional Campaign Target',
      value: `$${totalTarget.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: 'Combined fundraising targets across 4 funds',
      trendDirection: 'up',
      icon: <Heart className="w-5 h-5 text-rose-400" />
    },
    {
      id: 'total_raised',
      title: 'Cumulative Endowment Capital Raised',
      value: `$${totalRaised.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${((totalRaised / totalTarget) * 100).toFixed(1)}% of institutional goals achieved`,
      trendDirection: 'up',
      icon: <Award className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'donors_engaged',
      title: 'Unique Benefactors Engaged',
      value: `${campaigns.reduce((s, c) => s + c.donorsCount, 0)} Donors`,
      subtitle: 'Alumni, parents, organizations & Waqf trustees',
      trendDirection: 'up',
      icon: <Users className="w-5 h-5 text-sky-400" />
    }
  ];

  const columns: ColumnDef<CampaignSummary, any>[] = [
    {
      accessorKey: 'name',
      header: 'Campaign Destination & Fund Title',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <span className="font-bold text-white text-xs sm:text-sm block">{row.original.name}</span>
          <span className="text-[11px] font-mono text-slate-400">ID: {row.original.id} • {row.original.donorsCount} benefactors</span>
        </div>
      )
    },
    {
      accessorKey: 'targetAmount',
      header: 'Goal Target vs Raised ($)',
      cell: ({ row }) => {
        const c = row.original;
        const pct = (c.raisedAmount / c.targetAmount) * 100;
        return (
          <div className="space-y-1.5 w-full max-w-xs">
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-emerald-400 font-bold">${c.raisedAmount.toLocaleString()} raised</span>
              <span className="text-slate-300 font-black">Goal: ${c.targetAmount.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all rounded-full ${
                  pct >= 100 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-sky-600 to-emerald-400'
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Fundraising Status',
      cell: ({ row }) => <StatusBadge status={row.original.status === 'active' ? 'active' : 'closed'} size="sm" />
    },
    {
      id: 'actions',
      header: 'Manage Target',
      cell: ({ row }) => (
        <button
          onClick={() => toast.success(`Inspecting endowment ledger for ${row.original.name}`)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
        >
          Inspect Ledger →
        </button>
      )
    }
  ];

  return (
    <EnterpriseModuleShell
      title="Endowment Campaigns & Fundraising Target Control"
      description="Monitor institutional capital drives, track construction fund milestones, and oversee student Waqf sponsorship targets."
      breadcrumbs={[{ label: 'Finance ERP', href: '/finance' }, { label: 'Donations & Audit' }, { label: 'Donation Campaigns' }]}
      icon={<Heart className="w-8 h-8 text-rose-400" />}
      recordCount={campaigns.length}
      recordLabel="Campaigns"
      activeFilterCount={0}
      onClearFilters={() => {}}
      headerActions={
        <Link
          href="/finance/donations"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <span>← Back to Donations Console</span>
        </Link>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseDataGrid
        data={campaigns}
        columns={columns}
        isLoading={loading}
        density="cozy"
        emptyStateProps={{
          title: 'No Active Campaigns',
          description: 'No fundraising drives configured.',
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}

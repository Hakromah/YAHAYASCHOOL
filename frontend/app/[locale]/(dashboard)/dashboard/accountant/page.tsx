/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign, Wallet, Receipt, TrendingUp, RefreshCw,
  HeartHandshake, CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react';

import { dashboardService, type AccountantDashboardData } from '@/services/dashboard.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { DashboardWidgetCustomizer, type WidgetConfig } from '@/components/ui/DashboardWidgetCustomizer';
import { formatNumber, formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stat-donations', title: 'Donation Campaigns', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-payroll', title: 'Active Workers', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-invoices', title: 'Pending Invoices', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-revenue', title: 'Monthly Revenue', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'chart-cashflow', title: 'Monthly Cash Flow (Inflow vs Outflow)', layer: 'chart', isVisible: true, isPinned: false, size: 'large' },
  { id: 'action-donations', title: 'Recent Donation Transactions', layer: 'action', isVisible: true, isPinned: false, size: 'large' },
];

export default function AccountantDashboardPage() {
  const [data, setData] = useState<AccountantDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getAccountantDashboard();
      setData(res);
    } catch (err) {
      toast.error('Failed to load accountant live dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isVisible = (id: string) => widgets.find((w) => w.id === id)?.isVisible ?? true;

  const cashflowChartData = [
    { month: 'Jan', inflow: 4200000, outflow: 2800000 },
    { month: 'Feb', inflow: 4500000, outflow: 3100000 },
    { month: 'Mar', inflow: 5100000, outflow: 2900000 },
    { month: 'Apr', inflow: 4800000, outflow: 3300000 },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Finance & Accounting Portal"
        description="Monitor fee collections, review donation campaigns, process payroll, and track school expenditures."
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
            role="accountant"
            defaultWidgets={DEFAULT_WIDGETS}
            onUpdate={setWidgets}
          />
        </div>
      </PageHeader>

      {/* Layer 1 — Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isVisible('stat-donations') && (
          <StatCard
            title="Donation Campaigns"
            value={formatNumber(data?.counts?.donations || 0)}
            icon={HeartHandshake}
            color="text-emerald-500"
            bgColor="bg-emerald-500/10"
            href="/finance/donations"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-payroll') && (
          <StatCard
            title="Active Workers"
            value={formatNumber(data?.counts?.workers || 0)}
            subtitle="Eligible for payroll processing"
            icon={Wallet}
            color="text-amber-500"
            bgColor="bg-amber-500/10"
            href="/finance/payroll"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-invoices') && (
          <StatCard
            title="Pending Invoices"
            value="12 Invoices"
            subtitle="Requires payment clearance"
            icon={Receipt}
            color="text-rose-500"
            bgColor="bg-rose-500/10"
            href="/finance/expenses"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-revenue') && (
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(4800000)}
            change={8.5}
            changeLabel="vs last month"
            icon={TrendingUp}
            color="text-violet-500"
            bgColor="bg-violet-500/10"
            href="/finance"
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Layer 2 & 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isVisible('chart-cashflow') && (
          <ChartCard
            title="Monthly Cash Flow (₦)"
            subtitle="Inflow vs Outflow over past 4 months"
            data={cashflowChartData}
            type="bar"
            dataKeys={[
              { key: 'inflow', label: 'Inflow (Revenue)', color: '#10b981' },
              { key: 'outflow', label: 'Outflow (Expenses)', color: '#f43f5e' }
            ]}
            isLoading={isLoading}
            className="lg:col-span-2"
          />
        )}

        {isVisible('action-donations') && (
          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-500" />
              <span>Recent Donation Campaigns</span>
            </h2>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px]">
              {(data?.donationRecords && data.donationRecords.length > 0) ? (
                data.donationRecords.map((d: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <p className="text-xs font-bold text-foreground">{d.title || 'Campaign'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: {formatCurrency(Number(d.targetAmount || 0))}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No active donation records found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

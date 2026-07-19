/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  Activity,
  CheckCircle2,
  HeartHandshake,
  RefreshCw,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { ChartCard } from '@/components/ui/ChartCard';
import { DashboardWidgetCustomizer, type WidgetConfig } from '@/components/ui/DashboardWidgetCustomizer';
import { StatCard } from '@/components/ui/StatCard';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { dashboardService } from '@/services/dashboard.service';
import { toast } from 'sonner';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stat-donations', title: 'Donations Active', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-workers', title: 'Workers Payroll', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-approvals', title: 'Pending Approvals', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-audit', title: 'Audit Trail Events', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'chart-revenue', title: 'Budget vs Actual Expenditure', layer: 'chart', isVisible: true, isPinned: false, size: 'large' },
  { id: 'action-audit', title: 'Financial Audit & Approval Feed', layer: 'action', isVisible: true, isPinned: false, size: 'large' },
];

export default function AccountLeadDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getAccountLeadDashboard();
      setData(res);
    } catch (err) {
      toast.error('Failed to load account lead live dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isVisible = (id: string) => widgets.find((w) => w.id === id)?.isVisible ?? true;

  const budgetChartData = [
    { department: 'Academics', budget: 1500000, actual: 1420000 },
    { department: 'Hostel', budget: 1200000, actual: 1180000 },
    { department: 'Transport', budget: 800000, actual: 850000 },
    { department: 'Admin', budget: 600000, actual: 580000 },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Finance Lead Portal"
        description="Executive financial supervision, budget approvals, audit compliance, and revenue oversight."
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
            role="account-lead"
            defaultWidgets={DEFAULT_WIDGETS}
            onUpdate={setWidgets}
          />
        </div>
      </PageHeader>

      {/* Layer 1 — Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isVisible('stat-donations') && (
          <StatCard
            title="Donations Active"
            value={formatNumber(data?.counts?.donations || 0)}
            icon={HeartHandshake}
            color="text-emerald-500"
            bgColor="bg-emerald-500/10"
            href="/finance/donations"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-workers') && (
          <StatCard
            title="Workers Payroll"
            value={formatNumber(data?.counts?.workers || 0)}
            icon={Wallet}
            color="text-amber-500"
            bgColor="bg-amber-500/10"
            href="/finance/payroll"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-approvals') && (
          <StatCard
            title="Pending Approvals"
            value="4 Transactions"
            subtitle="Requires lead signature"
            icon={CheckCircle2}
            color="text-rose-500"
            bgColor="bg-rose-500/10"
            href="/finance/approvals"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-audit') && (
          <StatCard
            title="Audit Trail Events"
            value={formatNumber(data?.auditLogs?.length || 0)}
            icon={Activity}
            color="text-sky-500"
            bgColor="bg-sky-500/10"
            href="/audit-logs"
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Layer 2 & 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isVisible('chart-revenue') && (
          <ChartCard
            title="Departmental Budget vs Actual Expenditure (₦)"
            subtitle="Current academic term compliance"
            data={budgetChartData}
            type="bar"
            dataKeys={[
              { key: 'budget', label: 'Allocated Budget', color: 'hsl(var(--primary))' },
              { key: 'actual', label: 'Actual Expenditure', color: '#f59e0b' }
            ]}
            isLoading={isLoading}
            className="lg:col-span-2"
          />
        )}

        {isVisible('action-audit') && (
          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Financial Audit Logs</span>
            </h2>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px]">
              {(data?.auditLogs && data.auditLogs.length > 0) ? (
                data.auditLogs.map((l: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <p className="text-xs font-bold text-foreground">{l.action || 'Audit Event'}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{l.description || l.message || ''}</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No recent audit logs logged.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

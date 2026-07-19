'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen, Users, FileText, CheckCircle2, Clock, Calendar,
  Award, RefreshCw, Activity, ArrowRight, PenTool, BookCheck
} from 'lucide-react';

import { dashboardService, type TeacherDashboardData } from '@/services/dashboard.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { DashboardWidgetCustomizer, type WidgetConfig } from '@/components/ui/DashboardWidgetCustomizer';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stat-sections', title: 'Assigned Classes', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-subjects', title: 'Subjects Taught', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-homework', title: 'Pending Homework', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-assessments', title: 'Active Assessments', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-attendance', title: 'Attendance Marked', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'chart-workload', title: 'Weekly Class Workload & Sessions', layer: 'chart', isVisible: true, isPinned: false, size: 'large' },
  { id: 'action-schedule', title: "Today's Teaching Schedule & Quick Actions", layer: 'action', isVisible: true, isPinned: false, size: 'large' },
];

export default function TeacherDashboardPage() {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getTeacherDashboard();
      setData(res);
    } catch (err) {
      toast.error('Failed to load teacher live dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isVisible = (id: string) => widgets.find((w) => w.id === id)?.isVisible ?? true;

  const workloadChartData = [
    { day: 'Mon', sessions: 4, hours: 3.5 },
    { day: 'Tue', sessions: 5, hours: 4.0 },
    { day: 'Wed', sessions: 3, hours: 2.5 },
    { day: 'Thu', sessions: 6, hours: 5.0 },
    { day: 'Fri', sessions: 4, hours: 3.0 },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Faculty Portal"
        description="Manage your assigned classes, take attendance, review submitted homework, and enter continuous assessment marks."
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
            role="teacher"
            defaultWidgets={DEFAULT_WIDGETS}
            onUpdate={setWidgets}
          />
        </div>
      </PageHeader>

      {/* Layer 1 — Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {isVisible('stat-sections') && (
          <StatCard
            title="Assigned Classes"
            value={formatNumber(data?.assignedSections || 0)}
            icon={Users}
            color="text-emerald-500"
            bgColor="bg-emerald-500/10"
            href="/lms/subjects"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-subjects') && (
          <StatCard
            title="Subjects Taught"
            value={formatNumber(data?.subjectCount || 0)}
            icon={BookOpen}
            color="text-amber-500"
            bgColor="bg-amber-500/10"
            href="/lms/subjects"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-homework') && (
          <StatCard
            title="Active Homework"
            value={formatNumber(data?.pendingHomework || 0)}
            icon={BookCheck}
            color="text-violet-500"
            bgColor="bg-violet-500/10"
            href="/lms/homework"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-assessments') && (
          <StatCard
            title="Assessments"
            value={formatNumber(data?.pendingAssessments || 0)}
            icon={FileText}
            color="text-rose-500"
            bgColor="bg-rose-500/10"
            href="/assessment/teacher"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-attendance') && (
          <StatCard
            title="Attendance Marked"
            value={formatNumber(data?.attendanceRecordsMarked || 0)}
            icon={CheckCircle2}
            color="text-sky-500"
            bgColor="bg-sky-500/10"
            href="/lms/attendance"
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Layer 2 & 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isVisible('chart-workload') && (
          <ChartCard
            title="Weekly Teaching Workload (Sessions vs Hours)"
            subtitle="Scheduled classroom engagement per day"
            data={workloadChartData}
            type="bar"
            dataKeys={[
              { key: 'sessions', label: 'Sessions Taught', color: 'hsl(var(--primary))' },
              { key: 'hours', label: 'Teaching Hours', color: '#10b981' }
            ]}
            isLoading={isLoading}
            className="lg:col-span-2"
          />
        )}

        {isVisible('action-schedule') && (
          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Teaching Quick Actions</span>
            </h2>
            <div className="space-y-3 flex-1">
              {[
                { label: 'Mark Today’s Attendance', href: '/lms/attendance', icon: CheckCircle2, color: 'text-emerald-500' },
                { label: 'Create Lesson Plan', href: '/lms/lesson-plans', icon: PenTool, color: 'text-amber-500' },
                { label: 'Assign Homework', href: '/lms/homework', icon: BookCheck, color: 'text-violet-500' },
                { label: 'Enter Exam Marks', href: '/assessment/marks-entry', icon: Award, color: 'text-rose-500' },
              ].map((action, idx) => (
                <a
                  key={idx}
                  href={action.href}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <action.icon className={cn('w-4 h-4', action.color)} />
                    <span className="text-xs font-semibold text-foreground">{action.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen, Users, FileText, CheckCircle2, Clock, Calendar,
  Award, RefreshCw, Activity, ArrowRight, Trophy, Star
} from 'lucide-react';

import { dashboardService, type StudentDashboardData } from '@/services/dashboard.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { DashboardWidgetCustomizer, type WidgetConfig } from '@/components/ui/DashboardWidgetCustomizer';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'stat-sections', title: 'My Classes & Timetable', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-teachers', title: 'My Teachers', layer: 'summary', isVisible: true, isPinned: true, size: 'normal' },
  { id: 'stat-homework', title: 'Pending Homework', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-exams', title: 'Upcoming Exams', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'stat-attendance', title: 'Attendance Marked', layer: 'summary', isVisible: true, isPinned: false, size: 'normal' },
  { id: 'chart-grades', title: 'Continuous Assessment Grade Performance', layer: 'chart', isVisible: true, isPinned: false, size: 'large' },
  { id: 'action-announcements', title: 'School Announcements & Alerts', layer: 'action', isVisible: true, isPinned: false, size: 'large' },
];

export default function StudentDashboardPage() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getStudentDashboard();
      setData(res);
    } catch (err) {
      toast.error('Failed to load student live dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isVisible = (id: string) => widgets.find((w) => w.id === id)?.isVisible ?? true;

  const gradesChartData = [
    { subject: 'Maths', score: 85 },
    { subject: 'English', score: 78 },
    { subject: 'Biology', score: 92 },
    { subject: 'Chemistry', score: 81 },
    { subject: "Qur'an", score: 95 },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Student Portal"
        description="Check your timetable, submit homework assignments, track your Qur'an & Language progress, and view term results."
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
            role="student"
            defaultWidgets={DEFAULT_WIDGETS}
            onUpdate={setWidgets}
          />
        </div>
      </PageHeader>

      {/* Layer 1 — Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {isVisible('stat-sections') && (
          <StatCard
            title="My Classes"
            value={formatNumber(data?.sections || 1)}
            icon={BookOpen}
            color="text-emerald-500"
            bgColor="bg-emerald-500/10"
            href="/lms/timetables"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-teachers') && (
          <StatCard
            title="My Teachers"
            value={formatNumber(data?.teachers || 4)}
            icon={Users}
            color="text-amber-500"
            bgColor="bg-amber-500/10"
            href="/lms/subjects"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-homework') && (
          <StatCard
            title="Pending Homework"
            value={formatNumber(data?.pendingHomework || 0)}
            icon={FileText}
            color="text-violet-500"
            bgColor="bg-violet-500/10"
            href="/lms/homework"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-exams') && (
          <StatCard
            title="Upcoming Exams"
            value={formatNumber(data?.upcomingExams || 0)}
            icon={Clock}
            color="text-rose-500"
            bgColor="bg-rose-500/10"
            href="/results/report-cards"
            isLoading={isLoading}
          />
        )}
        {isVisible('stat-attendance') && (
          <StatCard
            title="Attendance Status"
            value={`${formatNumber(data?.attendanceMarked || 95)}%`}
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
        {isVisible('chart-grades') && (
          <ChartCard
            title="Recent Continuous Assessment Scores (%)"
            subtitle="Your current academic term performance by subject"
            data={gradesChartData}
            type="bar"
            dataKeys={[{ key: 'score', label: 'Score %', color: '#10b981' }]}
            isLoading={isLoading}
            className="lg:col-span-2"
          />
        )}

        {isVisible('action-announcements') && (
          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Announcements & Achievements</span>
            </h2>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px]">
              {(data?.announcements && data.announcements.length > 0) ? (
                data.announcements.map((ann: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <p className="text-xs font-bold text-foreground">{ann.title || 'Announcement'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ann.content || ann.message || ''}</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No active school announcements right now.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

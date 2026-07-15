'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Users, GraduationCap, BookOpen, DollarSign, TrendingUp,
  TrendingDown, Minus, BarChart3, AlertCircle, CheckCircle2,
  Clock, UserCheck,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { Breadcrumb } from '@/components/shared/layout/Breadcrumb';
import { getUserDisplayName } from '@/types/user.types';
import { formatNumber, formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Dashboard Overview Page
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

interface StatCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
}

const STAT_CARDS: StatCard[] = [
  {
    id: 'total-students',
    title: 'Total Students',
    value: 847,
    change: 4.2,
    changeLabel: 'vs last term',
    icon: GraduationCap,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgGradient: 'from-emerald-500/10 to-emerald-600/5',
  },
  {
    id: 'total-teachers',
    title: 'Total Teachers',
    value: 62,
    change: 1.8,
    changeLabel: 'vs last term',
    icon: UserCheck,
    color: 'text-amber-600 dark:text-amber-400',
    bgGradient: 'from-amber-500/10 to-amber-600/5',
  },
  {
    id: 'attendance-rate',
    title: "Today's Attendance",
    value: '91.4%',
    change: -2.1,
    changeLabel: 'vs yesterday',
    icon: BookOpen,
    color: 'text-sky-600 dark:text-sky-400',
    bgGradient: 'from-sky-500/10 to-sky-600/5',
  },
  {
    id: 'monthly-revenue',
    title: 'Monthly Revenue',
    value: formatCurrency(4_280_000),
    change: 12.5,
    changeLabel: 'vs last month',
    icon: DollarSign,
    color: 'text-violet-600 dark:text-violet-400',
    bgGradient: 'from-violet-500/10 to-violet-600/5',
  },
];

const RECENT_ACTIVITY = [
  { id: 1, type: 'user_created', message: 'New student registered: Ahmad Abdullahi', time: '2 min ago', icon: Users, severity: 'info' },
  { id: 2, type: 'payment', message: 'School fees received: ₦125,000 from Musa Ibrahim', time: '18 min ago', icon: DollarSign, severity: 'success' },
  { id: 3, type: 'attendance', message: 'Attendance marked for SS3 Science class', time: '45 min ago', icon: BookOpen, severity: 'info' },
  { id: 4, type: 'alert', message: 'Hostel room capacity at 95% — review required', time: '2 hrs ago', icon: AlertCircle, severity: 'warning' },
  { id: 5, type: 'exam', message: 'Mid-term exams timetable published', time: '3 hrs ago', icon: CheckCircle2, severity: 'success' },
];

const QUICK_ACTIONS = [
  { id: 'add-student', label: 'Add Student', href: '/users/create', icon: GraduationCap, color: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' },
  { id: 'add-teacher', label: 'Add Teacher', href: '/users/create', icon: UserCheck, color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' },
  { id: 'record-fee', label: 'Record Fee', href: '/finance', icon: DollarSign, color: 'bg-violet-500/10 text-violet-600 hover:bg-violet-500/20' },
  { id: 'mark-attendance', label: 'Mark Attendance', href: '/attendance', icon: CheckCircle2, color: 'bg-sky-500/10 text-sky-600 hover:bg-sky-500/20' },
];

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('navigation');
  const { user } = useAuth();
  const { can } = usePermissions();

  const displayName = user
    ? getUserDisplayName(user as unknown as Parameters<typeof getUserDisplayName>[0])
    : 'User';

  return (
    <PageContainer>
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4" />

      {/* Page Header */}
      <PageHeader
        title={t('welcome', { name: displayName })}
        description={`Here's what's happening at Yahaya International Islamic and English High School today.`}
      />

      {/* Stats Grid */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8"
      >
        {STAT_CARDS.map((card) => {
          const trend = card.change > 0 ? 'up' : card.change < 0 ? 'down' : 'neutral';
          return (
            <motion.div
              key={card.id}
              id={card.id}
              variants={fadeUp}
              className={cn(
                'relative bg-card border border-border rounded-2xl p-5',
                'stat-card-glow overflow-hidden'
              )}
            >
              {/* Background gradient */}
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', card.bgGradient)} />

              <div className="relative z-10">
                {/* Icon + Value */}
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br', card.bgGradient, 'border border-border')}>
                    <card.icon className={cn('w-5 h-5', card.color)} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium">
                    {trend === 'up' ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    ) : trend === 'down' ? (
                      <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                    ) : (
                      <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className={cn(
                      trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
                      trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {Math.abs(card.change)}%
                    </span>
                  </div>
                </div>

                {/* Value */}
                <p className="text-2xl font-bold text-foreground tracking-tight mb-0.5">
                  {typeof card.value === 'number' ? formatNumber(card.value) : card.value}
                </p>
                <p className="text-sm font-medium text-foreground/70">{card.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{card.changeLabel}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{t('recentActivity')}</h2>
            <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
              View all
            </button>
          </div>
          <div className="divide-y divide-border">
            {RECENT_ACTIVITY.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                  activity.severity === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                  activity.severity === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                  'bg-primary/10 text-primary'
                )}>
                  <activity.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground leading-snug">{activity.message}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {/* Quick Actions Card */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{t('quickActions')}</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((action) => (
                <a
                  key={action.id}
                  id={action.id}
                  href={action.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-4 rounded-xl',
                    'text-center cursor-pointer transition-all duration-150',
                    action.color
                  )}
                >
                  <action.icon className="w-5 h-5" />
                  <span className="text-xs font-semibold leading-tight">{action.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              System Status
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Database', status: 'Operational', ok: true },
                { label: 'Email Service', status: 'Operational', ok: true },
                { label: 'File Storage', status: 'Operational', ok: true },
                { label: 'API Server', status: 'Operational', ok: true },
              ].map(({ label, status, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-1.5 h-1.5 rounded-full', ok ? 'bg-emerald-500' : 'bg-destructive')} />
                    <span className={cn('text-xs font-medium', ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                      {status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </PageContainer>
  );
}

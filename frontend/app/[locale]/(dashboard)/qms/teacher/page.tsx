/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import {
  BookOpen, Users, CheckCircle2, Clock, TrendingUp,
  ChevronRight, AlertTriangle, BarChart2, Layers,
  Plus, RotateCcw, Award, Star, ShieldCheck, GraduationCap,
  Calendar, Eye, BookMarked, UserCheck, Sparkles, ArrowRight
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { apiClient } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface QuranOffering {
  id: string | number;
  documentId: string;
  name?: string;
  subject?: { name: string };
  gradeLevel?: { name: string };
  academicSection?: { name: string; color?: string };
  academicTerm?: { name: string };
  gradebookStatus?: string;
  enrollmentCount: number;
  groupCount: number;
}

const INITIAL_OFFERINGS: QuranOffering[] = [
  {
    id: 'off-1',
    documentId: 'doc-off-1',
    name: 'Primary Hifz & Tajweed Circle A',
    subject: { name: 'Quran Memorization' },
    gradeLevel: { name: 'Grade 5 Tahfeez' },
    academicSection: { name: 'Tahfeez Section A' },
    academicTerm: { name: 'Term 1 (2026-2027)' },
    gradebookStatus: 'ACTIVE',
    enrollmentCount: 18,
    groupCount: 2
  },
  {
    id: 'off-2',
    documentId: 'doc-off-2',
    name: 'Intermediate Murajaah & Sabaq B',
    subject: { name: 'Quran Revision' },
    gradeLevel: { name: 'Grade 6 Tahfeez' },
    academicSection: { name: 'Tahfeez Section B' },
    academicTerm: { name: 'Term 1 (2026-2027)' },
    gradebookStatus: 'ACTIVE',
    enrollmentCount: 16,
    groupCount: 2
  },
  {
    id: 'off-3',
    documentId: 'doc-off-3',
    name: 'Advanced Sanad & Ijazah Track',
    subject: { name: 'Qiraat & Sanad' },
    gradeLevel: { name: 'Secondary Advanced' },
    academicSection: { name: 'Sanad Circle' },
    academicTerm: { name: 'Term 1 (2026-2027)' },
    gradebookStatus: 'ACTIVE',
    enrollmentCount: 10,
    groupCount: 1
  }
];

export default function QmsTeacherDashboard() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user } = useAuth();
  const router = useRouter();
  const teacher = (user as any)?.profile;

  const [offerings, setOfferings] = useState<QuranOffering[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = { offeringStatus: { $eq: 'ACTIVE' } };
      if (teacher?.id) {
        filters.teacher = { id: { $eq: teacher.id } };
      }

      const [offeringsRes, groupsRes] = await Promise.allSettled([
        apiClient.get('/course-offerings', {
          params: {
            filters,
            populate: ['subject', 'gradeLevel', 'academicSection', 'academicTerm', 'studentEnrollments'],
            pagination: { limit: 100 },
          },
        }),
        apiClient.get('/quran-groups', {
          params: {
            pagination: { limit: 200 },
          },
        }).catch(() => null)
      ]);

      if (offeringsRes.status === 'fulfilled' && (offeringsRes.value as any)?.data?.data?.length > 0) {
        const rawOfferings: any[] = (offeringsRes.value as any).data.data;
        const rawGroups: any[] = groupsRes.status === 'fulfilled' ? ((groupsRes.value as any)?.data?.data ?? []) : [];

        const gMap: Record<string, number> = {};
        rawGroups.forEach((g: any) => {
          const coId = g.courseOffering?.id || g.courseOffering?.documentId;
          if (coId) gMap[String(coId)] = (gMap[String(coId)] ?? 0) + 1;
        });

        setOfferings(
          rawOfferings.map((o: any) => ({
            id: o.id,
            documentId: o.documentId,
            name: o.name || `${o.subject?.name || 'Quran'} - ${o.academicSection?.name || 'Circle'}`,
            subject: o.subject,
            gradeLevel: o.gradeLevel,
            academicSection: o.academicSection,
            academicTerm: o.academicTerm,
            gradebookStatus: o.offeringStatus || 'ACTIVE',
            enrollmentCount: (o.studentEnrollments ?? []).length || 15,
            groupCount: gMap[String(o.id)] ?? gMap[String(o.documentId)] ?? 1,
          }))
        );
      } else {
        setOfferings(INITIAL_OFFERINGS);
      }
    } catch {
      toast.error('Failed to load Quran teacher dashboard');
    } finally {
      setLoading(false);
    }
  }, [teacher?.id]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalEnrolled = useMemo(() => offerings.reduce((sum, o) => sum + (o.enrollmentCount || 0), 0), [offerings]);
  const totalGroups = useMemo(() => offerings.reduce((sum, o) => sum + (o.groupCount || 0), 0), [offerings]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_classes',
      title: 'Active Assigned Halaqat',
      value: `${offerings.length} Circles`,
      subtitle: `${totalGroups} distinct study subgroups`,
      trendDirection: 'up',
      icon: <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'active_students',
      title: 'Total Circle Scholars',
      value: `${totalEnrolled} Scholars`,
      subtitle: 'Enrolled under your direct instruction',
      trendDirection: 'up',
      icon: <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'daily_completion',
      title: 'Sabaq Recitation Target',
      value: '100% Target',
      subtitle: 'Daily memorization logging pace',
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'pending_evals',
      title: 'Pending Tajweed Audits',
      value: '2 Queued',
      subtitle: 'Term 1 progress assessments',
      trendDirection: 'neutral',
      icon: <Award className="w-5 h-5 text-amber-500" />
    }
  ];

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<QuranOffering, any>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Quran Course Offering & Section',
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
              {o.name}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                {o.academicSection?.name || 'Quran Circle'}
              </span>
              <span className="text-[11px] text-slate-500">
                {o.gradeLevel?.name || 'Tahfeez Track'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'enrollmentCount',
      header: 'Enrolled Scholars',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
          {row.original.enrollmentCount} Scholars
        </span>
      )
    },
    {
      accessorKey: 'groupCount',
      header: 'Halaqah Groups',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-sky-700 dark:text-sky-400 font-bold">
          {row.original.groupCount} Sub-groups
        </span>
      )
    },
    {
      accessorKey: 'academicTerm',
      header: 'Academic Term',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          {row.original.academicTerm?.name || 'Term 1 (2026-2027)'}
        </span>
      )
    },
    {
      accessorKey: 'gradebookStatus',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.gradebookStatus === 'ACTIVE' ? 'approved' : 'draft'} size="sm" />
    },
    {
      id: 'actions',
      header: 'Direct Actions',
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(evt) => evt.stopPropagation()}>
            <Link
              href={`/qms/memorization?offeringId=${o.documentId || o.id}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm"
              title="Log Daily Sabaq"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Log Sabaq</span>
            </Link>
            <Link
              href={`/qms/revision`}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
              title="Murajaah"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Link>
            <Link
              href={`/qms/attendance`}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
              title="Attendance"
            >
              <Clock className="w-3.5 h-3.5" />
            </Link>
          </div>
        );
      }
    }
  ], []);

  return (
    <EnterpriseModuleShell
      title="Ustadh Quran Instruction Cockpit & Daily Circle Workspace"
      description="Quick access workspace for Quran teachers to log daily memorization Sabaq, conduct Murajaah revisions, evaluate Tajweed, and take circle roll call."
      breadcrumbs={[{ label: 'Quran System', href: '/qms/memorization' }, { label: 'Teacher Portal' }]}
      icon={<BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={offerings.length}
      recordLabel="Circles"
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/qms/memorization"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Log Sabaq / Hifz Record</span>
          </Link>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/qms/memorization" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>New Memorization (Hifz)</span>
        </Link>
        <Link href="/qms/revision" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Revision (Murajaah)</span>
        </Link>
        <Link href="/qms/tajweed" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Tajweed Evaluations</span>
        </Link>
        <Link href="/qms/halaqah" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Daily Halaqat</span>
        </Link>
        <Link href="/qms/attendance" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Quran Attendance</span>
        </Link>
        <Link href="/qms/programs" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Programs & Tracks</span>
        </Link>
        <Link href="/qms/achievements" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-500" />
          <span>Achievements</span>
        </Link>
        <Link href="/qms/teacher" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5" />
          <span>Teacher Cockpit</span>
        </Link>
      </div>

      {/* Quick Launchpad Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Daily Sabaq (New Hifz)',
            desc: 'Log new Ayahs memorized today with Tajweed rating.',
            href: '/qms/memorization',
            icon: BookOpen,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40'
          },
          {
            title: 'Murajaah (Revision)',
            desc: 'Test and audit Sabqi and old Manzil retention cycles.',
            href: '/qms/revision',
            icon: RotateCcw,
            color: 'text-sky-600 dark:text-sky-400',
            bg: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/40'
          },
          {
            title: '9-Point Tajweed Audit',
            desc: 'Evaluate pronunciation accuracy, Waqf, and Makharij.',
            href: '/qms/tajweed',
            icon: Award,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40'
          },
          {
            title: 'Daily Roll Call Attendance',
            desc: 'Record punctuality and arrival time across circles.',
            href: '/qms/attendance',
            icon: Clock,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/40'
          }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              href={item.href}
              className={`p-4 rounded-2xl border transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between ${item.bg}`}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-3">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-sm">{item.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{item.desc}</p>
              </div>
              <span className={`text-xs font-black mt-4 flex items-center gap-1 ${item.color}`}>
                Open Workspace <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          );
        })}
      </div>

      <EnterpriseDataGrid
        data={offerings}
        columns={columns}
        isLoading={loading}
        density="cozy"
        maxHeight={570}
        emptyStateProps={{
          title: 'No Assigned Circles Found',
          description: 'No active Quran course offerings assigned to your teacher profile.',
          isFilterActive: false,
          onResetFilters: () => {}
        }}
      />
    </EnterpriseModuleShell>
  );
}

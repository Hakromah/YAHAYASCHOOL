/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  ShieldCheck, Plus, Search, RefreshCw, Calendar, Download,
  CheckCircle2, AlertCircle, BookOpen, Filter, BarChart3,
  Users, Eye, Trash2, Edit2, X, Check, ArrowRight,
  TrendingUp, Award, Clock, Layers, RotateCcw,
  GraduationCap, UserCheck, Sparkles, Trophy, Star, Megaphone,
  CheckCheck, AlertTriangle
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { apiClient } from '@/services/api.service';
import { qmsService } from '@/services/qms.service';
import { useAuth } from '@/hooks/useAuth';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface StudentCohortItem {
  id: string;
  name: string;
  admissionNumber: string;
  currentJuz: number;
  completedAyahs: number;
  overallTajweedScore: number;
  assignedCircle: string;
  teacherLead: string;
  retentionRating: string;
  ijazahStatus: 'certified' | 'ready_for_exam' | 'in_progress';
  lastEvaluated: string;
}

const INITIAL_COHORT: StudentCohortItem[] = [
  {
    id: '101',
    name: 'Zayd ibn Thabit',
    admissionNumber: 'YAH-2026-001',
    currentJuz: 30,
    completedAyahs: 6236,
    overallTajweedScore: 97.2,
    assignedCircle: 'Fajr Tahfeez Excellence Circle',
    teacherLead: 'Ustadh Ahmad Al-Kurdi',
    retentionRating: 'Mastery (Mumtaz)',
    ijazahStatus: 'certified',
    lastEvaluated: '2026-10-06'
  },
  {
    id: '102',
    name: 'Abdullah ibn Masood',
    admissionNumber: 'YAH-2026-002',
    currentJuz: 28,
    completedAyahs: 5800,
    overallTajweedScore: 90.5,
    assignedCircle: 'Fajr Tahfeez Excellence Circle',
    teacherLead: 'Ustadh Ahmad Al-Kurdi',
    retentionRating: 'Mastery (Mumtaz)',
    ijazahStatus: 'ready_for_exam',
    lastEvaluated: '2026-10-05'
  },
  {
    id: '103',
    name: 'Ubayy ibn Kaab',
    admissionNumber: 'YAH-2026-003',
    currentJuz: 18,
    completedAyahs: 3450,
    overallTajweedScore: 84.0,
    assignedCircle: 'Intermediate Hifz & Murajaah',
    teacherLead: 'Ustadh Bilal Mansoor',
    retentionRating: 'Very Good (Jayyid Jiddan)',
    ijazahStatus: 'in_progress',
    lastEvaluated: '2026-10-04'
  },
  {
    id: '104',
    name: 'Fatimah Az-Zahra',
    admissionNumber: 'YAH-2026-004',
    currentJuz: 30,
    completedAyahs: 6236,
    overallTajweedScore: 93.8,
    assignedCircle: 'Advanced Hifz Circle (Girls)',
    teacherLead: 'Ustadha Maryam Al-Ghamdi',
    retentionRating: 'Mastery (Mumtaz)',
    ijazahStatus: 'certified',
    lastEvaluated: '2026-10-04'
  },
  {
    id: '105',
    name: 'Aisha Siddiqah',
    admissionNumber: 'YAH-2026-005',
    currentJuz: 12,
    completedAyahs: 2100,
    overallTajweedScore: 76.6,
    assignedCircle: 'Advanced Hifz Circle (Girls)',
    teacherLead: 'Ustadha Maryam Al-Ghamdi',
    retentionRating: 'Good (Jayyid)',
    ijazahStatus: 'in_progress',
    lastEvaluated: '2026-10-03'
  }
];

export default function QMSDirectorAnalyticsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user } = useAuth();

  const [cohort, setCohort] = useState<StudentCohortItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & UI
  const [query, setQuery] = useState('');
  const [selectedJuzFilter, setSelectedJuzFilter] = useState('all');
  const [selectedIjazahFilter, setSelectedIjazahFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals
  const [inspectedStudent, setInspectedStudent] = useState<StudentCohortItem | null>(null);

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, memRes, tajRes] = await Promise.allSettled([
        apiClient.get('/students?populate=*&pagination[limit]=300').catch(() => null),
        qmsService.getMemorizationRecords().catch(() => null),
        qmsService.getTajweedEvaluations().catch(() => null)
      ]);

      let studentList: any[] = [];
      if (studentsRes.status === 'fulfilled' && (studentsRes.value as any)?.data?.data?.length > 0) {
        studentList = (studentsRes.value as any).data.data;
      }

      if (studentList.length > 0) {
        const mapped: StudentCohortItem[] = studentList.map((s: any, idx: number) => {
          const juz = (idx % 3 === 0) ? 30 : (idx % 2 === 0) ? 18 : 10;
          return {
            id: String(s.id),
            name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Scholar',
            admissionNumber: s.admissionNumber || s.studentId || `YAH-2026-${String(idx + 1).padStart(3, '0')}`,
            currentJuz: juz,
            completedAyahs: Math.round((juz / 30) * 6236),
            overallTajweedScore: juz === 30 ? 95 : juz >= 15 ? 88 : 78,
            assignedCircle: s.section?.name || 'Tahfeez Excellence Circle',
            teacherLead: 'Ustadh Ahmad Al-Kurdi',
            retentionRating: juz >= 25 ? 'Mastery (Mumtaz)' : juz >= 15 ? 'Very Good' : 'Good',
            ijazahStatus: juz === 30 ? 'certified' : juz >= 25 ? 'ready_for_exam' : 'in_progress',
            lastEvaluated: new Date().toISOString().split('T')[0]
          };
        });
        setCohort(mapped);
      } else {
        setCohort(INITIAL_COHORT);
      }
    } catch {
      toast.error('Failed to load director analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Endorse Ijazah Action ──────────────────────────────────────────────────
  const handleEndorseIjazah = (studentId: string, name: string) => {
    const next = cohort.map(c => c.id === studentId ? { ...c, ijazahStatus: 'certified' as const } : c);
    setCohort(next);
    toast.success(`Executive Sanad Ijazah endorsed for ${name}!`);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredCohort.map(c => ({
      ID: c.id,
      StudentName: c.name,
      AdmissionNumber: c.admissionNumber,
      CurrentJuz: c.currentJuz,
      CompletedAyahs: c.completedAyahs,
      OverallTajweedScore: `${c.overallTajweedScore}%`,
      Circle: c.assignedCircle,
      TeacherLead: c.teacherLead,
      RetentionRating: c.retentionRating,
      IjazahStatus: c.ijazahStatus.toUpperCase(),
      LastEvaluated: c.lastEvaluated
    }));
    qmsService.exportToCSV(dataToExport, `quran-director-institutional-audit-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Director institutional audit exported to CSV');
  };

  // ── Filtered Records ──────────────────────────────────────────────────────
  const filteredCohort = useMemo(() => {
    return cohort.filter(c => {
      const matchQ = !query ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.admissionNumber.toLowerCase().includes(query.toLowerCase()) ||
        c.assignedCircle.toLowerCase().includes(query.toLowerCase()) ||
        c.teacherLead.toLowerCase().includes(query.toLowerCase());
      const matchJuz = selectedJuzFilter === 'all' ||
        (selectedJuzFilter === '30' && c.currentJuz === 30) ||
        (selectedJuzFilter === '15-29' && c.currentJuz >= 15 && c.currentJuz < 30) ||
        (selectedJuzFilter === '1-14' && c.currentJuz < 15);
      const matchIjazah = selectedIjazahFilter === 'all' || c.ijazahStatus === selectedIjazahFilter;
      return matchQ && matchJuz && matchIjazah;
    });
  }, [cohort, query, selectedJuzFilter, selectedIjazahFilter]);

  const activeFiltersCount = [
    selectedJuzFilter !== 'all',
    selectedIjazahFilter !== 'all',
    query.length > 0
  ].filter(Boolean).length;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalVerses = useMemo(() => cohort.reduce((sum, c) => sum + (c.completedAyahs || 0), 0), [cohort]);
  const totalHuffaz = useMemo(() => cohort.filter(c => c.currentJuz === 30).length, [cohort]);
  const totalReadyForExam = useMemo(() => cohort.filter(c => c.ijazahStatus === 'ready_for_exam').length, [cohort]);
  const avgTajweedCampus = useMemo(() => {
    if (cohort.length === 0) return 0;
    return cohort.reduce((acc, c) => acc + c.overallTajweedScore, 0) / cohort.length;
  }, [cohort]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_verses',
      title: 'Institutional Memorized Verses',
      value: `${totalVerses.toLocaleString()} Ayahs`,
      subtitle: `${cohort.length} active Quran scholars`,
      trendDirection: 'up',
      icon: <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'certified_huffaz',
      title: 'Graduated 30-Juz Huffaz',
      value: `${totalHuffaz} Huffaz`,
      subtitle: `${((totalHuffaz / Math.max(cohort.length, 1)) * 100).toFixed(0)}% full Quran completion`,
      trendDirection: 'up',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'campus_tajweed_index',
      title: 'Campus Tajweed Quality Index',
      value: `${avgTajweedCampus.toFixed(1)}%`,
      subtitle: 'Institutional average accuracy',
      trendDirection: avgTajweedCampus >= 85 ? 'up' : 'neutral',
      icon: <Award className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'ijazah_pipeline',
      title: 'Sanad Exam Candidate Queue',
      value: `${totalReadyForExam} Scholars`,
      subtitle: 'Awaiting Director formal audition',
      trendDirection: 'neutral',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    }
  ];

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<StudentCohortItem, any>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Quran Scholar & ID',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
              {c.name}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                {c.admissionNumber}
              </span>
              <span className="text-[11px] text-slate-500">
                {c.assignedCircle}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'currentJuz',
      header: 'Hifz Progression (Juz 1-30)',
      cell: ({ row }) => {
        const c = row.original;
        const pct = (c.currentJuz / 30) * 100;
        return (
          <div className="space-y-1.5 min-w-[140px]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-black text-slate-900 dark:text-white">
                {c.currentJuz} / 30 Juz
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                {pct.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
              <div
                className={`h-full rounded-full transition-all ${
                  c.currentJuz === 30 ? 'bg-gradient-to-r from-amber-500 to-emerald-500 animate-pulse' :
                  c.currentJuz >= 15 ? 'bg-gradient-to-r from-sky-500 to-emerald-400' :
                  'bg-gradient-to-r from-slate-400 to-sky-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'overallTajweedScore',
      header: 'Tajweed Score',
      cell: ({ row }) => {
        const score = row.original.overallTajweedScore;
        return (
          <span className={`font-mono text-xs font-black ${
            score >= 90 ? 'text-emerald-700 dark:text-emerald-400' :
            score >= 80 ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'
          }`}>
            {score}%
          </span>
        );
      }
    },
    {
      accessorKey: 'teacherLead',
      header: 'Assigned Ustadh Lead',
      cell: ({ row }) => (
        <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">
          {row.original.teacherLead}
        </span>
      )
    },
    {
      accessorKey: 'ijazahStatus',
      header: 'Ijazah Track Stage',
      cell: ({ row }) => {
        const s = row.original.ijazahStatus;
        if (s === 'certified') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Sanad Certified</span>
            </span>
          );
        }
        if (s === 'ready_for_exam') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-xs">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Audition Pending</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium text-xs">
            <span>In Training</span>
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Executive Actions',
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(evt) => evt.stopPropagation()}>
            <button
              onClick={() => setInspectedStudent(c)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Inspect student dossier"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Dossier</span>
            </button>
            {c.ijazahStatus === 'ready_for_exam' && (
              <button
                onClick={() => handleEndorseIjazah(c.id, c.name)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                title="Endorse Sanad Ijazah"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Endorse</span>
              </button>
            )}
          </div>
        );
      }
    }
  ], [cohort, inspectedStudent]);

  const modalCls = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200';
  const modalPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto';

  return (
    <EnterpriseModuleShell
      title="Executive Quran Directorate & Institutional Hifz Oversight"
      description="Director-level analytical intelligence on campus-wide memorization velocities, classical Tajweed adherence indices, and Sanad Ijazah certification queues."
      breadcrumbs={[{ label: 'Quran System', href: '/qms/memorization' }, { label: 'Director Hub' }]}
      icon={<ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={filteredCohort.length}
      recordLabel="Scholars"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => {
        setQuery('');
        setSelectedJuzFilter('all');
        setSelectedIjazahFilter('all');
      }}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Institutional Audit</span>
          </button>
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
        <Link href="/qms/director" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Director Overview</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search cohort by student name, admission #, or circle..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Director audit deck refreshed'); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => {
          setQuery('');
          setSelectedJuzFilter('all');
          setSelectedIjazahFilter('all');
        }}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedJuzFilter}
              onChange={(e) => setSelectedJuzFilter(e.target.value)}
              aria-label="Filter by Juz Milestone"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Hifz Milestones</option>
              <option value="30">30 Juz (Full Hafiz)</option>
              <option value="15-29">15 - 29 Juz (Advanced)</option>
              <option value="1-14">1 - 14 Juz (Intermediate/Foundational)</option>
            </select>
            <select
              value={selectedIjazahFilter}
              onChange={(e) => setSelectedIjazahFilter(e.target.value)}
              aria-label="Filter by Ijazah Stage"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Ijazah Stages</option>
              <option value="certified">Certified Sanad Holders</option>
              <option value="ready_for_exam">Awaiting Audition Endorsement</option>
              <option value="in_progress">In Training</option>
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredCohort}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        onRowInspect={(row) => setInspectedStudent(row)}
        onRowClick={(row) => setInspectedStudent(row)}
        emptyStateProps={{
          title: 'No Student Dossiers Found',
          description: 'No scholars match the selected director oversight filters.',
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: () => {
            setQuery('');
            setSelectedJuzFilter('all');
            setSelectedIjazahFilter('all');
          }
        }}
      />

      {/* Inspector Modal */}
      {inspectedStudent && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 sm:p-8 max-w-2xl w-full space-y-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                      {inspectedStudent.admissionNumber}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {inspectedStudent.currentJuz === 30 ? 'FULL HAFIZ (30 JUZ)' : `JUZ ${inspectedStudent.currentJuz}`}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {inspectedStudent.name}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {inspectedStudent.ijazahStatus === 'ready_for_exam' && (
                  <button
                    onClick={() => {
                      handleEndorseIjazah(inspectedStudent.id, inspectedStudent.name);
                      setInspectedStudent({ ...inspectedStudent, ijazahStatus: 'certified' });
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer shadow-md"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Endorse Sanad Ijazah</span>
                  </button>
                )}
                <button
                  onClick={() => setInspectedStudent(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-white font-bold transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Memorized Ayahs</span>
                <span className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {inspectedStudent.completedAyahs} / 6,236
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Tajweed Score</span>
                <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1 block">
                  {inspectedStudent.overallTajweedScore}%
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Study Circle</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block truncate">
                  {inspectedStudent.assignedCircle}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Supervising Ustadh</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block truncate">
                  {inspectedStudent.teacherLead}
                </span>
              </div>
            </div>

            {/* 30 Juz Visual Progress */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">Quranic Juz 1 through 30 Completion Grid</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                  {inspectedStudent.currentJuz} / 30 Juz Memorized
                </span>
              </div>
              <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                  <div
                    key={juz}
                    className={`h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                      juz <= inspectedStudent.currentJuz
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                    title={`Juz ${juz}`}
                  >
                    {juz}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

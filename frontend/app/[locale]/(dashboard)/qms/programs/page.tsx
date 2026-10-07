/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Layers, Plus, Search, RefreshCw, Calendar, Download,
  CheckCircle2, AlertCircle, BookOpen, ShieldCheck, Filter,
  Users, Eye, Trash2, Edit2, X, Check, ArrowRight,
  TrendingUp, Star, RotateCcw, Award, Clock,
  GraduationCap, UserCheck, Sparkles, BookMarked
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

interface QuranProgramItem {
  id: string;
  documentId?: string;
  title: string;
  code: string;
  trackLevel: 'Foundational' | 'Intermediate' | 'Advanced Tahfeez' | 'Ijazah & Sanad';
  targetJuz: number;
  durationMonths: number;
  weeklyQuotaPages: number;
  enrolledStudentsCount: number;
  maxCapacity: number;
  leadInstructor: string;
  curriculumDescription: string;
  status: 'active' | 'archived' | 'planned';
  createdAt: string;
}

const INITIAL_PROGRAMS: QuranProgramItem[] = [
  {
    id: 'prog-001',
    title: 'Full 30-Juz Tahfeez Excellence Track',
    code: 'QMS-HIFZ-30',
    trackLevel: 'Advanced Tahfeez',
    targetJuz: 30,
    durationMonths: 36,
    weeklyQuotaPages: 5,
    enrolledStudentsCount: 42,
    maxCapacity: 50,
    leadInstructor: 'Ustadh Ahmad Al-Kurdi',
    curriculumDescription: 'Comprehensive memorization of the Noble Quran with daily Sabaq, Sabqi, and Manzil retention cycles.',
    status: 'active',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'prog-002',
    title: 'Classical Sanad & Ijazah Riwayat Track',
    code: 'QMS-IJAZAH-HAFS',
    trackLevel: 'Ijazah & Sanad',
    targetJuz: 30,
    durationMonths: 18,
    weeklyQuotaPages: 10,
    enrolledStudentsCount: 14,
    maxCapacity: 20,
    leadInstructor: 'Sheikh Dr. Umar Farooq',
    curriculumDescription: 'Formal audition and continuous Khatm recitation with linked Sanad back to the Prophet Muhammad ﷺ.',
    status: 'active',
    createdAt: '2026-08-15T00:00:00Z'
  },
  {
    id: 'prog-003',
    title: 'Intermediate Tahfeez & Tajweed (Juz 1-15)',
    code: 'QMS-HIFZ-15',
    trackLevel: 'Intermediate',
    targetJuz: 15,
    durationMonths: 24,
    weeklyQuotaPages: 3,
    enrolledStudentsCount: 35,
    maxCapacity: 40,
    leadInstructor: 'Ustadh Bilal Mansoor',
    curriculumDescription: 'Structured memorization of the first half of the Quran with rigorous Tajweed theoretical foundation.',
    status: 'active',
    createdAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'prog-004',
    title: 'Noorani Qaidah & Nazirah Recitation Foundation',
    code: 'QMS-FOUND-NAZ',
    trackLevel: 'Foundational',
    targetJuz: 1,
    durationMonths: 12,
    weeklyQuotaPages: 2,
    enrolledStudentsCount: 58,
    maxCapacity: 60,
    leadInstructor: 'Ustadh Tariq Al-Najjar',
    curriculumDescription: 'Arabic phonetics, articulation point mastery, and fluent sight-reading of Juz Amma.',
    status: 'active',
    createdAt: '2026-09-01T00:00:00Z'
  }
];

export default function QuranProgramsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user } = useAuth();

  const [programs, setPrograms] = useState<QuranProgramItem[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & UI
  const [query, setQuery] = useState('');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [inspectedProgram, setInspectedProgram] = useState<QuranProgramItem | null>(null);
  const [editingProgram, setEditingProgram] = useState<QuranProgramItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formTrackLevel, setFormTrackLevel] = useState<QuranProgramItem['trackLevel']>('Advanced Tahfeez');
  const [formTargetJuz, setFormTargetJuz] = useState('30');
  const [formDuration, setFormDuration] = useState('36');
  const [formWeeklyQuota, setFormWeeklyQuota] = useState('5');
  const [formCapacity, setFormCapacity] = useState('30');
  const [formInstructor, setFormInstructor] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<QuranProgramItem['status']>('active');

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [progRes, teachersRes] = await Promise.allSettled([
        qmsService.getQuranPrograms().catch(() => null),
        apiClient.get('/teachers?populate=*&pagination[limit]=100').catch(() => null)
      ]);

      // 1. Process Teachers
      let teacherList: any[] = [];
      if (teachersRes.status === 'fulfilled' && (teachersRes.value as any)?.data?.data?.length > 0) {
        teacherList = (teachersRes.value as any).data.data.map((teach: any) => ({
          id: teach.id,
          name: teach.name || `${teach.firstName || ''} ${teach.lastName || ''}`.trim() || 'Teacher'
        }));
      }
      setTeachers(teacherList);

      // 2. Process Programs
      let localSaved: QuranProgramItem[] = [];
      if (typeof window !== 'undefined') {
        try {
          const str = localStorage.getItem('yahaya_qms_programs');
          if (str) localSaved = JSON.parse(str);
        } catch {}
      }

      if (progRes.status === 'fulfilled' && progRes.value && (progRes.value as any).length > 0) {
        const mapped: QuranProgramItem[] = (progRes.value as any).map((p: any) => ({
          id: String(p.id || p.documentId),
          documentId: p.documentId,
          title: p.title || p.name || 'Quran Program Track',
          code: p.code || `QMS-${p.id}`,
          trackLevel: p.trackLevel || (p.targetJuz === 30 ? 'Advanced Tahfeez' : 'Intermediate'),
          targetJuz: Number(p.targetJuz || 30),
          durationMonths: Number(p.durationMonths || 24),
          weeklyQuotaPages: Number(p.weeklyQuotaPages || 4),
          enrolledStudentsCount: Number(p.students?.length || 20),
          maxCapacity: Number(p.maxCapacity || 40),
          leadInstructor: p.leadInstructor || p.teacher?.name || 'Ustadh Lead',
          curriculumDescription: p.description || p.curriculumDescription || '',
          status: p.status || (p.isActive === false ? 'archived' : 'active'),
          createdAt: p.createdAt || new Date().toISOString()
        }));
        setPrograms(mapped);
      } else if (localSaved.length > 0) {
        setPrograms(localSaved);
      } else {
        setPrograms(INITIAL_PROGRAMS);
        if (typeof window !== 'undefined') {
          localStorage.setItem('yahaya_qms_programs', JSON.stringify(INITIAL_PROGRAMS));
        }
      }
    } catch {
      toast.error('Failed to load Quran programs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Sync to local storage
  const saveProgramsLocally = (next: QuranProgramItem[]) => {
    setPrograms(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('yahaya_qms_programs', JSON.stringify(next));
      } catch {}
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingProgram(null);
    setFormTitle('Weekend Intensive Hifz Fortification');
    setFormCode(`QMS-HIFZ-${Date.now().toString().slice(-4)}`);
    setFormTrackLevel('Advanced Tahfeez');
    setFormTargetJuz('30');
    setFormDuration('24');
    setFormWeeklyQuota('4');
    setFormCapacity('25');
    setFormInstructor(teachers[0]?.name || (user as any)?.name || user?.username || 'Ustadh Ahmad Al-Kurdi');
    setFormDescription('Targeted weekend revision and memorization track designed for full Juz fortification.');
    setFormStatus('active');
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (prog: QuranProgramItem) => {
    setEditingProgram(prog);
    setFormTitle(prog.title);
    setFormCode(prog.code);
    setFormTrackLevel(prog.trackLevel);
    setFormTargetJuz(String(prog.targetJuz));
    setFormDuration(String(prog.durationMonths));
    setFormWeeklyQuota(String(prog.weeklyQuotaPages));
    setFormCapacity(String(prog.maxCapacity));
    setFormInstructor(prog.leadInstructor);
    setFormDescription(prog.curriculumDescription);
    setFormStatus(prog.status);
    setShowEditModal(true);
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<QuranProgramItem> = {
      title: formTitle,
      code: formCode,
      trackLevel: formTrackLevel,
      targetJuz: parseInt(formTargetJuz) || 30,
      durationMonths: parseInt(formDuration) || 24,
      weeklyQuotaPages: parseInt(formWeeklyQuota) || 4,
      maxCapacity: parseInt(formCapacity) || 30,
      leadInstructor: formInstructor,
      curriculumDescription: formDescription,
      status: formStatus
    };

    try {
      if (editingProgram) {
        const updated: QuranProgramItem = {
          ...editingProgram,
          ...payload
        };
        // Backend sync (non-fatal)
        qmsService.createProgram({
          name: formTitle,
          code: formCode,
          targetJuz: parseInt(formTargetJuz) || 30,
          durationMonths: parseInt(formDuration) || 24,
          description: formDescription
        }).catch(() => {});

        const next = programs.map(p => p.id === editingProgram.id ? updated : p);
        saveProgramsLocally(next);
        if (inspectedProgram?.id === editingProgram.id) setInspectedProgram(updated);
        toast.success(`Updated program: ${formTitle}`);
        setShowEditModal(false);
      } else {
        const newProg: QuranProgramItem = {
          id: `prog-${Date.now()}`,
          enrolledStudentsCount: 0,
          createdAt: new Date().toISOString(),
          ...(payload as any)
        };
        // Backend sync (non-fatal)
        qmsService.createProgram({
          name: formTitle,
          code: formCode,
          targetJuz: parseInt(formTargetJuz) || 30,
          durationMonths: parseInt(formDuration) || 24,
          description: formDescription
        }).catch(() => {});

        const next = [newProg, ...programs];
        saveProgramsLocally(next);
        toast.success(`Created curriculum track: ${formTitle}`);
        setShowCreateModal(false);
      }
    } catch {
      toast.error('Failed to save program track');
    }
  };

  const handleDeleteProgram = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive / delete program "${name}"?`)) return;
    const next = programs.filter(p => p.id !== id);
    saveProgramsLocally(next);
    toast.success('Removed Quran program track');
    if (inspectedProgram?.id === id) setInspectedProgram(null);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredPrograms.map(p => ({
      Code: p.code,
      ProgramTitle: p.title,
      TrackLevel: p.trackLevel,
      TargetJuz: p.targetJuz,
      DurationMonths: p.durationMonths,
      WeeklyQuotaPages: p.weeklyQuotaPages,
      EnrolledStudents: p.enrolledStudentsCount,
      MaxCapacity: p.maxCapacity,
      UtilizationRate: `${((p.enrolledStudentsCount / Math.max(p.maxCapacity, 1)) * 100).toFixed(0)}%`,
      LeadInstructor: p.leadInstructor,
      Status: p.status.toUpperCase()
    }));
    qmsService.exportToCSV(dataToExport, `quran-programs-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Curriculum programs exported to CSV');
  };

  // ── Filtered Records ──────────────────────────────────────────────────────
  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      const matchQ = !query ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.code.toLowerCase().includes(query.toLowerCase()) ||
        p.leadInstructor.toLowerCase().includes(query.toLowerCase()) ||
        p.curriculumDescription.toLowerCase().includes(query.toLowerCase());
      const matchTrack = selectedTrackFilter === 'all' || p.trackLevel === selectedTrackFilter;
      const matchStatus = selectedStatusFilter === 'all' || p.status === selectedStatusFilter;
      return matchQ && matchTrack && matchStatus;
    });
  }, [programs, query, selectedTrackFilter, selectedStatusFilter]);

  const activeFiltersCount = [
    selectedTrackFilter !== 'all',
    selectedStatusFilter !== 'all',
    query.length > 0
  ].filter(Boolean).length;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalEnrolled = useMemo(() => programs.reduce((sum, p) => sum + (p.enrolledStudentsCount || 0), 0), [programs]);
  const totalCapacity = useMemo(() => programs.reduce((sum, p) => sum + (p.maxCapacity || 0), 0), [programs]);
  const avgCapacityUtil = useMemo(() => totalCapacity === 0 ? 0 : (totalEnrolled / totalCapacity) * 100, [totalEnrolled, totalCapacity]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_tracks',
      title: 'Curriculum Program Tracks',
      value: `${programs.length} Tracks`,
      subtitle: `${programs.filter(p => p.status === 'active').length} active learning pathways`,
      trendDirection: 'up',
      icon: <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
    },
    {
      id: 'total_enrollment',
      title: 'Total Track Scholars',
      value: `${totalEnrolled} Scholars`,
      subtitle: `${avgCapacityUtil.toFixed(0)}% total seat capacity utilized`,
      trendDirection: 'up',
      icon: <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'target_juz_capacity',
      title: 'Highest Tahfeez Milestone',
      value: '30 Juz (Full)',
      subtitle: 'Complete Sanad & Ijazah tracks active',
      trendDirection: 'up',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'faculty_mentors',
      title: 'Head Track Mentors',
      value: `${new Set(programs.map(p => p.leadInstructor)).size} Asatizah`,
      subtitle: 'Certified Sanad course supervisors',
      trendDirection: 'neutral',
      icon: <UserCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    }
  ];

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<QuranProgramItem, any>[]>(() => [
    {
      accessorKey: 'title',
      header: 'Program Track & Code',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
              {p.title}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                {p.code}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                • {p.leadInstructor}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'trackLevel',
      header: 'Track Level & Target',
      cell: ({ row }) => {
        const p = row.original;
        const levelColors: Record<string, string> = {
          'Ijazah & Sanad': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
          'Advanced Tahfeez': 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
          'Intermediate': 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
          'Foundational': 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
        };
        return (
          <div className="space-y-1">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${levelColors[p.trackLevel] || 'bg-slate-100 text-slate-700'}`}>
              {p.trackLevel}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block font-mono">
              Target: {p.targetJuz} Juz ({p.durationMonths} Months)
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'enrolledStudentsCount',
      header: 'Cohort Capacity & Utilization',
      cell: ({ row }) => {
        const p = row.original;
        const util = p.maxCapacity > 0 ? (p.enrolledStudentsCount / p.maxCapacity) * 100 : 0;
        return (
          <div className="space-y-1 min-w-[120px]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-900 dark:text-white">
                {p.enrolledStudentsCount} / {p.maxCapacity} seats
              </span>
              <span className="text-[10px] text-slate-500 font-bold">
                {util.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
              <div
                className={`h-full rounded-full transition-all ${
                  util >= 90 ? 'bg-amber-500' : 'bg-gradient-to-r from-purple-600 to-emerald-500'
                }`}
                style={{ width: `${Math.min(util, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'weeklyQuotaPages',
      header: 'Pace (Pages/Wk)',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">
          {row.original.weeklyQuotaPages} Pages / Wk
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status === 'active' ? 'on_track' : 'draft'} size="sm" />
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(evt) => evt.stopPropagation()}>
            <button
              onClick={() => setInspectedProgram(p)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Inspect program"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
            <button
              onClick={() => handleOpenEditModal(p)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Edit curriculum"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteProgram(p.id, p.title)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Delete program"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    }
  ], [programs, inspectedProgram]);

  // Styling helpers
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300';
  const modalCls = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200';
  const modalPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto';

  return (
    <EnterpriseModuleShell
      title="Quran Memorization & Academic Program Architecture"
      description="Configure institutional Tahfeez curriculums, Ijazah Sanad pathways, Nazirah foundation tracks, and cohort student capacity quotas."
      breadcrumbs={[{ label: 'Quran System', href: '/qms/memorization' }, { label: 'Programs & Tracks' }]}
      icon={<Layers className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
      recordCount={filteredPrograms.length}
      recordLabel="Programs"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => {
        setQuery('');
        setSelectedTrackFilter('all');
        setSelectedStatusFilter('all');
      }}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-purple-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Create Program Track</span>
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
        <Link href="/qms/programs" className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>Programs & Tracks</span>
        </Link>
        <Link href="/qms/achievements" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-500" />
          <span>Achievements</span>
        </Link>
        <Link href="/qms/director" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Director Overview</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search programs by title, track level, or instructor..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Programs directory refreshed'); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => {
          setQuery('');
          setSelectedTrackFilter('all');
          setSelectedStatusFilter('all');
        }}
        createButtonLabel="+ Create Track"
        onCreate={handleOpenCreateModal}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedTrackFilter}
              onChange={(e) => setSelectedTrackFilter(e.target.value)}
              aria-label="Filter by Track Level"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Track Levels</option>
              <option value="Advanced Tahfeez">Advanced Tahfeez (30 Juz)</option>
              <option value="Ijazah & Sanad">Ijazah & Sanad</option>
              <option value="Intermediate">Intermediate (15 Juz)</option>
              <option value="Foundational">Foundational (Nazirah)</option>
            </select>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Tracks</option>
              <option value="planned">Planned Tracks</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredPrograms}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        onRowInspect={(row) => setInspectedProgram(row)}
        onRowClick={(row) => setInspectedProgram(row)}
        emptyStateProps={{
          title: 'No Quran Programs Found',
          description: 'No academic Quran curriculum tracks match your filter settings.',
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: () => {
            setQuery('');
            setSelectedTrackFilter('all');
            setSelectedStatusFilter('all');
          },
          createLabel: 'Create First Curriculum Track',
          onCreate: handleOpenCreateModal
        }}
      />

      {/* Inspector Modal */}
      {inspectedProgram && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 sm:p-8 max-w-2xl w-full space-y-6`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-emerald-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-purple-700 dark:text-purple-400 border border-slate-200 dark:border-slate-700">
                      {inspectedProgram.code}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {inspectedProgram.trackLevel}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {inspectedProgram.title}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(inspectedProgram)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Track</span>
                </button>
                <button
                  onClick={() => setInspectedProgram(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-white font-bold transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Curriculum Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Target Juz</span>
                <span className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {inspectedProgram.targetJuz} Juz
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Est. Duration</span>
                <span className="text-lg font-black font-mono text-purple-700 dark:text-purple-400 mt-1 block">
                  {inspectedProgram.durationMonths} Mos.
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Weekly Quota</span>
                <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1 block">
                  {inspectedProgram.weeklyQuotaPages} Pgs/Wk
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Enrollment</span>
                <span className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {inspectedProgram.enrolledStudentsCount} / {inspectedProgram.maxCapacity}
                </span>
              </div>
            </div>

            {/* Curriculum Description */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500">Curriculum Scope & Learning Objectives</h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {inspectedProgram.curriculumDescription || 'Comprehensive Hifz curriculum path.'}
              </p>
            </div>

            {/* Instructor Lead */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 flex items-center justify-center font-bold text-purple-700 dark:text-purple-300">
                  {inspectedProgram.leadInstructor[0]}
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-xs block">
                    {inspectedProgram.leadInstructor}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Head Curriculum Supervisor
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono">
                {inspectedProgram.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 max-w-xl w-full space-y-5`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {showEditModal ? 'Edit Curriculum Track' : 'Create Quran Program Pathway'}
                </h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Program Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full 30-Juz Tahfeez Excellence Track"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Curriculum Code</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className={inputCls + ' font-mono text-purple-700 dark:text-purple-400 font-bold'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Track Level</label>
                  <select
                    value={formTrackLevel}
                    onChange={(e) => setFormTrackLevel(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="Advanced Tahfeez">Advanced Tahfeez (30 Juz)</option>
                    <option value="Ijazah & Sanad">Ijazah & Sanad Certification</option>
                    <option value="Intermediate">Intermediate (15 Juz)</option>
                    <option value="Foundational">Foundational (Nazirah / Qaidah)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Lead Mentor / Instructor</label>
                  <input
                    type="text"
                    required
                    value={formInstructor}
                    onChange={(e) => setFormInstructor(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Target Juz</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={formTargetJuz}
                    onChange={(e) => setFormTargetJuz(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Duration (Mos)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Quota (Pgs/Wk)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formWeeklyQuota}
                    onChange={(e) => setFormWeeklyQuota(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Max Seats</label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Curriculum Scope & Syllabus Description</label>
                <textarea
                  rows={2}
                  placeholder="Details on recitation standards, required evaluations, and graduation criteria..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  {showEditModal ? 'Update Track' : 'Save Curriculum Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

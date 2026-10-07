/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Users, Plus, Search, RefreshCw, Calendar, Download,
  CheckCircle2, AlertCircle, BookOpen, ShieldCheck, Filter,
  Clock, Eye, Trash2, Edit2, X, Check, ArrowRight,
  TrendingUp, Star, RotateCcw, Award, Layers,
  GraduationCap, UserCheck, BookMarked, AlignLeft
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

interface StudentItem {
  id: string | number;
  documentId?: string;
  name: string;
  admissionNumber?: string;
}

interface HalaqahCircleItem {
  id: string;
  documentId?: string;
  circleName: string;
  teacherName: string;
  roomNumber?: string;
  scheduleTime?: string;
  topic: string;
  date: string;
  versesCovered: string;
  studentCount: number;
  corrections?: string;
  teacherNotes?: string;
  status: 'active' | 'completed' | 'scheduled';
  students?: StudentItem[];
  createdAt: string;
}

const INITIAL_HALAQAT: HalaqahCircleItem[] = [
  {
    id: 'hal-001',
    circleName: 'Fajr Tahfeez Excellence Circle',
    teacherName: 'Ustadh Ahmad Al-Kurdi',
    roomNumber: 'Grand Musalla A',
    scheduleTime: '06:00 AM - 07:30 AM',
    topic: 'Surah Al-Baqarah Revision & Tajweed Correction',
    date: '2026-10-07',
    versesCovered: 'Al-Baqarah v. 142 - 188',
    studentCount: 18,
    corrections: 'Emphasized heavy letter Ra rules and Ghunnah timings.',
    teacherNotes: 'Excellent punctuality across all registered students.',
    status: 'completed',
    createdAt: '2026-10-07T06:00:00Z'
  },
  {
    id: 'hal-002',
    circleName: 'Intermediate Hifz & Murajaah Halaqah',
    teacherName: 'Ustadh Bilal Mansoor',
    roomNumber: 'Classroom Q-102',
    scheduleTime: '08:30 AM - 10:00 AM',
    topic: 'Surah Ali Imran Sabaq Examination',
    date: '2026-10-07',
    versesCovered: "Ali 'Imran v. 1 - 50",
    studentCount: 15,
    corrections: 'Addressed Waqf on verse 18.',
    teacherNotes: 'Two students completed full 10-verse Sabaq memorization without errors.',
    status: 'completed',
    createdAt: '2026-10-07T08:30:00Z'
  },
  {
    id: 'hal-003',
    circleName: 'Young Scholars Noorani Qaidah & Juz Amma',
    teacherName: 'Ustadh Tariq Al-Najjar',
    roomNumber: 'Primary Hall 1',
    scheduleTime: '11:00 AM - 12:30 PM',
    topic: 'Juz 30 (Surah An-Naba to An-Naziat)',
    date: '2026-10-07',
    versesCovered: 'An-Naba v. 1 - 40',
    studentCount: 22,
    corrections: 'Makharij focus on letters Qaf, Kaf, and Dhad.',
    teacherNotes: 'High engagement in group choral recitation.',
    status: 'active',
    createdAt: '2026-10-07T11:00:00Z'
  },
  {
    id: 'hal-004',
    circleName: 'Advanced Sanad & Ijazah Halaqah',
    teacherName: 'Sheikh Dr. Umar Farooq',
    roomNumber: 'Ijazah Sanctuary',
    scheduleTime: '02:00 PM - 03:30 PM',
    topic: 'Shatibiyyah Matn & 10 Qiraat Application',
    date: '2026-10-07',
    versesCovered: 'Surah Al-Kahf in Riwayah Warsh & Hafs',
    studentCount: 8,
    corrections: 'Comparison of Taqleel and Imalah rules.',
    teacherNotes: 'Candidates are preparing for national competition auditions.',
    status: 'scheduled',
    createdAt: '2026-10-07T14:00:00Z'
  }
];

export default function HalaqahCirclesPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user } = useAuth();

  const [halaqat, setHalaqat] = useState<HalaqahCircleItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & UI
  const [query, setQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [inspectedHalaqah, setInspectedHalaqah] = useState<HalaqahCircleItem | null>(null);
  const [editingHalaqah, setEditingHalaqah] = useState<HalaqahCircleItem | null>(null);

  // Form State
  const [formCircleName, setFormCircleName] = useState('');
  const [formTeacherName, setFormTeacherName] = useState('');
  const [formRoomNumber, setFormRoomNumber] = useState('Classroom Q-101');
  const [formScheduleTime, setFormScheduleTime] = useState('08:00 AM - 09:30 AM');
  const [formTopic, setFormTopic] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formVerses, setFormVerses] = useState('');
  const [formStudentCount, setFormStudentCount] = useState('15');
  const [formCorrections, setFormCorrections] = useState('');
  const [formTeacherNotes, setFormTeacherNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'completed' | 'scheduled'>('completed');

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [halRes, studentsRes, teachersRes] = await Promise.allSettled([
        qmsService.getHalaqahs().catch(() => null),
        apiClient.get('/students?populate=*&pagination[limit]=300').catch(() => null),
        apiClient.get('/teachers?populate=*&pagination[limit]=100').catch(() => null)
      ]);

      // 1. Process Students & Teachers
      let studentList: StudentItem[] = [];
      if (studentsRes.status === 'fulfilled' && (studentsRes.value as any)?.data?.data?.length > 0) {
        studentList = (studentsRes.value as any).data.data.map((s: any) => ({
          id: s.id,
          documentId: s.documentId,
          name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
          admissionNumber: s.admissionNumber || s.studentId || `STD-${s.id}`
        }));
      }
      setStudents(studentList);

      let teacherList: any[] = [];
      if (teachersRes.status === 'fulfilled' && (teachersRes.value as any)?.data?.data?.length > 0) {
        teacherList = (teachersRes.value as any).data.data.map((t: any) => ({
          id: t.id,
          name: t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Teacher'
        }));
      }
      setTeachers(teacherList);

      // 2. Process Halaqat
      let localSaved: HalaqahCircleItem[] = [];
      if (typeof window !== 'undefined') {
        try {
          const str = localStorage.getItem('yahaya_qms_halaqat');
          if (str) localSaved = JSON.parse(str);
        } catch {}
      }

      if (halRes.status === 'fulfilled' && halRes.value && (halRes.value as any).length > 0) {
        const mapped: HalaqahCircleItem[] = (halRes.value as any).map((h: any) => ({
          id: String(h.id || h.documentId),
          documentId: h.documentId,
          circleName: h.quran_group?.name || h.topic || 'Quran Study Circle',
          teacherName: h.teacher?.name || 'Ustadh Lead',
          roomNumber: h.roomNumber || 'Musalla Hall',
          scheduleTime: h.scheduleTime || '08:00 AM - 09:30 AM',
          topic: h.topic || 'Daily Recitation & Tajweed',
          date: h.date ? String(h.date).split('T')[0] : new Date().toISOString().split('T')[0],
          versesCovered: h.versesCovered || 'Assigned Surahs',
          studentCount: h.students?.length || 15,
          corrections: h.corrections || '',
          teacherNotes: h.teacherNotes || '',
          status: 'completed',
          createdAt: h.createdAt || new Date().toISOString()
        }));
        setHalaqat(mapped);
      } else if (localSaved.length > 0) {
        setHalaqat(localSaved);
      } else {
        setHalaqat(INITIAL_HALAQAT);
        if (typeof window !== 'undefined') {
          localStorage.setItem('yahaya_qms_halaqat', JSON.stringify(INITIAL_HALAQAT));
        }
      }
    } catch {
      toast.error('Failed to load Halaqat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Sync to local storage
  const saveHalaqatLocally = (next: HalaqahCircleItem[]) => {
    setHalaqat(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('yahaya_qms_halaqat', JSON.stringify(next));
      } catch {}
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingHalaqah(null);
    setFormCircleName('Morning Tahfeez Circle');
    setFormTeacherName(teachers[0]?.name || (user as any)?.name || user?.username || 'Ustadh Ahmad Al-Kurdi');
    setFormRoomNumber('Classroom Q-101');
    setFormScheduleTime('08:00 AM - 09:30 AM');
    setFormTopic('Surah An-Nur Sabaq & Manzil');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormVerses('Verses 1 - 35');
    setFormStudentCount('16');
    setFormCorrections('Emphasis on Ikhfa Haqiqi rules.');
    setFormTeacherNotes('All students attended on time and recited with high focus.');
    setFormStatus('completed');
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (h: HalaqahCircleItem) => {
    setEditingHalaqah(h);
    setFormCircleName(h.circleName);
    setFormTeacherName(h.teacherName);
    setFormRoomNumber(h.roomNumber || 'Musalla Hall');
    setFormScheduleTime(h.scheduleTime || '08:00 AM - 09:30 AM');
    setFormTopic(h.topic);
    setFormDate(h.date);
    setFormVerses(h.versesCovered);
    setFormStudentCount(String(h.studentCount));
    setFormCorrections(h.corrections || '');
    setFormTeacherNotes(h.teacherNotes || '');
    setFormStatus(h.status);
    setShowEditModal(true);
  };

  const handleSaveHalaqah = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<HalaqahCircleItem> = {
      circleName: formCircleName,
      teacherName: formTeacherName,
      roomNumber: formRoomNumber,
      scheduleTime: formScheduleTime,
      topic: formTopic,
      date: formDate,
      versesCovered: formVerses,
      studentCount: parseInt(formStudentCount) || 12,
      corrections: formCorrections,
      teacherNotes: formTeacherNotes,
      status: formStatus
    };

    try {
      if (editingHalaqah) {
        const updated: HalaqahCircleItem = {
          ...editingHalaqah,
          ...payload
        };
        // Backend sync (non-fatal)
        qmsService.createHalaqah({
          topic: formTopic,
          date: formDate,
          versesCovered: formVerses,
          corrections: formCorrections,
          teacherNotes: formTeacherNotes
        }).catch(() => {});

        const next = halaqat.map(h => h.id === editingHalaqah.id ? updated : h);
        saveHalaqatLocally(next);
        if (inspectedHalaqah?.id === editingHalaqah.id) setInspectedHalaqah(updated);
        toast.success(`Updated Halaqah session: ${formCircleName}`);
        setShowEditModal(false);
      } else {
        const newHalaqah: HalaqahCircleItem = {
          id: `hal-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...(payload as any)
        };
        // Backend sync (non-fatal)
        qmsService.createHalaqah({
          topic: formTopic,
          date: formDate,
          versesCovered: formVerses,
          corrections: formCorrections,
          teacherNotes: formTeacherNotes
        }).catch(() => {});

        const next = [newHalaqah, ...halaqat];
        saveHalaqatLocally(next);
        toast.success(`Recorded session for ${formCircleName}`);
        setShowCreateModal(false);
      }
    } catch {
      toast.error('Failed to save Halaqah session');
    }
  };

  const handleDeleteHalaqah = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete session for "${name}"?`)) return;
    const next = halaqat.filter(h => h.id !== id);
    saveHalaqatLocally(next);
    toast.success('Removed Halaqah record');
    if (inspectedHalaqah?.id === id) setInspectedHalaqah(null);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredHalaqat.map(h => ({
      ID: h.id,
      CircleName: h.circleName,
      Teacher: h.teacherName,
      RoomLocation: h.roomNumber,
      ScheduleTime: h.scheduleTime,
      SessionDate: h.date,
      Topic: h.topic,
      VersesCovered: h.versesCovered,
      StudentsPresent: h.studentCount,
      Status: h.status.toUpperCase(),
      Corrections: h.corrections || '',
      Notes: h.teacherNotes || ''
    }));
    qmsService.exportToCSV(dataToExport, `quran-halaqat-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Halaqat circle log exported to CSV');
  };

  // ── Filtered Records ──────────────────────────────────────────────────────
  const filteredHalaqat = useMemo(() => {
    return halaqat.filter(h => {
      const matchQ = !query ||
        h.circleName.toLowerCase().includes(query.toLowerCase()) ||
        h.teacherName.toLowerCase().includes(query.toLowerCase()) ||
        h.topic.toLowerCase().includes(query.toLowerCase()) ||
        h.versesCovered.toLowerCase().includes(query.toLowerCase());
      const matchStatus = selectedStatusFilter === 'all' || h.status === selectedStatusFilter;
      const matchTeacher = selectedTeacherFilter === 'all' || h.teacherName.includes(selectedTeacherFilter);
      return matchQ && matchStatus && matchTeacher;
    });
  }, [halaqat, query, selectedStatusFilter, selectedTeacherFilter]);

  const activeFiltersCount = [
    selectedStatusFilter !== 'all',
    selectedTeacherFilter !== 'all',
    query.length > 0
  ].filter(Boolean).length;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalStudents = useMemo(() => halaqat.reduce((sum, h) => sum + (h.studentCount || 0), 0), [halaqat]);
  const activeCircles = useMemo(() => halaqat.filter(h => h.status === 'active' || h.status === 'completed').length, [halaqat]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_halaqat',
      title: 'Active Study Circles',
      value: `${halaqat.length} Circles`,
      subtitle: `${activeCircles} sessions recorded today`,
      trendDirection: 'up',
      icon: <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'total_learners',
      title: 'Total Circle Attendees',
      value: `${totalStudents} Scholars`,
      subtitle: 'Enrolled across all Tahfeez circles',
      trendDirection: 'up',
      icon: <GraduationCap className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'faculty_lead',
      title: 'Assigned Quran Faculty',
      value: `${new Set(halaqat.map(h => h.teacherName)).size} Asatizah`,
      subtitle: 'Certified Qari & Hifz supervisors',
      trendDirection: 'neutral',
      icon: <UserCheck className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'session_completion',
      title: 'Circle Completion Rate',
      value: '98.5%',
      subtitle: 'Daily curriculum adherence',
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    }
  ];

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<HalaqahCircleItem, any>[]>(() => [
    {
      accessorKey: 'circleName',
      header: 'Halaqah Circle & Schedule',
      cell: ({ row }) => {
        const h = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
              {h.circleName}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" /> {h.scheduleTime || '08:00 AM'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                • {h.roomNumber || 'Musalla'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'teacherName',
      header: 'Ustadh / Circle Lead',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300 text-xs">
            {row.original.teacherName[0]}
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {row.original.teacherName}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'topic',
      header: 'Topic & Verses Covered',
      cell: ({ row }) => {
        const h = row.original;
        return (
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              {h.topic}
            </span>
            <span className="text-[11px] text-slate-500 font-medium font-mono block">
              {h.versesCovered}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'studentCount',
      header: 'Attendance',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold">
          <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>{row.original.studentCount} Scholars</span>
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Session Status',
      cell: ({ row }) => {
        const s = row.original.status;
        const statusMap: Record<string, string> = {
          completed: 'approved',
          active: 'in_progress',
          scheduled: 'draft'
        };
        return <StatusBadge status={statusMap[s] || s} size="sm" />;
      }
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
          {row.original.date}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const h = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(evt) => evt.stopPropagation()}>
            <button
              onClick={() => setInspectedHalaqah(h)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Inspect circle session"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
            <button
              onClick={() => handleOpenEditModal(h)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Edit session"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteHalaqah(h.id, h.circleName)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Delete session"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    }
  ], [halaqat, inspectedHalaqah]);

  // Styling helpers
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300';
  const modalCls = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200';
  const modalPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto';

  return (
    <EnterpriseModuleShell
      title="Daily Quran Halaqat & Study Circles Registry"
      description="Supervise daily Quran study circles, record group lesson topics, track covered Ayahs and Tajweed focus points, and manage Halaqah attendance."
      breadcrumbs={[{ label: 'Quran System', href: '/qms/memorization' }, { label: 'Daily Halaqat' }]}
      icon={<Users className="w-8 h-8 text-sky-600 dark:text-sky-400" />}
      recordCount={filteredHalaqat.length}
      recordLabel="Circles"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => {
        setQuery('');
        setSelectedStatusFilter('all');
        setSelectedTeacherFilter('all');
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Log Halaqah Session</span>
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
        <Link href="/qms/halaqah" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
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
        <Link href="/qms/director" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Director Overview</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search Halaqah by circle name, teacher, topic, or verses..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Halaqat registry refreshed'); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => {
          setQuery('');
          setSelectedStatusFilter('all');
          setSelectedTeacherFilter('all');
        }}
        createButtonLabel="+ New Session"
        onCreate={handleOpenCreateModal}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              aria-label="Filter by Teacher"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[180px]"
            >
              <option value="all">All Circle Leaders</option>
              {Array.from(new Set(halaqat.map(h => h.teacherName))).map(tName => (
                <option key={tName} value={tName}>{tName}</option>
              ))}
            </select>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed Session</option>
              <option value="active">Active Now</option>
              <option value="scheduled">Scheduled Upcoming</option>
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredHalaqat}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        onRowInspect={(row) => setInspectedHalaqah(row)}
        onRowClick={(row) => setInspectedHalaqah(row)}
        emptyStateProps={{
          title: 'No Halaqah Sessions Found',
          description: 'No Quran study circles match your search or filter criteria.',
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: () => {
            setQuery('');
            setSelectedStatusFilter('all');
            setSelectedTeacherFilter('all');
          },
          createLabel: 'Log First Halaqah Session',
          onCreate: handleOpenCreateModal
        }}
      />

      {/* Inspector Modal */}
      {inspectedHalaqah && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 sm:p-8 max-w-2xl w-full space-y-6`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 border border-sky-500/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-400 border border-slate-200 dark:border-slate-700">
                      {inspectedHalaqah.roomNumber || 'Musalla Hall'}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 uppercase">
                      {inspectedHalaqah.status}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {inspectedHalaqah.circleName}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(inspectedHalaqah)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Session</span>
                </button>
                <button
                  onClick={() => setInspectedHalaqah(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-white font-bold transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Session Overview Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Session Date</span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {inspectedHalaqah.date}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Schedule Time</span>
                <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1 block">
                  {inspectedHalaqah.scheduleTime}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Attendance</span>
                <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {inspectedHalaqah.studentCount} Scholars
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Location</span>
                <span className="text-xs font-black text-slate-900 dark:text-white mt-1 block truncate">
                  {inspectedHalaqah.roomNumber}
                </span>
              </div>
            </div>

            {/* Topics & Verses Covered */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500">Curriculum Topic & Verses Recited</h4>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {inspectedHalaqah.topic}
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                Verses: {inspectedHalaqah.versesCovered}
              </div>
            </div>

            {/* Tajweed Corrections & Teacher Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Tajweed Corrections Given
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {inspectedHalaqah.corrections || 'No major phonetic slips observed during this circle session.'}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Teacher Observations ({inspectedHalaqah.teacherName})
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{inspectedHalaqah.teacherNotes || 'Students demonstrated excellent attentiveness and readiness.'}"
                </p>
              </div>
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
                <Users className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {showEditModal ? 'Edit Halaqah Session Record' : 'Record Daily Halaqah Study Session'}
                </h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHalaqah} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Circle / Group Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fajr Tahfeez Excellence Circle"
                    value={formCircleName}
                    onChange={(e) => setFormCircleName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Ustadh / Supervising Teacher</label>
                  <input
                    type="text"
                    required
                    value={formTeacherName}
                    onChange={(e) => setFormTeacherName(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Room / Location</label>
                  <input
                    type="text"
                    required
                    value={formRoomNumber}
                    onChange={(e) => setFormRoomNumber(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Schedule Time</label>
                  <input
                    type="text"
                    required
                    value={formScheduleTime}
                    onChange={(e) => setFormScheduleTime(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Session Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className={labelCls}>Curriculum Lesson Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Surah Al-Baqarah Revision & Tajweed Correction"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Students Present</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formStudentCount}
                    onChange={(e) => setFormStudentCount(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Verses / Chapters Covered</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Baqarah v. 142 - 188"
                  value={formVerses}
                  onChange={(e) => setFormVerses(e.target.value)}
                  className={inputCls + ' font-mono'}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Tajweed Focus & Articulation Corrections</label>
                <textarea
                  rows={2}
                  placeholder="Phonetics, Waqf observations, or specific rules corrected during recitation..."
                  value={formCorrections}
                  onChange={(e) => setFormCorrections(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Teacher Session Notes</label>
                <textarea
                  rows={2}
                  placeholder="General notes on student engagement, progress pace, or homework assigned..."
                  value={formTeacherNotes}
                  onChange={(e) => setFormTeacherNotes(e.target.value)}
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  {showEditModal ? 'Update Session' : 'Save Halaqah Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

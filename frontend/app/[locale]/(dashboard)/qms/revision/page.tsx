/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  BookOpen, Plus, Search, RefreshCw, Calendar, Download,
  CheckCircle2, AlertCircle, Award, ShieldCheck, Filter,
  Clock, Eye, Trash2, Edit2, X, Check, ArrowRight,
  TrendingUp, Star, RotateCcw, AlertTriangle, Layers,
  GraduationCap, Users, UserCheck
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
  section?: string;
}

interface MurajaahItem {
  id: string;
  documentId?: string;
  studentId: string;
  studentName: string;
  studentAdmission?: string;
  portionType: 'sabqi' | 'manzil' | 'juz_revision' | 'quarter_juz';
  surahName: string;
  startAyah?: number;
  endAyah?: number;
  juzNumber?: number;
  dueDate: string;
  completionDate?: string;
  status: 'completed' | 'pending' | 'needs_repeat' | 'in_progress';
  retentionScore: number; // 0 - 100
  mistakesCount: number;
  hesitationCount: number;
  teacherNotes?: string;
  evaluatedBy?: string;
  createdAt: string;
}

const INITIAL_MURAJAAHS: MurajaahItem[] = [
  {
    id: 'mur-001',
    studentId: '101',
    studentName: 'Zayd ibn Thabit',
    studentAdmission: 'YAH-2026-001',
    portionType: 'manzil',
    surahName: 'Al-Baqarah',
    startAyah: 1,
    endAyah: 141,
    juzNumber: 1,
    dueDate: '2026-10-07',
    completionDate: '2026-10-07',
    status: 'completed',
    retentionScore: 96,
    mistakesCount: 0,
    hesitationCount: 2,
    teacherNotes: 'Flawless recitation with excellent Waqf and Ibtida.',
    evaluatedBy: 'Ustadh Ahmad Al-Kurdi',
    createdAt: '2026-10-07T08:30:00Z'
  },
  {
    id: 'mur-002',
    studentId: '102',
    studentName: 'Abdullah ibn Masood',
    studentAdmission: 'YAH-2026-002',
    portionType: 'sabqi',
    surahName: "Ali 'Imran",
    startAyah: 1,
    endAyah: 60,
    juzNumber: 3,
    dueDate: '2026-10-07',
    completionDate: '2026-10-07',
    status: 'completed',
    retentionScore: 92,
    mistakesCount: 1,
    hesitationCount: 3,
    teacherNotes: 'Minor slip on ayah 45, corrected spontaneously. Great tone.',
    evaluatedBy: 'Ustadh Bilal Mansoor',
    createdAt: '2026-10-07T09:15:00Z'
  },
  {
    id: 'mur-003',
    studentId: '103',
    studentName: 'Ubayy ibn Kaab',
    studentAdmission: 'YAH-2026-003',
    portionType: 'juz_revision',
    surahName: 'An-Nisa',
    startAyah: 1,
    endAyah: 176,
    juzNumber: 4,
    dueDate: '2026-10-08',
    status: 'pending',
    retentionScore: 0,
    mistakesCount: 0,
    hesitationCount: 0,
    teacherNotes: 'Assigned full Juz 4 for weekly cumulative revision.',
    evaluatedBy: 'Ustadh Ahmad Al-Kurdi',
    createdAt: '2026-10-06T14:00:00Z'
  },
  {
    id: 'mur-004',
    studentId: '104',
    studentName: 'Fatimah Az-Zahra',
    studentAdmission: 'YAH-2026-004',
    portionType: 'manzil',
    surahName: 'Yasin & As-Saffat',
    startAyah: 1,
    endAyah: 83,
    juzNumber: 23,
    dueDate: '2026-10-07',
    completionDate: '2026-10-07',
    status: 'completed',
    retentionScore: 98,
    mistakesCount: 0,
    hesitationCount: 1,
    teacherNotes: 'Mastery level performance. Ready for advanced Tajweed exam.',
    evaluatedBy: 'Ustadha Maryam Al-Ghamdi',
    createdAt: '2026-10-07T10:00:00Z'
  },
  {
    id: 'mur-005',
    studentId: '105',
    studentName: 'Aisha Siddiqah',
    studentAdmission: 'YAH-2026-005',
    portionType: 'sabqi',
    surahName: 'Al-Kahf',
    startAyah: 1,
    endAyah: 50,
    juzNumber: 15,
    dueDate: '2026-10-07',
    completionDate: '2026-10-07',
    status: 'needs_repeat',
    retentionScore: 68,
    mistakesCount: 4,
    hesitationCount: 6,
    teacherNotes: 'Needs more repetition on verses 25-40 before progressing.',
    evaluatedBy: 'Ustadha Maryam Al-Ghamdi',
    createdAt: '2026-10-07T10:45:00Z'
  }
];

export default function QuranRevisionPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user } = useAuth();

  const [records, setRecords] = useState<MurajaahItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & UI
  const [query, setQuery] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [inspectedRecord, setInspectedRecord] = useState<MurajaahItem | null>(null);
  const [editingRecord, setEditingRecord] = useState<MurajaahItem | null>(null);

  // Form State
  const [formStudentId, setFormStudentId] = useState('');
  const [formPortionType, setFormPortionType] = useState<'sabqi' | 'manzil' | 'juz_revision' | 'quarter_juz'>('manzil');
  const [formSurahName, setFormSurahName] = useState('');
  const [formStartAyah, setFormStartAyah] = useState('');
  const [formEndAyah, setFormEndAyah] = useState('');
  const [formJuzNumber, setFormJuzNumber] = useState('1');
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCompletionDate, setFormCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'completed' | 'pending' | 'needs_repeat' | 'in_progress'>('completed');
  const [formScore, setFormScore] = useState('95');
  const [formMistakes, setFormMistakes] = useState('0');
  const [formHesitations, setFormHesitations] = useState('0');
  const [formTeacherNotes, setFormTeacherNotes] = useState('');

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [murRes, studentsRes, enrollRes] = await Promise.allSettled([
        qmsService.getMurajaahRecords().catch(() => null),
        apiClient.get('/students?populate=*&pagination[limit]=300').catch(() => null),
        apiClient.get('/student-enrollments?populate[student]=true&pagination[limit]=300').catch(() => null)
      ]);

      // 1. Process Students
      let studentList: StudentItem[] = [];
      if (studentsRes.status === 'fulfilled' && (studentsRes.value as any)?.data?.data?.length > 0) {
        studentList = (studentsRes.value as any).data.data.map((s: any) => ({
          id: String(s.id),
          documentId: s.documentId,
          name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
          admissionNumber: s.admissionNumber || s.studentId || `STD-${s.id}`,
          section: s.section?.name || 'Quran Circle'
        }));
      } else if (enrollRes.status === 'fulfilled' && (enrollRes.value as any)?.data?.data?.length > 0) {
        studentList = (enrollRes.value as any).data.data.map((e: any) => {
          const s = e.student || {};
          return {
            id: String(s.id || e.id),
            documentId: s.documentId,
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Scholar',
            admissionNumber: s.admissionNumber || `STD-${s.id || e.id}`,
            section: e.academicSection?.name || 'Quran Section'
          };
        });
      }

      if (studentList.length === 0) {
        studentList = [
          { id: '101', name: 'Zayd ibn Thabit', admissionNumber: 'YAH-2026-001', section: 'Tahfeez A' },
          { id: '102', name: 'Abdullah ibn Masood', admissionNumber: 'YAH-2026-002', section: 'Tahfeez A' },
          { id: '103', name: 'Ubayy ibn Kaab', admissionNumber: 'YAH-2026-003', section: 'Tahfeez B' },
          { id: '104', name: 'Fatimah Az-Zahra', admissionNumber: 'YAH-2026-004', section: 'Hifz Girls 1' },
          { id: '105', name: 'Aisha Siddiqah', admissionNumber: 'YAH-2026-005', section: 'Hifz Girls 1' }
        ];
      }
      setStudents(studentList);

      // 2. Process Records
      let localSaved: MurajaahItem[] = [];
      if (typeof window !== 'undefined') {
        try {
          const str = localStorage.getItem('yahaya_qms_murajaahs');
          if (str) localSaved = JSON.parse(str);
        } catch {}
      }

      if (murRes.status === 'fulfilled' && murRes.value && (murRes.value as any).length > 0) {
        const mapped: MurajaahItem[] = (murRes.value as any).map((m: any) => ({
          id: String(m.id || m.documentId),
          documentId: m.documentId,
          studentId: String(m.student?.id || m.studentId || ''),
          studentName: m.student?.name || m.studentName || 'Scholar',
          studentAdmission: m.student?.admissionNumber || m.studentAdmission || '',
          portionType: m.portionType || 'manzil',
          surahName: m.surahName || m.assignedPortions || 'Assigned Portion',
          startAyah: m.startAyah,
          endAyah: m.endAyah,
          juzNumber: m.juzNumber || 1,
          dueDate: m.dueDate ? String(m.dueDate).split('T')[0] : new Date().toISOString().split('T')[0],
          completionDate: m.completionDate ? String(m.completionDate).split('T')[0] : undefined,
          status: m.status || (m.recordStatus === 'Completed' ? 'completed' : 'pending'),
          retentionScore: Number(m.revisionScore || m.retentionScore || 0),
          mistakesCount: Number(m.mistakesCount || 0),
          hesitationCount: Number(m.hesitationCount || 0),
          teacherNotes: m.teacherNotes || '',
          evaluatedBy: m.teacher?.name || m.evaluatedBy || 'Ustadh Lead',
          createdAt: m.createdAt || new Date().toISOString()
        }));
        setRecords(mapped);
      } else if (localSaved.length > 0) {
        setRecords(localSaved);
      } else {
        setRecords(INITIAL_MURAJAAHS);
        if (typeof window !== 'undefined') {
          localStorage.setItem('yahaya_qms_murajaahs', JSON.stringify(INITIAL_MURAJAAHS));
        }
      }
    } catch {
      toast.error('Failed to load Murajaah revision records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Sync to local storage on record change
  const saveRecordsLocally = (next: MurajaahItem[]) => {
    setRecords(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('yahaya_qms_murajaahs', JSON.stringify(next));
      } catch {}
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    setFormStudentId(students[0]?.id ? String(students[0].id) : '101');
    setFormPortionType('manzil');
    setFormSurahName('Al-Baqarah');
    setFormStartAyah('1');
    setFormEndAyah('141');
    setFormJuzNumber('1');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormCompletionDate(new Date().toISOString().split('T')[0]);
    setFormStatus('completed');
    setFormScore('95');
    setFormMistakes('0');
    setFormHesitations('1');
    setFormTeacherNotes('');
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (rec: MurajaahItem) => {
    setEditingRecord(rec);
    setFormStudentId(rec.studentId);
    setFormPortionType(rec.portionType);
    setFormSurahName(rec.surahName);
    setFormStartAyah(rec.startAyah ? String(rec.startAyah) : '');
    setFormEndAyah(rec.endAyah ? String(rec.endAyah) : '');
    setFormJuzNumber(String(rec.juzNumber || 1));
    setFormDueDate(rec.dueDate);
    setFormCompletionDate(rec.completionDate || rec.dueDate);
    setFormStatus(rec.status);
    setFormScore(String(rec.retentionScore));
    setFormMistakes(String(rec.mistakesCount));
    setFormHesitations(String(rec.hesitationCount));
    setFormTeacherNotes(rec.teacherNotes || '');
    setShowEditModal(true);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedStudent = students.find(s => String(s.id) === formStudentId);
    const studentName = matchedStudent ? matchedStudent.name : 'Quran Student';
    const studentAdmission = matchedStudent?.admissionNumber || '';

    const payload: Partial<MurajaahItem> = {
      studentId: formStudentId,
      studentName,
      studentAdmission,
      portionType: formPortionType,
      surahName: formSurahName,
      startAyah: formStartAyah ? parseInt(formStartAyah) : undefined,
      endAyah: formEndAyah ? parseInt(formEndAyah) : undefined,
      juzNumber: parseInt(formJuzNumber) || 1,
      dueDate: formDueDate,
      completionDate: formStatus === 'completed' ? formCompletionDate : undefined,
      status: formStatus,
      retentionScore: parseFloat(formScore) || 0,
      mistakesCount: parseInt(formMistakes) || 0,
      hesitationCount: parseInt(formHesitations) || 0,
      teacherNotes: formTeacherNotes,
      evaluatedBy: (user as any)?.name || user?.username || 'Ustadh Lead'
    };

    try {
      if (editingRecord) {
        const updated: MurajaahItem = {
          ...editingRecord,
          ...payload
        };
        // Backend sync (non-fatal)
        qmsService.updateMurajaahRecord(editingRecord.documentId || editingRecord.id, {
          assignedPortions: formSurahName,
          revisionScore: parseFloat(formScore) || 0,
          mistakesCount: parseInt(formMistakes) || 0,
          recordStatus: formStatus === 'completed' ? 'Completed' : 'Pending',
          dueDate: formDueDate,
          completionDate: formCompletionDate,
          teacherNotes: formTeacherNotes
        }).catch(() => {});

        const next = records.map(r => r.id === editingRecord.id ? updated : r);
        saveRecordsLocally(next);
        if (inspectedRecord?.id === editingRecord.id) setInspectedRecord(updated);
        toast.success(`Updated Murajaah evaluation for ${studentName}`);
        setShowEditModal(false);
      } else {
        const newRecord: MurajaahItem = {
          id: `mur-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...(payload as any)
        };
        // Backend sync (non-fatal)
        qmsService.createMurajaahRecord({
          student: formStudentId,
          assignedPortions: formSurahName,
          revisionScore: parseFloat(formScore) || 0,
          mistakesCount: parseInt(formMistakes) || 0,
          recordStatus: formStatus === 'completed' ? 'Completed' : 'Pending',
          dueDate: formDueDate,
          completionDate: formStatus === 'completed' ? formCompletionDate : undefined,
          teacherNotes: formTeacherNotes
        }).catch(() => {});

        const next = [newRecord, ...records];
        saveRecordsLocally(next);
        toast.success(`Logged Murajaah session for ${studentName} (${formScore}%)`);
        setShowCreateModal(false);
      }
    } catch {
      toast.error('Failed to save Murajaah record.');
    }
  };

  const handleDeleteRecord = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the revision record for "${name}"?`)) return;
    try {
      const rec = records.find(r => r.id === id);
      if (rec?.documentId || rec?.id) {
        qmsService.deleteMurajaahRecord(rec.documentId || rec.id).catch(() => {});
      }
      const next = records.filter(r => r.id !== id);
      saveRecordsLocally(next);
      toast.success('Removed revision record');
      if (inspectedRecord?.id === id) setInspectedRecord(null);
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const handleExportCSV = () => {
    const dataToExport = filteredRecords.map(r => ({
      ID: r.id,
      StudentName: r.studentName,
      AdmissionNumber: r.studentAdmission,
      PortionType: r.portionType.toUpperCase(),
      SurahOrPortion: r.surahName,
      Ayahs: r.startAyah ? `${r.startAyah}-${r.endAyah}` : 'Full',
      Juz: r.juzNumber,
      RetentionScore: `${r.retentionScore}%`,
      Mistakes: r.mistakesCount,
      Hesitations: r.hesitationCount,
      Status: r.status.toUpperCase(),
      DueDate: r.dueDate,
      CompletionDate: r.completionDate || 'Pending',
      EvaluatedBy: r.evaluatedBy,
      TeacherFeedback: r.teacherNotes || ''
    }));
    qmsService.exportToCSV(dataToExport, `quran-murajaah-records-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Murajaah revision registry exported to CSV');
  };

  // ── Filtered Records ──────────────────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchQ = !query ||
        r.studentName.toLowerCase().includes(query.toLowerCase()) ||
        r.surahName.toLowerCase().includes(query.toLowerCase()) ||
        (r.studentAdmission && r.studentAdmission.toLowerCase().includes(query.toLowerCase())) ||
        (r.teacherNotes && r.teacherNotes.toLowerCase().includes(query.toLowerCase()));
      const matchStudent = selectedStudentFilter === 'all' || r.studentId === selectedStudentFilter || r.studentName.includes(selectedStudentFilter);
      const matchType = selectedTypeFilter === 'all' || r.portionType === selectedTypeFilter;
      const matchStatus = selectedStatusFilter === 'all' || r.status === selectedStatusFilter;
      return matchQ && matchStudent && matchType && matchStatus;
    });
  }, [records, query, selectedStudentFilter, selectedTypeFilter, selectedStatusFilter]);

  const activeFiltersCount = [
    selectedStudentFilter !== 'all',
    selectedTypeFilter !== 'all',
    selectedStatusFilter !== 'all',
    query.length > 0
  ].filter(Boolean).length;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalCompleted = useMemo(() => records.filter(r => r.status === 'completed').length, [records]);
  const totalPending = useMemo(() => records.filter(r => r.status === 'pending' || r.status === 'in_progress').length, [records]);
  const totalNeedsRepeat = useMemo(() => records.filter(r => r.status === 'needs_repeat').length, [records]);
  const avgRetention = useMemo(() => {
    const scored = records.filter(r => r.status === 'completed' && r.retentionScore > 0);
    if (scored.length === 0) return 0;
    return scored.reduce((acc, r) => acc + r.retentionScore, 0) / scored.length;
  }, [records]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_completed',
      title: 'Completed Murajaah Cycles',
      value: `${totalCompleted} Revisions`,
      subtitle: `${((totalCompleted / Math.max(records.length, 1)) * 100).toFixed(0)}% cycle completion rate`,
      trendDirection: 'up',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'avg_retention',
      title: 'Average Retention Score',
      value: `${avgRetention.toFixed(1)}%`,
      subtitle: 'Target standard: ≥ 90% retention',
      trendDirection: avgRetention >= 90 ? 'up' : 'neutral',
      icon: <Award className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'pending_cycles',
      title: 'Pending Due Revisions',
      value: `${totalPending} Queued`,
      subtitle: 'Portions due for recitation today',
      trendDirection: 'neutral',
      icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    },
    {
      id: 'repeat_watchlist',
      title: 'Repeat & Fortification Flag',
      value: `${totalNeedsRepeat} Flagged`,
      subtitle: 'Retention < 80% requiring re-testing',
      trendDirection: totalNeedsRepeat > 0 ? 'down' : 'up',
      icon: <RotateCcw className="w-5 h-5 text-rose-600 dark:text-rose-400" />
    }
  ];

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<MurajaahItem, any>[]>(() => [
    {
      accessorKey: 'studentName',
      header: 'Quran Student & Circle',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
              {r.studentName}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {r.studentAdmission && (
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {r.studentAdmission}
                </span>
              )}
              <span className="text-[11px] text-slate-500 font-medium">
                Juz {r.juzNumber}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'portionType',
      header: 'Revision Portion & Surah',
      cell: ({ row }) => {
        const r = row.original;
        const typeLabels: Record<string, { label: string; color: string }> = {
          sabqi: { label: 'Sabqi (Recent Hifz)', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
          manzil: { label: 'Manzil (Old Hifz)', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
          juz_revision: { label: 'Full Juz Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
          quarter_juz: { label: 'Rub / Quarter Juz', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' }
        };
        const meta = typeLabels[r.portionType] || { label: r.portionType, color: 'bg-slate-100 text-slate-700' };
        return (
          <div className="space-y-1">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${meta.color}`}>
              {meta.label}
            </span>
            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
              {r.surahName} {r.startAyah && r.endAyah ? `(v. ${r.startAyah} - ${r.endAyah})` : ''}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'retentionScore',
      header: 'Retention & Accuracy',
      cell: ({ row }) => {
        const r = row.original;
        if (r.status === 'pending') {
          return (
            <span className="text-xs text-slate-400 italic">Recitation Pending</span>
          );
        }
        const score = r.retentionScore;
        const scoreColor = score >= 90
          ? 'text-emerald-700 dark:text-emerald-400'
          : score >= 75
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-rose-600 dark:text-rose-400';
        return (
          <div className="space-y-1 min-w-[130px]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={`font-black text-sm ${scoreColor}`}>{score}%</span>
              <span className="text-[10px] text-slate-500 font-medium">
                {r.mistakesCount} mistakes • {r.hesitationCount} pauses
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
              <div
                className={`h-full rounded-full transition-all ${
                  score >= 90 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                  score >= 75 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                  'bg-gradient-to-r from-rose-600 to-rose-400'
                }`}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Evaluation Status',
      cell: ({ row }) => {
        const s = row.original.status;
        const statusMap: Record<string, string> = {
          completed: 'approved',
          pending: 'draft',
          needs_repeat: 'rejected',
          in_progress: 'submitted'
        };
        return <StatusBadge status={statusMap[s] || s} size="sm" />;
      }
    },
    {
      accessorKey: 'dueDate',
      header: 'Due / Completion Date',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="text-xs space-y-0.5">
            <span className="text-slate-900 dark:text-white font-medium block">
              Due: {r.dueDate}
            </span>
            {r.completionDate && (
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1">
                <Check className="w-3 h-3" /> Done: {r.completionDate}
              </span>
            )}
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setInspectedRecord(r)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Inspect revision details"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
            <button
              onClick={() => handleOpenEditModal(r)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Edit Murajaah entry"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteRecord(r.id, r.studentName)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Delete revision record"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    }
  ], [records, inspectedRecord]);

  // Styling helpers
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300';
  const modalCls = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200';
  const modalPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto';

  return (
    <EnterpriseModuleShell
      title="Quran Revision & Murajaah Tracking Portal"
      description="Schedule, record, and evaluate daily student revision cycles (Sabaq, Sabqi, and Manzil) to ensure permanent Hifz retention and accuracy."
      breadcrumbs={[{ label: 'Quran System', href: '/qms/memorization' }, { label: 'Revision (Murajaah)' }]}
      icon={<RotateCcw className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={filteredRecords.length}
      recordLabel="Revision Cycles"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => {
        setQuery('');
        setSelectedStudentFilter('all');
        setSelectedTypeFilter('all');
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Log Revision Session</span>
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
        <Link href="/qms/revision" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
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
        <Link href="/qms/director" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Director Overview</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search revisions by student, Surah, or notes..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Murajaah records refreshed'); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => {
          setQuery('');
          setSelectedStudentFilter('all');
          setSelectedTypeFilter('all');
          setSelectedStatusFilter('all');
        }}
        createButtonLabel="+ Log Revision"
        onCreate={handleOpenCreateModal}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              aria-label="Filter by Student"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[180px]"
            >
              <option value="all">All Students ({students.length})</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              aria-label="Filter by Portion Type"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Revision Types</option>
              <option value="sabqi">Sabqi (Recent Hifz)</option>
              <option value="manzil">Manzil (Old Hifz)</option>
              <option value="juz_revision">Full Juz Review</option>
              <option value="quarter_juz">Quarter Juz (Rub)</option>
            </select>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed (Tested)</option>
              <option value="pending">Pending Recitation</option>
              <option value="needs_repeat">Needs Repeat / Fortification</option>
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredRecords}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        onRowInspect={(row) => setInspectedRecord(row)}
        onRowClick={(row) => setInspectedRecord(row)}
        emptyStateProps={{
          title: 'No Murajaah Revision Records Found',
          description: 'No student revision sessions match your current filter settings.',
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: () => {
            setQuery('');
            setSelectedStudentFilter('all');
            setSelectedTypeFilter('all');
            setSelectedStatusFilter('all');
          },
          createLabel: 'Log First Revision Session',
          onCreate: handleOpenCreateModal
        }}
      />

      {/* Inspector Modal */}
      {inspectedRecord && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 sm:p-8 max-w-2xl w-full space-y-6`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                      Juz {inspectedRecord.juzNumber}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      {inspectedRecord.portionType.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {inspectedRecord.studentName}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(inspectedRecord)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Evaluation</span>
                </button>
                <button
                  onClick={() => setInspectedRecord(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-white font-bold transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Performance Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Retention Score</span>
                <span className={`text-xl font-black font-mono mt-1 block ${
                  inspectedRecord.retentionScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                  inspectedRecord.retentionScore >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {inspectedRecord.retentionScore}%
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Lafzi Mistakes</span>
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {inspectedRecord.mistakesCount}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Hesitations (Tawaqquf)</span>
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {inspectedRecord.hesitationCount}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Evaluation Status</span>
                <span className="text-sm font-black mt-2 block text-emerald-700 dark:text-emerald-400 uppercase">
                  {inspectedRecord.status}
                </span>
              </div>
            </div>

            {/* Recitation Content */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500">Recited Portion & Range</h4>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {inspectedRecord.surahName} {inspectedRecord.startAyah && inspectedRecord.endAyah ? `(Verses ${inspectedRecord.startAyah} through ${inspectedRecord.endAyah})` : ''}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Assigned Due Date: {inspectedRecord.dueDate} • Completed: {inspectedRecord.completionDate || 'Pending Recitation'}
              </div>
            </div>

            {/* Teacher Feedback */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Teacher / Ustadh Assessment Notes ({inspectedRecord.evaluatedBy || 'Ustadh Lead'})
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                "{inspectedRecord.teacherNotes || 'Student demonstrated satisfactory memorization retention for the assigned portion without significant hesitation.'}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create / Log Revision Modal */}
      {(showCreateModal || showEditModal) && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 max-w-xl w-full space-y-5`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {showEditModal ? 'Edit Murajaah Evaluation' : 'Log Daily Murajaah (Revision) Session'}
                </h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls + ' flex items-center gap-1.5'}>
                    <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Select Student
                  </label>
                  <select
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    required
                    className={selectCls}
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.admissionNumber || s.id})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Portion Classification</label>
                  <select
                    value={formPortionType}
                    onChange={(e) => setFormPortionType(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="sabqi">Sabqi (Recent Memorization)</option>
                    <option value="manzil">Manzil (Old Cumulative Hifz)</option>
                    <option value="juz_revision">Full Juz Revision</option>
                    <option value="quarter_juz">Quarter Juz (Rub)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-1">
                  <label className={labelCls}>Surah / Portion Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al-Baqarah"
                    value={formSurahName}
                    onChange={(e) => setFormSurahName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Start Ayah</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={formStartAyah}
                    onChange={(e) => setFormStartAyah(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>End Ayah</label>
                  <input
                    type="number"
                    placeholder="141"
                    value={formEndAyah}
                    onChange={(e) => setFormEndAyah(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Juz Number (1-30)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={formJuzNumber}
                    onChange={(e) => setFormJuzNumber(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Retention Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formScore}
                    onChange={(e) => setFormScore(e.target.value)}
                    className={inputCls + ' font-mono font-bold text-emerald-700 dark:text-emerald-400'}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Evaluation Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="completed">Completed (Passed)</option>
                    <option value="pending">Pending Recitation</option>
                    <option value="needs_repeat">Needs Repeat (Weak)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Mistakes Count (Lafzi Errors)</label>
                  <input
                    type="number"
                    min="0"
                    value={formMistakes}
                    onChange={(e) => setFormMistakes(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Pauses / Hesitations (Tawaqquf)</label>
                  <input
                    type="number"
                    min="0"
                    value={formHesitations}
                    onChange={(e) => setFormHesitations(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Teacher Evaluation & Guidance Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes on Tajweed precision, fluency, or areas requiring focus..."
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
                  {showEditModal ? 'Update Evaluation' : 'Save Murajaah Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

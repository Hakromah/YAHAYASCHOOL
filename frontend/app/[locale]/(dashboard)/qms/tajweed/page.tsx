/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Award, Plus, Search, RefreshCw, Calendar, Download,
  CheckCircle2, AlertCircle, BookOpen, ShieldCheck, Filter,
  Clock, Eye, Trash2, Edit2, X, Check, ArrowRight,
  TrendingUp, Star, RotateCcw, Sparkles, BarChart2,
  GraduationCap, Users, UserCheck, Layers
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

interface TajweedEvaluationItem {
  id: string;
  documentId?: string;
  studentId: string;
  studentName: string;
  studentAdmission?: string;
  academicTerm?: string;
  evaluationDate: string;
  // 9 Core Rules (Scores 0 - 10)
  makharij: number;
  sifaat: number;
  ghunnah: number;
  madd: number;
  qalqalah: number;
  waqf: number;
  noonSaakin: number;
  meemSaakin: number;
  fluency: number;
  overallScore: number; // 0 - 100%
  masteryLevel: 'Distinction (Mumtaz)' | 'Very Good (Jayyid Jiddan)' | 'Good (Jayyid)' | 'Needs Practice (Maqbool)';
  ijazahReady: boolean;
  teacherComments?: string;
  evaluatedBy?: string;
  createdAt: string;
}

const INITIAL_EVALUATIONS: TajweedEvaluationItem[] = [
  {
    id: 'taj-001',
    studentId: '101',
    studentName: 'Zayd ibn Thabit',
    studentAdmission: 'YAH-2026-001',
    academicTerm: 'Term 1 (2026-2027)',
    evaluationDate: '2026-10-06',
    makharij: 10,
    sifaat: 9.5,
    ghunnah: 10,
    madd: 9.5,
    qalqalah: 10,
    waqf: 9.5,
    noonSaakin: 10,
    meemSaakin: 10,
    fluency: 9.5,
    overallScore: 97.2,
    masteryLevel: 'Distinction (Mumtaz)',
    ijazahReady: true,
    teacherComments: 'Mastery recitation following Hafs an Asim tariq Ash-Shatibiyyah. Cleared for Ijazah examination.',
    evaluatedBy: 'Ustadh Ahmad Al-Kurdi',
    createdAt: '2026-10-06T09:00:00Z'
  },
  {
    id: 'taj-002',
    studentId: '102',
    studentName: 'Abdullah ibn Masood',
    studentAdmission: 'YAH-2026-002',
    academicTerm: 'Term 1 (2026-2027)',
    evaluationDate: '2026-10-05',
    makharij: 9.0,
    sifaat: 9.0,
    ghunnah: 9.5,
    madd: 9.0,
    qalqalah: 9.0,
    waqf: 8.5,
    noonSaakin: 9.5,
    meemSaakin: 9.0,
    fluency: 9.0,
    overallScore: 90.5,
    masteryLevel: 'Distinction (Mumtaz)',
    ijazahReady: true,
    teacherComments: 'Melodious Tarteel with accurate elongation timings. Strong Ghunnah balance.',
    evaluatedBy: 'Ustadh Bilal Mansoor',
    createdAt: '2026-10-05T10:30:00Z'
  },
  {
    id: 'taj-003',
    studentId: '104',
    studentName: 'Fatimah Az-Zahra',
    studentAdmission: 'YAH-2026-004',
    academicTerm: 'Term 1 (2026-2027)',
    evaluationDate: '2026-10-04',
    makharij: 9.5,
    sifaat: 9.0,
    ghunnah: 10,
    madd: 9.0,
    qalqalah: 9.5,
    waqf: 9.0,
    noonSaakin: 9.5,
    meemSaakin: 9.5,
    fluency: 9.5,
    overallScore: 93.8,
    masteryLevel: 'Distinction (Mumtaz)',
    ijazahReady: true,
    teacherComments: 'Excellent throat and tongue letter distinction. Exceptional Waqf precision.',
    evaluatedBy: 'Ustadha Maryam Al-Ghamdi',
    createdAt: '2026-10-04T11:15:00Z'
  },
  {
    id: 'taj-004',
    studentId: '105',
    studentName: 'Aisha Siddiqah',
    studentAdmission: 'YAH-2026-005',
    academicTerm: 'Term 1 (2026-2027)',
    evaluationDate: '2026-10-03',
    makharij: 7.5,
    sifaat: 7.0,
    ghunnah: 8.5,
    madd: 8.0,
    qalqalah: 7.5,
    waqf: 7.0,
    noonSaakin: 8.0,
    meemSaakin: 8.0,
    fluency: 7.5,
    overallScore: 76.6,
    masteryLevel: 'Good (Jayyid)',
    ijazahReady: false,
    teacherComments: 'Focus required on Hams and Isti\'la (elevated letters) characteristics during recitation.',
    evaluatedBy: 'Ustadha Maryam Al-Ghamdi',
    createdAt: '2026-10-03T14:20:00Z'
  }
];

export default function TajweedEvaluationsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user } = useAuth();

  const [evaluations, setEvaluations] = useState<TajweedEvaluationItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & UI
  const [query, setQuery] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('all');
  const [selectedMasteryFilter, setSelectedMasteryFilter] = useState('all');
  const [selectedIjazahFilter, setSelectedIjazahFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [inspectedEval, setInspectedEval] = useState<TajweedEvaluationItem | null>(null);
  const [editingEval, setEditingEval] = useState<TajweedEvaluationItem | null>(null);

  // Form State (9 rules)
  const [formStudentId, setFormStudentId] = useState('');
  const [formTerm, setFormTerm] = useState('Term 1 (2026-2027)');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMakharij, setFormMakharij] = useState('9.0');
  const [formSifaat, setFormSifaat] = useState('9.0');
  const [formGhunnah, setFormGhunnah] = useState('9.5');
  const [formMadd, setFormMadd] = useState('9.0');
  const [formQalqalah, setFormQalqalah] = useState('9.0');
  const [formWaqf, setFormWaqf] = useState('9.0');
  const [formNoonSaakin, setFormNoonSaakin] = useState('9.5');
  const [formMeemSaakin, setFormMeemSaakin] = useState('9.0');
  const [formFluency, setFormFluency] = useState('9.0');
  const [formComments, setFormComments] = useState('');
  const [formIjazahReady, setFormIjazahReady] = useState(false);

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tajRes, studentsRes, enrollRes] = await Promise.allSettled([
        qmsService.getTajweedEvaluations().catch(() => null),
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
          section: s.section?.name || 'Quran Section'
        }));
      } else if (enrollRes.status === 'fulfilled' && (enrollRes.value as any)?.data?.data?.length > 0) {
        studentList = (enrollRes.value as any).data.data.map((e: any) => {
          const s = e.student || {};
          return {
            id: String(s.id || e.id),
            documentId: s.documentId,
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Scholar',
            admissionNumber: s.admissionNumber || `STD-${s.id || e.id}`,
            section: e.academicSection?.name || 'Quran Circle'
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

      // 2. Process Evaluations
      let localSaved: TajweedEvaluationItem[] = [];
      if (typeof window !== 'undefined') {
        try {
          const str = localStorage.getItem('yahaya_qms_tajweed_evaluations');
          if (str) localSaved = JSON.parse(str);
        } catch {}
      }

      if (tajRes.status === 'fulfilled' && tajRes.value && (tajRes.value as any).length > 0) {
        const mapped: TajweedEvaluationItem[] = (tajRes.value as any).map((ev: any) => {
          const makharij = Number(ev.makharij || 8);
          const sifaat = Number(ev.sifaat || 8);
          const ghunnah = Number(ev.ghunnah || 8);
          const madd = Number(ev.madd || 8);
          const qalqalah = Number(ev.qalqalah || 8);
          const waqf = Number(ev.waqf || 8);
          const noonSaakin = Number(ev.noonSaakin || 8);
          const meemSaakin = Number(ev.meemSaakin || 8);
          const fluency = Number(ev.fluency || 8);
          const totalRaw = makharij + sifaat + ghunnah + madd + qalqalah + waqf + noonSaakin + meemSaakin + fluency;
          const overall = Number(((totalRaw / 90) * 100).toFixed(1));

          let level: TajweedEvaluationItem['masteryLevel'] = 'Needs Practice (Maqbool)';
          if (overall >= 90) level = 'Distinction (Mumtaz)';
          else if (overall >= 80) level = 'Very Good (Jayyid Jiddan)';
          else if (overall >= 65) level = 'Good (Jayyid)';

          return {
            id: String(ev.id || ev.documentId),
            documentId: ev.documentId,
            studentId: String(ev.student?.id || ev.studentId || ''),
            studentName: ev.student?.name || ev.studentName || 'Scholar',
            studentAdmission: ev.student?.admissionNumber || ev.studentAdmission || '',
            academicTerm: ev.academicTerm || 'Term 1 (2026-2027)',
            evaluationDate: ev.evaluationDate ? String(ev.evaluationDate).split('T')[0] : new Date().toISOString().split('T')[0],
            makharij, sifaat, ghunnah, madd, qalqalah, waqf, noonSaakin, meemSaakin, fluency,
            overallScore: overall,
            masteryLevel: level,
            ijazahReady: overall >= 92,
            teacherComments: ev.teacherComments || '',
            evaluatedBy: ev.teacher?.name || ev.evaluatedBy || 'Ustadh Lead',
            createdAt: ev.createdAt || new Date().toISOString()
          };
        });
        setEvaluations(mapped);
      } else if (localSaved.length > 0) {
        setEvaluations(localSaved);
      } else {
        setEvaluations(INITIAL_EVALUATIONS);
        if (typeof window !== 'undefined') {
          localStorage.setItem('yahaya_qms_tajweed_evaluations', JSON.stringify(INITIAL_EVALUATIONS));
        }
      }
    } catch {
      toast.error('Failed to load Tajweed evaluations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Sync to local storage on record change
  const saveEvaluationsLocally = (next: TajweedEvaluationItem[]) => {
    setEvaluations(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('yahaya_qms_tajweed_evaluations', JSON.stringify(next));
      } catch {}
    }
  };

  // ── Calculation ───────────────────────────────────────────────────────────
  const computedOverall = useMemo(() => {
    const scores = [
      parseFloat(formMakharij) || 0,
      parseFloat(formSifaat) || 0,
      parseFloat(formGhunnah) || 0,
      parseFloat(formMadd) || 0,
      parseFloat(formQalqalah) || 0,
      parseFloat(formWaqf) || 0,
      parseFloat(formNoonSaakin) || 0,
      parseFloat(formMeemSaakin) || 0,
      parseFloat(formFluency) || 0
    ];
    const total = scores.reduce((a, b) => a + b, 0);
    return Number(((total / 90) * 100).toFixed(1));
  }, [formMakharij, formSifaat, formGhunnah, formMadd, formQalqalah, formWaqf, formNoonSaakin, formMeemSaakin, formFluency]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingEval(null);
    setFormStudentId(students[0]?.id ? String(students[0].id) : '101');
    setFormTerm('Term 1 (2026-2027)');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormMakharij('9.0');
    setFormSifaat('9.0');
    setFormGhunnah('9.5');
    setFormMadd('9.0');
    setFormQalqalah('9.0');
    setFormWaqf('9.0');
    setFormNoonSaakin('9.5');
    setFormMeemSaakin('9.0');
    setFormFluency('9.0');
    setFormComments('');
    setFormIjazahReady(true);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (ev: TajweedEvaluationItem) => {
    setEditingEval(ev);
    setFormStudentId(ev.studentId);
    setFormTerm(ev.academicTerm || 'Term 1 (2026-2027)');
    setFormDate(ev.evaluationDate);
    setFormMakharij(String(ev.makharij));
    setFormSifaat(String(ev.sifaat));
    setFormGhunnah(String(ev.ghunnah));
    setFormMadd(String(ev.madd));
    setFormQalqalah(String(ev.qalqalah));
    setFormWaqf(String(ev.waqf));
    setFormNoonSaakin(String(ev.noonSaakin));
    setFormMeemSaakin(String(ev.meemSaakin));
    setFormFluency(String(ev.fluency));
    setFormComments(ev.teacherComments || '');
    setFormIjazahReady(ev.ijazahReady);
    setShowEditModal(true);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedStudent = students.find(s => String(s.id) === formStudentId);
    const studentName = matchedStudent ? matchedStudent.name : 'Scholar';
    const studentAdmission = matchedStudent?.admissionNumber || '';

    const overall = computedOverall;
    let level: TajweedEvaluationItem['masteryLevel'] = 'Needs Practice (Maqbool)';
    if (overall >= 90) level = 'Distinction (Mumtaz)';
    else if (overall >= 80) level = 'Very Good (Jayyid Jiddan)';
    else if (overall >= 65) level = 'Good (Jayyid)';

    const payload: Partial<TajweedEvaluationItem> = {
      studentId: formStudentId,
      studentName,
      studentAdmission,
      academicTerm: formTerm,
      evaluationDate: formDate,
      makharij: parseFloat(formMakharij) || 0,
      sifaat: parseFloat(formSifaat) || 0,
      ghunnah: parseFloat(formGhunnah) || 0,
      madd: parseFloat(formMadd) || 0,
      qalqalah: parseFloat(formQalqalah) || 0,
      waqf: parseFloat(formWaqf) || 0,
      noonSaakin: parseFloat(formNoonSaakin) || 0,
      meemSaakin: parseFloat(formMeemSaakin) || 0,
      fluency: parseFloat(formFluency) || 0,
      overallScore: overall,
      masteryLevel: level,
      ijazahReady: overall >= 90 ? formIjazahReady : false,
      teacherComments: formComments,
      evaluatedBy: (user as any)?.name || user?.username || 'Ustadh Tajweed Examiner'
    };

    try {
      if (editingEval) {
        const updated: TajweedEvaluationItem = {
          ...editingEval,
          ...payload
        };
        // Backend sync (non-fatal)
        qmsService.createTajweedEvaluation({
          student: formStudentId,
          academicTerm: formTerm,
          evaluationDate: formDate,
          makharij: formMakharij,
          sifaat: formSifaat,
          ghunnah: formGhunnah,
          madd: formMadd,
          qalqalah: formQalqalah,
          waqf: formWaqf,
          noonSaakin: formNoonSaakin,
          meemSaakin: formMeemSaakin,
          fluency: formFluency,
          teacherComments: formComments
        }).catch(() => {});

        const next = evaluations.map(ev => ev.id === editingEval.id ? updated : ev);
        saveEvaluationsLocally(next);
        if (inspectedEval?.id === editingEval.id) setInspectedEval(updated);
        toast.success(`Updated Tajweed assessment for ${studentName} (${overall}%)`);
        setShowEditModal(false);
      } else {
        const newEval: TajweedEvaluationItem = {
          id: `taj-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...(payload as any)
        };
        // Backend sync (non-fatal)
        qmsService.createTajweedEvaluation({
          student: formStudentId,
          academicTerm: formTerm,
          evaluationDate: formDate,
          makharij: formMakharij,
          sifaat: formSifaat,
          ghunnah: formGhunnah,
          madd: formMadd,
          qalqalah: formQalqalah,
          waqf: formWaqf,
          noonSaakin: formNoonSaakin,
          meemSaakin: formMeemSaakin,
          fluency: formFluency,
          teacherComments: formComments
        }).catch(() => {});

        const next = [newEval, ...evaluations];
        saveEvaluationsLocally(next);
        toast.success(`Recorded Tajweed evaluation for ${studentName} (${overall}%)`);
        setShowCreateModal(false);
      }
    } catch {
      toast.error('Failed to save Tajweed evaluation');
    }
  };

  const handleDeleteEvaluation = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete Tajweed evaluation for "${name}"?`)) return;
    const next = evaluations.filter(ev => ev.id !== id);
    saveEvaluationsLocally(next);
    toast.success('Removed evaluation record');
    if (inspectedEval?.id === id) setInspectedEval(null);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredEvaluations.map(e => ({
      ID: e.id,
      StudentName: e.studentName,
      AdmissionNumber: e.studentAdmission,
      AcademicTerm: e.academicTerm,
      EvaluationDate: e.evaluationDate,
      Makharij_10: e.makharij,
      Sifaat_10: e.sifaat,
      Ghunnah_10: e.ghunnah,
      Madd_10: e.madd,
      Qalqalah_10: e.qalqalah,
      Waqf_10: e.waqf,
      NoonSaakin_10: e.noonSaakin,
      MeemSaakin_10: e.meemSaakin,
      Fluency_10: e.fluency,
      OverallPercentage: `${e.overallScore}%`,
      MasteryLevel: e.masteryLevel,
      IjazahReady: e.ijazahReady ? 'YES' : 'NO',
      Examiner: e.evaluatedBy,
      Feedback: e.teacherComments || ''
    }));
    qmsService.exportToCSV(dataToExport, `tajweed-evaluations-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Tajweed assessment matrix exported');
  };

  // ── Filtered Evaluations ──────────────────────────────────────────────────
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(e => {
      const matchQ = !query ||
        e.studentName.toLowerCase().includes(query.toLowerCase()) ||
        (e.studentAdmission && e.studentAdmission.toLowerCase().includes(query.toLowerCase())) ||
        (e.teacherComments && e.teacherComments.toLowerCase().includes(query.toLowerCase()));
      const matchStudent = selectedStudentFilter === 'all' || e.studentId === selectedStudentFilter || e.studentName.includes(selectedStudentFilter);
      const matchMastery = selectedMasteryFilter === 'all' || e.masteryLevel === selectedMasteryFilter;
      const matchIjazah = selectedIjazahFilter === 'all' || (selectedIjazahFilter === 'ready' ? e.ijazahReady : !e.ijazahReady);
      return matchQ && matchStudent && matchMastery && matchIjazah;
    });
  }, [evaluations, query, selectedStudentFilter, selectedMasteryFilter, selectedIjazahFilter]);

  const activeFiltersCount = [
    selectedStudentFilter !== 'all',
    selectedMasteryFilter !== 'all',
    selectedIjazahFilter !== 'all',
    query.length > 0
  ].filter(Boolean).length;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalMumtaz = useMemo(() => evaluations.filter(e => e.overallScore >= 90).length, [evaluations]);
  const totalIjazahReady = useMemo(() => evaluations.filter(e => e.ijazahReady).length, [evaluations]);
  const avgTajweed = useMemo(() => {
    if (evaluations.length === 0) return 0;
    return evaluations.reduce((acc, e) => acc + e.overallScore, 0) / evaluations.length;
  }, [evaluations]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_evaluations',
      title: 'Certified Tajweed Evaluations',
      value: `${evaluations.length} Audits`,
      subtitle: `${students.length} active students in circle`,
      trendDirection: 'up',
      icon: <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'avg_mastery',
      title: 'Campus Tajweed Index',
      value: `${avgTajweed.toFixed(1)}%`,
      subtitle: 'Average across all 9 pronunciation rules',
      trendDirection: avgTajweed >= 85 ? 'up' : 'neutral',
      icon: <BarChart2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'mumtaz_count',
      title: 'Distinction (Mumtaz ≥90%)',
      value: `${totalMumtaz} Scholars`,
      subtitle: `${((totalMumtaz / Math.max(evaluations.length, 1)) * 100).toFixed(0)}% at mastery level`,
      trendDirection: 'up',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'ijazah_clearance',
      title: 'Ijazah Exam Ready',
      value: `${totalIjazahReady} Cleared`,
      subtitle: 'Qualified for formal Sanad audition',
      trendDirection: 'up',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    }
  ];

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<TajweedEvaluationItem, any>[]>(() => [
    {
      accessorKey: 'studentName',
      header: 'Quran Student & Term',
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
              {e.studentName}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {e.studentAdmission && (
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {e.studentAdmission}
                </span>
              )}
              <span className="text-[11px] text-slate-500">
                {e.academicTerm || 'Term 1'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'overallScore',
      header: 'Overall Pronunciation & Rules',
      cell: ({ row }) => {
        const e = row.original;
        const score = e.overallScore;
        const scoreColor = score >= 90
          ? 'text-emerald-700 dark:text-emerald-400'
          : score >= 80
          ? 'text-sky-600 dark:text-sky-400'
          : score >= 65
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-rose-600 dark:text-rose-400';
        return (
          <div className="space-y-1 min-w-[130px]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={`font-black text-sm ${scoreColor}`}>{score}%</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">
                {e.masteryLevel.split(' ')[0]}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
              <div
                className={`h-full rounded-full transition-all ${
                  score >= 90 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                  score >= 80 ? 'bg-gradient-to-r from-sky-500 to-sky-400' :
                  score >= 65 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
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
      accessorKey: 'makharij',
      header: 'Core Competency Radar (0-10)',
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700" title="Makharij">
              Makharij: <strong>{e.makharij}</strong>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700" title="Sifaat">
              Sifaat: <strong>{e.sifaat}</strong>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700" title="Ghunnah">
              Ghunnah: <strong>{e.ghunnah}</strong>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700" title="Madd">
              Madd: <strong>{e.madd}</strong>
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'ijazahReady',
      header: 'Sanad / Ijazah Track',
      cell: ({ row }) => {
        const ready = row.original.ijazahReady;
        return ready ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Ijazah Cleared</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium text-xs">
            <span>In Training</span>
          </span>
        );
      }
    },
    {
      accessorKey: 'evaluationDate',
      header: 'Evaluation Date',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
          {row.original.evaluationDate}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(evt) => evt.stopPropagation()}>
            <button
              onClick={() => setInspectedEval(e)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Inspect Tajweed matrix"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
            <button
              onClick={() => handleOpenEditModal(e)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Edit assessment"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteEvaluation(e.id, e.studentName)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Delete evaluation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    }
  ], [evaluations, inspectedEval]);

  // Styling helpers
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300';
  const modalCls = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200';
  const modalPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto';

  return (
    <EnterpriseModuleShell
      title="Quran Tajweed Assessment & Articulation Mastery Matrix"
      description="Evaluate and certify students across the 9 classical Tajweed competency domains: Makharij, Sifaat, Ghunnah, Madd, Qalqalah, Waqf, and Ahkam."
      breadcrumbs={[{ label: 'Quran System', href: '/qms/memorization' }, { label: 'Tajweed Evaluations' }]}
      icon={<Award className="w-8 h-8 text-amber-500" />}
      recordCount={filteredEvaluations.length}
      recordLabel="Evaluations"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => {
        setQuery('');
        setSelectedStudentFilter('all');
        setSelectedMasteryFilter('all');
        setSelectedIjazahFilter('all');
      }}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Matrix</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ New Tajweed Audit</span>
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
        <Link href="/qms/tajweed" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" />
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
        searchPlaceholder="Search Tajweed audits by student name or teacher comments..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Tajweed matrix refreshed'); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => {
          setQuery('');
          setSelectedStudentFilter('all');
          setSelectedMasteryFilter('all');
          setSelectedIjazahFilter('all');
        }}
        createButtonLabel="+ Audit Tajweed"
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
              value={selectedMasteryFilter}
              onChange={(e) => setSelectedMasteryFilter(e.target.value)}
              aria-label="Filter by Mastery Level"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Mastery Levels</option>
              <option value="Distinction (Mumtaz)">Distinction (Mumtaz ≥90%)</option>
              <option value="Very Good (Jayyid Jiddan)">Very Good (80% - 89%)</option>
              <option value="Good (Jayyid)">Good (65% - 79%)</option>
              <option value="Needs Practice (Maqbool)">Needs Practice (&lt; 65%)</option>
            </select>
            <select
              value={selectedIjazahFilter}
              onChange={(e) => setSelectedIjazahFilter(e.target.value)}
              aria-label="Filter by Ijazah Clearance"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Clearance Tracks</option>
              <option value="ready">Ijazah Exam Ready</option>
              <option value="training">In Training Stage</option>
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredEvaluations}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        onRowInspect={(row) => setInspectedEval(row)}
        onRowClick={(row) => setInspectedEval(row)}
        emptyStateProps={{
          title: 'No Tajweed Evaluations Found',
          description: 'No student pronunciation audits match your current filter settings.',
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: () => {
            setQuery('');
            setSelectedStudentFilter('all');
            setSelectedMasteryFilter('all');
            setSelectedIjazahFilter('all');
          },
          createLabel: 'Perform First Tajweed Audit',
          onCreate: handleOpenCreateModal
        }}
      />

      {/* Inspector Modal */}
      {inspectedEval && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 sm:p-8 max-w-2xl w-full space-y-6`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                      {inspectedEval.academicTerm || 'Term 1'}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {inspectedEval.masteryLevel}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {inspectedEval.studentName}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(inspectedEval)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Audit</span>
                </button>
                <button
                  onClick={() => setInspectedEval(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-white font-bold transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Score Breakdown Radar */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500">9 Classical Tajweed Competencies</span>
                <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400">
                  {inspectedEval.overallScore}% Overall
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { name: 'Makharij (Points)', val: inspectedEval.makharij },
                  { name: 'Sifaat (Attributes)', val: inspectedEval.sifaat },
                  { name: 'Ghunnah Rules', val: inspectedEval.ghunnah },
                  { name: 'Ahkam al-Madd', val: inspectedEval.madd },
                  { name: 'Qalqalah (Echo)', val: inspectedEval.qalqalah },
                  { name: 'Waqf & Ibtida', val: inspectedEval.waqf },
                  { name: 'Noon Saakinah', val: inspectedEval.noonSaakin },
                  { name: 'Meem Saakinah', val: inspectedEval.meemSaakin },
                  { name: 'Fluency & Pacing', val: inspectedEval.fluency }
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 font-medium block truncate">{item.name}</span>
                    <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                      {item.val} / 10
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ijazah Status Banner */}
            {inspectedEval.ijazahReady && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 block">
                      Officially Approved for Sanad / Ijazah Oral Examination
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Pronunciation standard meets classical Hafs an Asim requirements.
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase">
                  Cleared
                </span>
              </div>
            )}

            {/* Examiner Feedback */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Examiner Feedback ({inspectedEval.evaluatedBy || 'Ustadh Tajweed Lead'})
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                "{inspectedEval.teacherComments || 'Scholar demonstrates strong phonetical precision and adherence to classical Tajweed conventions.'}"
              </p>
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
                <Award className="w-6 h-6 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {showEditModal ? 'Edit Tajweed Evaluation' : 'Log 9-Point Tajweed Assessment'}
                </h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-4">
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
                  <label className={labelCls}>Academic Term</label>
                  <select
                    value={formTerm}
                    onChange={(e) => setFormTerm(e.target.value)}
                    className={selectCls}
                  >
                    <option value="Term 1 (2026-2027)">Term 1 (2026-2027)</option>
                    <option value="Term 2 (2026-2027)">Term 2 (2026-2027)</option>
                    <option value="Term 3 (2026-2027)">Term 3 (2026-2027)</option>
                  </select>
                </div>
              </div>

              {/* 9 Score Inputs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={labelCls}>9 Core Rules (Score each 0 to 10)</label>
                  <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400">
                    Live Score: {computedOverall}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500">Makharij (0-10)</span>
                    <input type="number" step="0.5" min="0" max="10" value={formMakharij} onChange={(e) => setFormMakharij(e.target.value)} className={inputCls + ' font-mono'} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500">Sifaat (0-10)</span>
                    <input type="number" step="0.5" min="0" max="10" value={formSifaat} onChange={(e) => setFormSifaat(e.target.value)} className={inputCls + ' font-mono'} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500">Ghunnah (0-10)</span>
                    <input type="number" step="0.5" min="0" max="10" value={formGhunnah} onChange={(e) => setFormGhunnah(e.target.value)} className={inputCls + ' font-mono'} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500">Ahkam Madd (0-10)</span>
                    <input type="number" step="0.5" min="0" max="10" value={formMadd} onChange={(e) => setFormMadd(e.target.value)} className={inputCls + ' font-mono'} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500">Qalqalah (0-10)</span>
                    <input type="number" step="0.5" min="0" max="10" value={formQalqalah} onChange={(e) => setFormQalqalah(e.target.value)} className={inputCls + ' font-mono'} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500">Waqf / Ibtida (0-10)</span>
                    <input type="number" step="0.5" min="0" max="10" value={formWaqf} onChange={(e) => setFormWaqf(e.target.value)} className={inputCls + ' font-mono'} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500">Noon Saakin (0-10)</span>
                    <input type="number" step="0.5" min="0" max="10" value={formNoonSaakin} onChange={(e) => setFormNoonSaakin(e.target.value)} className={inputCls + ' font-mono'} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500">Meem Saakin (0-10)</span>
                    <input type="number" step="0.5" min="0" max="10" value={formMeemSaakin} onChange={(e) => setFormMeemSaakin(e.target.value)} className={inputCls + ' font-mono'} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500">Fluency / Tarteel</span>
                    <input type="number" step="0.5" min="0" max="10" value={formFluency} onChange={(e) => setFormFluency(e.target.value)} className={inputCls + ' font-mono'} />
                  </div>
                </div>
              </div>

              {/* Ijazah Ready Checkbox */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ijazah_cb"
                  checked={formIjazahReady}
                  onChange={(e) => setFormIjazahReady(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                />
                <label htmlFor="ijazah_cb" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Certify student as ready for formal Sanad / Ijazah Oral Examination
                </label>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Examiner Guidance Notes & Observations</label>
                <textarea
                  rows={2}
                  placeholder="Specific phonetics feedback, strengths in articulation, areas to strengthen..."
                  value={formComments}
                  onChange={(e) => setFormComments(e.target.value)}
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
                  {showEditModal ? 'Update Assessment' : 'Certify Tajweed Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

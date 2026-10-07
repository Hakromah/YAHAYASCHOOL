/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Star, Plus, Search, RefreshCw, Calendar, Download,
  CheckCircle2, AlertCircle, BookOpen, ShieldCheck, Filter,
  Users, Eye, Trash2, Edit2, X, Check, ArrowRight,
  TrendingUp, Award, Clock, Layers, RotateCcw,
  GraduationCap, UserCheck, Sparkles, Trophy, FileText, Printer
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

interface AchievementItem {
  id: string;
  documentId?: string;
  studentId: string;
  studentName: string;
  studentAdmission?: string;
  title: string;
  category: 'competition' | 'certificate' | 'hifz_milestone' | 'sanad_ijazah';
  awardLevel: '1st Place' | '2nd Place' | '3rd Place' | 'Distinction' | 'Certified Hafiz' | 'Honorable Mention';
  competitionOrEventName: string;
  dateAwarded: string;
  certifiedBy: string;
  scoreOrJuzCount?: string;
  certificateNumber: string;
  description: string;
  status: 'awarded' | 'pending_verification' | 'nominated';
  createdAt: string;
}

const INITIAL_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 'ach-001',
    studentId: '101',
    studentName: 'Zayd ibn Thabit',
    studentAdmission: 'YAH-2026-001',
    title: 'Sanad Ijazah with Continuous Chain (Hafs an Asim)',
    category: 'sanad_ijazah',
    awardLevel: 'Certified Hafiz',
    competitionOrEventName: 'Formal Sanad Convocation 2026',
    dateAwarded: '2026-10-01',
    certifiedBy: 'Sheikh Dr. Umar Farooq & Quran Council',
    scoreOrJuzCount: '30 Juz (Complete)',
    certificateNumber: 'SANAD-2026-089',
    description: 'Recited the complete Quran from memory following classical Shatibiyyah rules with verified Sanad chain.',
    status: 'awarded',
    createdAt: '2026-10-01T10:00:00Z'
  },
  {
    id: 'ach-002',
    studentId: '102',
    studentName: 'Abdullah ibn Masood',
    studentAdmission: 'YAH-2026-002',
    title: '1st Place - Inter-School Quran Recitation Championship',
    category: 'competition',
    awardLevel: '1st Place',
    competitionOrEventName: 'National Tahfeez Olympiad',
    dateAwarded: '2026-09-20',
    certifiedBy: 'National Quranic Commission',
    scoreOrJuzCount: '99.5% Score',
    certificateNumber: 'COMP-2026-104',
    description: 'Awarded first place in the 15-Juz Category against 80 competing memorizers nationwide.',
    status: 'awarded',
    createdAt: '2026-09-20T14:00:00Z'
  },
  {
    id: 'ach-003',
    studentId: '104',
    studentName: 'Fatimah Az-Zahra',
    studentAdmission: 'YAH-2026-004',
    title: 'Khatm al-Quran Completion Milestone Award',
    category: 'hifz_milestone',
    awardLevel: 'Certified Hafiz',
    competitionOrEventName: 'Annual Khatm Ceremonial Gala',
    dateAwarded: '2026-09-15',
    certifiedBy: 'Ustadh Ahmad Al-Kurdi',
    scoreOrJuzCount: '30 Juz',
    certificateNumber: 'HIFZ-30-2026-042',
    description: 'Successfully concluded memorization of all 30 Juz and 114 Surahs within 28 months.',
    status: 'awarded',
    createdAt: '2026-09-15T11:00:00Z'
  },
  {
    id: 'ach-004',
    studentId: '105',
    studentName: 'Aisha Siddiqah',
    studentAdmission: 'YAH-2026-005',
    title: 'Excellence in Theoretical Tajweed & Matn Al-Jazariyyah',
    category: 'certificate',
    awardLevel: 'Distinction',
    competitionOrEventName: 'Matn Recitation Examination',
    dateAwarded: '2026-08-30',
    certifiedBy: 'Ustadha Maryam Al-Ghamdi',
    scoreOrJuzCount: '96% Score',
    certificateNumber: 'TAJ-JAZ-2026-015',
    description: 'Demonstrated complete memorization and practical comprehension of the 107 lines of Mandhumat al-Jazariyyah.',
    status: 'awarded',
    createdAt: '2026-08-30T09:30:00Z'
  }
];

export default function QuranAchievementsPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user } = useAuth();

  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & UI
  const [query, setQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [inspectedAchievement, setInspectedAchievement] = useState<AchievementItem | null>(null);
  const [editingAchievement, setEditingAchievement] = useState<AchievementItem | null>(null);

  // Form State
  const [formStudentId, setFormStudentId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<AchievementItem['category']>('competition');
  const [formAwardLevel, setFormAwardLevel] = useState<AchievementItem['awardLevel']>('1st Place');
  const [formEventName, setFormEventName] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCertifiedBy, setFormCertifiedBy] = useState('Ustadh Ahmad Al-Kurdi');
  const [formScoreOrJuz, setFormScoreOrJuz] = useState('30 Juz');
  const [formCertificateNumber, setFormCertificateNumber] = useState(`CERT-${Date.now().toString().slice(-6)}`);
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<AchievementItem['status']>('awarded');

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [achRes, studentsRes, certRes] = await Promise.allSettled([
        qmsService.getQuranAchievements().catch(() => null),
        apiClient.get('/students?populate=*&pagination[limit]=300').catch(() => null),
        apiClient.get('/quran-certificates?populate=*&pagination[limit]=100').catch(() => null)
      ]);

      // 1. Process Students
      let studentList: any[] = [];
      if (studentsRes.status === 'fulfilled' && (studentsRes.value as any)?.data?.data?.length > 0) {
        studentList = (studentsRes.value as any).data.data.map((s: any) => ({
          id: String(s.id),
          documentId: s.documentId,
          name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
          admissionNumber: s.admissionNumber || s.studentId || `STD-${s.id}`
        }));
      }
      if (studentList.length === 0) {
        studentList = [
          { id: '101', name: 'Zayd ibn Thabit', admissionNumber: 'YAH-2026-001' },
          { id: '102', name: 'Abdullah ibn Masood', admissionNumber: 'YAH-2026-002' },
          { id: '103', name: 'Ubayy ibn Kaab', admissionNumber: 'YAH-2026-003' },
          { id: '104', name: 'Fatimah Az-Zahra', admissionNumber: 'YAH-2026-004' },
          { id: '105', name: 'Aisha Siddiqah', admissionNumber: 'YAH-2026-005' }
        ];
      }
      setStudents(studentList);

      // 2. Process Achievements
      let localSaved: AchievementItem[] = [];
      if (typeof window !== 'undefined') {
        try {
          const str = localStorage.getItem('yahaya_qms_achievements');
          if (str) localSaved = JSON.parse(str);
        } catch {}
      }

      if (achRes.status === 'fulfilled' && achRes.value && (achRes.value as any).length > 0) {
        const mapped: AchievementItem[] = (achRes.value as any).map((a: any) => ({
          id: String(a.id || a.documentId),
          documentId: a.documentId,
          studentId: String(a.student?.id || ''),
          studentName: a.student?.name || `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.trim() || 'Scholar',
          studentAdmission: a.student?.admissionNumber || '',
          title: a.title || a.name || 'Quran Achievement Award',
          category: a.category || 'competition',
          awardLevel: a.awardLevel || 'Distinction',
          competitionOrEventName: a.competitionOrEventName || a.eventName || 'Annual Recitation Contest',
          dateAwarded: a.dateAwarded ? String(a.dateAwarded).split('T')[0] : new Date().toISOString().split('T')[0],
          certifiedBy: a.certifiedBy || a.teacher?.name || 'Quran Directorate',
          scoreOrJuzCount: a.scoreOrJuzCount || 'Distinction',
          certificateNumber: a.certificateNumber || `CERT-${a.id}`,
          description: a.description || '',
          status: 'awarded',
          createdAt: a.createdAt || new Date().toISOString()
        }));
        setAchievements(mapped);
      } else if (localSaved.length > 0) {
        setAchievements(localSaved);
      } else {
        setAchievements(INITIAL_ACHIEVEMENTS);
        if (typeof window !== 'undefined') {
          localStorage.setItem('yahaya_qms_achievements', JSON.stringify(INITIAL_ACHIEVEMENTS));
        }
      }
    } catch {
      toast.error('Failed to load achievements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Sync to local storage
  const saveAchievementsLocally = (next: AchievementItem[]) => {
    setAchievements(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('yahaya_qms_achievements', JSON.stringify(next));
      } catch {}
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingAchievement(null);
    setFormStudentId(students[0]?.id ? String(students[0].id) : '101');
    setFormTitle('1st Place - Regional Tajweed Competition');
    setFormCategory('competition');
    setFormAwardLevel('1st Place');
    setFormEventName('Regional Quranic Forum 2026');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCertifiedBy((user as any)?.name || user?.username || 'Sheikh Dr. Umar Farooq');
    setFormScoreOrJuz('98.5% Score');
    setFormCertificateNumber(`CERT-${Date.now().toString().slice(-6)}`);
    setFormDescription('Demonstrated superior memorization and melodic Tarteel in the finals.');
    setFormStatus('awarded');
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (ach: AchievementItem) => {
    setEditingAchievement(ach);
    setFormStudentId(ach.studentId);
    setFormTitle(ach.title);
    setFormCategory(ach.category);
    setFormAwardLevel(ach.awardLevel);
    setFormEventName(ach.competitionOrEventName);
    setFormDate(ach.dateAwarded);
    setFormCertifiedBy(ach.certifiedBy);
    setFormScoreOrJuz(ach.scoreOrJuzCount || '');
    setFormCertificateNumber(ach.certificateNumber);
    setFormDescription(ach.description);
    setFormStatus(ach.status);
    setShowEditModal(true);
  };

  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedStudent = students.find(s => String(s.id) === formStudentId);
    const studentName = matchedStudent ? matchedStudent.name : 'Scholar';
    const studentAdmission = matchedStudent?.admissionNumber || '';

    const payload: Partial<AchievementItem> = {
      studentId: formStudentId,
      studentName,
      studentAdmission,
      title: formTitle,
      category: formCategory,
      awardLevel: formAwardLevel,
      competitionOrEventName: formEventName,
      dateAwarded: formDate,
      certifiedBy: formCertifiedBy,
      scoreOrJuzCount: formScoreOrJuz,
      certificateNumber: formCertificateNumber,
      description: formDescription,
      status: formStatus
    };

    try {
      if (editingAchievement) {
        const updated: AchievementItem = {
          ...editingAchievement,
          ...payload
        };
        const next = achievements.map(a => a.id === editingAchievement.id ? updated : a);
        saveAchievementsLocally(next);
        if (inspectedAchievement?.id === editingAchievement.id) setInspectedAchievement(updated);
        toast.success(`Updated certificate for ${studentName}`);
        setShowEditModal(false);
      } else {
        const newAch: AchievementItem = {
          id: `ach-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...(payload as any)
        };
        const next = [newAch, ...achievements];
        saveAchievementsLocally(next);
        toast.success(`Awarded ${formTitle} to ${studentName}`);
        setShowCreateModal(false);
      }
    } catch {
      toast.error('Failed to save achievement');
    }
  };

  const handleDeleteAchievement = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove certificate record for "${name}"?`)) return;
    const next = achievements.filter(a => a.id !== id);
    saveAchievementsLocally(next);
    toast.success('Removed achievement record');
    if (inspectedAchievement?.id === id) setInspectedAchievement(null);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredAchievements.map(a => ({
      CertificateNumber: a.certificateNumber,
      StudentName: a.studentName,
      AdmissionNumber: a.studentAdmission,
      Title: a.title,
      Category: a.category.toUpperCase(),
      AwardLevel: a.awardLevel,
      EventOrCompetition: a.competitionOrEventName,
      DateAwarded: a.dateAwarded,
      ScoreOrMilestone: a.scoreOrJuzCount || 'N/A',
      CertifiedBy: a.certifiedBy,
      Status: a.status.toUpperCase()
    }));
    qmsService.exportToCSV(dataToExport, `quran-achievements-registry-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Achievements exported to CSV');
  };

  // ── Filtered Records ──────────────────────────────────────────────────────
  const filteredAchievements = useMemo(() => {
    return achievements.filter(a => {
      const matchQ = !query ||
        a.studentName.toLowerCase().includes(query.toLowerCase()) ||
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.competitionOrEventName.toLowerCase().includes(query.toLowerCase()) ||
        a.certificateNumber.toLowerCase().includes(query.toLowerCase());
      const matchCat = selectedCategoryFilter === 'all' || a.category === selectedCategoryFilter;
      const matchStatus = selectedStatusFilter === 'all' || a.status === selectedStatusFilter;
      return matchQ && matchCat && matchStatus;
    });
  }, [achievements, query, selectedCategoryFilter, selectedStatusFilter]);

  const activeFiltersCount = [
    selectedCategoryFilter !== 'all',
    selectedStatusFilter !== 'all',
    query.length > 0
  ].filter(Boolean).length;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalSanad = useMemo(() => achievements.filter(a => a.category === 'sanad_ijazah').length, [achievements]);
  const totalKhatm = useMemo(() => achievements.filter(a => a.category === 'hifz_milestone').length, [achievements]);
  const totalCompetitions = useMemo(() => achievements.filter(a => a.category === 'competition').length, [achievements]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_awards',
      title: 'Certified Quran Credentials',
      value: `${achievements.length} Issued`,
      subtitle: `${students.length} scholars represented`,
      trendDirection: 'up',
      icon: <Trophy className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'sanad_recipients',
      title: 'Sanad & Ijazah Holders',
      value: `${totalSanad} Ijazahs`,
      subtitle: 'Continuous chain certifications',
      trendDirection: 'up',
      icon: <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'khatm_graduates',
      title: 'Full 30-Juz Khatm Graduates',
      value: `${totalKhatm} Huffaz`,
      subtitle: 'Complete Quran memorizers certified',
      trendDirection: 'up',
      icon: <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'competition_victories',
      title: 'Competition Podiums',
      value: `${totalCompetitions} Titles`,
      subtitle: 'Regional & National placements',
      trendDirection: 'up',
      icon: <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    }
  ];

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<AchievementItem, any>[]>(() => [
    {
      accessorKey: 'studentName',
      header: 'Quran Scholar & Cert ID',
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
              {a.studentName}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                {a.certificateNumber}
              </span>
              {a.studentAdmission && (
                <span className="text-[10px] font-mono text-slate-500">
                  {a.studentAdmission}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'title',
      header: 'Honor / Award Credential',
      cell: ({ row }) => {
        const a = row.original;
        const catMap: Record<string, { label: string; color: string }> = {
          sanad_ijazah: { label: 'Sanad Ijazah', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
          competition: { label: 'Competition Winner', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
          hifz_milestone: { label: 'Khatm Milestone', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
          certificate: { label: 'Academic Certificate', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300' }
        };
        const cat = catMap[a.category] || { label: a.category, color: 'bg-slate-100 text-slate-700' };
        return (
          <div className="space-y-1">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${cat.color}`}>
              {cat.label}
            </span>
            <div className="font-bold text-slate-900 dark:text-white text-xs block line-clamp-1">
              {a.title}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'awardLevel',
      header: 'Placement / Score',
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="space-y-0.5 font-mono">
            <span className="font-black text-xs text-amber-600 dark:text-amber-400 block flex items-center gap-1">
              <Trophy className="w-3 h-3 inline" /> {a.awardLevel}
            </span>
            {a.scoreOrJuzCount && (
              <span className="text-[11px] text-slate-500 font-bold block">
                {a.scoreOrJuzCount}
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'dateAwarded',
      header: 'Issued Date & Authority',
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="text-xs space-y-0.5">
            <span className="text-slate-900 dark:text-white font-medium block">
              {a.dateAwarded}
            </span>
            <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">
              {a.certifiedBy}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status === 'awarded' ? 'approved' : 'draft'} size="sm" />
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(evt) => evt.stopPropagation()}>
            <button
              onClick={() => setInspectedAchievement(a)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Inspect certificate"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
            <button
              onClick={() => handleOpenEditModal(a)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Edit certificate"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteAchievement(a.id, a.title)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Delete credential"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    }
  ], [achievements, inspectedAchievement]);

  // Styling helpers
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300';
  const modalCls = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200';
  const modalPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto';

  return (
    <EnterpriseModuleShell
      title="Quran Competitions, Certificates & Student Honors"
      description="Certify and archive national recitation competition placements, Khatm al-Quran milestones, Sanad Ijazahs, and formal awards."
      breadcrumbs={[{ label: 'Quran System', href: '/qms/memorization' }, { label: 'Achievements & Contests' }]}
      icon={<Trophy className="w-8 h-8 text-amber-500" />}
      recordCount={filteredAchievements.length}
      recordLabel="Credentials"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => {
        setQuery('');
        setSelectedCategoryFilter('all');
        setSelectedStatusFilter('all');
      }}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Registry</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-amber-500/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Confer Award / Sanad</span>
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
        <Link href="/qms/achievements" className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5" />
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
        searchPlaceholder="Search achievements by student name, award title, or certificate ID..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Achievements registry refreshed'); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => {
          setQuery('');
          setSelectedCategoryFilter('all');
          setSelectedStatusFilter('all');
        }}
        createButtonLabel="+ Award Honor"
        onCreate={handleOpenCreateModal}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              aria-label="Filter by Award Category"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Award Categories</option>
              <option value="sanad_ijazah">Sanad Ijazah Certification</option>
              <option value="competition">Competition Placements</option>
              <option value="hifz_milestone">Hifz Khatm Milestones</option>
              <option value="certificate">Tajweed / Academic Honors</option>
            </select>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Verification Stages</option>
              <option value="awarded">Awarded & Certified</option>
              <option value="pending_verification">Pending Council Verification</option>
              <option value="nominated">Nominated</option>
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredAchievements}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        onRowInspect={(row) => setInspectedAchievement(row)}
        onRowClick={(row) => setInspectedAchievement(row)}
        emptyStateProps={{
          title: 'No Achievements Found',
          description: 'No student honors or certifications match your current filters.',
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: () => {
            setQuery('');
            setSelectedCategoryFilter('all');
            setSelectedStatusFilter('all');
          },
          createLabel: 'Confer First Award',
          onCreate: handleOpenCreateModal
        }}
      />

      {/* Inspector Modal */}
      {inspectedAchievement && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 sm:p-8 max-w-2xl w-full space-y-6`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                      {inspectedAchievement.certificateNumber}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      {inspectedAchievement.awardLevel}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {inspectedAchievement.title}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => handleOpenEditModal(inspectedAchievement)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setInspectedAchievement(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-white font-bold transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recipient Box */}
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">Conferred Scholar Recipient</span>
                <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">{inspectedAchievement.studentName}</span>
              </div>
              <span className="text-xs font-mono text-slate-500 font-bold">{inspectedAchievement.dateAwarded}</span>
            </div>

            {/* Credential Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Category</span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block uppercase">
                  {inspectedAchievement.category.replace('_', ' ')}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Milestone / Score</span>
                <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1 block">
                  {inspectedAchievement.scoreOrJuzCount || 'Distinction'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Certified By</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block truncate">
                  {inspectedAchievement.certifiedBy}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500">Official Citation & Citation Description</h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                "{inspectedAchievement.description || 'Awarded in recognition of outstanding commitment to Quranic memorization and Tajweed excellence.'}"
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
                <Trophy className="w-6 h-6 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {showEditModal ? 'Edit Quran Credential' : 'Confer Quran Honor / Sanad Certificate'}
                </h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAchievement} className="space-y-4">
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
                  <label className={labelCls}>Award Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="competition">Competition Placement</option>
                    <option value="sanad_ijazah">Sanad & Ijazah Certification</option>
                    <option value="hifz_milestone">Hifz Khatm (30 Juz) Milestone</option>
                    <option value="certificate">Tajweed / Academic Award</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Honor / Award Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Place - National Recitation Championship"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Placement Level</label>
                  <select
                    value={formAwardLevel}
                    onChange={(e) => setFormAwardLevel(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="1st Place">1st Place</option>
                    <option value="2nd Place">2nd Place</option>
                    <option value="3rd Place">3rd Place</option>
                    <option value="Certified Hafiz">Certified Hafiz</option>
                    <option value="Distinction">Distinction (Mumtaz)</option>
                    <option value="Honorable Mention">Honorable Mention</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Score / Milestone</label>
                  <input
                    type="text"
                    placeholder="e.g. 30 Juz or 99.5%"
                    value={formScoreOrJuz}
                    onChange={(e) => setFormScoreOrJuz(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Certificate #</label>
                  <input
                    type="text"
                    required
                    value={formCertificateNumber}
                    onChange={(e) => setFormCertificateNumber(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Event / Exam Name</label>
                  <input
                    type="text"
                    required
                    value={formEventName}
                    onChange={(e) => setFormEventName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Certifying Authority</label>
                  <input
                    type="text"
                    required
                    value={formCertifiedBy}
                    onChange={(e) => setFormCertifiedBy(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Date Awarded</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Official Citation Description</label>
                <textarea
                  rows={2}
                  placeholder="Citation details, recitation standard demonstrated, committee remarks..."
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
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                >
                  {showEditModal ? 'Update Credential' : 'Confer Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

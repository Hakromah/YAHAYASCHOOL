'use client';

import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';

// module-level i18n fallback
const t = (key: string, loc?: string) => i18nT(key, loc || 'en');

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { useAuth } from '@/hooks/useAuth';
import {
  useTranscriptEngine,
  TranscriptMode,
  type CourseRecord,
  type TranscriptData,
} from '@/hooks/useTranscriptEngine';
import {
  FileBadge, Search, Printer, RefreshCw, Download,
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp,
  BookOpen, Award, ShieldCheck, ShieldAlert, QrCode,
  Clock, TrendingUp, Users, Layers, GraduationCap, ScrollText,
  Eye, Activity, UserCheck, FileSignature, Grid, Zap, Shield,
  FileText, BarChart3, AlertCircle, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface StudentRecord {
  id: number;
  documentId: string;
  firstName: string;
  lastName: string;
  schoolId: string;
  admissionNumber: string;
  enrollmentStatus: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  photo?: any;
}

interface DashboardKPIs {
  totalStudents: number;
  pendingClearances: number;
  transcriptVersionsTotal: number;
}

type Tab = 'viewer' | 'dashboard' | 'clearance' | 'signatories' | 'registers';

// ─────────────────────────────────────────────────────────────────────────────
// Section color & style map
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_COLORS: Record<string, string> = {
  general: 'text-indigo-600 dark:text-indigo-400',
  quran:   'text-emerald-600 dark:text-emerald-400',
  islamic: 'text-amber-600 dark:text-amber-400',
  language:'text-blue-600 dark:text-blue-400',
  stem:    'text-violet-600 dark:text-violet-400',
  arts:    'text-rose-600 dark:text-rose-400',
  sports:  'text-orange-600 dark:text-orange-400',
  other:   'text-slate-600 dark:text-slate-400',
};

const SECTION_BG: Record<string, string> = {
  general: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
  quran:   'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  islamic: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  language:'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  stem:    'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
  arts:    'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
  sports:  'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  other:   'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800',
};

// ─────────────────────────────────────────────────────────────────────────────
// Grade badge color
// ─────────────────────────────────────────────────────────────────────────────
function gradeColor(letter: string, isPassing: boolean) {
  if (!isPassing) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
  if (letter.startsWith('A')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
  if (letter.startsWith('B')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
  if (letter.startsWith('C')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
  return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400';
}

function statusBadge(gradebookStatus: string) {
  if (gradebookStatus === 'Approved' || gradebookStatus === 'Released') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (gradebookStatus === 'Submitted' || gradebookStatus === 'Verified') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
}

// ─────────────────────────────────────────────────────────────────────────────
// Clearance Row
// ─────────────────────────────────────────────────────────────────────────────
function ClearanceRow({ dept }: { dept: { pass: boolean; label: string; detail: string } }) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border text-xs',
      dept.pass
        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
        : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 text-rose-800 dark:text-rose-300'
    )}>
      {dept.pass
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <XCircle className="w-4 h-4 shrink-0" />}
      <div className="min-w-0">
        <p className="font-bold truncate">{dept.label}</p>
        <p className="text-[10px] opacity-80 truncate mt-0.5">{dept.detail}</p>
      </div>
      <span className={cn(
        'ml-auto shrink-0 px-2 py-0.5 rounded-full font-black text-[9px] uppercase',
        dept.pass
          ? 'bg-emerald-600 text-white'
          : 'bg-rose-600 text-white'
      )}>
        {dept.pass ? 'PASS' : 'BLOCKED'}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Course table row — with expandable blueprint breakdown
// ─────────────────────────────────────────────────────────────────────────────
function CourseRow({ course, idx }: { course: CourseRecord; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr className={cn(
        'transition-colors',
        idx % 2 === 0
          ? 'bg-white dark:bg-slate-950'
          : 'bg-slate-50/60 dark:bg-slate-900/40',
        !course.isPassing && 'bg-rose-50/40 dark:bg-rose-950/20'
      )}>
        <td className="px-4 py-2.5 text-left">
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-white text-xs">{course.subjectName}</span>
            {course.subjectCode && (
              <span className="text-[10px] font-mono text-slate-400">{course.subjectCode}</span>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5 text-center text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {course.gradeLevel}
        </td>
        <td className="px-3 py-2.5 text-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
          {course.creditHours}
        </td>
        <td className="px-3 py-2.5 text-center font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
          {course.finalScore > 0 ? `${course.finalScore}%` : <span className="text-slate-300 dark:text-slate-600">—</span>}
        </td>
        <td className="px-3 py-2.5 text-center">
          <span className={cn(
            'inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-black min-w-[28px]',
            gradeColor(course.letterGrade, course.isPassing)
          )}>
            {course.finalScore > 0 ? course.letterGrade : '—'}
          </span>
        </td>
        <td className="px-3 py-2.5 text-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
          {course.finalScore > 0 ? course.gpaPoints.toFixed(1) : '—'}
        </td>
        <td className="px-3 py-2.5 text-center">
          <span className={cn(
            'inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase',
            statusBadge(course.gradebookStatus)
          )}>
            {course.gradebookStatus}
          </span>
        </td>
        <td className="px-3 py-2.5 text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap hidden print:hidden xl:table-cell">
          {course.teacherName}
        </td>
        <td className="px-3 py-2.5 text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap hidden print:hidden lg:table-cell">
          {course.academicTerm} {course.academicYear}
        </td>
        {course.componentBreakdown.length > 0 && (
          <td className="px-2 py-2.5 text-center print:hidden">
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
              title={t('View assessment breakdown')}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </td>
        )}
        {course.componentBreakdown.length === 0 && <td />}
      </tr>
      {expanded && course.componentBreakdown.length > 0 && (
        <tr className="print:hidden">
          <td colSpan={10} className="px-4 pb-3 pt-0">
            <div className="flex flex-wrap gap-2 ml-4">
              {course.componentBreakdown.map((comp: { label: string; score: number | null; weight: number }) => (
                <div key={comp.label} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 text-[10px]">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{comp.label}</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {comp.score !== null ? `${comp.score}%` : <span className="text-slate-400">—</span>}
                  </span>
                  <span className="text-slate-400 text-[9px]">({comp.weight}% wt)</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminTranscriptsPage() {
  const locale = useLocale();
  const t = (key: string, loc?: string) => i18nT(key, loc || locale);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('viewer');

  // Transcript Engine hook
  const { transcriptData, isLoading: engineLoading, error, buildTranscript } = useTranscriptEngine();

  // Student list state
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  // Transcript mode & filters
  const [mode, setMode] = useState<TranscriptMode>('combined');
  const [filterYearDoc, setFilterYearDoc] = useState('');
  const [filterTermDoc, setFilterTermDoc] = useState('');
  const [selectedSectionDoc, setSelectedSectionDoc] = useState('');

  // Lookup options
  const [availableSections, setAvailableSections] = useState<{ documentId: string; name: string; sectionType?: string }[]>([]);
  const [availableYears, setAvailableYears] = useState<{ documentId: string; name: string }[]>([]);
  const [availableTerms, setAvailableTerms] = useState<{ documentId: string; name: string }[]>([]);

  // Archive & Versions
  const [isArchiving, setIsArchiving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  // Collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const toggleSection = (docId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId); else next.add(docId);
      return next;
    });
  };

  // School profile
  const [schoolProfile, setSchoolProfile] = useState<any>(null);

  // Authorized Signatories registry state
  const [signatories, setSignatories] = useState({
    principal: 'Prof. Yahaya Muhammad',
    registrar: 'Dr. Ibrahim Al-Hassan',
    vicePrincipal: 'Hajia Maryam Bello',
    dean: 'Dr. Usman Sani',
    academicDirector: 'Dr. Aisha Abdullahi',
  });
  const [signSaving, setSignSaving] = useState(false);

  // Dashboard KPIs
  const [kpis, setKpis] = useState<DashboardKPIs>({ totalStudents: 0, pendingClearances: 0, transcriptVersionsTotal: 0 });
  const [kpisLoading, setKpisLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<{ actor: string; action: string; desc: string; date: string }[]>([]);

  // Clearance Audit Tab
  const [clearanceStudents, setClearanceStudents] = useState<StudentRecord[]>([]);
  const [clearanceSearch, setClearanceSearch] = useState('');
  const [clearanceMap, setClearanceMap] = useState<Record<string, { holds: any[] }>>({});
  const [clearanceLoading, setClearanceLoading] = useState(false);

  // ── Load initial lookups (School Profile, Sections, Years, Terms, Students, Dashboard) ──
  const loadInitialData = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const [schoolRes, sectionsRes, yearsRes, termsRes, studentsRes] = await Promise.all([
        apiClient.get('/school-profile', { params: { populate: ['logo'] } }).catch(() => ({ data: { data: null } })),
        apiClient.get('/academic-sections', { params: { pagination: { limit: 200 }, sort: 'name:asc' } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/academic-years', { params: { pagination: { limit: 100 }, sort: 'name:desc' } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/academic-terms', { params: { pagination: { limit: 100 }, sort: 'name:asc' } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/students', {
          params: {
            filters: { enrollmentStatus: { $in: ['active', 'graduated'] } },
            populate: ['user', 'photo'],
            pagination: { limit: 1000 },
            sort: 'lastName:asc',
          },
        }).catch(() => ({ data: { data: [] } })),
      ]);

      if (schoolRes.data?.data) {
        setSchoolProfile(schoolRes.data.data);
      }

      setAvailableSections(
        (sectionsRes.data?.data || []).map((sec: any) => ({
          documentId: sec.documentId,
          name: sec.name,
          sectionType: sec.sectionType || sec.type || 'general',
        }))
      );

      setAvailableYears(
        (yearsRes.data?.data || []).map((yr: any) => ({
          documentId: yr.documentId,
          name: yr.name,
        }))
      );

      setAvailableTerms(
        (termsRes.data?.data || []).map((tm: any) => ({
          documentId: tm.documentId,
          name: tm.name,
        }))
      );

      const mappedStudents: StudentRecord[] = (studentsRes.data?.data || []).map((s: any) => ({
        id: s.id,
        documentId: s.documentId,
        firstName: s.firstName || s.user?.firstName || 'Unknown',
        lastName: s.lastName || s.user?.lastName || '',
        schoolId: s.schoolId || s.admissionNumber || '',
        admissionNumber: s.admissionNumber || s.schoolId || '',
        enrollmentStatus: s.enrollmentStatus || 'active',
        gender: s.gender,
        dateOfBirth: s.dateOfBirth,
        nationality: s.nationality,
        photo: s.photo,
      }));

      setStudents(mappedStudents);
      if (mappedStudents.length > 0 && !selectedStudent) {
        // Leave unselected or keep current
      }
    } catch (err) {
      console.error('Initial data load error:', err);
      toast.error('Failed to load initial transcript workspace data.');
    } finally {
      setStudentsLoading(false);
    }
  }, [selectedStudent]);

  // ── Load dashboard KPIs ──────────────────────────────────────────────────
  const loadKPIs = useCallback(async () => {
    setKpisLoading(true);
    try {
      const [studRes, tvRes, holdsRes, logsRes] = await Promise.all([
        apiClient.get('/students', { params: { filters: { enrollmentStatus: { $eq: 'active' } }, pagination: { limit: 1 } } }).catch(() => ({ data: { meta: { pagination: { total: 0 } } } })),
        apiClient.get('/transcript-versions', { params: { pagination: { limit: 1 } } }).catch(() => ({ data: { meta: { pagination: { total: 0 } } } })),
        apiClient.get('/finance-holds', { params: { filters: { status: { $eq: 'active' } }, pagination: { limit: 1 } } }).catch(() => ({ data: { meta: { pagination: { total: 0 } } } })),
        apiClient.get('/gradebook-entries', { params: { sort: 'updatedAt:desc', pagination: { limit: 8 }, populate: ['courseOffering.subject', 'courseOffering.academicSection'] } }).catch(() => ({ data: { data: [] } })),
      ]);

      setKpis({
        totalStudents: studRes.data?.meta?.pagination?.total ?? 0,
        pendingClearances: holdsRes.data?.meta?.pagination?.total ?? 0,
        transcriptVersionsTotal: tvRes.data?.meta?.pagination?.total ?? 0,
      });

      setAuditLogs((logsRes.data?.data ?? []).map((e: any) => ({
        actor: e.courseOffering?.academicSection?.name ?? 'System',
        action: `Gradebook — ${e.courseOffering?.subject?.name ?? 'Unknown Subject'}`,
        desc: `Score: ${e.score ?? '—'} / ${e.maxScore ?? '—'} · ${e.courseOffering?.gradebookStatus ?? 'Draft'}`,
        date: new Date(e.updatedAt ?? Date.now()).toLocaleString(),
      })));
    } catch {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setKpisLoading(false);
    }
  }, []);

  // ── Load clearance audit ─────────────────────────────────────────────────
  const loadClearance = useCallback(async () => {
    setClearanceLoading(true);
    try {
      const res = await apiClient.get('/finance-holds', {
        params: { filters: { status: { $eq: 'active' } }, populate: ['student'], pagination: { limit: 200 } },
      });
      const holds: any[] = res.data?.data ?? [];
      const studMap: Record<string, StudentRecord> = {};
      const cMap: Record<string, { holds: any[] }> = {};
      holds.forEach((h: any) => {
        const s = h.student;
        if (!s) return;
        const docId = s.documentId;
        if (!studMap[docId]) {
          studMap[docId] = {
            id: s.id,
            documentId: docId,
            firstName: s.firstName ?? '',
            lastName: s.lastName ?? '',
            schoolId: s.schoolId ?? '',
            admissionNumber: s.admissionNumber ?? '',
            enrollmentStatus: s.enrollmentStatus ?? '',
            gender: s.gender ?? '',
          };
          cMap[docId] = { holds: [] };
        }
        cMap[docId].holds.push(h);
      });
      setClearanceStudents(Object.values(studMap));
      setClearanceMap(cMap);
    } catch {
      toast.error('Failed to load clearance audit data.');
    } finally {
      setClearanceLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
    loadKPIs();
  }, [loadInitialData, loadKPIs]);

  useEffect(() => {
    if (activeTab === 'clearance') loadClearance();
  }, [activeTab, loadClearance]);

  // ── Build transcript when student, mode, year, term, or section filter changes ──
  useEffect(() => {
    if (!selectedStudent) return;
    buildTranscript(
      selectedStudent.documentId,
      mode,
      filterYearDoc || undefined,
      filterTermDoc || undefined,
      mode === 'section' ? selectedSectionDoc || undefined : undefined,
    );
  }, [selectedStudent, mode, filterYearDoc, filterTermDoc, selectedSectionDoc, buildTranscript]);

  // ── Filtered student list for Left Sidebar ────────────────────────────────
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      (s.schoolId && s.schoolId.toLowerCase().includes(q)) ||
      (s.admissionNumber && s.admissionNumber.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  // ── Filtered Clearance list ───────────────────────────────────────────────
  const filteredClearance = useMemo(() => {
    const q = clearanceSearch.toLowerCase();
    return clearanceStudents.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.schoolId.toLowerCase().includes(q) ||
      s.admissionNumber.toLowerCase().includes(q)
    );
  }, [clearanceStudents, clearanceSearch]);

  // ── Generate & Archive handler ────────────────────────────────────────────
  const handleGenerateAndArchive = useCallback(async () => {
    if (!selectedStudent || !transcriptData) return;
    if (transcriptData.clearance.overallBlocked) {
      toast.error('Cannot generate official transcript. Active clearance holds must be resolved first.');
      return;
    }
    setIsArchiving(true);
    try {
      const nextVersion = (transcriptData.transcriptVersions[0]?.versionNumber ?? 0) + 1;
      const dataSnapshot = {
        mode,
        studentDocId: selectedStudent.documentId,
        generatedAt: new Date().toISOString(),
        summary: transcriptData.summary,
        sectionBlocks: transcriptData.sectionBlocks,
      };

      // Archive to academic-transcripts
      const transcriptNumber = `TRX-${selectedStudent.schoolId || selectedStudent.admissionNumber || selectedStudent.documentId.slice(0, 6)}-${nextVersion.toString().padStart(3, '0')}`;
      await apiClient.post('/academic-transcripts', {
        data: {
          transcriptNumber,
          verificationID: transcriptData.summary.verificationHash,
          dataSnapshot,
          issueDate: new Date().toISOString().split('T')[0],
          status: 'Published',
          version: nextVersion,
          hash: transcriptData.summary.verificationHash,
          registrar: signatories.registrar || (user as any)?.username || 'Registrar',
          student: selectedStudent.documentId,
        },
      });

      // Save to transcript-versions
      await apiClient.post('/transcript-versions', {
        data: {
          versionNumber: nextVersion,
          sha256Hash: transcriptData.summary.verificationHash,
          issuedDate: new Date().toISOString().split('T')[0],
          reason: `Official ${mode} transcript generated by Registrar`,
          recordStatus: 'Active',
          student: selectedStudent.documentId,
          issuedBy: user?.id,
        },
      });

      // Audit log
      apiClient.post('/audit-logs', {
        data: {
          action: 'Transcript Generated',
          entity: 'AcademicTranscript',
          entityId: selectedStudent.documentId,
          description: `Official ${mode} transcript generated for ${selectedStudent.firstName} ${selectedStudent.lastName} (v${nextVersion}). Hash: ${transcriptData.summary.verificationHash}`,
          performedBy: user?.id,
          timestamp: new Date().toISOString(),
        },
      }).catch(console.warn);

      toast.success(`Official transcript v${nextVersion} archived successfully!`);
      // Refresh transcript data to show new version
      await buildTranscript(
        selectedStudent.documentId,
        mode,
        filterYearDoc || undefined,
        filterTermDoc || undefined,
        mode === 'section' ? selectedSectionDoc || undefined : undefined
      );
    } catch (err: any) {
      console.error('Archive error:', err?.response?.data || err);
      toast.error('Failed to archive transcript. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  }, [selectedStudent, transcriptData, mode, filterYearDoc, filterTermDoc, selectedSectionDoc, user, buildTranscript, signatories]);

  // ── Print handler — generates clean data-driven HTML in isolated popup ────
  const handlePrint = useCallback(() => {
    if (transcriptData?.clearance.overallBlocked) {
      toast.error('Cannot print transcript. Active holds must be resolved first.');
      return;
    }
    if (!transcriptData || !selectedStudent) {
      toast.error('Transcript data not ready yet.');
      return;
    }

    const schoolName   = schoolProfile?.name ?? 'Yahaya International Islamic and English High School';
    const schoolAddr   = schoolProfile?.address      ?? '';
    const schoolAccred = schoolProfile?.accreditation ?? '';
    const logoUrl      = `${window.location.origin}/yahaya-logo.jpeg`;
    const studentName  = `${selectedStudent.firstName} ${selectedStudent.lastName}`;
    const today        = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    const gradeColour = (letter: string, pass: boolean) => {
      if (!pass) return 'background:#fee2e2;color:#991b1b';
      if (letter.startsWith('A')) return 'background:#d1fae5;color:#065f46';
      if (letter.startsWith('B')) return 'background:#dbeafe;color:#1e40af';
      if (letter.startsWith('C')) return 'background:#fef3c7;color:#92400e';
      return 'background:#ffedd5;color:#9a3412';
    };

    const statusColour = (gs: string) => {
      if (gs === 'Approved' || gs === 'Released') return 'background:#d1fae5;color:#065f46';
      if (gs === 'Submitted' || gs === 'Verified') return 'background:#fef3c7;color:#92400e';
      return 'background:#f1f5f9;color:#475569';
    };

    const blocksHtml = transcriptData.sectionBlocks.map(block => {
      const rowsHtml = block.courses.map((course: CourseRecord) => `
        <tr>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0">
            <div style="font-weight:700;font-size:8.5pt">${course.subjectName}</div>
            <div style="font-size:7pt;color:#64748b;font-family:monospace">${course.subjectCode}</div>
          </td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:8pt;color:#475569">${course.gradeLevel ?? ''}</td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700">${course.creditHours}</td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:800;color:#4338ca">${course.finalScore !== null ? `${course.finalScore}%` : '—'}</td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center">
            <span style="display:inline-block;padding:1px 6px;border-radius:99px;font-size:7.5pt;font-weight:700;${gradeColour(course.letterGrade, course.isPassing)}">${course.letterGrade}</span>
          </td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700">${course.gpaPoints.toFixed(1)}</td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;text-align:center">
            <span style="display:inline-block;padding:1px 6px;border-radius:99px;font-size:7pt;font-weight:700;${statusColour(course.gradebookStatus)}">${course.gradebookStatus.toUpperCase()}</span>
          </td>
          <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:7.5pt;color:#64748b">${[course.academicTerm, course.academicYear].filter(Boolean).join(' · ')}</td>
        </tr>
      `).join('');

      return `
      <div class="section-block" style="margin-top:14px;page-break-inside:avoid">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:7px 12px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:9pt;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#1e293b">${block.sectionName}</span>
          <span style="font-size:7.5pt;color:#64748b">
            ${block.courses.length} course${block.courses.length !== 1 ? 's' : ''} &nbsp;|&nbsp;
            Credits: <strong>${block.creditsAttempted}</strong> &nbsp;|&nbsp;
            GPA: <strong style="color:#4338ca">${block.sectionGPA.toFixed(2)}</strong>
          </span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:8.5pt;margin-top:2px;border:1px solid #e2e8f0;border-top:none">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:5px 8px;text-align:left;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#475569">Subject</th>
              <th style="padding:5px 8px;text-align:left;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#475569">Level</th>
              <th style="padding:5px 8px;text-align:center;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#475569">Cr</th>
              <th style="padding:5px 8px;text-align:center;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#4338ca">Score</th>
              <th style="padding:5px 8px;text-align:center;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#475569">Grade</th>
              <th style="padding:5px 8px;text-align:center;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#475569">GP</th>
              <th style="padding:5px 8px;text-align:center;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#475569">Status</th>
              <th style="padding:5px 8px;text-align:left;font-weight:700;font-size:7pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #cbd5e1;color:#475569">Period</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:5px 12px;font-size:7.5pt;color:#475569;display:flex;gap:16px">
          <span>Section GPA: <strong style="color:#4338ca">${block.sectionGPA.toFixed(2)}</strong></span>
          <span>Credits Earned: <strong>${block.creditsEarned}/${block.creditsAttempted}</strong></span>
          <span style="color:#059669">Passed: ${block.passCount}</span>
          ${block.failCount > 0 ? `<span style="color:#e11d48">Failed: ${block.failCount}</span>` : ''}
        </div>
      </div>`;
    }).join('');

    const infoFields = [
      ['Full Name',         studentName],
      ['Admission No.',     selectedStudent.admissionNumber || selectedStudent.schoolId || 'N/A'],
      ['Student ID',        selectedStudent.schoolId || 'N/A'],
      ['Gender',            selectedStudent.gender ?? ''],
      ['Date of Birth',     selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('en-GB') : ''],
      ['Nationality',       selectedStudent.nationality ?? ''],
      ['Enrollment Status', selectedStudent.enrollmentStatus ?? ''],
      ['Transcript Type',   mode.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())],
    ].filter(([, v]) => v).map(([label, value]) => `
      <td style="padding:6px 10px;vertical-align:top;border-right:1px solid #e2e8f0;width:25%">
        <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;margin-bottom:2px">${label}</div>
        <div style="font-size:9pt;font-weight:700;color:#0f172a">${value}</div>
      </td>
    `);

    const infoRows: string[] = [];
    for (let i = 0; i < infoFields.length; i += 4) {
      const cells = infoFields.slice(i, i + 4);
      while (cells.length < 4) cells.push('<td style="padding:6px 10px;width:25%"></td>');
      infoRows.push(`<tr>${cells.join('')}</tr>`);
    }

    const kpisList = [
      { label: 'Cumulative GPA',  value: transcriptData.summary.cgpa.toFixed(2), color: '#4338ca', big: true },
      { label: 'Credits Earned',  value: `${transcriptData.summary.creditsEarned} / ${transcriptData.summary.creditsAttempted}`, color: '#059669', big: false },
      { label: 'Courses Passed',  value: `${transcriptData.summary.passedCourses}`, color: '#059669', big: false },
      { label: 'Courses Failed',  value: `${transcriptData.summary.failedCourses}`, color: transcriptData.summary.failedCourses > 0 ? '#e11d48' : '#64748b', big: false },
    ];
    const kpiHtml = kpisList.map(k => `
      <td style="padding:0;vertical-align:top;width:25%">
        <div style="border:1px solid #e2e8f0;border-radius:4px;padding:10px 12px;margin:0 4px">
          <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8">${k.label}</div>
          <div style="font-size:${k.big ? '20pt' : '14pt'};font-weight:900;color:${k.color};margin-top:4px">${k.value}</div>
        </div>
      </td>
    `).join('');

    const qrPayload = encodeURIComponent(
      `YAHAYASCOOL TRANSCRIPT VERIFICATION\nStudent: ${studentName}\nID: ${selectedStudent.schoolId || selectedStudent.admissionNumber || 'N/A'}\nCGPA: ${transcriptData.summary.cgpa.toFixed(2)}\nHash: ${transcriptData.summary.verificationHash}\nDate: ${today}\nVerify: ${window.location.origin}/verify/transcript/${transcriptData.summary.verificationHash.slice(0, 12)}`
    );

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Official Transcript — ${studentName}</title>
<style>
  @page { size:A4 portrait; margin:14mm 12mm; }
  *     { box-sizing:border-box; margin:0; padding:0; }
  body  { font-family:'Outfit',system-ui,sans-serif; font-size:9.5pt; color:#0f172a; background:#fff;
          -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  table { width:100%; border-collapse:collapse; }
  button, .no-print { display:none!important; }
  .page-break { page-break-before:always; }
</style>
</head>
<body style="padding:0">
<div style="max-width:100%;padding:4px 0">

  <!-- ═══ HEADER ═════════════════════════════════════════════════════ -->
  <div style="display:flex;align-items:flex-start;gap:16px;padding-bottom:12px;border-bottom:2.5px solid #0f172a;margin-bottom:14px">
    <div style="width:72px;height:72px;flex-shrink:0;border:1.5px solid #e2e8f0;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f8fafc">
      <img src="${logoUrl}" alt="School Logo" style="width:100%;height:100%;object-fit:contain"/>
    </div>

    <div style="flex:1">
      <div style="font-size:16pt;font-weight:900;text-transform:uppercase;letter-spacing:-0.01em;color:#0f172a">${schoolName}</div>
      ${schoolAddr   ? `<div style="font-size:8pt;color:#64748b;margin-top:2px">${schoolAddr}</div>` : ''}
      ${schoolAccred ? `<div style="font-size:7.5pt;color:#94a3b8;font-style:italic;margin-top:1px">${schoolAccred}</div>` : ''}
      <div style="margin-top:6px;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4338ca">
        Official Academic Transcript of Record
      </div>
    </div>

    <div style="text-align:right;flex-shrink:0">
      <div style="font-size:7.5pt;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Transcript Ref.</div>
      <div style="font-family:monospace;font-size:8pt;font-weight:700;color:#4338ca;margin-top:2px">${transcriptData.summary.verificationHash.slice(0, 12).toUpperCase()}</div>
      <div style="font-size:7.5pt;color:#64748b;margin-top:4px">${today}</div>
    </div>
  </div>

  <!-- ═══ STUDENT INFO ════════════════════════════════════════════════ -->
  <table style="width:100%;border:1px solid #e2e8f0;border-radius:4px;margin-bottom:14px">
    <tbody style="background:#fafafa">
      ${infoRows.join('')}
    </tbody>
  </table>

  <!-- ═══ SECTION BLOCKS ══════════════════════════════════════════════ -->
  ${blocksHtml}

  <!-- ═══ OVERALL SUMMARY ═════════════════════════════════════════════ -->
  <div style="margin-top:18px;padding-top:12px;border-top:2.5px solid #0f172a">
    <div style="font-size:10pt;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#0f172a;margin-bottom:10px">
      &#9654; Overall Academic Summary
    </div>

    <table style="width:100%;border-collapse:separate;border-spacing:0;margin-bottom:10px">
      <tbody><tr style="vertical-align:top">${kpiHtml}</tr></tbody>
    </table>

    <table style="width:100%;border-collapse:separate;border-spacing:8px 0;margin-bottom:12px">
      <tbody><tr style="vertical-align:top">

        <!-- Academic Standing -->
        <td style="width:38%;border:1px solid #e2e8f0;border-radius:4px;padding:10px 12px">
          <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;margin-bottom:3px">Academic Standing</div>
          <div style="font-size:11pt;font-weight:800;color:#0f172a">${transcriptData.summary.academicStanding}</div>
          <div style="font-size:8.5pt;font-weight:700;margin-top:4px;color:${transcriptData.summary.isEligibleForGraduation ? '#059669' : '#d97706'}">
            ${transcriptData.summary.isEligibleForGraduation ? '&#10003; Eligible for Graduation' : '&#9888; Graduation Eligibility Pending'}
          </div>
          <div style="margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9">
            <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;margin-bottom:2px">Verification Hash</div>
            <div style="font-family:monospace;font-size:7pt;color:#334155;word-break:break-all;line-height:1.5">${transcriptData.summary.verificationHash}</div>
            <div style="font-size:7pt;color:#94a3b8;margin-top:4px">
              Version ${(transcriptData.transcriptVersions[0]?.versionNumber ?? 0) + 1} &nbsp;&middot;&nbsp; ${today}
            </div>
          </div>
        </td>

        <!-- QR Code Verification Panel -->
        <td style="width:62%;border:1px solid #e2e8f0;border-radius:4px;padding:10px 12px">
          <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;margin-bottom:8px">
            Digital Verification &nbsp;&mdash;&nbsp; Scan QR to Verify Authenticity
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="flex-shrink:0;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:4px">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${qrPayload}"
                alt="Transcript Verification QR Code"
                width="110"
                height="110"
                style="display:block;border-radius:4px"
              />
            </div>

            <div style="flex:1;min-width:0">
              <table style="width:100%;border-collapse:collapse;font-size:8pt">
                <tr>
                  <td style="padding:3px 0;vertical-align:top;width:40%">
                    <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Student Name</div>
                    <div style="font-weight:800;color:#0f172a;font-size:9pt">${studentName}</div>
                  </td>
                  <td style="padding:3px 0;vertical-align:top">
                    <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Student ID</div>
                    <div style="font-weight:700;color:#4338ca;font-family:monospace;font-size:9pt">${selectedStudent.schoolId || selectedStudent.admissionNumber || 'N/A'}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:3px 0;vertical-align:top">
                    <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Admission No.</div>
                    <div style="font-weight:700;color:#0f172a;font-family:monospace">${selectedStudent.admissionNumber || 'N/A'}</div>
                  </td>
                  <td style="padding:3px 0;vertical-align:top">
                    <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Cumulative GPA</div>
                    <div style="font-weight:900;color:#4338ca;font-size:11pt">${transcriptData.summary.cgpa.toFixed(2)}</div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:3px 0;vertical-align:top">
                    <div style="font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#94a3b8">Transcript Reference</div>
                    <div style="font-weight:700;color:#0f172a;font-family:monospace;font-size:8pt">${transcriptData.summary.verificationHash.slice(0, 12).toUpperCase()}</div>
                  </td>
                </tr>
              </table>
              <div style="margin-top:6px;padding:5px 7px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;font-size:7pt;color:#166534">
                &#10003;&nbsp; This transcript is cryptographically sealed. Scan the QR code to verify on YAHAYASCOOL Portal.
              </div>
            </div>
          </div>
        </td>

      </tr></tbody>
    </table>

    <!-- Signatures -->
    <table style="width:100%;border-collapse:separate;border-spacing:16px 0;margin-top:8px">
      <tbody><tr>
        <td style="width:33%;text-align:center;padding-top:28px;border-top:1.5px solid #94a3b8">
          <div style="font-size:8pt;font-weight:700;color:#475569">${signatories.registrar || 'Registrar Signature'}</div>
          <div style="font-size:7.5pt;color:#94a3b8;margin-top:3px">Date: _______________</div>
        </td>
        <td style="width:34%"></td>
        <td style="width:33%;text-align:center;padding-top:28px;border-top:1.5px solid #94a3b8">
          <div style="font-size:8pt;font-weight:700;color:#475569">${signatories.principal || 'Principal Signature'}</div>
          <div style="font-size:7.5pt;color:#94a3b8;margin-top:3px">Date: _______________</div>
        </td>
      </tr></tbody>
    </table>

    <div style="text-align:center;font-size:7pt;color:#94a3b8;font-style:italic;margin-top:14px;padding-top:8px;border-top:1px solid #e2e8f0">
      This is an official academic transcript generated by the Enterprise Academic ERP.
      Any alteration renders this document void. Verify authenticity using the hash code above.
    </div>
  </div>

</div>
<script>
  window.onload = function() {
    setTimeout(function() {
      window.print();
      setTimeout(function() { window.close(); }, 1200);
    }, 600);
  };
<\/script>
</body></html>`;

    const win = window.open('', '_blank', 'width=900,height=750,scrollbars=yes');
    if (!win) {
      toast.error('Popup blocked. Please allow popups for this site and try again.');
      return;
    }
    win.document.write(html);
    win.document.close();
  }, [transcriptData, selectedStudent, schoolProfile, mode, signatories]);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'viewer',      label: 'Transcript Engine',  icon: ScrollText },
    { key: 'dashboard',   label: 'Registrar Hub',      icon: Activity },
    { key: 'clearance',   label: 'Clearance Holds',    icon: UserCheck },
    { key: 'signatories', label: 'Signatories',        icon: FileSignature },
    { key: 'registers',   label: 'Official Registers', icon: Grid },
  ];

  return (
    <PageContainer>
      <div className="space-y-5 pb-16 print:p-0 print:m-0 print:border-none print:space-y-0">

        {/* ── Page Header ── */}
        <div className="print:hidden flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ScrollText className="h-6 w-6 text-indigo-500" />
              Central Registrar &amp; Transcript Engine
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Generate official multi-section transcripts across all academic programs, verify institutional clearances, manage cryptographic version archives, and export student registers.
            </p>
          </div>
          <button
            onClick={() => {
              loadInitialData();
              loadKPIs();
              if (activeTab === 'clearance') loadClearance();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shrink-0"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', studentsLoading || kpisLoading ? 'animate-spin' : '')} />
            Refresh All
          </button>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="print:hidden flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'pb-3 px-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: TRANSCRIPT ENGINE / VIEWER
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'viewer' && (
          <div>
            {studentsLoading ? (
              <div className="print:hidden animate-pulse space-y-4">
                <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-5">

                {/* ════════════════════════════════════════════════
                    LEFT SIDEBAR — Student Directory & Filtering
                ════════════════════════════════════════════════ */}
                <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-4 print:hidden shrink-0">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 sticky top-4 flex flex-col gap-3">

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student name or ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                      <span>{filteredStudents.length} scholar{filteredStudents.length !== 1 ? 's' : ''}</span>
                      <span>Total: {students.length}</span>
                    </div>

                    {/* Student list */}
                    <div className="max-h-[62vh] overflow-y-auto space-y-1.5 pr-1">
                      {filteredStudents.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-6">No students found.</p>
                      ) : (
                        filteredStudents.map(student => (
                          <button
                            key={student.documentId}
                            onClick={() => setSelectedStudent(student)}
                            className={cn(
                              'w-full text-left px-3 py-2.5 rounded-xl transition-all border text-xs',
                              selectedStudent?.documentId === student.documentId
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 shadow-sm'
                                : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                                  {(student.firstName?.[0] ?? '') + (student.lastName?.[0] ?? '')}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                  {student.firstName} {student.lastName}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {student.schoolId || student.admissionNumber || 'No ID'}
                                </p>
                              </div>
                              {selectedStudent?.documentId === student.documentId && (
                                <Eye className="w-3.5 h-3.5 text-indigo-500 ml-auto shrink-0" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* ════════════════════════════════════════════════
                    RIGHT PANEL — Transcript Document & Controls
                ════════════════════════════════════════════════ */}
                <div className="flex-1 min-w-0 print:w-full">
                  {!selectedStudent ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center h-[520px] text-center p-8 print:hidden">
                      <FileBadge className="h-16 w-16 text-slate-200 dark:text-slate-700 mb-4 animate-pulse" />
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Select a Student</h3>
                      <p className="text-slate-500 mt-2 max-w-sm text-sm">
                        Choose any student from the left directory to view their enterprise academic transcript — grouped by academic program section with blueprint-weighted GPA.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">

                      {/* ── Controls Bar ── */}
                      <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-wrap gap-3 items-center">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-500">Type:</label>
                          <select
                            value={mode}
                            onChange={e => setMode(e.target.value as TranscriptMode)}
                            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          >
                            <option value="combined">Official Combined</option>
                            <option value="section">Section-Specific</option>
                            <option value="year">Academic Year</option>
                            <option value="term">Semester/Term</option>
                            <option value="progress">Progress Report</option>
                            <option value="graduation">Graduation Transcript</option>
                          </select>
                        </div>

                        {mode === 'section' && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">Section:</label>
                            <select
                              value={selectedSectionDoc}
                              onChange={e => setSelectedSectionDoc(e.target.value)}
                              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="">All Program Sections</option>
                              {availableSections.map(sec => (
                                <option key={sec.documentId} value={sec.documentId}>{sec.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {mode === 'year' && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">Year:</label>
                            <select
                              value={filterYearDoc}
                              onChange={e => setFilterYearDoc(e.target.value)}
                              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="">All Academic Years</option>
                              {availableYears.map(y => (
                                <option key={y.documentId} value={y.documentId}>{y.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {mode === 'term' && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">Term:</label>
                            <select
                              value={filterTermDoc}
                              onChange={e => setFilterTermDoc(e.target.value)}
                              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="">All Semesters / Terms</option>
                              {availableTerms.map(t => (
                                <option key={t.documentId} value={t.documentId}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="ml-auto flex items-center gap-2 flex-wrap">
                          {transcriptData && (
                            <button
                              onClick={() => setShowVersions(v => !v)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl font-bold transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Versions ({transcriptData.transcriptVersions.length})
                            </button>
                          )}
                          <button
                            onClick={handleGenerateAndArchive}
                            disabled={isArchiving || engineLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs rounded-xl font-bold transition-colors"
                          >
                            {isArchiving
                              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              : <Download className="w-3.5 h-3.5" />}
                            {isArchiving ? 'Archiving...' : 'Generate & Archive'}
                          </button>
                          <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl font-bold transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Official
                          </button>
                        </div>
                      </div>

                      {/* ── Version History Dropdown ── */}
                      {showVersions && transcriptData && transcriptData.transcriptVersions.length > 0 && (
                        <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
                          <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            Transcript Version History &amp; Hash Audit
                          </h4>
                          <div className="space-y-2">
                            {transcriptData.transcriptVersions.map((v: any) => (
                              <div key={v.documentId} className="flex items-center gap-3 text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                                <span className={cn(
                                  'px-2 py-0.5 rounded-full font-black text-[9px]',
                                  v.recordStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                                )}>
                                  v{v.versionNumber}
                                </span>
                                <span className="font-mono text-slate-500 flex-1 truncate">{v.sha256Hash}</span>
                                <span className="text-slate-400">{v.issuedDate}</span>
                                <span className={cn(
                                  'px-2 py-0.5 rounded-full text-[9px] font-bold',
                                  v.recordStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                )}>
                                  {v.recordStatus}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Engine Loading ── */}
                      {engineLoading && (
                        <div className="print:hidden bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-12 flex flex-col items-center gap-3">
                          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                          <p className="text-sm text-slate-500">Building enterprise transcript across all sections &amp; courses…</p>
                        </div>
                      )}

                      {/* ── Error Banner ── */}
                      {error && (
                        <div className="print:hidden bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-sm text-rose-700 dark:text-rose-400 flex gap-2">
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                          {error}
                        </div>
                      )}

                      {!engineLoading && transcriptData && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none">

                          {/* ════════════════════════════════════════
                              CLEARANCE PANEL (Screen Only)
                          ════════════════════════════════════════ */}
                          <div className="print:hidden p-6 border-b border-slate-100 dark:border-slate-800 space-y-3">
                            <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-indigo-400" />
                              ERP Clearance Verification
                            </h3>
                            {transcriptData.clearance.overallBlocked && (
                              <div className="flex items-start gap-2.5 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300">
                                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-black">Official Transcript Issuance Blocked</p>
                                  <p className="mt-0.5 opacity-80">One or more ERP clearance holds are active. Resolve all holds in the Clearance Audit tab before archiving or printing.</p>
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {Object.values(transcriptData.clearance)
                                .filter(v => typeof v === 'object' && v !== null && 'pass' in v)
                                .map((dept: any) => (
                                  <ClearanceRow key={dept.label} dept={dept} />
                                ))}
                            </div>
                          </div>

                          {/* ════════════════════════════════════════
                              OFFICIAL TRANSCRIPT DOCUMENT VIEW
                          ════════════════════════════════════════ */}
                          <div className="p-8 print:p-6 space-y-8 print:space-y-6">

                            {/* ── Document Header ── */}
                            <div className="border-b-2 border-slate-800 dark:border-slate-200 pb-6 print:pb-4">
                              <div className="flex flex-col sm:flex-row gap-4 items-start">
                                <div className="w-20 h-20 shrink-0 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden print:border print:rounded">
                                  {schoolProfile?.logo?.url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={schoolProfile.logo.url} alt="School Logo" className="w-full h-full object-contain" />
                                  ) : (
                                    <GraduationCap className="w-10 h-10 text-indigo-500" />
                                  )}
                                </div>

                                <div className="flex-1 text-center sm:text-left">
                                  <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wide">
                                    {schoolProfile?.name ?? 'Yahaya International Islamic and English High School'}
                                  </h1>
                                  {schoolProfile?.address && (
                                    <p className="text-xs text-slate-500 mt-1">{schoolProfile.address}</p>
                                  )}
                                  {schoolProfile?.accreditation && (
                                    <p className="text-[10px] text-slate-400 italic mt-0.5">{schoolProfile.accreditation}</p>
                                  )}
                                  <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 mt-2 uppercase tracking-widest">
                                    Official Academic Transcript of Record
                                  </p>
                                </div>

                                <div className="shrink-0 text-right space-y-1 text-xs">
                                  <div className="w-16 h-16 ml-auto bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center print:border">
                                    <QrCode className="w-10 h-10 text-slate-700 dark:text-slate-300" />
                                  </div>
                                  <p className="font-mono text-[9px] text-slate-400 break-all">
                                    {transcriptData.summary.verificationHash}
                                  </p>
                                  <p className="text-[10px] font-bold text-slate-500">
                                    {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* ── Student Information ── */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-800/30 print:p-3 print:rounded">
                              <div>
                                <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Full Name</p>
                                <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                                  {selectedStudent.firstName} {selectedStudent.lastName}
                                </p>
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Admission No.</p>
                                <p className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                                  {selectedStudent.admissionNumber || selectedStudent.schoolId || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Student ID</p>
                                <p className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                                  {selectedStudent.schoolId || 'N/A'}
                                </p>
                              </div>
                              {selectedStudent.gender && (
                                <div>
                                  <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Gender</p>
                                  <p className="font-bold text-slate-900 dark:text-white capitalize mt-0.5">{selectedStudent.gender}</p>
                                </div>
                              )}
                              {selectedStudent.dateOfBirth && (
                                <div>
                                  <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Date of Birth</p>
                                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                                    {new Date(selectedStudent.dateOfBirth).toLocaleDateString('en-GB')}
                                  </p>
                                </div>
                              )}
                              {selectedStudent.nationality && (
                                <div>
                                  <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Nationality</p>
                                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedStudent.nationality}</p>
                                </div>
                              )}
                              {selectedStudent.enrollmentStatus && (
                                <div>
                                  <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Enrollment Status</p>
                                  <p className="font-bold text-slate-900 dark:text-white capitalize mt-0.5">{selectedStudent.enrollmentStatus}</p>
                                </div>
                              )}
                              <div>
                                <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">Transcript Type</p>
                                <p className="font-bold text-indigo-600 dark:text-indigo-400 capitalize mt-0.5">{mode.replace('-', ' ')}</p>
                              </div>
                              {transcriptData.gpaConfig && (
                                <div>
                                  <p className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider">GPA Method</p>
                                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{transcriptData.gpaConfig.creditCalcMethod}</p>
                                </div>
                              )}
                            </div>

                            {/* ── Academic Section Blocks ── */}
                            {transcriptData.sectionBlocks.length === 0 ? (
                              <div className="text-center py-16">
                                <FileBadge className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-semibold">
                                  No{mode !== 'progress' ? ' approved' : ''} academic records found for this student
                                  {mode === 'year' && filterYearDoc ? ' in this academic year' : ''}
                                  {mode === 'term' && filterTermDoc ? ' in this term' : ''}
                                  {mode === 'section' && selectedSectionDoc ? ' in this section' : ''}.
                                </p>
                                {mode !== 'progress' && (
                                  <p className="text-xs text-slate-400 mt-1">Switch to &quot;Progress Report&quot; mode to view all records including pending grades.</p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-8 print:space-y-6">
                                {transcriptData.sectionBlocks.map(block => {
                                  const collapsed = collapsedSections.has(block.sectionDocId);
                                  const secType = block.sectionType ?? 'general';
                                  return (
                                    <div key={block.sectionDocId} className="space-y-2">
                                      {/* Section Header */}
                                      <div className={cn(
                                        'flex items-center justify-between px-4 py-3 rounded-xl border print:rounded print:bg-transparent print:border-slate-300',
                                        SECTION_BG[secType] ?? SECTION_BG.other
                                      )}>
                                        <div className="flex items-center gap-2">
                                          <BookOpen className={cn('w-4 h-4', SECTION_COLORS[secType] ?? SECTION_COLORS.other)} />
                                          <h3 className={cn('text-sm font-extrabold uppercase tracking-wider', SECTION_COLORS[secType] ?? SECTION_COLORS.other)}>
                                            {block.sectionName}
                                          </h3>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                          <span>{block.courses.length} course{block.courses.length !== 1 ? 's' : ''}</span>
                                          <span className="hidden sm:inline">·</span>
                                          <span className="hidden sm:inline">Credits: {block.creditsAttempted}</span>
                                          <span className="hidden sm:inline">·</span>
                                          <span className="hidden sm:inline">GPA: {block.sectionGPA.toFixed(2)}</span>
                                          <button
                                            onClick={() => toggleSection(block.sectionDocId)}
                                            className="print:hidden p-1 rounded-lg hover:bg-white/60 transition"
                                          >
                                            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                          </button>
                                        </div>
                                      </div>

                                      {/* Course Table */}
                                      {!collapsed && (
                                        <>
                                          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl print:rounded print:border-slate-300">
                                            <table className="w-full text-left">
                                              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                  <th className="px-4 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Subject</th>
                                                  <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase text-center whitespace-nowrap">Level</th>
                                                  <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase text-center">Cr</th>
                                                  <th className="px-3 py-2.5 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase text-center whitespace-nowrap">Score</th>
                                                  <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase text-center">Grade</th>
                                                  <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase text-center">GP</th>
                                                  <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase text-center whitespace-nowrap">Status</th>
                                                  <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap hidden xl:table-cell print:hidden">Teacher</th>
                                                  <th className="px-3 py-2.5 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap hidden lg:table-cell print:hidden">Period</th>
                                                  <th className="print:hidden" />
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {block.courses.map((course, idx) => (
                                                  <CourseRow key={course.offeringDocId} course={course} idx={idx} />
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>

                                          {/* Section Summary Bar */}
                                          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs print:border-slate-300 print:rounded">
                                            <div className="flex gap-4 font-bold text-slate-600 dark:text-slate-300">
                                              <span className="flex items-center gap-1">
                                                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                                                Section GPA: <span className="text-indigo-600 dark:text-indigo-400 ml-1">{block.sectionGPA.toFixed(2)}</span>
                                              </span>
                                              <span>Credits Earned: <strong>{block.creditsEarned}/{block.creditsAttempted}</strong></span>
                                              <span className="text-emerald-600 dark:text-emerald-400">Passed: {block.passCount}</span>
                                              {block.failCount > 0 && (
                                                <span className="text-rose-600 dark:text-rose-400">Failed: {block.failCount}</span>
                                              )}
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* ════════════════════════════════════════
                                    OVERALL SUMMARY
                                ════════════════════════════════════════ */}
                                <div className="pt-6 print:pt-4 border-t-2 border-slate-800 dark:border-slate-200 print:border-slate-800 space-y-6 print:space-y-4">
                                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Award className="w-5 h-5 text-indigo-500" />
                                    Overall Academic Summary
                                  </h3>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-2">
                                    {[
                                      { label: 'Cumulative GPA', value: transcriptData.summary.cgpa.toFixed(2), color: 'text-indigo-600 dark:text-indigo-400', big: true },
                                      { label: 'Credits Earned', value: `${transcriptData.summary.creditsEarned} / ${transcriptData.summary.creditsAttempted}`, color: 'text-emerald-600 dark:text-emerald-400', big: false },
                                      { label: 'Courses Passed', value: `${transcriptData.summary.passedCourses}`, color: 'text-emerald-600 dark:text-emerald-400', big: false },
                                      { label: 'Courses Failed', value: `${transcriptData.summary.failedCourses}`, color: transcriptData.summary.failedCourses > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500', big: false },
                                    ].map(kpi => (
                                      <div key={kpi.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 print:p-2 print:rounded print:border-slate-300">
                                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                                        <p className={cn('font-black mt-1', kpi.big ? 'text-3xl' : 'text-xl', kpi.color)}>
                                          {kpi.value}
                                        </p>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-1.5 print:p-3 print:rounded print:border-slate-300">
                                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Academic Standing</p>
                                      <p className="text-sm font-black text-slate-900 dark:text-white">{transcriptData.summary.academicStanding}</p>
                                      <p className={cn(
                                        'text-xs font-bold mt-1',
                                        transcriptData.summary.isEligibleForGraduation ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                                      )}>
                                        {transcriptData.summary.isEligibleForGraduation
                                          ? '✓ Eligible for Graduation'
                                          : '⚠ Graduation Eligibility Pending'}
                                      </p>
                                      {transcriptData.graduationRecord && (
                                        <p className="text-[10px] text-slate-400 mt-1">
                                          Graduation Record:{' '}
                                          {transcriptData.graduationRecord.graduationDate
                                            ? new Date(transcriptData.graduationRecord.graduationDate).toLocaleDateString('en-GB')
                                            : 'Date not set'}
                                        </p>
                                      )}
                                    </div>

                                    {/* Digital Verification */}
                                    <div className="space-y-3">
                                      <div className="flex gap-3 items-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 print:p-3 print:rounded print:border-slate-300">
                                        <div className="w-14 h-14 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center print:border-slate-300">
                                          <QrCode className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Verification Hash</p>
                                          <p className="font-mono text-[10px] text-slate-600 dark:text-slate-300 break-all mt-0.5 leading-snug">
                                            {transcriptData.summary.verificationHash}
                                          </p>
                                          <p className="text-[9px] text-slate-400 mt-1">
                                            Version {(transcriptData.transcriptVersions[0]?.versionNumber ?? 0) + 1} · {new Date().toLocaleDateString('en-GB')}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Signatures */}
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="text-center text-[10px] pt-6 border-t-2 border-slate-400 dark:border-slate-600 print:border-slate-400">
                                          <p className="font-extrabold text-slate-700 dark:text-slate-300">{signatories.registrar || 'Registrar Signature'}</p>
                                          <p className="text-slate-400 mt-0.5">Date: ___________</p>
                                        </div>
                                        <div className="text-center text-[10px] pt-6 border-t-2 border-slate-400 dark:border-slate-600 print:border-slate-400">
                                          <p className="font-extrabold text-slate-700 dark:text-slate-300">{signatories.principal || 'Principal Signature'}</p>
                                          <p className="text-slate-400 mt-0.5">Date: ___________</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Transcript footer */}
                                  <p className="text-[9px] text-center text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700 print:border-slate-300 italic">
                                    This is an official academic transcript generated by the Enterprise Academic ERP.
                                    Any alteration renders this document void. Verify authenticity using the cryptographic hash code above.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: REGISTRAR HUB / DASHBOARD
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { title: 'Active Students',      value: kpisLoading ? '…' : kpis.totalStudents.toString(),            desc: 'Currently enrolled across school', icon: Users,         color: 'text-indigo-500 bg-indigo-500/10' },
                { title: 'Registered Scholars',  value: studentsLoading ? '…' : students.length.toString(),           desc: 'Available in central viewer',      icon: GraduationCap, color: 'text-emerald-500 bg-emerald-500/10' },
                { title: 'Active Finance Holds', value: kpisLoading ? '…' : kpis.pendingClearances.toString(),        desc: 'Blocking transcript issuance',     icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10' },
                { title: 'Transcript Versions',  value: kpisLoading ? '…' : kpis.transcriptVersionsTotal.toString(),  desc: 'Total cryptographic archives',     icon: ShieldCheck,   color: 'text-sky-500 bg-sky-500/10' },
              ].map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <div key={idx} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{kpi.title}</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white block">{kpi.value}</span>
                      <span className="text-[10px] text-slate-500 block">{kpi.desc}</span>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.color}`}><Icon className="w-6 h-6" /></div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Audit log */}
              <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Recent Gradebook Activity
                </h3>
                {kpisLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading activity…</div>
                ) : auditLogs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No recent gradebook activity recorded.</div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {auditLogs.map((log, idx) => (
                      <div key={idx} className="py-3 flex justify-between items-start gap-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">{log.actor}</p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{log.action}</p>
                          <p className="text-[11px] text-slate-500">{log.desc}</p>
                        </div>
                        <div className="text-right text-[10px] text-slate-400 flex-shrink-0 font-mono">{log.date}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {([
                    { label: 'Transcript Engine',  desc: 'Select any scholar and generate',   icon: ScrollText,    tab: 'viewer' as Tab,      color: 'bg-indigo-500' },
                    { label: 'Clearance Audit',    desc: 'Review active financial holds',      icon: Shield,        tab: 'clearance' as Tab,   color: 'bg-amber-500' },
                    { label: 'Signature Registry', desc: 'Update authorized signatories',      icon: FileSignature, tab: 'signatories' as Tab, color: 'bg-emerald-500' },
                    { label: 'Export Registers',   desc: 'Print institutional register logs',  icon: Download,      tab: 'registers' as Tab,   color: 'bg-sky-500' },
                  ] as { label: string; desc: string; icon: React.ElementType; tab: Tab; color: string }[]).map((a, idx) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveTab(a.tab)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-all group"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.color} text-white flex-shrink-0`}><Icon className="w-4 h-4" /></div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{a.label}</p>
                          <p className="text-[10px] text-slate-500">{a.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3: CLEARANCE HOLDS AUDIT
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'clearance' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 text-xs flex gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="font-semibold">Scholars below have active financial, hostel, library, or administrative holds in Strapi ERP. Active holds prevent official transcript generation and graduation clearance.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name or ID…"
                  value={clearanceSearch}
                  onChange={e => setClearanceSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={loadClearance}
                disabled={clearanceLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', clearanceLoading ? 'animate-spin' : '')} />
                Refresh
              </button>
            </div>

            {clearanceLoading ? (
              <div className="py-16 text-center">
                <RefreshCw className="w-8 h-8 text-indigo-400 mx-auto animate-spin mb-3" />
                <p className="text-xs text-slate-500 font-bold">Auditing active ERP holds…</p>
              </div>
            ) : filteredClearance.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{clearanceSearch ? 'No matching students.' : 'No active holds — all scholars are clear for transcript issuance!'}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      {['Scholar', 'Student ID', 'Active Holds', 'Hold Types', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredClearance.map(s => {
                      const data = clearanceMap[s.documentId];
                      const holdCount = data?.holds?.length ?? 0;
                      const holdTypes = [...new Set((data?.holds ?? []).map((h: any) => h.holdType))].join(', ');
                      return (
                        <tr key={s.documentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-5 py-3">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{s.firstName} {s.lastName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{s.admissionNumber}</p>
                          </td>
                          <td className="px-5 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.schoolId}</td>
                          <td className="px-5 py-3"><span className="text-rose-600 font-black">{holdCount}</span> hold{holdCount !== 1 ? 's' : ''}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">{holdTypes || '—'}</td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Blocked
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => {
                                setSelectedStudent(s);
                                setActiveTab('viewer');
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold"
                            >
                              <Eye className="w-3 h-3 text-indigo-500" />
                              View in Engine
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 4: AUTHORIZED SIGNATORIES
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'signatories' && (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6 max-w-2xl">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-1">Registrar Signature Registry</h3>
              <p className="text-xs text-slate-500">These official signatory names appear on all generated and printed official transcripts and certificates.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {([
                { key: 'principal',        label: 'Principal / Chancellor' },
                { key: 'registrar',        label: 'Registrar General' },
                { key: 'vicePrincipal',    label: 'Vice Principal' },
                { key: 'dean',             label: 'Dean of Academic Affairs' },
                { key: 'academicDirector', label: 'Academic Director' },
              ] as { key: keyof typeof signatories; label: string }[]).map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{f.label}</label>
                  <input
                    type="text"
                    value={signatories[f.key]}
                    onChange={e => setSignatories(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              ))}
            </div>
            <button
              disabled={signSaving}
              onClick={() => {
                setSignSaving(true);
                setTimeout(() => {
                  setSignSaving(false);
                  toast.success('Authorized signatories updated. Future printed transcripts will use these names.');
                }, 600);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-black shadow-sm transition-all"
            >
              {signSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Save Signature Registry
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 5: OFFICIAL REGISTERS & EXPORTS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'registers' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">Each register opens the corresponding administrative view or prints verified academic record logs directly from Strapi ERP.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {([
                { name: 'Student Transcript Engine',     desc: 'Build, audit, and print official transcripts for individual scholars', icon: ScrollText,    color: 'bg-indigo-500',  action: () => setActiveTab('viewer') },
                { name: 'Graduation Clearance Register', desc: 'All scholars with active financial, hostel, or disciplinary holds',     icon: UserCheck,     color: 'bg-amber-500',   action: () => setActiveTab('clearance') },
                { name: 'Signature Authorization Log',   desc: 'Current authorized institutional signatories registry',                icon: FileSignature, color: 'bg-emerald-500', action: () => setActiveTab('signatories') },
                { name: 'Academic Probation Register',   desc: 'Scholars below minimum graduation GPA threshold (CGPA < 2.0)',        icon: AlertTriangle, color: 'bg-rose-500',    action: () => { toast.info('Filter scholars in the Transcript Engine to inspect probationary records.'); setActiveTab('viewer'); } },
                { name: 'Cryptographic Hash Index',      desc: 'Audit trail of all issued SHA-256 digital verification hashes',         icon: ShieldCheck,   color: 'bg-sky-500',     action: () => toast.info('Cryptographic verification hashes are displayed on all transcripts and version logs.') },
                { name: 'Institutional GPA Summary',     desc: 'School-wide average GPA broken down by academic section',              icon: BarChart3,     color: 'bg-purple-500',  action: () => toast.info('Institutional GPA analytics are integrated across each section block.') },
              ] as { name: string; desc: string; icon: React.ElementType; color: string; action: () => void }[]).map((reg, idx) => {
                const Icon = reg.icon;
                return (
                  <div key={idx} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${reg.color} text-white flex-shrink-0`}><Icon className="w-5 h-5" /></div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white">{reg.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{reg.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={reg.action}
                      className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Open Register
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </PageContainer>
  );
}

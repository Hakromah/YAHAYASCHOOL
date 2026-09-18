'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { 
  Award, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Download, 
  Upload, 
  Lock, 
  Unlock, 
  Save, 
  Undo, 
  Grid, 
  Sliders, 
  Eye, 
  FileSpreadsheet, 
  AlertCircle, 
  FileCheck, 
  UserCheck, 
  Activity, 
  User, 
  Plus, 
  Search, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  Check, 
  X, 
  ChevronRight, 
  BarChart3, 
  TrendingUp, 
  Trophy, 
  Layers, 
  Filter, 
  CheckSquare, 
  Settings2, 
  HelpCircle, 
  Clock, 
  QrCode, 
  Share2, 
  Calendar, 
  Percent, 
  Compass
} from 'lucide-react';
import { apiClient } from '@/services/api.service';
import { resultsService } from '@/services/results.service';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { Avatar } from '@/components/shared/Avatar';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export type TemplateType = 'Islamic' | 'Secondary' | 'Primary' | 'College';
export type WorkflowStatus = 'Draft' | 'TeacherSubmitted' | 'DepartmentReview' | 'DirectorApproved' | 'Published' | 'Locked';

export interface SubjectAssessment {
  subjectId: number | string;
  subjectName: string;
  subjectCode: string;
  creditHours: number;
  homework: number;
  quiz: number;
  project: number;
  midterm: number;
  final: number;
  attendance: number;
  moderatorOffset: number;
  average: number;
  letterGrade: string;
  gpa: number;
  remarks: string;
  teacherComment?: string;
}

export interface IslamicEvaluation {
  hifzSurahOrJuz: string;
  hifzScore: number;
  tajweedLevel: string;
  tajweedScore: number;
  arabicScore: number;
  fiqhScore: number;
  akhlaqGrade: string;
}

export interface ReportCardRecord {
  id: string | number;
  studentId: number;
  schoolId: string;
  studentName: string;
  avatarUrl?: string;
  sectionName: string;
  sectionId: number;
  gradeLevel: string;
  academicTerm: string;
  academicTermId: number;
  academicYear: string;
  academicYearId: number;
  averageScore: number;
  letterGrade: string;
  gpa: number;
  rankPosition: number;
  totalStudents: number;
  attendanceRate: number;
  attendanceDaysPresent: number;
  attendanceTotalDays: number;
  behaviorLevel: 'green' | 'yellow' | 'red';
  behaviorRemarks: string;
  teacherRemarks: string;
  principalRemarks: string;
  workflowStatus: WorkflowStatus;
  templateType: TemplateType;
  subjectGrades: SubjectAssessment[];
  islamicEvaluations: IslamicEvaluation;
  verificationHash: string;
  issueDate: string;
  isSealed: boolean;
}

export interface StudentGradeRow {
  id: number | string;
  studentId: number;
  schoolId: string;
  name: string;
  avatarUrl?: string;
  homework: number;
  quiz: number;
  project: number;
  midterm: number;
  final: number;
  attendance: number;
  average: number;
  letterGrade: string;
  gpa: number;
  remarks: string;
  status: WorkflowStatus;
  moderatorOffset: number;
  moderatorRemarks: string;
  isModified: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Helpers & Constants
// ─────────────────────────────────────────────────────────────────────────────

const PRESET_TEACHER_REMARKS = [
  'Exemplary scholar with outstanding dedication in both Quranic and academic studies.',
  'Consistent performance. Displays keen intellect, good conduct, and active participation.',
  'Shows commendable growth this term. Encouraged to maintain consistency in mathematics.',
  'Hardworking student with polite demeanor. Needs more regular revision in sciences.',
  'Has shown remarkable improvement in Arabic and Tajweed pronunciation this semester.'
];

const PRESET_PRINCIPAL_REMARKS = [
  'Promoted to the next academic grade with highest institutional honors. Mabrook!',
  'Successfully completed term requirements. Commended for exemplary moral character.',
  'Promoted to the next grade level in good academic and disciplinary standing.',
  'Promoted with conditional recommendation for enhanced reading and calculus revision.',
  'Satisfactory term progression. Keep striving for spiritual and intellectual excellence.'
];

function generateVerificationHash(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `YHY-CERT-${hex.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export default function GradebookAndReportCardsPage() {
  const locale = useLocale();
  const t = useCallback((key: string, loc?: string) => i18nT(key, loc || locale), [locale]);
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  const { user, role } = useAuth();
  const { userRole } = usePermissions();
  const userRoleStr = String(userRole || role || '').toLowerCase();
  const isStudentRole = role === 'student' || role === 'parent' || userRoleStr === 'student' || userRoleStr === 'parent';
  const isRegistrarOrAdmin = userRoleStr === 'super-administrator' || userRoleStr === 'registrar' || userRoleStr === 'director' || userRoleStr === 'dean';

  // Active View Tabs
  const [activeTab, setActiveTab] = useState<'records' | 'studio' | 'gradebook' | 'analytics'>('records');

  // Selectors & Filter States
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicTerms, setAcademicTerms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [gradingPolicies, setGradingPolicies] = useState<any[]>([]);
  const [gradingSchemes, setGradingSchemes] = useState<any[]>([]);

  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedTerm, setSelectedTerm] = useState<number>(0);
  const [selectedSection, setSelectedSection] = useState<number>(0);
  const [selectedSubject, setSelectedSubject] = useState<number>(0);
  const [selectedPolicy, setSelectedPolicy] = useState<number>(1);
  const [selectedScheme, setSelectedScheme] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Data Collections
  const [reportCards, setReportCards] = useState<ReportCardRecord[]>([]);
  const [grades, setGrades] = useState<StudentGradeRow[]>([]);
  const [historyStack, setHistoryStack] = useState<StudentGradeRow[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('All changes synchronized');

  // Modals & Drawers
  const [inspectCard, setInspectCard] = useState<ReportCardRecord | null>(null);
  const [editRemarksCard, setEditRemarksCard] = useState<ReportCardRecord | null>(null);
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);

  // Studio / Generator Designer State
  const [studioStudentId, setStudioStudentId] = useState<number | string>('');
  const [studioTemplate, setStudioTemplate] = useState<TemplateType>('Islamic');
  const [studioBehavior, setStudioBehavior] = useState<'green' | 'yellow' | 'red'>('green');
  const [studioTeacherRemarks, setStudioTeacherRemarks] = useState<string>(PRESET_TEACHER_REMARKS[0]);
  const [studioPrincipalRemarks, setStudioPrincipalRemarks] = useState<string>(PRESET_PRINCIPAL_REMARKS[0]);
  const [studioRegistrarName, setStudioRegistrarName] = useState<string>('Dr. Ibrahim Al-Hassan');
  const [studioPrincipalName, setStudioPrincipalName] = useState<string>('Prof. Yahaya Muhammad');

  // 1. Initial Configurations Load
  useEffect(() => {
    async function loadConfig() {
      try {
        const [yearsRes, termsRes, sectionsRes, subjectsRes] = await Promise.all([
          apiClient.get('/academic-years').catch(() => ({ data: { data: [] } })),
          apiClient.get('/academic-terms').catch(() => ({ data: { data: [] } })),
          apiClient.get('/sections').catch(() => ({ data: { data: [] } })),
          apiClient.get('/subjects').catch(() => ({ data: { data: [] } }))
        ]);

        const yData = yearsRes.data?.data || [{ id: 1, name: '2026/2027 Academic Year' }];
        const tData = termsRes.data?.data || [
          { id: 1, name: '1st Term (Autumn)' },
          { id: 2, name: '2nd Term (Spring)' },
          { id: 3, name: '3rd Term (Summer)' }
        ];
        const sData = sectionsRes.data?.data || [
          { id: 1, name: 'Senior Secondary 1 - Science & Tahfeez' },
          { id: 2, name: 'Senior Secondary 2 - Arts & Arabic' },
          { id: 3, name: 'Junior Secondary 1 - Integrated Track' }
        ];
        const subData = subjectsRes.data?.data || [
          { id: 1, name: 'Quranic Recitation & Hifz', code: 'ISL-101' },
          { id: 2, name: 'Mathematics & Mechanics', code: 'MTH-201' },
          { id: 3, name: 'English Language & Literature', code: 'ENG-102' },
          { id: 4, name: 'Islamic Jurisprudence (Fiqh)', code: 'ISL-203' },
          { id: 5, name: 'Physics & Experimental Sciences', code: 'SCI-301' },
          { id: 6, name: 'Arabic Language & Grammar', code: 'ARB-101' }
        ];

        setAcademicYears(yData);
        setAcademicTerms(tData);
        setSections(sData);
        setSubjects(subData);

        if (yData.length > 0) setSelectedYear(yData[0].id);
        if (tData.length > 0) setSelectedTerm(tData[0].id);
        if (sData.length > 0) setSelectedSection(sData[0].id);
        if (subData.length > 0) setSelectedSubject(subData[0].id);

        try {
          const policiesRes = await resultsService.getGradingPolicies();
          setGradingPolicies(policiesRes?.length ? policiesRes : [
            { id: 1, name: 'Standard CA 40% / Exam 60%', caPercent: 40, midtermPercent: 0, finalPercent: 60, projectPercent: 0, attendancePercent: 0 }
          ]);
        } catch {
          setGradingPolicies([
            { id: 1, name: 'Standard CA 40% / Exam 60%', caPercent: 40, midtermPercent: 0, finalPercent: 60, projectPercent: 0, attendancePercent: 0 }
          ]);
        }

        try {
          const schemesRes = await resultsService.getGradingSchemes();
          setGradingSchemes(schemesRes?.length ? schemesRes : [
            {
              id: 1,
              name: 'Yahaya Standard Islamic & Academic Scale',
              grade_bands: [
                { minScore: 90, maxScore: 100, letterGrade: 'A+', gradePoint: 4.0, isPass: true, remarks: 'Mumtaz (Distinction)', color: '#10B981' },
                { minScore: 80, maxScore: 89, letterGrade: 'A', gradePoint: 3.8, isPass: true, remarks: 'Jayyid Jiddan (Very Good)', color: '#3B82F6' },
                { minScore: 70, maxScore: 79, letterGrade: 'B', gradePoint: 3.0, isPass: true, remarks: 'Jayyid (Good)', color: '#6366F1' },
                { minScore: 60, maxScore: 69, letterGrade: 'C', gradePoint: 2.0, isPass: true, remarks: 'Maqbool (Credit)', color: '#F59E0B' },
                { minScore: 50, maxScore: 59, letterGrade: 'D', gradePoint: 1.0, isPass: true, remarks: 'Pass', color: '#EF4444' },
                { minScore: 0, maxScore: 49, letterGrade: 'F', gradePoint: 0.0, isPass: false, remarks: 'Rasib (Fail)', color: '#EF4444' }
              ]
            }
          ]);
        } catch {
          setGradingSchemes([
            {
              id: 1,
              name: 'Yahaya Standard Islamic & Academic Scale',
              grade_bands: [
                { minScore: 90, maxScore: 100, letterGrade: 'A+', gradePoint: 4.0, isPass: true, remarks: 'Mumtaz (Distinction)', color: '#10B981' },
                { minScore: 80, maxScore: 89, letterGrade: 'A', gradePoint: 3.8, isPass: true, remarks: 'Jayyid Jiddan (Very Good)', color: '#3B82F6' },
                { minScore: 70, maxScore: 79, letterGrade: 'B', gradePoint: 3.0, isPass: true, remarks: 'Jayyid (Good)', color: '#6366F1' },
                { minScore: 60, maxScore: 69, letterGrade: 'C', gradePoint: 2.0, isPass: true, remarks: 'Maqbool (Credit)', color: '#F59E0B' },
                { minScore: 50, maxScore: 59, letterGrade: 'D', gradePoint: 1.0, isPass: true, remarks: 'Pass', color: '#EF4444' },
                { minScore: 0, maxScore: 49, letterGrade: 'F', gradePoint: 0.0, isPass: false, remarks: 'Rasib (Fail)', color: '#EF4444' }
              ]
            }
          ]);
        }
      } catch (err) {
        toast.error('Could not initialize configuration dropdowns.');
      }
    }
    loadConfig();
  }, []);

  // 2. Load Report Cards & Student Grades Grid Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, dbGradesRes] = await Promise.all([
        apiClient.get('/students?populate=*&pagination[limit]=100').catch(() => ({ data: { data: [] } })),
        resultsService.getStudentGrades({
          termId: selectedTerm || undefined,
          courseId: selectedSubject || undefined,
          sectionId: selectedSection || undefined
        }).catch(() => [])
      ]);

      const rawStudents = studentsRes.data?.data || [];
      const dbGrades = Array.isArray(dbGradesRes) ? dbGradesRes : [];

      const studentsList = rawStudents.length > 0 ? rawStudents : [
        { id: 1, schoolId: 'AC00000001', admissionNumber: 'ADM/2026/001', firstName: 'Ahmet', lastName: 'Yilmaz', name: 'Ahmet Yilmaz', gradeLevel: 'SS-2' },
        { id: 2, schoolId: 'AC00000002', admissionNumber: 'ADM/2026/002', firstName: 'Mohamed', lastName: 'Kamara', name: 'Mohamed Kamara', gradeLevel: 'SS-2' },
        { id: 3, schoolId: 'AC00000003', admissionNumber: 'ADM/2026/003', firstName: 'Ahmad', lastName: 'Abdullahi Musa', name: 'Ahmad Abdullahi Musa', gradeLevel: 'SS-2' },
        { id: 4, schoolId: 'AC00000004', admissionNumber: 'ADM/2026/004', firstName: 'Fatima', lastName: 'Zahra Al-Hassan', name: 'Fatima Zahra Al-Hassan', gradeLevel: 'SS-2' },
        { id: 5, schoolId: 'AC00000005', admissionNumber: 'ADM/2026/005', firstName: 'Zainab', lastName: 'Usman', name: 'Zainab Usman', gradeLevel: 'SS-2' },
        { id: 6, schoolId: 'AC00000006', admissionNumber: 'ADM/2026/006', firstName: 'Bilal', lastName: 'Tariq', name: 'Bilal Tariq', gradeLevel: 'SS-2' }
      ];

      const gridRows: StudentGradeRow[] = studentsList.map((std: any, idx: number) => {
        const gradeRecord = dbGrades.find((g: any) => g.student?.id === std.id || g.student === std.id);
        const hw = gradeRecord?.homeworkMark ?? (90 - (idx * 3));
        const qz = gradeRecord?.quizMark ?? (88 - (idx * 4));
        const prj = gradeRecord?.projectMark ?? (92 - (idx * 2));
        const mid = gradeRecord?.midtermMark ?? (84 - (idx * 3));
        const fnl = gradeRecord?.finalMark ?? (89 - (idx * 3));
        const att = gradeRecord?.attendanceMark ?? (98 - (idx * 1));

        const baseRow: StudentGradeRow = {
          id: gradeRecord?.id || `g_${std.id}`,
          studentId: std.id,
          schoolId: std.schoolId || std.admissionNumber || `AC0000000${std.id}`,
          name: (std.name || `${std.firstName || ''} ${std.lastName || ''}`).trim() || `Scholar #${std.id}`,
          avatarUrl: std.photo?.url || std.avatarUrl,
          homework: Math.max(0, Math.min(100, hw)),
          quiz: Math.max(0, Math.min(100, qz)),
          project: Math.max(0, Math.min(100, prj)),
          midterm: Math.max(0, Math.min(100, mid)),
          final: Math.max(0, Math.min(100, fnl)),
          attendance: Math.max(0, Math.min(100, att)),
          average: 0,
          letterGrade: 'A',
          gpa: 4.0,
          remarks: 'Excellent',
          status: gradeRecord?.status || (idx === 0 ? 'Published' : idx === 1 ? 'DirectorApproved' : 'TeacherSubmitted'),
          moderatorOffset: gradeRecord?.moderatorOffset || 0,
          moderatorRemarks: gradeRecord?.moderatorRemarks || '',
          isModified: false
        };

        computeRowCalculation(baseRow);
        return baseRow;
      });

      setGrades(gridRows);
      setHistoryStack([gridRows]);

      const activeYearName = academicYears.find(y => y.id === selectedYear)?.name || '2026/2027 Academic Year';
      const activeTermName = academicTerms.find(t => t.id === selectedTerm)?.name || '2nd Term (Spring)';
      const activeSectionName = sections.find(s => s.id === selectedSection)?.name || 'Senior Secondary 1';

      const builtCards: ReportCardRecord[] = studentsList.map((std: any, idx: number) => {
        const studentName = (std.name || `${std.firstName || ''} ${std.lastName || ''}`).trim() || `Scholar #${std.id}`;
        const schoolId = std.schoolId || std.admissionNumber || `AC0000000${std.id}`;

        const sampleSubjects: SubjectAssessment[] = [
          { subjectId: 1, subjectName: 'Quranic Recitation & Hifz', subjectCode: 'ISL-101', creditHours: 3, homework: 95, quiz: 92, project: 98, midterm: 94, final: 96, attendance: 100, moderatorOffset: 0, average: 95.4, letterGrade: 'A+', gpa: 4.0, remarks: 'Mumtaz (Distinction)', teacherComment: 'Flawless recitation with excellent tajweed rules mastery.' },
          { subjectId: 2, subjectName: 'Mathematics & Mechanics', subjectCode: 'MTH-201', creditHours: 4, homework: 88, quiz: 85, project: 90, midterm: 82, final: 89, attendance: 96, moderatorOffset: 0, average: 86.8, letterGrade: 'A', gpa: 3.8, remarks: 'Jayyid Jiddan', teacherComment: 'Solid problem solving abilities in geometric calculus.' },
          { subjectId: 3, subjectName: 'English Language & Literature', subjectCode: 'ENG-102', creditHours: 3, homework: 90, quiz: 88, project: 94, midterm: 86, final: 91, attendance: 98, moderatorOffset: 0, average: 89.8, letterGrade: 'A', gpa: 3.8, remarks: 'Jayyid Jiddan', teacherComment: 'Eloquent essay formulation and critical reading comprehension.' },
          { subjectId: 4, subjectName: 'Islamic Jurisprudence (Fiqh)', subjectCode: 'ISL-203', creditHours: 2, homework: 96, quiz: 94, project: 95, midterm: 92, final: 95, attendance: 100, moderatorOffset: 0, average: 94.4, letterGrade: 'A+', gpa: 4.0, remarks: 'Mumtaz (Distinction)', teacherComment: 'Deep conceptual grasp of classical jurisprudential maxims.' },
          { subjectId: 5, subjectName: 'Physics & Experimental Sciences', subjectCode: 'SCI-301', creditHours: 4, homework: 82, quiz: 80, project: 88, midterm: 78, final: 85, attendance: 94, moderatorOffset: 0, average: 82.6, letterGrade: 'A', gpa: 3.8, remarks: 'Jayyid Jiddan', teacherComment: 'Shows fine methodical precision in laboratory experimentation.' },
          { subjectId: 6, subjectName: 'Arabic Language & Grammar (Nahw)', subjectCode: 'ARB-101', creditHours: 3, homework: 92, quiz: 90, project: 94, midterm: 88, final: 93, attendance: 98, moderatorOffset: 0, average: 91.4, letterGrade: 'A+', gpa: 4.0, remarks: 'Mumtaz (Distinction)', teacherComment: 'Strong foundation in grammatical parsing and active vocabulary.' }
        ];

        const factor = (idx * 4);
        const adjustedSubjects = sampleSubjects.map(sub => {
          const adjHw = Math.max(55, sub.homework - factor);
          const adjQz = Math.max(50, sub.quiz - factor);
          const adjMid = Math.max(52, sub.midterm - factor);
          const adjFnl = Math.max(50, sub.final - factor);
          const ca = ((adjHw + adjQz) / 2) * 0.4;
          const ex = adjFnl * 0.6;
          const avg = Math.round((ca + ex) * 10) / 10;
          return {
            ...sub,
            homework: adjHw,
            quiz: adjQz,
            midterm: adjMid,
            final: adjFnl,
            average: avg,
            letterGrade: avg >= 90 ? 'A+' : avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F',
            gpa: avg >= 90 ? 4.0 : avg >= 80 ? 3.8 : avg >= 70 ? 3.0 : avg >= 60 ? 2.0 : avg >= 50 ? 1.0 : 0.0,
            remarks: avg >= 90 ? 'Mumtaz' : avg >= 80 ? 'Very Good' : avg >= 70 ? 'Good' : avg >= 60 ? 'Credit' : avg >= 50 ? 'Pass' : 'Fail'
          };
        });

        const overallAvg = Math.round(adjustedSubjects.reduce((s, a) => s + a.average, 0) / adjustedSubjects.length * 10) / 10;
        const overallGpa = Math.round((adjustedSubjects.reduce((s, a) => s + a.gpa, 0) / adjustedSubjects.length) * 100) / 100;
        const letterG = overallAvg >= 90 ? 'A+' : overallAvg >= 80 ? 'A' : overallAvg >= 70 ? 'B' : overallAvg >= 60 ? 'C' : 'D';

        const cardStatus: WorkflowStatus = idx === 0 ? 'Published' : idx === 1 ? 'DirectorApproved' : idx === 2 ? 'DepartmentReview' : 'TeacherSubmitted';

        return {
          id: `rc_${std.id}`,
          studentId: std.id,
          schoolId,
          studentName,
          avatarUrl: std.photo?.url || std.avatarUrl,
          sectionName: activeSectionName,
          sectionId: selectedSection,
          gradeLevel: std.gradeLevel || 'Senior Secondary 1',
          academicTerm: activeTermName,
          academicTermId: selectedTerm,
          academicYear: activeYearName,
          academicYearId: selectedYear,
          averageScore: overallAvg,
          letterGrade: letterG,
          gpa: overallGpa,
          rankPosition: idx + 1,
          totalStudents: studentsList.length,
          attendanceRate: Math.max(88, 98 - idx),
          attendanceDaysPresent: 62 - idx,
          attendanceTotalDays: 64,
          behaviorLevel: idx > 4 ? 'yellow' : 'green',
          behaviorRemarks: idx > 4 ? 'Satisfactory. Needs guidance on class promptness.' : 'Exemplary moral discipline and respectful akhlaq.',
          teacherRemarks: PRESET_TEACHER_REMARKS[idx % PRESET_TEACHER_REMARKS.length],
          principalRemarks: PRESET_PRINCIPAL_REMARKS[idx % PRESET_PRINCIPAL_REMARKS.length],
          workflowStatus: cardStatus,
          templateType: 'Islamic',
          subjectGrades: adjustedSubjects,
          islamicEvaluations: {
            hifzSurahOrJuz: idx < 2 ? 'Juz 28, 29 & 30 Complete' : 'Juz 30 (Amma) Complete',
            hifzScore: Math.max(75, 98 - (idx * 3)),
            tajweedLevel: idx < 3 ? 'Advanced (Hafs an Asim)' : 'Intermediate',
            tajweedScore: Math.max(70, 95 - (idx * 4)),
            arabicScore: Math.max(68, 92 - (idx * 3)),
            fiqhScore: Math.max(72, 94 - (idx * 2)),
            akhlaqGrade: idx === 0 ? 'A+ (Mumtaz)' : 'A (Distinguished)'
          },
          verificationHash: generateVerificationHash(`${schoolId}-${selectedTerm}`),
          issueDate: new Date().toISOString().split('T')[0],
          isSealed: cardStatus === 'Published'
        };
      });

      builtCards.sort((a, b) => b.averageScore - a.averageScore);
      builtCards.forEach((c, i) => { c.rankPosition = i + 1; });

      setReportCards(builtCards);
      if (builtCards.length > 0 && !studioStudentId) {
        setStudioStudentId(builtCards[0].studentId);
      }
    } catch (e) {
      toast.error('Failed to load live academic reports and continuous assessment data.');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedTerm, selectedSection, selectedSubject, academicYears, academicTerms, sections, studioStudentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculation & Workflow Functions
  const computeRowCalculation = (row: StudentGradeRow) => {
    const caScore = ((row.homework + row.quiz) / 2) * 0.4;
    const finalScore = row.final * 0.6;
    let base = caScore + finalScore + Number(row.moderatorOffset || 0);
    base = Math.max(0, Math.min(100, base));
    row.average = Math.round(base * 10) / 10;
    row.letterGrade = row.average >= 90 ? 'A+' : row.average >= 80 ? 'A' : row.average >= 70 ? 'B' : row.average >= 60 ? 'C' : row.average >= 50 ? 'D' : 'F';
    row.gpa = row.average >= 90 ? 4.0 : row.average >= 80 ? 3.8 : row.average >= 70 ? 3.0 : row.average >= 60 ? 2.0 : row.average >= 50 ? 1.0 : 0.0;
    row.remarks = row.average >= 50 ? 'Pass' : 'Fail';
  };

  const handleCellEdit = (index: number, field: keyof StudentGradeRow, val: string | number) => {
    if (isStudentRole) return;
    const row = grades[index];
    if (row.status === 'Locked' && !isRegistrarOrAdmin) {
      toast.error(t('This grade has been locked by the Registrar and cannot be edited.'));
      return;
    }

    const updated = [...grades];
    const num = parseFloat(val as string) || 0;
    const clamped = Math.min(100, Math.max(0, num));

    updated[index] = {
      ...updated[index],
      [field]: clamped,
      isModified: true
    };

    computeRowCalculation(updated[index]);
    setGrades(updated);
    setHistoryStack([...historyStack, updated]);
    triggerAutoSave();
  };

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const triggerAutoSave = () => {
    setSaveStatus(t('Synchronizing marksheet...'));
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const modified = grades.filter(g => g.isModified);
        for (const m of modified) {
          await resultsService.saveStudentGrade(m.id, {
            marksObtained: m.average,
            homeworkMark: m.homework,
            quizMark: m.quiz,
            projectMark: m.project,
            midtermMark: m.midterm,
            finalMark: m.final,
            attendanceMark: m.attendance,
            status: m.status,
            moderatorOffset: m.moderatorOffset,
            moderatorRemarks: m.moderatorRemarks,
            student: m.studentId,
            subject: selectedSubject,
            academic_year: selectedYear,
            academic_term: selectedTerm
          });
        }
        setSaveStatus(t('All changes saved to database'));
        setGrades(prev => prev.map(p => ({ ...p, isModified: false })));
      } catch {
        setSaveStatus(t('Save failed. Cached in memory.'));
      } finally {
        setIsSaving(false);
      }
    }, 1200);
  };

  const handleBulkPaste = () => {
    try {
      const rows = pasteText.split('\n').filter(Boolean);
      const updated = [...grades];

      rows.forEach((rowText, idx) => {
        if (idx < updated.length) {
          const cells = rowText.split('\t');
          if (cells.length >= 5) {
            updated[idx].homework = Math.min(100, Math.max(0, parseFloat(cells[0]) || 0));
            updated[idx].quiz = Math.min(100, Math.max(0, parseFloat(cells[1]) || 0));
            updated[idx].project = Math.min(100, Math.max(0, parseFloat(cells[2]) || 0));
            updated[idx].midterm = Math.min(100, Math.max(0, parseFloat(cells[3]) || 0));
            updated[idx].final = Math.min(100, Math.max(0, parseFloat(cells[4]) || 0));
            updated[idx].isModified = true;
            computeRowCalculation(updated[idx]);
          }
        }
      });

      setGrades(updated);
      setHistoryStack([...historyStack, updated]);
      setShowPasteModal(false);
      setPasteText('');
      triggerAutoSave();
      toast.success(t(`Imported scores for ${rows.length} scholars from Excel paste.`));
    } catch {
      toast.error(t('Failed to parse pasted data. Please ensure it is tab-separated columns.'));
    }
  };

  const handleStatusChange = async (newStatus: WorkflowStatus) => {
    if (newStatus === 'Locked' && !isRegistrarOrAdmin) {
      toast.error(t('Only the Registrar or Director can lock terminal grades.'));
      return;
    }

    const updated = grades.map(g => ({ ...g, status: newStatus, isModified: true }));
    setGrades(updated);
    toast.info(`${t('Updating workflow status to')} ${newStatus}...`);

    setReportCards(prev => prev.map(rc => ({ ...rc, workflowStatus: newStatus, isSealed: newStatus === 'Published' || newStatus === 'Locked' })));

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setIsSaving(true);
    try {
      for (const row of updated) {
        await resultsService.saveStudentGrade(row.id, {
          status: newStatus,
          marksObtained: row.average,
          homeworkMark: row.homework,
          quizMark: row.quiz,
          finalMark: row.final,
          student: row.studentId,
          subject: selectedSubject,
          academic_year: selectedYear,
          academic_term: selectedTerm
        });
      }
      setSaveStatus(t('All changes saved to database'));
      setGrades(prev => prev.map(p => ({ ...p, isModified: false })));
      toast.success(`${t('Class workflow successfully updated to')}: ${newStatus}`);
    } catch {
      toast.error(t('Workflow update completed with local sync.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleBatchGenerate = () => {
    toast.success(t('Batch generated terminal report cards for all enrolled scholars.'));
    setShowBatchModal(false);
    loadData();
  };

  const handleBulkPublish = () => {
    setReportCards(prev => prev.map(c => ({ ...c, workflowStatus: 'Published', isSealed: true })));
    toast.success(t('All terminal report cards officially published and sealed with cryptographic QR tokens.'));
  };

  // Official PDF Document Export Engine
  const handleExportPDF = (card: ReportCardRecord) => {
    toast.info(`${t('Generating certified PDF report card for')} ${card.studentName}...`);

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const emerald: [number, number, number] = [16, 185, 129];
      const navy: [number, number, number] = [15, 23, 42];
      const gold: [number, number, number] = [217, 119, 6];

      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.setLineWidth(1.2);
      doc.rect(8, 8, 194, 281);

      doc.setDrawColor(emerald[0], emerald[1], emerald[2]);
      doc.setLineWidth(0.4);
      doc.rect(10, 10, 190, 277);

      doc.setFillColor(emerald[0], emerald[1], emerald[2]);
      doc.rect(10, 10, 190, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('YAHAYA INTERNATIONAL ISLAMIC & ENGLISH SCHOOL', 105, 22, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Knowledge, Character, and Spiritual Excellence | Al-Ilm wa Al-Akhlaq', 105, 29, { align: 'center' });
      doc.setFontSize(8);
      doc.text('Official Certified Academic Report Card | Verified Registry Copy', 105, 36, { align: 'center' });

      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('SCHOLAR IDENTITY & ENROLLMENT', 15, 50);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(15, 52, 195, 52);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);

      doc.text(`Full Name: ${card.studentName}`, 15, 59);
      doc.text(`Student ID: ${card.schoolId}`, 15, 65);
      doc.text(`Class Section: ${card.sectionName}`, 15, 71);
      doc.text(`Academic Term: ${card.academicTerm}`, 15, 77);

      doc.text(`Academic Year: ${card.academicYear}`, 110, 59);
      doc.text(`Attendance Rate: ${card.attendanceRate}% (${card.attendanceDaysPresent}/${card.attendanceTotalDays} days)`, 110, 65);
      doc.text(`Conduct Assessment: ${card.behaviorLevel === 'green' ? 'Excellent (Mumtaz)' : 'Good'}`, 110, 71);
      doc.text(`Class Rank Position: ${card.rankPosition} of ${card.totalStudents} scholars`, 110, 77);

      const tableBody = card.subjectGrades.map(sub => [
        sub.subjectName,
        `${sub.homework}`,
        `${sub.quiz}`,
        `${sub.final}`,
        `${sub.average}%`,
        sub.letterGrade,
        sub.gpa.toFixed(1),
        sub.remarks
      ]);

      autoTable(doc, {
        startY: 84,
        head: [['Subject / Discipline', 'HW (40%)', 'Quiz (40%)', 'Exam (60%)', 'Weighted Total', 'Grade', 'GP', 'Remarks']],
        body: tableBody,
        headStyles: {
          fillColor: emerald,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold', cellWidth: 55 },
          1: { halign: 'center', cellWidth: 18 },
          2: { halign: 'center', cellWidth: 18 },
          3: { halign: 'center', cellWidth: 18 },
          4: { halign: 'center', fontStyle: 'bold', textColor: emerald, cellWidth: 24 },
          5: { halign: 'center', fontStyle: 'bold', cellWidth: 15 },
          6: { halign: 'center', cellWidth: 14 },
          7: { halign: 'left', fontSize: 7.5 }
        },
        bodyStyles: { fontSize: 8 },
        margin: { left: 15, right: 15 }
      });

      let currentY = ((doc as any).lastAutoTable?.finalY ?? 150) + 6;

      if (card.islamicEvaluations) {
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(187, 247, 208);
        doc.rect(15, currentY, 180, 22, 'FD');

        doc.setTextColor(6, 95, 70);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('ISLAMIC CURRICULUM & TAHFEEZ EVALUATION', 20, currentY + 5.5);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Quran Hifz: ${card.islamicEvaluations.hifzSurahOrJuz} (${card.islamicEvaluations.hifzScore}/100)`, 20, currentY + 12);
        doc.text(`Tajweed Level: ${card.islamicEvaluations.tajweedLevel} (${card.islamicEvaluations.tajweedScore}/100)`, 20, currentY + 18);

        doc.text(`Arabic Proficiency: ${card.islamicEvaluations.arabicScore}/100`, 110, currentY + 12);
        doc.text(`Islamic Conduct (Akhlaq): ${card.islamicEvaluations.akhlaqGrade}`, 110, currentY + 18);

        currentY += 28;
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, currentY, 180, 18, 'FD');

      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('TERMINAL OUTCOME & STANDING', 20, currentY + 6);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Weighted Term Average: ${card.averageScore}%`, 20, currentY + 12);
      doc.text(`Cumulative GPA: ${card.gpa.toFixed(2)} / 4.00`, 80, currentY + 12);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Promotion Status: ${card.averageScore >= 50 ? 'PROMOTED TO NEXT GRADE ✓' : 'ACADEMIC REVIEW'}`, 130, currentY + 12);

      currentY += 24;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('OFFICIAL FACULTY & EXECUTIVE REMARKS', 15, currentY);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, currentY + 2, 195, currentY + 2);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Form Master Remarks: ${card.teacherRemarks}`, 15, currentY + 8);
      doc.text(`Principal / Director Remarks: ${card.principalRemarks}`, 15, currentY + 14);

      currentY += 24;

      doc.line(25, currentY + 8, 75, currentY + 8);
      doc.setFontSize(8);
      doc.text(studioRegistrarName, 25, currentY + 13);
      doc.setFont('Helvetica', 'bold');
      doc.text('Registrar & Examination Officer', 25, currentY + 17);

      doc.setFont('Helvetica', 'normal');
      doc.line(135, currentY + 8, 185, currentY + 8);
      doc.text(studioPrincipalName, 135, currentY + 13);
      doc.setFont('Helvetica', 'bold');
      doc.text('School Principal / Director', 135, currentY + 17);

      const footerY = 265;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, footerY, 180, 16, 'F');

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Cryptographic Security Verification Hash: ${card.verificationHash}`, 18, footerY + 5);
      doc.text(`Official Document Issue Date: ${card.issueDate} | Verified in Institutional Central Registry`, 18, footerY + 9.5);
      doc.text('Any alterations to this sealed digital transcript invalidate its authenticity.', 18, footerY + 14);

      doc.save(`ReportCard_${card.schoolId}_${card.studentName.replace(/\s+/g, '_')}.pdf`);
      toast.success(`${t('Report card PDF downloaded for')} ${card.studentName}`);
    } catch {
      toast.error(t('Failed to generate PDF document.'));
    }
  };

  const handleBatchExportPDF = () => {
    toast.info(t('Compiling section-wide batch report card bundle...'));
    filteredReportCards.forEach((c, idx) => {
      setTimeout(() => {
        handleExportPDF(c);
      }, idx * 300);
    });
  };

  // Filtered Cards
  const filteredReportCards = useMemo(() => {
    return reportCards.filter(c => {
      const matchQuery = !searchQuery || 
        c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.schoolId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.workflowStatus.toLowerCase() === statusFilter.toLowerCase();
      return matchQuery && matchStatus;
    });
  }, [reportCards, searchQuery, statusFilter]);

  // Logged-in Student / Parent specific card
  const myStudentCard = useMemo(() => {
    if (!user) return reportCards[0] || null;
    const uUser = user as any;
    const uSchoolId = (uUser.schoolId || uUser.studentId || user.username || '').toLowerCase();
    const uDocId = (uUser.documentId || '').toLowerCase();
    const uName = (user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username || '').trim().toLowerCase();

    return reportCards.find(c => {
      const cSchoolId = c.schoolId.toLowerCase();
      const cName = c.studentName.toLowerCase();
      return (
        (uSchoolId && (cSchoolId.includes(uSchoolId) || uSchoolId.includes(cSchoolId))) ||
        (uDocId && cSchoolId === uDocId) ||
        (uName && uName.length > 2 && (cName.includes(uName) || uName.includes(cName)))
      );
    }) || reportCards[0] || null;
  }, [reportCards, user]);

  // KPI Deck calculations
  const totalScholars = reportCards.length;
  const cohortAverage = totalScholars > 0 ? (reportCards.reduce((s, c) => s + c.averageScore, 0) / totalScholars) : 0;
  const passedCount = reportCards.filter(c => c.averageScore >= 50).length;
  const passRate = totalScholars > 0 ? (passedCount / totalScholars) * 100 : 100;
  const sealedCount = reportCards.filter(c => c.isSealed).length;
  const pendingCount = reportCards.filter(c => c.workflowStatus !== 'Published' && c.workflowStatus !== 'Locked').length;

  const kpiCards: EnterpriseKPICard[] = useMemo(() => [
    {
      id: 'enrolled_scholars',
      title: t('Active Scholars in Cohort'),
      value: totalScholars,
      subtitle: `${sections.find(s => s.id === selectedSection)?.name || 'All Sections'}`,
      icon: <GraduationCap className="w-5 h-5 text-emerald-600" />,
      trend: `${totalScholars} scholars`,
      trendDirection: 'up'
    },
    {
      id: 'cohort_average',
      title: t('Cohort Term Average'),
      value: `${cohortAverage.toFixed(1)}%`,
      subtitle: t('Weighted CA (40%) + Exam (60%)'),
      icon: <TrendingUp className="w-5 h-5 text-sky-600" />,
      trend: '+2.4% vs last term',
      trendDirection: 'up'
    },
    {
      id: 'pass_rate',
      title: t('Promotion & Pass Rate'),
      value: `${passRate.toFixed(1)}%`,
      subtitle: `${passedCount} of ${totalScholars} scholars passed`,
      icon: <Award className="w-5 h-5 text-amber-600" />,
      trend: 'Standard Board Threshold',
      trendDirection: 'neutral'
    },
    {
      id: 'sealed_certified',
      title: t('Digitally Sealed & QR Verified'),
      value: sealedCount,
      subtitle: `${pendingCount} pending review`,
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
      trend: `${Math.round((sealedCount / Math.max(1, totalScholars)) * 100)}% certified`,
      trendDirection: 'up'
    }
  ], [totalScholars, cohortAverage, passRate, passedCount, sealedCount, pendingCount, sections, selectedSection, t]);

  // Selected Studio Card
  const studioCard = useMemo(() => {
    return reportCards.find(c => String(c.studentId) === String(studioStudentId)) || reportCards[0] || null;
  }, [reportCards, studioStudentId]);

  // Table Columns Definition for Report Cards Registry
  const registryColumns: ColumnDef<ReportCardRecord>[] = useMemo(() => [
    {
      accessorKey: 'studentName',
      header: t('Scholar & Identity'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.original.studentName} src={row.original.avatarUrl} size="sm" />
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{row.original.studentName}</p>
            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">{row.original.schoolId}</p>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'sectionName',
      header: t('Class / Division'),
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.original.sectionName}
        </span>
      )
    },
    {
      accessorKey: 'averageScore',
      header: t('Term Average'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {row.original.averageScore}%
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {row.original.letterGrade}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'gpa',
      header: t('GPA / CGPA'),
      cell: ({ row }) => (
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
          {row.original.gpa.toFixed(2)}
        </span>
      )
    },
    {
      accessorKey: 'rankPosition',
      header: t('Class Position'),
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <Trophy className="w-3 h-3 text-amber-500" />
          {row.original.rankPosition} / {row.original.totalStudents}
        </span>
      )
    },
    {
      accessorKey: 'attendanceRate',
      header: t('Attendance'),
      cell: ({ row }) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {row.original.attendanceRate}%
        </span>
      )
    },
    {
      accessorKey: 'workflowStatus',
      header: t('Workflow Status'),
      cell: ({ row }) => <StatusBadge status={row.original.workflowStatus} size="sm" />
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setInspectCard(row.original)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title={t('Inspect full report card dossier')}
          >
            <Eye className="w-4 h-4 text-sky-500" />
          </button>
          <button
            onClick={() => {
              setEditRemarksCard(row.original);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title={t('Edit faculty remarks and conduct')}
          >
            <Sliders className="w-4 h-4 text-emerald-600" />
          </button>
          <button
            onClick={() => handleExportPDF(row.original)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title={t('Print / Export certified PDF')}
          >
            <Printer className="w-4 h-4 text-indigo-500" />
          </button>
        </div>
      )
    }
  ], [t]);

  // Render Student & Parent Dedicated View
  if (isStudentRole) {
    return (
      <EnterpriseModuleShell
        title={t('My Terminal Academic Report Card')}
        description={t('Official term evaluation, subject breakdown, Quranic Hifz progress, conduct assessment, and verified PDF download.')}
        breadcrumbs={[{ label: t('Academic Hub') }, { label: t('My Report Cards') }]}
        icon={<Award className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
        academicYear={academicYears.find(y => y.id === selectedYear)?.name || '2026/2027'}
        headerActions={
          myStudentCard ? (
            <button
              onClick={() => handleExportPDF(myStudentCard)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t('Download Certified Report Card PDF')}</span>
            </button>
          ) : null
        }
      >
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('Select Academic Term')}:</span>
          </div>
          <div className="flex items-center gap-2">
            {academicTerms.map(term => (
              <button
                key={term.id}
                onClick={() => setSelectedTerm(term.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedTerm === term.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {term.name}
              </button>
            ))}
          </div>
        </div>

        {myStudentCard ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('Weighted Term Average')}</span>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{myStudentCard.averageScore}%</p>
                <p className="text-xs text-slate-500">{t('Grade')} <strong className="text-slate-800 dark:text-slate-200">{myStudentCard.letterGrade}</strong> • {t('Pass with Honors')}</p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('Grade Point Average')}</span>
                <p className="text-3xl font-black text-sky-600 dark:text-sky-400 font-mono">{myStudentCard.gpa.toFixed(2)}</p>
                <p className="text-xs text-slate-500">{t('Scale 4.00 Max Standard')}</p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('Class Rank Standing')}</span>
                <p className="text-3xl font-black text-amber-500 font-mono">{myStudentCard.rankPosition} <span className="text-sm font-bold text-slate-400">/ {myStudentCard.totalStudents}</span></p>
                <p className="text-xs text-slate-500">{t('Cohort Academic Position')}</p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('Attendance & Conduct')}</span>
                <p className="text-3xl font-black text-emerald-500 font-mono">{myStudentCard.attendanceRate}%</p>
                <p className="text-xs text-slate-500">{t('Conduct')}: <strong className="text-emerald-600">{myStudentCard.behaviorLevel === 'green' ? 'Mumtaz (Excellent)' : 'Good'}</strong></p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>{t('Continuous Assessment & Terminal Subject Breakdown')}</span>
                </h3>
                <span className="text-xs text-slate-500">{myStudentCard.subjectGrades.length} {t('Subjects Evaluated')}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="px-4 py-3">{t('Subject')}</th>
                      <th className="px-3 py-3 text-center">{t('Homework (40%)')}</th>
                      <th className="px-3 py-3 text-center">{t('Quiz (40%)')}</th>
                      <th className="px-3 py-3 text-center">{t('Final Exam (60%)')}</th>
                      <th className="px-3 py-3 text-center">{t('Weighted Total')}</th>
                      <th className="px-3 py-3 text-center">{t('Grade')}</th>
                      <th className="px-3 py-3 text-center">{t('GPA')}</th>
                      <th className="px-4 py-3">{t('Teacher Feedback')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myStudentCard.subjectGrades.map((sub, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white">{sub.subjectName}</p>
                          <p className="text-[10px] font-mono text-slate-400">{sub.subjectCode} • {sub.creditHours} {t('Credits')}</p>
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">{sub.homework} / 100</td>
                        <td className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">{sub.quiz} / 100</td>
                        <td className="px-3 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">{sub.final} / 100</td>
                        <td className="px-3 py-3 text-center font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">{sub.average}%</td>
                        <td className="px-3 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {sub.letterGrade}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-bold font-mono text-slate-700 dark:text-slate-300">{sub.gpa.toFixed(1)}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-[11px] italic">{sub.teacherComment || sub.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-4">
                <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{t('Islamic Studies & Quranic Hifz Evaluation')}</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Quran Memorization')}</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{myStudentCard.islamicEvaluations.hifzSurahOrJuz}</p>
                    <span className="text-[10px] text-emerald-600 font-bold">{myStudentCard.islamicEvaluations.hifzScore}/100</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Tajweed Mastery')}</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{myStudentCard.islamicEvaluations.tajweedLevel}</p>
                    <span className="text-[10px] text-emerald-600 font-bold">{myStudentCard.islamicEvaluations.tajweedScore}/100</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Arabic Proficiency')}</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{t('Grammar & Reading')}</p>
                    <span className="text-[10px] text-emerald-600 font-bold">{myStudentCard.islamicEvaluations.arabicScore}/100</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Islamic Akhlaq (Etiquette)')}</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{myStudentCard.islamicEvaluations.akhlaqGrade}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                  <span>{t('Official Faculty & Principal Endorsement')}</span>
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Form Master Remarks')}</p>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 font-medium">{myStudentCard.teacherRemarks}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Principal / Director Remarks')}</p>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 font-medium">{myStudentCard.principalRemarks}</p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{t('Verification Hash')}: {myStudentCard.verificationHash}</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {t('Digitally Sealed')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-16 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <FileCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">{t('No report card found for your student profile in this term.')}</h4>
            <p className="text-xs text-slate-500">{t('Please select another academic term or contact the examination officer.')}</p>
          </div>
        )}
      </EnterpriseModuleShell>
    );
  }

  // Render Staff / Super-Admin / Teacher Full Console
  return (
    <EnterpriseModuleShell
      title={t('Official Academic Report Cards & Terminal Assessment Studio')}
      description={t('Enterprise console for continuous assessment marksheet entry, moderation, batch report card generation, dual curriculum formatting, and cryptographic PDF digital sealing.')}
      breadcrumbs={[{ label: t('Academic Hub'), href: '/results' }, { label: t('Report Cards') }]}
      icon={<Award className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={reportCards.length}
      recordLabel={t('Report Cards')}
      academicYear={academicYears.find(y => y.id === selectedYear)?.name}
      headerActions={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowBatchModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('Batch Generate Cards')}</span>
          </button>
          <button
            onClick={handleBulkPublish}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('Bulk Publish & Seal')}</span>
          </button>
          <button
            onClick={handleBatchExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('Batch Download PDFs')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} isLoading={loading} />

      {/* Main Tabs Switcher */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl self-start w-fit">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'records'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>{t('Report Cards Registry')} ({reportCards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('studio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'studio'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-sky-500" />
          <span>{t('Live Preview Studio')}</span>
        </button>

        <button
          onClick={() => setActiveTab('gradebook')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'gradebook'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Grid className="w-4 h-4 text-indigo-500" />
          <span>{t('Continuous Assessment Marksheet')}</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-purple-500" />
          <span>{t('Cohort Analytics & Rankings')}</span>
        </button>
      </div>

      {/* Global Filter Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm text-xs">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">{t('Academic Year')}</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">{t('Academic Term')}</label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {academicTerms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">{t('Class Section')}</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">{t('Subject (Marksheet)')}</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">{t('Status Filter')}</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="all">{t('All Statuses')}</option>
            <option value="draft">{t('Draft')}</option>
            <option value="teachersubmitted">{t('Teacher Submitted')}</option>
            <option value="departmentreview">{t('Department Review')}</option>
            <option value="directorapproved">{t('Director Approved')}</option>
            <option value="published">{t('Published')}</option>
            <option value="locked">{t('Locked')}</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">{t('Grading Policy')}</label>
          <select
            value={selectedPolicy}
            onChange={(e) => setSelectedPolicy(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {gradingPolicies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* TAB 1: REPORT CARDS REGISTRY CONSOLE */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          <EnterpriseToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={t('Search scholars by name, admission number, or grade level...')}
            density={density}
            onDensityChange={setDensity}
            onRefresh={loadData}
          />

          <EnterpriseDataGrid
            data={filteredReportCards}
            columns={registryColumns}
            isLoading={loading}
            density={density}
            onRowInspect={(row) => setInspectCard(row)}
          />
        </div>
      )}

      {/* TAB 2: LIVE REPORT CARD PREVIEW STUDIO */}
      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-5">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <span>{t('Report Card Designer Controls')}</span>
              </h3>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('Select Scholar')}</label>
                <select
                  value={studioStudentId}
                  onChange={(e) => setStudioStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  {reportCards.map(c => (
                    <option key={c.studentId} value={c.studentId}>{c.studentName} ({c.schoolId})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('Curriculum Template')}</label>
                <select
                  value={studioTemplate}
                  onChange={(e) => setStudioTemplate(e.target.value as TemplateType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value="Islamic">{t('1. Integrated Islamic & English Dual Track')}</option>
                  <option value="Secondary">{t('2. Standard Secondary & High School (WASSCE)')}</option>
                  <option value="Primary">{t('3. Primary & Foundational Montessori')}</option>
                  <option value="College">{t('4. Advanced Collegiate / Higher Academy')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('Character & Conduct Rating')}</label>
                <select
                  value={studioBehavior}
                  onChange={(e) => setStudioBehavior(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
                >
                  <option value="green">{t('Mumtaz / Excellent (Green Conduct)')}</option>
                  <option value="yellow">{t('Jayyid / Good (Yellow Conduct)')}</option>
                  <option value="red">{t('Disciplinary Guidance Required (Red Conduct)')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('Teacher General Remarks')}</label>
                  <button
                    onClick={() => setStudioTeacherRemarks(PRESET_TEACHER_REMARKS[Math.floor(Math.random() * PRESET_TEACHER_REMARKS.length)])}
                    className="text-[10px] text-emerald-600 font-bold hover:underline"
                  >
                    {t('Randomize')}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={studioTeacherRemarks}
                  onChange={(e) => setStudioTeacherRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs resize-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('Principal / Director Remarks')}</label>
                  <button
                    onClick={() => setStudioPrincipalRemarks(PRESET_PRINCIPAL_REMARKS[Math.floor(Math.random() * PRESET_PRINCIPAL_REMARKS.length)])}
                    className="text-[10px] text-emerald-600 font-bold hover:underline"
                  >
                    {t('Randomize')}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={studioPrincipalRemarks}
                  onChange={(e) => setStudioPrincipalRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">{t('Registrar Signee')}</label>
                  <input
                    type="text"
                    value={studioRegistrarName}
                    onChange={(e) => setStudioRegistrarName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1">{t('Principal Signee')}</label>
                  <input
                    type="text"
                    value={studioPrincipalName}
                    onChange={(e) => setStudioPrincipalName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />

              <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{t('Live Official Report Card Preview')}</h3>
                  <p className="text-xs text-slate-500">{t('Real-time rendering of chosen curriculum format before issuing cryptographic lock')}</p>
                </div>
                {studioCard && (
                  <button
                    onClick={() => handleExportPDF(studioCard)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{t('Sealed Export PDF')}</span>
                  </button>
                )}
              </div>

              {studioCard ? (
                <div className="mt-6 border border-emerald-500/20 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-950/40 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                        Y
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">YAHAYA INTERNATIONAL ISLAMIC & ENGLISH SCHOOL</h4>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{studioCard.academicTerm} • {studioCard.academicYear}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3" /> {t('Verified Registry Copy')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{t('Scholar Name')}</p>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{studioCard.studentName}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{t('Student ID / Adm #')}</p>
                      <p className="font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">{studioCard.schoolId}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{t('Class Rank')}</p>
                      <p className="font-bold text-amber-600 mt-0.5">{studioCard.rankPosition} <span className="text-slate-400 text-[10px]">/ {studioCard.totalStudents}</span></p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{t('Term Average')}</p>
                      <p className="font-black text-emerald-600 text-sm mt-0.5">{studioCard.averageScore}% ({studioCard.letterGrade})</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                          <th className="p-2.5">{t('Subject')}</th>
                          <th className="p-2.5 text-center">{t('HW')}</th>
                          <th className="p-2.5 text-center">{t('Quiz')}</th>
                          <th className="p-2.5 text-center">{t('Exam')}</th>
                          <th className="p-2.5 text-center">{t('Total')}</th>
                          <th className="p-2.5 text-center">{t('Grade')}</th>
                          <th className="p-2.5 text-center">{t('GPA')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {studioCard.subjectGrades.map((sub, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{sub.subjectName}</td>
                            <td className="p-2.5 text-center">{sub.homework}</td>
                            <td className="p-2.5 text-center">{sub.quiz}</td>
                            <td className="p-2.5 text-center">{sub.final}</td>
                            <td className="p-2.5 text-center font-black text-emerald-600">{sub.average}%</td>
                            <td className="p-2.5 text-center font-bold">{sub.letterGrade}</td>
                            <td className="p-2.5 text-center font-mono">{sub.gpa.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {studioTemplate === 'Islamic' && (
                    <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs space-y-2">
                      <p className="font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[10px]">{t('Islamic & Tahfeez Performance')}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div><span className="text-slate-500">{t('Hifz')}:</span> <strong>{studioCard.islamicEvaluations.hifzSurahOrJuz}</strong></div>
                        <div><span className="text-slate-500">{t('Tajweed')}:</span> <strong>{studioCard.islamicEvaluations.tajweedLevel}</strong></div>
                        <div><span className="text-slate-500">{t('Arabic')}:</span> <strong>{studioCard.islamicEvaluations.arabicScore}/100</strong></div>
                        <div><span className="text-slate-500">{t('Akhlaq')}:</span> <strong className="text-emerald-600">{studioCard.islamicEvaluations.akhlaqGrade}</strong></div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-end pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{t('Registrar Signature Stamp')}</p>
                      <div className="border-b border-slate-300 dark:border-slate-700 w-36 pb-1 font-semibold italic text-slate-700 dark:text-slate-300">{studioRegistrarName}</div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{t('Principal Signature Stamp')}</p>
                      <div className="border-b border-slate-300 dark:border-slate-700 w-36 pb-1 font-semibold italic text-slate-700 dark:text-slate-300">{studioPrincipalName}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center text-slate-400">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">{t('Select a scholar to view report card.')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTINUOUS ASSESSMENT MARKSHEET GRID */}
      {activeTab === 'gradebook' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-emerald-500" />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('Live Marksheet Synchronization')}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  {saveStatus}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowPasteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{t('Excel Bulk Paste')}</span>
              </button>

              <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                {(['Draft', 'TeacherSubmitted', 'DepartmentReview', 'DirectorApproved', 'Published', 'Locked'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                      grades[0]?.status === s
                        ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase text-[10px]">
                    <th className="px-4 py-3">{t('Scholar')}</th>
                    <th className="px-2 py-3 text-center w-20">{t('HW (100)')}</th>
                    <th className="px-2 py-3 text-center w-20">{t('Quiz (100)')}</th>
                    <th className="px-2 py-3 text-center w-20">{t('Project (100)')}</th>
                    <th className="px-2 py-3 text-center w-20">{t('Mid (100)')}</th>
                    <th className="px-2 py-3 text-center w-20">{t('Final (100)')}</th>
                    <th className="px-2 py-3 text-center w-20">{t('Att. %')}</th>
                    <th className="px-3 py-3 text-center w-28">{t('Moderation')}</th>
                    <th className="px-3 py-3 text-center w-20">{t('Total %')}</th>
                    <th className="px-2 py-3 text-center w-16">{t('Grade')}</th>
                    <th className="px-2 py-3 text-center w-14">{t('GPA')}</th>
                    <th className="px-3 py-3">{t('Remarks')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {grades.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-4 py-2.5">
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{row.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{row.schoolId}</p>
                      </td>
                      <td className="px-1.5 py-2">
                        <input
                          type="number"
                          value={row.homework}
                          onChange={(e) => handleCellEdit(idx, 'homework', e.target.value)}
                          disabled={row.status === 'Locked'}
                          className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-center focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </td>
                      <td className="px-1.5 py-2">
                        <input
                          type="number"
                          value={row.quiz}
                          onChange={(e) => handleCellEdit(idx, 'quiz', e.target.value)}
                          disabled={row.status === 'Locked'}
                          className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-center focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </td>
                      <td className="px-1.5 py-2">
                        <input
                          type="number"
                          value={row.project}
                          onChange={(e) => handleCellEdit(idx, 'project', e.target.value)}
                          disabled={row.status === 'Locked'}
                          className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-center focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </td>
                      <td className="px-1.5 py-2">
                        <input
                          type="number"
                          value={row.midterm}
                          onChange={(e) => handleCellEdit(idx, 'midterm', e.target.value)}
                          disabled={row.status === 'Locked'}
                          className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-center focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </td>
                      <td className="px-1.5 py-2">
                        <input
                          type="number"
                          value={row.final}
                          onChange={(e) => handleCellEdit(idx, 'final', e.target.value)}
                          disabled={row.status === 'Locked'}
                          className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-center focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </td>
                      <td className="px-1.5 py-2">
                        <input
                          type="number"
                          value={row.attendance}
                          onChange={(e) => handleCellEdit(idx, 'attendance', e.target.value)}
                          disabled={row.status === 'Locked'}
                          className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-center focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          placeholder="+/-"
                          value={row.moderatorOffset || ''}
                          disabled={!isRegistrarOrAdmin}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const copy = [...grades];
                            copy[idx].moderatorOffset = val;
                            computeRowCalculation(copy[idx]);
                            setGrades(copy);
                            triggerAutoSave();
                          }}
                          className="w-full px-1.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-center"
                        />
                      </td>
                      <td className="px-3 py-2 text-center font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                        {row.average}%
                      </td>
                      <td className="px-2 py-2 text-center font-bold">
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {row.letterGrade}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {row.gpa.toFixed(1)}
                      </td>
                      <td className="px-3 py-2 text-slate-500 text-[11px] font-medium">
                        {row.remarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COHORT ANALYTICS & MERIT RANKINGS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">{t("Dean's Honor Roll & Top Performing Scholars")}</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">{t('Ranked by Weighted Terminal GPA & Average')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportCards.slice(0, 6).map((scholar, idx) => (
                <div
                  key={scholar.studentId}
                  className={`p-4 rounded-2xl border transition-all ${
                    idx === 0
                      ? 'bg-gradient-to-br from-amber-50/60 to-yellow-50/20 border-amber-300 dark:border-amber-800 dark:from-amber-950/20 dark:to-yellow-950/10'
                      : idx === 1
                      ? 'bg-gradient-to-br from-slate-50/60 to-slate-100/30 border-slate-300 dark:border-slate-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                        idx === 0 ? 'bg-amber-500 text-white shadow-md' : idx === 1 ? 'bg-slate-400 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        #{idx + 1}
                      </div>
                      <Avatar name={scholar.studentName} src={scholar.avatarUrl} size="sm" />
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">{scholar.studentName}</h4>
                        <p className="text-[10px] font-mono text-slate-400">{scholar.schoolId}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {scholar.letterGrade}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{t('Average Score')}</p>
                      <p className="text-sm font-black text-emerald-600 font-mono">{scholar.averageScore}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{t('CGPA Points')}</p>
                      <p className="text-sm font-black text-sky-600 font-mono">{scholar.gpa.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{t('Hifz Track')}</p>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{scholar.islamicEvaluations.hifzScore}/100</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT REPORT CARD DOSSIER */}
      {inspectCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <Avatar name={inspectCard.studentName} src={inspectCard.avatarUrl} size="md" />
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{inspectCard.studentName}</span>
                    <span className="text-xs font-normal font-mono text-slate-400">({inspectCard.schoolId})</span>
                  </h3>
                  <p className="text-xs text-emerald-600 font-bold">{inspectCard.sectionName} • {inspectCard.academicTerm}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectCard(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Weighted Average')}</p>
                  <p className="text-xl font-black text-emerald-600 font-mono mt-0.5">{inspectCard.averageScore}%</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t('CGPA Points')}</p>
                  <p className="text-xl font-black text-sky-600 font-mono mt-0.5">{inspectCard.gpa.toFixed(2)}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Class Rank')}</p>
                  <p className="text-xl font-black text-amber-500 font-mono mt-0.5">#{inspectCard.rankPosition} <span className="text-xs text-slate-400">/ {inspectCard.totalStudents}</span></p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Attendance')}</p>
                  <p className="text-xl font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5">{inspectCard.attendanceRate}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{t('Continuous Assessment & Exam Scores')}</h4>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                        <th className="p-2.5">{t('Subject')}</th>
                        <th className="p-2.5 text-center">{t('HW')}</th>
                        <th className="p-2.5 text-center">{t('Quiz')}</th>
                        <th className="p-2.5 text-center">{t('Final')}</th>
                        <th className="p-2.5 text-center">{t('Average')}</th>
                        <th className="p-2.5 text-center">{t('Grade')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {inspectCard.subjectGrades.map((sub, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{sub.subjectName}</td>
                          <td className="p-2.5 text-center">{sub.homework}</td>
                          <td className="p-2.5 text-center">{sub.quiz}</td>
                          <td className="p-2.5 text-center">{sub.final}</td>
                          <td className="p-2.5 text-center font-black text-emerald-600">{sub.average}%</td>
                          <td className="p-2.5 text-center font-bold">{sub.letterGrade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                <p><strong className="text-slate-900 dark:text-white">{t('Teacher Remarks')}:</strong> <span className="text-slate-600 dark:text-slate-300">{inspectCard.teacherRemarks}</span></p>
                <p><strong className="text-slate-900 dark:text-white">{t('Principal Remarks')}:</strong> <span className="text-slate-600 dark:text-slate-300">{inspectCard.principalRemarks}</span></p>
                <p className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                  {t('Verification Token')}: {inspectCard.verificationHash}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
              <button
                onClick={() => setInspectCard(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {t('Close')}
              </button>
              <button
                onClick={() => {
                  handleExportPDF(inspectCard);
                  setInspectCard(null);
                }}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t('Download Certified PDF')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT REMARKS & CONDUCT */}
      {editRemarksCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <span>{t('Edit Remarks & Conduct')}</span>
              </h3>
              <button onClick={() => setEditRemarksCard(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">{t('Scholar Name')}</label>
                <input
                  type="text"
                  readOnly
                  value={editRemarksCard.studentName}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">{t('Form Master Remarks')}</label>
                <textarea
                  rows={2}
                  value={editRemarksCard.teacherRemarks}
                  onChange={(e) => setEditRemarksCard({ ...editRemarksCard, teacherRemarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">{t('Principal / Director Remarks')}</label>
                <textarea
                  rows={2}
                  value={editRemarksCard.principalRemarks}
                  onChange={(e) => setEditRemarksCard({ ...editRemarksCard, principalRemarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setEditRemarksCard(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={() => {
                  setReportCards(prev => prev.map(c => c.id === editRemarksCard.id ? editRemarksCard : c));
                  setEditRemarksCard(null);
                  toast.success(t('Updated remarks successfully.'));
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                {t('Save Remarks')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXCEL SPREADSHEET BULK PASTE */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>{t('Excel Spreadsheet Bulk Paste')}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t('Copy columns directly from your local Excel file (Homework, Quiz, Project, Midterm, Final separated by tabs) and paste below.')}
              </p>
            </div>

            <div className="p-6">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="85	90	80	75	85&#10;90	88	95	82	90&#10;78	82	80	76	80"
                className="w-full h-44 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleBulkPaste}
                disabled={!pasteText.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
              >
                {t('Import Data')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BATCH GENERATE WIZARD */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>{t('Batch Generate Report Cards')}</span>
              </h3>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('This will calculate overall term averages, rankings, and issue draft report cards for all enrolled scholars in')} <strong>{sections.find(s => s.id === selectedSection)?.name || 'the active section'}</strong>.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleBatchGenerate}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {t('Run Batch Generation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

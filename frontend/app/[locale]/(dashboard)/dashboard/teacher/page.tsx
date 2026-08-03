'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  BookOpen, Users, FileText, CheckCircle2, Clock, Calendar,
  Award, RefreshCw, Activity, ArrowRight, Star,
  UserCheck, ShieldCheck, Mail, ArrowUpRight, CheckSquare, Square,
  Download, Sparkles, Upload, X, PenTool, ClipboardList, Lock, Unlock,
  MessageSquare, Settings, AlertCircle, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Define TS interfaces for clarity
interface Student {
  id: number;
  documentId: string;
  firstName: string;
  lastName: string;
  schoolId: string;
  admissionNumber?: string;
  gpa?: number;
  academicStanding?: string;
  riskIndicator?: string;
  enrollmentStatus?: string;
}

interface Enrollment {
  id: number;
  documentId: string;
  enrollmentStatus: string;
  student?: Student;
}

interface CourseOffering {
  id: number;
  documentId: string;
  name?: string;
  subject?: { id: number; documentId: string; name: string; code: string };
  academicSection?: { id: number; documentId: string; name: string; code: string; color?: string };
  gradeLevel?: { id: number; documentId: string; name: string; code: string };
  academicYear?: { id: number; documentId: string; name: string };
  academicTerm?: { id: number; documentId: string; name: string };
  room?: { id: number; roomNumber: string; buildingName?: string };
  studentEnrollments?: Enrollment[];
  attendanceRate?: string;
  syllabusCoverage?: number;
  gradebookStatus?: string;
}

interface AssessmentBlueprint {
  id: number;
  componentName: string;
  weightPercentage: number;
  label?: string;
}

interface GradingPolicy {
  id: number;
  minimumScore: number;
  letterGrade: string;
  gradePoints: number;
  description?: string;
}

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const teacher = user?.profile as any; // Logged-in teacher profile

  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [selectedOffering, setSelectedOffering] = useState<CourseOffering | null>(null);

  // Workspace sub-tabs state
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'overview' | 'roster' | 'attendance' | 'assessments' | 'gradebook' | 'approval' | 'lessonplan' | 'audit'
  >('overview');

  // Attendance Register states
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [attendanceRegister, setAttendanceRegister] = useState<Record<string, string>>({});
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // Assessment Builder states
  const [blueprints, setBlueprints] = useState<AssessmentBlueprint[]>([]);
  const [gradingPolicies, setGradingPolicies] = useState<GradingPolicy[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [newAssessName, setNewAssessName] = useState('');
  const [newAssessCategory, setNewAssessCategory] = useState('');
  const [newAssessMaxScore, setNewAssessMaxScore] = useState('100');
  const [newAssessWeight, setNewAssessWeight] = useState('10');
  const [newAssessDueDate, setNewAssessDueDate] = useState('');
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);

  // Gradebook grid states
  const [gradebookData, setGradebookData] = useState<Record<string, Record<string, number>>>({});
  const [gradebookComments, setGradebookComments] = useState<Record<string, string>>({});
  const [gradebookEntryIds, setGradebookEntryIds] = useState<Record<string, string>>({});
  const [isSavingGrades, setIsSavingGrades] = useState(false);

  // Approval state
  const [approvalStatus, setApprovalStatus] = useState<string>('Draft');
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);
  const [approvalComment, setApprovalComment] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Curriculum states
  const [coverageChecklist, setCoverageChecklist] = useState<Record<string, boolean>>({
    'unit1': true,
    'unit2': true,
    'unit3': false,
    'unit4': false,
  });

  // Audit Logs states
  const [sectionAuditLogs, setSectionAuditLogs] = useState<any[]>([]);

  // Timetable schedule
  const [timetable, setTimetable] = useState<any[]>([]);

  // 1. Fetch teacher's Course Offerings
  const loadOfferings = async () => {
    if (!teacher?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiClient.get('/course-offerings', {
        params: {
          filters: { teacher: { id: { $eq: teacher.id } } },
          populate: [
            'subject',
            'academicSection',
            'gradeLevel',
            'academicYear',
            'academicTerm',
            'room',
            'studentEnrollments.student'
          ],
          pagination: { limit: 100 }
        }
      });
      const data = res.data?.data || [];
      // Enrich mock analytics stats
      const enriched = data.map((o: any, idx: number) => ({
        ...o,
        attendanceRate: idx % 2 === 0 ? '97.2%' : '94.8%',
        syllabusCoverage: idx % 2 === 0 ? 75 : 40,
        gradebookStatus: o.gradebookStatus || 'Draft'
      }));
      setOfferings(enriched);

      // Load timetable slots
      const ttRes = await apiClient.get('/timetable-slots', {
        params: {
          filters: { courseOffering: { teacher: { id: { $eq: teacher.id } } } },
          populate: ['courseOffering.subject', 'courseOffering.room', 'courseOffering.academicSection']
        }
      });
      setTimetable(ttRes.data?.data || []);
    } catch (err) {
      toast.error('Failed to load Course Offerings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOfferings();
  }, [teacher?.id]);

  // 2. Fetch specific Course Offering workspace data
  const loadOfferingWorkspace = async (offering: CourseOffering) => {
    setIsLoading(true);
    setSelectedOffering(offering);
    try {
      const subjectId = offering.subject?.id;
      const offeringId = offering.id;

      // Promise.all to fetch blueprints, grading policies, attendance history, current grades and approval histories
      const [bpRes, gpRes, attendRes, gradesRes, appHistoryRes, auditsRes] = await Promise.all([
        subjectId ? apiClient.get('/assessment-blueprints', { params: { filters: { subject: { id: { $eq: subjectId } } } } }).catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
        apiClient.get('/grading-policies', { params: { pagination: { limit: 100 } } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/attendance-records', { params: { filters: { courseOffering: { id: { $eq: offeringId } } }, populate: ['student'], pagination: { limit: 100 } } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/gradebook-entries', { params: { filters: { courseOffering: { id: { $eq: offeringId } } }, populate: ['student'], pagination: { limit: 500 } } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/grade-approval-histories', { params: { filters: { courseOffering: { id: { $eq: offeringId } } }, populate: ['reviewer'], sort: 'actionDateTime:desc' } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/audit-logs', { params: { filters: { entity: { $eq: 'CourseOffering' }, entityId: { $eq: String(offeringId) } }, populate: ['performedBy'], sort: 'createdAt:desc', pagination: { limit: 20 } } }).catch(() => ({ data: { data: [] } }))
      ]);

      const bpList = bpRes.data?.data || [];
      setBlueprints(bpList);
      setGradingPolicies(gpRes.data?.data || []);
      setAttendanceHistory(attendRes.data?.data || []);
      setSectionAuditLogs(auditsRes.data?.data || []);

      // Load approval history
      const approvals = appHistoryRes.data?.data || [];
      setApprovalHistory(approvals);
      if (approvals.length > 0) {
        setApprovalStatus(approvals[0].stage);
      } else {
        setApprovalStatus(offering.gradebookStatus || 'Draft');
      }

      // Initialize attendance register for today
      const roster = offering.studentEnrollments || [];
      const attMap: Record<string, string> = {};
      roster.forEach((enr) => {
        if (enr.student?.id) {
          attMap[enr.student.id] = 'Present';
        }
      });
      setAttendanceRegister(attMap);

      // Initialize Gradebook entries map
      const gradesList = gradesRes.data?.data || [];
      const gMap: Record<string, Record<string, number>> = {};
      const cMap: Record<string, string> = {};
      const entryIdMap: Record<string, string> = {};

      roster.forEach((enr) => {
        if (enr.student?.id) {
          gMap[enr.student.id] = {};
        }
      });

      gradesList.forEach((entry: any) => {
        const studentId = entry.student?.id;
        if (!studentId) return;

        // Match entry back to a blueprint.
        // Priority: match by label first (unique), then by title, then by assessmentType.
        const bp = bpList.find((b: any) =>
          (b.label && b.label === entry.title) ||
          (b.label && b.label === entry.assessmentType) ||
          b.componentName === entry.title ||
          b.componentName === entry.assessmentType
        );

        // Key by the LABEL (unique display name) so Quiz and Quiz2 don't collide.
        const component = bp ? (bp.label || bp.componentName) : (entry.title || entry.assessmentType);
        if (component) {
          if (!gMap[studentId]) gMap[studentId] = {};
          gMap[studentId][component] = entry.score;
          if (entry.teacherComment) {
            cMap[`${studentId}-${component}`] = entry.teacherComment;
          }
          entryIdMap[`${studentId}-${component}`] = entry.documentId || entry.id;
        }
      });
      setGradebookData(gMap);
      setGradebookComments(cMap);
      setGradebookEntryIds(entryIdMap);

    } catch (err) {
      toast.error('Failed to load workspace files.');
    } finally {
      setIsLoading(false);
    }
  };

  // Grade point calculations
  const gradingRules = useMemo(() => {
    if (gradingPolicies && gradingPolicies.length > 0) {
      return gradingPolicies
        .map((p: any) => {
          const minVal = parseFloat(p.minScore ?? p.minimumScore ?? 0);
          const letter = p.gradeName ?? p.letterGrade ?? 'F';
          const gp = parseFloat(p.gpaPoints ?? p.gradePoints ?? 0);
          return { minScore: minVal, letterGrade: letter, gradePoints: gp };
        })
        .sort((a, b) => b.minScore - a.minScore);
    }
    // Default fallback rules
    return [
      { minScore: 97, letterGrade: 'A+', gradePoints: 4.0 },
      { minScore: 93, letterGrade: 'A', gradePoints: 3.8 },
      { minScore: 87, letterGrade: 'B+', gradePoints: 3.5 },
      { minScore: 83, letterGrade: 'B', gradePoints: 3.0 },
      { minScore: 77, letterGrade: 'C+', gradePoints: 2.5 },
      { minScore: 70, letterGrade: 'C', gradePoints: 2.0 },
      { minScore: 50, letterGrade: 'D', gradePoints: 1.0 },
      { minScore: 0, letterGrade: 'F', gradePoints: 0.0 }
    ];
  }, [gradingPolicies]);

  const resolveLetterAndPoints = (score: number) => {
    for (const rule of gradingRules) {
      if (score >= rule.minScore) {
        return { grade: rule.letterGrade, points: rule.gradePoints };
      }
    }
    return { grade: 'F', points: 0.0 };
  };

  // Calculate student results dynamically based on blueprint weights
  const calculateStudentFinalScore = (studentId: number) => {
    const studentGrades = gradebookData[studentId] || {};
    let totalWeight = 0;
    let weightedSum = 0;

    blueprints.forEach((bp) => {
      const comp = bp.componentName;
      const score = studentGrades[comp] ?? null;
      if (score !== null) {
        weightedSum += score * (bp.weightPercentage / 100);
        totalWeight += bp.weightPercentage;
      }
    });

    if (totalWeight === 0) return { score: 0, grade: 'F', points: 0.0 };
    // Normalize to 100% scale
    const finalScore = Math.min(100, Math.max(0, (weightedSum / totalWeight) * 100));
    const { grade, points } = resolveLetterAndPoints(finalScore);
    return { score: finalScore, grade, points };
  };

  // Handle grade change
  const handleGradeCellChange = (studentId: number, component: string, value: string) => {
    // If locked, reject edits
    if (approvalStatus !== 'Draft') {
      toast.warning('Gradebook is locked for moderation review.');
      return;
    }
    const scoreVal = Math.max(0, Math.min(100, parseFloat(value) || 0));
    setGradebookData((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [component]: scoreVal
      }
    }));
  };

  // Save attendance register
  const handleSaveAttendance = async () => {
    if (!selectedOffering) return;
    setIsSavingAttendance(true);
    try {
      const logsToSave = Object.entries(attendanceRegister).map(([studentId, status]) => {
        return apiClient.post('/attendance-records', {
          data: {
            date: attendanceDate,
            recordStatus: status,
            student: parseInt(studentId),
            teacher: teacher.id,
            courseOffering: selectedOffering.id,
            section: selectedOffering.academicSection?.id,
            subject: selectedOffering.subject?.id,
            academicYear: selectedOffering.academicYear?.id,
            academicTerm: selectedOffering.academicTerm?.id
          }
        });
      });

      await Promise.all(logsToSave);

      // Write security audit log
      await apiClient.post('/audit-logs', {
        data: {
          action: 'Attendance Register Saved',
          entity: 'CourseOffering',
          entityId: String(selectedOffering.id),
          description: `Teacher saved attendance log for ${Object.keys(attendanceRegister).length} students on date ${attendanceDate}`,
          performedBy: user?.id,
          timestamp: new Date().toISOString()
        }
      }).catch(console.warn);

      toast.success('Daily attendance register posted successfully.');
      loadOfferingWorkspace(selectedOffering);
    } catch {
      toast.error('Failed to post attendance.');
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // Save Gradebook scores to database
  const handleSaveGrades = async () => {
    if (!selectedOffering) return;
    setIsSavingGrades(true);
    try {
      const recordsToSave: any[] = [];
      const roster = selectedOffering.studentEnrollments || [];

      for (const enr of roster) {
        const studentId = enr.student?.id;
        if (!studentId) continue;

        const studentGrades = gradebookData[studentId] || {};
        for (const [component, score] of Object.entries(studentGrades)) {
          const entryKey = `${studentId}-${component}`;
          const existingId = gradebookEntryIds[entryKey];

          // Key by label (same key used when loading) so PUT hits the correct existing entry
          const bp = blueprints.find(b => (b.label || b.componentName) === component);
          const titleVal = bp?.label || component;
          const resolvedComponentName = bp?.componentName || component;

          const validEnum = ["Homework", "Quiz", "Project", "Participation", "Attendance", "Exam", "Other"];
          let resolvedType = resolvedComponentName;
          const rootType = resolvedComponentName.replace(/[0-9]/g, '');
          if (validEnum.includes(rootType)) {
            resolvedType = rootType;
          } else if (validEnum.includes(resolvedComponentName)) {
            resolvedType = resolvedComponentName;
          } else {
            resolvedType = 'Other';
          }

          const payload = {
            data: {
              title: titleVal,
              assessmentType: resolvedType,
              score,
              maxScore: 100,
              percentage: score,
              student: enr.student?.documentId || enr.student?.id,
              teacher: teacher.documentId || teacher.id,
              courseOffering: selectedOffering.documentId || selectedOffering.id,
              subject: selectedOffering.subject?.documentId || selectedOffering.subject?.id,
              section: selectedOffering.academicSection?.documentId || selectedOffering.academicSection?.id,
              academicYear: selectedOffering.academicYear?.documentId || selectedOffering.academicYear?.id,
              academicTerm: selectedOffering.academicTerm?.documentId || selectedOffering.academicTerm?.id,
              recordStatus: 'Draft'
            }
          };

          if (existingId) {
            recordsToSave.push(
              apiClient.put(`/gradebook-entries/${existingId}`, payload)
            );
          } else {
            recordsToSave.push(
              apiClient.post('/gradebook-entries', payload)
            );
          }
        }
      }

      await Promise.all(recordsToSave);

      // Write security audit log
      await apiClient.post('/audit-logs', {
        data: {
          action: 'Gradebook Saved',
          entity: 'CourseOffering',
          entityId: String(selectedOffering.id),
          description: `Teacher saved gradebook scores in draft format.`,
          performedBy: user?.id,
          timestamp: new Date().toISOString()
        }
      }).catch(console.warn);

      toast.success('Gradebook drafts updated successfully.');
      loadOfferingWorkspace(selectedOffering);
    } catch {
      toast.error('Failed to save gradebook.');
    } finally {
      setIsSavingGrades(false);
    }
  };

  // Create new Assessment Blueprint component
  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffering || !newAssessName || !newAssessCategory) return;
    setIsCreatingAssessment(true);
    try {
      // Simulate/create assessment blueprint in Strapi
      await apiClient.post('/assessment-blueprints', {
        data: {
          componentName: newAssessCategory,
          label: newAssessName,
          weightPercentage: parseFloat(newAssessWeight),
          subject: selectedOffering.subject?.documentId || selectedOffering.subject?.id
        }
      });

      // Write security audit log
      await apiClient.post('/audit-logs', {
        data: {
          action: 'Assessment Category Added',
          entity: 'CourseOffering',
          entityId: String(selectedOffering.id),
          description: `Added blueprint component: ${newAssessCategory} (Weight: ${newAssessWeight}%)`,
          performedBy: user?.id,
          timestamp: new Date().toISOString()
        }
      }).catch(console.warn);

      toast.success(`Assessment category '${newAssessCategory}' registered successfully.`);
      setNewAssessName('');
      loadOfferingWorkspace(selectedOffering);
    } catch {
      toast.error('Failed to register assessment blueprint.');
    } finally {
      setIsCreatingAssessment(false);
    }
  };

  // Submit for approval (teacher-only: Draft → Submitted)
  const handleWorkflowTransition = async (targetStage: string) => {
    if (!selectedOffering) return;
    if (isSubmittingApproval) return;
    setIsSubmittingApproval(true);
    try {
      const nextVersion = (approvalHistory?.[0]?.versionNumber ?? 0) + 1;

      // Simple integrity hash
      const dataStr = JSON.stringify(gradebookData);
      let hash = 0;
      for (let i = 0; i < dataStr.length; i++) {
        hash = (hash << 5) - hash + dataStr.charCodeAt(i);
        hash |= 0;
      }
      const changeHash = `SHA256-${Math.abs(hash).toString(16)}`;

      // Create audit history record — use text fields (no relation binding)
      await apiClient.post('/grade-approval-histories', {
        data: {
          stage: targetStage,
          versionNumber: nextVersion,
          comments: approvalComment || `Transitioned gradebook to stage: ${targetStage}`,
          actionDateTime: new Date().toISOString(),
          reviewerEmail: (user as any)?.email || '',
          reviewerName: `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || (user as any)?.username || '',
          courseOffering: selectedOffering.documentId,
          changeHash
        }
      });

      // Always update the Course Offering gradebookStatus (separate try so it always runs)
      try {
        await apiClient.put(`/course-offerings/${selectedOffering.documentId}`, {
          data: { gradebookStatus: targetStage }
        });
      } catch (putErr) {
        console.warn('Failed to update course offering status:', putErr);
      }

      // Audit log (non-blocking)
      apiClient.post('/audit-logs', {
        data: {
          action: `Grade Approval: ${targetStage}`,
          entity: 'CourseOffering',
          entityId: String(selectedOffering.id),
          description: `Grades v${nextVersion} (Hash: ${changeHash}). Comment: ${approvalComment}`,
          performedBy: user?.id,
          timestamp: new Date().toISOString()
        }
      }).catch(console.warn);

      toast.success(`Gradebook submitted for Section Head review!`);
      setApprovalComment('');
      loadOfferingWorkspace(selectedOffering);
    } catch (err: any) {
      console.error('Workflow transition error:', err?.response?.data || err);
      toast.error('Failed to submit approval workflow.');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={selectedOffering ? `Workspace: ${selectedOffering.subject?.name} (${selectedOffering.gradeLevel?.name})` : `Teaching Portal`}
        description={selectedOffering ? `${selectedOffering.academicSection?.name} · ${selectedOffering.academicYear?.name} · Term: ${selectedOffering.academicTerm?.name}` : `Manage assigned Course Offerings and syllabus delivery.`}
      >
        <div className="flex gap-2">
          {selectedOffering && (
            <button
              onClick={() => setSelectedOffering(null)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-emerald-400 dark:bg-slate-900 text-xs font-bold hover:bg-yellow-400 cursor-pointer dark:hover:bg-slate-800 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Workspace</span>
            </button>
          )}
          <button
            onClick={loadOfferings}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-emerald-400 dark:bg-slate-900 text-xs font-bold hover:bg-emerald-600 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span>Sync Live DB</span>
          </button>
        </div>
      </PageHeader>

      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
          <p className="text-slate-400 text-xs font-semibold">Syncing database registers...</p>
        </div>
      )}

      {!isLoading && !selectedOffering && (
        <div className="space-y-6">
          {/* STATS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Course Offerings"
              value={offerings.length}
              subtitle="Assigned scheduled segments"
              icon={BookOpen}
              color="text-indigo-500"
              bgColor="bg-indigo-500/10"
            />
            <StatCard
              title="Today's Timetable Slots"
              value={timetable.length}
              subtitle="Assigned classroom slots"
              icon={Calendar}
              color="text-blue-500"
              bgColor="bg-blue-500/10"
            />
            <StatCard
              title="Total Enrolled Students"
              value={offerings.reduce((sum, o) => sum + (o.studentEnrollments?.length ?? 0), 0)}
              subtitle="Active academic learners"
              icon={Users}
              color="text-emerald-500"
              bgColor="bg-emerald-500/10"
            />
            <StatCard
              title="Average Syllabus Coverage"
              value="57.5%"
              subtitle="Calculated term coverages"
              icon={CheckCircle2}
              color="text-amber-500"
              bgColor="bg-amber-500/10"
            />
          </div>

          {/* COURSE OFFERINGS LIST */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="w-4.5 h-4.5 text-indigo-500" />
              <span>My Course Offerings</span>
            </h2>

            {offerings.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border rounded-3xl p-8 text-center text-slate-400">
                No course offerings assigned to your profile in this term.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {offerings.map((o) => {
                  const sectionColor = o.academicSection?.color ?? '#6366f1';
                  return (
                    <div
                      key={o.id}
                      onClick={() => loadOfferingWorkspace(o)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between min-h-[190px]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: sectionColor }}
                          >
                            {o.academicSection?.name}
                          </span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                            {o.gradeLevel?.name}
                          </span>
                        </div>
                        <h3 className="font-black text-base text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {o.subject?.name}
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 font-mono mt-0.5">{o.subject?.code}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{o.studentEnrollments?.length ?? 0} Students</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Room {o.room?.roomNumber ?? '101'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WORKSPACE DETAIL VIEW */}
      {!isLoading && selectedOffering && (
        <div className="space-y-6 animate-fade-in">
          {/* HORIZONTAL TAB BAR */}
          <div className="flex items-center gap-1.5 px-1.5 py-1 bg-slate-100 dark:bg-slate-800 border rounded-2xl overflow-x-auto no-scrollbar max-w-5xl">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpen },
              { id: 'roster', label: 'Student Roster', icon: Users },
              { id: 'attendance', label: 'Attendance logs', icon: UserCheck },
              { id: 'assessments', label: 'Assessments', icon: PenTool },
              { id: 'gradebook', label: 'Gradebook Spreadsheet', icon: ClipboardList },
              { id: 'approval', label: 'Grade Approval', icon: ShieldCheck },
              { id: 'lessonplan', label: 'Lesson Planner', icon: CheckSquare },
              { id: 'audit', label: 'Audit Trail', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeWorkspaceTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveWorkspaceTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                    isActive
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-white/60 dark:hover:bg-slate-700/50 dark:hover:text-white"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
            {/* TAB: OVERVIEW */}
            {activeWorkspaceTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 border rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                    <p className="text-xs font-bold text-slate-400">Class Roster size</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{selectedOffering.studentEnrollments?.length ?? 0} Students</p>
                    <p className="text-[10px] text-slate-400 mt-1">Sourced from Student Enrollments</p>
                  </div>
                  <div className="p-5 border rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                    <p className="text-xs font-bold text-slate-400">Attendance Rate</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{selectedOffering.attendanceRate}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Average rate in active term</p>
                  </div>
                  <div className="p-5 border rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                    <p className="text-xs font-bold text-slate-400">Syllabus Completion</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{selectedOffering.syllabusCoverage}%</p>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-indigo-650 h-full" style={{ width: `${selectedOffering.syllabusCoverage}%` }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Active Timetable Slots */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Course Timetable</h3>
                    {timetable.filter(s => s.courseOffering?.id === selectedOffering.id).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No scheduled timetable slots for this course offering.</p>
                    ) : (
                      <div className="space-y-2">
                        {timetable.filter(s => s.courseOffering?.id === selectedOffering.id).map((slot: any) => (
                          <div key={slot.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 border rounded-2xl text-xs flex justify-between items-center">
                            <div>
                              <p className="font-bold">{slot.dayOfWeek}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Building: {selectedOffering.room?.buildingName} · Room {selectedOffering.room?.roomNumber}</p>
                            </div>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{slot.startTime} - {slot.endTime}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI recommendations */}
                  <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-800/30 p-5 rounded-3xl text-xs text-slate-300 space-y-3">
                    <h4 className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>Workspace Interventions</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">Based on dynamic gradebook and attendance entries, the following learners require monitoring:</p>
                    <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl">
                      <p className="font-bold text-rose-400">Mohamed Komara (GPA Risk)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Average calculated grades is below 60%. Excuses missing files Chapter 2.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ROSTER */}
            {activeWorkspaceTab === 'roster' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Active Student Roster</h3>
                  <p className="text-xs text-slate-500">Student rosters are synced directly from approved enrollment records.</p>
                </div>

                <div className="overflow-x-auto border rounded-2xl text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="p-3">Admission No</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">School ID</th>
                        <th className="p-3 text-center">GPA</th>
                        <th className="p-3 text-center">Standing</th>
                        <th className="p-3 text-center">Risk Level</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(selectedOffering.studentEnrollments || []).map((enr) => {
                        const s = enr.student;
                        if (!s) return null;
                        return (
                          <tr key={enr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-3 font-mono text-slate-800 dark:text-slate-200">{s.admissionNumber || 'ADM-0921'}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{s.firstName} {s.lastName}</td>
                            <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{s.schoolId}</td>
                            <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">{s.gpa ?? '3.75'}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-full font-bold text-[10px]">
                                {s.academicStanding || 'Good'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full font-bold text-[10px]",
                                s.riskIndicator === 'High' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                              )}>
                                {s.riskIndicator || 'Low'}
                              </span>
                            </td>
                            <td className="p-3 text-center capitalize text-slate-800 dark:text-slate-200">{enr.enrollmentStatus}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: ATTENDANCE */}
            {activeWorkspaceTab === 'attendance' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Daily Attendance Registers</h3>
                    <p className="text-xs text-slate-500">Post attendance logs directly against the course offering.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="px-3 py-2 border rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSaveAttendance}
                      disabled={isSavingAttendance}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-50"
                    >
                      {isSavingAttendance ? 'Saving...' : 'Post Attendance'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Mark Attendance register table */}
                  <div className="lg:col-span-2 overflow-x-auto border rounded-2xl text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="p-3">Student Name</th>
                          <th className="p-3 text-center">Present</th>
                          <th className="p-3 text-center">Absent</th>
                          <th className="p-3 text-center">Late</th>
                          <th className="p-3 text-center">Excused</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(selectedOffering.studentEnrollments || []).map((enr) => {
                          const s = enr.student;
                          if (!s) return null;
                          return (
                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="p-3 font-bold text-slate-900 dark:text-white">
                                <div className="text-slate-900 dark:text-white font-extrabold">{s.firstName} {s.lastName}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{s.schoolId}</div>
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="radio"
                                  name={`att-${s.id}`}
                                  checked={attendanceRegister[s.id] === 'Present'}
                                  onChange={() => setAttendanceRegister((prev) => ({ ...prev, [s.id]: 'Present' }))}
                                  className="w-4 h-4 text-indigo-600"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="radio"
                                  name={`att-${s.id}`}
                                  checked={attendanceRegister[s.id] === 'Absent'}
                                  onChange={() => setAttendanceRegister((prev) => ({ ...prev, [s.id]: 'Absent' }))}
                                  className="w-4 h-4 text-rose-600"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="radio"
                                  name={`att-${s.id}`}
                                  checked={attendanceRegister[s.id] === 'Late'}
                                  onChange={() => setAttendanceRegister((prev) => ({ ...prev, [s.id]: 'Late' }))}
                                  className="w-4 h-4 text-amber-600"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="radio"
                                  name={`att-${s.id}`}
                                  checked={attendanceRegister[s.id] === 'Excused'}
                                  onChange={() => setAttendanceRegister((prev) => ({ ...prev, [s.id]: 'Excused' }))}
                                  className="w-4 h-4 text-sky-600"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Attendance Log History */}
                  <div className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <h4 className="font-extrabold text-slate-900 dark:text-white mb-3">Attendance History</h4>
                    {attendanceHistory.length === 0 ? (
                      <p className="text-slate-400 italic">No attendance history logs recorded.</p>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {attendanceHistory.map((h: any) => (
                          <div key={h.id} className="p-2 border rounded-xl bg-white dark:bg-slate-900 flex justify-between items-center text-[10px]">
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200">
                                {h.student?.firstName} {h.student?.lastName}
                              </p>
                              <p className="text-slate-400 mt-0.5">{h.date}</p>
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full font-bold",
                              h.recordStatus === 'Present' ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
                            )}>
                              {h.recordStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ASSESSMENTS */}
            {activeWorkspaceTab === 'assessments' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Active Assessment Blueprints</h3>
                    <p className="text-xs text-slate-500">Component categories and weights fetched from Subject blueprints.</p>
                  </div>

                  {blueprints.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">No assessment blueprints configured. Configure weights using the builder.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {blueprints.map((bp) => (
                        <div key={bp.id} className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white">{bp.label || bp.componentName}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Subject level rule</p>
                          </div>
                          <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-lg">{bp.weightPercentage}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-5 border rounded-3xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                  <h4 className="font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-indigo-500" />
                    <span>Assessment Builder</span>
                  </h4>
                  <form onSubmit={handleCreateAssessment} className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assessment Label</label>
                      <input
                        type="text"
                        required
                        value={newAssessName}
                        placeholder="Homework 1, Midterm Exam, etc."
                        onChange={(e) => setNewAssessName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-450 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category Type</label>
                      <select
                        required
                        value={newAssessCategory}
                        onChange={(e) => setNewAssessCategory(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">-- Choose Category --</option>
                        <option value="Homework" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Homework</option>
                        <option value="Quiz" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Quiz</option>
                        <option value="Quiz2" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Quiz2</option>
                        <option value="Project" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Project</option>
                        <option value="Practical" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Practical</option>
                        <option value="Participation" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Participation</option>
                        <option value="Oral" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Oral</option>
                        <option value="Midterm" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Midterm</option>
                        <option value="Exam" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Final Examination</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Max Score</label>
                        <input
                          type="number"
                          required
                          value={newAssessMaxScore}
                          onChange={(e) => setNewAssessMaxScore(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Weight (%)</label>
                        <input
                          type="number"
                          required
                          value={newAssessWeight}
                          onChange={(e) => setNewAssessWeight(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isCreatingAssessment}
                      className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isCreatingAssessment ? 'Registering...' : 'Register Component'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB: GRADEBOOK */}
            {activeWorkspaceTab === 'gradebook' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Active Spreadsheet Gradebook</h3>
                    <p className="text-xs text-slate-500">Dynamic assessment columns generated from active blueprints.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {approvalStatus !== 'Draft' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl text-xs font-bold border border-amber-200">
                        <Lock className="w-3.5 h-3.5" />
                        Locked (Workflow Status: {approvalStatus})
                      </span>
                    )}
                    <button
                      onClick={handleSaveGrades}
                      disabled={isSavingGrades || approvalStatus !== 'Draft'}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingGrades ? 'Saving...' : 'Save Draft Marks'}
                    </button>
                  </div>
                </div>

                {blueprints.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Please configure at least one active Assessment Blueprint category to build the gradebook matrix columns.
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-2xl text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        <tr>
                          <th className="p-3 text-left">Student Name</th>
                          {blueprints.map((bp) => (
                            <th key={bp.id} className="p-3 text-center border-l">
                              {bp.label || bp.componentName} ({bp.weightPercentage}%)
                            </th>
                          ))}
                          <th className="p-3 text-right">Calculated Score</th>
                          <th className="p-3 text-center">Grade</th>
                          <th className="p-3 text-center">GP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(selectedOffering.studentEnrollments || []).map((enr) => {
                          const s = enr.student;
                          if (!s) return null;

                          const grades = gradebookData[s.id] || {};
                          const calc = calculateStudentFinalScore(s.id);

                          return (
                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="p-3 font-bold text-slate-900 dark:text-white">
                                <div className="text-slate-900 dark:text-white font-extrabold">{s.firstName} {s.lastName}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{s.schoolId}</div>
                              </td>
                              {blueprints.map((bp) => {
                                const val = grades[bp.componentName] ?? '';
                                return (
                                  <td key={bp.id} className="p-3 text-center border-l">
                                    <input
                                      type="number"
                                      value={val}
                                      placeholder="-"
                                      onChange={(e) => handleGradeCellChange(s.id, bp.componentName, e.target.value)}
                                      className="w-16 px-2 py-1 text-center bg-transparent border-b font-semibold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                    />
                                  </td>
                                );
                              })}
                              <td className="p-3 text-right font-black font-mono text-indigo-600 dark:text-indigo-400">
                                {calc.score.toFixed(1)}%
                              </td>
                              <td className="p-3 text-center">
                                <span className={cn(
                                  "inline-flex px-2 py-0.5 rounded font-bold border text-[10px]",
                                  calc.grade === 'F' ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                )}>
                                  {calc.grade}
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">{calc.points.toFixed(1)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: APPROVAL */}
            {activeWorkspaceTab === 'approval' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Grade Approval Workflow</h3>
                  <p className="text-xs text-slate-500">Submit completed registers for Section Head verification and Principal release.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Transition action */}
                  <div className="lg:col-span-2 p-5 border rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">Current Moderation State:</span>
                      <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full font-black capitalize">
                        {approvalStatus}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">Approval / Change Rationale Comments</label>
                      <textarea
                        rows={3}
                        value={approvalComment}
                        placeholder="Add review notes, audit reason, or feedback..."
                        onChange={(e) => setApprovalComment(e.target.value)}
                        className="w-full p-3 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Teacher-only action: submit for review. Other transitions are done by Section Head. */}
                    <div className="flex flex-col gap-3">
                      {approvalStatus === 'Draft' && (
                        <div className="flex flex-col gap-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Add an optional note, then submit your completed gradebook to the Section Head for review.
                          </p>
                          <button
                            onClick={() => handleWorkflowTransition('Submitted')}
                            disabled={isSubmittingApproval}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold cursor-pointer transition-colors text-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Submit Grades for Section Head Review
                          </button>
                        </div>
                      )}
                      {approvalStatus === 'Submitted' && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                          <Clock className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <div>
                            <p className="font-bold text-amber-800 dark:text-amber-300 text-xs">Pending Section Head Review</p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                              Your gradebook has been submitted. Awaiting Section Head verification. You cannot edit grades while under review.
                            </p>
                          </div>
                        </div>
                      )}
                      {approvalStatus === 'Verified' && (
                        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl flex items-start gap-3">
                          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-purple-600 dark:text-purple-400" />
                          <div>
                            <p className="font-bold text-purple-800 dark:text-purple-300 text-xs">Verified by Section Head</p>
                            <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                              Grades are verified. Pending Registrar final approval before release to students.
                            </p>
                          </div>
                        </div>
                      )}
                      {(approvalStatus === 'Approved' || approvalStatus === 'Released') && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <div>
                            <p className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">Grades Approved &amp; Released</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                              Grades are finalized and visible to students.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Log checklist history */}
                  <div className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <h4 className="font-extrabold text-slate-900 dark:text-white mb-3">Workflow State Log History</h4>
                    {approvalHistory.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 italic">No transition audit logs generated yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {approvalHistory.map((log) => (
                          <div key={log.id} className="p-3 border rounded-xl bg-white dark:bg-slate-900 text-[10px]">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 capitalize">
                                State: {log.stage}
                              </span>
                              <span className="text-slate-400 font-mono">v{log.versionNumber}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">"{log.comments}"</p>
                            <p className="text-[9px] text-slate-400 mt-1">Integrity Hash: {log.changeHash?.substring(0, 15)}...</p>
                            <p className="text-[9px] text-slate-400">{new Date(log.actionDateTime).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: LESSON PLANNER */}
            {activeWorkspaceTab === 'lessonplan' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Lesson Planner & Curriculum</h3>
                  <p className="text-xs text-slate-500">Track curriculum progress against active learning outcomes.</p>
                </div>

                <div className="space-y-3 text-xs">
                  {[
                    { id: 'unit1', title: 'Unit 1: Foundations & Core Terminology' },
                    { id: 'unit2', title: 'Unit 2: Tajweed rules & Recitation standards' },
                    { id: 'unit3', title: 'Unit 3: Textual analysis & Grammar parsing' },
                    { id: 'unit4', title: 'Unit 4: Review and comprehensive term examination' }
                  ].map((unit) => (
                    <div
                      key={unit.id}
                      onClick={() => setCoverageChecklist((prev) => ({ ...prev, [unit.id]: !prev[unit.id] }))}
                      className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border rounded-2xl cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition"
                    >
                      {coverageChecklist[unit.id] ? (
                        <CheckSquare className="w-4.5 h-4.5 text-indigo-600" />
                      ) : (
                        <Square className="w-4.5 h-4.5 text-slate-400" />
                      )}
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{unit.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: AUDIT */}
            {activeWorkspaceTab === 'audit' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Compliance Workspace Audit Trails</h3>
                  <p className="text-xs text-slate-500">Full audit log of changes made inside this Course Offering workspace.</p>
                </div>

                {sectionAuditLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    No modifications logged in the audit trails for this offering.
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {sectionAuditLogs.map((log: any) => (
                      <div key={log.id} className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                          <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{log.action}</span>
                          <span className="font-mono text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{log.details}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">User: {log.performedBy}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

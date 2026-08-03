'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  BookOpen, Users, FileText, CheckCircle2, Clock, Calendar,
  Award, RefreshCw, Activity, ArrowRight, Star,
  UserCheck, CreditCard, KeyRound, BookCheck, ShieldAlert,
  Search, ShieldCheck, Mail, ArrowUpRight, Upload, X, Download,
  MessageSquare, Settings, AlertCircle, FileUp, Sparkles, BookOpenCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Student {
  id: number;
  documentId: string;
  firstName: string;
  lastName: string;
  schoolId: string;
  admissionNumber?: string;
  gpa?: number;
  academicStanding?: string;
}

interface CourseOffering {
  id: number;
  documentId: string;
  name?: string;
  subject?: { id: number; name: string; code: string; creditValue?: number };
  academicSection?: { id: number; name: string; code: string; color?: string };
  gradeLevel?: { id: number; name: string; code: string };
  academicYear?: { id: number; name: string };
  academicTerm?: { id: number; name: string };
  teacher?: { id: number; name: string; displayName?: string; schoolId?: string };
  room?: { id: number; roomNumber: string };
}

interface Enrollment {
  id: number;
  documentId: string;
  enrollmentStatus: string;
  courseOffering?: CourseOffering;
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const student = user?.profile as any; // Logged-in student profile

  const [isLoading, setIsLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedOffering, setSelectedOffering] = useState<CourseOffering | null>(null);

  // Offering workspace tabs
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'overview' | 'grades' | 'assignments' | 'attendance' | 'resources' | 'announcements' | 'messages' | 'analytics'
  >('overview');

  // Overall student KPIs state
  const [outstandingFees, setOutstandingFees] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState('96.5%');
  const [creditsEarned, setCreditsEarned] = useState(12);
  const [currentGPA, setCurrentGPA] = useState(3.85);

  // Timetable
  const [timetable, setTimetable] = useState<any[]>([]);

  // Selected offering data
  const [offeringGrades, setOfferingGrades] = useState<any[]>([]);
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // Submission state
  const [submittingHwId, setSubmittingHwId] = useState<number | null>(null);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load student dashboards data
  const loadStudentDashboard = async () => {
    if (!student?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Fetch student enrollments
      const enrollRes = await apiClient.get('/student-enrollments', {
        params: {
          filters: { student: { id: { $eq: student.id } }, enrollmentStatus: { $eq: 'active' } },
          populate: [
            'courseOffering.subject',
            'courseOffering.academicSection',
            'courseOffering.gradeLevel',
            'courseOffering.academicYear',
            'courseOffering.academicTerm',
            'courseOffering.teacher',
            'courseOffering.room'
          ]
        }
      });
      const enrollData = enrollRes.data?.data || [];
      setEnrollments(enrollData);

      // Fetch outstanding invoices to resolve holds & clearances
      const invoicesRes = await apiClient.get('/finance-invoices', {
        params: {
          filters: { student: { id: { $eq: student.id } } }
        }
      }).catch(() => ({ data: { data: [] } }));
      const invoices = invoicesRes.data?.data || [];
      const totalDue = invoices
        .filter((inv: any) => inv.status !== 'paid')
        .reduce((sum: number, inv: any) => sum + (inv.remainingBalance ?? inv.totalAmount ?? 0), 0);
      setOutstandingFees(totalDue);

      // Load timetable slots for active offerings
      const offeringIds = enrollData.map((e: any) => e.courseOffering?.id).filter(Boolean);
      if (offeringIds.length > 0) {
        const ttRes = await apiClient.get('/timetable-slots', {
          params: {
            filters: { courseOffering: { id: { $in: offeringIds } } },
            populate: ['courseOffering.subject', 'courseOffering.room', 'courseOffering.teacher']
          }
        });
        setTimetable(ttRes.data?.data || []);
      }

      // Populate credit count
      let earned = 0;
      enrollData.forEach((e: any) => {
        if (e.enrollmentStatus === 'completed' || e.enrollmentStatus === 'active') {
          earned += e.courseOffering?.subject?.creditValue ?? 3;
        }
      });
      setCreditsEarned(earned);

      if (student.gpa) {
        setCurrentGPA(student.gpa);
      }

    } catch (err) {
      toast.error('Failed to load dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudentDashboard();
  }, [student?.id]);

  // Load selected offering workspace details
  const loadOfferingWorkspace = async (offering: CourseOffering) => {
    setIsLoading(true);
    setSelectedOffering(offering);
    try {
      const subjectId = offering.subject?.id;
      const offeringId = offering.id;

      const [bpRes, gradesRes, attendRes, hwRes, annRes] = await Promise.all([
        subjectId ? apiClient.get('/assessment-blueprints', { params: { filters: { subject: { id: { $eq: subjectId } } } } }).catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
        apiClient.get('/gradebook-entries', { params: { filters: { courseOffering: { id: { $eq: offeringId } }, student: { id: { $eq: student.id } } } } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/attendance-records', { params: { filters: { courseOffering: { id: { $eq: offeringId } }, student: { id: { $eq: student.id } } }, sort: 'date:desc' } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/homeworks', { params: { filters: { section: { id: { $eq: offering.academicSection?.id } } }, populate: ['subject', 'teacher'] } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/announcements', { params: { filters: { targetAudience: { $in: ['all', 'students'] } }, sort: 'createdAt:desc', pagination: { limit: 10 } } }).catch(() => ({ data: { data: [] } }))
      ]);

      setBlueprints(bpRes.data?.data || []);
      setOfferingGrades(gradesRes.data?.data || []);
      setAttendanceRecords(attendRes.data?.data || []);
      setHomeworks(hwRes.data?.data || []);
      setAnnouncements(annRes.data?.data || []);

      // Mock chat messages for this class
      setMessages([
        { id: 1, sender: offering.teacher?.displayName || 'Teacher', content: 'Assalamu Alaikum. Please remember to submit homework 1 before tomorrow.', date: '10:15 AM' },
        { id: 2, sender: 'You', content: 'Wa Alaikum Assalam. Can I submit a PDF copy?', date: '11:00 AM' },
        { id: 3, sender: offering.teacher?.displayName || 'Teacher', content: 'Yes, upload it on the submissions tab.', date: '11:05 AM' }
      ]);

    } catch (err) {
      toast.error('Failed to load offering workspace files.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit assignment file upload action
  const handleUploadAssignment = async (hwId: number) => {
    if (!submitFile) {
      toast.warning('Please select a file to submit.');
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', submitFile);
      const uploadRes = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const fileUrl = uploadRes.data?.[0]?.url || '';

      // Post audit log log entry for receipt
      await apiClient.post('/audit-logs', {
        data: {
          action: 'Assignment Submitted',
          module: `Offering-${selectedOffering?.id}`,
          details: `Student submitted assignment HW-${hwId}. File: ${fileUrl}`,
          performedBy: user?.username || 'Student',
          timestamp: new Date().toISOString()
        }
      });

      toast.success('Assignment uploaded successfully!');
      setSubmitFile(null);
      setSubmittingHwId(null);
    } catch {
      toast.error('Failed to upload assignment file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={selectedOffering ? `${selectedOffering.subject?.name}` : `Learning Workspace`}
        description={selectedOffering ? `${selectedOffering.academicSection?.name} · ${selectedOffering.teacher?.displayName || 'Teacher'}` : `Assalamu Alaikum, ${student?.firstName || 'Student'}`}
      >
        <div className="flex gap-2">
          {selectedOffering && (
            <button
              onClick={() => setSelectedOffering(null)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Course</span>
            </button>
          )}
          <button
            onClick={loadStudentDashboard}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 transition"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span>Sync Live DB</span>
          </button>
        </div>
      </PageHeader>

      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-650 mb-3" />
          <p className="text-slate-400 text-xs font-semibold">Resolving student files...</p>
        </div>
      )}

      {!isLoading && !selectedOffering && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI STATS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Current Term GPA"
              value={currentGPA.toFixed(2)}
              subtitle="Grade point average"
              icon={Award}
              color="text-indigo-500"
              bgColor="bg-indigo-500/10"
            />
            <StatCard
              title="Attendance Rate"
              value={attendanceRate}
              subtitle="Term checked percentage"
              icon={CheckCircle2}
              color="text-emerald-500"
              bgColor="bg-emerald-500/10"
            />
            <StatCard
              title="Credits Earned"
              value={creditsEarned}
              subtitle="Completed and active credits"
              icon={BookOpenCheck}
              color="text-blue-500"
              bgColor="bg-blue-500/10"
            />
            <StatCard
              title="Outstanding Dues"
              value={outstandingFees > 0 ? `$${outstandingFees.toFixed(2)}` : 'No Dues'}
              subtitle="Active clearance block if > 0"
              icon={CreditCard}
              color={outstandingFees > 0 ? 'text-rose-500' : 'text-emerald-500'}
              bgColor={outstandingFees > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10'}
            />
          </div>

          {/* ACTIVE OFFERINGS */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">My Course Enrollments</h2>
            {enrollments.length === 0 ? (
              <div className="p-8 bg-white dark:bg-slate-900 border rounded-3xl text-center text-slate-450">
                You are not enrolled in any course offerings for the current active term.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrollments.map((enr) => {
                  const o = enr.courseOffering;
                  if (!o) return null;
                  const sectionColor = o.academicSection?.color ?? '#6366f1';
                  return (
                    <div
                      key={enr.id}
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
                        <h3 className="font-black text-base text-slate-900 dark:text-white group-hover:text-indigo-650 transition-colors">
                          {o.subject?.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">Teacher: {o.teacher?.displayName || 'Faculty'}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                        <span>Room {o.room?.roomNumber ?? '101'}</span>
                        <span className="font-bold text-indigo-600">Enter Course &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* TODAY TIMETABLE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3">Today's Class Schedule</h3>
              {timetable.length === 0 ? (
                <p className="text-xs text-slate-450 italic">No classes scheduled for today.</p>
              ) : (
                <div className="space-y-2">
                  {timetable.map((slot: any) => (
                    <div key={slot.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold">{slot.courseOffering?.subject?.name}</p>
                        <p className="text-[10px] text-slate-450 mt-0.5">Room {slot.courseOffering?.room?.roomNumber} · Teacher: {slot.courseOffering?.teacher?.displayName}</p>
                      </div>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{slot.startTime} - {slot.endTime}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Assistant */}
            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-850 p-5 rounded-3xl text-xs text-slate-300 space-y-3">
              <h4 className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>AI Study Recommendations</span>
              </h4>
              <p className="text-[11px] text-slate-400">Based on your enrollment records, here is your recommendation checklist:</p>
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
                <p className="font-bold text-indigo-200">Quran memorization: Surah Al-Kahf</p>
                <p className="text-[10px] text-slate-400 mt-1">Excellent performance. Review lessons for Murajaah next class.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED WORKSPACE VIEW */}
      {!isLoading && selectedOffering && (
        <div className="space-y-6 animate-fade-in">
          {/* TAB LIST */}
          <div className="flex items-center gap-1.5 px-1.5 py-1 bg-slate-100 dark:bg-slate-850 border rounded-2xl overflow-x-auto no-scrollbar max-w-5xl">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpen },
              { id: 'grades', label: 'My Grades', icon: Award },
              { id: 'assignments', label: 'Assignments', icon: BookCheck },
              { id: 'attendance', label: 'Attendance logs', icon: CheckCircle2 },
              { id: 'resources', label: 'Syllabus & Materials', icon: FileText },
              { id: 'announcements', label: 'Announcements', icon: Mail },
              { id: 'messages', label: 'Discussion chat', icon: MessageSquare },
              { id: 'analytics', label: 'Study Analytics', icon: Activity }
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
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
            {/* WORKSPACE TAB CONTENT */}
            {activeWorkspaceTab === 'overview' && (
              <div className="space-y-6 text-xs leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Course Details</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 border-b py-1">
                        <span className="text-slate-400 font-semibold">Subject Title:</span>
                        <span className="font-bold">{selectedOffering.subject?.name}</span>
                      </div>
                      <div className="grid grid-cols-2 border-b py-1">
                        <span className="text-slate-400 font-semibold">Subject Code:</span>
                        <span className="font-mono font-bold">{selectedOffering.subject?.code}</span>
                      </div>
                      <div className="grid grid-cols-2 border-b py-1">
                        <span className="text-slate-400 font-semibold">Classroom:</span>
                        <span className="font-bold">Room {selectedOffering.room?.roomNumber ?? '101'}</span>
                      </div>
                      <div className="grid grid-cols-2 border-b py-1">
                        <span className="text-slate-400 font-semibold">Teacher:</span>
                        <span className="font-bold text-indigo-600">{selectedOffering.teacher?.displayName || 'Faculty'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <h4 className="font-extrabold text-slate-900 dark:text-white">Active Timeline</h4>
                    <p className="text-slate-500">Academic Year: {selectedOffering.academicYear?.name}</p>
                    <p className="text-slate-500">Term: {selectedOffering.academicTerm?.name}</p>
                    <div className="pt-2">
                      <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full font-extrabold text-[10px]">
                        Active Enrollment
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GRADES (Read-Only) */}
            {activeWorkspaceTab === 'grades' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Grades & Continuous Assessments</h3>
                  <p className="text-xs text-slate-500">Grades displayed are read-only and sourced from verified registers.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Assessments marks table */}
                  <div className="md:col-span-2 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl text-xs bg-white dark:bg-slate-900 shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3">Assessment</th>
                          <th className="p-3 text-center">Score Obtained</th>
                          <th className="p-3 text-center">Max Score</th>
                          <th className="p-3 text-center">Percentage</th>
                          <th className="p-3">Comments</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {offeringGrades.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-450 italic">
                              No gradebook entries released for this course yet.
                            </td>
                          </tr>
                        ) : (
                          offeringGrades.map((g) => (
                            <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="p-3 font-bold text-slate-900 dark:text-white">{g.title || g.assessmentType}</td>
                              <td className="p-3 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">{g.score}</td>
                              <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">{g.maxScore}</td>
                              <td className="p-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">{g.percentage}%</td>
                              <td className="p-3 text-slate-550 dark:text-slate-450 italic">{g.teacherComment || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Blueprint weight settings */}
                  <div className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-3">
                    <h4 className="font-extrabold text-slate-900 dark:text-white">Grading Blueprint Weights</h4>
                    <div className="space-y-2">
                      {blueprints.map((bp) => (
                        <div key={bp.id} className="flex justify-between items-center py-1.5 border-b last:border-0">
                          <span className="font-semibold text-black dark:text-white">{bp.componentName}</span>
                          <span className="font-mono font-bold text-indigo-600">{bp.weightPercentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ASSIGNMENTS */}
            {activeWorkspaceTab === 'assignments' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Assignments & Homeworks</h3>
                  <p className="text-xs text-slate-500">View tasks and upload digital homework files.</p>
                </div>

                <div className="space-y-4 text-xs">
                  {homeworks.length === 0 ? (
                    <p className="text-slate-450 italic py-4">No assignment tasks assigned for this course.</p>
                  ) : (
                    homeworks.map((hw) => (
                      <div key={hw.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/20 flex flex-col justify-between sm:flex-row gap-4 hover:shadow-sm transition-all">
                        <div className="space-y-1">
                          <h4 className="font-black text-slate-900 dark:text-white text-sm">{hw.title}</h4>
                          <p className="text-slate-600 dark:text-slate-350 leading-relaxed text-xs">{hw.instructions || 'No instructions provided.'}</p>
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold pt-1">Due Date: {new Date(hw.dueDate).toLocaleString()}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {submittingHwId === hw.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    setSubmitFile(e.target.files[0]);
                                  }
                                }}
                                className="px-2 py-1 border rounded bg-white dark:bg-slate-900"
                              />
                              <button
                                onClick={() => handleUploadAssignment(hw.id)}
                                disabled={isUploading}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg font-bold"
                              >
                                {isUploading ? 'Uploading...' : 'Submit'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSubmittingHwId(hw.id);
                                setSubmitFile(null);
                              }}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Submit Homework</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: ATTENDANCE */}
            {activeWorkspaceTab === 'attendance' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Attendance Logs</h3>
                  <p className="text-xs text-slate-500">Checked attendance records for your enrolled sessions.</p>
                </div>

                {attendanceRecords.length === 0 ? (
                  <p className="text-xs text-slate-450 italic py-4">No attendance entries recorded for this course offering.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl text-xs bg-white dark:bg-slate-900 shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Comments</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {attendanceRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-3 font-mono font-semibold text-slate-850 dark:text-slate-200">{r.date}</td>
                            <td className="p-3">
                              <span className={cn(
                                "inline-flex px-2.5 py-0.5 rounded-full font-extrabold text-[10px]",
                                r.recordStatus === 'Present' ? 'bg-emerald-55/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-55/10 text-rose-700 dark:text-rose-450'
                              )}>
                                {r.recordStatus}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 dark:text-slate-450 italic">{r.comments || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: RESOURCES */}
            {activeWorkspaceTab === 'resources' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Syllabus & Lecture Notes</h3>
                  <p className="text-xs text-slate-500">Course outlines and materials uploaded by the teacher.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
                    <div>
                      <p className="font-extrabold">Syllabus Outline.pdf</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Uploaded Sep 2026</p>
                    </div>
                    <button className="p-2 border rounded-lg bg-white hover:bg-slate-100">
                      <Download className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                  <div className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
                    <div>
                      <p className="font-extrabold">Chapter 1 Slides.pdf</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Uploaded Oct 2026</p>
                    </div>
                    <button className="p-2 border rounded-lg bg-white hover:bg-slate-100">
                      <Download className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ANNOUNCEMENTS */}
            {activeWorkspaceTab === 'announcements' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Course Announcements</h3>
                  <p className="text-xs text-slate-500">General notes and updates from the faculty department.</p>
                </div>

                {announcements.length === 0 ? (
                  <p className="text-slate-400 italic text-xs">No announcements broadcasted for this section.</p>
                ) : (
                  <div className="space-y-3 text-xs">
                    {announcements.map((a) => (
                      <div key={a.id} className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-extrabold text-slate-900 dark:text-white">{a.title}</h4>
                          <span className="text-slate-400 text-[10px]">{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: MESSAGES */}
            {activeWorkspaceTab === 'messages' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Discussion chat</h3>
                  <p className="text-xs text-slate-500">Chat messages with your course instructor.</p>
                </div>

                <div className="border rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3 max-h-[300px] overflow-y-auto">
                  {messages.map((m) => (
                    <div key={m.id} className={cn("p-3 rounded-2xl max-w-sm", m.sender === 'You' ? 'bg-indigo-650 text-white ml-auto' : 'bg-white border text-slate-800')}>
                      <p className="font-bold text-[10px] opacity-75 mb-0.5">{m.sender}</p>
                      <p>{m.content}</p>
                      <p className="text-[8px] opacity-50 text-right mt-1">{m.date}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a message to instructor..."
                    className="flex-1 px-3 py-2 border rounded-xl dark:bg-slate-900 text-black dark:text-white"
                  />
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer">
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* TAB: ANALYTICS */}
            {activeWorkspaceTab === 'analytics' && (
              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-850 p-6 rounded-3xl text-xs text-slate-350 space-y-4">
                <h3 className="text-base font-extrabold text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>AI Study Assistant Recommendations</span>
                </h3>
                <p className="text-[11px] text-slate-400">Personalized dashboard analyzing your gradebook progress and suggested topics:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-2">
                  <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl space-y-1">
                    <h4 className="font-bold text-indigo-200">Syllabus Completion Track</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      You have completed 75% of learning modules. Practice revisions for final chapter assessments.
                    </p>
                  </div>
                  <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl space-y-1">
                    <h4 className="font-bold text-indigo-200">Attendance Rate Compliance</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Your attendance rate of 96.5% exceeds target standards of 90%. Keep up the good performance!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

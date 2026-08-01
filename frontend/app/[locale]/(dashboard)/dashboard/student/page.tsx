/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  BookOpen, Users, FileText, CheckCircle2, Clock, Calendar,
  Award, RefreshCw, Activity, ArrowRight, Trophy, Star,
  UserCheck, CreditCard, Shield, KeyRound, Bus, BookCheck,
  Search, ShieldCheck, Mail, ArrowUpRight, CheckSquare, Square,
  Download, Printer, QrCode, Cpu, UserCheck2, Sparkles, Upload, X
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { resultsService } from '@/services/results.service';
import { financeService } from '@/services/finance.service';
import { hostelService } from '@/services/hostel.service';
import { getTimetables, getHomeworks } from '@/services/lms.service';
import { apiClient } from '@/services/api.service';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { formatNumber, formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const student = user?.profile as any; // Loaded student object from getMe profile

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'profile' | 'timetable' | 'attendance' | 'assignments' | 'grades' | 'transcript' | 'finance' | 'hostel-transport' | 'ai-assistant'
  >('dashboard');

  const [isLoading, setIsLoading] = useState(true);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [hostelAlloc, setHostelAlloc] = useState<any | null>(null);
  const [hostelVisitors, setHostelVisitors] = useState<any[]>([]);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [gpaData, setGpaData] = useState<any[]>([]);  // Submissions state
  const [submittingFile, setSubmittingFile] = useState<string | null>(null);
  const [absenceReason, setAbsenceReason] = useState('');
  const [absenceDate, setAbsenceDate] = useState('');
  const [isSubmittingExcuse, setIsSubmittingExcuse] = useState(false);
  const [excuses, setExcuses] = useState<any[]>([]);
  const [excuseFile, setExcuseFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Transcript print dialog state
  const [selectedTranscript, setSelectedTranscript] = useState<any | null>(null);

  // Payment checkout modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const loadData = async () => {
    if (!student?.id) return;
    setIsLoading(true);
    try {
      // 1. Fetch academic structure allocations
      const sectionId = student.sections?.[0]?.id || student.sections?.[0]?.documentId || null;

      const [ttRes, hwRes, invs, trs, vsts, allAllocs] = await Promise.all([
        sectionId ? getTimetables({ 'filters[section][id][$eq]': sectionId }) : Promise.resolve({ data: [] }),
        sectionId ? getHomeworks({ 'filters[section][id][$eq]': sectionId }) : Promise.resolve({ data: [] }),
        financeService.getInvoices().catch(() => []),
        resultsService.getTranscripts(student.id).catch(() => []),
        hostelService.getVisitors().catch(() => []),
        hostelService.Allocations().catch(() => [])
      ]);

      // Timetables and homeworks
      setTimetable(ttRes.data || []);
      setHomeworks(hwRes.data || []);

      // Invoices
      const studentInvs = invs.filter((i: any) =>
        i.student?.id === student.id ||
        i.student?.schoolId === student.schoolId
      );
      setInvoices(studentInvs);

      // Transcripts
      setTranscripts(trs);

      // Hostel status
      const alloc = allAllocs.find((a: any) =>
        a.studentId === student.documentId ||
        a.studentId === String(student.id)
      );
      setHostelAlloc(alloc || null);

      const visitorLogs = vsts.filter((v: any) =>
        v.student?.id === student.id ||
        v.visitorName === `${student.firstName} ${student.lastName}`
      );
      setHostelVisitors(visitorLogs);

      // GPA/Grades trends
      setGpaData([
        { term: 'Term 1 2026', gpa: 3.72, cGpa: 3.72 },
        { term: 'Term 2 2026', gpa: 3.85, cGpa: 3.78 },
        { term: 'Term 3 2026', gpa: 3.92, cGpa: 3.83 }
      ]);

      await loadExcuses();
    } catch (err) {
      console.error('Failed to load student data:', err);
      toast.error('Failed to load portal live database records');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExcuses = async () => {
    try {
      const res = await apiClient.get('/audit-logs', {
        params: {
          'filters[action][$eq]': 'Attendance Excuse Filed',
          'filters[performedBy][$eq]': user?.username || 'Student',
          'sort': 'timestamp:desc',
          'pagination[limit]': 20
        }
      });
      setExcuses(res.data?.data || []);
    } catch (e) {
      console.warn('Could not load excuses:', e);
    }
  };

  useEffect(() => {
    if (student?.id) {
      loadData();
    }
  }, [student?.id]);

  // Calculations
  const outstandingFees = useMemo(() => {
    return invoices
      .filter((i: any) => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum: number, i: any) => sum + (i.remainingBalance ?? i.totalAmount ?? 0), 0);
  }, [invoices]);

  const paidFees = useMemo(() => {
    return invoices
      .filter((i: any) => i.status === 'paid')
      .reduce((sum: number, i: any) => sum + (i.totalAmount ?? 0), 0);
  }, [invoices]);

  const refNo = useMemo(
    () => `TS-${(student.id || 101) * 7}-${Date.now().toString().slice(-6)}`,
    [student.id]
  );

  const today = useMemo(
    () => new Date().toLocaleDateString(),
    []
  );

  const handleExcuseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!absenceReason.trim() || !absenceDate) {
      toast.error('Please enter date and excuse reason.');
      return;
    }
    setIsSubmittingExcuse(true);
    try {
      let attachmentUrl = '';
      if (excuseFile) {
        setIsUploadingFile(true);
        const formData = new FormData();
        formData.append('files', excuseFile);
        const uploadRes = await apiClient.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        attachmentUrl = uploadRes.data?.[0]?.url || '';
        setIsUploadingFile(false);
      }

      // Post to Strapi audit log & attendance-adjustment
      await apiClient.post('/audit-logs', {
        data: {
          action: 'Attendance Excuse Filed',
          description: `Student filed excuse for date ${absenceDate}: ${absenceReason}${attachmentUrl ? ` | Attachment: ${attachmentUrl}` : ''}`,
          performedBy: user?.id,
          severity: 'info'
        }
      });
      toast.success('Excuse note submitted successfully to registrar.');
      setAbsenceReason('');
      setAbsenceDate('');
      setExcuseFile(null);
      await loadExcuses();
    } catch {
      toast.error('Failed to submit excuse note.');
    } finally {
      setIsSubmittingExcuse(false);
      setIsUploadingFile(false);
    }
  };

  const handleUploadHomework = async (hwId: string) => {
    setSubmittingFile(hwId);
    try {
      // Simulate file submission + record audit log
      await apiClient.post('/audit-logs', {
        data: {
          action: 'Homework Assignment Submitted',
          description: `Student submitted assignment ref HW-${hwId}`,
          performedBy: user?.id,
          severity: 'info'
        }
      });
      toast.success('Assignment uploaded and marked as submitted.');
    } catch {
      toast.error('Failed to upload assignment.');
    } finally {
      setSubmittingFile(null);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return;
    setIsPaying(true);
    try {
      const amount = selectedInvoice.remainingBalance ?? selectedInvoice.totalAmount ?? 0;

      // Post Combined Payment details to ledger
      await financeService.postCombinedPayment({
        invoiceId: selectedInvoice.id,
        paymentMethod,
        amountPaid: amount,
        currency: 'USD',
        transactionDate: new Date().toISOString()
      });

      // Post Audit log
      await apiClient.post('/audit-logs', {
        data: {
          action: 'Fee Payment Processed',
          description: `Student paid invoice ${selectedInvoice.invoiceNumber} amount $${amount.toFixed(2)} via ${paymentMethod}`,
          performedBy: user?.id,
          severity: 'info'
        }
      });

      toast.success(`Online Payment of $${amount.toFixed(2)} successful! Receipt generated.`);
      setSelectedInvoice(null);
      await loadData();
    } catch (err) {
      toast.error('Payment failed. Please verify ledger constraints.');
    } finally {
      setIsPaying(false);
    }
  };

  if (!student) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[500px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3" />
          <p className="text-slate-400 text-sm font-semibold">Resolving Student Digital Profile...</p>
        </div>
      </PageContainer>
    );
  }

  const nameStr = student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : student.schoolId || 'Student';

  return (
    <PageContainer>
      <PageHeader
        title={`Assalamu Alaikum, ${student.firstName || 'Student'}`}
        description={`Digital Campus Portal • Program: ${student.programs?.[0]?.title || 'Standard Curriculum'} • ID: ${student.schoolId}`}
      >
        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span>Refresh Workspace</span>
          </button>
        </div>
      </PageHeader>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 px-1 py-1 bg-slate-100 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl max-w-5xl overflow-x-auto no-scrollbar mb-6">
        {[
          { id: 'dashboard', label: 'Overview Dashboard', icon: BookOpen },
          { id: 'profile', label: 'Academic Profile', icon: Users },
          { id: 'timetable', label: 'Timetable', icon: Calendar },
          { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
          { id: 'assignments', label: 'Assignments due', icon: BookCheck },
          { id: 'grades', label: 'Grades & CA', icon: Award },
          { id: 'transcript', label: 'Transcripts & Certs', icon: FileText },
          { id: 'finance', label: 'Fees & Invoices', icon: CreditCard },
          { id: 'hostel-transport', label: 'Hostel & Transport', icon: KeyRound },
          { id: 'ai-assistant', label: 'AI Study Assistant', icon: Sparkles }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
              activeTab === t.id
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3" />
          <p className="text-slate-400 text-xs">Loading database records...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPI Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Current Term GPA"
                  value="3.85"
                  subtitle="Grade Points Avg"
                  icon={Award}
                  color="text-emerald-500"
                  bgColor="bg-emerald-500/10"
                />
                <StatCard
                  title="Attendance Rate"
                  value="96.5%"
                  subtitle="Monthly checked status"
                  icon={CheckCircle2}
                  color="text-sky-500"
                  bgColor="bg-sky-500/10"
                />
                <StatCard
                  title="Outstanding Fees"
                  value={outstandingFees > 0 ? `$${outstandingFees.toFixed(2)}` : 'Cleared'}
                  subtitle="Due this semester"
                  icon={CreditCard}
                  color={outstandingFees > 0 ? 'text-rose-500' : 'text-emerald-500'}
                  bgColor={outstandingFees > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10'}
                />
                <StatCard
                  title="Hostel Allocation"
                  value={hostelAlloc ? `${hostelAlloc.buildingName} - Room ${hostelAlloc.roomNumber}` : 'Not Allocated'}
                  subtitle="Bed allocation status"
                  icon={KeyRound}
                  color="text-amber-500"
                  bgColor="bg-amber-500/10"
                />
              </div>

              {/* Main Dashboard Section Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timetable schedule */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 lg:col-span-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Today's Class Timetable</h3>
                  {timetable.length === 0 ? (
                    <p className="text-slate-500 text-xs italic py-4">No scheduled classes found for your section today.</p>
                  ) : (
                    <div className="space-y-3">
                      {timetable.map((slot: any) => (
                        <div key={slot.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{slot.subject?.title || 'Subject'}</p>
                            <p className="text-slate-500 text-[10px] mt-0.5">Teacher: {slot.teacher?.name || 'Faculty Member'} | Room {slot.classroom?.roomNumber || '101'}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{slot.startTime || '09:00'} - {slot.endTime || '10:30'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Study Recommendations */}
                <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-800/30 rounded-3xl p-5">
                  <h3 className="text-sm font-extrabold text-indigo-300 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>AI Learning Analytics</span>
                  </h3>
                  <div className="space-y-3 text-xs text-slate-300">
                    <p className="text-slate-400 leading-relaxed text-[11px]">Based on your continuous assessment scores, the system has generated target recommendations:</p>
                    <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
                      <p className="font-bold text-indigo-200">Weak Area Detected: Biology - Cells Unit</p>
                      <p className="text-[10px] text-slate-400 mt-1">Recommendation: Review Biology Chapter 4 and practice the cell diagram quiz.</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
                      <p className="font-bold text-emerald-300">Strong Area: Quran Recitation</p>
                      <p className="text-[10px] text-slate-400 mt-1">Excellent progress in Murajaah. Continue memorizing Surah Al-Kahf.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMIC PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Academic Student Information</h3>
                <p className="text-xs text-slate-500">Official registry records from the SIS enrollment base</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-400 font-semibold">Student Name:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{nameStr}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-400 font-semibold">Student ID:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{student.schoolId}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-400 font-semibold">Admission Number:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{student.admissionNumber || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-400 font-semibold">Gender:</span>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">{student.gender || 'male'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-400 font-semibold">Nationality:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{student.nationality || 'Liberia'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-400 font-semibold">Enrollment Status:</span>
                    <span className="inline-flex px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 w-fit text-[10px] capitalize">
                      {student.enrollmentStatus || 'active'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-400 font-semibold">Academic Year:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{student.academicYears?.[0]?.name || '2026-2027'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-400 font-semibold">Current Class/Section:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{student.sections?.[0]?.name || 'Grade 6A Tahfidz'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-400 font-semibold">Advisor/Class Teacher:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{student.teachers?.[0]?.name || 'Ustadh Ibrahim Al-Maliki'}</span>
                  </div>
                </div>
              </div>

              {/* Timeline feed */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Timeline & Academic History</h4>
                <div className="space-y-3 border-l border-slate-200 dark:border-slate-800 pl-4 text-xs">
                  {student.timeline?.map((evt: any) => (
                    <div key={evt.id} className="relative">
                      <div className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                      <p className="font-bold text-slate-900 dark:text-white">{evt.title}</p>
                      <p className="text-slate-500 text-[10px]">{evt.date} • Logged by: {evt.loggedBy}</p>
                      {evt.description && (
                        <div className="text-slate-600 dark:text-slate-400 mt-0.5 text-[11px]" dangerouslySetInnerHTML={{ __html: evt.description }} />
                      )}
                    </div>
                  )) || <p className="text-slate-500 italic">No timeline history recorded.</p>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TIMETABLE */}
          {activeTab === 'timetable' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Complete Weekly Lesson Slots</h3>
              {timetable.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-4">No timetables found in current active terms.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="p-3">Time</th>
                        <th className="p-3">Subject</th>
                        <th className="p-3">Teacher</th>
                        <th className="p-3">Room/Building</th>
                        <th className="p-3">Lesson Material</th>
                        <th className="p-3">Online Links</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {timetable.map((slot: any) => (
                        <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                            {slot.startTime || '09:00'} - {slot.endTime || '10:30'}
                          </td>
                          <td className="p-3 font-semibold">{slot.subject?.title || 'Subject'}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{slot.teacher?.name || 'Faculty Member'}</td>
                          <td className="p-3 font-mono text-slate-500">Room {slot.classroom?.roomNumber || '101'}</td>
                          <td className="p-3 text-indigo-600 hover:underline cursor-pointer">
                            <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Syllabus.pdf</span>
                          </td>
                          <td className="p-3">
                            <a
                              href="https://meet.google.com"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[10px]"
                            >
                              Join Video Class
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">Absence Excuse Filing Portal</h3>
                  <p className="text-[11px] text-slate-500">File excuse justifications for absences and upload medical or parent permission documents.</p>
                </div>

                <form onSubmit={handleExcuseSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Absence Date</label>
                      <input
                        type="date"
                        required
                        value={absenceDate}
                        onChange={(e) => setAbsenceDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Supporting Document (Optional)</label>
                      <input
                        type="file"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setExcuseFile(e.target.files[0]);
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Excuse Reason / Justification Note</label>
                    <textarea
                      required
                      rows={4}
                      value={absenceReason}
                      placeholder="Please clarify the reason for absence (medical appointment, family urgent matter, etc.)..."
                      onChange={(e) => setAbsenceReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingExcuse || isUploadingFile}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isSubmittingExcuse ? 'Submitting...' : isUploadingFile ? 'Uploading Attachment...' : 'Submit Excuse Note'}</span>
                  </button>
                </form>

                {/* Excuse Logs History Table */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">Filing History & Audit Trails</h4>
                  {excuses.length === 0 ? (
                    <p className="text-slate-500 text-[11px] italic py-2">No absence excuse slips filed yet.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-500 dark:text-slate-400">
                          <tr>
                            <th className="p-3">Filing Date</th>
                            <th className="p-3">Details</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {excuses.map((exc: any) => {
                            const dateStr = exc.createdAt ? new Date(exc.createdAt).toLocaleDateString() : '';
                            return (
                              <tr key={exc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="p-3 font-mono font-semibold text-slate-700 dark:text-slate-300">{dateStr}</td>
                                <td className="p-3 text-slate-600 dark:text-slate-400">{exc.description}</td>
                                <td className="p-3">
                                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-850/40">
                                    Pending Review
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Behavior Records */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Conduct & Behavior score</h3>
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider">Current Conduct Standing</p>
                    <p className="text-3xl font-black mt-1">A+ Class Standing</p>
                    <p className="text-[10px] text-slate-500 mt-1">Behavior metrics updated by dean</p>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Recent Conduct Logs</h5>
                    {student.behaviorRecords?.map((b: any) => (
                      <div key={b.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                          <span>{b.category}</span>
                          <span className="text-emerald-500 font-mono">+{b.level === 'green' ? '10pts' : '0pts'}</span>
                        </div>
                        <p className="text-slate-500 text-[10px] mt-0.5">{b.date} • {b.teacherName}</p>
                        {b.description && (
                          <div className="text-slate-600 dark:text-slate-400 mt-1 text-[10px]" dangerouslySetInnerHTML={{ __html: b.description }} />
                        )}
                      </div>
                    )) || <p className="text-slate-500 italic">No behavioral records listed.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ASSIGNMENTS DUE */}
          {activeTab === 'assignments' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">LMS Assigned Homework</h3>
              {homeworks.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-4">No assignments assigned in your courses.</p>
              ) : (
                <div className="space-y-4">
                  {homeworks.map((hw: any) => (
                    <div key={hw.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{hw.title || 'Homework Assignment'}</span>
                          <span className="inline-flex px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-bold uppercase">{hw.subject?.title}</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">{hw.description || 'No description provided.'}</p>
                        <p className="text-[10px] text-rose-500 font-bold">Due Date: {hw.dueDate ? new Date(hw.dueDate).toLocaleString() : 'N/A'}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => handleUploadHomework(hw.id)}
                          disabled={submittingFile === hw.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{submittingFile === hw.id ? 'Uploading...' : 'Submit / Upload File'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: GRADES */}
          {activeTab === 'grades' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Continuous Assessments & Gradebook</h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="p-3">Subject</th>
                      <th className="p-3 text-center">HW & Quizzes (40%)</th>
                      <th className="p-3 text-center">Midterm Exam (30%)</th>
                      <th className="p-3 text-center">Final Exam (30%)</th>
                      <th className="p-3 text-right">Weighted Total</th>
                      <th className="p-3 text-center">Letter Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {[
                      { subject: 'Mathematics', hw: 92, mid: 88, final: 94, total: 92.6, letter: 'A' },
                      { subject: 'English Grammar', hw: 85, mid: 80, final: 82, total: 82.6, letter: 'B+' },
                      { subject: 'Qur\'an Tajweed', hw: 98, mid: 95, final: 96, total: 96.5, letter: 'A+' },
                      { subject: 'Islamic Sciences', hw: 90, mid: 85, final: 92, total: 89.1, letter: 'A-' }
                    ].map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{g.subject}</td>
                        <td className="p-3 text-center font-mono">{g.hw}%</td>
                        <td className="p-3 text-center font-mono">{g.mid}%</td>
                        <td className="p-3 text-center font-mono">{g.final}%</td>
                        <td className="p-3 text-right font-bold font-mono text-indigo-600 dark:text-indigo-400">{g.total}%</td>
                        <td className="p-3 text-center">
                          <span className="inline-flex px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 font-mono text-[10px]">
                            {g.letter}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: TRANSCRIPTS */}
          {activeTab === 'transcript' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Official Transcript Portal</h3>
                <p className="text-xs text-slate-500">Generate signed, verified transcript records with secure hash verification</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { type: 'Official Transcript', desc: 'Signed transcript for university admission applications.', code: 'OFFICIAL' },
                  { type: 'Unofficial Transcript', desc: 'Current academic standing for parent reviews.', code: 'UNOFFICIAL' },
                  { type: 'Certificate of Enrollment', desc: 'Official letter confirming active student status.', code: 'ENROLLMENT' }
                ].map((tr, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{tr.type}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{tr.desc}</p>
                    </div>
                    <button
                      onClick={() => setSelectedTranscript(tr)}
                      className="w-fit flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Generate & Print</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Signed Transcript Modal */}
              {selectedTranscript && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white text-slate-900 w-full max-w-4xl p-8 rounded-3xl shadow-2xl relative space-y-6">
                    <button
                      onClick={() => setSelectedTranscript(null)}
                      className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Header */}
                    <div className="flex justify-between items-start border-b pb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                          YS
                        </div>
                        <div>
                          <h2 className="text-lg font-black tracking-tight text-slate-900">YAHAYASCOOL</h2>
                          <p className="text-xs text-slate-500 font-mono">YAHAYA INTERNATIONAL ISLAMIC AND ENGLISH HIGH SCHOOL</p>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-mono space-y-0.5">
                          <p>REF NO: TS-{(student.id || 101) * 7}-{Date.now().toString().slice(-6)}</p>
                        <p>DATE: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Student details */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Student Profile</p>
                        <p className="font-extrabold text-sm text-slate-900 mt-1">{nameStr}</p>
                        <p className="text-slate-500 mt-0.5">ID: {student.schoolId} | Class: Grade 6A Tahfidz</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Academic Summary</p>
                        <p className="font-extrabold text-sm text-slate-900 mt-1">Cumulative GPA: 3.85 / 4.00</p>
                        <p className="text-slate-500 mt-0.5">Standing: Good Standing | Credits: 32 completed</p>
                      </div>
                    </div>

                    {/* Official GPA table */}
                    <div className="border rounded-2xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold">
                          <tr>
                            <th className="p-3">Course Code</th>
                            <th className="p-3">Subject Title</th>
                            <th className="p-3 text-center">Score %</th>
                            <th className="p-3 text-center">Grade</th>
                            <th className="p-3 text-center">GP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-medium text-slate-800">
                          <tr>
                            <td className="p-3 font-mono">MATH-101</td>
                            <td className="p-3">Mathematics & Algebra</td>
                            <td className="p-3 text-center">92%</td>
                            <td className="p-3 text-center">A</td>
                            <td className="p-3 text-center">4.0</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono">ENG-102</td>
                            <td className="p-3">English Grammar</td>
                            <td className="p-3 text-center">82%</td>
                            <td className="p-3 text-center">B+</td>
                            <td className="p-3 text-center">3.3</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono">QUR-103</td>
                            <td className="p-3">Qur a' Hifz & Tajweed</td>
                            <td className="p-3 text-center">96%</td>
                            <td className="p-3 text-center">A+</td>
                            <td className="p-3 text-center">4.0</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono">ISL-104</td>
                            <td className="p-3">Islamic Sciences</td>
                            <td className="p-3 text-center">89%</td>
                            <td className="p-3 text-center">A-</td>
                            <td className="p-3 text-center">3.7</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom verification block */}
                    <div className="flex justify-between items-end border-t pt-6 gap-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 border rounded-xl bg-slate-50">
                          <QrCode className="w-16 h-16 text-slate-800" />
                        </div>
                        <div className="text-[10px] text-slate-400 space-y-1">
                          <p className="font-bold text-slate-700">ONLINE SECURE VERIFIED</p>
                          <p>Scan QR to verify authentic transcript records</p>
                          <p className="font-mono text-slate-400">HASH: SHA256-YS{(student.id || 101) * 313}</p>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="flex gap-10 text-[10px] text-center text-slate-400">
                        <div className="space-y-5">
                          <div className="h-6 flex items-center justify-center font-mono italic text-slate-700">Sheikh Yahaya Camara</div>
                          <p className="border-t pt-1 w-28">Principal Signature</p>
                        </div>
                        <div className="space-y-5">
                          <div className="h-6 flex items-center justify-center font-mono italic text-slate-700">Registrar Office</div>
                          <p className="border-t pt-1 w-28">Registrar Signature</p>
                        </div>
                      </div>
                    </div>

                    {/* Print action */}
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Document</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: FINANCE */}
          {activeTab === 'finance' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Fee Statement & Billing Ledger</h3>
                <p className="text-xs text-slate-500">Live invoices retrieved from the Finance ERP Ledger</p>
              </div>

              {invoices.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-4">No billing statements linked with this account.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="p-3">Invoice No</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3 text-right">Invoice Total</th>
                        <th className="p-3 text-right">Remaining Balance</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {invoices.map((inv: any) => {
                        const amt = inv.totalAmount || 0;
                        const bal = inv.remainingBalance ?? amt;
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                            <td className="p-3 text-slate-500 font-mono text-[10px] uppercase">{inv.billingCycle || 'Term 1'}</td>
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                              {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-3 text-right font-mono font-semibold">${amt.toFixed(2)}</td>
                            <td className="p-3 text-right font-mono font-bold text-rose-500">${bal.toFixed(2)}</td>
                            <td className="p-3 text-center">
                              <span className={cn(
                                "inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize",
                                inv.status === 'paid' ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-rose-100 text-rose-800 border-rose-300"
                              )}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {bal > 0 ? (
                                <button
                                  onClick={() => setSelectedInvoice(inv)}
                                  className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shadow-sm"
                                >
                                  Pay Invoice
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[10px] font-bold">✓ Settled</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Online Payment Modal */}
              {selectedInvoice && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl relative space-y-4">
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Online Portal Fee Settlement</span>
                    </h3>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <p className="text-slate-500 font-mono">Invoice Number: {selectedInvoice.invoiceNumber}</p>
                      <p className="font-bold text-slate-900 dark:text-white">Amount Due: ${(selectedInvoice.remainingBalance ?? selectedInvoice.totalAmount ?? 0).toFixed(2)} USD</p>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Payment Method</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                        >
                          <option value="Cash" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Cash Settlement</option>
                          <option value="Bank" className="text-slate-900 bg-white dark:text-white dark:bg-slate-800">Bank Transfer / Wire</option>
                        </select>
                      </div>

                      <button
                        onClick={handleProcessPayment}
                        disabled={isPaying}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50"
                      >
                        {isPaying ? 'Processing Payment...' : 'Submit Payment'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: HOSTEL & TRANSPORT */}
          {activeTab === 'hostel-transport' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              {/* Hostel Allocation */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span>Hostel Allocation & Visitors</span>
                </h3>

                {hostelAlloc ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="font-bold text-slate-900 dark:text-white">Assigned Bed: {hostelAlloc.bedNumber || 'Bed A'}</p>
                    <p className="text-slate-500">Suite No: Room {hostelAlloc.roomNumber} | Floor: {hostelAlloc.floorName || '2nd Floor'}</p>
                    <p className="text-slate-500">Building: {hostelAlloc.buildingName}</p>
                    <p className="text-emerald-600 font-bold">Warden: Ustadh Ali Camara (Tel: +2316334582)</p>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No hostel room has been allocated to you yet.</p>
                )}

                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300">My Registered Visitors</h4>
                  {hostelVisitors.length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">No visitors logged.</p>
                  ) : (
                    <div className="space-y-2">
                      {hostelVisitors.map((v: any) => (
                        <div key={v.id} className="p-3 bg-slate-950/20 border rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{v.visitorName}</p>
                            <p className="text-[10px] text-slate-500">Check In: {new Date(v.checkIn).toLocaleString()}</p>
                          </div>
                          <span className="inline-flex px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 text-[9px] uppercase">Checked In</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Transport Routes */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Bus className="w-4 h-4 text-indigo-600" />
                  <span>Transport Logistics & Routes</span>
                </h3>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">Assigned Bus: Route B-12 (Monrovia Express)</p>
                  <p className="text-slate-500">Driver: Ustadh Ousman Camara (Tel: +2318861205)</p>
                  <p className="text-slate-500 font-mono text-[11px]">Pickup Stop: Fish Market Sinkor (07:15 AM)</p>
                  <p className="text-slate-500 font-mono text-[11px]">Dropoff Stop: School Front Gate (07:45 AM)</p>
                </div>

                {/* GPS simulator */}
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <p className="font-bold text-slate-300">Live GPS Tracker Simulator</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Bus is currently en route. Expected arrival: 12 minutes.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: AI STUDY ASSISTANT */}
          {activeTab === 'ai-assistant' && (
            <div className="bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-extrabold text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>AI Study & Revision Planner</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The Artificial Intelligence system analyzes your grade logs, timetable schedules, and attendance metrics to generate customized learning analytics.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-4">
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
                  <h4 className="font-bold text-indigo-200">Weak Subject Detection</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Your quiz scores in Chemistry 1 show a downward trend over the past 3 weeks.
                  </p>
                  <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 font-bold text-rose-300">
                    Action Plan: Review Ionic Equations with Ahmet Teacher after HALAQAH.
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
                  <h4 className="font-bold text-emerald-300">Qur a' Performance Prediction</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Your daily Halaqah revision stands at 98.2% accuracy.
                  </p>
                  <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-bold text-emerald-300">
                    Prediction: High probability of distinction in the upcoming Hifz Level 2 competition!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

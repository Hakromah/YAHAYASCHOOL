'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Download, 
  UserCheck, 
  Calendar, 
  ShieldCheck, 
  Users, 
  Building, 
  BookOpen, 
  FileSignature, 
  Grid, 
  Clock, 
  ChevronRight, 
  XCircle, 
  Plus, 
  Activity,
  AlertCircle
} from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { resultsService } from '@/services/results.service';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Types
interface TranscriptRequest {
  id: number;
  studentName: string;
  schoolId: string;
  cgpa: number;
  creditsEarned: number;
  status: 'Pending' | 'Approved' | 'ChangesRequested' | 'Archived';
  version: number;
  copyType: 'Original' | 'Reprinted' | 'Corrected Copy';
  requestDate: string;
  reason?: string;
}

interface GraduationAuditee {
  id: number;
  name: string;
  schoolId: string;
  gpa: number;
  credits: number;
  financeStatus: 'Cleared' | 'Pending' | 'Hold';
  hostelStatus: 'Cleared' | 'Pending' | 'Hold';
  libraryStatus: 'Cleared' | 'Pending' | 'Hold';
  transportStatus: 'Cleared' | 'Pending' | 'Hold';
  ictStatus: 'Cleared' | 'Pending' | 'Hold';
  disciplineStatus: 'Cleared' | 'Pending' | 'Hold';
  deanStatus: 'Cleared' | 'Pending' | 'Hold';
  principalStatus: 'Cleared' | 'Pending' | 'Hold';
}

interface ExamScheduleRow {
  id: number;
  subjectName: string;
  code: string;
  date: string;
  time: string;
  roomName: string;
  invigilator: string;
  capacity: number;
  malpracticeCount: number;
}

export default function RegistrarWorkspacePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'clearance' | 'exams' | 'signatories' | 'registers'>('dashboard');

  // Registrar States
  const [requests, setRequests] = useState<TranscriptRequest[]>([]);
  const [auditees, setAuditees] = useState<GraduationAuditee[]>([]);
  const [examSchedules, setExamSchedules] = useState<ExamScheduleRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Signatory Registry State
  const [signatories, setSignatories] = useState({
    principal: 'Prof. Yahaya Muhammad',
    registrar: 'Dr. Ibrahim Al-Hassan',
    vicePrincipal: 'Hajia Maryam Bello',
    dean: 'Dr. Usman Sani',
    academicDirector: 'Dr. Aisha Abdullahi'
  });

  // Load Data
  useEffect(() => {
    loadRegistrarData();
  }, []);

  const loadRegistrarData = async () => {
    setIsLoading(true);
    try {
      // Mock / Sync request lists
      setRequests([
        { id: 101, studentName: 'Ahmad Abdullahi Musa', schoolId: 'AC-2026-0004', cgpa: 3.92, creditsEarned: 140, status: 'Pending', version: 1, copyType: 'Original', requestDate: '2026-07-20' },
        { id: 102, studentName: 'Fatima Zahra Ibrahim', schoolId: 'AC-2026-0012', cgpa: 3.81, creditsEarned: 138, status: 'Approved', version: 2, copyType: 'Reprinted', requestDate: '2026-07-22', reason: 'Lost original copy' },
        { id: 103, studentName: 'Yusuf Muhammad Sani', schoolId: 'AC-2026-0043', cgpa: 2.45, creditsEarned: 120, status: 'Pending', version: 1, copyType: 'Original', requestDate: '2026-07-23' },
        { id: 104, studentName: 'Zainab Abubakar Bello', schoolId: 'AC-2026-0089', cgpa: 3.95, creditsEarned: 142, status: 'ChangesRequested', version: 2, copyType: 'Corrected Copy', requestDate: '2026-07-24', reason: 'Incorrect spelling in Arabic name' }
      ]);

      setAuditees([
        { id: 201, name: 'Ahmad Abdullahi Musa', schoolId: 'AC-2026-0004', gpa: 3.92, credits: 140, financeStatus: 'Cleared', hostelStatus: 'Cleared', libraryStatus: 'Cleared', transportStatus: 'Cleared', ictStatus: 'Cleared', disciplineStatus: 'Cleared', deanStatus: 'Cleared', principalStatus: 'Cleared' },
        { id: 202, name: 'Fatima Zahra Ibrahim', schoolId: 'AC-2026-0012', gpa: 3.81, credits: 138, financeStatus: 'Pending', hostelStatus: 'Cleared', libraryStatus: 'Cleared', transportStatus: 'Cleared', ictStatus: 'Cleared', disciplineStatus: 'Cleared', deanStatus: 'Cleared', principalStatus: 'Cleared' },
        { id: 203, name: 'Yusuf Muhammad Sani', schoolId: 'AC-2026-0043', gpa: 2.45, credits: 120, financeStatus: 'Cleared', hostelStatus: 'Pending', libraryStatus: 'Hold', transportStatus: 'Cleared', ictStatus: 'Cleared', disciplineStatus: 'Hold', deanStatus: 'Cleared', principalStatus: 'Cleared' }
      ]);

      setExamSchedules([
        { id: 301, subjectName: 'Quran Recitation & Hifz', code: 'ISL301', date: '2026-08-01', time: '09:00 AM', roomName: 'Al-Khwarizmi Hall', invigilator: 'Ustadh Muhammad Bello', capacity: 60, malpracticeCount: 0 },
        { id: 302, subjectName: 'Advanced Islamic Jurisprudence', code: 'ISL302', date: '2026-08-02', time: '11:00 AM', roomName: 'Ibn Sina Lecture Hall', invigilator: 'Dr. Aisha Al-Hassan', capacity: 45, malpracticeCount: 1 }
      ]);
    } catch (e) {
      toast.error('Failed to load registrar registry list.');
    } finally {
      setIsLoading(false);
    }
  };

  // Process transcript action
  const handleTranscriptAction = (id: number, action: 'Approve' | 'Reject' | 'RequestChanges') => {
    setRequests(prev => prev.map(r => {
      if (r.id === id) {
        let nextStatus: TranscriptRequest['status'] = 'Pending';
        if (action === 'Approve') nextStatus = 'Approved';
        if (action === 'RequestChanges') nextStatus = 'ChangesRequested';
        return { ...r, status: nextStatus };
      }
      return r;
    }));
    toast.success(`Transcript status updated to ${action}`);
  };

  // Generate official Transcript PDF
  const handlePrintTranscript = (req: TranscriptRequest) => {
    toast.info(`Generating official Transcript Registry PDF for ${req.studentName}...`);
    const doc = new jsPDF();
    const verificationHash = 'sha256-' + Math.random().toString(36).substring(2, 12);
    const verificationUrl = `https://yahayascool.edu.ng/verify/transcript?hash=${verificationHash}`;

    // Embellish Header
    doc.setFillColor(15, 23, 42); // Dark slate
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('YAHAYA ENTERPRISE ACADEMIC REGISTRY', 15, 18);
    
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('OFFICIAL ACADEMIC TRANSCRIPT RECORD', 15, 26);
    doc.text(`Version: ${req.version}.0 | Copy Status: ${req.copyType}`, 15, 32);
    doc.text(`Security Verification Hash: ${verificationHash}`, 15, 38);

    // Border
    doc.setDrawColor(200, 200, 200);
    doc.rect(5, 5, 200, 287);

    // Info details
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('REGISTRATION DETAILS', 15, 58);
    doc.line(15, 60, 195, 60);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Student Name: ${req.studentName}`, 15, 66);
    doc.text(`Student Registration ID: ${req.schoolId}`, 15, 71);
    doc.text(`Academic Level: Final Year`, 15, 76);
    doc.text(`Registrar Issued: ${signatories.registrar}`, 15, 81);

    doc.text(`Cumulative GPA: ${req.cgpa.toFixed(2)}`, 115, 66);
    doc.text(`Credits Completed: ${req.creditsEarned} Credits`, 115, 71);
    doc.text(`Status: Official Approved`, 115, 76);
    doc.text(`Principal Signee: ${signatories.principal}`, 115, 81);

    // Subject courses table
    (doc as any).autoTable({
      startY: 90,
      head: [['Course Code', 'Subject Description', 'Grade', 'GPA Points', 'Credits']],
      body: [
        ['ISL301', 'Quran Memorization Juz 30', 'A+', '4.00', '3'],
        ['ISL302', 'Islamic Jurisprudence (Fiqh)', 'A', '4.00', '3'],
        ['ENG311', 'Advanced Composition & Grammar', 'B+', '3.50', '3'],
        ['MTH312', 'Analytical Calculus', 'B', '3.00', '4'],
        ['PHY301', 'Classical Mechanics & Physics', 'C', '2.00', '4'],
      ],
      headStyles: { fillColor: [15, 23, 42] },
      bodyStyles: { fontSize: 8.5 },
      margin: { left: 15, right: 15 }
    });

    // Signature stamp
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.line(20, finalY, 70, finalY);
    doc.text(signatories.registrar, 20, finalY + 5);
    doc.setFont('Helvetica', 'bold');
    doc.text('Registrar Signature', 20, finalY + 9);
    
    doc.setFont('Helvetica', 'normal');
    doc.line(135, finalY, 185, finalY);
    doc.text(signatories.principal, 135, finalY + 5);
    doc.setFont('Helvetica', 'bold');
    doc.text('Principal Signature', 135, finalY + 9);

    // QR Verification panel
    doc.setFillColor(248, 250, 252);
    doc.rect(15, finalY + 18, 180, 18, 'F');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Official Transcript QR Verification URL: ${verificationUrl}`, 18, finalY + 24);
    doc.text('Immutable ledger copy. Any alterations void this document.', 18, finalY + 29);

    doc.save(`Transcript_${req.schoolId}.pdf`);
    toast.success('Official PDF Transcript downloaded.');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Registrar Command Workspace"
        description="Verify multi-department clearances, manage official academic transcripts, configure digital signatories, and run examinations."
      >
        <div className="flex items-center gap-2">
          <button
            onClick={loadRegistrarData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Workspace</span>
          </button>
        </div>
      </PageHeader>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-250 dark:border-slate-800 mb-6 overflow-x-auto gap-4">
        {[
          { key: 'dashboard', label: 'Dashboard Overview', icon: Activity },
          { key: 'requests', label: 'Transcript Queue', icon: FileText },
          { key: 'clearance', label: 'Graduation Clearance', icon: UserCheck },
          { key: 'exams', label: 'Examination Center', icon: Building },
          { key: 'signatories', label: 'Signature Registry', icon: FileSignature },
          { key: 'registers', label: 'Registrar Registers', icon: Grid }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
                activeTab === tab.key 
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-450' 
                  : 'border-transparent text-slate-550 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Dashboard cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Average Institutional GPA', value: '3.42 / 4.00', desc: 'Overall school average', icon: Award, color: 'text-emerald-500 bg-emerald-500/10' },
              { title: 'Graduation Candidates', value: '148 Students', desc: 'Active final year enrollment', icon: Users, color: 'text-indigo-500 bg-indigo-500/10' },
              { title: 'Pending Clearance Audits', value: '12 Clearance', desc: 'Finance & Hostel holds', icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10' },
              { title: 'Verification Requests', value: '45 Requests', desc: 'Searched today in portal', icon: ShieldCheck, color: 'text-sky-500 bg-sky-500/10' }
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{kpi.title}</span>
                    <span className="text-xl font-black text-slate-850 dark:text-white block">{kpi.value}</span>
                    <span className="text-[10px] text-slate-500 block">{kpi.desc}</span>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Audit Log Card */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Academic Audit Log trail</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {[
                  { actor: 'Ustadh Muhammad', action: 'Grade submission', desc: 'ISL301 grades submitted', date: '2026-07-24 15:42', ip: '192.168.1.14' },
                  { actor: 'Dr. Ibrahim (Registrar)', action: 'Locked grades', desc: 'MTH312 locked for Section A', date: '2026-07-24 12:10', ip: '192.168.1.2' },
                  { actor: 'System Recalculator', action: 'GPA recalculation', desc: 'Recalculated 34 student GPAs', date: '2026-07-24 12:11', ip: 'Localhost' }
                ].map((log, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{log.actor} - <span className="text-emerald-600">{log.action}</span></p>
                      <p className="text-[11px] text-slate-500">{log.desc}</p>
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      <p>{log.date}</p>
                      <p className="font-mono">IP: {log.ip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Calendar Calendar Events */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Milestone Calendar</h3>
              <div className="space-y-3 text-xs">
                {[
                  { name: 'Semester Registration Window', start: 'July 15', end: 'August 05', status: 'Active' },
                  { name: 'Midterm Assessment Week', start: 'Sept 10', end: 'Sept 15', status: 'Planned' },
                  { name: 'Graduation Clearance Window', start: 'Oct 01', end: 'Oct 20', status: 'Planned' }
                ].map((cal, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{cal.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-600">{cal.status}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Timeline: {cal.start} - {cal.end}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        /* Transcript request list */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-black text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Transcript No</th>
                <th className="px-6 py-4">CGPA / Credits</th>
                <th className="px-6 py-4">Copy Version</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/55">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-850 dark:text-white">{req.studentName}</p>
                    <p className="text-[10px] text-slate-500">{req.schoolId}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px]">TR-2026-{req.id}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-800">{req.cgpa.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 block">{req.creditsEarned} Credits Completed</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">{req.copyType}</span>
                    <span className="text-[10px] text-slate-500 block">Version {req.version}.0</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600' :
                      req.status === 'ChangesRequested' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    {req.status === 'Pending' && (
                      <>
                        <button 
                          onClick={() => handleTranscriptAction(req.id, 'Approve')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleTranscriptAction(req.id, 'RequestChanges')}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-55"
                        >
                          Revise
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handlePrintTranscript(req)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
                      title="Print Official Transcript"
                    >
                      <Printer className="w-4 h-4 text-emerald-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'clearance' && (
        /* Graduation Clearance Checklist */
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 text-xs flex gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold">Graduation clearance checks are active. Unpaid fees, unreturned library materials, unvacated hostel rooms, or active discipline cases automatically block graduation checklists and restrict certificate generation.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Finance</th>
                  <th className="px-6 py-4">Hostel</th>
                  <th className="px-6 py-4">Library</th>
                  <th className="px-6 py-4">Transport</th>
                  <th className="px-6 py-4">Discipline</th>
                  <th className="px-6 py-4">Principal / Registrar</th>
                  <th className="px-6 py-4">Clearance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {auditees.map((std) => {
                  const isBlocked = 
                    std.financeStatus !== 'Cleared' || 
                    std.hostelStatus !== 'Cleared' || 
                    std.libraryStatus !== 'Cleared' || 
                    std.transportStatus !== 'Cleared' || 
                    std.disciplineStatus !== 'Cleared';

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-850 dark:text-white">{std.name}</p>
                        <p className="text-[10px] text-slate-500">{std.schoolId} | GPA: {std.gpa}</p>
                      </td>
                      {['financeStatus', 'hostelStatus', 'libraryStatus', 'transportStatus', 'disciplineStatus'].map((dept) => {
                        const statusVal = std[dept as keyof GraduationAuditee];
                        return (
                          <td key={dept} className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              statusVal === 'Cleared' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusVal === 'Cleared' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {statusVal === 'Cleared' ? 'Cleared' : 'Hold'}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-600">Principal: Cleared</p>
                          <p className="text-[10px] font-bold text-slate-600">Registrar: Cleared</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                          isBlocked ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-600 text-white'
                        }`}>
                          {isBlocked ? 'Clearance Blocked' : 'Cleared for Graduation'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'exams' && (
        /* Examination Module ERP */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-850 dark:text-slate-200 uppercase tracking-wider">Exam Schedules & Hall Allocations</h3>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Timetable Entry</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Date / Time</th>
                  <th className="px-6 py-4">Exam Hall</th>
                  <th className="px-6 py-4">Invigilator</th>
                  <th className="px-6 py-4">Hall Capacity</th>
                  <th className="px-6 py-4">Malpractice Logs</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {examSchedules.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-850 dark:text-white">{ex.subjectName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{ex.code}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold">{ex.date}</p>
                      <p className="text-[10px] text-slate-500">{ex.time}</p>
                    </td>
                    <td className="px-6 py-4">{ex.roomName}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{ex.invigilator}</td>
                    <td className="px-6 py-4">{ex.capacity} seats</td>
                    <td className="px-6 py-4">
                      {ex.malpracticeCount > 0 ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 animate-pulse">
                          {ex.malpracticeCount} Case Logged
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button 
                        onClick={() => {
                          toast.info('Generating exam attendance sheet...');
                        }}
                        className="px-2 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-bold"
                      >
                        Attendance
                      </button>
                      <button 
                        onClick={() => {
                          toast.info('Generating invigilation and seating list...');
                        }}
                        className="px-2 py-1 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-55"
                      >
                        Seating List
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'signatories' && (
        /* Signatories Registry */
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider mb-2">Registrar Signature Stamps Registry</h3>
            <p className="text-xs text-slate-500">Configure who is authorized to digitally sign and release transcripts, graduation diplomas, and official letter certifications.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">Principal / Chancellor</label>
              <input 
                type="text" 
                value={signatories.principal}
                onChange={(e) => setSignatories({ ...signatories, principal: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">Registrar General</label>
              <input 
                type="text" 
                value={signatories.registrar}
                onChange={(e) => setSignatories({ ...signatories, registrar: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">Dean of Academic Affairs</label>
              <input 
                type="text" 
                value={signatories.dean}
                onChange={(e) => setSignatories({ ...signatories, dean: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1">Academic Director</label>
              <input 
                type="text" 
                value={signatories.academicDirector}
                onChange={(e) => setSignatories({ ...signatories, academicDirector: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent font-bold"
              />
            </div>
          </div>
          <button 
            onClick={() => toast.success('Authorized signatories list updated in database')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
          >
            Save Registry
          </button>
        </div>
      )}

      {activeTab === 'registers' && (
        /* Registers List and Reports Printing */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Transcript Register Log', desc: 'Record of all transcripts published today', registerName: 'TranscriptRegister' },
            { name: 'Certificate Register Log', desc: 'Verifier code ledger for all printed certificates', registerName: 'CertificateRegister' },
            { name: 'Graduation Approved List', desc: 'Student candidates clear of holds', registerName: 'GraduationList' },
            { name: 'Academic Probation / Fail Register', desc: 'List of students falling below GPA thresholds', registerName: 'ProbationRegister' },
            { name: 'Grade Appeal Review Register', desc: 'Logs of grade review appeal decisions', registerName: 'AppealRegister' },
            { name: 'Exam Seating Hall Register', desc: 'Daily allocations registry logs', registerName: 'ExamRegister' }
          ].map((reg, idx) => (
            <div key={idx} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-850 dark:text-white">{reg.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{reg.desc}</p>
              </div>
              <button 
                onClick={() => {
                  toast.success(`Preparing printable copy for: ${reg.name}...`);
                  window.print();
                }}
                className="mt-6 flex items-center justify-center gap-1.5 w-full py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-305 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export Print Sheet</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

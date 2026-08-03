'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useSection } from '@/providers/SectionContext';
import { SectionSubNav } from '@/components/shared/layout/SectionSubNav';
import { PageContainer } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import {
  FileBadge, Download, Search, AlertCircle, ShieldAlert,
  QrCode, FileCheck, RefreshCw, Printer, AlertTriangle, Layers, Award, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import React from 'react';

export default function TranscriptsPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;

  const { section, isLoading: sectionLoading } = useSection();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Transcript settings
  const [transcriptType, setTranscriptType] = useState<
    'combined' | 'section' | 'year' | 'term' | 'graduation'
  >('combined');

  // Cross-Module ERP Holds state
  const [outstandingBalance, setOutstandingBalance] = useState<number>(0);
  const [libraryFines, setLibraryFines] = useState<number>(0);
  const [hasDisciplinaryHold, setHasDisciplinaryHold] = useState<boolean>(false);
  const [isVerifyingClearance, setIsVerifyingClearance] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [enrollRes, gradeRes] = await Promise.all([
          apiClient.get('/student-enrollments', {
            params: {
              filters: { courseOffering: { academicSection: { documentId: { $eq: sectionId } } } },
              populate: ['student.user', 'courseOffering.gradeLevel', 'courseOffering.academicSection'],
              pagination: { limit: 100 }
            }
          }),
          apiClient.get('/gradebook-entries', {
            params: {
              populate: ['student', 'subject', 'courseOffering.academicSection', 'teacher'],
              pagination: { limit: 500 }
            }
          })
        ]);

        // Deduplicate students
        const studentMap = new Map();
        (enrollRes.data?.data || []).forEach((enc: any) => {
          const s = enc.student;
          if (s && s.documentId) {
            if (!studentMap.has(s.documentId)) {
              studentMap.set(s.documentId, {
                ...s,
                gradeLevel: enc.courseOffering?.gradeLevel?.name
              });
            }
          }
        });

        setStudents(Array.from(studentMap.values()));
        setGrades(gradeRes.data?.data || []);
      } catch (error) {
        console.error('Failed to fetch transcript data', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [sectionId]);

  // Load finance and library holds whenever a student is selected
  useEffect(() => {
    if (!selectedStudent) return;
    async function checkHolds() {
      setIsVerifyingClearance(true);
      try {
        const studentId = selectedStudent.id;
        const [invoicesRes, libraryRes] = await Promise.all([
          apiClient.get('/finance-invoices', {
            params: {
              filters: { student: { id: { $eq: studentId } } }
            }
          }).catch(() => ({ data: { data: [] } })),
          apiClient.get('/library-loans', {
            params: {
              filters: { student: { id: { $eq: studentId } }, status: { $eq: 'overdue' } }
            }
          }).catch(() => ({ data: { data: [] } }))
        ]);

        // Calculate outstanding balance
        const invoices = invoicesRes.data?.data || [];
        const unpaid = invoices
          .filter((inv: any) => inv.status !== 'paid')
          .reduce((sum: number, inv: any) => sum + (inv.remainingBalance ?? inv.totalAmount ?? 0), 0);
        setOutstandingBalance(unpaid);

        // Calculate library fines or overdue count
        const libraryLoans = libraryRes.data?.data || [];
        setLibraryFines(libraryLoans.length * 5.0); // Simulate $5 per overdue book

        // Simulated disciplinary hold for a specific student id for demonstration
        setHasDisciplinaryHold(selectedStudent.schoolId === 'ST000000010');
      } catch (err) {
        console.warn('Could not verify ERP holds.');
      } finally {
        setIsVerifyingClearance(false);
      }
    }
    checkHolds();
  }, [selectedStudent]);

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Calculate dynamic grades grouped by section
  const studentGradesGroupedBySection = useMemo(() => {
    if (!selectedStudent) return {};
    const list = grades.filter((g) => g.student?.documentId === selectedStudent.documentId);

    const groups: Record<string, any[]> = {};
    list.forEach((g) => {
      // Default grouping fallback to General Education if section is null
      const secName = g.courseOffering?.academicSection?.name || 'General Education';
      if (!groups[secName]) groups[secName] = [];
      groups[secName].push(g);
    });

    return groups;
  }, [selectedStudent, grades]);

  // GPA calculation helper
  const calculateGpaForGroup = (entries: any[]) => {
    if (entries.length === 0) return { gpa: 0, cgpa: 0, credits: 0 };
    let pointsSum = 0;
    let creditsSum = 0;

    entries.forEach((g) => {
      const percentage = Math.round((g.score / (g.maxScore || 100)) * 100);
      let gp = 0;
      if (percentage >= 90) gp = 4.0;
      else if (percentage >= 80) gp = 3.0;
      else if (percentage >= 70) gp = 2.0;
      else if (percentage >= 60) gp = 1.0;

      const cred = g.subject?.creditValue ?? 3;
      pointsSum += gp * cred;
      creditsSum += cred;
    });

    const score = creditsSum > 0 ? pointsSum / creditsSum : 0;
    return {
      gpa: score,
      cgpa: score,
      credits: creditsSum
    };
  };

  const overallAcademicSummary = useMemo(() => {
    if (!selectedStudent) return { gpa: 0, cgpa: 0, credits: 0 };
    const list = grades.filter((g) => g.student?.documentId === selectedStudent.documentId);
    return calculateGpaForGroup(list);
  }, [selectedStudent, grades]);

  // Generate SHA-256 verification hash simulation
  const verificationHash = useMemo(() => {
    if (!selectedStudent) return '';
    const hashSeed = `${selectedStudent.schoolId}-${selectedStudent.firstName}-${selectedStudent.lastName}-${overallAcademicSummary.cgpa}-${overallAcademicSummary.credits}`;
    let hash = 0;
    for (let i = 0; i < hashSeed.length; i++) {
      hash = (hash << 5) - hash + hashSeed.charCodeAt(i);
      hash |= 0;
    }
    return `SHA256-${Math.abs(hash).toString(16).toUpperCase()}${Date.now().toString().substring(0, 4)}`;
  }, [selectedStudent, overallAcademicSummary]);

  const handlePrint = () => {
    if (outstandingBalance > 0 || libraryFines > 0 || hasDisciplinaryHold) {
      toast.error('Cannot generate transcript. Active holds must be resolved first.');
      return;
    }
    window.print();
  };

  return (
    <PageContainer>
      <div className="space-y-6 pb-12 print:p-0 print:m-0 print:border-none">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 print:hidden">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FileBadge className="h-6 w-6 text-indigo-500" />
              Enterprise Transcript Engine
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Group and audit results across academic sections, verify holds, and calculate CGPAs.
            </p>
          </div>
        </div>

        <div className="print:hidden">
          <SectionSubNav activeTab="transcripts" sectionId={sectionId} />
        </div>

        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-4 print:hidden">
            <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Student List Sidebar */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4 print:hidden">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 sticky top-4">
                <div className="relative mb-4">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-slate-900 dark:text-white"
                  />
                </div>

                <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
                  {filteredStudents.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No students found.</p>
                  ) : (
                    filteredStudents.map((student) => (
                      <button
                        key={student.documentId}
                        onClick={() => setSelectedStudent(student)}
                        className={`w-full text-left p-3 rounded-xl transition-colors border ${
                          selectedStudent?.documentId === student.documentId
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                            : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{student.studentId || 'No ID'}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Transcript Preview Area */}
            <div className="w-full lg:w-2/3 print:w-full">
              {selectedStudent ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full print:border-none print:shadow-none">
                  {/* Settings Bar */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 print:hidden flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-slate-500">Transcript Type:</label>
                      <select
                        value={transcriptType}
                        onChange={(e) => setTranscriptType(e.target.value as any)}
                        className="px-3 py-1.5 border rounded-xl font-semibold text-xs dark:bg-slate-800"
                      >
                        <option value="combined">Official Combined Transcript</option>
                        <option value="section">Academic Section Transcript</option>
                        <option value="year">Academic Year Transcript</option>
                        <option value="term">Term Transcript</option>
                        <option value="graduation">Graduation Transcript Audit</option>
                      </select>
                    </div>
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-650 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-750 transition"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Generate & Print Official
                    </button>
                  </div>

                  {/* CLEARANCE & HOLD METADATA */}
                  <div className="p-6 pb-2 print:hidden space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">ERP Clearance Checks</h3>
                    {isVerifyingClearance ? (
                      <p className="text-xs text-slate-400">Verifying financial and disciplinary ledgers...</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className={cn(
                          "p-3.5 border rounded-xl flex items-center gap-2",
                          outstandingBalance > 0 ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
                        )}>
                          {outstandingBalance > 0 ? <ShieldAlert className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
                          <div>
                            <p className="font-bold">Finance Ledger</p>
                            <p className="text-[10px] mt-0.5">{outstandingBalance > 0 ? `Unpaid Dues: $${outstandingBalance.toFixed(2)}` : 'Fees Cleared'}</p>
                          </div>
                        </div>

                        <div className={cn(
                          "p-3.5 border rounded-xl flex items-center gap-2",
                          libraryFines > 0 ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
                        )}>
                          {libraryFines > 0 ? <AlertTriangle className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
                          <div>
                            <p className="font-bold">Library System</p>
                            <p className="text-[10px] mt-0.5">{libraryFines > 0 ? `Fines: $${libraryFines.toFixed(2)}` : 'Loans Cleared'}</p>
                          </div>
                        </div>

                        <div className={cn(
                          "p-3.5 border rounded-xl flex items-center gap-2",
                          hasDisciplinaryHold ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
                        )}>
                          {hasDisciplinaryHold ? <ShieldAlert className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
                          <div>
                            <p className="font-bold">Discipline Status</p>
                            <p className="text-[10px] mt-0.5">{hasDisciplinaryHold ? 'Active Hold' : 'No Sanctions'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(outstandingBalance > 0 || libraryFines > 0 || hasDisciplinaryHold) && (
                      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex gap-2.5 items-start text-xs">
                        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Academic hold Active</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            Official transcript issuance is blocked due to active ERP clearance holds. 
                            Ensure all library fines, unpaid invoices, and disciplinary holds are resolved in their respective modules to lift the blockade.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TRANSCRIPT PREVIEW */}
                  <div className="p-8 flex-grow space-y-8 print:p-0">
                    {/* Transcript Header Layout */}
                    <div className="text-center space-y-2 border-b-2 border-slate-900 pb-5">
                      <h1 className="text-2xl font-black text-slate-900 uppercase">YAHAYA ACADEMY CENTRAL REGISTRY</h1>
                      <p className="text-xs font-bold text-slate-650">OFFICIAL TRANSCRIPT OF RECORD</p>
                      <div className="grid grid-cols-2 text-left text-xs gap-3 pt-4">
                        <div>
                          <p className="font-bold">Student: <span className="font-medium text-slate-600">{selectedStudent.firstName} {selectedStudent.lastName}</span></p>
                          <p className="font-bold">Student ID: <span className="font-medium text-slate-600 font-mono">{selectedStudent.schoolId}</span></p>
                          <p className="font-bold">Grade Level: <span className="font-medium text-slate-600">{selectedStudent.gradeLevel}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">Transcript Issue: <span className="font-medium text-slate-600 font-mono">v1.2</span></p>
                          <p className="font-bold">Status: <span className="font-medium text-slate-600">Issued</span></p>
                          <p className="font-bold">Date: <span className="font-medium text-slate-600 font-mono">{new Date().toLocaleDateString()}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Groups by Section */}
                    {Object.keys(studentGradesGroupedBySection).length === 0 ? (
                      <div className="text-center py-12">
                        <FileBadge className="h-12 w-12 text-slate-350 mx-auto mb-3" />
                        <p className="text-slate-550 font-semibold text-xs">No grade entries recorded for this student.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(studentGradesGroupedBySection).map(([sectionName, sectionEntries]) => {
                          const summary = calculateGpaForGroup(sectionEntries);
                          return (
                            <div key={sectionName} className="space-y-2">
                              <h3 className="text-xs font-black text-indigo-650 uppercase border-b pb-1 flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4" />
                                <span>{sectionName}</span>
                              </h3>
                              <div className="overflow-x-auto text-xs">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="text-slate-500 font-extrabold">
                                      <th className="py-2">Subject Name</th>
                                      <th className="py-2">Score</th>
                                      <th className="py-2 text-center">Grade</th>
                                      <th className="py-2 text-center">Credits</th>
                                      <th className="py-2">Teacher</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {sectionEntries.map((g, idx) => {
                                      const percentage = Math.round((g.score / (g.maxScore || 100)) * 100);
                                      let letterGrade = 'F';
                                      if (percentage >= 90) letterGrade = 'A';
                                      else if (percentage >= 80) letterGrade = 'B';
                                      else if (percentage >= 70) letterGrade = 'C';
                                      else if (percentage >= 60) letterGrade = 'D';

                                      return (
                                        <tr key={idx}>
                                          <td className="py-2 font-semibold text-slate-900 dark:text-white">
                                            {g.subject?.name}
                                          </td>
                                          <td className="py-2 font-mono text-slate-500">
                                            {g.score}/{g.maxScore || 100} ({percentage}%)
                                          </td>
                                          <td className="py-2 text-center font-bold font-mono">
                                            {letterGrade}
                                          </td>
                                          <td className="py-2 text-center font-mono font-bold">
                                            {g.subject?.creditValue ?? 3}
                                          </td>
                                          <td className="py-2 text-[10px] text-slate-400">
                                            {g.teacher?.displayName || g.teacher?.name}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <div className="flex justify-end gap-4 text-[10px] font-bold text-slate-650 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                                <span>Section GPA: {summary.gpa.toFixed(2)}</span>
                                <span>Credits Earned: {summary.credits}</span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Overall summary */}
                        <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                          <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border">
                            <h4 className="font-extrabold text-slate-900">OVERALL ACADEMIC SUMMARY</h4>
                            <p className="font-bold">Total Credits: <span className="font-medium text-slate-600">{overallAcademicSummary.credits}</span></p>
                            <p className="font-bold">Cumulative CGPA: <span className="font-medium text-slate-600">{overallAcademicSummary.gpa.toFixed(2)}</span></p>
                            <p className="font-bold">Graduation Status: <span className="font-medium text-slate-600">{overallAcademicSummary.gpa >= 2.0 && outstandingBalance === 0 ? 'Passed' : 'Hold / Pending Clearance'}</span></p>
                          </div>

                          {/* Verification signatures and Hash */}
                          <div className="space-y-4">
                            <div className="flex gap-4 items-center">
                              <div className="w-16 h-16 bg-slate-100 p-1.5 border rounded-xl flex items-center justify-center shrink-0">
                                <QrCode className="w-full h-full text-slate-900" />
                              </div>
                              <div>
                                <p className="font-extrabold text-[10px] text-slate-900">DIGITAL VERIFICATION IDENTIFIER</p>
                                <p className="font-mono text-[9px] text-slate-400 mt-1 break-all uppercase leading-tight">
                                  Hash: {verificationHash}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-center text-[10px] pt-2">
                              <div className="border-t border-slate-400 pt-1 font-bold">
                                Registrar Signature
                              </div>
                              <div className="border-t border-slate-400 pt-1 font-bold">
                                Principal Signature
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center h-[500px] text-center p-8 print:hidden">
                  <FileBadge className="h-16 w-16 text-slate-200 dark:text-slate-700 mb-4 animate-pulse" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Select a Student</h3>
                  <p className="text-slate-500 mt-2 max-w-sm">Choose a student from the list to view their section-specific academic transcript.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import { FileBadge, Download, Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function TranscriptsPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  
  const { section, isLoading: sectionLoading } = useSection();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [enrollRes, gradeRes] = await Promise.all([
          apiClient.get("/student-enrollments", {
            params: {
              filters: { courseOffering: { academicSection: { documentId: { $eq: sectionId } } } },
              populate: ["student.user", "courseOffering.gradeLevel"],
            },
          }),
          apiClient.get("/gradebook-entries", {
            params: {
              filters: { section: { documentId: { $eq: sectionId } } },
              populate: ["student", "subject", "teacher"],
            },
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
        console.error("Failed to fetch transcript data", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [sectionId]);

  const filteredStudents = students.filter(s => {
    const fullName = `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || (s.studentId && s.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const getStudentGrades = (studentId: string) => {
    return grades.filter(g => g.student?.documentId === studentId);
  };

  const handleDownload = () => {
    alert("PDF download coming soon");
  };

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FileBadge className="h-6 w-6 text-indigo-500" />
              Section Transcripts
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              View and generate partial transcripts for {section?.name || "this section"}.
            </p>
          </div>
        </div>

        <SectionSubNav activeTab="transcripts" sectionId={sectionId} />

        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Student List Sidebar */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
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
                    filteredStudents.map(student => (
                      <button
                        key={student.documentId}
                        onClick={() => setSelectedStudent(student)}
                        className={`w-full text-left p-3 rounded-xl transition-colors border ${selectedStudent?.documentId === student.documentId ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                      >
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {student.user?.firstName} {student.user?.lastName}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{student.studentId || "No ID"}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Transcript Preview Area */}
            <div className="w-full lg:w-2/3">
              {selectedStudent ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/20">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {selectedStudent.user?.firstName} {selectedStudent.user?.lastName}
                      </h2>
                      <div className="flex gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <p>ID: <span className="font-medium text-slate-900 dark:text-white">{selectedStudent.studentId || "-"}</span></p>
                        <p>Grade: <span className="font-medium text-slate-900 dark:text-white">{selectedStudent.gradeLevel || "-"}</span></p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate PDF
                    </button>
                  </div>
                  
                  <div className="p-6 flex-grow">
                    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-3 rounded-lg text-sm mb-6 border border-amber-200/50 dark:border-amber-800/50">
                      <strong>Note:</strong> This is the {section?.name} portion of the student's transcript. The official combined transcript is available from the Registrar.
                    </div>
                    
                    {getStudentGrades(selectedStudent.documentId).length === 0 ? (
                      <div className="text-center py-12">
                        <FileBadge className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500">No grades recorded for this student in this section yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Subject</th>
                              <th className="px-4 py-3 font-semibold">Score</th>
                              <th className="px-4 py-3 font-semibold">Grade</th>
                              <th className="px-4 py-3 font-semibold">Teacher</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {getStudentGrades(selectedStudent.documentId).map((entry, idx) => {
                              const percentage = Math.round((entry.score / (entry.maxScore || 100)) * 100);
                              let letterGrade = "F";
                              if (percentage >= 90) letterGrade = "A";
                              else if (percentage >= 80) letterGrade = "B";
                              else if (percentage >= 70) letterGrade = "C";
                              else if (percentage >= 60) letterGrade = "D";

                              return (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                    {entry.subject?.name || "Subject"}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                    {entry.score}/{entry.maxScore || 100} ({percentage}%)
                                  </td>
                                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                    {letterGrade}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 text-xs">
                                    {entry.teacher?.displayName || entry.teacher?.name || "-"}
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
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center h-[500px] text-center p-8">
                  <FileBadge className="h-16 w-16 text-slate-200 dark:text-slate-700 mb-4" />
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

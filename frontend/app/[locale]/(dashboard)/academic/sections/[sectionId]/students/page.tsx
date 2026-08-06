"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import { Users, Search, ChevronRight, User } from "lucide-react";
import Link from "next/link";

interface StudentEnrollment {
  documentId: string;
  student?: { documentId: string; schoolId?: string; studentId?: string; user?: { firstName: string; lastName: string; email: string } };
  courseOffering?: { subject?: { name: string }; gradeLevel?: { name: string } };
  enrollmentStatus?: string;
}

export default function StudentsPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  
  const { section, isLoading: sectionLoading } = useSection();
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("");

  useEffect(() => {
    async function fetchStudents() {
      try {
        setIsLoading(true);
        const res = await apiClient.get("/student-enrollments", {
          params: {
            filters: { courseOffering: { academicSection: { documentId: { $eq: sectionId } } } },
            populate: ["student.user", "courseOffering.subject", "courseOffering.gradeLevel"],
            pagination: { limit: 500 },
          },
        });
        
        // Deduplicate students
        const enrollments: StudentEnrollment[] = res.data?.data || [];
        const studentMap = new Map();
        
        enrollments.forEach(enc => {
          const s = enc.student;
          if (s && s.documentId) {
            if (!studentMap.has(s.documentId)) {
              studentMap.set(s.documentId, {
                ...s,
                enrollments: [enc]
              });
            } else {
              studentMap.get(s.documentId).enrollments.push(enc);
            }
          }
        });
        
        setStudentsData(Array.from(studentMap.values()));
      } catch (error) {
        console.error("Failed to fetch students", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudents();
  }, [sectionId]);

  // Derive unique grades
  const uniqueGrades = Array.from(new Set(
    studentsData.flatMap(s => s.enrollments.map((e: any) => e.courseOffering?.gradeLevel?.name).filter(Boolean))
  )) as string[];

  const filteredStudents = studentsData.filter(s => {
    const fullName = `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || (s.studentId && s.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesGrade = true;
    if (filterGrade) {
      matchesGrade = s.enrollments.some((e: any) => e.courseOffering?.gradeLevel?.name === filterGrade);
    }
    
    return matchesSearch && matchesGrade;
  });

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-500" />
              Students in Section
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              View and manage students enrolled in {section?.name || "this section"}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2.5 text-sm font-medium text-indigo-700 dark:text-indigo-400">
              {studentsData.length} Total Students
            </span>
          </div>
        </div>

        <SectionSubNav activeTab="students" sectionId={sectionId} />

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-4 relative flex-grow">
            <Search className="h-5 w-5 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-slate-900 dark:text-white"
            />
          </div>
          <select 
            value={filterGrade} 
            onChange={e => setFilterGrade(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-white min-w-[200px]"
          >
            <option value="">All Grade Levels</option>
            {uniqueGrades.map((g: string) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <User className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Students Found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Student Name</th>
                    <th className="px-6 py-4 font-medium">School ID</th>
                    <th className="px-6 py-4 font-medium">Grade Level(s)</th>
                    <th className="px-6 py-4 font-medium">Enrolled Subjects</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((student) => {
                    const firstName = student.user?.firstName || '';
                    const lastName = student.user?.lastName || '';
                    const fullName = `${firstName} ${lastName}`.trim();
                    const initials = firstName.charAt(0).toUpperCase() || lastName.charAt(0).toUpperCase() || '?';
                    const grades = Array.from(new Set(student.enrollments.map((e: any) => e.courseOffering?.gradeLevel?.name).filter(Boolean)));
                    const subjects = Array.from(new Set(student.enrollments.map((e: any) => e.courseOffering?.subject?.name).filter(Boolean)));
                    const studentSchoolId = student.schoolId || student.studentId || '-';
                    
                    return (
                      <tr key={student.documentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{fullName}</p>
                              <p className="text-xs text-slate-500">{student.user?.email || "No email"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                          {studentSchoolId}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {grades.map((g: any, i) => (
                              <span key={i} className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                                {g}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {subjects.slice(0, 3).map((s: any, i) => (
                              <span key={i} className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
                                {s}
                              </span>
                            ))}
                            {subjects.length > 3 && (
                              <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                                +{subjects.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/students/${student.documentId}`}
                            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm transition-colors"
                          >
                            View Profile
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

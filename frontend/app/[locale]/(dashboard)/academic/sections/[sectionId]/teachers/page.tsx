"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import { UserCheck, ChevronDown, ChevronRight, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import React from "react";

interface Teacher {
  documentId: string;
  name: string;
  displayName?: string;
  user?: { email: string };
  offerings?: any[];
}

export default function TeachersPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  
  const { section, isLoading: sectionLoading } = useSection();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeachers() {
      try {
        setIsLoading(true);
        // Fetch teachers associated with this section
        const [teachersRes, offeringsRes] = await Promise.all([
          apiClient.get("/teachers", {
            params: {
              filters: { sections: { documentId: { $eq: sectionId } } },
              populate: ["user"],
              pagination: { limit: 100 },
            },
          }),
          apiClient.get("/course-offerings", {
            params: {
              filters: { academicSection: { documentId: { $eq: sectionId } } },
              populate: ["teacher", "subject", "gradeLevel", "studentEnrollments"],
              pagination: { limit: 100 },
            },
          })
        ]);
        
        let teacherList = teachersRes.data?.data || [];
        const offerings = offeringsRes.data?.data || [];
        
        // Also get any teacher from offerings that might not be in the direct 'sections' relation
        const offeringTeachersMap = new Map();
        offerings.forEach((o: any) => {
          if (o.teacher) {
            if (!offeringTeachersMap.has(o.teacher.documentId)) {
              offeringTeachersMap.set(o.teacher.documentId, { ...o.teacher, offerings: [o] });
            } else {
              offeringTeachersMap.get(o.teacher.documentId).offerings.push(o);
            }
          }
        });

        // Merge maps
        const finalTeachers = teacherList.map((t: any) => {
          const mapT = offeringTeachersMap.get(t.documentId);
          return {
            ...t,
            offerings: mapT ? mapT.offerings : []
          };
        });

        // Add teachers from offerings that weren't in the direct list
        offeringTeachersMap.forEach((val, key) => {
          if (!finalTeachers.find((ft: any) => ft.documentId === key)) {
            finalTeachers.push(val);
          }
        });

        setTeachers(finalTeachers);
      } catch (error) {
        console.error("Failed to fetch teachers", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeachers();
  }, [sectionId]);

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-indigo-500" />
              Teachers
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Instructors assigned to {section?.name || "this section"}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2.5 text-sm font-medium text-indigo-700 dark:text-indigo-400">
              {teachers.length} Teacher{teachers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <SectionSubNav activeTab="teachers" sectionId={sectionId} />

        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <UserCheck className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Teachers Assigned</h3>
            <p className="text-slate-500 mt-2">Assign teachers to course offerings in this section.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Subjects Taught</th>
                    <th className="px-6 py-4 font-medium">Total Classes</th>
                    <th className="px-6 py-4 font-medium">Total Students</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {teachers.map((teacher) => {
                    const isExpanded = expandedTeacher === teacher.documentId;
                    const offerings = teacher.offerings || [];
                    const uniqueSubjects = Array.from(new Set(offerings.map(o => o.subject?.name).filter(Boolean)));
                    const totalStudents = offerings.reduce((acc, curr) => acc + (curr.studentEnrollments?.length || 0), 0);
                    
                    return (
                      <React.Fragment key={teacher.documentId}>
                        <tr 
                          onClick={() => setExpandedTeacher(isExpanded ? null : teacher.documentId)}
                          className={`cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${isExpanded ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                              <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold">
                                {(teacher.displayName || teacher.name || "T").charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{teacher.displayName || teacher.name}</p>
                                <p className="text-xs text-slate-500">{teacher.user?.email || "No email"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {uniqueSubjects.slice(0, 2).map((s: any, i) => (
                                <span key={i} className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
                                  {s}
                               </span>
                              ))}
                              {uniqueSubjects.length > 2 && (
                                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                                  +{uniqueSubjects.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                              <BookOpen className="h-4 w-4 mr-1.5 text-slate-400" />
                              {offerings.length}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                              <Users className="h-4 w-4 mr-1.5 text-slate-400" />
                              {totalStudents}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/teachers/${teacher.documentId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm transition-colors"
                            >
                              Profile
                            </Link>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                            <td colSpan={5} className="px-14 py-6 border-l-2 border-indigo-500">
                              <h4 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-indigo-500" />
                                Assigned Classes in Section
                              </h4>
                              {offerings.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {offerings.map((offering: any) => (
                                    <div key={offering.id || offering.documentId} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
                                      <div>
                                        <p className="font-medium text-slate-900 dark:text-white">{offering.subject?.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{offering.gradeLevel?.name}</p>
                                      </div>
                                      <div className="text-right">
                                        <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                                          {offering.studentEnrollments?.length || 0} students
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">No active classes.</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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

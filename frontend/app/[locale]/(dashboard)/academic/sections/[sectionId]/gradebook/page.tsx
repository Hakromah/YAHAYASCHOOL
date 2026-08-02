"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import { Award, BookOpen, ExternalLink, Percent, LineChart } from "lucide-react";
import Link from "next/link";

interface GradebookEntry {
  documentId: string;
  score: number;
  maxScore: number;
  assessmentTitle: string;
  type: string;
  status: string;
  student?: { user?: { firstName: string; lastName: string } };
  subject?: { name: string };
  teacher?: { name: string; displayName?: string };
}

export default function GradebookPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  
  const { section, isLoading: sectionLoading } = useSection();
  const [entries, setEntries] = useState<GradebookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchGrades() {
      try {
        setIsLoading(true);
        const res = await apiClient.get("/gradebook-entries", {
          params: {
            filters: { section: { documentId: { $eq: sectionId } } },
            populate: ["student.user", "teacher", "subject", "courseOffering"],
            sort: ["createdAt:desc"],
          },
        });
        setEntries(res.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch gradebook entries", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGrades();
  }, [sectionId]);

  const totalEntries = entries.length;
  const publishedEntries = entries.filter(e => e.status === "published").length;
  const draftEntries = totalEntries - publishedEntries;
  
  let avgScore = 0;
  if (totalEntries > 0) {
    const sum = entries.reduce((acc, curr) => acc + ((curr.score / (curr.maxScore || 100)) * 100), 0);
    avgScore = Math.round(sum / totalEntries);
  }

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-6 w-6 text-indigo-500" />
              Gradebook
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              View student grades and assessments for {section?.name || "this section"}.
            </p>
          </div>
          <Link
            href="/lms/gradebook"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Full Gradebook Console
          </Link>
        </div>

        <SectionSubNav activeTab="gradebook" sectionId={sectionId} />

        {!isLoading && entries.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Entries</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalEntries}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Published</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{publishedEntries}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <LineChart className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Draft</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{draftEntries}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Avg. Score</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{avgScore}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Percent className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}

        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <Award className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Grades Recorded</h3>
            <p className="text-slate-500 mt-2 mb-6 max-w-md">There are no gradebook entries for this section yet.</p>
            <Link
              href="/lms/gradebook"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2 font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              Go to Gradebook Console
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Student</th>
                    <th className="px-6 py-4 font-medium">Assessment</th>
                    <th className="px-6 py-4 font-medium">Subject</th>
                    <th className="px-6 py-4 font-medium">Score</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {entries.map((entry) => {
                    const percentage = Math.round((entry.score / (entry.maxScore || 100)) * 100);
                    return (
                      <tr key={entry.documentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          {entry.student?.user?.firstName} {entry.student?.user?.lastName}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900 dark:text-white">{entry.assessmentTitle || "Assessment"}</p>
                          <p className="text-xs text-slate-500">{entry.type || "General"}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {entry.subject?.name || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">{entry.score}/{entry.maxScore || 100}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${percentage >= 80 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : percentage >= 50 ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                              {percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${entry.status === 'published' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {entry.status}
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
      </div>
    </PageContainer>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import { FileText, Hash, ExternalLink, Activity, BookOpen } from "lucide-react";
import Link from "next/link";

export default function AssessmentsPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;

  const { section, isLoading: sectionLoading } = useSection();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAssessments() {
      try {
        setIsLoading(true);

        // Step 1: Get all course offerings for this section to collect subject documentIds
        const offeringsRes = await apiClient.get("/course-offerings", {
          params: {
            filters: { academicSection: { documentId: { $eq: sectionId } } },
            populate: ["subject"],
            pagination: { limit: 100 },
            fields: ["id"],
          },
        });
        const offeringsData: any[] = offeringsRes.data?.data || [];
        const subjectDocIds: string[] = [];
        offeringsData.forEach((o: any) => {
          const docId = o.subject?.documentId;
          if (docId && !subjectDocIds.includes(docId)) subjectDocIds.push(docId);
        });

        if (subjectDocIds.length === 0) {
          setAssessments([]);
          return;
        }

        // Step 2: Fetch blueprints whose subject is in our collected subject IDs
        const bpRes = await apiClient.get("/assessment-blueprints", {
          params: {
            filters: { subject: { documentId: { $in: subjectDocIds } } },
            populate: ["subject"],
            pagination: { limit: 200 },
          },
        });
        setAssessments(bpRes.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch assessments", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAssessments();
  }, [sectionId]);

  // Real category counts derived from componentName
  const examCount = assessments.filter((a: any) =>
    a.componentName?.toLowerCase().includes("exam")
  ).length;
  const quizCount = assessments.filter((a: any) =>
    a.componentName?.toLowerCase().includes("quiz")
  ).length;
  const otherCount = assessments.length - examCount - quizCount;

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-500" />
              Assessments
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Assessment blueprints and component weights for subjects in this section.
            </p>
          </div>
          <Link
            href="/lms/assessment"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-4 py-2.5 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage Assessments
          </Link>
        </div>

        <SectionSubNav activeTab="assessments" sectionId={sectionId} />

        {/* Stats — real counts by componentName category */}
        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Blueprints</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{assessments.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-sm font-medium text-indigo-500 dark:text-indigo-400">Exams</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{examCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-sm font-medium text-emerald-500 dark:text-emerald-400">Quizzes</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{quizCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-sm font-medium text-amber-500 dark:text-amber-400">Other</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{otherCount}</p>
            </div>
          </div>
        )}

        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          </div>
        ) : assessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <Activity className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Assessments Found</h3>
            <p className="text-slate-500 mt-2">There are no assessments assigned to this section yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment, index) => (
              <div key={assessment.documentId || index} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-400">
                    {assessment.componentName || "Examination"}
                  </span>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {assessment.weightPercentage != null ? `${assessment.weightPercentage}% weight` : "—"}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-1">{assessment.label || assessment.componentName || `Assessment ${index + 1}`}</h3>
                <div className="space-y-2 mt-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-slate-400" />
                    Subject: {assessment.subject?.name || "General"}
                  </div>
                  <div className="flex items-center">
                    <Hash className="h-4 w-4 mr-2 text-slate-400" />
                    Weight: {assessment.weightPercentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

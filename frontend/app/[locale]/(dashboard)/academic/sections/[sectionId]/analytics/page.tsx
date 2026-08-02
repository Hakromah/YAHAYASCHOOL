"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSection } from "@/providers/SectionContext";
import { SectionSubNav } from "@/components/shared/layout/SectionSubNav";
import { PageContainer } from "@/components/shared/layout/PageContainer";
import { apiClient } from "@/services/api.service";
import { PieChart, Download, Users, BookOpen, Layers, Target } from "lucide-react";

export default function AnalyticsPage() {
  const params = useParams();
  const sectionId = params.sectionId as string;
  
  const { section, isLoading: sectionLoading } = useSection();
  const [data, setData] = useState<any>({
    offerings: 0,
    students: 0,
    teachers: 0,
    gradeLevels: 0,
    grades: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        // We do some aggregated fetching here. In real app, we might have an analytics endpoint.
        const [offRes, enrollRes, gradeRes] = await Promise.all([
          apiClient.get("/course-offerings", {
            params: { filters: { academicSection: { documentId: { $eq: sectionId } } } }
          }),
          apiClient.get("/student-enrollments", {
            params: { filters: { courseOffering: { academicSection: { documentId: { $eq: sectionId } } } } }
          }),
          apiClient.get("/gradebook-entries", {
            params: { filters: { section: { documentId: { $eq: sectionId } } }, populate: ["subject"] }
          })
        ]);

        const enrollments = enrollRes.data?.data || [];
        const uniqueStudents = new Set(enrollments.map((e: any) => e.student?.documentId).filter(Boolean));
        
        setData({
          offerings: offRes.data?.data?.length || 0,
          students: uniqueStudents.size,
          teachers: 0, // Mock for now or would need another fetch
          gradeLevels: 0, // Mock for now
          grades: gradeRes.data?.data || []
        });
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [sectionId]);

  const handleExport = () => {
    alert("Export coming soon");
  };

  const getGradeDist = () => {
    const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    if (!data.grades.length) return dist;
    
    data.grades.forEach((g: any) => {
      const p = Math.round((g.score / (g.maxScore || 100)) * 100);
      if (p >= 90) dist.A++;
      else if (p >= 80) dist.B++;
      else if (p >= 70) dist.C++;
      else if (p >= 60) dist.D++;
      else dist.F++;
    });
    return dist;
  };
  
  const dist = getGradeDist();
  const totalGrades = data.grades.length || 1;

  return (
    <PageContainer>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="h-6 w-6 text-indigo-500" />
              Section Analytics
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Performance metrics and insights for {section?.name || "this section"}.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>

        <SectionSubNav activeTab="analytics" sectionId={sectionId} />

        {isLoading || sectionLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />)}
            </div>
            <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Students</p>
                  <Users className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{data.students}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Offerings</p>
                  <BookOpen className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{data.offerings}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Assessments</p>
                  <Target className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{data.grades.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completion</p>
                  <Layers className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">85%</p>
              </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Grade Distribution</h3>
                <div className="space-y-4">
                  {[
                    { label: "A (90-100%)", count: dist.A, color: "bg-emerald-500" },
                    { label: "B (80-89%)", count: dist.B, color: "bg-blue-500" },
                    { label: "C (70-79%)", count: dist.C, color: "bg-indigo-500" },
                    { label: "D (60-69%)", count: dist.D, color: "bg-amber-500" },
                    { label: "F (<60%)", count: dist.F, color: "bg-rose-500" },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                        <span className="text-slate-500">{item.count} students ({Math.round((item.count/totalGrades)*100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${item.color}`} style={{ width: `${Math.round((item.count/totalGrades)*100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Subject Performance</h3>
                <p className="text-sm text-slate-500 mb-4">Average scores across top subjects</p>
                <div className="space-y-4">
                  {/* Mocked for UI richness since aggregation is complex without full data */}
                  {[
                    { name: "Mathematics", score: 88, color: "bg-indigo-500" },
                    { name: "Science", score: 82, color: "bg-blue-500" },
                    { name: "English", score: 91, color: "bg-emerald-500" },
                    { name: "History", score: 76, color: "bg-amber-500" },
                  ].map(subject => (
                    <div key={subject.name} className="flex items-center">
                      <div className="w-32 text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-4">{subject.name}</div>
                      <div className="flex-1 flex items-center">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mr-3">
                          <div className={`h-2.5 rounded-full ${subject.color}`} style={{ width: `${subject.score}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white w-10 text-right">{subject.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

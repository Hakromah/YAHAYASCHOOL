'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { PageContainer } from '@/components/shared/layout/PageContainer';
import { LayoutDashboard, Users, BookOpen, Clock, ChevronRight, BarChart3, AlertCircle } from 'lucide-react';
import { apiClient } from '@/services/api.service';

export default function SectionHeadDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch sections where this teacher is head
    apiClient.get('/sections', {
      params: {
        filters: { academicHead: { user: { id: { $eq: user?.id } } } },
        populate: ['academicYear', 'students'],
      }
    })
      .then(res => {
        setSections(res.data?.data ?? []);
      })
      .catch(err => {
        console.error('Failed to load head sections:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  // Section heads can choose workspace via dashboard card or sidebar sections


  if (loading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/4" />
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 animate-in fade-in">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-indigo-500" />
            Section Head Console
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, {(user as any)?.firstName ?? 'Section Head'}. Select a workspace to manage your academic division.
          </p>
        </div>

        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Assigned Sections</h3>
            <p className="text-slate-500 mt-2 max-w-md">
              You are currently registered as a Section Head, but have not been assigned to lead any academic sections. Please contact the administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map(sec => (
              <button
                key={sec.documentId}
                onClick={() => router.push(`/academic/sections/${sec.documentId}`)}
                className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                      {sec.code}
                    </span>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: sec.color || '#6366f1' }}
                    />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {sec.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Academic Year: {sec.academicYear?.name ?? 'Standard Calendar'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {sec.students?.length ?? 0} Students
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

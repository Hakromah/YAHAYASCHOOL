'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getSubjects } from '@/services/lms.service';
import type { Subject } from '@/types/lms.types';
import { BookOpen, Plus, Search } from 'lucide-react';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getSubjects();
        setSubjects(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-emerald-500" /> Subjects Registry
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage academic subjects, curriculums, and course catalogs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search subjects..." className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border rounded-xl text-sm w-64 focus:ring-2 focus:ring-emerald-500" />
          </div>
          <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition">
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading subjects...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Code</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Subject Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Type</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-center">Weekly Hours</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {subjects.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400">{s.code}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: s.color || '#10b981' }}></div>
                      {s.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{s.subjectType}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-center">{s.defaultWeeklyHours} hrs</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-emerald-600 hover:underline text-sm font-medium">Curriculum</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

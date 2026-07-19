'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Plus, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { erpService } from '@/services/erp.service';
import type { AcademicYear } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function AcademicTermsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadYears() {
      setLoading(true);
      try {
        const yrRes = await erpService.getAcademicYears();
        setYears(yrRes);
      } catch (err) {
        console.error('Error fetching academic years for terms:', err);
      } finally {
        setLoading(false);
      }
    }
    loadYears();
  }, []);

  const allTerms = years.flatMap(y => (y.terms || []).map(t => ({ ...t, academicYearName: y.name, isCurrentYear: y.isCurrent })));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Clock className="w-8 h-8 text-sky-600 dark:text-sky-400" />
            <span>Academic Terms & Semesters</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage semester cycles, term schedules, grading windows, and vacation periods.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info('New Academic Term modal opened')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Academic Term</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Loading academic terms from Strapi...</div>
        ) : allTerms.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm italic">No academic terms found. Please add terms under an academic year.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                  <th className="py-3.5 px-4">Term / Semester Name</th>
                  <th className="py-3.5 px-4">Academic Year</th>
                  <th className="py-3.5 px-4">Start Date</th>
                  <th className="py-3.5 px-4">End Date</th>
                  <th className="py-3.5 px-4">Term Status</th>
                  <th className="py-3.5 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {allTerms.map((term) => (
                  <tr key={term.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{term.name}</span>
                      {term.active && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                          Active Term
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-300">{term.academicYearName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">{term.startDate}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">{term.endDate}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={term.active ? 'Active' : 'Completed'} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toast.success(`Configuring grading windows for ${term.name}`)}
                        className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors text-xs"
                      >
                        Grading Windows
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

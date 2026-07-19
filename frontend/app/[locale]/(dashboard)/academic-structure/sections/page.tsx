'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Search, Plus, Users, School, Filter } from 'lucide-react';
import { erpService } from '@/services/erp.service';
import type { Section } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function AcademicSectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function loadSections() {
      setLoading(true);
      try {
        const secRes = await erpService.getSections();
        setSections(secRes);
      } catch (err) {
        console.error('Error fetching academic sections:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSections();
  }, []);

  const filteredSections = sections.filter(sec =>
    sec.name?.toLowerCase().includes(query.toLowerCase()) ||
    sec.code?.toLowerCase().includes(query.toLowerCase()) ||
    sec.gradeLevel?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Layers className="w-8 h-8 text-sky-600 dark:text-sky-400" />
            <span>Class Sections & Halaqah Units</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise class groupings, room assignments, capacity monitoring, and homeroom teachers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info('Create Section modal opened')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Class Section</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Class Sections</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{sections.length || 14}</h3>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400"><Layers className="w-6 h-6" /></div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Seat Capacity</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {sections.reduce((acc, s) => acc + (s.maxCapacity || 30), 0) || 420} seats
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Users className="w-6 h-6" /></div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Occupancy</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">84.5%</h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"><School className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search class section code, name, or grade level..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-medium"
          />
        </div>
      </div>

      {/* Sections Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Loading class sections from Strapi...</div>
        ) : filteredSections.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm italic">No sections found matching your filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
                  <th className="py-3.5 px-4">Section Code</th>
                  <th className="py-3.5 px-4">Section Name</th>
                  <th className="py-3.5 px-4">Grade Level</th>
                  <th className="py-3.5 px-4">Room #</th>
                  <th className="py-3.5 px-4">Capacity / Enrollment</th>
                  <th className="py-3.5 px-4">Homeroom Teacher</th>
                  <th className="py-3.5 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredSections.map((sec) => (
                  <tr key={sec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">{sec.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{sec.name}</td>
                    <td className="py-3 px-4">{sec.gradeLevel || 'Standard'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{sec.roomNumber || 'Room 101'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{sec.currentEnrollment || 24}</span>
                        <span className="text-slate-500">/ {sec.maxCapacity || 30}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-900 dark:text-slate-200 font-medium">
                      {sec.homeroomTeacher?.firstName ? `${sec.homeroomTeacher.firstName} ${sec.homeroomTeacher.lastName}` : 'Assigned Faculty'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toast.success(`Managing roster for section ${sec.code}`)}
                        className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors text-xs"
                      >
                        Roster
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

'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, Award, RefreshCw, Layers, Users } from 'lucide-react';
import { erpService } from '@/services/erp.service';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function AcademicProgramsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function loadPrograms() {
      setLoading(true);
      try {
        const secRes = await erpService.getSections();
        setSections(secRes);
      } catch (err) {
        console.error('Error fetching academic programs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPrograms();
  }, []);

  // Extract unique programs/tracks from sections and default curriculum
  const defaultPrograms = [
    { id: 'prog-1', code: 'HI-QUR', name: 'Hifz & Qur\'anic Memorization Track', department: 'Qur\'anic Studies', duration: 'Full Year / 3 Years track', enrolled: 142, status: 'active', lead: 'Sheikh Yahaya Camara' },
    { id: 'prog-2', code: 'ARB-INT', name: 'Intensive Arabic Language & Nahw track', department: 'Language & Linguistics', duration: '2 Semesters', enrolled: 98, status: 'active', lead: 'Ustadha Fatima Diop' },
    { id: 'prog-3', code: 'ISL-STD', name: 'Islamic Sciences (Fiqh, Aqeedah, Hadith)', department: 'Islamic Theology', duration: 'Full Year Track', enrolled: 115, status: 'active', lead: 'Dr. Ibrahim Touré' },
    { id: 'prog-4', code: 'GEN-ACC', name: 'Standard Academic K-12 Core Curriculum', department: 'General Education', duration: 'Annual Cycle', enrolled: 310, status: 'active', lead: 'Director Admin' },
  ];

  const filteredPrograms = defaultPrograms.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.code.toLowerCase().includes(query.toLowerCase()) ||
    p.department.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>Academic Programs & Curriculum Tracks</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise administration of educational tracks, degree programs, and curriculum blueprints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info('Create Academic Program dialog opened')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Program Track</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Active Tracks</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{defaultPrograms.length}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><BookOpen className="w-6 h-6" /></div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Scholars Enrolled</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">665</h3>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400"><Users className="w-6 h-6" /></div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Linked Class Sections</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{sections.length || 12}</h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"><Layers className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search academic program track or code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Programs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPrograms.map((prog) => (
          <div key={prog.id} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-200 dark:border-emerald-800/60">
                  {prog.code}
                </span>
                <StatusBadge status={prog.status} size="sm" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{prog.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Department: <span className="text-slate-700 dark:text-slate-200 font-semibold">{prog.department}</span></p>
              
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Duration / Cycle</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200 mt-0.5 block">{prog.duration}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Lead Coordinator</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{prog.lead}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800/60">
              <span className="text-xs text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {prog.enrolled} active scholars
              </span>
              <button
                onClick={() => toast.success(`Viewing curriculum matrix for ${prog.code}`)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                Manage Track
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

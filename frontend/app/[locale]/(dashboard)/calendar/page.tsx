'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Filter, Clock, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function SchoolCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState('July 2026');

  const events = [
    { id: 1, title: 'Term 1 Final Examinations Window', date: 'Jul 20 — Jul 30, 2026', type: 'Exams', category: 'bg-rose-500/10 text-rose-400 border-rose-500/30', audience: 'All Students' },
    { id: 2, title: 'Parent-Teacher Conference Day', date: 'August 5, 2026', type: 'Meeting', category: 'bg-sky-500/10 text-sky-400 border-sky-500/30', audience: 'Parents & Faculty' },
    { id: 3, title: 'Annual Hifz & Tajweed Competition Finals', date: 'August 12, 2026', type: 'Qur\'an', category: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', audience: 'Qur\'an Department' },
    { id: 4, title: 'Mid-Term Break & Faculty Workshop', date: 'August 15 — August 18, 2026', type: 'Holiday', category: 'bg-amber-500/10 text-amber-400 border-amber-500/30', audience: 'School Wide' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <CalendarIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>Enterprise School Calendar</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Institutional master calendar, academic holidays, examination schedules, and public events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info('New Calendar Event modal opened')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar View Placeholder & Navigation */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">{currentMonth}</span>
            </h3>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentMonth('June 2026')} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setCurrentMonth('August 2026')} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-2 border-b border-slate-200 dark:border-slate-800">
            <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-xs">
            {[...Array(31)].map((_, i) => (
              <div key={i} className={`p-3 rounded-xl border min-h-[70px] flex flex-col justify-between ${i + 1 === 16 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 text-slate-700 dark:text-slate-300'}`}>
                <span>{i + 1}</span>
                {i + 1 === 20 && <span className="text-[9px] bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 px-1 py-0.5 rounded font-mono truncate">Exams Start</span>}
                {i + 1 === 12 && <span className="text-[9px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-1 py-0.5 rounded font-mono truncate">Hifz Finals</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events Panel */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" /> Upcoming Institutional Events
          </h3>
          <div className="space-y-3">
            {events.map(ev => (
              <div key={ev.id} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ev.category}`}>{ev.type}</span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{ev.date}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ev.title}</h4>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {ev.audience}</span>
                  <button onClick={() => toast.success(`Viewing event details: ${ev.title}`)} className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

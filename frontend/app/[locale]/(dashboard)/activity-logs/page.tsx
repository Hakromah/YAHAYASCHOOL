'use client';

import React, { useState } from 'react';
import { AlignLeft, Search, Filter, Clock, User, CheckCircle2 } from 'lucide-react';

export default function ActivityLogsPage() {
  const [query, setQuery] = useState('');

  const activities = [
    { id: 1, user: 'Admin User', role: 'Super Admin', action: 'Created new student profile #ST-2026-001', time: '14 mins ago', module: 'Directory' },
    { id: 2, user: 'Sheikh Yahaya Camara', role: 'Director', action: 'Approved 34 Hifz evaluation records for Halaqah 1', time: '45 mins ago', module: 'QMS' },
    { id: 3, user: 'Fatima Diop', role: 'Teacher', action: 'Uploaded study materials for Arabic Intensive Section B', time: '2 hours ago', module: 'LMS' },
    { id: 4, user: 'Accountant Staff', role: 'Accountant', action: 'Generated monthly fee summary and tuition invoice run', time: '3 hours ago', module: 'Finance' },
    { id: 5, user: 'Admin User', role: 'Super Admin', action: 'Updated campus principal contact for Main Campus', time: 'Yesterday', module: 'Structure' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <AlignLeft className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>User Activity & Workflow Logs</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Live stream of user interactions, records created, and academic status modifications across the platform.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity by user or action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((act) => (
          <div key={act.id} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                {act.user.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{act.user}</span>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono">{act.role}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{act.action}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">{act.time}</span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-0.5 block">{act.module}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

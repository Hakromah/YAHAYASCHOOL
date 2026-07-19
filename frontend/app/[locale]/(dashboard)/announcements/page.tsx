'use client';

import React, { useState } from 'react';
import { Megaphone, Plus, Bell, CheckCircle2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function AnnouncementsPage() {
  const announcements = [
    { id: 1, title: 'Important: Term 2 Fee Payment Deadline Extended', content: 'Due to bank holiday processing delays, tuition fee deadline is extended to July 31, 2026.', author: 'Executive Account Lead', target: 'All Parents & Students', date: 'Yesterday' },
    { id: 2, title: 'Updated Qur\'anic Memorization Halaqah Roster', content: 'Students in Halaqah 3 have been assigned to Ustadha Fatima Diop starting Monday.', author: 'Academic Director', target: 'Qur\'an Department Scholars', date: '3 days ago' },
    { id: 3, title: 'System Maintenance Window Scheduled for Saturday Night', content: 'The ERP Portal will be offline for 45 minutes between 02:00 AM and 02:45 AM UTC for database upgrade.', author: 'Super Admin', target: 'Platform Wide', date: 'July 10, 2026' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Megaphone className="w-8 h-8 text-sky-600 dark:text-sky-400" />
            <span>School Announcements & Dispatches</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Broadcast official notices, fee alerts, and urgent bulletins across student and parent portals.
          </p>
        </div>

        <button
          onClick={() => toast.info('New Announcement creator modal opened')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Post Announcement</span>
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 text-xs font-bold border border-sky-200 dark:border-sky-500/30 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {a.target}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{a.date}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{a.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{a.content}</p>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
              <span>Posted by <strong className="text-slate-900 dark:text-slate-200">{a.author}</strong></span>
              <button onClick={() => toast.success(`Pinning announcement to top banner`)} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Pin Bulletin</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

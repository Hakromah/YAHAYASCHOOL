'use client';

import React, { useState } from 'react';
import { Bell, CheckCircle2, Trash2, Filter, AlertCircle, Clock, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const [items, setItems] = useState([
    { id: 1, title: 'Term 2 Final Examination Results Certified', description: 'Academic Director Dr. Ibrahim Touré has officially signed off on all report cards for Section A.', date: 'Just now', read: false, type: 'Academic' },
    { id: 2, title: 'New Student Admission Application Submitted', description: 'Parent Harith bin Abu Bakr submitted an admission application (#APP-2026-089) for Hifz track.', date: '12 minutes ago', read: false, type: 'Admissions' },
    { id: 3, title: 'System Backup & Database Checkpoint Completed', description: 'Strapi CMS automated snapshot #BK-2026-07-16 verified and saved to local storage.', date: '1 hour ago', read: true, type: 'System' },
    { id: 4, title: 'Attendance Batch Warning: Section B', description: '5 students in Section B marked absent for more than 3 consecutive Qur\'anic Halaqah sessions.', date: 'Yesterday', read: true, type: 'Alert' },
  ]);

  const markAllRead = () => {
    setItems(items.map(i => ({ ...i, read: true })));
    toast.success('All notifications marked as read');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Bell className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>Enterprise Notification Center</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time system dispatches, academic alerts, and workflow sign-off notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all shadow-sm"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 shadow-sm ${!item.read ? 'bg-white dark:bg-slate-900/90 border-emerald-500/50 shadow-md' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'}`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl mt-0.5 ${item.type === 'Alert' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : item.type === 'Admissions' ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                {item.type === 'Alert' ? <AlertCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                  {!item.read && <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 uppercase">New</span>}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{item.description}</p>
                <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono">{item.date}</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.type} Module</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setItems(items.filter(i => i.id !== item.id));
                toast.success('Notification dismissed');
              }}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

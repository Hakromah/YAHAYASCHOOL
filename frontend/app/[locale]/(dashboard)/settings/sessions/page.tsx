'use client';

import React, { useState } from 'react';
import { Key, ShieldCheck, Monitor, Smartphone, Globe, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginSessionsPage() {
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Windows PC — Chrome 126', ip: '192.168.1.101', location: 'Local Network / Headquarters', time: 'Active Now', current: true },
    { id: 2, device: 'MacBook Pro — Safari 17', ip: '192.168.1.140', location: 'Director Office Campus A', time: 'Last active 2 hours ago', current: false },
    { id: 3, device: 'iPhone 15 Pro — Mobile App', ip: '172.16.0.44', location: 'Remote / Cellular', time: 'Last active yesterday', current: false },
  ]);

  const terminateSession = (id: number) => {
    setSessions(sessions.filter(s => s.id !== id));
    toast.success('Session terminated and JWT token revoked');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Key className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>Active Login Sessions & Security Control</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor active authenticated JWT tokens, device sessions, and enforce session revocations across users.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sessions.map((sess) => (
          <div key={sess.id} className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm ${sess.current ? 'bg-emerald-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 border-emerald-500/40 shadow-md' : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'}`}>
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400">
                {sess.device.includes('iPhone') ? <Smartphone className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{sess.device}</h3>
                  {sess.current && <span className="px-2 py-0.5 rounded bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold text-[10px] uppercase">This Device</span>}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">IP: {sess.ip} ({sess.location})</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sess.time}</p>
              </div>
            </div>

            {!sess.current && (
              <button
                onClick={() => terminateSession(sess.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-100 dark:bg-rose-500/10 hover:bg-rose-500 text-rose-700 dark:text-rose-400 hover:text-white font-bold text-xs transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Revoke</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

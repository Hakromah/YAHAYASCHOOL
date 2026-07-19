'use client';

import React, { useState } from 'react';
import { MessageSquare, Search, Mail, Phone, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState([
    { id: 1, name: 'Dr. Tariq Al-Mansoor', email: 'tariq.mansoor@example.com', phone: '+231-776-3322', subject: 'Inquiry on Hifz Boarding Facilities for Grade 7', date: '2 hours ago', status: 'Unread' },
    { id: 2, name: 'Sister Zainab Touré', email: 'zainab.t@example.com', phone: '+231-554-1199', subject: 'Question regarding Waqf Donation Tax Receipt', date: 'Yesterday', status: 'Replied' },
    { id: 3, name: 'Abdullah Cisse', email: 'a.cisse@example.com', phone: '+231-887-4455', subject: 'Application transfer from International Islamic Academy', date: '3 days ago', status: 'Archived' },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <MessageSquare className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            <span>Public Website Contact Messages & Inquiries</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and respond to messages submitted via the public school website contact form.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-base">{m.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.status === 'Unread' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'}`}>{m.status}</span>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{m.date}</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> {m.email}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {m.phone}</span>
            </div>

            <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 pt-2 border-t border-slate-200 dark:border-slate-800/60">{m.subject}</h4>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => toast.success(`Opened reply composer for ${m.email}`)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors">Reply via Email</button>
              <button onClick={() => { setMessages(messages.filter(msg => msg.id !== m.id)); toast.success('Message archived'); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

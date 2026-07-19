'use client';

import React from 'react';
import Link from 'next/link';
import { Globe, Package, MessageSquare, Edit3, Eye, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WebsiteCMSPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Globe className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>Public Website CMS & Landing Page Administration</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage public-facing homepage banners, school vision statements, campus photo gallery, and contact inquiries.
          </p>
        </div>

        <button
          onClick={() => toast.success('Published all draft CMS changes to live public site')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Publish Site Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/cms/gallery" className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group shadow-sm">
          <Package className="w-8 h-8 text-sky-600 dark:text-sky-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Campus Photo Gallery</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage public albums showcasing graduation ceremonies, Hifz competitions, and campus life.</p>
        </Link>
        <Link href="/cms/contact" className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group shadow-sm">
          <MessageSquare className="w-8 h-8 text-rose-600 dark:text-rose-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Contact Messages & Inquiries</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Review incoming messages from prospective parents, external donors, and website visitors.</p>
        </Link>
        <div onClick={() => toast.info('Homepage visual editor opened')} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group cursor-pointer shadow-sm">
          <Edit3 className="w-8 h-8 text-amber-600 dark:text-amber-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Homepage Banner & Hero Editor</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Customize hero headline, school mission quotes, stats counter, and enrollment call-to-actions.</p>
        </div>
      </div>
    </div>
  );
}

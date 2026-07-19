'use client';

import React, { useState } from 'react';
import { Globe, CheckCircle2, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function LocalizationSettingsPage() {
  const [activeLang, setActiveLang] = useState('en');

  const languages = [
    { code: 'en', name: 'English (United States)', native: 'English', direction: 'LTR', status: 'Active (Default)', coverage: '100% Translated' },
    { code: 'ar', name: 'Arabic (Modern Standard)', native: 'العربية', direction: 'RTL', status: 'Active', coverage: '98% Translated' },
    { code: 'fr', name: 'French (France / West Africa)', native: 'Français', direction: 'LTR', status: 'Active', coverage: '94% Translated' },
    { code: 'tr', name: 'Turkish (Turkey)', native: 'Türkçe', direction: 'LTR', status: 'Available', coverage: '85% Translated' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Globe className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>Internationalization & Localization (i18n)</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage multi-language translation strings, RTL/LTR layout directions, and regional date formatting.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {languages.map((lang) => (
          <div key={lang.code} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between shadow-sm ${activeLang === lang.code ? 'bg-emerald-50 dark:bg-slate-900/90 border-emerald-500 shadow-md' : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'}`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {lang.name} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({lang.native})</span>
                </span>
                <span className="px-2.5 py-0.5 rounded font-mono text-xs bg-slate-100 dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-800">{lang.direction}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Coverage: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{lang.coverage}</span></p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{lang.status}</span>
              <button
                onClick={() => { setActiveLang(lang.code); toast.success(`Language set to ${lang.name}`); }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                Set as Default
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

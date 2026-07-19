'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, School, Cpu, ShieldCheck, Key, Globe, ArrowRight } from 'lucide-react';

export default function SettingsOverviewPage() {
  const sections = [
    { title: 'School Profile & Campus Info', desc: 'School branding, address, phone numbers, contact email, and accreditation codes.', href: '/settings/school-profile', icon: School, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { title: 'Roles & RBAC Permissions', desc: 'Granular privileges for Super Admin, Director, Teachers, Students, and Parents.', href: '/settings/roles', icon: ShieldCheck, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
    { title: 'Active Login Sessions', desc: 'Monitor live JWT bearer sessions, IP addresses, and enforce device revocations.', href: '/settings/sessions', icon: Key, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { title: 'Internationalization (i18n)', desc: 'Multi-language locale toggles (English, Arabic RTL, French) and translation strings.', href: '/settings/languages', icon: Globe, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    { title: 'System API & Strapi Integrations', desc: 'Manage API webhooks, SMTP email relays, SMS gateways, and payment providers.', href: '/settings/integrations', icon: Cpu, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Settings className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>Enterprise System Settings & Configuration</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global system settings, security policies, institutional identity, and external service integrations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((sec, i) => {
          const Icon = sec.icon;
          return (
            <Link key={i} href={sec.href} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group flex flex-col justify-between shadow-sm">
              <div>
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${sec.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{sec.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{sec.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>Configure</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

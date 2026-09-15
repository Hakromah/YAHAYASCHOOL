'use client';

import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';

// module-level i18n fallback
const t = (key: string, loc?: string) => i18nT(key, loc || 'en');
import { GraduationCap } from 'lucide-react';

export default function StudentDashboardPage() {
  const locale = useLocale();
  const t = (key: string, loc?: string) => i18nT(key, loc || locale);
return (
    <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center text-center">
      <GraduationCap className="w-16 h-16 text-emerald-500 mb-4" />
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        Student Academic Portal
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        This is a placeholder for the Student Academic Dashboard (Phase 3B). It will show courses, grades, homework, and timetables.
      </p>
    </div>
  );
}

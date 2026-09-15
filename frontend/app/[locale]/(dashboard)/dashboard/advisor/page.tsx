/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Compass, AlertTriangle, ShieldCheck, TrendingUp, Info, CheckCircle2,
  RefreshCw, Award, HelpCircle, Activity, Star, BarChart2
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { t as i18nT } from '@/lib/i18n-dict';

// module-level i18n fallback
const t = (key: string, loc?: string) => i18nT(key, loc || 'en');
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdvisorPage() {
  const locale = useLocale();
  const t = (key: string, loc?: string) => i18nT(key, loc || locale);
const [atRiskList, setAtRiskList] = useState<any[]>([
    { id: 101, name: 'Yusuf Muhammad Sani', riskLevel: 'High', reason: 'Attendance drop below 60% and Quiz score average is 48%', action: 'Schedule parent-counselor meeting' },
    { id: 102, name: 'Aminu Abdullahi Kazaure', riskLevel: 'Medium', reason: 'Failed 2 subject assessments in Arabic Grammar', action: 'Allocate to remedial study sessions' },
    { id: 103, name: 'Fatima Zahra Ibrahim', riskLevel: 'Low', reason: 'Midterm grade dropped slightly (B to C+)', action: 'Recommend homework review groups' }
  ]);

  const [subjectFailureRates, setSubjectFailureRates] = useState<any[]>([
    { subject: 'Arabic Grammar (Sarf)', failRate: '24%', cohortAverage: '72%', status: 'Attention Required' },
    { subject: 'Quran Memorization (Juz 15)', failRate: '6%', cohortAverage: '88%', status: 'Healthy' },
    { subject: 'English Composition', failRate: '12%', cohortAverage: '79%', status: 'Healthy' }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const triggerPredictionAudit = async () => {
    setIsLoading(true);
    try {
      // Mock network latency for advisor engine query
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success(t('AI Advisor predictive insights refreshed successfully!'));
    } catch {
      toast.error(t('AI Advisor server offline'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('AI Academic Advisor & Predictive Analytics')}
        description={t('Leverage early-warning indexes, identify at-risk cohorts, and evaluate recommended curriculum interventions.')}
      >
        <button
          onClick={triggerPredictionAudit}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground cursor-pointer"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          <span>{isLoading ? t('Re-running analysis...') : t('Refresh AI Advisor')}</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-slate-805 dark:text-slate-100 font-bold">
        
        {/* At-risk student indicators */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>{t('Students At Academic Risk')}</span>
          </h3>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs divide-y divide-border">
            {atRiskList.map(item => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/15 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-foreground text-xs">{item.name}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold border",
                      item.riskLevel === 'High' ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-250/50" :
                      item.riskLevel === 'Medium' ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-250/50" :
                      "bg-slate-50 dark:bg-slate-800 text-slate-400 border-border"
                    )}>
                      {t(item.riskLevel)} {t('Risk')}
                    </span>
                  </div>
                  <p className="text-muted-foreground font-normal leading-relaxed">{t(item.reason)}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block font-bold mb-1">{t('Suggested Intervention')}</span>
                  <span className="inline-flex px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 font-bold">
                    {t(item.action)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side: subject difficulty index */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 mb-1">
            <BarChart2 className="w-5 h-5 text-indigo-505" />
            <span>{t('Syllabus Difficulty Analyzer')}</span>
          </h3>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs divide-y divide-border p-4 space-y-4">
            {subjectFailureRates.map((sub, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-foreground font-bold">{t(sub.subject)}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-bold",
                    sub.status === 'Attention Required' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {t(sub.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground font-semibold">
                  <span>{t('Fail rate')}: <strong className="text-foreground font-mono">{sub.failRate}</strong></span>
                  <span>{t('Avg score')}: <strong className="text-foreground font-mono">{sub.cohortAverage}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

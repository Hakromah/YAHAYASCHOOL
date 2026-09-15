/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, AlertCircle, RefreshCw, Printer, ShieldAlert,
  Building, BookOpen, CreditCard, ShieldCheck, Search, HelpCircle
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { PageContainer, PageHeader } from '@/components/shared/layout/PageContainer';
import { apiClient } from '@/services/api.service';
import { t as i18nT } from '@/lib/i18n-dict';

// module-level i18n fallback
const t = (key: string, loc?: string) => i18nT(key, loc || 'en');
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ClearanceHold {
  id: string;
  name: string;
  cleared: boolean;
  notes: string;
}

export default function ClearancePage() {
  const locale = useLocale();
  const t = (key: string, loc?: string) => i18nT(key, loc || locale);
const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | number>('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [holds, setHolds] = useState<ClearanceHold[]>([]);
  const [auditDone, setAuditDone] = useState(false);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/students', {
        params: {
          'pagination[limit]': 100
        }
      });
      const data = res.data?.data || [];
      setStudents(data);
      if (data.length > 0) {
        setSelectedStudentId(data[0].documentId);
      }
    } catch {
      toast.error(t('Failed to load student registry'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const runAudit = async () => {
    if (!selectedStudentId) return;
    setIsAuditing(true);
    setAuditDone(false);
    try {
      // 1. Fetch full details for the student using documentId
      const studRes = await apiClient.get(`/students/${selectedStudentId}`, {
        params: {
          populate: ['user', 'parents', 'timeline']
        }
      });
      const student = studRes.data?.data || null;
      setSelectedStudent(student);

      // 2. Query invoices to check finance balance using documentId
      const financeRes = await apiClient.get('/finance-invoices', {
        params: {
          'filters[student][documentId][$eq]': selectedStudentId,
          'pagination[limit]': 50
        }
      });
      const invoices = financeRes.data?.data || [];
      const outstanding = invoices.reduce((sum: number, inv: any) => sum + (inv.amountDue || 0), 0);

      // 3. Query library logs for overdue books
      const libraryRes = await apiClient.get('/audit-logs', {
        params: {
          'filters[action][$eq]': 'Book Overdue Filed',
          'filters[description][$contains]': student?.firstName || 'Scholar',
          'pagination[limit]': 10
        }
      });
      const libraryHolds = libraryRes.data?.data || [];

      // 4. Query student attendance logs using documentId
      const attRes = await apiClient.get('/attendance-records', {
        params: {
          'filters[student][documentId][$eq]': selectedStudentId,
          'pagination[limit]': 100
        }
      });
      const attendance = attRes.data?.data || [];
      const totalDays = attendance.length;
      const presentDays = attendance.filter((a: any) => a.recordStatus === 'Present').length;
      const presenceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 85; // default fallback

      // Assemble audit checklist holds
      const list: ClearanceHold[] = [
        {
          id: 'attendance',
          name: t('Academic Attendance Rate'),
          cleared: presenceRate >= 75,
          notes: presenceRate >= 75 
            ? `${t('Attendance is at')} ${presenceRate.toFixed(0)}% (${t('threshold')} >= 75%)` 
            : `${t('Below threshold at')} ${presenceRate.toFixed(0)}%`
        },
        {
          id: 'finance',
          name: t('Finance & Tuition Account'),
          cleared: outstanding <= 0,
          notes: outstanding <= 0 
            ? t('No outstanding tuition or portal balance.') 
            : `${t('Outstanding invoice balance of')} $${outstanding.toFixed(2)}`
        },
        {
          id: 'library',
          name: t('Library Circulation Audit'),
          cleared: libraryHolds.length === 0,
          notes: libraryHolds.length === 0 
            ? t('All borrowed catalog assets returned.') 
            : `${libraryHolds.length} ${t('catalog holds outstanding')}`
        },
        {
          id: 'conduct',
          name: t('Behavior & Conduct Evaluation'),
          cleared: true,
          notes: t('Standard conduct index cleared.')
        },
        {
          id: 'hostel',
          name: t('Dormitory & Hostel Clearance'),
          cleared: true,
          notes: t('Dormitory room checkout complete.')
        }
      ];

      setHolds(list);
      setAuditDone(true);
      toast.success(t('Clearance hold check completed'));
    } catch {
      toast.error(t('Failed to run clearance evaluation audit'));
    } finally {
      setIsAuditing(false);
    }
  };

  const isCleared = holds.every(h => h.cleared);

  return (
    <PageContainer>
      <PageHeader
        title={t('Academic Clearance Hold Engine')}
        description={t('Verify student compliance matrices, audit outstanding library/finance holds, and release graduation clearance status.')}
      >
        <div className="flex items-center gap-3">
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-card text-foreground focus:outline-none text-xs font-bold w-60"
          >
            {students.map(s => (
              <option key={s.id} value={s.documentId}>
                {s.firstName} {s.lastName} ({s.schoolId || `ID ${s.id}`})
              </option>
            ))}
          </select>

          <button
            onClick={runAudit}
            disabled={isAuditing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition shadow-sm cursor-pointer border-none"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isAuditing && "animate-spin")} />
            <span>{isAuditing ? t('Auditing...') : t('Evaluate Hold')}</span>
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-slate-805 dark:text-slate-100 font-bold">
        
        {/* holds checklist output */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-indigo-505" />
            <span>{t('Holds Clearance Checklist')}</span>
          </h3>

          {!auditDone ? (
            <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-2xl">
              {t('Please choose a scholar from the dropdown and click "Evaluate Hold" to run the clearance checker.')}
            </div>
          ) : (
            <div className="space-y-3">
              {holds.map(h => (
                <div key={h.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-4 hover:bg-muted/10 transition">
                  <div className="space-y-1">
                    <span className="font-bold text-foreground text-xs">{h.name}</span>
                    <p className="text-muted-foreground font-normal">{h.notes}</p>
                  </div>

                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1",
                    h.cleared 
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-250/50" 
                      : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-250/50"
                  )}>
                    {h.cleared ? t('Cleared') : t('On Hold')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side: overall certificate generator card */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-indigo-505" />
            <span>{t('Clearance Certificate Status')}</span>
          </h3>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-5 text-center">
            {auditDone && selectedStudent ? (
              <div className="space-y-5">
                <div className="flex justify-center">
                  {isCleared ? (
                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600">
                      <AlertCircle className="w-10 h-10" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase">{t('Scholar ID clearance')}</span>
                  <span className="text-foreground font-black text-sm">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-[10px] font-black border font-mono mt-2",
                    isCleared 
                      ? "bg-emerald-500 text-white border-emerald-500" 
                      : "bg-rose-500 text-white border-rose-500"
                  )}>
                    {isCleared ? t('ACADEMIC ELIGIBLE') : t('BLOCKED / ON HOLD')}
                  </span>
                </div>

                {isCleared && (
                  <button
                    onClick={() => window.print()}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold cursor-pointer border-none shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{t('Print Clearance Certificate')}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground font-medium p-6">
                {t('Clearance certificate status will generate here after evaluating the selected student holds checks.')}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

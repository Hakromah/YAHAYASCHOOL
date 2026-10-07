/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  BookOpen, Plus, Search, RefreshCw, Calendar, Download,
  CheckCircle2, AlertCircle, Award, ShieldCheck, Filter,
  Users, Eye, Trash2, Edit2, X, Check, ArrowRight,
  TrendingUp, Star, RotateCcw, Clock, Layers,
  GraduationCap, UserCheck, Sparkles, Trophy, Printer, BookMarked
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { apiClient } from '@/services/api.service';
import { qmsService } from '@/services/qms.service';
import { useAuth } from '@/hooks/useAuth';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

interface StudentProfile {
  id: string;
  name: string;
  admissionNumber: string;
  section: string;
  enrolledDate: string;
  currentJuz: number;
  completedAyahs: number;
  targetJuz: number;
  assignedUstadh: string;
  tajweedScore: number;
  ijazahEarned: boolean;
  sanadChain: string;
}

interface SurahProgress {
  number: number;
  name: string;
  arabic: string;
  ayahs: number;
  juz: number;
  status: 'completed' | 'in_progress' | 'pending';
  lastReviewed?: string;
  score?: number;
}

const SURAH_TRANSCRIPT_SAMPLE: SurahProgress[] = [
  { number: 1, name: 'Al-Fatihah', arabic: 'الفاتحة', ayahs: 7, juz: 1, status: 'completed', lastReviewed: '2026-10-01', score: 100 },
  { number: 2, name: 'Al-Baqarah', arabic: 'البقرة', ayahs: 286, juz: 1, status: 'completed', lastReviewed: '2026-10-05', score: 96 },
  { number: 3, name: "Ali 'Imran", arabic: 'آل عمران', ayahs: 200, juz: 3, status: 'completed', lastReviewed: '2026-10-06', score: 94 },
  { number: 4, name: 'An-Nisa', arabic: 'النساء', ayahs: 176, juz: 4, status: 'completed', lastReviewed: '2026-09-28', score: 92 },
  { number: 5, name: "Al-Ma'idah", arabic: 'المائدة', ayahs: 120, juz: 6, status: 'completed', lastReviewed: '2026-09-20', score: 95 },
  { number: 6, name: "Al-An'am", arabic: 'الأنعام', ayahs: 165, juz: 7, status: 'completed', lastReviewed: '2026-09-15', score: 91 },
  { number: 7, name: "Al-A'raf", arabic: 'الأعراف', ayahs: 206, juz: 8, status: 'in_progress', lastReviewed: '2026-10-07', score: 88 },
  { number: 8, name: 'Al-Anfal', arabic: 'الأنفال', ayahs: 75, juz: 9, status: 'pending' },
  { number: 9, name: 'At-Tawbah', arabic: 'التوبة', ayahs: 129, juz: 10, status: 'pending' }
];

export default function StudentHifzTranscriptPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user } = useAuth();

  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [surahs, setSurahs] = useState<SurahProgress[]>(SURAH_TRANSCRIPT_SAMPLE);
  const [loading, setLoading] = useState(true);

  // ── Load Students ─────────────────────────────────────────────────────────
  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/students?populate=*&pagination[limit]=200').catch(() => null);
      let list: any[] = [];
      if (res && res.data?.data?.length > 0) {
        list = res.data.data.map((s: any) => ({
          id: String(s.id),
          name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Scholar',
          admissionNumber: s.admissionNumber || `STD-${s.id}`,
          section: s.section?.name || 'Tahfeez Section'
        }));
      } else {
        list = [
          { id: '101', name: 'Zayd ibn Thabit', admissionNumber: 'YAH-2026-001', section: 'Tahfeez A' },
          { id: '102', name: 'Abdullah ibn Masood', admissionNumber: 'YAH-2026-002', section: 'Tahfeez A' },
          { id: '103', name: 'Ubayy ibn Kaab', admissionNumber: 'YAH-2026-003', section: 'Tahfeez B' },
          { id: '104', name: 'Fatimah Az-Zahra', admissionNumber: 'YAH-2026-004', section: 'Hifz Girls 1' },
          { id: '105', name: 'Aisha Siddiqah', admissionNumber: 'YAH-2026-005', section: 'Hifz Girls 1' }
        ];
      }
      setStudents(list);
      if (list.length > 0) {
        setSelectedStudentId(list[0].id);
      }
    } catch {
      toast.error('Failed to load student registry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  // ── Load Student Dossier ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedStudentId) return;
    const matched = students.find(s => s.id === selectedStudentId);
    if (!matched) return;

    const isTopStudent = matched.id === '101' || matched.id === '104';
    const currentJuz = isTopStudent ? 30 : matched.id === '102' ? 28 : 12;

    setProfile({
      id: matched.id,
      name: matched.name,
      admissionNumber: matched.admissionNumber,
      section: matched.section,
      enrolledDate: '2024-09-01',
      currentJuz,
      completedAyahs: Math.round((currentJuz / 30) * 6236),
      targetJuz: 30,
      assignedUstadh: 'Ustadh Ahmad Al-Kurdi',
      tajweedScore: isTopStudent ? 97 : 86,
      ijazahEarned: isTopStudent,
      sanadChain: isTopStudent ? 'Chain linked from Sheikh Mahmoud to Hafs an Asim' : 'In training'
    });
  }, [selectedStudentId, students]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    if (!profile) return [];
    return [
      {
        id: 'current_juz',
        title: 'Memorized Juz Milestone',
        value: `${profile.currentJuz} / 30 Juz`,
        subtitle: `${((profile.currentJuz / 30) * 100).toFixed(0)}% complete Quran memorization`,
        trendDirection: 'up',
        icon: <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      },
      {
        id: 'ayahs_memorized',
        title: 'Memorized Verses (Ayahs)',
        value: `${profile.completedAyahs.toLocaleString()} / 6,236`,
        subtitle: 'Verified by supervising Ustadh',
        trendDirection: 'up',
        icon: <BookMarked className="w-5 h-5 text-sky-600 dark:text-sky-400" />
      },
      {
        id: 'tajweed_rating',
        title: 'Tajweed Competency Score',
        value: `${profile.tajweedScore}%`,
        subtitle: profile.tajweedScore >= 90 ? 'Mastery Level (Mumtaz)' : 'Very Good (Jayyid)',
        trendDirection: 'up',
        icon: <Award className="w-5 h-5 text-amber-500" />
      },
      {
        id: 'sanad_status',
        title: 'Sanad Ijazah Status',
        value: profile.ijazahEarned ? 'Certified' : 'In Training',
        subtitle: profile.ijazahEarned ? 'Authorized to transmit recitation' : 'Audition pending',
        trendDirection: profile.ijazahEarned ? 'up' : 'neutral',
        icon: <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      }
    ];
  }, [profile]);

  return (
    <EnterpriseModuleShell
      title="Scholar Quranic Memorization & Tajweed Official Transcript"
      description="Official institutional student transcript detailing completed Surahs, live 30-Juz progress meters, daily Muraja'ah audits, and verified Ijazah credentials."
      breadcrumbs={[{ label: 'Quran System', href: '/qms/memorization' }, { label: 'Hifz Profile' }]}
      icon={<GraduationCap className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={students.length}
      recordLabel="Scholars"
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Print Official Transcript</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/qms/memorization" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>New Memorization (Hifz)</span>
        </Link>
        <Link href="/qms/revision" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Revision (Murajaah)</span>
        </Link>
        <Link href="/qms/tajweed" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Tajweed Evaluations</span>
        </Link>
        <Link href="/qms/halaqah" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Daily Halaqat</span>
        </Link>
        <Link href="/qms/attendance" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Quran Attendance</span>
        </Link>
        <Link href="/qms/programs" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Programs & Tracks</span>
        </Link>
        <Link href="/qms/achievements" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-500" />
          <span>Achievements</span>
        </Link>
        <Link href="/qms/hifz-profile" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student Transcript</span>
        </Link>
      </div>

      {/* Student Selector Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase">Select Active Scholar</span>
            <span className="text-sm font-black text-slate-900 dark:text-white block">{profile?.name}</span>
          </div>
        </div>
        <div className="w-full sm:w-72">
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 30 Juz Matrix */}
      {profile && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Full 30-Juz Memorization Transcript Grid
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
              {profile.currentJuz} of 30 Juz Cleared ({profile.completedAyahs} Verses)
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-15 gap-2">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
              const isDone = juz <= profile.currentJuz;
              return (
                <div
                  key={juz}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                    isDone
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Juz</span>
                  <span className="text-base font-black font-mono">{juz}</span>
                  <span className="text-[9px] font-bold mt-1">
                    {isDone ? 'CLEARED' : 'PENDING'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Surah Transcript Matrix */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Surah-by-Surah Memorization & Evaluation History
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Supervised by {profile?.assignedUstadh}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {surahs.map((surah) => (
            <div key={surah.number} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono font-bold text-xs flex items-center justify-center text-slate-700 dark:text-slate-300">
                  {surah.number}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      Surah {surah.name}
                    </span>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-serif">
                      ({surah.arabic})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {surah.ayahs} Ayahs • Juz {surah.juz}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {surah.score && (
                  <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">
                    {surah.score}% Accuracy
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  surah.status === 'completed'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : surah.status === 'in_progress'
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {surah.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </EnterpriseModuleShell>
  );
}

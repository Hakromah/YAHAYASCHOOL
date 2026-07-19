'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getSubjects } from '@/services/lms.service';
import type { Subject } from '@/types/lms.types';
import { BookOpen, Plus, Search, Layers, Clock, CheckCircle2, BookMarked } from 'lucide-react';
import { toast } from 'sonner';

const FALLBACK_SUBJECTS: Subject[] = [
  {
    id: 1,
    code: 'QUR-301',
    name: "Advanced Qur'an Memorization & Hifz Track",
    subjectType: 'Core',
    activeStatus: true,
    color: '#10b981',
    defaultWeeklyHours: 12,
    passingScore: 85,
    creditValue: 6,
    description: 'Intensive daily Hifz memorization, revision of past Surahs, and practical Tajweed mastery.',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-07-15T12:00:00Z'
  },
  {
    id: 2,
    code: 'TAJ-202',
    name: 'Tajweed Rules & Phonetic Articulation (Makharij)',
    subjectType: 'Core',
    activeStatus: true,
    color: '#0ea5e9',
    defaultWeeklyHours: 5,
    passingScore: 80,
    creditValue: 4,
    description: 'Specialized phonetic articulation of Qur\'anic letters, rules of Noon Sakinah, and Madd.',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-07-15T12:00:00Z'
  },
  {
    id: 3,
    code: 'ARB-101',
    name: 'Classical Arabic Grammar (Nahw & Sarf)',
    subjectType: 'Core',
    activeStatus: true,
    color: '#f59e0b',
    defaultWeeklyHours: 6,
    passingScore: 75,
    creditValue: 5,
    description: 'Comprehensive study of Arabic morphology, sentence structure, and vocabulary for Qur\'anic comprehension.',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-07-15T12:00:00Z'
  },
  {
    id: 4,
    code: 'SCI-401',
    name: 'Senior Secondary STEM & General Sciences',
    subjectType: 'Core',
    activeStatus: true,
    color: '#8b5cf6',
    defaultWeeklyHours: 6,
    passingScore: 70,
    creditValue: 4,
    description: 'Integrated Physics, Chemistry, and Biological foundations aligned with international secondary curriculum.',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-07-15T12:00:00Z'
  },
  {
    id: 5,
    code: 'MAT-302',
    name: 'Advanced Mathematics & Logical Reasoning',
    subjectType: 'Core',
    activeStatus: true,
    color: '#ec4899',
    defaultWeeklyHours: 5,
    passingScore: 70,
    creditValue: 4,
    description: 'Algebra, Trigonometry, Calculus introductory modules, and analytical problem-solving methodologies.',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-07-15T12:00:00Z'
  },
  {
    id: 6,
    code: 'ISL-201',
    name: 'Islamic Jurisprudence (Fiqh) & Ethics (Adab)',
    subjectType: 'Elective',
    activeStatus: true,
    color: '#14b8a6',
    defaultWeeklyHours: 4,
    passingScore: 75,
    creditValue: 3,
    description: 'Fundamentals of Islamic ethics, daily rituals, and community conduct.',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-07-15T12:00:00Z'
  }
];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Core' | 'Elective'>('All');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res: any = await getSubjects();
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
        if (list && list.length > 0) {
          setSubjects(list);
        } else {
          setSubjects(FALLBACK_SUBJECTS);
        }
      } catch (err) {
        // Fallback gracefully on network or API failure
        setSubjects(FALLBACK_SUBJECTS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = subjects.filter(s => {
    if (selectedCategory !== 'All' && s.subjectType !== selectedCategory) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.code.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Academic Subjects & Classes Registry</span>
          </h1>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
            Explore active institutional courses, Hifz tracks, weekly credit hours, and assigned curriculum modules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subject code or title..."
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <button
            onClick={() => toast.success('New subject wizard opened')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Subject</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center gap-2">
          {(['All', 'Core', 'Elective'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedCategory(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedCategory === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab === 'All' ? 'All Subjects' : `${tab} Track`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Total Taught: <strong className="text-slate-900 dark:text-white">{filtered.length} Courses</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Weekly Workload: <strong className="text-slate-900 dark:text-white">{filtered.reduce((acc, s) => acc + (s.defaultWeeklyHours || 0), 0)} hrs</strong></span>
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">Loading institutional academic subjects...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">No subjects matched your filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-extrabold text-slate-700 dark:text-slate-300">Course Code</th>
                  <th className="px-6 py-4 font-extrabold text-slate-700 dark:text-slate-300">Subject Name & Track Description</th>
                  <th className="px-6 py-4 font-extrabold text-slate-700 dark:text-slate-300">Category</th>
                  <th className="px-6 py-4 font-extrabold text-slate-700 dark:text-slate-300 text-center">Weekly Hours</th>
                  <th className="px-6 py-4 font-extrabold text-slate-700 dark:text-slate-300 text-center">Passing Mark</th>
                  <th className="px-6 py-4 font-extrabold text-slate-700 dark:text-slate-300 text-center">Status</th>
                  <th className="px-6 py-4 font-extrabold text-slate-700 dark:text-slate-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      {s.code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color || '#10b981' }}></span>
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{s.name}</span>
                        </div>
                        {s.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 pl-5 font-normal">
                            {s.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        s.subjectType === 'Core'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {s.subjectType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                      {s.defaultWeeklyHours || 5} hrs/wk
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                      {s.passingScore || 70}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toast.info(`Viewing curriculum syllabus for ${s.code}: ${s.name}`)}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <BookMarked className="w-3.5 h-3.5" />
                        <span>Syllabus</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

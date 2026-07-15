'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import type { ProgramsGridSectionComponent, ProgramEntity } from '../../../types/cms.types';
import { cmsService } from '../../../services/cms.service';

interface ProgramsGridProps {
  data?: ProgramsGridSectionComponent;
  initialPrograms?: ProgramEntity[];
  locale?: string;
}

const FALLBACK_PROGRAMS: ProgramEntity[] = [
  {
    id: 1,
    title: 'Tahfidz Al-Qur\'an & Tajweed Mastery',
    slug: 'quran-memorization',
    description: 'A dedicated, structured 3-year memorization track guiding students to memorize the entire Holy Qur\'an with flawless Tajweed alongside standard high school coursework.',
    duration: '3 Academic Years',
    isFeatured: true,
  },
  {
    id: 2,
    title: 'Advanced Arabic Immersion Track',
    slug: 'arabic-immersion',
    description: 'Immersive Classical and Modern Standard Arabic curriculum designed to foster fluency, classical text analysis, and eloquence in speech.',
    duration: 'Full High School Track',
    isFeatured: true,
  },
  {
    id: 3,
    title: 'STEM & Robotics Honors Track',
    slug: 'stem-robotics',
    description: 'Rigorous Western science preparation in Physics, Chemistry, Biology, and Advanced Computing, preparing graduates for top global engineering and medical universities.',
    duration: '4 Academic Years',
    isFeatured: true,
  },
];

export function ProgramsGridSection({ data, initialPrograms, locale = 'en' }: ProgramsGridProps) {
  const [programs, setPrograms] = useState<ProgramEntity[]>(initialPrograms || FALLBACK_PROGRAMS);
  const [loading, setLoading] = useState(false);

  const title = data?.title || 'Our Academic Programs';
  const subtitle = data?.subtitle || 'Excellence harmonized across Islamic Sciences and rigorous Western Disciplines';
  const limit = data?.limit || 6;
  const showFeaturedOnly = data?.showFeaturedOnly ?? false;

  useEffect(() => {
    if (initialPrograms && initialPrograms.length > 0) return;
    setLoading(true);
    cmsService.getPrograms(locale, showFeaturedOnly, limit).then((fetched) => {
      if (fetched && fetched.length > 0) {
        setPrograms(fetched);
      }
      setLoading(false);
    });
  }, [locale, showFeaturedOnly, limit, initialPrograms]);

  const getHref = (slug: string) => {
    return locale === 'en' ? `/programs/${slug}` : `/${locale}/programs/${slug}`;
  };

  return (
    <section className="bg-white py-20 sm:py-28 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 mb-3">
              Curriculum Tracks
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
              {title}
            </h2>
            <p className="text-gray-600 text-base sm:text-lg mt-2 max-w-2xl">
              {subtitle}
            </p>
          </div>

          <Link
            href={locale === 'en' ? '/programs' : `/${locale}/programs`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-emerald-900 text-white hover:bg-emerald-800 shadow-md transition-all self-start md:self-auto shrink-0"
          >
            <span>View All Programs</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-gray-100 h-80 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((prog, idx) => (
              <div
                key={idx}
                className="bg-gray-50 hover:bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-amber-400 flex items-center justify-center font-bold shadow-md">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    {prog.duration && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-semibold text-emerald-900 border border-gray-200">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{prog.duration}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-emerald-950 mb-3 group-hover:text-emerald-800 transition-colors">
                    {prog.title}
                  </h3>

                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-3 mb-6">
                    {prog.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-200/60 flex items-center justify-between">
                  <Link
                    href={getHref(prog.slug)}
                    className="inline-flex items-center gap-2 font-bold text-sm text-emerald-900 group-hover:text-amber-600 transition-colors"
                  >
                    <span>Program Syllabus</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>

                  <Link
                    href={locale === 'en' ? '/online-registration' : `/${locale}/online-registration`}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-400/20 text-amber-800 hover:bg-amber-400 hover:text-emerald-950 transition-colors"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

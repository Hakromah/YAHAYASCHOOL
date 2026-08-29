'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Library, PlayCircle, Video } from 'lucide-react';
import { LeafImage } from '@/components/public/shared/LeafImage';
import { EnrollmentModal } from '@/components/public/online/EnrollmentModal';
import { useTranslations } from 'next-intl';

/**
 * Online learning page. Implemented from Figma node 384-3364 (frame 1920x3459).
 *
 * The hero reuses the leaf mask from the academic page. Every "Join Enrollment"
 * button opens the two-tab modal drawn in the popup frames.
 */

const FEATURES = [
  {
    icon: PlayCircle, title: 'Recorded Lessons', cta: 'Browse Library',
    desc: 'A comprehensive library of high-definition video lectures across all academic and Islamic subjects.'
  },
  {
    icon: Library, title: 'Digital Library', cta: 'Enter Library',
    desc: 'Access curated PDF books, Qur’an resources, and exclusive scholarly articles.'
  },
  {
    icon: Video, title: 'Live Classes', cta: 'View Schedule',
    desc: 'Engage in real-time interactive sessions with our global expert faculty members.'
  },
];

const COURSES = [
  {
    title: 'Advanced Arabic Grammar', tag: 'Languages • Advanced', badge: 'New Release',
    image: '/images/figma-home/13.png', alt: 'A Qur’an resting on a stand',
    desc: 'An intensive study into classical Nahw and Sarf for profound textual understanding.'
  },
  {
    title: 'Tajweed Foundations', tag: 'Qur’an • Beginner', badge: 'New Release',
    image: '/images/figma-home/17.png', alt: 'Group study in the library',
    desc: 'Articulation and rhythm taught from first principles, corrected one to one.'
  },
  {
    title: 'Islamic History', tag: 'Humanities • Intermediate', badge: 'New Release',
    image: '/images/figma-home/07-activity.png', alt: 'Students outside the school building',
    desc: 'The major periods and figures, read through primary sources rather than summaries.'
  },
  {
    title: 'English for Academic Study', tag: 'Languages • Intermediate', badge: 'New Release',
    image: '/images/figma-home/09.png', alt: 'A lesson in progress',
    desc: 'Speaking, writing, and listening built around the demands of academic work.'
  },
  {
    title: 'Qur’anic Arabic', tag: 'Qur’an • Intermediate', badge: 'New Release',
    image: '/images/figma-home/19.png', alt: 'Students walking on campus',
    desc: 'Vocabulary and syntax drawn directly from the text, taught verse by verse.'
  },
  {
    title: 'Fiqh Essentials', tag: 'Islamic Studies • Beginner', badge: 'New Release',
    image: '/images/figma-home/03-programs.jpeg', alt: 'The main campus building',
    desc: 'Practical jurisprudence for daily life, with evidence given for every ruling.'
  },
];

export function OnlineLearning({ locale = 'en' }: { locale?: string }) {
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const t = useTranslations('onlineLearningPage');
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  const joinBtn =
    'inline-flex h-[clamp(2.25rem,2.4vw,2.875rem)] items-center gap-2 rounded-full bg-[#048ED6] px-[clamp(0.875rem,1.15vw,1.375rem)] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.625rem,0.68vw,0.8125rem)]';

  return (
    <>
      {/* Hero */}
      <section className="w-full bg-[#FAFAFA]">
        <div className="mx-auto grid max-w-[1920px] grid-cols-1 items-center md:gap-[clamp(2rem,3vw,3.5rem)] px-(--spacing-side) lg:grid-cols-[minmax(0,932fr)_minmax(0,704fr)]">
          <div className="min-w-0 py-[clamp(1.5rem,3.6vw,4.4rem)]">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[#6F757D] text-[clamp(0.75rem,0.68vw,0.8125rem)]">
              <Link href={href('/')} className="transition-colors hover:text-[#048ED6]">{t('breadcrumbHome')}</Link>
              <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
              <span className="text-[#048ED6]">{t('breadcrumbOnline')}</span>
            </nav>

            <p className="mt-[clamp(1.5rem,2.6vw,3.1rem)] font-semibold uppercase tracking-[0.18em] text-[#048ED6] text-[1rem]">
              {t('tagline')}
            </p>

            <h1 className="mt-[clamp(0.75rem,1.35vw,1.625rem)] font-serif leading-[1.11] text-[clamp(1.75rem,2.81vw,3.375rem)]">
              <span className="block text-[#121C2A]">{t('headline_1')}</span>
              <span className="block text-[#048ED6]">{t('headline_2')}</span>
            </h1>

            <p className="mt-[clamp(1rem,1.5vw,1.75rem)] max-w-[24rem] leading-[1.6] text-[#5A636D] text-[1rem]">
              {t('lede')}
            </p>

            <div className="relative inline-flex mt-[clamp(1.5rem,2.4vw,2.9rem)] group">
              <a href="#" target="_blank" rel="noopener noreferrer" className={`${joinBtn} !mt-0 relative z-10 shadow-lg hover:shadow-[#048ED6]/40 hover:-translate-y-0.5 transition-all duration-300`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span>{t('liveLesson')}</span>
                <ArrowRight className="h-3 w-3 rtl:-scale-x-100 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          <div className="w-full max-lg:hidden  mt-[-10px] h-[calc(100%+10px)]">
            <LeafImage src="/images/figma-home/09.png" alt="Students working together in class" />
          </div>
          <div className="w-full lg:hidden">
            <img src="/images/figma-home/09.png" alt="Students working together in class" className="aspect-[704/532] w-full rounded-lg object-cover" />
          </div>
        </div>
      </section>

      {/* Course catalogue */}
      <section className="w-full bg-white  pt-[clamp(2rem,3.1vw,3.75rem)]">
        <div className="mx-auto max-w-[1920px] px-(--spacing-side) pb-[clamp(2.5rem,4vw,4.8rem)]">
          <div className="grid grid-cols-1 gap-[clamp(1rem,2.1vw,2.5rem)] lg:grid-cols-2">
            {COURSES.map((c, idx) => (
              <article onClick={() => { setSelectedCourse(c.title); setEnrollOpen(true); }} key={idx} className="cursor-pointer group grid grid-cols-[minmax(0,240fr)_minmax(0,560fr)] overflow-hidden rounded-lg border border-[#EDEFF2] bg-white shadow-sm max-sm:grid-cols-1">
             <div className='h-full w-full overflow-hidden'>
                 <img src={c.image} alt={c.alt} className="h-full w-full object-cover max-sm:aspect-[16/10] lg:group-hover:scale-105 transition-transform duration-300" />
             </div>

                <div className="flex flex-col p-[clamp(1rem,1.35vw,1.625rem)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold uppercase tracking-[0.1em] text-[#048ED6] text-[clamp(0.5625rem,0.57vw,0.6875rem)]">
                      {t(`coursesList.${idx}.tag`)}
                    </span>
                    <span className="shrink-0 rounded bg-[#E1EFF6] px-2 py-1 font-semibold uppercase tracking-[0.08em] text-[#048ED6] text-[clamp(0.5rem,0.52vw,0.625rem)]">
                      {t(`coursesList.${idx}.badge`)}
                    </span>
                  </div>

                  <div className="mt-3 mb-2">
                    <h2 className="mt-[clamp(0.375rem,0.52vw,0.625rem)] font-serif text-[#121C2A] text-[clamp(1rem,1.15vw,1.375rem)]">
                      {t(`coursesList.${idx}.title`)}
                    </h2>
                    <p className="mt-2 leading-[1.6] text-[#5A636D] text-[1rem]">{t(`coursesList.${idx}.desc`)}</p>
                  </div>

                  <button type="button" className={`${joinBtn} mt-auto self-end cursor-pointer mt-3`}>
                    {t('joinEnrollment')}
                    <ArrowRight className="h-3 w-3 rtl:-scale-x-100" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <EnrollmentModal open={enrollOpen} onClose={() => setEnrollOpen(false)} selectedCourse={selectedCourse} />
    </>
  );
}

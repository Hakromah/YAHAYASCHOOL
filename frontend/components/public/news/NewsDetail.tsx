import React from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { NewsletterCard } from '@/components/public/news/NewsletterCard';
import { ParallaxImage } from '@/components/public/shared/ParallaxImage';
import type { ArticleEntity } from '@/types/cms.types';

/**
 * News article. Implemented from Figma node 384-4389 (frame 1920x3799).
 *
 * Measured off the export:
 *   hero photo      full-bleed, y 99->1079 (981 tall), overlay inset at x142
 *   headline        two lines, 29 cap / 60 pitch  ->  ~40px, leading 1.5
 *   next-event card 352 x 247 at x1443, brand blue
 *   content         x 249->1668 (1420 wide)
 *   text column     758 wide · sidebar 412 at x1254 · 248 between them
 *   in-article photo breaks both columns: 1418 x 685 (~2.07)
 *   sidebar card    #F2F9FD, 422 tall; newsletter card below it at y1611
 */

const BODY_MAX = 'max-w-[47.375rem]'; // 758px — the design's text measure

export function NewsArticleHero({
  article,
}: {
  article: ArticleEntity;
}) {
  const locale = useLocale();
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);
  const t = useTranslations('newsDetailPage');
  const tFeatured = useTranslations('newsPage.featured');
  const tArticles = useTranslations('newsPage.articles');

  const localizedTitle = article.title;
  let localizedDate = new Date(article.publishedAt || Date.now()).toLocaleDateString(locale);

  let nextEventDay = tFeatured('0.day');
  let nextEventTime = tFeatured('0.time');

  if (locale === 'ar') {
    localizedDate = localizedDate.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);
    nextEventDay = nextEventDay.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);
    nextEventTime = nextEventTime.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d, 10)]);
  }

  return (
    <section className="relative w-full">
      <div className="nd-hero relative w-full overflow-hidden bg-[#121C2A]">
        <img src={article.coverImage?.url || '/images/figma-home/13.png'} alt={article.title || ''} className="h-full w-full object-cover" />
        {/* The overlay copy sits on photography, so it needs its own contrast
            rather than relying on whatever the image happens to be. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-[1920px] flex-wrap items-end justify-between gap-8 px-(--spacing-side)  pb-[clamp(1.5rem,3.1vw,3.75rem)]">
            <div className="min-w-0">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-white/70 text-[clamp(0.6875rem,0.68vw,0.8125rem)]">
                <Link href={href('/')} className="transition-colors hover:text-white">{t('breadcrumbHome')}</Link>
                <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
                <Link href={href('/news')} className="transition-colors hover:text-white">{t('breadcrumbNews')}</Link>
                <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
                <span className="text-white">{t('breadcrumbDetails')}</span>
              </nav>

              <p className="mt-[clamp(0.75rem,1vw,1.25rem)] flex items-center gap-2 uppercase tracking-[0.14em] text-white/85 text-[1rem]">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {localizedDate}
              </p>

              <h1 className="mt-[clamp(0.5rem,0.9vw,1.1rem)] max-w-[46rem] font-serif leading-[1.5] text-white text-[clamp(1.5rem,2.08vw,2.5rem)]">
                {localizedTitle}
              </h1>
            </div>

            {/* Next-event card: 352 x 247 in the design */}
            <aside className="w-[clamp(16rem,18.33vw,22rem)] shrink-0 rounded-xl bg-[#048ED6] p-[clamp(1rem,1.15vw,1.375rem)] text-white shadow-xl max-md:hidden">
              <p className="font-serif text-[clamp(1rem,1.04vw,1.25rem)]">{t('nextEvent')}</p>

              <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/15 p-3">
                <span className="shrink-0 rounded-md bg-white px-2.5 py-1.5 text-center">
                  <span className="block font-semibold uppercase leading-none text-[#6F757D] text-[0.5625rem]">{tFeatured('0.month')}</span>
                  <span className="mt-0.5 block font-serif leading-none text-[#048ED6] text-[1.125rem]">{nextEventDay}</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-[clamp(0.75rem,0.78vw,0.9375rem)]">{tFeatured('0.title')}</span>
                  <span className="mt-0.5 block text-white/80 text-[clamp(0.625rem,0.63vw,0.75rem)]">{nextEventTime}</span>
                </span>
              </div>

              <Link
                href={href('/contact')}
                className="mt-3 flex h-[clamp(2.25rem,2.19vw,2.625rem)] items-center justify-center gap-2 rounded-full bg-white font-semibold text-[#048ED6] transition-opacity hover:opacity-90 text-[clamp(0.6875rem,0.68vw,0.8125rem)]"
              >
                {t('applyNow')} <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
              </Link>
            </aside>
          </div>
        </div>
      </div>

      <style>{`
        /* 981 of 1920 == 51.1vw, floored so it stays a hero on phones */
        .nd-hero { height: clamp(22rem, 51.1vw, 55.3125rem); }
      `}</style>
    </section>
  );
}

export function NewsArticleBody({ locale = 'en', article }: { locale?: string; article: ArticleEntity }) {
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);
  const t = useTranslations('newsDetailPage');

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1920px] px-(--spacing-side) py-[clamp(2.5rem,4.7vw,5.6rem)]">
        {/* 1420 is the design's content width; centred so the measure stays
            readable on wider screens. */}
        <div className="mx-auto max-w-[88.75rem]">
          <div className="grid grid-cols-1 gap-[clamp(2rem,12.9vw,15.5rem)] lg:grid-cols-[minmax(0,758fr)_minmax(0,412fr)]">
            <div className={`${BODY_MAX} text-[#5A636D] text-[clamp(0.8125rem,0.83vw,1rem)] leading-[1.75]`}>
              {article.content ? (
                <div className="prose prose-blue max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
              ) : (
                <p>No content available.</p>
              )}
            </div>

            {/* Sidebar — 412 wide in the design */}
            <aside className="space-y-[clamp(1rem,1.25vw,1.5rem)] lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl bg-[#F2F9FD] p-[clamp(1.5rem,2vw,2.4rem)] text-center">
                <h2 className="font-serif italic leading-tight text-[#0B3B57] text-[clamp(1.0625rem,1.25vw,1.5rem)]" dangerouslySetInnerHTML={{ __html: t('sidebarTitle') }} />
                <p className="mt-[clamp(0.75rem,1vw,1.25rem)] leading-[1.7] text-[#5A636D] text-[1rem]">
                  {t('sidebarDesc')}
                </p>
                <div className="mt-[clamp(1.25rem,1.6vw,1.9rem)] flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={href('/career')}
                    className="inline-flex h-[clamp(2.25rem,2.19vw,2.625rem)] items-center rounded-full bg-[#048ED6] px-[clamp(1rem,1.15vw,1.375rem)] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.6875rem,0.68vw,0.8125rem)]"
                  >
                    {t('joinSchool')}
                  </Link>
                  <Link
                    href={href('/news')}
                    className="inline-flex h-[clamp(2.25rem,2.19vw,2.625rem)] items-center rounded-full bg-[#048ED6] px-[clamp(1rem,1.15vw,1.375rem)] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.6875rem,0.68vw,0.8125rem)]"
                  >
                    {t('returnNews')}
                  </Link>
                </div>
              </div>

              <NewsletterCard />
            </aside>
          </div>

          {/* Breaks both columns, as in the design: 1418 x 685. The image is
              20% taller than the frame and drifts against the scroll. */}
          <figure className="mt-[clamp(2rem,3.1vw,3.75rem)]">
            <ParallaxImage
              src="/images/figma-home/17.png"
              alt="Students presenting their projects at the fair"
              ratio="1418/685"
              className="w-full rounded-lg"
            />
          </figure>

          <div className={`${BODY_MAX} mt-[clamp(1.5rem,2.1vw,2.5rem)] text-[#5A636D] text-[clamp(0.8125rem,0.83vw,1rem)] leading-[1.75]`}>
            <p>
              {t('body.p4')}
            </p>

            <hr className="mt-[clamp(1.5rem,2.1vw,2.5rem)] border-t border-[#E5E7EB]" />

            <ul className="mt-[clamp(1rem,1.35vw,1.625rem)] flex flex-wrap gap-2">
              {[0, 1, 2, 3].map((idx) => (
                <li
                  key={idx}
                  className="rounded bg-[#F1F2F4] px-3 py-1.5 text-[#5A636D] text-[clamp(0.625rem,0.63vw,0.75rem)]"
                >
                  {t(`body.tags.${idx}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

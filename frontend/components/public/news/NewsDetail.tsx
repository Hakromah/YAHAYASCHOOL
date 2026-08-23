import React from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight } from 'lucide-react';
import { NewsletterCard } from '@/components/public/news/NewsletterCard';
import { ParallaxImage } from '@/components/public/shared/ParallaxImage';
import type { Article } from '@/components/public/news/articles';

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
  locale = 'en',
}: {
  article: Article;
  locale?: string;
}) {
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  return (
    <section className="relative w-full">
      <div className="nd-hero relative w-full overflow-hidden bg-[#121C2A]">
        <img src={article.image} alt={article.alt} className="h-full w-full object-cover" />
        {/* The overlay copy sits on photography, so it needs its own contrast
            rather than relying on whatever the image happens to be. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-[1920px] flex-wrap items-end justify-between gap-8 px-(--spacing-side)  pb-[clamp(1.5rem,3.1vw,3.75rem)]">
            <div className="min-w-0">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-white/70 text-[clamp(0.6875rem,0.68vw,0.8125rem)]">
                <Link href={href('/')} className="transition-colors hover:text-white">Home</Link>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                <Link href={href('/news')} className="transition-colors hover:text-white">News</Link>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                <span className="text-white">News-details</span>
              </nav>

              <p className="mt-[clamp(0.75rem,1vw,1.25rem)] flex items-center gap-2 uppercase tracking-[0.14em] text-white/85 text-[1rem]">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {article.date}
              </p>

              <h1 className="mt-[clamp(0.5rem,0.9vw,1.1rem)] max-w-[46rem] font-serif leading-[1.5] text-white text-[clamp(1.5rem,2.08vw,2.5rem)]">
                {article.title}: Pioneering Sustainable Innovations
              </h1>
            </div>

            {/* Next-event card: 352 x 247 in the design */}
            <aside className="w-[clamp(16rem,18.33vw,22rem)] shrink-0 rounded-xl bg-[#048ED6] p-[clamp(1rem,1.15vw,1.375rem)] text-white shadow-xl max-md:hidden">
              <p className="font-serif text-[clamp(1rem,1.04vw,1.25rem)]">Next Event</p>

              <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/15 p-3">
                <span className="shrink-0 rounded-md bg-white px-2.5 py-1.5 text-center">
                  <span className="block font-semibold uppercase leading-none text-[#6F757D] text-[0.5625rem]">Jul</span>
                  <span className="mt-0.5 block font-serif leading-none text-[#048ED6] text-[1.125rem]">15</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-[clamp(0.75rem,0.78vw,0.9375rem)]">Graduation Ceremony</span>
                  <span className="mt-0.5 block text-white/80 text-[clamp(0.625rem,0.63vw,0.75rem)]">10:00 AM - 1:00 PM</span>
                </span>
              </div>

              <Link
                href={href('/contact')}
                className="mt-3 flex h-[clamp(2.25rem,2.19vw,2.625rem)] items-center justify-center gap-2 rounded-full bg-white font-semibold text-[#048ED6] transition-opacity hover:opacity-90 text-[clamp(0.6875rem,0.68vw,0.8125rem)]"
              >
                Apply Now <ArrowRight className="h-3.5 w-3.5" />
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

export function NewsArticleBody({ locale = 'en' }: { locale?: string }) {
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1920px] px-(--spacing-side) py-[clamp(2.5rem,4.7vw,5.6rem)]">
        {/* 1420 is the design's content width; centred so the measure stays
            readable on wider screens. */}
        <div className="mx-auto max-w-[88.75rem]">
          <div className="grid grid-cols-1 gap-[clamp(2rem,12.9vw,15.5rem)] lg:grid-cols-[minmax(0,758fr)_minmax(0,412fr)]">
            <div className={`${BODY_MAX} text-[#5A636D] text-[clamp(0.8125rem,0.83vw,1rem)] leading-[1.75]`}>
              <p>
                The atmosphere at Yahaya International was electric this past week as students from
                all grades showcased their ingenuity during the 15th Annual Science &amp; Technology
                Fair.
              </p>
              <p className="mt-[1.25em]">
                This year&apos;s theme, &ldquo;Sustainability Through Innovation,&rdquo; challenged
                our young minds to create solutions for real-world environmental issues.
              </p>

              <h2 className="mt-[clamp(1.75rem,2.4vw,2.9rem)] font-serif text-[#048ED6] text-[clamp(1.125rem,1.35vw,1.625rem)]">
                Bridging Tradition with Modernity
              </h2>
              <p className="mt-[1em]">
                From solar-powered water filtration systems to AI-driven waste sorting algorithms,
                the projects displayed a deep understanding of complex scientific principles.
                &ldquo;Our goal is not just to teach science, but to cultivate a mindset of ethical
                problem-solving,&rdquo; noted Principal Ahmed during his opening address.
              </p>

              <blockquote className="mt-[clamp(1.5rem,2.1vw,2.5rem)] border-l-[3px] border-[#048ED6] bg-[#F5F6F7] px-[clamp(1rem,1.35vw,1.625rem)] py-[clamp(1rem,1.25vw,1.5rem)] italic text-[#048ED6]">
                &ldquo;Science without conscience is but the ruin of the soul. At Yahaya, we ensure
                our students understand that every technological advancement must serve humanity and
                preserve our planet.&rdquo;
              </blockquote>

              <h2 className="mt-[clamp(1.75rem,2.4vw,2.9rem)] font-serif text-[#048ED6] text-[clamp(1.125rem,1.35vw,1.625rem)]">
                Key Highlights of the Fair
              </h2>
              <ul className="mt-[clamp(1rem,1.35vw,1.625rem)] space-y-[clamp(0.75rem,1vw,1.25rem)]">
                {[
                  ['The Smart Irrigation Project:', 'Grade 11 students developed a sensor-based system that reduces campus water usage by 40%.'],
                  ['Renewable Energy Models:', 'A competitive category featuring experimental designs for vertical-axis wind turbines.'],
                  ['Inter-School Robotics Challenge:', 'Yahaya students secured the first position against six regional competitors.'],
                ].map(([lead, rest]) => (
                  <li key={lead} className="flex gap-3">
                    <CheckCircle2 className="mt-[0.15em] h-4 w-4 shrink-0 text-[#048ED6]" aria-hidden />
                    <span>
                      <strong className="font-semibold text-[#121C2A]">{lead}</strong> {rest}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sidebar — 412 wide in the design */}
            <aside className="space-y-[clamp(1rem,1.25vw,1.5rem)] lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl bg-[#F2F9FD] p-[clamp(1.5rem,2vw,2.4rem)] text-center">
                <h2 className="font-serif italic leading-tight text-[#0B3B57] text-[clamp(1.0625rem,1.25vw,1.5rem)]">
                  In Pursuit of
                  <br />
                  Exceptional Education
                </h2>
                <p className="mt-[clamp(0.75rem,1vw,1.25rem)] leading-[1.7] text-[#5A636D] text-[1rem]">
                  Our faculty recruitment follows a rigorous selection process, ensuring every
                  teacher embodies our values of excellence, integrity, and lifelong learning.
                </p>
                <div className="mt-[clamp(1.25rem,1.6vw,1.9rem)] flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={href('/career')}
                    className="inline-flex h-[clamp(2.25rem,2.19vw,2.625rem)] items-center rounded-full bg-[#048ED6] px-[clamp(1rem,1.15vw,1.375rem)] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.6875rem,0.68vw,0.8125rem)]"
                  >
                    Join Our School
                  </Link>
                  <Link
                    href={href('/news')}
                    className="inline-flex h-[clamp(2.25rem,2.19vw,2.625rem)] items-center rounded-full bg-[#048ED6] px-[clamp(1rem,1.15vw,1.375rem)] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.6875rem,0.68vw,0.8125rem)]"
                  >
                    Return to the News
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
              As we look forward to the next semester, the school plans to integrate the winning
              water filtration project into our standard facilities, providing a tangible legacy for
              this year&apos;s participants. We congratulate all students for their hard work and
              dedication to excellence.
            </p>

            <hr className="mt-[clamp(1.5rem,2.1vw,2.5rem)] border-t border-[#E5E7EB]" />

            <ul className="mt-[clamp(1rem,1.35vw,1.625rem)] flex flex-wrap gap-2">
              {['#ScienceFair2024', '#StudentExcellence', '#Innovation', '#YahayaInternatonal'].map((tag) => (
                <li
                  key={tag}
                  className="rounded bg-[#F1F2F4] px-3 py-1.5 text-[#5A636D] text-[clamp(0.625rem,0.63vw,0.75rem)]"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

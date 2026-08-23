import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, Download } from 'lucide-react';
import type { Program } from '@/components/public/academic/programs';

/**
 * Programme detail page. Implemented from Figma node 384-3088 (frame 1920x3262).
 *
 * Measured off the export:
 *   hero band   #FAFAFA, y 99->1006 (908 tall), text column at x142
 *   chip        30 tall, #E1EFF6 with brand-blue label
 *   headline    two lines, 48 pitch — line 1 dark, line 2 blue
 *   buttons     row 64 tall: filled #048ED6, then an outlined one
 *   hero image  x960->1779 (820 x 605) — a plain rounded panel, no mask here
 *   pathway     content x384->1538, text column left, 3-image collage right
 *
 * The approach panel below is the same component the listing page uses.
 */

export function ProgramHero({ program, locale = 'en' }: { program: Program; locale?: string }) {
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  return (
    <section className="w-full bg-[#FAFAFA]">
      <div className="mx-auto grid max-w-[1920px] grid-cols-1 items-center gap-[clamp(2rem,3vw,3.5rem)] px-(--spacing-side) py-[clamp(2.5rem,4.7vw,5.6rem)] lg:grid-cols-[minmax(0,818fr)_minmax(0,820fr)]">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[#6F757D] text-[clamp(0.75rem,0.68vw,0.8125rem)]">
            <Link href={href('/')} className="transition-colors hover:text-[#048ED6]">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <Link href={href('/programs')} className="text-[#048ED6] transition-opacity hover:opacity-80">Academics</Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <span className="text-[#048ED6]">Academics-details</span>
          </nav>

          {/* 30 tall in the design */}
          <span className="mt-[clamp(1.75rem,3.4vw,4.1rem)] inline-flex h-[clamp(1.5rem,1.56vw,1.875rem)] items-center gap-2 rounded-full bg-[#E1EFF6] px-3 font-semibold uppercase tracking-[0.14em] text-[#048ED6] text-[clamp(0.5625rem,0.57vw,0.6875rem)]">
            <BookOpen className="h-3 w-3" aria-hidden />
            {program.eyebrow}
          </span>

          <h1 className="mt-[clamp(0.75rem,1.15vw,1.375rem)] font-serif leading-[1.09] max-sm:leading-tight text-[clamp(1.5rem,2.29vw,2.75rem)]">
            <span className="block text-[#121C2A]">Knowledge Rooted in Faith.</span>
            <span className="block text-[#048ED6]">Excellence Built for Life.</span>
          </h1>

          <p className="mt-[clamp(1rem,1.5vw,1.75rem)] max-w-[32rem] leading-[1.6] text-[#5A636D] text-[1rem]">
            {program.lede}
          </p>

          <div className="mt-[clamp(1.5rem,2.5vw,3rem)] flex flex-wrap items-center gap-[clamp(0.75rem,1vw,1.25rem)]">
            <Link
              href={href('/contact')}
              className="inline-flex h-[clamp(2.75rem,3.33vw,4rem)] items-center gap-2 rounded-full bg-[#048ED6] px-[clamp(1.25rem,1.77vw,2.125rem)] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.8125rem,0.94vw,1.125rem)]"
            >
              Contact Us
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* No prospectus file exists yet, so this points at contact rather
                than a dead download. */}
            <Link
              href={href('/contact')}
              className="inline-flex h-[clamp(2.75rem,3.33vw,4rem)] items-center gap-2 rounded-full border border-[#048ED6] bg-white px-[clamp(1.25rem,1.77vw,2.125rem)] font-semibold text-[#048ED6] transition-colors hover:bg-[#EAF5FD] text-[clamp(0.8125rem,0.94vw,1.125rem)]"
            >
              Download Pdf
              <Download className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* 820 x 605 — a plain rounded panel; the leaf mask belongs to the
            listing page's hero, not this one. */}
        <div className="w-full">
          <img
            src={program.image}
            alt={program.alt}
            className="aspect-[820/605] w-full rounded-lg object-cover"
          />
        </div>
      </div>
    </section>
  );
}

export function ProgramPathway({ program }: { program: Program }) {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1920px] px-(--spacing-side) py-[clamp(1.5rem,4.7vw,5.6rem)]">
        {/* content spans x384->1538 in the design: 1152 wide, centred */}
        <div className="mx-auto grid max-w-[72rem] grid-cols-1 gap-[clamp(2rem,3.6vw,4.4rem)] lg:grid-cols-2">
          <div className="min-w-0">
            <span className="block h-1 w-[clamp(2rem,2.6vw,3.125rem)] rounded bg-[#048ED6]" />

            <h2 className="mt-[clamp(0.75rem,1.15vw,1.375rem)] font-serif text-[#121C2A] text-[clamp(1.375rem,1.77vw,2.125rem)]">
              {program.pathwayTitle}
            </h2>

            <p className="mt-[clamp(0.75rem,1.15vw,1.375rem)] leading-[1.7] text-[#5A636D] text-[1rem]">
              {program.pathwayLede}
            </p>

            <ul className="mt-[clamp(1.25rem,2.08vw,2.5rem)] space-y-[clamp(1rem,1.35vw,1.625rem)]">
              {program.steps.map((s) => (
                <li key={s.title} className="flex gap-3">
                  <CheckCircle2 className="mt-[0.2em] h-4 w-4 shrink-0 text-[#048ED6]" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-[#121C2A] text-[clamp(0.9375rem,1.04vw,1.25rem)]">
                      {s.title}
                    </span>
                    <span className="mt-1 block leading-[1.6] text-[#5A636D] text-[clamp(0.6875rem,0.73vw,0.875rem)]">
                      {s.desc}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Collage: one tall panel beside two stacked ones */}
          <div className="grid grid-cols-2 gap-[clamp(0.75rem,1.04vw,1.25rem)]">
            <img
              src="/images/figma-home/13.png"
              alt="A student reading in the library"
              className="h-full w-full rounded-lg object-cover"
            />
            <div className="grid grid-rows-2 gap-[clamp(0.75rem,1.04vw,1.25rem)]">
              <img
                src="/images/figma-home/09.png"
                alt="A lesson in progress"
                className="h-full w-full rounded-lg object-cover"
              />
              <img
                src="/images/figma-home/17.png"
                alt="Group study in the library"
                className="h-full w-full rounded-lg object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

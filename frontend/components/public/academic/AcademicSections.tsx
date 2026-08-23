import React from 'react';
import Link from 'next/link';
import { PROGRAMS } from '@/components/public/academic/programs';
import { LeafImage } from '@/components/public/shared/LeafImage';
import { ParallaxImage } from '@/components/public/shared/ParallaxImage';
import {
  ArrowRight, BookOpen, ChevronRight, Compass, Heart, Users, Zap,
} from 'lucide-react';

/**
 * Academic programs page. Implemented from Figma node 384-2793 (frame 1920x3459).
 *
 * Measured off the export:
 *   hero band     #FAFAFA, text column at x142
 *   headline      two lines, 53 tall / 60 pitch — line 2 blue and italic
 *   hero mask     leaf at x1074->1778, y126->658 (704 x 532), #048ED6 outline
 *   cards         793 x 291, image 342 + content 451 on #F2F9FD
 *                 grid x138->1777, 53 between columns, 77 between rows
 *   approach      #EFF4FF panel, 1280 wide, 671 tall, at x320
 *
 * The leaf's left boundary is two arcs meeting at a cusp near y288 — visible
 * as a notch in the export. Traced at 2px intervals and fitted separately
 * either side of that cusp so the corner stays sharp; max deviation 1.9px
 * across the 704px span.
 */

const APPROACH = [
  {
    icon: Zap, title: 'Academic Rigor',
    desc: 'Challenging curriculum and high expectations that inspire deep understanding and excellence in every subject.'
  },
  {
    icon: Heart, title: 'Faith & Character',
    desc: 'Islamic values are woven into daily learning to nurture integrity, compassion, and a sense of purpose.'
  },
  {
    icon: Users, title: 'Mentorship',
    desc: 'Caring teachers guide each student through personalized support and meaningful relationships beyond the textbook.'
  },
  {
    icon: Compass, title: 'Real-World Discovery',
    desc: 'Experiential projects, fieldwork, and technology connect classroom learning to the world around us.'
  },
];

export function AcademicHero({ locale = 'en' }: { locale?: string }) {
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  return (
    <section className="ac relative w-full bg-[#FAFAFA]">
      {/* text 142->1074 (932) and leaf 1074->1778 (704) in the design */}
      <div className="mx-auto grid max-w-[1920px] grid-cols-1 items-center lg:gap-[clamp(2rem,3vw,3.5rem)] px-(--spacing-side)  lg:grid-cols-[minmax(0,932fr)_minmax(0,704fr)]">
        <div className="min-w-0 py-[clamp(1.5rem,3.6vw,4.4rem)]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[#6F757D] text-[clamp(0.75rem,0.68vw,0.8125rem)]">
            <Link href={href('/')} className="transition-colors hover:text-[#048ED6]">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <span className="text-[#048ED6]">Academics</span>
          </nav>

          <p className="mt-[clamp(1.5rem,2.6vw,3.1rem)] font-semibold uppercase tracking-[0.18em] text-[#048ED6] text-[1rem]">
            Learning with Purpose
          </p>

          <h1 className="mt-[clamp(0.75rem,1.35vw,1.625rem)] font-serif leading-[1.11] text-[clamp(1.75rem,2.81vw,3.375rem)]">
            <span className="block text-[#121C2A]">Knowledge Rooted in Faith.</span>
            <span className="block italic text-[#048ED6]">Excellence Built for Life.</span>
          </h1>

          <p className="mt-[clamp(1rem,1.5vw,1.75rem)] max-w-[26rem] leading-[1.6] text-[#5A636D] text-[1rem]">
            Rigorous academics, Islamic character, and global readiness — nurturing curious minds
            and compassionate hearts to lead with purpose and confidence.
          </p>
        </div>

        {/* Leaf-masked photograph — shared with the online learning hero. */}
        <div className="w-full max-lg:hidden mt-[-10px] h-[calc(100%+10px)]">
          <LeafImage
            src="/images/figma-home/09.png"
            alt="A lesson in progress at Yahaya International"
          />
        </div>

        {/* Below lg the leaf is dropped — at narrow widths the cusp reads as a
            rendering fault rather than a shape. */}
        <div className="w-full lg:hidden">
          <img
            src="/images/figma-home/09.png"
            alt="A lesson in progress at Yahaya International"
            className="aspect-[704/532] w-full rounded-lg object-cover"
          />
        </div>
      </div>

    </section>
  );
}

export function AcademicPrograms({ locale = 'en' }: { locale?: string }) {
  const href = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1920px] px-(--spacing-side) py-[clamp(2.5rem,4vw,4.8rem)]">
        {/* 53 between columns and 77 between rows, at 1920 */}
        <div className="grid grid-cols-1 gap-x-[clamp(1rem,2.76vw,3.3125rem)] gap-y-[clamp(1.25rem,4vw,4.8125rem)] md:grid-cols-2">
          {PROGRAMS.map((p) => (
            <article
              key={p.title}
              className="group grid aspect-[793/291] grid-cols-1 sm:grid-cols-[minmax(0,342fr)_minmax(0,451fr)] overflow-hidden rounded-lg max-sm:aspect-auto"
            >
              <div className="relative overflow-hidden ">
                <Link
                  href={href(`/programs/${p.slug}`)}
                  className="w-full relative overflow-hidden"
                >
                <img src={p.image} alt={p.alt} className="h-full w-full object-cover lg:group-hover:scale-105 duration-500" />
                <span className="absolute left-3 top-3 grid h-[clamp(1.75rem,1.98vw,2.375rem)] w-[clamp(1.75rem,1.98vw,2.375rem)] place-items-center rounded-md bg-[#048ED6] text-white">
                  <BookOpen className="h-[45%] w-[45%]" aria-hidden />
                </span>
                </Link>
              </div>

              <div className="flex flex-col justify-center bg-[#F2F9FD] p-[clamp(1rem,1.35vw,1.625rem)]">
                <Link
                  href={href(`/programs/${p.slug}`)}
                  className="inline-flex items-center gap-1.5 font-medium text-[#048ED6] transition-opacity hover:opacity-80 text-[clamp(0.625rem,0.63vw,0.75rem)]"
                >
                  Explore Program <ArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  href={href(`/programs/${p.slug}`)}
                  className="w-full relative"
                >
                  <h2 className="mt-[clamp(0.5rem,0.73vw,0.875rem)] font-serif text-[#121C2A] text-[clamp(1rem,1.15vw,1.375rem)]">
                    {p.title}
                  </h2>
                </Link>
                <p className="mt-[clamp(0.375rem,0.52vw,0.625rem)] leading-[1.6] text-[#5A636D] text-[1rem]">
                  {p.desc}
                </p>

                <Link
                  href={href(`/programs/${p.slug}`)}
                  className="mt-[clamp(0.75rem,1vw,1.25rem)] inline-flex h-[clamp(2rem,2.08vw,2.5rem)] w-fit items-center gap-2 rounded-full bg-[#048ED6] px-[clamp(0.875rem,1.04vw,1.25rem)] font-semibold text-white transition-colors hover:bg-[#037ab8] text-[clamp(0.625rem,0.68vw,0.8125rem)]"
                >
                  Read More
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AcademicApproach() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1920px] sm:px-(--spacing-side) pb-[clamp(3rem,5vw,6rem)]">
        {/* 1280 wide in the design, centred */}
        <div className="mx-auto grid max-w-[80rem] grid-cols-1 items-center gap-[clamp(2rem,3.6vw,4.4rem)] sm:rounded-lg bg-[#EFF4FF] p-[clamp(1.5rem,3.1vw,3.75rem)] lg:grid-cols-2">
          <div className="relative">
            {/* Drifts against the scroll above lg only — the project's lg is
                1281. Below that the frame crosses a short viewport too quickly
                for the movement to read as depth. */}
            <ParallaxImage
              src="/images/figma-home/09.png"
              alt="A teacher leading a class discussion"
              ratio="4/3"
              minWidth={1281}
              className="w-full rounded-lg"
            />
            {/* Stat card overlapping the photograph's lower-right */}
            <div className="absolute -bottom-6 right-0 w-[clamp(9rem,12.5vw,15rem)] translate-x-[8%] rounded-lg bg-[#048ED6] p-[clamp(0.875rem,1.25vw,1.5rem)] text-white shadow-xl">
              <p className="font-serif leading-none text-[clamp(1.25rem,1.56vw,1.875rem)]">98%</p>
              <p className="mt-2 uppercase leading-[1.4] sm:tracking-[0.08em] text-white/90 text-[1rem]">
                University placement rate for our graduates
              </p>
            </div>
          </div>

          <div className="min-w-0 max-lg:mt-8">
            <p className="font-semibold uppercase tracking-[0.18em] text-[#048ED6] text-[1rem]">
              Our Approach
            </p>
            <h2 className="mt-[clamp(0.5rem,0.83vw,1rem)] font-serif leading-tight text-[#121C2A] text-[clamp(1.375rem,1.98vw,2.375rem)]">
              How Learning Comes to Life
            </h2>

            <ul className="mt-[clamp(1.25rem,2.08vw,2.5rem)] space-y-[clamp(1rem,1.35vw,1.625rem)]">
              {APPROACH.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-[clamp(0.75rem,1vw,1.25rem)]">
                  <span className="grid h-[clamp(2rem,2.4vw,2.875rem)] w-[clamp(2rem,2.4vw,2.875rem)] shrink-0 place-items-center rounded-full bg-[#DCEBFB] text-[#048ED6]">
                    <Icon className="h-[45%] w-[45%]" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-[#121C2A] text-[clamp(0.8125rem,0.83vw,1rem)]">
                      {title}
                    </span>
                    <span className="mt-1 block leading-[1.6] text-[#5A636D] text-[clamp(0.6875rem,0.73vw,0.875rem)]">
                      {desc}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

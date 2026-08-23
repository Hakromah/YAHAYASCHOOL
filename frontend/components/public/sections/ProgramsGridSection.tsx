'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, BookOpenText, GraduationCap, Laptop } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

/**
 * Home — "Explore Our Programs" section.
 * Implemented from Figma node 537-452 (frame 1920×1080).
 *
 * Design reference values (measured at the 1920 frame):
 *   brand #048ED6 · ink #000000 · body #576059 · wells #E6F0FB · rule #EBEBEB
 *   heading 44 · row title 50 · body 16/21 · wells 50 · CTA 175×52 pill
 *   image column 557 wide (34.6% of content) — 255 tall open, 101 tall closed
 *
 * md and up  → accordion; hovering a row opens it (first row open at rest).
 * below md   → the same rows become a swipeable slider.
 * Note `--breakpoint-md` is 1025px in globals.css, not Tailwind's default.
 */

/** The Figma uses a mosque glyph here; lucide has no equivalent. */
function MosqueIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4.5 8.2c0-1 .8-1.6.8-2.6 0-.7-.4-1.1-.8-1.5-.4.4-.8.8-.8 1.5 0 1 .8 1.6.8 2.6Z" />
      <path d="M3.7 9.4h1.6V20H3.7V9.4Z" />
      <path d="M13 4.2c2.6 1.3 4.4 3.3 4.4 5.5v.5H8.6v-.5c0-2.2 1.8-4.2 4.4-5.5Z" />
      <path d="M6.8 20v-6.4c0-1.6 1.3-2.9 2.9-2.9h6.6c1.6 0 2.9 1.3 2.9 2.9V20h-3.6v-3.1a2.6 2.6 0 0 0-5.2 0V20H6.8Z" />
      <path d="M19.9 12.6c.9.5 1.4 1.3 1.4 2.2V20h-1.4v-7.4Z" />
    </svg>
  );
}

const PROGRAMS = [
  {
    id: 'arabic',
    title: 'Arabic Programs',
    description:
      'Contribute to modern facilities and learning environments equipped with the latest educational technology. Contribute to modern facilities and learning environments equipped with the latest educational technology.',
    // The Figma's Arabic icon is a colour illustration, exported as 11.png.
    iconImg: '/images/figma-home/11.png',
    image: '/images/figma-home/19.png',
    link: '/programs/arabic',
  },
  {
    id: 'english',
    title: 'English Programs',
    description:
      'Immerse in an environment where language skills flourish. Our English programs are designed to build confidence, fluency, and a deep understanding of global literature and communication.',
    Icon: BookOpen,
    image: '/images/figma-home/03-programs.jpeg',
    link: '/programs/english',
  },
  {
    id: 'dawah',
    title: 'D’awah Programs',
    description:
      'Develop a strong foundation in Islamic theology and the principles of inviting others to the beautiful teachings of Islam through wisdom and excellent preaching.',
    Icon: MosqueIcon,
    image: '/images/figma-home/17.png',
    link: '/programs/dawah',
  },
  {
    id: 'online',
    title: 'Online learning Programs',
    description:
      'Access our world-class curriculum from anywhere. Flexible, engaging, and interactive online modules tailored for modern students seeking excellence from home.',
    Icon: Laptop,
    image: '/images/figma-home/03-programs.jpeg',
    link: '/online-learning',
  },
] as const;

/** Rows carry either a lucide component or an exported illustration. */
function RowIcon({ p, className }: { p: { Icon?: React.ElementType; iconImg?: string; title: string }; className?: string }) {
  if (p.iconImg) return <img src={p.iconImg} alt="" aria-hidden className={className} />;
  const I = p.Icon!;
  return <I className={className} />;
}

const TITLE_CLS =
  'font-bold text-black leading-[1.05] tracking-[-0.015em] text-[clamp(1.5rem,2.6vw,3.125rem)]';
const BODY_CLS = 'text-[#576059] leading-[1.31] text-[clamp(0.9375rem,0.83vw,1rem)]';

function LearnMore({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-full bg-[#048ED6] text-white font-semibold text-[15px] shadow-md transition-colors hover:bg-[#037ab8]"
    >
      <span>Learn More</span>
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

export function ProgramsGridSection({ locale = 'en', data }: { locale?: string; data?: unknown }) {
  void locale;
  void data;
  const [active, setActive] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const headerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section className="relative w-full bg-white overflow-hidden pt-[clamp(2rem,2.5vw,3rem)] sm:pt-[clamp(3rem,4.5vw,5.5rem)] pb-[clamp(1.5rem,3.8vw,4.8rem)] sm:pb-[clamp(3.5rem,4.8vw,5.8rem)]">
      <div key={isDesktop ? 'desktop' : 'mobile'} className="contents">
        <div className="max-w-[1920px] mx-auto px-(--spacing-side)">

        {/* ── Header ──────────────────────────────────────────────── */}
        <motion.div 
          className="flex flex-col items-center text-center"
          initial={isDesktop ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={isDesktop ? headerVariants : {}}
        >
          <motion.span 
            variants={isDesktop ? itemVariants : {}}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#E6F0FB] text-[#048ED6] font-semibold text-[15px]"
          >
            <GraduationCap className="w-5 h-5" />
            Our Programs
          </motion.span>
          <motion.h2 
            variants={isDesktop ? itemVariants : {}}
            className="mt-[clamp(0.75rem,1.1vw,1.3rem)] font-bold text-black tracking-[-0.015em] leading-[1.09] text-[clamp(1.5rem,2.29vw,2.75rem)]"
          >
            Explore Our Programs
          </motion.h2>
          <motion.p 
            variants={isDesktop ? itemVariants : {}}
            className={`mt-[clamp(0.75rem,1.1vw,1.3rem)] max-w-[620px] ${BODY_CLS}`}
          >
            Contribute to modern facilities and learning environments equipped with the latest
            educational technology. Contribute to modern facilities and learning environments
            equipped with the latest educational technology.
          </motion.p>
        </motion.div>

        {/* ── md+ : hover-driven accordion ────────────────────────── */}
        <motion.div 
          className="max-md:hidden mt-[clamp(2.5rem,3.7vw,4.4rem)]"
          initial={isDesktop ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={isDesktop ? {
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } }
          } : {}}
        >
          {PROGRAMS.map((p, i) => {
            const open = active === i;
            // The Figma drops the rule above the first row and above the row
            // that follows the open one; every other row keeps its divider.
            const rule = i !== 0 && i !== active + 1;
            return (
              <motion.div
                key={p.id}
                variants={isDesktop ? itemVariants : {}}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={`flex items-center gap-x-8 py-[14px] transition-colors ${rule ? 'border-t border-[#EBEBEB]' : 'border-t border-transparent'
                  }`}
              >
                {/* Left: icon + copy */}
                <div className="flex-1 min-w-0 flex items-start gap-8">
                  <span className="mt-1 w-[50px] h-[50px] shrink-0 grid place-items-center rounded-full bg-[#E6F0FB] text-[#048ED6]">
                    <RowIcon p={p} className="w-6 h-6 object-contain" />
                  </span>
                  <div className="min-w-0">
                    <h3 className={TITLE_CLS}>{p.title}</h3>
                    {/* Collapsed rows keep the copy in the DOM but at zero height. */}
                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                    >
                      <div className="overflow-hidden">
                        <p className={`mt-[clamp(1.1rem,2vw,2.4rem)] max-w-[620px] ${BODY_CLS}`}>
                          {p.description}
                        </p>
                        <div className="mt-[clamp(1.1rem,1.9vw,2.3rem)] pb-1">
                          <LearnMore href={p.link} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: image, 255 tall open / 101 tall closed */}
                <div
                  className={`shrink-0 w-[34.6%] rounded-lg overflow-hidden transition-[height] duration-500 ease-out ${open ? 'h-[255px]' : 'h-[101px]'
                    }`}
                >
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── below md : slider ───────────────────────────────────── */}
        <div className="md:hidden mt-10">
     
            <Swiper
  modules={[Pagination]}
  slidesPerView={1}
  spaceBetween={20}
  speed={800}
  autoplay={{
    delay: 5000,
    disableOnInteraction: false,
  }}
  pagination={{ clickable: true }}
  breakpoints={{
    690: {
      slidesPerView: 2,
      spaceBetween: 20,
    },
   
  }}
     className="programs-swiper !pb-12"
>
            {PROGRAMS.map((p) => (
              <SwiperSlide key={p.id}>
                <div className="flex flex-col">
                  <div className="w-full h-[210px] rounded-lg overflow-hidden">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-4 mt-5">
                    <span className="w-[50px] h-[50px] shrink-0 grid place-items-center rounded-full bg-[#E6F0FB] text-[#048ED6]">
                      <RowIcon p={p} className="w-6 h-6 object-contain" />
                    </span>
                    <h3 className={TITLE_CLS}>{p.title}</h3>
                  </div>
                  <p className={`mt-4 ${BODY_CLS}`}>{p.description}</p>
                  <div className="mt-6">
                    <LearnMore href={p.link} />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        </div>
      </div>

      <style>{`
     
           .programs-swiper  .swiper-pagination-bullet {
          width: 14px;
          height: 14px;
          background-color: #d1d5db; /* Light gray inner */
          border: 1.5px solid #0066ff; /* Blue border */
          opacity: 1;
          border-radius: 50%;
          transition: all 0.3s ease;
          margin: 0 6px !important;
          cursor: pointer;
          pointer-events: auto;
          position: relative;
          z-index: 50;
        }
        .programs-swiper  .swiper-pagination-bullet-active {
          width: 36px;
          background-color: #0066ff; /* Solid blue */
          border-color: #0066ff;
          border-radius: 14px;
        }
      `}</style>
    </section>
  );
}

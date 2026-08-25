'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  LifeBuoy,
  Mail,
  Phone,
  Sparkles,
  Sunrise,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { FooterConfig } from '../../types/cms.types';
import { SOCIALS } from './shared/socials';

/**
 * Site footer.
 * Implemented from Figma node 549-744 (measured off the footer of the 1920-wide
 * page exports, since there is no standalone footer frame in pages-png).
 *
 * Design reference values (at the 1920 frame):
 *   brand #048ED6 · ink #111C2D · strip border #BCD5EE
 *   contact strip 1710×129 with the 104px crest straddling its top edge
 *   heading 48 · eyebrow 15 · link 15 (36 pitch) · pill h38 · bottom bar h79
 *   link columns at x 1108 / 1346 / 1605 — a 248px pitch
 */

// SOCIALS now lives in shared/socials so the staff cards can use it too.

const LINK_COLUMNS = [
  {
    key: 'quickLinks',
    Icon: BookOpen,
    links: [
      { key: 'aboutUs', href: '/about' },
      { key: 'academicPrograms', href: '/programs' },
      { key: 'newsEvents', href: '/news' },
      { key: 'gallery', href: '/gallery' },
      { key: 'careers', href: '/career' },
      { key: 'contact', href: '/contact' },
    ],
  },
  {
    key: 'academics',
    Icon: GraduationCap,
    links: [
      { key: 'quranDepartment', href: '/departments' },
      { key: 'arabicLanguage', href: '/programs/arabic' },
      { key: 'englishDepartment', href: '/programs/english' },
      { key: 'onlineLearning', href: '/online-learning' },
      { key: 'studentLife', href: '/gallery' },
    ],
  },
  {
    key: 'support',
    Icon: LifeBuoy,
    links: [
      { key: 'faqs', href: '/faq' },
      { key: 'helpCenter', href: '/contact' },
    ],
  },
];

const PILLS = [
  { key: 'islamicEducation', Icon: BookOpen },
  { key: 'modernLearning', Icon: Sparkles },
  { key: 'brightFuture', Icon: Sunrise },
];

type ColType = (typeof LINK_COLUMNS)[number];

function FooterAccordion({ col, open, onToggle }: { col: ColType; open: boolean; onToggle: () => void }) {
  const t = useTranslations('footer.links');

  return (
    <div className="sm:contents">
      {/* Mobile: accordion trigger (hidden on sm+) */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="sm:hidden w-full flex items-center justify-between py-4 text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-[#111C2D] text-[0.9375rem]">
          <col.Icon className="w-[17px] h-[17px] text-[#048ED6]" />
          {t(`${col.key}.title`)}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-[#048ED6] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {/* Mobile: collapsible list via grid row trick */}
      <div
        className={`sm:hidden grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? 'grid-rows-[1fr] pb-4' : 'grid-rows-[0fr]'
          }`}
      >
        <ul className="overflow-hidden flex flex-col gap-4 ">
          {col.links.map((l) => (
            <li key={l.key}>
              <Link
                href={l.href}
                className="text-[#545F73] text-[0.9375rem] transition-colors md:hover:text-[#048ED6]"
              >
                {t(`${col.key}.${l.key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop: plain visible block (hidden on max-sm) */}
      <div className="hidden sm:block">
        <h3 className="flex items-center gap-2 font-semibold text-[#111C2D] text-[clamp(0.9375rem,0.83vw,1rem)]">
          <col.Icon className="w-[17px] h-[17px] text-[#048ED6]" />
          {t(`${col.key}.title`)}
        </h3>
        <ul className="mt-[clamp(1.25rem,1.6vw,1.9rem)] flex flex-col gap-[clamp(0.9rem,1.16vw,1.4rem)]">
          {col.links.map((l) => (
            <li key={l.key}>
              <Link
                href={l.href}
                className="text-[#545F73] text-[clamp(0.875rem,0.78vw,0.9375rem)] transition-colors md:hover:text-[#048ED6]"
              >
                {t(`${col.key}.${l.key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Footer({ locale: propLocale }: { config?: FooterConfig | null; locale?: string }) {
  const t = useTranslations('footer');
  const activeLocale = useLocale();
  const locale = propLocale || activeLocale || 'en';
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const formattedYear = new Intl.NumberFormat(locale, { useGrouping: false }).format(currentYear);

  return (
    <footer className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto px-(--spacing-side)">

        {/* ── Contact strip, crest straddling its top edge ─────────── */}
        <div className="relative pt-[52px] max-sm:pt-[80px] max-xs:pt-[100px]">
          <span style={{ fill: '#FFF', filter: 'drop-shadow(0 2px 2px rgba(15, 108, 189, 0.20))' }} className="absolute top-0 left-1/2 -translate-x-1/2 z-10 md:w-[184px] md:h-[184px] w-[140px] h-[140px] rounded-full bg-white grid place-items-center overflow-hidden">
            <div className='relative w-full h-full flex justify-center items-center '>
              <Image src="/headerlogo.png" alt="Yahaya International" width={78} height={78} className="object-contain w-full h-full max-h-[150px] max-w-[100px]" />
            </div>
          </span>

          <div className="relative rounded-2xl overflow-hidden bg-linear-to-r from-(--color-primary) sm:via-white to-(--color-primary)">
            {/* Social */}
            <div className="relative rounded-2xl bg-white m-[1px] px-[clamp(1.25rem,2.1vw,2.5rem)] py-[31px] max-lg:pt-[66px] flex flex-col lg:flex-row lg:items-center justify-between gap-8 max-md:gap-5">
              <div className="flex flex-col gap-[14px]">
                <span className="text-[13px] text-[#6B7280]">{t('contact.socials')}</span>
                <div className="flex items-center gap-[20px]">
                  {SOCIALS.map((s) => (
                    <a
                      key={s.name}
                      href={s.href}
                      aria-label={s.name}
                      className="w-[30px] h-[30px] grid place-items-center rounded-md bg-[#E6F0FB] text-[#048ED6] transition-colors hover:bg-[#048ED6] md:hover:text-white"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[15px] h-[15px]" aria-hidden>
                        <path d={s.path} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>

              {/* Email / phone */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-0">
                <a href="mailto:Yahayahighschool@Gmail.Com" className="text-[15px] block text-[#111C2D] transition-colors">
                  <div className="flex flex-col gap-[10px] sm:pe-[46px]">
                    <span className="text-[13px] text-[#6B7280]">{t('contact.email')}</span>
                    <span className="flex items-center gap-3">
                      <span className="w-[30px] h-[30px] shrink-0 grid place-items-center rounded-md bg-[#E6F0FB] text-[#048ED6]">
                        <Mail className="w-[15px] h-[15px]" />
                      </span>
                      <p className="text-[15px] text-[#111C2D] md:hover:text-[#048ED6] transition-colors">
                        Yahayahighschool@Gmail.Com
                      </p>
                    </span>
                  </div>
                </a>

                <span className="hidden sm:block w-px self-stretch bg-[#BCD5EE]" />
                <a href="tel:+23188368801" className="text-[15px] text-[#111C2D] md:hover:text-[#048ED6] transition-colors">
                  <div className="flex flex-col gap-[10px] sm:ps-[46px]">
                    <span className="text-[13px] text-[#6B7280]">{t('contact.phone')}</span>
                    <span className="flex items-center gap-3">
                      <span className="w-[30px] h-[30px] shrink-0 grid place-items-center rounded-md bg-[#E6F0FB] text-[#048ED6]">
                        <Phone className="w-[15px] h-[15px]" />
                      </span>
                      <p className="text-[15px] block text-[#111C2D] md:hover:text-[#048ED6] transition-colors" dir="ltr">
                        +23188368801
                      </p>
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Brand block + link columns ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-x-[clamp(2rem,5vw,6rem)] gap-y-12 pt-[clamp(1.5rem,4.8vw,5.8rem)] pb-[clamp(1.5rem,4.5vw,5.5rem)]">

          <div>
            <p className="text-[#048ED6] font-semibold uppercase tracking-[0.02em] text-[1rem]">
              {t('brand.name')}
            </p>

            <h2 className="mt-[clamp(1.25rem,1.7vw,2.05rem)] font-bold text-[#111C2D] tracking-[-0.015em] leading-[1.1] text-[clamp(1.75rem,2.5vw,3rem)]">
              {t('brand.tagline1')}{' '}
              <span className="relative inline-block text-[#048ED6]">
                {t('brand.tagline2')}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 195 9"
                  fill="none"
                  className="absolute left-0 -bottom-[6px] w-full"
                  aria-hidden
                  preserveAspectRatio="none"
                >
                  <path d="M0.078125 8.5C0.078125 8.5 54.1334 -0.127191 94.4565 0.53641C131.155 1.14037 194.078 8.5 194.078 8.5" stroke="url(#footer-excellence-gradient)" />
                  <defs>
                    <linearGradient id="footer-excellence-gradient" x1="97.0781" y1="-8.43934" x2="97.0781" y2="8.50112" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#005396" />
                      <stop offset="0.5" stopColor="#046ED6" />
                      <stop offset="1" stopColor="white" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h2>

            <p className="mt-[clamp(1rem,1.2vw,1.45rem)] max-w-[460px] text-[#545F73] leading-[1.6] text-[1rem]">
              {t('brand.description')}
            </p>

            <div className="mt-[clamp(1.75rem,2.4vw,2.9rem)] flex flex-wrap gap-[14px] max-w-[400px]">
              {PILLS.map((p) => (
                <span
                  key={p.key}
                  className="inline-flex items-center gap-2 h-[38px] px-4 rounded-full bg-[#048ED6] text-white font-medium text-[13px]"
                >
                  <p.Icon className="w-[15px] h-[15px]" />
                  {t(`pills.${p.key}`)}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-[clamp(2rem,5.6vw,6.75rem)] gap-y-10 max-sm:grid-cols-1 max-sm:gap-y-0 max-sm:divide-y max-sm:divide-[#E8EEF5]">
            {LINK_COLUMNS.map((col) => (
              <FooterAccordion
                key={col.key}
                col={col}
                open={activeAccordion === col.key}
                onToggle={() => setActiveAccordion(activeAccordion === col.key ? null : col.key)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────── */}
      <div className="bg-[#048ED6] text-white">
        <div className="max-w-[1920px] max-sm:[&_p]:text-center mx-auto px-(--spacing-side) min-h-[79px] py-4 flex flex-col sm:flex-row items-center justify-between max-sm:justify-center gap-3 text-[clamp(0.8125rem,0.73vw,0.875rem)]">
          <p>{t('bottom.copyright', { year: formattedYear })}</p>
          <div className="flex items-center gap-8">
            <Link href="?policy=terms" scroll={false} className="transition-opacity hover:opacity-80">{t('bottom.terms')}</Link>
            <Link href="/privacy" className="transition-opacity hover:opacity-80">{t('bottom.privacy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

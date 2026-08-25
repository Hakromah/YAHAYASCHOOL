'use client';

import React, { useState } from 'react';
import { ChevronDown, Mail } from 'lucide-react';
import { SOCIALS } from '@/components/public/shared/socials';
import { useTranslations } from 'next-intl';

/**
 * Staffs — the faculty card grid.
 * Implemented from Figma node 384-1759 (staffs page frame, 1920×3361).
 *
 * Design reference values (measured off the 1920 export):
 *   4 columns of 398 at x137/553/969/1384 — pitch 416, so an 18 gutter
 *   photo 398×390 · name serif 20 · role uppercase 11 · hairline rule
 *   email row: #E6F0FB well + address · Load More pill 210×58, centred
 *
 * The social row only appears on the first card in the export, which is the
 * hover state being shown — so it is wired as a hover/focus reveal here.
 */

const STAFF_COUNT = 12;
const PAGE_SIZE = 8;

function StaffCard({ index }: { index: number }) {
  const t = useTranslations('staffsPage.members');
  const name = t(`${index}.name`);
  const image = t(`${index}.image`);
  const role = t(`${index}.role`);
  const email = t(`${index}.email`);

  return (
    <article className="group rounded-xl overflow-hidden bg-white border border-black/[0.06] shadow-[0_2px_14px_rgba(16,24,40,0.06)]">
      <div className="relative w-full aspect-[398/390] cursor-pointer overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover" />

        {/* Socials ride in over the photo on hover; keyboard focus counts too. */}
        <div
          className="absolute left-[5.5%] bottom-[6%] flex items-center gap-2 transition-all duration-300
                     opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                     group-focus-within:opacity-100 group-focus-within:translate-y-0"
        >
          {SOCIALS.filter((s) => s.name !== 'YouTube').map((s) => (
            <a
              key={s.name}
              href={s.href}
              aria-label={`${name} on ${s.name}`}
              className="w-[30px] h-[30px] grid place-items-center rounded-full bg-[#048ED6] text-white transition-colors hover:bg-[#037ab8]"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[14px] h-[14px]" aria-hidden>
                <path d={s.path} />
              </svg>
            </a>
          ))}
        </div>
      </div>

      <div className="px-[clamp(0.9rem,1.15vw,1.4rem)] pt-[clamp(1rem,1.25vw,1.5rem)] pb-[clamp(1rem,1.15vw,1.4rem)]">
        <h3 className="font-serif text-[#121C2A] leading-[1.25] text-[clamp(1rem,1.04vw,1.25rem)]">
          {name}
        </h3>
        <p className="mt-1 uppercase tracking-[0.04em] text-[#7A828C] text-[1rem]">
          {role}
        </p>

        <hr className="my-[clamp(0.75rem,0.94vw,1.125rem)] border-0 border-t border-[#EBEFF3]" />

        <a
          href={`mailto:${email}`}
          className="flex items-center gap-3 group/mail"
        >
          <span className="w-[30px] h-[30px] shrink-0 grid place-items-center rounded-md bg-[#E6F0FB] text-[#048ED6]">
            <Mail className="w-[15px] h-[15px]" />
          </span>
          <span className="min-w-0 truncate text-[#3F4941] transition-colors group-hover/mail:text-[#048ED6] text-[clamp(0.6875rem,0.68vw,0.8125rem)]">
            {email}
          </span>
        </a>
      </div>
    </article>
  );
}

export function StaffGrid() {
  const [shown, setShown] = useState(PAGE_SIZE);
  const visible = Array.from({ length: Math.min(shown, STAFF_COUNT) }, (_, i) => i);
  const more = shown < STAFF_COUNT;
  const t = useTranslations('staffsPage');

  return (
    <section className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto px-(--spacing-side) py-[clamp(2.5rem,4.2vw,5rem)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
          {visible.map((i) => (
            <StaffCard key={i} index={i} />
          ))}
        </div>

        {more && (
          <div className="mt-[clamp(2rem,3.4vw,4rem)] flex justify-center">
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE_SIZE)}
              className="inline-flex items-center justify-center gap-2 h-[58px] px-8 rounded-full border border-[#D7E3EE] bg-white text-[#121C2A] font-medium transition-colors hover:bg-[#F2F9FD] text-[clamp(0.8125rem,0.78vw,0.9375rem)]"
            >
              <ChevronDown className="w-4 h-4" />
              {t('loadMore')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

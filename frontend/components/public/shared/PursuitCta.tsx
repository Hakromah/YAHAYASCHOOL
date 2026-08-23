import React from 'react';
import Link from 'next/link';

/**
 * "In Pursuit of Exceptional Education" — the closing CTA card. It appears
 * verbatim on both the About and Staffs designs, so it lives here rather than
 * being duplicated.
 *
 * Design reference values (1920): card 1150 wide on #F2F9FD,
 * heading 34 serif italic, buttons h50.
 */
export function PursuitCta() {
  return (
    <section className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto sm:px-(--spacing-side) sm:py-[clamp(1.5rem,4vw,4.8rem)] max-sm:mb-10">
        <div className="max-w-[1150px] mx-auto sm:rounded-2xl bg-[#F2F9FD] px-[clamp(1.5rem,3vw,3.6rem)] py-[clamp(1.5rem,4.4vw,5.3rem)] text-center">
          <h2 className="font-serif italic text-[#121C2A] leading-[1.2] text-[clamp(1.375rem,1.77vw,2.125rem)]">
            In Pursuit of Exceptional Education
          </h2>

          <p className="mt-[clamp(1rem,1.7vw,2rem)] mx-auto max-w-[660px] text-[#3F4941] leading-[1.81] text-[1rem]">
            Our faculty recruitment follows a rigorous selection process, ensuring every teacher
            embodies our values of excellence, integrity, and lifelong learning.
          </p>

          <div className="mt-[clamp(1.5rem,2.3vw,2.75rem)] flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/online-registration"
              className="inline-flex items-center justify-center h-[50px] px-8 rounded-full bg-[#048ED6] text-white font-medium text-[clamp(0.8125rem,0.78vw,0.9375rem)] transition-colors hover:bg-[#037ab8]"
            >
              Join Our School
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center h-[50px] px-8 rounded-full bg-white text-[#121C2A] font-medium text-[clamp(0.8125rem,0.78vw,0.9375rem)] transition-colors hover:bg-[#E6F0FB]"
            >
              View Our Events
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

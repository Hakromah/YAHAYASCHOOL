'use client';

import React, { useId, useRef, useState, useEffect } from 'react';

/**
 * About — Mission / Vision panel.
 * Implemented from Figma node 384-1451 (about page frame, 1920×6100).
 *
 * The crest uses the mask1.svg path (viewBox 0 0 447 534).
 *
 * Desktop (lg+):
 *   - Left column : static tab buttons — opacity toggles on click, NO sliding
 *   - Centre crest: scroll-driven parallax on the image inside the shield
 *   - Right column : vertical slider — body copy slides up/down on click
 * Mobile: standard stacked layout.
 */

// Path from /public/images/mask1.svg (viewBox 0 0 447 534)
const MASK_PATH =
  'M447 0C366.625 38.9874 317.792 38.0739 224.523 0C152.17 33.5976 104.763 37.4041 0 0V369.81C59.9418 469.129 108.09 506.034 224.523 534C359.175 492.021 409.772 456.981 447 369.81V0Z';

const TABS = [
  {
    id: 'mission',
    label: 'Our Mission',
    image: '/images/vission.png',
    body: 'To provide a comprehensive, balanced education that equips students with both academic excellence and profound moral character grounded in Islamic principles.',
  },
  {
    id: 'vision',
    label: 'Our Vision',
    image: '/images/figma-home/02-about.jpeg',
    body: 'To be a leading institution recognised for nurturing confident, principled graduates who carry Islamic values into every field they enter and serve their communities with distinction.',
  },
] as const;

function MissionIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.5 14.5L12.5 12.5L14.5 5.5L7.5 7.5L5.5 14.5ZM10 11.5C9.58333 11.5 9.22917 11.3542 8.9375 11.0625C8.64583 10.7708 8.5 10.4167 8.5 10C8.5 9.58333 8.64583 9.22917 8.9375 8.9375C9.22917 8.64583 9.58333 8.5 10 8.5C10.4167 8.5 10.7708 8.64583 11.0625 8.9375C11.3542 9.22917 11.5 9.58333 11.5 10C11.5 10.4167 11.3542 10.7708 11.0625 11.0625C10.7708 11.3542 10.4167 11.5 10 11.5ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20Z"
        fill="currentColor"
      />
    </svg>
  );
}

function VisionIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

export function MissionVisionSection() {
  const [active, setActive] = useState(0);
  const clipId = useId();

  // Right slider height measurement
  const rightInnerRef = useRef<HTMLDivElement>(null);
  const [rightH, setRightH] = useState<number>(0);

  useEffect(() => {
    const measure = () => {
      if (rightInnerRef.current) {
        setRightH(rightInnerRef.current.scrollHeight / TABS.length);
      }
    };
    const t = setTimeout(measure, 50);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, []);

  const tabIcons = [MissionIcon, VisionIcon];

  return (
    <section className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto sm:px-(--spacing-side)">
        <div className="relative overflow-hidden sm:rounded-[24px] bg-(--color-primary)">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)_minmax(0,1.2fr)] items-center md:gap-y-10 max-md:gap-5 md:gap-x-[clamp(1.5rem,3vw,3.5rem)] px-[clamp(1.5rem,3.4vw,4rem)] py-[clamp(1.5rem,4.6vw,5.5rem)]">

            {/* ── LEFT: static tab buttons — opacity only, no sliding ── */}
            <div className="flex md:flex-col flex-wrap gap-[clamp(1.25rem,2.2vw,2.6rem)] lg:self-start lg:mt-[clamp(0.5rem,2.5vw,3rem)] lg:pl-[clamp(0.5rem,2vw,2.5rem)]">
              {TABS.map((t, i) => {
                const Icon = tabIcons[i];
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-pressed={i === active}
                    className={`flex items-center gap-4 text-left transition-opacity duration-300 cursor-pointer ${
                      i === active ? 'opacity-100' : 'opacity-55 hover:opacity-80'
                    }`}
                  >
                    <Icon className="w-[clamp(1.5rem,1.7vw,2rem)] h-[clamp(1.5rem,1.7vw,2rem)] shrink-0 text-white" />
                    <span className="font-semibold text-white whitespace-nowrap text-[clamp(1.25rem,1.87vw,2.25rem)]">
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── CENTRE: shield-masked image with crossfade on tab change ── */}
            <div className="justify-self-center w-[clamp(13rem,23.3vw,27.9rem)]">
              <svg
                viewBox="0 0 447 534"
                className="w-full h-auto"
                role="img"
                aria-label="Yahaya International crest"
              >
                <defs>
                  <clipPath id={clipId}>
                    <path d={MASK_PATH} />
                  </clipPath>
                </defs>
                <g clipPath={`url(#${clipId})`}>
                  {TABS.map((t, i) => (
                    <image
                      key={t.id}
                      href={t.image}
                      x="0"
                      y="0"
                      width="447"
                      height="534"
                      preserveAspectRatio="xMidYMid slice"
                      style={{
                        opacity: i === active ? 1 : 0,
                        transition: 'opacity 0.5s ease-in-out',
                      }}
                    />
                  ))}
                </g>
              </svg>
            </div>

            {/* ── RIGHT: body copy — vertical slider on desktop ── */}
            <div className="lg:self-start lg:mt-[clamp(0.5rem,2.9vw,3.5rem)] lg:pr-[clamp(1rem,4vw,5rem)] max-w-[30rem]">

              {/* Mobile */}
              <p className="lg:hidden text-white leading-[1.71] text-[clamp(1rem,1.25vw,1.5rem)]">
                {TABS[active].body}
              </p>

              {/* Desktop — vertical slider */}
              <div
                className="hidden lg:block overflow-hidden transition-[height] duration-500"
                style={rightH ? { height: rightH } : undefined}
              >
                <div
                  ref={rightInnerRef}
                  className="flex flex-col transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateY(-${active * (rightH || 0)}px)` }}
                >
                  {TABS.map((t, i) => (
                    <div
                      key={t.id}
                      className="shrink-0 flex items-center"
                      style={rightH ? { height: rightH } : undefined}
                      aria-hidden={i !== active}
                    >
                      <p className="text-white leading-[1.71] text-[clamp(1rem,1.25vw,1.5rem)]">
                        {t.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
          {/* Notch carved out of the bottom-right corner */}
          <div className="pointer-events-none absolute bottom-[-100px] right-[-60px] w-[clamp(4.5rem,9.9vw,11.8rem)] h-[clamp(9rem,19.7vw,23.7rem)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="273" height="290" viewBox="0 0 273 290" fill="none" className="w-full h-full">
              <path
                d="M56.1869 91.9122C100.744 49.1415 206.009 24.3345 206.009 24.3345L248.541 268.877L23.7181 262.853C23.7181 262.853 3.79733 142.202 56.1869 91.9122Z"
                stroke="white"
                strokeWidth="40"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

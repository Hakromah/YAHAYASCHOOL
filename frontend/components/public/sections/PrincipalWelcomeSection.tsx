'use client';

import React from 'react';
import { Quote, CheckCircle2, Award } from 'lucide-react';
import type { PrincipalWelcomeSectionComponent } from '../../../types/cms.types';

interface PrincipalWelcomeProps {
  data?: PrincipalWelcomeSectionComponent;
}

export function PrincipalWelcomeSection({ data }: PrincipalWelcomeProps) {
  const sectionBadge = data?.sectionBadge || 'Principal\'s Welcome & Leadership Vision';
  const title = data?.title || 'Harmonizing Intellectual Brilliance with Spiritual Depth';
  const message = data?.message ||
    'At Yahaya International Islamic and English High School, we believe that true education goes beyond the accumulation of academic facts—it requires the purification of the soul (Tazkiyah) and the cultivation of noble character (Adab). Our commitment is to raise a generation of disciplined, highly analytical Muslim scholars and scientists who lead global institutions while embodying the eternal ethical teachings of the Holy Qur\'an.';
  const principalName = data?.principalName || 'Sheikh Dr. Yahaya Al-Hassan';
  const principalTitle = data?.principalTitle || 'Director General & Principal';
  const quote = data?.quote || 'Knowledge without character is like a tree without fruit.';

  return (
    <section className="bg-white py-20 sm:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 rounded-3xl p-8 sm:p-14 lg:p-16 border border-emerald-800 shadow-2xl relative text-white">
          {/* Decorative Quote Mark */}
          <Quote className="absolute top-6 right-8 w-32 h-32 text-emerald-800/20 pointer-events-none rotate-180" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left Column: Principal Info & Avatar Badge */}
            <div className="lg:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-6">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>{sectionBadge}</span>
              </span>

              {/* Principal Photo Avatar / Emblem */}
              <div className="relative mb-6">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 p-1.5 shadow-xl">
                  <div className="w-full h-full rounded-xl bg-emerald-950 flex flex-col items-center justify-center p-4 text-center border border-emerald-800">
                    <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-serif mb-1">
                      Dr.
                    </span>
                    <span className="text-xs font-semibold text-emerald-200 tracking-wider uppercase">
                      Yahaya Al-Hassan
                    </span>
                    <span className="text-[10px] text-amber-500 font-mono mt-1">Ph.D. Islamic Sciences</span>
                  </div>
                </div>
                <div className="absolute -bottom-3 -right-3 bg-amber-500 text-emerald-950 px-3 py-1 rounded-lg text-xs font-bold shadow-md">
                  Director General
                </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                {principalName}
              </h3>
              <p className="text-amber-400 text-sm font-semibold mb-4">
                {principalTitle}
              </p>
            </div>

            {/* Right Column: Message & Quote */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                {title}
              </h2>

              <p className="text-emerald-100/90 text-base sm:text-lg leading-relaxed font-light">
                {message}
              </p>

              {quote && (
                <div className="bg-emerald-900/60 border-l-4 border-amber-400 p-6 rounded-r-2xl italic text-amber-200 text-base sm:text-lg shadow-inner">
                  &ldquo;{quote}&rdquo;
                </div>
              )}

              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Holistic Student Development</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Certified Islamic Teachers & Scholars</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

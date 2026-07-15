'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import type { HeroSectionComponent } from '../../../types/cms.types';

interface HeroProps {
  data?: HeroSectionComponent;
  locale?: string;
}

export function HeroSection({ data, locale = 'en' }: HeroProps) {
  const badge = data?.badge || 'Bismillah ir-Rahman ir-Rahim • Excellence in Education';
  const title = data?.title || 'Yahaya International Islamic & English High School';
  const subtitle =
    data?.subtitle ||
    'Empowering future Muslim leaders with world-class Western sciences, rigorous Islamic scholarship, and exemplary Qur\'anic moral character.';
  const primaryCtaText = data?.primaryCtaText || 'Online Admissions Application';
  const primaryCtaUrl = data?.primaryCtaUrl || '/online-registration';
  const secondaryCtaText = data?.secondaryCtaText || 'Explore Academic Programs';
  const secondaryCtaUrl = data?.secondaryCtaUrl || '/programs';

  const getHref = (url: string) => {
    if (url.startsWith('http') || url.startsWith('#')) return url;
    if (locale === 'en' || !locale) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return cleanUrl === '/' ? `/${locale}` : `/${locale}${cleanUrl}`;
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-24 sm:py-32 lg:py-40">
      {/* Decorative Islamic Geometric Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Subtle Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs sm:text-sm font-semibold mb-6 shadow-md animate-in fade-in slide-in-from-bottom-3 duration-500">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{badge}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.15] drop-shadow-sm">
            {title}
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-emerald-100/90 leading-relaxed mb-10 max-w-2xl font-light">
            {subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href={getHref(primaryCtaUrl)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 to-amber-600 text-emerald-950 hover:from-amber-400 hover:to-amber-500 shadow-xl hover:shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <GraduationCap className="w-5 h-5 text-emerald-950" />
              <span>{primaryCtaText}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>

            <Link
              href={getHref(secondaryCtaUrl)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base bg-emerald-900/80 hover:bg-emerald-800 text-white border border-emerald-700/80 shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>{secondaryCtaText}</span>
            </Link>
          </div>

          {/* Quick Highlight Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 pt-10 border-t border-emerald-800/60 w-full text-xs sm:text-sm text-emerald-200">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>100% University Acceptance</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>3-Year Tahfidz Al-Qur\'an Track</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Modern STEM & Laboratories</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Moral & Ethical Discipline</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

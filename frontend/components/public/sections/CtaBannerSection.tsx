'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, ArrowRight, UserPlus } from 'lucide-react';
import type { CtaBannerSectionComponent } from '../../../types/cms.types';

interface CtaBannerProps {
  data?: CtaBannerSectionComponent;
  locale?: string;
}

export function CtaBannerSection({ data, locale = 'en' }: CtaBannerProps) {
  const title = data?.title || 'Ready to Secure Your Child\'s Academic & Moral Destiny?';
  const description =
    data?.description ||
    'Applications for the upcoming 2026/2027 academic session are currently open. Join our community of high-achieving, God-conscious future leaders.';
  const buttonText = data?.buttonText || 'Start Online Application Now';
  const buttonUrl = data?.buttonUrl || '/online-registration';

  const getHref = (url: string) => {
    if (url.startsWith('http') || url.startsWith('#')) return url;
    if (locale === 'en' || !locale) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return cleanUrl === '/' ? `/${locale}` : `/${locale}${cleanUrl}`;
  };

  return (
    <section className="bg-gradient-to-tr from-emerald-900 via-emerald-800 to-emerald-950 py-20 sm:py-28 text-white relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-extrabold shadow-lg mb-6 transform -rotate-3 hover:rotate-0 transition-transform">
          <UserPlus className="w-8 h-8" />
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 max-w-3xl leading-tight">
          {title}
        </h2>

        <p className="text-emerald-100 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed font-light">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href={getHref(buttonUrl)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 shadow-2xl hover:shadow-amber-400/30 transition-all transform hover:-translate-y-0.5"
          >
            <GraduationCap className="w-6 h-6" />
            <span>{buttonText}</span>
            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}

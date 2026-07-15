'use client';

import React from 'react';
import Link from 'next/link';
import { HeartHandshake, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import type { DonationBannerSectionComponent } from '../../../types/cms.types';

interface DonationBannerProps {
  data?: DonationBannerSectionComponent;
  locale?: string;
}

export function DonationBannerSection({ data, locale = 'en' }: DonationBannerProps) {
  const badge = data?.badge || 'Sadaqah Jariyah • Waqf Endowment';
  const title = data?.title || 'Support School Development & Islamic Endowment';
  const description =
    data?.description ||
    'Your continuous charity directly builds state-of-the-art science research laboratories, expands our campus mosques, and provides full tuition scholarships for deserving orphan and hafiz students.';
  const buttonText = data?.buttonText || 'Contribute to Our Waqf Fund';
  const buttonUrl = data?.buttonUrl || '/donations';

  const getHref = (url: string) => {
    if (url.startsWith('http') || url.startsWith('#')) return url;
    if (locale === 'en' || !locale) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return cleanUrl === '/' ? `/${locale}` : `/${locale}${cleanUrl}`;
  };

  return (
    <section className="bg-emerald-950 py-16 sm:py-24 relative overflow-hidden text-white border-t border-b border-emerald-900/80">
      {/* Background Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        <div className="bg-gradient-to-r from-emerald-900/90 via-emerald-900 to-emerald-950/90 rounded-3xl p-8 sm:p-14 border border-emerald-800 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-3xl text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{badge}</span>
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
              {title}
            </h2>

            <p className="text-emerald-100/90 text-base sm:text-lg leading-relaxed font-light">
              {description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full lg:w-auto">
            <Link
              href={getHref(buttonUrl)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 hover:from-amber-300 hover:to-amber-400 shadow-xl hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5"
            >
              <HeartHandshake className="w-5 h-5" />
              <span>{buttonText}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

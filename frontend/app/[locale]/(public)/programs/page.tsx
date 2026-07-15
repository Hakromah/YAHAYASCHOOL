import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cmsService } from '@/services/cms.service';
import { HomepageBuilder } from '@/components/public/HomepageBuilder';
import { ProgramsGridSection } from '@/components/public/sections/ProgramsGridSection';
import { GraduationCap, ArrowRight, BookOpen, Clock, CheckCircle2 } from 'lucide-react';

interface ProgramsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ProgramsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('programs', locale);

  return {
    title: page?.seo?.metaTitle || (locale === 'ar' ? 'البرامج الأكاديمية | يهايا سكول' : 'Academic Programs | YAHAYASCOOL'),
    description: page?.seo?.metaDescription || 'Explore our dual curriculum tracks including Tahfidz Al-Qur\'an, Advanced Arabic Immersion, STEM Robotics, and International Cambridge preparation.',
  };
}

export default async function ProgramsListingPage({ params }: ProgramsPageProps) {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('programs', locale);

  if (page?.sections && page.sections.length > 0) {
    return <HomepageBuilder sections={page.sections} locale={locale} />;
  }

  const programs = await cmsService.getPrograms(locale, false, 50);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs sm:text-sm font-semibold mb-6">
            Dual Curriculum Excellence
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Academic Tracks & Programs
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-3xl mx-auto font-light leading-relaxed">
            Every academic track at YAHAYASCOOL is carefully structured to harmonize top-tier international university standards with deep Qur\'anic moral discipline.
          </p>
        </div>
      </section>

      {/* Programs Grid Section */}
      <div className="pt-8">
        <ProgramsGridSection initialPrograms={programs} locale={locale} />
      </div>
    </main>
  );
}

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cmsService } from '@/services/cms.service';
import { HomepageBuilder } from '@/components/public/HomepageBuilder';
import { Laptop, BookOpen, Video, ShieldCheck, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

interface OnlineLearningPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: OnlineLearningPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('online-learning', locale);

  return {
    title: page?.seo?.metaTitle || (locale === 'ar' ? 'بوابة التعلم الإلكتروني | يهايا سكول' : 'Online Learning & E-Campus | YAHAYASCOOL'),
    description: page?.seo?.metaDescription || 'Access digital textbooks, recorded Cambridge lectures, live Qur\'anic revision circles, and automated assignment submission.',
  };
}

export default async function OnlineLearningLandingPage({ params }: OnlineLearningPageProps) {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('online-learning', locale);

  if (page?.sections && page.sections.length > 0) {
    return <HomepageBuilder sections={page.sections} locale={locale} />;
  }

  const getHref = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs sm:text-sm font-semibold mb-6">
            Digital Campus & Virtual Classrooms
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Online Learning Portal
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-3xl mx-auto font-light leading-relaxed mb-10">
            Our enterprise virtual learning environment enables seamless continuous education, remote Tahfidz assessments, and interactive science simulations from anywhere.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={getHref('/login')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base bg-amber-400 hover:bg-amber-300 text-emerald-950 shadow-xl transition-all"
            >
              <Lock className="w-5 h-5" />
              <span>Login to Student Portal</span>
            </Link>
            <Link
              href={getHref('/online-registration')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-700 shadow-md transition-all"
            >
              <span>Apply for Remote Track</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 mb-4 tracking-tight">
            Why Our Digital Portal Stands Out
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            We combine high-speed content delivery with strict Islamic online safety protocols and teacher supervision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-emerald-50/60 rounded-3xl p-8 border border-emerald-100/80">
            <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-amber-400 flex items-center justify-center font-bold mb-6 shadow-md">
              <Laptop className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-3">Live & Recorded Lectures</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Never miss a lesson. Access crystal-clear HD recordings of Cambridge IGCSE chemistry, mathematics, and physics symposiums anytime.
            </p>
          </div>

          <div className="bg-emerald-50/60 rounded-3xl p-8 border border-emerald-100/80">
            <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-amber-400 flex items-center justify-center font-bold mb-6 shadow-md">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-3">Digital Library & E-Books</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Full access to thousands of peer-reviewed scientific journals, interactive textbooks, and classical Islamic Tajweed reference guides.
            </p>
          </div>

          <div className="bg-emerald-50/60 rounded-3xl p-8 border border-emerald-100/80">
            <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-amber-400 flex items-center justify-center font-bold mb-6 shadow-md">
              <Video className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-3">Virtual Qur\'an Circles</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              One-on-one virtual recitation and memorization assessment sessions with certified Hafiz instructors via secure low-latency video rooms.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

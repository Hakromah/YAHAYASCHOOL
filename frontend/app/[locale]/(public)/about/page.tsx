import React from 'react';
import type { Metadata } from 'next';
import { cmsService } from '@/services/cms.service';
import { HomepageBuilder } from '@/components/public/HomepageBuilder';
import { Award, BookOpen, CheckCircle2, Shield, Users, Target, HeartHandshake } from 'lucide-react';

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('about', locale);

  return {
    title: page?.seo?.metaTitle || (locale === 'ar' ? 'من نحن | يهايا سكول' : 'About Us | YAHAYASCOOL'),
    description: page?.seo?.metaDescription || 'Learn about our history, mission, leadership, and dual academic curriculum at Yahaya International Islamic and English High School.',
  };
}

export default async function AboutUsPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('about', locale);

  if (page?.sections && page.sections.length > 0) {
    return <HomepageBuilder sections={page.sections} locale={locale} />;
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs sm:text-sm font-semibold mb-6">
            Our Heritage & Vision
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            About Yahaya International Islamic & English High School
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-3xl mx-auto font-light leading-relaxed">
            Founded with the sole purpose of raising moral, highly intellectual Muslim scientists, scholars, and leaders capable of excelling on the global stage.
          </p>
        </div>
      </section>

      {/* Mission & Vision Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-emerald-50 rounded-3xl p-10 border border-emerald-100 flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-900 text-amber-400 flex items-center justify-center font-bold shadow-md mb-6">
                <Target className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mb-4">Our Mission</h2>
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                To provide a rigorous, harmonized dual-curriculum that integrates the highest global standards of Western science, mathematics, and technology with profound Qur\'anic scholarship, classical Arabic mastery, and unshakeable ethical discipline (Adab).
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-emerald-200/60 flex items-center gap-2 text-sm font-bold text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-amber-500" />
              <span>Intellectual Brilliance & Character Transformation</span>
            </div>
          </div>

          <div className="bg-amber-50/70 rounded-3xl p-10 border border-amber-200/80 flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-emerald-950 flex items-center justify-center font-bold shadow-md mb-6">
                <Award className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mb-4">Our Vision</h2>
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                To be the foremost model of Islamic and modern academic excellence across Africa and the Muslim world—producing innovative graduates who lead top universities, research centers, and institutions while remaining deeply anchored in God-consciousness (Taqwa).
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-amber-200 flex items-center gap-2 text-sm font-bold text-emerald-950">
              <CheckCircle2 className="w-5 h-5 text-emerald-800" />
              <span>Recognized Globally, Rooted Spiritually</span>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership & Faculty Highlights */}
      <section className="bg-gray-50/80 py-20 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 mb-4 tracking-tight">
              Executive Leadership Team
            </h2>
            <p className="text-gray-600 text-lg">
              Guided by distinguished scholars and experienced academic administrators
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xs text-center flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-emerald-900 text-amber-400 font-bold text-2xl flex items-center justify-center mb-5 shadow-md border-4 border-amber-400/30">
                YA
              </div>
              <h3 className="text-xl font-bold text-emerald-950">Sheikh Dr. Yahaya Al-Hassan</h3>
              <span className="text-amber-600 text-xs font-bold uppercase tracking-wider mt-1 mb-4">Director General & Principal</span>
              <p className="text-gray-600 text-sm leading-relaxed">
                Ph.D. in Islamic Sciences and Educational Administration with 25+ years of leadership across international high schools.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xs text-center flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-emerald-800 text-amber-400 font-bold text-2xl flex items-center justify-center mb-5 shadow-md border-4 border-amber-400/30">
                IM
              </div>
              <h3 className="text-xl font-bold text-emerald-950">Ustadh Ibrahim Al-Maliki</h3>
              <span className="text-amber-600 text-xs font-bold uppercase tracking-wider mt-1 mb-4">Dean of Islamic & Qur\'anic Studies</span>
              <p className="text-gray-600 text-sm leading-relaxed">
                Certified Hafiz and Qari with Ijazah in the ten Qira\'at, overseeing our rigorous 3-year Tahfidz Al-Qur\'an memorization track.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xs text-center flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-emerald-950 text-amber-400 font-bold text-2xl flex items-center justify-center mb-5 shadow-md border-4 border-amber-400/30">
                FA
              </div>
              <h3 className="text-xl font-bold text-emerald-950">Dr. Fatima Abdullah</h3>
              <span className="text-amber-600 text-xs font-bold uppercase tracking-wider mt-1 mb-4">Dean of Pure Sciences & Curriculum</span>
              <p className="text-gray-600 text-sm leading-relaxed">
                Former university research fellow in Chemistry and Robotics, ensuring our STEM track meets rigorous Cambridge and SAT standards.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

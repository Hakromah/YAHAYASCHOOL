import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cmsService } from '@/services/cms.service';
import { Clock, ArrowLeft, CheckCircle2, Download, Building2, GraduationCap, Share2 } from 'lucide-react';

interface ProgramDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: ProgramDetailProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const program = await cmsService.getProgramBySlug(slug, locale);

  if (!program) {
    return { title: 'Program Not Found | YAHAYASCOOL' };
  }

  return {
    title: program.seo?.metaTitle || `${program.title} | YAHAYASCOOL`,
    description: program.seo?.metaDescription || program.description,
  };
}

export default async function ProgramDetailPage({ params }: ProgramDetailProps) {
  const { locale, slug } = await params;
  const program = await cmsService.getProgramBySlug(slug, locale);

  if (!program) {
    notFound();
  }

  const getHref = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  return (
    <main className="min-h-screen bg-gray-50/70 pb-24">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <Link
            href={getHref('/programs')}
            className="inline-flex items-center gap-2 text-emerald-300 hover:text-amber-400 font-semibold text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>Back to All Programs</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {program.department && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-800 text-amber-300 border border-emerald-700">
                    {program.department.title}
                  </span>
                )}
                {program.duration && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{program.duration}</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6">
                {program.title}
              </h1>

              <p className="text-lg text-emerald-100 font-light leading-relaxed">
                {program.description}
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-4">
              <Link
                href={getHref('/online-registration')}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-base bg-amber-400 hover:bg-amber-300 text-emerald-950 shadow-xl transition-all"
              >
                <GraduationCap className="w-5 h-5" />
                <span>Apply for this Track</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left / Main Details Column */}
          <div className="lg:col-span-2 space-y-8">
            {program.objectives && (
              <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs">
                <h2 className="text-2xl font-bold text-emerald-950 mb-4 pb-3 border-b border-gray-100">
                  Key Curriculum Objectives
                </h2>
                <div
                  className="prose prose-emerald max-w-none text-gray-700 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: typeof program.objectives === 'string' ? program.objectives : '' }}
                />
              </div>
            )}

            {program.requirements && (
              <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs">
                <h2 className="text-2xl font-bold text-emerald-950 mb-4 pb-3 border-b border-gray-100">
                  Admission Requirements & Prerequisites
                </h2>
                <div
                  className="prose prose-emerald max-w-none text-gray-700 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: typeof program.requirements === 'string' ? program.requirements : '' }}
                />
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="bg-emerald-950 rounded-3xl p-8 text-white shadow-lg border border-emerald-800">
              <h3 className="text-xl font-bold text-amber-400 mb-4">Quick Summary</h3>
              <ul className="space-y-3 text-sm text-emerald-200 divide-y divide-emerald-900/60">
                <li className="pt-3 flex justify-between">
                  <span className="font-semibold text-white">Track Duration:</span>
                  <span>{program.duration || 'Full High School'}</span>
                </li>
                {program.department && (
                  <li className="pt-3 flex justify-between">
                    <span className="font-semibold text-white">Faculty/Dept:</span>
                    <span className="text-right">{program.department.title}</span>
                  </li>
                )}
                <li className="pt-3 flex justify-between">
                  <span className="font-semibold text-white">Certification:</span>
                  <span className="text-right">Cambridge + Tahfidz Diploma</span>
                </li>
              </ul>

              <div className="pt-6 mt-6 border-t border-emerald-900">
                <Link
                  href={getHref('/online-registration')}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-center block shadow-md transition-colors text-sm"
                >
                  Start Application Now
                </Link>
              </div>
            </div>

            {program.downloads && program.downloads.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                <h4 className="text-base font-bold text-emerald-950 mb-4 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download Curriculum Syllabus</span>
                </h4>
                <ul className="space-y-3">
                  {program.downloads.map((file, idx) => (
                    <li key={idx}>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 text-xs font-semibold text-emerald-950 transition-colors border border-gray-100"
                      >
                        <span className="truncate max-w-[200px]">{file.name || 'Program Prospectus.pdf'}</span>
                        <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

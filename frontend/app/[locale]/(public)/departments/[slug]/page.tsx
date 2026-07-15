import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cmsService } from '@/services/cms.service';
import { ArrowLeft, Building2, UserCheck, GraduationCap, ArrowRight } from 'lucide-react';

interface DepartmentDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: DepartmentDetailProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const department = await cmsService.getDepartmentBySlug(slug, locale);

  if (!department) {
    return { title: 'Department Not Found | YAHAYASCOOL' };
  }

  return {
    title: department.seo?.metaTitle || `${department.title} | YAHAYASCOOL`,
    description: department.seo?.metaDescription || department.description,
  };
}

export default async function DepartmentDetailPage({ params }: DepartmentDetailProps) {
  const { locale, slug } = await params;
  const department = await cmsService.getDepartmentBySlug(slug, locale);

  if (!department) {
    notFound();
  }

  const getHref = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  return (
    <main className="min-h-screen bg-gray-50/70 pb-24">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <Link
            href={getHref('/departments')}
            className="inline-flex items-center gap-2 text-emerald-300 hover:text-amber-400 font-semibold text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>Back to All Departments</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-3xl">
              {department.headOfDepartment && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-4">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Head of Department: {department.headOfDepartment}</span>
                </span>
              )}

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6">
                {department.title}
              </h1>

              <div
                className="text-lg text-emerald-100 font-light leading-relaxed max-w-2xl"
                dangerouslySetInnerHTML={{ __html: typeof department.description === 'string' ? department.description : '' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Associated Programs & Teachers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-14 space-y-16">
        {/* Academic Programs under this Department */}
        {department.programs && department.programs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-950">
                  Academic Tracks in this Faculty
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Specialized curriculum tracks supervised by {department.title}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {department.programs.map((prog, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-amber-400 flex items-center justify-center font-bold shadow-md mb-6">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-950 mb-3 group-hover:text-emerald-800 transition-colors">
                      {prog.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6">
                      {prog.description}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                    <Link
                      href={getHref(`/programs/${prog.slug}`)}
                      className="inline-flex items-center gap-1.5 font-bold text-sm text-emerald-900 group-hover:text-amber-600 transition-colors"
                    >
                      <span>Track Details</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teachers / Faculty Members */}
        {department.teachers && department.teachers.length > 0 && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mb-8">
              Faculty & Teaching Staff
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {department.teachers.map((teacher, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-900 text-amber-400 font-bold text-xl flex items-center justify-center mb-4 shadow-sm border-2 border-amber-400/30">
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="font-bold text-emerald-950 text-base">{teacher.name}</h4>
                  <span className="text-xs text-amber-600 font-semibold mt-0.5">{teacher.title}</span>
                  {teacher.bio && <p className="text-gray-600 text-xs mt-3 line-clamp-2">{teacher.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

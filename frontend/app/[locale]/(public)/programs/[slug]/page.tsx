import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cmsService } from '@/services/cms.service';
import { ProgramHero, ProgramPathway } from '@/components/public/academic/AcademicDetail';
import { AcademicApproach } from '@/components/public/academic/AcademicSections';

interface ProgramDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  // Try fetching all programs in default locale to generate static routes
  const programs = await cmsService.getPrograms('en', false, 100);
  return programs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProgramDetailProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const program = await cmsService.getProgramBySlug(slug, locale);
  if (!program) return { title: 'Program Not Found | YAHAYASCHOOL' };
  return { title: `${program.title} | YAHAYASCHOOL`, description: program.description || 'Program details' };
}

export default async function ProgramDetailPage({ params }: ProgramDetailProps) {
  const { locale, slug } = await params;

  let program = await cmsService.getProgramBySlug(slug, locale);

  // Provide a fallback program if the CMS is offline, to prevent a 404
  if (!program) {
    const knownSlugs = ['arabic', 'english', 'dawah', 'online', 'quran-memorization'];
    if (knownSlugs.includes(slug)) {
      program = {
        slug,
        title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Program`,
        description: `Detailed information about the ${slug} program.`,
        pathwaySteps: []
      } as any;
    } else {
      notFound();
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <ProgramHero program={program} />
      <ProgramPathway program={program} />
      <AcademicApproach />
    </main>
  );
}

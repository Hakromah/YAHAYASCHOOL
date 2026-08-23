import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PROGRAMS } from '@/components/public/academic/programs';
import { ProgramHero, ProgramPathway } from '@/components/public/academic/AcademicDetail';
import { AcademicApproach } from '@/components/public/academic/AcademicSections';

interface ProgramDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return PROGRAMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProgramDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const program = PROGRAMS.find((p) => p.slug === slug);
  if (!program) return { title: 'Program Not Found | YAHAYASCHOOL' };
  return { title: `${program.title} | YAHAYASCHOOL`, description: program.desc };
}

export default async function ProgramDetailPage({ params }: ProgramDetailProps) {
  const { locale, slug } = await params;

  // Previously this called cmsService.getProgramBySlug, which is a stub
  // returning null — so every programme URL 404'd. Served from the same data
  // the listing uses until a real CMS is behind it.
  const program = PROGRAMS.find((p) => p.slug === slug);
  if (!program) notFound();

  return (
    <main className="min-h-screen bg-white">
      <ProgramHero program={program} locale={locale} />
      <ProgramPathway program={program} />
      <AcademicApproach />
    </main>
  );
}

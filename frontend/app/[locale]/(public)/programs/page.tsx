import React from 'react';
import type { Metadata } from 'next';
import { cmsService } from '@/services/cms.service';
import {
  AcademicHero,
  AcademicPrograms,
  AcademicApproach,
} from '@/components/public/academic/AcademicSections';

export const metadata: Metadata = {
  title: 'Academic Programs | YAHAYASCHOOL',
  description: 'Rigorous academics, Islamic character, and global readiness.',
};

export default async function ProgramsPage({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale = 'en' } = await params;
  const programs = await cmsService.getPrograms(locale, false, 50);

  return (
    <main className="min-h-screen bg-white">
      <AcademicHero />
      <AcademicPrograms locale={locale} programs={programs} />
      <AcademicApproach />
    </main>
  );
}

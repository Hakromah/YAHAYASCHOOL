import React from 'react';
import type { Metadata } from 'next';
import {
  AcademicHero,
  AcademicPrograms,
  AcademicApproach,
} from '@/components/public/academic/AcademicSections';

export const metadata: Metadata = {
  title: 'Academic Programs | YAHAYASCHOOL',
  description: 'Rigorous academics, Islamic character, and global readiness.',
};

export default function ProgramsPage({ params: { locale = 'en' } }: { params: { locale?: string } }) {
  return (
    <main className="min-h-screen bg-white">
      <AcademicHero locale={locale} />
      <AcademicPrograms locale={locale} />
      <AcademicApproach />
    </main>
  );
}

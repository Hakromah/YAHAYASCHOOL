import React from 'react';
import type { Metadata } from 'next';
import { OnlineLearning } from '@/components/public/online/OnlineSections';
import { AcademicApproach } from '@/components/public/academic/AcademicSections';

export const metadata: Metadata = {
  title: 'Online Learning | YAHAYASCHOOL',
  description: 'Access world-class Islamic and academic education from anywhere in the world.',
};

export default function OnlineLearningPage({ params: { locale = 'en' } }: { params: { locale?: string } }) {
  return (
    <main className="min-h-screen bg-white">
      <OnlineLearning locale={locale} />
      <AcademicApproach />
    </main>
  );
}

import React from 'react';
import type { Metadata } from 'next';
import { CareerHero, CareerBoard } from '@/components/public/career/CareerSections';

export const metadata: Metadata = {
  title: 'Career | YAHAYASCHOOL',
  description:
    'We seek visionary educators and staff committed to nurturing the next generation of global leaders.',
};

export default function CareerPage() {
  return (
    <main className="min-h-screen bg-white">
      <CareerHero />

      <CareerBoard />
    </main>
  );
}

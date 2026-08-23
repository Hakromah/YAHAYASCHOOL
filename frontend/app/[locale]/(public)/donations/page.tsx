import React from 'react';
import type { Metadata } from 'next';
import {
  DonationHero,
  GiveSection,
  TargetedGiving,
  WallOfGratitude,
} from '@/components/public/donation/DonationSections';

export const metadata: Metadata = {
  title: 'Donation | YAHAYASCHOOL',
  description:
    'Your contribution nurtures faith, knowledge, and character at Yahaya International.',
};

export default function DonationsPage({ params: { locale = 'en' } }: { params: { locale?: string } }) {
  return (
    <main className="min-h-screen bg-white">
      <DonationHero locale={locale} />
      <GiveSection />
      <TargetedGiving />
      <WallOfGratitude />
    </main>
  );
}

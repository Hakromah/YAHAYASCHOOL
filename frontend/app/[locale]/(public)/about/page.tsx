import React from 'react';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { MissionVisionSection } from '@/components/public/about/MissionVisionSection';
import { AboutIntroSection } from '@/components/public/about/AboutIntroSections';
import { PageHeader } from '@/components/public/shared/PageHeader';
import { CoreValuesBar, FoundingDirectorSection } from '@/components/public/about/AboutValuesDirector';
import { WhyChooseSection } from '@/components/public/about/AboutWhyChooseCta';
import { PursuitCta } from '@/components/public/shared/PursuitCta';
import { AboutTimelineSection } from '@/components/public/about/AboutTimelineSection';
import { AboutCertificateSection } from '@/components/public/about/AboutCertificateSection';

export const metadata: Metadata = {
  title: 'About Us | YAHAYASCHOOL',
  description: 'Learn about our history, mission, leadership, and dual academic curriculum.',
};

export default function AboutUsPage() {
  const t = useTranslations('pageHeaders.about');

  return (
    <main className="min-h-screen bg-white">
      
      <PageHeader title={t('title')}>
        {t('description')}
      </PageHeader>

      <AboutIntroSection />

      {/* Mission & Vision — crest is a real SVG mask, see MissionVisionSection */}
      <MissionVisionSection />

      <CoreValuesBar />

      <FoundingDirectorSection />

      <WhyChooseSection />

      <AboutTimelineSection />

      <AboutCertificateSection />

      <PursuitCta />

    </main>
  );
}

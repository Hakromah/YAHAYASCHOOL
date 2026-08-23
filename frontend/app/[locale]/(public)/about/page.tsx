import React from 'react';
import type { Metadata } from 'next';
import { MissionVisionSection } from '@/components/public/about/MissionVisionSection';
import { AboutIntroSection } from '@/components/public/about/AboutIntroSections';
import { PageHeader } from '@/components/public/shared/PageHeader';
import { CoreValuesBar, FoundingDirectorSection } from '@/components/public/about/AboutValuesDirector';
import { WhyChooseSection } from '@/components/public/about/AboutWhyChooseCta';
import { PursuitCta } from '@/components/public/shared/PursuitCta';
import { AboutTimelineSection } from '@/components/public/about/AboutTimelineSection';

export const metadata: Metadata = {
  title: 'About Us | YAHAYASCHOOL',
  description: 'Learn about our history, mission, leadership, and dual academic curriculum.',
};

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-white">
      
      <PageHeader title="About Us">
        We&apos;re here to answer your questions and guide your child&apos;s educational journey
        towards Modern Islamic Excellence.
      </PageHeader>

      <AboutIntroSection />

      {/* Mission & Vision — crest is a real SVG mask, see MissionVisionSection */}
      <MissionVisionSection />

      <CoreValuesBar />

      <FoundingDirectorSection />

      <WhyChooseSection />

      <AboutTimelineSection />

      <PursuitCta />

    </main>
  );
}

'use client';

import React from 'react';
import type { DynamicZoneSection } from '../../types/cms.types';
import { HeroSection } from './sections/HeroSection';
import { StatsSection } from './sections/StatsSection';
import { PrincipalWelcomeSection } from './sections/PrincipalWelcomeSection';
import { ProgramsGridSection } from './sections/ProgramsGridSection';
import { DepartmentsGridSection } from './sections/DepartmentsGridSection';
import { FeatureCardsSection } from './sections/FeatureCardsSection';
import { NewsGridSection } from './sections/NewsGridSection';
import { EventsGridSection } from './sections/EventsGridSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { DonationBannerSection } from './sections/DonationBannerSection';
import { CtaBannerSection } from './sections/CtaBannerSection';

interface HomepageBuilderProps {
  sections?: DynamicZoneSection[];
  locale?: string;
}

export function HomepageBuilder({ sections, locale = 'en' }: HomepageBuilderProps) {
  // If no dynamic sections provided from CMS, render default enterprise layout
  if (!sections || sections.length === 0) {
    return (
      <main className="min-h-screen">
        <HeroSection locale={locale} />
        <StatsSection />
        <PrincipalWelcomeSection />
        <FeatureCardsSection />
        <ProgramsGridSection locale={locale} />
        <DepartmentsGridSection locale={locale} />
        <DonationBannerSection locale={locale} />
        <NewsGridSection locale={locale} />
        <EventsGridSection locale={locale} />
        <TestimonialsSection locale={locale} />
        <CtaBannerSection locale={locale} />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {sections.map((section, idx) => {
        switch (section.__component) {
          case 'sections.hero':
            return <HeroSection key={idx} data={section} locale={locale} />;
          case 'sections.stats':
            return <StatsSection key={idx} data={section} />;
          case 'sections.principal-welcome':
            return <PrincipalWelcomeSection key={idx} data={section} />;
          case 'sections.feature-cards':
            return <FeatureCardsSection key={idx} data={section} />;
          case 'sections.programs-grid':
            return <ProgramsGridSection key={idx} data={section} locale={locale} />;
          case 'sections.departments-grid':
            return <DepartmentsGridSection key={idx} data={section} locale={locale} />;
          case 'sections.news-grid':
            return <NewsGridSection key={idx} data={section} locale={locale} />;
          case 'sections.events-grid':
            return <EventsGridSection key={idx} data={section} locale={locale} />;
          case 'sections.testimonials-slider':
            return <TestimonialsSection key={idx} data={section} locale={locale} />;
          case 'sections.donation-banner':
            return <DonationBannerSection key={idx} data={section} locale={locale} />;
          case 'sections.cta-banner':
            return <CtaBannerSection key={idx} data={section} locale={locale} />;
          default:
            return null;
        }
      })}
    </main>
  );
}

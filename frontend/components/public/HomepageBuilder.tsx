'use client';

import React from 'react';
import type { DynamicZoneSection } from '../../types/cms.types';
import { HeroSection } from './sections/HeroSection';
import { HomeAboutSection } from './sections/HomeAboutSection';
import { HomeActivitiesSection } from './sections/HomeActivitiesSection';
import { HomeAnimationSection } from './sections/HomeAnimationSection';
import { ProgramsGridSection } from './sections/ProgramsGridSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { NewsGridSection } from './sections/NewsGridSection';
import { StatsSection } from './sections/StatsSection';
import { FeatureCardsSection } from './sections/FeatureCardsSection';
import { DepartmentsGridSection } from './sections/DepartmentsGridSection';
import { EventsGridSection } from './sections/EventsGridSection';

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
        <HomeAboutSection />
        <HomeActivitiesSection />
        <HomeAnimationSection />
        <ProgramsGridSection locale={locale} />
        <TestimonialsSection />
        <NewsGridSection locale={locale} />

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
          default:
            return null;
        }
      })}
    </main>
  );
}

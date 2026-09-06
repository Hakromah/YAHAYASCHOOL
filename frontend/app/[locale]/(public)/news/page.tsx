import React from 'react';
import type { Metadata } from 'next';
import { NewsHero, NewsGrid } from '@/components/public/news/NewsSections';
import { cmsService } from '@/services/cms.service';
import type { NewsFeaturedEventComponent } from '@/types/cms.types';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale = 'en' } = await params;
  const pageData = await cmsService.getNewsPage(locale);

  if (pageData?.seo) {
    return {
      title: pageData.seo.metaTitle || pageData.title,
      description: pageData.seo.metaDescription,
    };
  }

  return {
    title: 'News, Events & Community | YAHAYASCHOOL',
    description: 'Discover the latest happenings at Yahaya International.',
  };
}

/** Derive a URL slug from a featured event entry */
export function slugifyEvent(fe: NewsFeaturedEventComponent, idx: number): string {
  if (fe.href) {
    const raw = fe.href.trim();
    return raw
      .replace(/^\/[a-z]{2}\/news\//, '')
      .replace(/^\/news\//, '')
      .replace(/^\//, '')
      || `story-${idx}`;
  }
  const title = fe.title || `${fe.headlineLine1 || ''} ${fe.headlineLine2 || ''}`.trim() || `story-${idx}`;
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export default async function NewsListingPage({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale = 'en' } = await params;

  // Single source of truth: [F] News Page → featuredEvents
  let pageData = await cmsService.getNewsPage(locale);
  if (!pageData && locale !== 'en') {
    pageData = await cmsService.getNewsPage('en');
  }

  const featuredEvents: NewsFeaturedEventComponent[] = pageData?.featuredEvents || [];
  const pageDate = pageData?.updatedAt || pageData?.publishedAt || pageData?.createdAt;

  return (
    <main className="min-h-screen bg-white">
      <NewsHero
        data={featuredEvents}
        breadcrumbTitle={pageData?.breadcrumbTitle}
        pageDate={pageDate}
        locale={locale}
      />
      <NewsGrid locale={locale} events={featuredEvents} pageDate={pageDate} />
    </main>
  );
}

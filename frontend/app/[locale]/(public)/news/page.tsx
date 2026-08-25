import React from 'react';
import type { Metadata } from 'next';
import { NewsHero, NewsGrid } from '@/components/public/news/NewsSections';
import { cmsService } from '@/services/cms.service';

export const metadata: Metadata = {
  title: 'News, Events & Community | YAHAYASCHOOL',
  description: 'Discover the latest happenings at Yahaya International.',
};

export default async function NewsListingPage({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale = 'en' } = await params;
  const { data: articles } = await cmsService.getArticles(locale, 1, 50);

  return (
    <main className="min-h-screen bg-white">
      <NewsHero />
      <NewsGrid locale={locale} articles={articles} />
    </main>
  );
}

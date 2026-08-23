import React from 'react';
import type { Metadata } from 'next';
import { NewsHero, NewsGrid } from '@/components/public/news/NewsSections';

export const metadata: Metadata = {
  title: 'News, Events & Community | YAHAYASCHOOL',
  description: 'Discover the latest happenings at Yahaya International.',
};

export default function NewsListingPage({ params: { locale = 'en' } }: { params: { locale?: string } }) {
  return (
    <main className="min-h-screen bg-white">
      <NewsHero locale={locale} />
      <NewsGrid locale={locale} />
    </main>
  );
}

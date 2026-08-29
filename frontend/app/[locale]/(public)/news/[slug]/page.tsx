import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cmsService } from '@/services/cms.service';
import { NewsArticleHero, NewsArticleBody } from '@/components/public/news/NewsDetail';

interface NewsDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const { data: articles } = await cmsService.getArticles('en', 1, 100);
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: NewsDetailProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const article = await cmsService.getArticleBySlug(slug, locale);
  if (!article) return { title: 'Article Not Found | YAHAYASCHOOL' };
  return { title: `${article.title} | YAHAYASCHOOL`, description: article.summary };
}

export default async function NewsDetailPage({ params }: NewsDetailProps) {
  const { locale, slug } = await params;

  let article = await cmsService.getArticleBySlug(slug, locale);

  if (!article) {
    const knownSlugs = [
      'science-tech-fair-2024', 
      'quran-competition-winners', 
      'new-library-opening',
      'new-home-hifz',
      'ramadan-reflections'
    ];
    if (knownSlugs.includes(slug)) {
      article = {
        slug,
        title: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        summary: 'A detailed article about this exciting event at Yahaya International School.',
        content: 'This is a placeholder for the full article content. When the CMS is connected, you will see the full rich-text story here.',
        category: { title: 'News', slug: 'news' },
        publishedAt: new Date().toISOString(),
      } as any;
    } else {
      notFound();
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <NewsArticleHero article={article} />
      <NewsArticleBody locale={locale} article={article} />
    </main>
  );
}

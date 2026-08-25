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

  const article = await cmsService.getArticleBySlug(slug, locale);
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-white">
      <NewsArticleHero article={article} />
      <NewsArticleBody locale={locale} article={article} />
    </main>
  );
}

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ARTICLES } from '@/components/public/news/articles';
import { NewsArticleHero, NewsArticleBody } from '@/components/public/news/NewsDetail';

interface ArticleDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: ArticleDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return { title: 'Article not found | YAHAYASCHOOL' };
  return { title: `${article.title} | YAHAYASCHOOL`, description: article.desc };
}

export default async function ArticleDetailPage({ params }: ArticleDetailProps) {
  const { locale, slug } = await params;

  // The listing links here by slug, so an unknown one is a genuine 404 rather
  // than something to paper over with the first article.
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-white">
      <NewsArticleHero article={article} locale={locale} />
      <NewsArticleBody locale={locale} />
    </main>
  );
}

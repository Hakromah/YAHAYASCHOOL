import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cmsService } from '@/services/cms.service';
import { ArrowLeft, Calendar, Eye, Tag, Share2, Newspaper } from 'lucide-react';

interface ArticleDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: ArticleDetailProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await cmsService.getArticleBySlug(slug, locale);

  if (!article) {
    return { title: 'Article Not Found | YAHAYASCOOL' };
  }

  return {
    title: article.seo?.metaTitle || `${article.title} | YAHAYASCOOL`,
    description: article.seo?.metaDescription || article.summary,
  };
}

export default async function ArticleDetailPage({ params }: ArticleDetailProps) {
  const { locale, slug } = await params;
  const article = await cmsService.getArticleBySlug(slug, locale);

  if (!article) {
    notFound();
  }

  const getHref = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'July 2026';
    try {
      return new Date(dateStr).toLocaleDateString(locale, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* Article Header Banner */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10">
          <Link
            href={getHref('/news')}
            className="inline-flex items-center gap-2 text-emerald-300 hover:text-amber-400 font-semibold text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>Back to News & Articles</span>
          </Link>

          <div className="flex items-center gap-4 text-xs text-amber-300 mb-4">
            {article.category && (
              <span className="bg-amber-400 text-emerald-950 font-bold px-3 py-1 rounded-full">
                {article.category.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(article.publishDate)}
            </span>
            {article.viewsCount !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {article.viewsCount} views
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight mb-6">
            {article.title}
          </h1>

          <p className="text-lg sm:text-xl text-emerald-100/90 font-light leading-relaxed">
            {article.summary}
          </p>
        </div>
      </section>

      {/* Article Body Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-8 mt-14">
        <div
          className="prose prose-lg prose-emerald max-w-none text-gray-800 leading-relaxed space-y-6 font-serif"
          dangerouslySetInnerHTML={{ __html: typeof article.body === 'string' ? article.body : '' }}
        />

        {article.tags && article.tags.length > 0 && (
          <div className="mt-14 pt-8 border-t border-gray-100 flex flex-wrap items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-700 mr-2" />
            {article.tags.map((tag, idx) => (
              <span key={idx} className="bg-emerald-50 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-100">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </main>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, Eye, Tag, Newspaper } from 'lucide-react';
import type { NewsGridSectionComponent, ArticleEntity } from '../../../types/cms.types';
import { cmsService } from '../../../services/cms.service';

interface NewsGridProps {
  data?: NewsGridSectionComponent;
  initialArticles?: ArticleEntity[];
  locale?: string;
}

const FALLBACK_ARTICLES: ArticleEntity[] = [
  {
    id: 1,
    title: 'YAHAYASCOOL Students Achieve 100% Pass Rate in National Science Olympiad',
    slug: 'science-olympiad-success',
    summary: 'Our Senior High robotics and chemistry teams took home 5 gold medals and 3 regional distinctions.',
    body: 'Full article content...',
    publishDate: '2026-07-10',
    viewsCount: 342,
  },
  {
    id: 2,
    title: 'Annual Tahfidz Al-Qur\'an Graduation Ceremony Scheduled for August',
    slug: 'annual-tahfidz-graduation-2026',
    summary: '34 Hafiz and Hafizah students will complete their Qur\'anic memorization track before school leadership and parents.',
    body: 'Full article content...',
    publishDate: '2026-07-04',
    viewsCount: 518,
  },
  {
    id: 3,
    title: 'New Artificial Intelligence & Islamic Ethics Lab Inaugurated',
    slug: 'new-ai-ethics-lab-inaugurated',
    summary: 'Supported by our Waqf endowment fund, the new computing center bridges modern AI development with Islamic moral philosophy.',
    body: 'Full article content...',
    publishDate: '2026-06-28',
    viewsCount: 412,
  },
];

export function NewsGridSection({ data, initialArticles, locale = 'en' }: NewsGridProps) {
  const [articles, setArticles] = useState<ArticleEntity[]>(initialArticles || FALLBACK_ARTICLES);
  const [loading, setLoading] = useState(false);

  const title = data?.title || 'Latest News & Campus Updates';
  const subtitle = data?.subtitle || 'Stay informed on academic achievements, events, and school announcements';
  const limit = data?.limit || 3;
  const categoryFilter = data?.categoryFilter;

  useEffect(() => {
    if (initialArticles && initialArticles.length > 0) return;
    setLoading(true);
    cmsService.getArticles(locale, 1, limit, categoryFilter).then((res) => {
      if (res && res.data && res.data.length > 0) {
        setArticles(res.data);
      }
      setLoading(false);
    });
  }, [locale, limit, categoryFilter, initialArticles]);

  const getHref = (slug: string) => {
    return locale === 'en' ? `/news/${slug}` : `/${locale}/news/${slug}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'July 2026';
    try {
      return new Date(dateStr).toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="bg-white py-20 sm:py-28 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 mb-3 border border-amber-200">
              School Chronicles
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
              {title}
            </h2>
            <p className="text-gray-600 text-base sm:text-lg mt-2 max-w-2xl">
              {subtitle}
            </p>
          </div>

          <Link
            href={locale === 'en' ? '/news' : `/${locale}/news`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-emerald-900 text-white hover:bg-emerald-800 shadow-md transition-all self-start md:self-auto shrink-0"
          >
            <span>View All News & Articles</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-gray-100 h-96 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {articles.map((art, idx) => (
              <article
                key={idx}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
              >
                {/* Image or Placeholder Banner */}
                <div className="h-48 bg-gradient-to-tr from-emerald-900 via-emerald-800 to-emerald-950 flex items-center justify-center relative overflow-hidden">
                  <Newspaper className="w-16 h-16 text-emerald-400/30 group-hover:scale-110 transition-transform" />
                  {art.category && (
                    <span className="absolute top-4 left-4 bg-amber-400 text-emerald-950 text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      {art.category.name}
                    </span>
                  )}
                </div>

                <div className="p-7 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        {formatDate(art.publishDate)}
                      </span>
                      {art.viewsCount !== undefined && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-gray-400" />
                          {art.viewsCount}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-emerald-950 mb-3 leading-snug group-hover:text-emerald-800 transition-colors line-clamp-2">
                      {art.title}
                    </h3>

                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6">
                      {art.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <Link
                      href={getHref(art.slug)}
                      className="inline-flex items-center gap-1.5 font-bold text-sm text-emerald-900 group-hover:text-amber-600 transition-colors"
                    >
                      <span>Read Full Story</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

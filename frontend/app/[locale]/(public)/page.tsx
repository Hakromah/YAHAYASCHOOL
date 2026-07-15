import React from 'react';
import type { Metadata } from 'next';
import { cmsService } from '@/services/cms.service';
import { HomepageBuilder } from '@/components/public/HomepageBuilder';

interface HomepageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomepageProps): Promise<Metadata> {
  const { locale } = await params;
  const homepage = await cmsService.getHomepage(locale);

  if (homepage?.seo) {
    return {
      title: homepage.seo.metaTitle || homepage.title || 'Welcome to YAHAYASCOOL',
      description: homepage.seo.metaDescription || 'Enterprise educational management platform for Yahaya International Islamic and English High School',
    };
  }

  const isArabic = locale === 'ar';
  return {
    title: isArabic ? 'يهايا سكول — المدرسة الإسلامية والإنجليزية الثانوية' : 'YAHAYASCOOL — Islamic & English High School',
    description: isArabic
      ? 'نصنع قادة المستقبل بدمج العلوم الحديثة مع التميز الأخلاقي والقرآني في بيئة تعليمية متكاملة.'
      : 'Empowering future Muslim leaders with world-class Western sciences, rigorous Islamic scholarship, and exemplary Qur\'anic moral excellence.',
  };
}

export default async function PublicHomepage({ params }: HomepageProps) {
  const { locale } = await params;
  const homepage = await cmsService.getHomepage(locale);

  return <HomepageBuilder sections={homepage?.sections} locale={locale} />;
}

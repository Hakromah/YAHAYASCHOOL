import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/public/shared/PageHeader';
import { StrapiBlocksRenderer } from '@/components/public/shared/StrapiBlocksRenderer';
import { cmsService } from '@/services/cms.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale = 'en' } = await params;
  const pageData = await cmsService.getPrivacyPage(locale);
  const t = await getTranslations({ locale, namespace: 'privacyPage' });

  const title =
    pageData?.seo?.metaTitle ||
    `${pageData?.title || t('title')} | YAHAYASCHOOL`;
  const description =
    pageData?.seo?.metaDescription ||
    'Learn how Yahaya International Islamic and English High School collects, uses, and safeguards your personal information.';

  return {
    title,
    description,
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = 'en' } = await params;
  const t = await getTranslations({ locale, namespace: 'privacyPage' });
  let pageData = await cmsService.getPrivacyPage(locale);

  if (!pageData && locale !== 'en') {
    pageData = await cmsService.getPrivacyPage('en');
  }

  const title = pageData?.title || t('title');
  const crumb = pageData?.breadcrumbTitle || title;
  const lastUpdated = pageData?.lastUpdated || t('lastUpdated');
  const rawContent = pageData?.content || t.raw('content');

  return (
    <main className="bg-[#F7FBFE] min-h-screen pb-20">
      <PageHeader title={title} crumb={crumb}>
        {lastUpdated}
      </PageHeader>

      <div className="max-w-[1152px] mx-auto px-(--spacing-side) mt-12">
        <div className="bg-white rounded-2xl shadow-sm p-[clamp(1.5rem,3vw,3rem)] border border-[#EAF5FD]">
          <StrapiBlocksRenderer content={rawContent} />
        </div>
      </div>
    </main>
  );
}

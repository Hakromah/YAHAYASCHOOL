import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/public/shared/PageHeader';

export default function PrivacyPolicyPage() {
  const t = useTranslations('privacyPage');

  return (
    <main className="bg-[#F7FBFE] min-h-screen pb-20">
      <PageHeader 
        title={t('title')}
        subtitle={t('lastUpdated')}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: t('title'), href: '#' }
        ]}
      />
      
      <div className="max-w-[1152px] mx-auto px-(--spacing-side) mt-12">
        <div className="bg-white rounded-2xl shadow-sm p-[clamp(1.5rem,3vw,3rem)] border border-[#EAF5FD]">
          <div 
            className="prose prose-sm md:prose-base max-w-none text-[#3F4941] rtl:text-right [&_h3]:text-[#121C2A] [&_h3]:font-bold [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-4 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:mx-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:mx-6 [&_ol]:mb-4 [&_li]:mb-2 [&_hr]:my-8 [&_hr]:border-[#EAF5FD]"
            dangerouslySetInnerHTML={{ __html: t.raw('content') }}
          />
        </div>
      </div>
    </main>
  );
}

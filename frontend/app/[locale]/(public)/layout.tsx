import React from 'react';
import { Topbar } from '@/components/public/Topbar';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { cmsService } from '@/services/cms.service';

interface PublicLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function PublicLayout({ children, params }: PublicLayoutProps) {
  const { locale } = await params;

  // Fetch dynamic header menu and footer configuration from Strapi CMS
  const [headerMenu, footerConfig, contactInfo] = await Promise.all([
    cmsService.getNavigationMenu('header', locale),
    cmsService.getFooterConfig(locale),
    cmsService.getContactInfo(locale),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Topbar
        currentLocale={locale}
        phone={contactInfo?.phone}
        email={contactInfo?.email}
      />
      <Navbar items={headerMenu?.items} locale={locale} />
      <div className="flex-1">
        {children}
      </div>
      <Footer config={footerConfig} locale={locale} />
    </div>
  );
}

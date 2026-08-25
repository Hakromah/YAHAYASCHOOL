import React from 'react';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/public/shared/PageHeader';
import { ContactSection, ContactMap } from '@/components/public/contact/ContactSection';

export const metadata: Metadata = {
  title: 'Contact | YAHAYASCHOOL',
  description:
    "We're here to answer your questions and guide your child's educational journey towards Modern Islamic Excellence.",
};

export default function ContactPage() {
  const t = useTranslations('pageHeaders.contact');

  return (
    <main className="min-h-screen bg-white">
      <PageHeader title={t('title')} crumb={t('crumb')}>
        {t('description')}
      </PageHeader>

      <ContactSection />

      <ContactMap />
    </main>
  );
}

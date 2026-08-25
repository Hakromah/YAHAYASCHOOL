import React from 'react';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/public/shared/PageHeader';
import { PursuitCta } from '@/components/public/shared/PursuitCta';
import { StaffGrid } from '@/components/public/staff/StaffGrid';

export const metadata: Metadata = {
  title: 'Staffs | YAHAYASCHOOL',
  description: 'Our faculty members are more than educators; they are mentors.',
};

export default function StaffsPage() {
  const t = useTranslations('pageHeaders.staffs');

  return (
    <main className="min-h-screen bg-white">
      <PageHeader title={t('title')} subMaxWidth={700}>
        {t('description')}
      </PageHeader>

      <StaffGrid />

      <PursuitCta />
    </main>
  );
}

import React from 'react';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/public/shared/PageHeader';
import { PursuitCta } from '@/components/public/shared/PursuitCta';
import { StaffGrid } from '@/components/public/staff/StaffGrid';

export const metadata: Metadata = {
  title: 'Staffs | YAHAYASCHOOL',
  description: 'Our faculty members are more than educators; they are mentors.',
};

export default function StaffsPage() {
  return (
    <main className="min-h-screen bg-white">
      <PageHeader title="Staffs" subMaxWidth={700}>
        At Yahaya International, we blend the prestige of global academic rigor with deep-rooted
        spiritual leadership. Our faculty members are more than educators; they are mentors,
        researchers, and stewards of wisdom dedicated to shaping the leaders of tomorrow.
      </PageHeader>

      <StaffGrid />

      <PursuitCta />
    </main>
  );
}

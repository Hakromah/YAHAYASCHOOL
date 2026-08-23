import React from 'react';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/public/shared/PageHeader';
import { ContactSection, ContactMap } from '@/components/public/contact/ContactSection';

export const metadata: Metadata = {
  title: 'Contact | YAHAYASCHOOL',
  description:
    "We're here to answer your questions and guide your child's educational journey towards Modern Islamic Excellence.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <PageHeader title="Get in Touch" crumb="Contact">
        We&apos;re here to answer your questions and guide your child&apos;s educational journey
        towards Modern Islamic Excellence.
      </PageHeader>

      <ContactSection />

      <ContactMap />
    </main>
  );
}

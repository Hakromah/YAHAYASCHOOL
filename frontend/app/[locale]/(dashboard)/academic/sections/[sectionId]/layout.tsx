'use client';

import React from 'react';
import { SectionProvider } from '@/providers/SectionContext';

interface SectionWorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ sectionId: string }>;
}

export default function SectionWorkspaceLayout({
  children,
  params,
}: SectionWorkspaceLayoutProps) {
  const { sectionId } = React.use(params);
  return <SectionProvider sectionId={sectionId}>{children}</SectionProvider>;
}

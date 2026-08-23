import React from 'react';
import type { Metadata } from 'next';
import {
  GalleryHero,
  PhotoGrid,
  VideoHighlights,
  VisitCta,
} from '@/components/public/gallery/GallerySections';

export const metadata: Metadata = {
  title: 'Gallery | YAHAYASCHOOL',
  description:
    'Life at Yahaya International — photographs and films from across our campus and community.',
};

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-white">
      <GalleryHero />

      <PhotoGrid />

      <VideoHighlights />

      <VisitCta />
    </main>
  );
}

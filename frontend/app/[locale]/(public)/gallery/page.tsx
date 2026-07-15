import React from 'react';
import type { Metadata } from 'next';
import { cmsService } from '@/services/cms.service';
import { HomepageBuilder } from '@/components/public/HomepageBuilder';
import { Image as ImageIcon, Video, Calendar, Sparkles } from 'lucide-react';

interface GalleryPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('gallery', locale);

  return {
    title: page?.seo?.metaTitle || (locale === 'ar' ? 'معرض الصور والفيديو | يهايا سكول' : 'Campus Photo & Video Gallery | YAHAYASCOOL'),
    description: page?.seo?.metaDescription || 'Explore moments of student life, science fair exhibitions, Tahfidz graduation ceremonies, and modern campus architecture.',
  };
}

export default async function GalleryListingPage({ params }: GalleryPageProps) {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('gallery', locale);

  if (page?.sections && page.sections.length > 0) {
    return <HomepageBuilder sections={page.sections} locale={locale} />;
  }

  const items = await cmsService.getGalleryItems(locale);

  const fallbackItems: any[] = items && items.length > 0 ? items : [
    {
      id: 1,
      title: 'Annual Tahfidz Al-Qur\'an Graduation Ceremony',
      category: 'Events & Ceremonies',
      caption: 'Over 45 senior students receiving their Ijazah certification and Qur\'anic memorization diplomas in the main campus auditorium.',
    },
    {
      id: 2,
      title: 'Advanced Robotics & AI Olympiad Exhibition',
      category: 'Academic & STEM',
      caption: 'Senior high school physics and robotics students demonstrating their autonomous rover projects before international judges.',
    },
    {
      id: 3,
      title: 'Campus Mosque & Qur\'an Study Circles',
      category: 'Campus Facilities',
      caption: 'Daily morning revision circles and peaceful reflection inside the school\'s air-conditioned central Juma\'ah mosque.',
    },
    {
      id: 4,
      title: 'International Cambridge IGCSE Science Laboratories',
      category: 'Academic & STEM',
      caption: 'Fully equipped chemistry and biology research labs designed according to Cambridge Assessment international standards.',
    },
    {
      id: 5,
      title: 'Annual Inter-House Sports & Athletic Championship',
      category: 'Sports & Athletics',
      caption: 'Vibrant track and field competitions encouraging teamwork, physical endurance, and prophetic sportsmanship.',
    },
    {
      id: 6,
      title: 'Hostel Boarding & Student Residential Life',
      category: 'Campus Facilities',
      caption: 'Comfortable, safe, 24/7 supervised dormitories fostering brotherhood, disciplined routines, and evening mentorship.',
    },
  ];

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs sm:text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Visual Campus Chronicles</span>
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Photo & Video Gallery
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-3xl mx-auto font-light leading-relaxed">
            Step inside our vibrant campus community and witness academic dedication, scientific discovery, and spiritual growth in action.
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {fallbackItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-200/80 shadow-xs hover:shadow-xl transition-all group flex flex-col justify-between"
            >
              <div className="aspect-16/10 bg-emerald-900/10 relative overflow-hidden flex items-center justify-center text-emerald-800/40">
                <div className="text-center p-6 space-y-2">
                  <ImageIcon className="w-12 h-12 mx-auto text-emerald-700/60 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-wider block text-emerald-900">
                    {item.category || 'YAHAYASCOOL Visuals'}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                <div>
                  {item.category && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-700 border border-amber-300/40 mb-3">
                      {item.category}
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-emerald-950 mb-3 group-hover:text-emerald-800 transition-colors">
                    {item.title}
                  </h3>
                  {(item.description || item.caption) && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                      {item.description || item.caption}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

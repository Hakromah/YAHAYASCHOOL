import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { PlayCircle, ArrowRight, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Gallery | YAHAYASCHOOL',
  description: 'Life at Yahaya International Islamic and English High School',
};

export default function GalleryPage({ params: { locale = 'en' } }: { params: { locale?: string } }) {
  const getHref = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  const categories = ['All', 'Academic Excellence', 'Spiritual Life', 'Sports & Arts', 'Campus Facilities'];

  // Mocking an array of 9 items for the masonry-like grid
  const galleryItems = Array.from({ length: 9 }).map((_, i) => i + 1);

  return (
    <main className="min-h-screen bg-white">
      
      {/* Huge Hero Image */}
      <section className="relative w-full h-[50vh] min-h-[400px] bg-gray-200">
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-300">
          Graduation Celebration Hero Image
        </div>
      </section>

      {/* Gallery Grid Section */}
      <section className="py-20 bg-white">
        <Container>
          
          <div className="mb-10 text-center sm:text-left">
            <h2 className="text-4xl font-bold text-gray-900 font-serif mb-8">Life at Yahaya</h2>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Filters */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                {categories.map((cat, idx) => (
                  <button 
                    key={idx}
                    className={`px-5 py-2 rounded-full text-sm font-semibold border transition-colors ${
                      idx === 0 
                        ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] shadow-md' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#0ea5e9] hover:text-[#0ea5e9]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Play Videos Button */}
              <button className="shrink-0 flex items-center gap-2 px-6 py-2.5 bg-[#0ea5e9] text-white font-bold rounded-full hover:bg-sky-500 transition-colors shadow-md">
                <PlayCircle className="w-5 h-5" />
                <span>Play Videos</span>
              </button>
            </div>
          </div>

          {/* Grid */}
          {/* Note: using a standard CSS grid to approximate masonry for the mock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {galleryItems.map((item) => (
              <div 
                key={item} 
                className={`bg-gray-200 rounded-3xl overflow-hidden relative group cursor-pointer ${
                  item % 2 === 0 ? 'aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  Gallery Image {item}
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button className="px-8 py-3 bg-[#0ea5e9] text-white font-bold rounded-full hover:bg-sky-500 transition-colors shadow-md">
              Load More
            </button>
          </div>
        </Container>
      </section>

      {/* Video Highlights Section */}
      <section className="py-20 bg-[#0ea5e9] text-white overflow-hidden">
        <Container>
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold font-serif mb-4">Video Highlights</h2>
              <p className="text-sky-100 max-w-xl">
                Experience the vibrant energy and spirit of Yahaya International through our curated video collection.
              </p>
            </div>
            
            <div className="hidden sm:flex gap-4">
              <button className="w-10 h-10 rounded-full border border-white flex items-center justify-center hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-white text-[#0ea5e9] flex items-center justify-center hover:bg-sky-50 transition-colors shadow-md">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            {/* Main Video Player */}
            <div className="flex-[2] relative rounded-[40px] overflow-hidden bg-gray-900 aspect-video shadow-2xl border-4 border-white/10 group cursor-pointer">
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                Main Video Thumbnail
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
              
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-20 h-20 bg-[#0ea5e9] rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                  <PlayCircle className="w-10 h-10 text-white ml-1" />
                </div>
              </div>
            </div>

            {/* Video List */}
            <div className="flex-1 space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white rounded-2xl p-4 flex gap-4 hover:shadow-lg transition-shadow cursor-pointer border border-transparent hover:border-sky-200">
                  <div className="w-28 h-20 rounded-xl bg-gray-200 shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-sky-400 to-amber-200 opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">Student Testimonials</h4>
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                      Experience the vibrant energy and spirit of Yahaya International through our curated video collection.
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </Container>
      </section>

      {/* Experience Yahaya CTA */}
      <section className="py-24 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto bg-[#f8fcfb] rounded-[40px] p-12 text-center border border-gray-100 shadow-xl relative overflow-hidden">
            {/* Background decorative blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-sky-100 text-[#0ea5e9] flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8" />
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-gray-900 mb-4">
                Experience Yahaya International in Person
              </h2>
              
              <p className="text-gray-500 max-w-2xl mb-10 leading-relaxed">
                Visit our campus, meet our students and faculty, and see how we nurture excellence in both faith and knowledge.
              </p>
              
              <Link 
                href={getHref('/contact')}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#0ea5e9] text-white font-bold rounded-full hover:bg-sky-500 transition-colors shadow-md"
              >
                <span>Book a Campus Tour</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

    </main>
  );
}

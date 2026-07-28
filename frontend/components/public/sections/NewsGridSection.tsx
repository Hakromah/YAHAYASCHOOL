'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Container } from '@/components/ui/Container';

const newsData = [
  {
    id: 1,
    title: 'Expanding Our Horizons: New Office Opening',
    excerpt: 'We are thrilled to announce the opening of our newest innovation hub, designed to foster...',
    category: 'CORPORATE',
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80',
    link: '/news/expanding-horizons'
  },
  {
    id: 2,
    title: 'Innovation Through Collaboration: Our Annual Tech Summit',
    excerpt: 'This year\'s summit brought together the brightest minds in the industry to discuss the...',
    category: 'EVENTS',
    image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=600&q=80',
    link: '/news/tech-summit'
  },
  {
    id: 3,
    title: 'TrustVibe 2.0: Reimagining Security for the Modern Web',
    excerpt: 'Discover the next generation of our platform, featuring advanced threat detection and an...',
    category: 'EVENTS',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
    link: '/news/trustvibe-update'
  },
  {
    id: 4,
    title: 'Global Educational Standards and Modern Pedagogies',
    excerpt: 'Exploring how integrating worldwide educational standards empowers our students to compete globally...',
    category: 'CORPORATE',
    image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80',
    link: '/news/global-standards'
  },
  {
    id: 5,
    title: 'The Importance of Bilingual Education in Today\'s World',
    excerpt: 'Our bilingual programs offer unparalleled cognitive and social advantages. Read more about the benefits...',
    category: 'EVENTS',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    link: '/news/bilingual-education'
  }
];

export function NewsGridSection({ locale = 'en', data }: { locale?: string; data?: any }) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth;
      sliderRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  return (
    <section className="py-24 bg-[#FAFAFA] w-full">
      <Container>
        
        {/* Header with Navigation Arrows */}
        <div className="relative flex flex-col items-center max-w-4xl mx-auto mb-16 px-16">
          
          {/* Left Arrow */}
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-sky-200 flex items-center justify-center text-[#0ea5e9] hover:bg-sky-50 transition-colors z-10 bg-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 text-[#0ea5e9] text-sm font-semibold mb-6">
              <BookOpen className="w-4 h-4" />
              <span>News & Events</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Latest News & Updates
            </h2>
            
            <p className="text-slate-600 max-w-2xl mx-auto">
              Contribute to modern facilities and learning environments equipped with the latest educational technology. Contribute to modern facilities and learning environments equipped with the latest educational technology.
            </p>
          </div>
          
          {/* Right Arrow */}
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-[#0ea5e9] flex items-center justify-center text-[#0ea5e9] hover:bg-sky-50 transition-colors z-10 bg-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          
        </div>

        {/* News Cards Slider */}
        <div 
          ref={sliderRef}
          className="flex gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Inject a style tag to hide scrollbars for webkit */}
          <style dangerouslySetInnerHTML={{__html: `div::-webkit-scrollbar { display: none; }`}} />
          
          {newsData.map((item) => (
            <div key={item.id} className="snap-start shrink-0 min-w-[calc(100%-1rem)] md:min-w-[calc(50%-1.5rem)] lg:min-w-[calc(33.333%-1.5rem)] flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_4px_30px_rgba(0,0,0,0.06)] transition-shadow">
              {/* Image */}
              <div className="w-full aspect-[4/3] bg-slate-200 relative overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
              </div>
              
              {/* Content */}
              <div className="p-8 flex flex-col flex-grow">
                {/* Category Pill */}
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 rounded-full border border-sky-200 text-[#0ea5e9] text-[10px] font-bold tracking-widest uppercase">
                    {item.category}
                  </span>
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 leading-snug">
                  {item.title}
                </h3>
                
                <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">
                  {item.excerpt}
                </p>
                
                <Link
                  href={item.link}
                  className="inline-flex items-center gap-2 text-[#0ea5e9] text-sm font-semibold hover:text-sky-600 transition-colors mt-auto"
                >
                  <span>Read More</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </Container>
    </section>
  );
}

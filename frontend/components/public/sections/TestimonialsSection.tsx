'use client';

import React, { useState } from 'react';
import { Quote, Star } from 'lucide-react';
import { Container } from '@/components/ui/Container';

const testimonials = [
  {
    id: 1,
    name: 'Mia Thompson',
    role: 'PARENT',
    image: '/images/figma-home/01-hero.jpeg',
    fullImage: '/images/figma-home/01-hero.jpeg',
    title: 'A transformative experience for our child.',
    quote: '"Since enrolling our daughter at Yahaya International, we have seen remarkable growth not just in her academic performance but in her character. The seamless integration of Islamic values with rigorous modern education is exactly what we were looking for."',
    rating: 5
  },
  {
    id: 2,
    name: 'James Miller',
    role: 'ALUMNUS',
    image: '/images/figma-home/20-news.jpeg',
    fullImage: '/images/figma-home/20-news.jpeg',
    title: 'It highlights academic satisfaction, testimonials.',
    quote: '"My years at Yahaya International completely transformed my worldview. The attention to detail in the curriculum and the ease of access to mentors allowed me to maintain my faith identity while delivering world-class academic performance. It\'s not just a school; it\'s a competitive advantage."',
    rating: 5
  },
  {
    id: 3,
    name: 'Olivia Carter',
    role: 'COMMUNITY LEADER',
    image: '/images/figma-home/08-activity.jpeg',
    fullImage: '/images/figma-home/08-activity.jpeg',
    title: 'An institution built on true excellence.',
    quote: '"The leadership at Yahaya International demonstrates a profound commitment to educational excellence. I have witnessed firsthand how they nurture students into well-rounded individuals ready to tackle global challenges with moral integrity."',
    rating: 5
  },
  {
    id: 4,
    name: 'Matthew Bennett',
    role: 'PARENT',
    image: '/images/figma-home/14-news.jpeg',
    fullImage: '/images/figma-home/14-news.jpeg',
    title: 'The best decision we made.',
    quote: '"We evaluated many schools before choosing Yahaya International. The facilities are modern, the teachers are highly qualified, and the emphasis on both D\'awah and STEM makes it a unique and invaluable environment for our children."',
    rating: 5
  }
];

export function TestimonialsSection({ locale = 'en', data }: { locale?: string; data?: unknown }) {
  const [activeIndex, setActiveIndex] = useState(1); // Default to James Miller (index 1) to match design

  const activeTestimonial = testimonials[activeIndex];

  return (
    <section className="w-full">
      {/* Top Half: Blue Background */}
      <div className="bg-[#0d92d3] pt-16 pb-0">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Kind Words From Our Community
            </h2>
            <p className="text-sky-100 text-[15px] md:text-base leading-relaxed">
              Discover why thousands of families trust Yahaya International to elevate their children&apos;s educational journey and nurture their moral development.
            </p>
          </div>

          {/* Avatars Row */}
          <div className="flex flex-wrap items-end justify-center gap-4 sm:gap-8 lg:gap-12 px-4">
            {testimonials.map((t, idx) => {
              const isActive = activeIndex === idx;
              return (
                <div 
                  key={t.id}
                  onClick={() => setActiveIndex(idx)}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden mb-3 border-2 transition-all duration-300 ${isActive ? 'border-white scale-110' : 'border-transparent opacity-70 group-hover:opacity-100'}`}>
                    <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-sm font-semibold transition-colors duration-300 ${isActive ? 'text-white' : 'text-sky-200 group-hover:text-white'}`}>
                    {t.name}
                  </span>
                  {/* Active Indicator Line */}
                  <div className={`h-1 w-full mt-4 transition-colors duration-300 ${isActive ? 'bg-white' : 'bg-transparent'}`} />
                </div>
              );
            })}
          </div>
        </Container>
      </div>

      {/* Bottom Half: White Background */}
      <div className="bg-white py-14 md:py-18">
        <Container>
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-16">
            
            {/* Left: Big Image */}
            <div className="w-full md:w-2/5 shrink-0">
              <div className="aspect-square bg-slate-100 overflow-hidden relative rounded-sm">
                 <img 
                   src={activeTestimonial.fullImage} 
                   alt={activeTestimonial.name}
                   className="w-full h-full object-cover transition-opacity duration-500"
                   key={activeTestimonial.fullImage} // Force re-render for transition if needed, though simple replacement works
                 />
              </div>
            </div>

            {/* Right: Quote Details */}
            <div className="w-full md:w-3/5 flex flex-col">
              <Quote className="w-12 h-12 text-[#048ED6]/20 mb-6 shrink-0" fill="currentColor" />
              
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 leading-tight">
                {activeTestimonial.title}
              </h3>
              
              <div className="flex flex-col mb-8">
                <span className="text-xl font-bold text-slate-900">{activeTestimonial.name}</span>
                <span className="text-[#048ED6] text-xs font-bold tracking-widest uppercase mt-1">
                  {activeTestimonial.role}
                </span>
              </div>
              
              <p className="text-slate-600 text-lg italic leading-relaxed mb-8">
                {activeTestimonial.quote}
              </p>
              
              <div className="flex items-center gap-3">
                <div className="flex text-black">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < activeTestimonial.rating ? 'fill-current' : 'text-slate-300'}`} />
                  ))}
                </div>
                <span className="text-slate-500 text-sm font-medium">Verified Purchase</span>
              </div>
            </div>
            
          </div>
        </Container>
      </div>
    </section>
  );
}

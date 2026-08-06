'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { HeroSectionComponent } from '../../../types/cms.types';

interface HeroProps {
  data?: HeroSectionComponent;
  locale?: string;
}

export function HeroSection({ data, locale = 'en' }: HeroProps) {
  // Using default text based on the provided design if CMS data is missing
  const titlePart1 = "Education, Practice";
  const titlePart2 = "and Advocacy.";
  const description = data?.subtitle || "Yahaya International Islamic & English School blends the depth of traditional Islamic values with the rigorous standards of modern international education, fostering a nurturing environment for holistic student growth.";
  const ctaText = data?.primaryCtaText || "Start Application";
  const ctaUrl = data?.primaryCtaUrl || "/online-registration";
  
  const getHref = (url: string) => {
    if (url.startsWith('http') || url.startsWith('#')) return url;
    if (locale === 'en' || !locale) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return cleanUrl === '/' ? `/${locale}` : `/${locale}${cleanUrl}`;
  };

  return (
    <section className="relative w-full h-[min(760px,calc(100vh-100px))] min-h-[560px] flex flex-col justify-end overflow-hidden bg-gray-900">
      {/* Background Image (Using placeholder div that can be replaced with actual image) */}
      <div className="absolute inset-0 z-0">
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
        
        {/* Placeholder for the students image */}
        <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-500">
           {/* In a real scenario, use next/image here */}
           <div 
             className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
             style={{ backgroundImage: 'url("/images/figma-home/19.png")' }}
           />
        </div>
      </div>

      {/* Floating WhatsApp Icon */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
        <a 
          href="https://wa.me/23188368801" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-12 h-12 bg-white rounded-l-xl flex items-center justify-center text-green-500 shadow-xl hover:w-14 transition-all"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
        </a>
      </div>

      {/* Content Container */}
      <div className="relative z-20 w-full max-w-[1400px] mx-auto px-[clamp(1rem,4vw,4.5rem)] pb-28 lg:pb-36">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-12 lg:gap-8">
          
          {/* Left Column */}
          <div className="flex-1 w-full text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-[10px] font-bold mb-4">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="tracking-widest uppercase">EST. 2020</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.03] tracking-tight text-white drop-shadow-md">
              {titlePart1} <br />
              <span className="italic font-medium">{titlePart2}</span>
            </h1>
          </div>

          {/* Right Column */}
          <div className="flex-1 w-full lg:max-w-[350px] text-white">
            <p className="text-xs md:text-sm leading-relaxed mb-6 text-gray-100 drop-shadow-sm font-medium">
              {description}
            </p>
            
            <Link
              href={getHref(ctaUrl)}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white text-gray-900 font-bold text-xs hover:bg-gray-100 transition-colors shadow-xl"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>

      {/* Bottom Curve & Slider Dots */}
      <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none">
        <div className="relative w-full h-[120px] md:h-[160px] lg:h-[200px]">
          {/* White convex curve */}
          <svg 
            viewBox="0 0 1440 200" 
            className="absolute bottom-0 w-full h-full text-white fill-current" 
            preserveAspectRatio="none"
          >
            <path d="M0,200 L1440,200 L1440,100 Q720,0 0,100 Z" />
          </svg>
          
          {/* Slider Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto">
            <button aria-label="Slide 1" className="w-8 h-2.5 rounded-full bg-[#048ED6] transition-all" />
            <button aria-label="Slide 2" className="w-2.5 h-2.5 rounded-full border-2 border-[#048ED6]/30 hover:border-[#048ED6] transition-all" />
            <button aria-label="Slide 3" className="w-2.5 h-2.5 rounded-full border-2 border-[#048ED6]/30 hover:border-[#048ED6] transition-all" />
            <button aria-label="Slide 4" className="w-2.5 h-2.5 rounded-full border-2 border-[#048ED6]/30 hover:border-[#048ED6] transition-all" />
          </div>
        </div>
      </div>
    </section>
  );
}

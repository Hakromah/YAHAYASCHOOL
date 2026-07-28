'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';

export function HomeAnimationSection() {
  return (
    <section className="py-24 w-full bg-[#f4f7f9] overflow-hidden flex items-center justify-center min-h-[700px]">
      <Container>
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both delay-100">
            <p className="text-sm md:text-base font-semibold text-slate-900 tracking-wide">
              — Sahih al-Bukhari and Sahih Muslim
            </p>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out fill-mode-both delay-300">
            <span className="text-slate-900">Actions are </span>
            <span className="text-slate-400">judged by intentions, and every person will have only what they intended.</span>
          </h2>
          
          <div className="relative w-48 md:w-64 aspect-[3/4] animate-in fade-in slide-in-from-bottom-10 duration-1000 ease-out fill-mode-both delay-500">
             {/* We use a shadow and transform to give the book a 3D popping effect */}
             <div className="absolute inset-0 bg-[#064e43] rounded-sm shadow-[20px_20px_40px_rgba(0,0,0,0.2)] border border-[#086a5a] overflow-hidden transform hover:scale-105 hover:-translate-y-2 transition-transform duration-500 cursor-pointer">
                {/* Book spine detail */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#04362e] border-r border-[#032621]" />
                {/* Book gold border detail */}
                <div className="absolute inset-2 ml-5 border border-amber-500/60 rounded-sm" />
                {/* Pages edge at bottom */}
                <div className="absolute bottom-0 left-3 right-0 h-4 bg-[#f1f1e6] border-t border-[#d1d1c6]" />
             </div>
          </div>
          
        </div>
      </Container>
    </section>
  );
}

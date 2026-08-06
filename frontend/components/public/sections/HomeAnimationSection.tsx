'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';

export function HomeAnimationSection() {
  return (
    <section className="py-20 w-full bg-[#f1f9ff] overflow-hidden flex items-center justify-center min-h-[560px]">
      <Container>
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both delay-100">
            <p className="text-sm md:text-base font-semibold text-slate-900 tracking-wide">
              — Sahih al-Bukhari and Sahih Muslim
            </p>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out fill-mode-both delay-300">
            <span className="text-slate-900">Actions are </span>
            <span className="text-slate-400">judged by intentions, and every person will have only what they intended.</span>
          </h2>
          
          <div className="relative w-40 md:w-52 aspect-square animate-in fade-in slide-in-from-bottom-10 duration-1000 ease-out fill-mode-both delay-500">
             <img src="/images/figma-home/05-book.png" alt="Qur'an" className="h-full w-full object-contain drop-shadow-2xl" />
          </div>
          
        </div>
      </Container>
    </section>
  );
}

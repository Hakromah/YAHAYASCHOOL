'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, GraduationCap, BookOpen, Heart, Laptop } from 'lucide-react';
import { Container } from '@/components/ui/Container';

const programsData = [
  {
    id: 'arabic',
    title: 'Arabic Programs',
    description: 'Contribute to modern facilities and learning environments equipped with the latest educational technology. Contribute to modern facilities and learning environments equipped with the latest educational technology.',
    icon: <BookOpen className="w-5 h-5" />,
    image: '/images/figma-home/17.png',
    link: '/programs/arabic'
  },
  {
    id: 'english',
    title: 'English Programs',
    description: 'Immerse in an environment where language skills flourish. Our English programs are designed to build confidence, fluency, and a deep understanding of global literature and communication.',
    icon: <GraduationCap className="w-5 h-5" />,
    image: '/images/figma-home/19.png',
    link: '/programs/english'
  },
  {
    id: 'dawah',
    title: 'D\'awah Programs',
    description: 'Develop a strong foundation in Islamic theology and the principles of inviting others to the beautiful teachings of Islam through wisdom and excellent preaching.',
    icon: <Heart className="w-5 h-5" />,
    image: '/images/figma-home/03-programs.jpeg',
    link: '/programs/dawah'
  },
  {
    id: 'online',
    title: 'Online learning Programs',
    description: 'Access our world-class curriculum from anywhere. Flexible, engaging, and interactive online modules tailored for modern students seeking excellence from home.',
    icon: <Laptop className="w-5 h-5" />,
    image: '/images/figma-home/04-programs.jpeg',
    link: '/online-learning'
  }
];

export function ProgramsGridSection({ locale = 'en', data }: { locale?: string; data?: unknown }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="py-20 bg-white w-full overflow-hidden">
      <Container>
        {/* Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 text-[#048ED6] text-sm font-semibold mb-6">
            <GraduationCap className="w-4 h-4" />
            <span>Our Programs</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Explore Our Programs
          </h2>
          
          <p className="text-slate-600 text-sm">
            Curriculum programs designed to inspire a lifelong love of learning and build meaningful futures.
          </p>
        </div>

        {/* Content Split */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          
          {/* Left Column: Accordion List */}
          <div className="flex-1 w-full flex flex-col">
            {programsData.map((prog, idx) => {
              const isActive = activeIndex === idx;
              return (
                <div 
                  key={prog.id} 
                  className={`flex flex-col py-6 border-b border-slate-100 cursor-pointer transition-all ${isActive ? 'pb-8' : 'hover:bg-slate-50'}`}
                  onClick={() => setActiveIndex(idx)}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-sky-50 flex items-center justify-center text-[#048ED6]">
                      {prog.icon}
                    </div>
                    <h3 className={`text-3xl font-bold transition-colors ${isActive ? 'text-slate-900' : 'text-slate-900'}`}>
                      {prog.title}
                    </h3>
                  </div>
                  
                  {/* Expandable Content */}
                  <div 
                    className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isActive ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="overflow-hidden">
                      <div className="pt-6 pl-20">
                        <p className="text-slate-600 text-[15px] leading-relaxed mb-6">
                          {prog.description}
                        </p>
                        <Link
                          href={prog.link}
                          className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#048ED6] text-white text-sm font-semibold rounded-full hover:bg-sky-500 transition-colors shadow-md"
                        >
                          <span>Learn More</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Image Accordion */}
          <div className="flex-1 w-full h-[480px] flex flex-col gap-3">
            {programsData.map((prog, idx) => {
              const isActive = activeIndex === idx;
              return (
                <div 
                  key={prog.id}
                  className={`relative w-full rounded-2xl overflow-hidden transition-all duration-700 ease-in-out cursor-pointer ${isActive ? 'flex-grow h-auto shadow-xl' : 'h-16 shrink-0 opacity-70 hover:opacity-100'}`}
                  onClick={() => setActiveIndex(idx)}
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${prog.image})` }}
                  />
                  {/* Optional: Add a dark overlay to inactive items if desired, but design shows them clear just thin */}
                </div>
              );
            })}
          </div>
          
        </div>
      </Container>
    </section>
  );
}

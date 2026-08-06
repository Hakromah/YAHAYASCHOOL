import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { ChevronRight, ArrowRight, BookOpen, Zap, ShieldCheck, Award, Compass } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Academic Programs | YAHAYASCHOOL',
  description: 'Rigorous academics, Islamic character, and global readiness.',
};

export default function ProgramsPage({ params: { locale = 'en' } }: { params: { locale?: string } }) {
  const getHref = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  const programs = [
    { id: 1, title: 'Qur\'an Memorization', desc: 'Guided Hifz program with tajweed, understanding, and character building—rooted in love for the Qur\'an.' },
    { id: 2, title: 'Arabic Immersion', desc: 'Comprehensive language acquisition enabling students to engage deeply with classical texts and modern dialogue.' },
    { id: 3, title: 'STEM & Robotics', desc: 'Hands-on scientific inquiry and programming skills that prepare students for competitive technical fields.' },
    { id: 4, title: 'Islamic Studies', desc: 'In-depth exploration of Fiqh, Aqeedah, and Seerah to build a strong foundational worldview.' },
    { id: 5, title: 'Humanities & Arts', desc: 'Critical thinking through history, literature, and social sciences from both global and Islamic perspectives.' },
    { id: 6, title: 'Global Leadership', desc: 'Mentorship, public speaking, and community service projects designed to nurture confident future leaders.' },
  ];

  return (
    <main className="min-h-screen bg-[#fafafa]">
      
      {/* Hero Section */}
      <section className="pt-8 pb-16 lg:pt-16 lg:pb-24 overflow-hidden relative">
        <Container>
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 relative z-10">
            <div className="flex-1 space-y-6 pt-10">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href={getHref('/')} className="hover:text-[#048ED6] transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">Academics</span>
              </div>
              
              <span className="text-[#048ED6] text-xs font-bold tracking-[0.2em] uppercase block">
                Learning with Purpose
              </span>
              
              <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold text-gray-900 leading-[1.05] font-serif">
                Knowledge Rooted in Faith. <br />
                <span className="italic text-[#048ED6]">Excellence Built for Life.</span>
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                Rigorous academics, Islamic character, and global readiness— nurturing curious minds and compassionate hearts to lead with purpose and confidence.
              </p>
            </div>
            
            {/* Hero Image area */}
            <div className="flex-1 relative w-full mt-10 lg:mt-0">
              {/* Background shape */}
              <div className="absolute top-0 right-0 bottom-0 left-10 bg-[#e0f2fe] rounded-l-[120px] rounded-r-3xl -z-10 transform scale-110 translate-x-10 translate-y-10" />
              
              <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl border-4 border-white">
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500">
                  Students collaborating
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Programs Grid */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {programs.map((program) => (
              <div key={program.id} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="aspect-[16/10] relative overflow-hidden bg-gray-200">
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center text-gray-400 text-sm">
                    Campus Night Image
                  </div>
                  {/* Badge */}
                  <div className="absolute top-4 left-4 w-10 h-10 bg-[#048ED6] rounded-xl flex items-center justify-center text-white shadow-lg z-10">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-1 text-[#048ED6] text-sm font-semibold mb-3 group-hover:gap-2 transition-all">
                    <span>Explore Program</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 font-serif">{program.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-8 flex-1">
                    {program.desc}
                  </p>
                  <Link 
                    href={getHref(`/departments/quran`)} 
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#048ED6] text-white text-sm font-bold w-fit hover:bg-sky-500 transition-colors shadow-md"
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

      {/* Our Approach Section */}
      <section className="py-24 bg-[#fafafa]">
        <Container>
          <div className="text-center mb-16">
            <span className="text-[#048ED6] text-xs font-bold tracking-[0.2em] uppercase block mb-4">
              Our Approach
            </span>
            <h2 className="text-4xl font-bold text-gray-900 font-serif">How Learning Comes to Life</h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-16 items-center">
            {/* Left Image & Stats */}
            <div className="flex-1 relative w-full max-w-2xl mx-auto">
              <div className="aspect-[4/3] rounded-[40px] overflow-hidden bg-gray-200 relative shadow-xl">
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  Classroom Image
                </div>
              </div>
              
              {/* Floating Stat Card */}
              <div className="absolute -bottom-10 right-4 lg:-right-10 bg-[#048ED6] text-white p-8 rounded-3xl shadow-2xl max-w-[240px]">
                <div className="text-5xl font-light mb-2">98%</div>
                <div className="text-xs font-bold tracking-wider leading-relaxed">
                  UNIVERSITY PLACEMENT RATE FOR OUR GRADUATES
                </div>
              </div>
            </div>

            {/* Right List */}
            <div className="flex-1 space-y-10 mt-16 lg:mt-0 lg:pl-10">
              
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-[#048ED6] flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Academic Rigor</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Challenging curriculum and high expectations that inspire deep understanding and excellence in every subject.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-[#048ED6] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Faith & Character</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Islamic values are woven into daily learning to nurture integrity, compassion, and a sense of purpose.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-[#048ED6] flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Mentorship</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Caring teachers guide each student through personalized support and meaningful relationships beyond the textbook.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-[#048ED6] flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Real-World Discovery</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Experiential projects, fieldwork, and technology connect classroom learning to the world around us.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </Container>
      </section>

    </main>
  );
}

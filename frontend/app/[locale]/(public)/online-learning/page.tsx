'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { ChevronRight, ArrowRight, PlayCircle, Book, Video, Zap, ShieldCheck, Award, Compass } from 'lucide-react';
import { EnrollmentModal } from '@/components/public/EnrollmentModal';

export default function OnlineLearningPage({ params: { locale = 'en' } }: { params: { locale?: string } }) {
  const getHref = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const courses = [
    { id: 1, title: 'Advanced Arabic Grammar', category: 'LANGUAGES', level: 'ADVANCED', isNew: true, desc: 'An intensive study into classical Nahw and Sarf for profound textual understanding.' },
    { id: 2, title: 'Foundations of Fiqh', category: 'ISLAMIC STUDIES', level: 'BEGINNER', isNew: false, desc: 'Learn the basic principles of Islamic jurisprudence and daily rulings.' },
    { id: 3, title: 'Tajweed Mastery', category: 'QURAN', level: 'INTERMEDIATE', isNew: true, desc: 'Perfect your recitation with detailed articulation points and characteristics of letters.' },
    { id: 4, title: 'Seerah of the Prophet', category: 'HISTORY', level: 'ALL LEVELS', isNew: false, desc: 'A comprehensive journey through the life of Prophet Muhammad (PBUH).' },
    { id: 5, title: 'Contemporary Dawah', category: 'LEADERSHIP', level: 'ADVANCED', isNew: true, desc: 'Equipping students with modern tools and methodologies for effective communication.' },
    { id: 6, title: 'Spiritual Purification', category: 'TAZKIYAH', level: 'INTERMEDIATE', isNew: false, desc: 'Purifying the heart from spiritual diseases based on classical texts.' },
  ];

  return (
    <main className="min-h-screen bg-[#fafafa]">
      
      {/* Hero Section */}
      <section className="pt-8 pb-16 lg:pt-16 lg:pb-24 overflow-hidden relative">
        <Container>
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 relative z-10">
            <div className="flex-1 space-y-6 pt-10">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href={getHref('/')} className="hover:text-[#0ea5e9] transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">Online Learning</span>
              </div>
              
              <span className="text-[#0ea5e9] text-xs font-bold tracking-[0.2em] uppercase block">
                Learning with Purpose
              </span>
              
              <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold text-gray-900 leading-[1.05] font-serif">
                Knowledge at Your <br />
                <span className="text-[#0ea5e9]">Fingertips</span>
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                Access world-class Islamic and academic education from anywhere in the world. Begin your journey of lifelong learning today.
              </p>

              <div className="pt-4">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#0ea5e9] text-white font-bold hover:bg-sky-500 transition-colors shadow-md"
                >
                  <span>Join Enrollment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Hero Image area */}
            <div className="flex-1 relative w-full mt-10 lg:mt-0">
              <div className="absolute top-0 right-0 bottom-0 left-10 bg-[#e0f2fe] rounded-l-[120px] rounded-r-3xl -z-10 transform scale-110 translate-x-10 translate-y-10" />
              
              <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl border-4 border-white">
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500">
                  Online Learning Image
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Feature Cards Grid */}
      <section className="pb-20 relative z-20">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 -mt-10 lg:-mt-20">
            {/* Card 1 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0ea5e9] flex items-center justify-center mb-6">
                <PlayCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recorded Lessons</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                A comprehensive library of high-definition video lectures across all academic and Islamic subjects.
              </p>
              <button className="flex items-center gap-1 text-[#0ea5e9] font-bold text-sm hover:text-sky-600">
                <span>Browse Library</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0ea5e9] flex items-center justify-center mb-6">
                <Book className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Digital Library</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Access curated PDF books, Qur'an resources, and exclusive scholarly articles.
              </p>
              <button className="flex items-center gap-1 text-[#0ea5e9] font-bold text-sm hover:text-sky-600">
                <span>Enter Library</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0ea5e9] flex items-center justify-center mb-6">
                <Video className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Live Classes</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Engage in real-time interactive sessions with our global expert faculty members.
              </p>
              <button className="flex items-center gap-1 text-[#0ea5e9] font-bold text-sm hover:text-sky-600">
                <span>View Schedule</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* Courses Grid */}
      <section className="py-16 bg-[#fafafa]">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {courses.map(course => (
              <div key={course.id} className="bg-white rounded-3xl p-6 flex flex-col sm:flex-row gap-6 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
                {/* Course Image */}
                <div className="w-full sm:w-48 h-40 shrink-0 rounded-2xl bg-gray-200 overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs text-center p-2">
                    Quran / Book Image
                  </div>
                </div>
                
                {/* Course Content */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#0ea5e9] text-xs font-bold tracking-wider">
                        {course.category} • {course.level}
                      </span>
                      {course.isNew && (
                        <span className="px-2.5 py-1 bg-sky-50 text-[#0ea5e9] text-[10px] font-bold uppercase rounded-md tracking-wider">
                          New Release
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-serif leading-tight">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                      {course.desc}
                    </p>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0ea5e9] text-white text-sm font-bold hover:bg-sky-500 transition-colors shadow-md"
                    >
                      <span>Join Enrollment</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Our Approach Section */}
      <section className="py-24 bg-white">
        <Container>
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            {/* Left Image & Stats */}
            <div className="flex-1 relative w-full max-w-2xl mx-auto">
              <div className="aspect-[4/3] rounded-[40px] overflow-hidden bg-gray-200 relative shadow-xl">
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  Classroom Image
                </div>
              </div>
              <div className="absolute -bottom-10 right-4 lg:-right-10 bg-[#0ea5e9] text-white p-8 rounded-3xl shadow-2xl max-w-[240px]">
                <div className="text-5xl font-light mb-2">98%</div>
                <div className="text-xs font-bold tracking-wider leading-relaxed">
                  UNIVERSITY PLACEMENT RATE FOR OUR GRADUATES
                </div>
              </div>
            </div>

            {/* Right List */}
            <div className="flex-1 space-y-10 mt-16 lg:mt-0 lg:pl-10">
              <div className="mb-10">
                <span className="text-[#0ea5e9] text-xs font-bold tracking-[0.2em] uppercase block mb-4">
                  Our Approach
                </span>
                <h2 className="text-4xl font-bold text-gray-900 font-serif">How Learning Comes to Life</h2>
              </div>
              
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-[#0ea5e9] flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Academic Rigor</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Challenging curriculum and high expectations that inspire deep understanding.</p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-[#0ea5e9] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Faith & Character</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Islamic values are woven into daily learning to nurture integrity.</p>
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-sky-100 text-[#0ea5e9] flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Mentorship</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Caring teachers guide each student through personalized support.</p>
                </div>
              </div>

            </div>
          </div>
        </Container>
      </section>

      {/* Render the Modal */}
      <EnrollmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </main>
  );
}

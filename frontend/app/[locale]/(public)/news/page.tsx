import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { ChevronRight, ArrowRight, ArrowLeft, Calendar, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'News, Events & Community | YAHAYASCHOOL',
  description: 'Discover the latest happenings at Yahaya International.',
};

export default function NewsListingPage({ params: { locale = 'en' } }: { params: { locale?: string } }) {
  const getHref = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  const articles = [
    { id: 1, title: 'Annual Science & Tech Fair 2024', category: 'EVENTS', date: 'Oct 24, 2024', desc: 'Students showcased ingenuity during the 15th Annual Science & Technology Fair.', slug: 'science-tech-fair-2024' },
    { id: 2, title: 'New Memorization Hub Opening', category: 'NEWS', date: 'Sep 12, 2024', desc: 'We are thrilled to announce the opening of our new dedicated Hifz learning center.', slug: 'new-memorization-hub' },
    { id: 3, title: 'Innovation Through Collaboration', category: 'EVENTS', date: 'Aug 05, 2024', desc: 'This year\'s summit brought together the brightest minds in the industry to discuss...', slug: 'innovation-summit' },
    { id: 4, title: 'Reimagining Digital Security', category: 'NEWS', date: 'Jul 20, 2024', desc: 'Discover the next generation of our platform featuring advanced cyber protocols.', slug: 'digital-security' },
    { id: 5, title: 'Community Dawah Initiative', category: 'D\'AWAH', date: 'Jun 18, 2024', desc: 'Our senior students led a community outreach program spanning three neighborhoods.', slug: 'community-dawah' },
    { id: 6, title: 'Excellence Awards 2024', category: 'EVENTS', date: 'May 10, 2024', desc: 'Recognizing outstanding academic and character achievements among our students.', slug: 'excellence-awards' },
  ];

  const categories = ['All', 'News', 'Events', 'D\'awah'];

  return (
    <main className="min-h-screen bg-[#fafafa]">
      
      {/* Hero Section */}
      <section className="pt-8 pb-16 lg:pt-16 lg:pb-24 overflow-hidden relative">
        <Container>
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8 relative z-10">
            {/* Left Content */}
            <div className="flex-1 space-y-6 pt-10">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href={getHref('/')} className="hover:text-[#048ED6] transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">News</span>
              </div>
              
              <span className="text-[#048ED6] text-xs font-bold tracking-[0.2em] uppercase block">
                School Stories
              </span>
              
              <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold text-gray-900 leading-[1.05] font-serif">
                News, Events & <br /> Community
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed max-w-md">
                Discover the latest happenings at Yahaya International. From academic achievements to spiritual milestones, our stories reflect our commitment to faith, learning and character.
              </p>

              <div className="pt-4">
                <Link 
                  href={getHref('/news/science-tech-fair-2024')} 
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#048ED6] text-white font-bold hover:bg-sky-500 transition-colors shadow-md"
                >
                  <span>Read More</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Pagination controls for Hero Slider */}
              <div className="flex items-center gap-4 pt-12">
                <button className="w-10 h-10 rounded-full border border-[#048ED6] text-[#048ED6] flex items-center justify-center hover:bg-sky-50 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-full bg-[#048ED6] text-white flex items-center justify-center hover:bg-sky-500 transition-colors shadow-md">
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="flex-1 h-[1px] bg-sky-200 ml-4 max-w-xs"></div>
              </div>
            </div>
            
            {/* Hero Image area with overlapping event card */}
            <div className="flex-1 relative w-full mt-10 lg:mt-0 lg:ml-10">
              <div className="absolute top-0 right-0 bottom-0 left-10 bg-[#e0f2fe] rounded-l-[120px] rounded-r-3xl -z-10 transform scale-110 translate-x-10 translate-y-10" />
              
              <div className="relative aspect-[4/3] rounded-l-[40px] rounded-r-none lg:rounded-l-[80px] overflow-hidden shadow-2xl border-4 border-r-0 border-white ml-auto w-[90%] lg:w-full">
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500">
                  Students working on Robotics
                </div>
              </div>

              {/* Overlapping Event Card */}
              <div className="absolute -bottom-10 -left-10 lg:-left-20 bg-white p-8 rounded-3xl shadow-2xl w-[320px] z-20 border border-gray-100">
                <div className="flex gap-6 mb-4">
                  <div className="text-center shrink-0">
                    <span className="block text-[#048ED6] font-bold text-sm uppercase">Jul</span>
                    <span className="block text-4xl font-light text-gray-900 mt-1">15</span>
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-[#048ED6] uppercase tracking-wider mb-2 inline-block">
                      Ceremony
                    </span>
                    <h4 className="font-bold text-gray-900 font-serif text-lg leading-tight">
                      Graduation Ceremony
                    </h4>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>10:00 AM - 1:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Main Auditorium</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Join us as we celebrate the achievements of our graduating class.
                </p>

                <Link href={getHref('/news/graduation-2024')} className="flex items-center gap-1 text-[#048ED6] text-sm font-bold hover:text-sky-600 transition-colors">
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </div>
        </Container>
      </section>

      {/* Filter Pills */}
      <section className="pt-20 pb-10">
        <Container>
          <div className="flex flex-wrap items-center gap-3">
            {categories.map((cat, idx) => (
              <button 
                key={idx}
                className={`px-6 py-2 rounded-full text-sm font-bold border transition-colors ${
                  idx === 0 
                    ? 'bg-[#048ED6] text-white border-[#048ED6] shadow-md' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#048ED6] hover:text-[#048ED6]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* News Grid */}
      <section className="pb-24">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <div key={article.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
                {/* Image */}
                <div className="aspect-[16/10] bg-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                    Article Image
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-white border border-[#048ED6] text-[#048ED6] uppercase tracking-wider">
                      {article.category}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {article.date}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 font-serif group-hover:text-[#048ED6] transition-colors">
                    <Link href={getHref(`/news/${article.slug}`)} className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      {article.title}
                    </Link>
                  </h3>
                  
                  <p className="text-gray-600 text-sm leading-relaxed flex-1">
                    {article.desc}
                  </p>
                  
                  <div className="mt-6 flex items-center gap-1 text-[#048ED6] text-sm font-bold group-hover:gap-2 transition-all">
                    <span>Read More</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

    </main>
  );
}

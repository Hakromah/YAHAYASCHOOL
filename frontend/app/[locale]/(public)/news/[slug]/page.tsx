import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { ArrowLeft, Calendar, ArrowRight, CheckCircle2, Mail } from 'lucide-react';

interface ArticleDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: ArticleDetailProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Annual Science & Tech Fair 2024 | YAHAYASCHOOL`,
    description: 'Pioneering Sustainable Innovations',
  };
}

export default async function ArticleDetailPage({ params }: ArticleDetailProps) {
  const { locale, slug } = await params;

  const getHref = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  return (
    <main className="min-h-screen bg-white pb-24">
      
      {/* Huge Hero Image Section */}
      <section className="relative w-full h-[60vh] min-h-[500px] bg-gray-900">
        {/* Background Image Placeholder */}
        <div className="absolute inset-0 bg-gray-700 overflow-hidden">
          {/* Overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10" />
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-0">
            Full Width Hero Image
          </div>
        </div>

        <Container className="relative z-20 h-full flex flex-col justify-end pb-16">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-8">
            
            {/* Title Area */}
            <div className="flex-1 max-w-3xl">
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-6">
                <Link href={getHref('/')} className="hover:text-white transition-colors">Home</Link>
                <ArrowRight className="w-3.5 h-3.5" />
                <Link href={getHref('/news')} className="hover:text-white transition-colors">News</Link>
                <ArrowRight className="w-3.5 h-3.5" />
                <span className="text-gray-100 font-medium">News-details</span>
              </div>
              
              <div className="flex items-center gap-2 text-amber-400 font-medium text-sm mb-4">
                <Calendar className="w-4 h-4" />
                <span>October 24, 2024</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight font-serif">
                Annual Science & Tech Fair 2024: Pioneering Sustainable Innovations
              </h1>
            </div>

            {/* Overlaid Event Card */}
            <div className="w-[300px] bg-[#048ED6] text-white p-8 rounded-3xl shadow-2xl relative translate-y-24 shrink-0 hidden lg:block border border-sky-400">
              <h3 className="font-bold text-xl mb-6">Next Event</h3>
              <div className="flex gap-4 mb-8">
                <div className="bg-white text-[#048ED6] rounded-xl p-3 text-center shrink-0">
                  <span className="block font-bold text-xs uppercase">Jul</span>
                  <span className="block text-2xl font-bold mt-0.5">15</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight mb-1">
                    Graduation Ceremony
                  </h4>
                  <span className="text-xs text-sky-100 font-medium">10:00 AM - 1:00 PM</span>
                </div>
              </div>
              <button className="w-full py-3 bg-white text-[#048ED6] rounded-full font-bold text-sm hover:bg-sky-50 transition-colors flex items-center justify-center gap-2">
                <span>Apply Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </Container>
      </section>

      {/* Main Content Area */}
      <section className="pt-16 lg:pt-32">
        <Container>
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
            
            {/* Left Content Column */}
            <div className="flex-1 max-w-3xl">
              
              <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
                <p>
                  The atmosphere at Yahaya International was electric this past week as students from all grades showcased their ingenuity during the 15th Annual Science & Technology Fair.
                </p>
                <p>
                  This year's theme, "Sustainability Through Innovation," challenged our young minds to create solutions for real-world environmental issues.
                </p>

                <h2 className="text-2xl font-bold text-[#048ED6] font-serif pt-4">
                  Bridging Tradition with Modernity
                </h2>
                
                <p>
                  From solar-powered water filtration systems to AI-driven waste sorting algorithms, the projects displayed a deep understanding of complex scientific principles. "Our goal is not just to teach science, but to cultivate a mindset of ethical problem-solving," noted Principal Ahmed during his opening address.
                </p>

                <blockquote className="border-l-4 border-[#048ED6] bg-sky-50 p-6 rounded-r-xl my-8">
                  <p className="text-[#048ED6] text-lg font-medium m-0 leading-relaxed italic">
                    "Science without conscience is but the ruin of the soul. At Yahaya, we ensure our students understand that every technological advancement must serve humanity and preserve our planet."
                  </p>
                </blockquote>

                <h3 className="text-xl font-bold text-[#048ED6] font-serif pt-4">
                  Key Highlights of the Fair
                </h3>

                <ul className="space-y-4 list-none pl-0">
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[#048ED6] shrink-0 mt-0.5" />
                    <p className="m-0"><strong className="text-gray-900">The Smart Irrigation Project:</strong> Grade 11 students developed a sensor-based system that reduces campus water usage by 40%.</p>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[#048ED6] shrink-0 mt-0.5" />
                    <p className="m-0"><strong className="text-gray-900">Renewable Energy Models:</strong> A competitive category featuring experimental designs for vertical-axis wind turbines.</p>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[#048ED6] shrink-0 mt-0.5" />
                    <p className="m-0"><strong className="text-gray-900">Inter-School Robotics Challenge:</strong> Yahaya students secured the first position against six regional competitors.</p>
                  </li>
                </ul>

                <div className="my-10 aspect-video rounded-3xl overflow-hidden bg-gray-200 relative shadow-md border border-gray-100">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Students looking at project
                  </div>
                </div>

                <p>
                  As we look forward to the next semester, the school plans to integrate the winning water filtration project into our standard facilities, providing a tangible legacy for this year's participants. We congratulate all students for their hard work and dedication to excellence.
                </p>

              </div>

              {/* Tags */}
              <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-2">
                {['#ScienceFair2024', '#StudentExcellence', '#Innovation', '#YahayaInternational'].map((tag, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded border border-gray-200">
                    {tag}
                  </span>
                ))}
              </div>

            </div>

            {/* Right Sidebar Column */}
            <div className="w-full lg:w-[320px] shrink-0 space-y-8">
              
              {/* Box 1 */}
              <div className="bg-[#f8fcfb] p-8 rounded-3xl border border-gray-100 text-center">
                <h3 className="text-2xl font-serif text-gray-900 italic font-medium mb-4">
                  In Pursuit of <br /> Exceptional Education
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-8">
                  Our faculty recruitment follows a rigorous selection process, ensuring every teacher embodies our values of excellence, integrity, and lifelong learning.
                </p>
                <div className="flex flex-col gap-3">
                  <button className="w-full py-3 bg-[#048ED6] text-white rounded-full font-bold text-sm shadow-md hover:bg-sky-500 transition-colors">
                    Join Our School
                  </button>
                  <Link href={getHref('/news')} className="w-full py-3 bg-[#048ED6] text-white rounded-full font-bold text-sm shadow-md hover:bg-sky-500 transition-colors block text-center">
                    Return to the News
                  </Link>
                </div>
              </div>

              {/* Box 2 */}
              <div className="bg-white p-8 rounded-3xl border border-[#048ED6] shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">Stay Updated</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-6">
                  Get the latest school news and event reminders straight to your inbox.
                </p>
                <form className="space-y-4">
                  <div className="relative">
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#048ED6] focus:ring-1 focus:ring-[#048ED6] text-sm"
                    />
                  </div>
                  <button className="w-full py-3 bg-[#048ED6] text-white rounded-xl font-bold text-sm shadow-md hover:bg-sky-500 transition-colors">
                    Subscribe
                  </button>
                </form>
              </div>

            </div>

          </div>
        </Container>
      </section>

    </main>
  );
}

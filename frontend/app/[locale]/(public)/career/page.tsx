import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { ChevronRight, ArrowRight, UploadCloud, Send, ChevronDown } from 'lucide-react';
import { CareerAccordion } from '@/components/public/CareerAccordion';

export const metadata: Metadata = {
  title: 'Career | YAHAYASCHOOL',
  description: 'Join our mission of nurturing global leadership.',
};

export default function CareerPage({ params: { locale = 'en' } }: { params: { locale?: string } }) {
  const getHref = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  const positions = [
    {
      id: 'arabic-instructor',
      title: 'Arabic Language Instructor',
      type: 'Full-time',
      location: 'Main Campus',
      requirements: [
        'Bachelor\'s degree in Arabic Language or Education.',
        '3+ years of proven teaching experience in international schools.',
        'Full fluency in Arabic and English (Written & Spoken).'
      ],
      responsibilities: [
        'Curriculum development for modern Arabic learning.',
        'Dynamic classroom management for diverse student needs.',
        'Continuous student assessment and reporting.'
      ]
    },
    {
      id: 'admin-officer',
      title: 'Administrative Officer',
      type: 'Full-time',
      location: 'Main Campus',
      requirements: [
        'Bachelor\'s degree in Business Administration.',
        'Excellent organizational and communication skills.',
        'Proficiency in standard office software.'
      ],
      responsibilities: [
        'Manage daily administrative operations.',
        'Support faculty and staff with operational needs.',
        'Maintain accurate records and documentation.'
      ]
    },
    {
      id: 'math-specialist',
      title: 'Mathematics Specialist (IB)',
      type: 'Full-time',
      location: 'Main Campus',
      requirements: [
        'Master\'s degree in Mathematics or related field.',
        'IB certification and experience teaching IB Math.',
        'Strong pedagogical skills and student-centered approach.'
      ],
      responsibilities: [
        'Deliver high-quality IB Mathematics instruction.',
        'Develop engaging lesson plans and assessments.',
        'Provide mentorship and support to students.'
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-white pb-24">
      
      {/* Hero Section with Background Image */}
      <section className="relative w-full py-24 min-h-[500px] flex items-center bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500">
            Career Hero Image (Teachers/Staff)
          </div>
        </div>

        <Container className="relative z-20">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
              <Link href={getHref('/')} className="hover:text-[#048ED6] transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href={getHref('/about')} className="hover:text-[#048ED6] transition-colors">About</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#048ED6] font-medium">Career</span>
            </div>
            
            <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-bold text-gray-900 leading-[1.1] font-serif mb-6">
              Empowering Minds, <br />
              <span className="text-[#048ED6]">Enriching Souls</span>
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              At Yahaya International, we blend centuries of Islamic wisdom with modern academic rigor. We seek visionary educators and staff who are committed to nurturing the next generation of global leaders.
            </p>

            <a 
              href="#open-positions"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#048ED6] text-white font-bold rounded-full hover:bg-sky-500 transition-colors shadow-md"
            >
              <span>APPLY NOW</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </Container>
      </section>

      {/* Available Positions */}
      <section id="open-positions" className="py-20 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="mb-10 text-center sm:text-left">
              <h2 className="text-3xl font-bold text-gray-900 font-serif mb-2">Available Positions</h2>
              <p className="text-gray-600 text-sm">Join our mission of nurturing global leadership.</p>
            </div>
            
            <CareerAccordion positions={positions} />
          </div>
        </Container>
      </section>

      {/* Application Form Section */}
      <section id="application-form" className="mt-10 relative overflow-hidden bg-gray-100 py-24">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0 flex">
          {/* Left side white gradient overlay */}
          <div className="w-1/2 bg-white hidden lg:block z-10" />
          <div className="absolute inset-0 lg:left-1/2 lg:w-1/2 bg-gradient-to-r from-white via-white/80 to-transparent lg:hidden z-10" />
          
          <div className="absolute inset-0 lg:left-1/3 flex items-center justify-center text-gray-500 bg-gray-300">
            Archway/Campus Background Image
          </div>
        </div>

        <Container className="relative z-20">
          <div className="w-full max-w-2xl bg-white/95 backdrop-blur-sm p-10 sm:p-14 rounded-3xl shadow-2xl border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 font-serif">Application Form</h2>
            
            <form className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#048ED6] focus:ring-1 focus:ring-[#048ED6] bg-white text-sm transition-colors"
                  />
                </div>
                <div>
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#048ED6] focus:ring-1 focus:ring-[#048ED6] bg-white text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <input 
                    type="tel" 
                    placeholder="Phone" 
                    className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#048ED6] focus:ring-1 focus:ring-[#048ED6] bg-white text-sm transition-colors"
                  />
                </div>
                <div>
                  <div className="relative">
                    <select className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#048ED6] focus:ring-1 focus:ring-[#048ED6] bg-white text-sm appearance-none text-gray-700 transition-colors">
                      <option>Arabic Language Instructor</option>
                      <option>Administrative Officer</option>
                      <option>Mathematics Specialist (IB)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-sky-50 hover:border-sky-200 transition-colors group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-[#048ED6] mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="font-bold text-gray-900 text-sm mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 font-medium">PDF, DOC (Maximum 5MB)</p>
              </div>

              <div className="flex items-center justify-between pt-4 gap-4 flex-wrap">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded checked:border-[#048ED6] checked:bg-[#048ED6] transition-colors cursor-pointer" />
                    <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600 font-medium select-none group-hover:text-gray-900 transition-colors">
                    I read and accept the <a href="#" className="text-[#048ED6] hover:underline">legal terms and service</a>.
                  </span>
                </label>

                <button 
                  type="button"
                  className="px-8 py-3.5 bg-[#048ED6] text-white font-bold rounded-full hover:bg-sky-500 transition-colors flex items-center gap-2 shadow-md ml-auto"
                >
                  <span>Send Message</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </Container>
      </section>
    </main>
  );
}

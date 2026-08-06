'use client';

import React, { useState } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { ChevronRight, ShieldCheck, CheckCircle2, Copy, Lock, ChevronDown, ChevronUp, ChevronLeft, Star } from 'lucide-react';
import { AlreadyPaidModal } from '@/components/public/AlreadyPaidModal';

export default function DonationsPage({ params: { locale = 'en' } }: { params: { locale?: string } }) {
  const getHref = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bankExpanded, setBankExpanded] = useState('international');

  const targetedGiving = [
    { id: 1, title: 'Sponsor Hifz', tag: 'Scholarship', desc: 'Support the sacred journey of a student memorizing the Holy Qur\'an with full tuition and...', btn: 'Sponsor Now' },
    { id: 2, title: 'Build Facilities', tag: 'Infrastructure', desc: 'Contribute to the construction of state-of-the-art classrooms and research laboratories.', btn: 'Fund Building' },
    { id: 3, title: 'Hostel Support', tag: 'Living', desc: 'Help provide a secure, nurturing, and professional environment for our boarding students.', btn: 'Support Housing' },
    { id: 4, title: 'Mosque Fund', tag: 'Legacy', desc: 'Support the spiritual center of our institution, ensuring its maintenance and community...', btn: 'Contribute' }
  ];

  const wallOfGratitude = [
    { id: 1, name: 'The Al-Fayed Family', desc: '"A legacy of learning for our children and generations to come."' },
    { id: 2, name: 'Umar & Sarah Mansoor', desc: '"Proud to support the next generation of global leaders."' },
    { id: 3, name: 'Islamic Relief', desc: '"Committed to global excellence in faith-based education."' },
    { id: 4, name: 'Community Fund', desc: '"Building a sustainable and enlightened future together."' }
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Header / Hero Section */}
      <section className="pt-20 pb-16">
        <Container>
          <div className="flex flex-col lg:flex-row items-center gap-12">
            
            {/* Left Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href={getHref('/')} className="hover:text-[#048ED6] transition-colors">Home</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#048ED6] font-medium">Donation</span>
              </div>

              <h1 className="text-5xl lg:text-[4rem] font-bold text-gray-900 font-serif mb-6 leading-tight">
                Invest in the <br />
                <span className="text-[#048ED6] italic font-medium">Leaders of Tomorrow</span>
              </h1>

              <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-lg">
                Your contribution nurtures faith, knowledge, and character. Together, we can provide a world-class Islamic and modern education for every child.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-full text-sm font-bold text-gray-700">
                  <ShieldCheck className="w-4 h-4 text-[#048ED6]" />
                  <span>Secure & Transparent</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-full text-sm font-bold text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-[#048ED6]" />
                  <span>100% Impact Focused</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
              {/* Custom Blob Shape Container */}
              <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square overflow-hidden rounded-[80px] rounded-tl-[160px] rounded-br-[160px] border-4 border-[#048ED6]/20">
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">
                  Students Learning Image
                </div>
              </div>
            </div>

          </div>
        </Container>
      </section>

      {/* Donation Form & Bank Details Section */}
      <section className="py-16 bg-[#f8fcfb]">
        <Container>
          <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
            
            {/* Left: Bank Transfer */}
            <div className="flex-1 space-y-6">
              <h3 className="text-xs font-bold text-[#048ED6] uppercase tracking-wider text-center lg:text-left mb-4">
                PREFER A BANK TRANSFER?
              </h3>

              {/* International Transfer Accordion */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <button 
                  onClick={() => setBankExpanded(bankExpanded === 'international' ? '' : 'international')}
                  className="w-full p-6 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-[#048ED6]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <span className="font-bold text-[#048ED6]">International Transfer (USD/EUR)</span>
                  </div>
                  {bankExpanded === 'international' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                
                {bankExpanded === 'international' && (
                  <div className="p-6 pt-0 border-t border-gray-50 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">BANK NAME</p>
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm font-bold text-gray-900">Ecobank of Liberia</span>
                          <button className="text-[#048ED6] hover:text-sky-600"><Copy className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">ACCOUNT NAME</p>
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm font-bold text-gray-900 truncate">Yahaya International Islamic & English High School</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">ACCOUNT NUMBER (IBAN)</p>
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm font-bold text-gray-900">NG73 0123 4567 8901 2345</span>
                          <button className="text-[#048ED6] hover:text-sky-600"><Copy className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">SWIFT / BIC CODE</p>
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm font-bold text-gray-900">YTIBNGLXXXX</span>
                          <button className="text-[#048ED6] hover:text-sky-600"><Copy className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Local Account Accordion */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <button 
                  onClick={() => setBankExpanded(bankExpanded === 'local' ? '' : 'local')}
                  className="w-full p-6 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <span className="font-bold text-gray-700">Local Account (Liberia)</span>
                  </div>
                  {bankExpanded === 'local' ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
              </div>

            </div>

            {/* Right: Online Donation Form */}
            <div className="flex-1 bg-white rounded-3xl border border-[#048ED6] p-8 shadow-xl">
              <button className="w-full py-4 bg-[#048ED6] text-white font-bold rounded-xl mb-8">
                Give Online
              </button>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Choose amount</label>
                  <div className="flex flex-wrap gap-2">
                    {['$25', '$50', '$100', '$250', '$500', 'Other'].map((amt) => (
                      <button 
                        key={amt}
                        className={`flex-1 min-w-[70px] py-2.5 rounded-lg border text-sm font-bold transition-colors ${
                          amt === '$100' ? 'bg-[#048ED6] border-[#048ED6] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-[#048ED6]'
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Frequency</label>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2.5 bg-gray-100 text-gray-500 border border-transparent rounded-lg text-sm font-bold">One-time</button>
                      <button className="flex-1 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm font-bold">Monthly</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-3">Currency</label>
                    <div className="relative">
                      <select className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 appearance-none focus:outline-none focus:border-[#048ED6]">
                        <option>USD - US Dollar</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Where would you like your gift to go?</label>
                  <div className="relative">
                    <select className="w-full py-3 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 appearance-none focus:outline-none focus:border-[#048ED6]">
                      <option>General Fund (Where it's needed most)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-4 bg-[#048ED6] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-sky-500 transition-colors shadow-md"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Donate Securely Now</span>
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-4">
                    Your donation is safe, secure and tax-deductible.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </Container>
      </section>

      {/* Targeted Giving */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-serif text-gray-900 mb-4">Targeted Giving</h2>
            <p className="text-gray-600">Direct your generous contribution to a specific area of growth and excellence.</p>
          </div>

          <div className="relative">
            {/* Arrows */}
            <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 w-10 h-10 rounded-full border border-[#048ED6] text-[#048ED6] flex items-center justify-center hover:bg-sky-50 bg-white z-10 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 w-10 h-10 rounded-full border border-[#048ED6] text-[#048ED6] flex items-center justify-center hover:bg-sky-50 bg-white z-10 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {targetedGiving.map(item => (
                <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow flex flex-col">
                  <div className="relative aspect-[4/3] bg-gray-200">
                    <div className="absolute top-4 left-4 px-3 py-1 bg-[#048ED6] text-white text-[10px] font-bold rounded-full uppercase tracking-wide z-10">
                      {item.tag}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-[#048ED6] mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 mb-6 flex-1 line-clamp-3">
                      {item.desc}
                    </p>
                    <button className="w-full py-2.5 bg-[#048ED6] text-white text-sm font-bold rounded-xl hover:bg-sky-500 transition-colors">
                      {item.btn}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Wall of Gratitude */}
      <section className="py-24 bg-[#048ED6] text-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-serif mb-4 relative inline-block">
              Wall of Gratitude
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-white" />
            </h2>
            <p className="text-sky-100 mt-6">Honoring the visionary patrons who invest in the future of our youth.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wallOfGratitude.map(item => (
              <div key={item.id} className="border border-sky-400 rounded-2xl p-8 text-center flex flex-col items-center hover:bg-white/5 transition-colors">
                <Star className="w-6 h-6 text-white mb-6 fill-white" />
                <h3 className="text-xl font-bold font-serif mb-4">{item.name}</h3>
                <div className="w-full h-px bg-sky-400 mb-4" />
                <p className="text-sm text-sky-100 italic leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center gap-2 mt-12">
            <div className="w-3 h-3 rounded-full bg-white/50 cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-white cursor-pointer shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
            <div className="w-3 h-3 rounded-full bg-white/50 cursor-pointer"></div>
          </div>
        </Container>
      </section>

      {/* Modal */}
      <AlreadyPaidModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}

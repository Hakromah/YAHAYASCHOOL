'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin, Phone, MessageCircle, Mail, Clock, Send } from 'lucide-react';
import { Container } from '@/components/ui/Container';

export default function ContactUsPage({ params: { locale = 'en' } }: { params: { locale?: string } }) {
  const getHref = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  return (
    <main className="min-h-screen bg-[#fafafa] pb-24">
      {/* Header Section */}
      <section className="pt-20 pb-16 text-center">
        <Container>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <Link href={getHref('/')} className="hover:text-[#0ea5e9] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Contact</span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 font-serif mb-6">Get in Touch</h1>
          
          <p className="max-w-2xl mx-auto text-gray-600 leading-relaxed text-lg">
            We're here to answer your questions and guide your child's educational journey towards Modern Islamic Excellence.
          </p>
        </Container>
      </section>

      {/* Main Content Area */}
      <section className="pb-16">
        <Container>
          <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
            
            {/* Left Column: Form */}
            <div className="flex-[3] bg-white p-8 sm:p-12 rounded-[32px] border border-gray-100 shadow-sm">
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">First Name</label>
                    <input
                      type="text"
                      placeholder="Musa"
                      className="w-full bg-[#f4f7f9] border-transparent rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Last Name</label>
                    <input
                      type="text"
                      placeholder="Kamara"
                      className="w-full bg-[#f4f7f9] border-transparent rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Email Address</label>
                    <input
                      type="email"
                      placeholder="musakamara@gmail.com"
                      className="w-full bg-[#f4f7f9] border-transparent rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-[#f4f7f9] border-transparent rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-2">Subject Area</label>
                  <div className="relative">
                    <select className="w-full bg-[#f4f7f9] border-transparent rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors appearance-none text-gray-700">
                      <option>Admissions Inquiry</option>
                      <option>General Inquiry</option>
                      <option>Feedback</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-2">Your Message</label>
                  <textarea
                    rows={5}
                    placeholder="How can we assist you today?"
                    className="w-full bg-[#f4f7f9] border-transparent rounded-xl p-5 text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-colors resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 flex-wrap gap-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input type="radio" className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-[#0ea5e9] transition-colors cursor-pointer" />
                      <div className="absolute w-2.5 h-2.5 bg-[#0ea5e9] rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                    </div>
                    <span className="text-sm text-gray-700 select-none">
                      Read the legal terms and service, <span className="text-gray-400">I have accept it</span>
                    </span>
                  </label>

                  <button
                    type="button"
                    className="px-8 py-3.5 bg-[#0ea5e9] text-white font-bold rounded-full hover:bg-sky-500 transition-colors flex items-center gap-2 shadow-md ml-auto"
                  >
                    <span>Send Message</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Info */}
            <div className="flex-[2] bg-[#0ea5e9] rounded-[32px] p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
              {/* Decorative background shapes */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <h3 className="text-3xl font-serif font-bold mb-10 relative z-10">Campus Information</h3>

              <div className="space-y-8 relative z-10">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-base font-bold mb-1">Main Campus</strong>
                    <p className="text-sky-100 text-sm leading-relaxed">
                      123 Wisdom Avenue<br />
                      Educational District, ED 45678<br />
                      Monrovia, Liberia
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-base font-bold mb-1">Administration</strong>
                    <p className="text-sky-100 text-sm">
                      +971 4 123 4567
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-base font-bold mb-1">WhatsApp Us</strong>
                    <p className="text-sky-100 text-sm">
                      +971 4 123 4567
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-base font-bold mb-1">Admissions Desk</strong>
                    <p className="text-sky-100 text-sm">
                      admissions@yahaya.edu
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-base font-bold mb-1">Office Hours</strong>
                    <p className="text-sky-100 text-sm leading-relaxed">
                      Monday - Friday: 8:00 AM - 4:00 PM<br />
                      Friday Prayer Break: 12:00 PM - 2:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Container>
      </section>

      {/* Map Section */}
      <section>
        <Container>
          <div className="w-full h-[400px] bg-gray-200 rounded-[32px] overflow-hidden relative border border-gray-100 shadow-sm max-w-6xl mx-auto">
             <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-lg">
                Google Maps Embed Placeholder
             </div>
          </div>
        </Container>
      </section>

    </main>
  );
}

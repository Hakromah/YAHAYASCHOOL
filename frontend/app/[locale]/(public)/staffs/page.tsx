import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { ChevronDown, Mail, Linkedin, Instagram, Facebook, Twitter } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Staffs | YAHAYASCHOOL',
  description: 'Our faculty members are more than educators; they are mentors.',
};

export default function StaffsPage({ params: { locale = 'en' } }: { params: { locale?: string } }) {
  const getHref = (url: string) => (locale === 'en' ? url : `/${locale}${url}`);

  const staffMembers = [
    { id: 1, name: 'Dr. Amina Al-Hassan', role: 'HEAD OF ISLAMIC SCIENCES', email: 'Yahayastaff@Gmail.Com' },
    { id: 2, name: 'Prof. Julian Sterling', role: 'DEAN OF BRITISH CURRICULUM', email: 'Yahayastaff@Gmail.Com' },
    { id: 3, name: 'Dr. Farah Ibrahim', role: 'LEAD, SCIENCE & TECH', email: 'Yahayastaff@Gmail.Com' },
    { id: 4, name: 'Mr. Marcus Chen', role: 'DIRECTOR OF ARTS', email: 'Yahayastaff@Gmail.Com' },
    { id: 5, name: 'Dr. Amina Al-Hassan', role: 'HEAD OF ISLAMIC SCIENCES', email: 'Yahayastaff@Gmail.Com' },
    { id: 6, name: 'Prof. Julian Sterling', role: 'DEAN OF BRITISH CURRICULUM', email: 'Yahayastaff@Gmail.Com' },
    { id: 7, name: 'Dr. Farah Ibrahim', role: 'LEAD, SCIENCE & TECH', email: 'Yahayastaff@Gmail.Com' },
    { id: 8, name: 'Mr. Marcus Chen', role: 'DIRECTOR OF ARTS', email: 'Yahayastaff@Gmail.Com' },
  ];

  return (
    <main className="min-h-screen bg-[#fafafa]">
      
      {/* Header Section */}
      <section className="pt-20 pb-16 text-center">
        <Container>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <Link href={getHref('/')} className="hover:text-[#048ED6] transition-colors">Home</Link>
            <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
            <span className="text-gray-900 font-medium">Staffs</span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 font-serif mb-6">Staffs</h1>
          
          <p className="max-w-3xl mx-auto text-gray-600 leading-relaxed text-lg">
            At Yahaya International, we blend the prestige of global academic rigor with deep-rooted spiritual leadership. Our faculty members are more than educators; they are mentors, researchers, and stewards of wisdom dedicated to shaping the leaders of tomorrow.
          </p>
        </Container>
      </section>

      {/* Staff Grid */}
      <section className="py-10 pb-20">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {staffMembers.map((staff) => (
              <div key={staff.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                {/* Image with Socials */}
                <div className="aspect-[4/5] bg-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                    Staff Photo
                  </div>
                  
                  {/* Social Overlay */}
                  <div className="absolute bottom-4 left-4 flex gap-2 z-10">
                    <a href="#" className="w-7 h-7 rounded-full bg-[#048ED6] text-white flex items-center justify-center hover:bg-sky-500 transition-colors shadow-sm">
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                    <a href="#" className="w-7 h-7 rounded-full bg-[#048ED6] text-white flex items-center justify-center hover:bg-sky-500 transition-colors shadow-sm">
                      <Instagram className="w-3.5 h-3.5" />
                    </a>
                    <a href="#" className="w-7 h-7 rounded-full bg-[#048ED6] text-white flex items-center justify-center hover:bg-sky-500 transition-colors shadow-sm">
                      <Facebook className="w-3.5 h-3.5" />
                    </a>
                    <a href="#" className="w-7 h-7 rounded-full bg-[#048ED6] text-white flex items-center justify-center hover:bg-sky-500 transition-colors shadow-sm">
                      <Twitter className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 font-serif group-hover:text-[#048ED6] transition-colors">{staff.name}</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-5">
                    {staff.role}
                  </p>
                  
                  <div className="border-t border-gray-100 pt-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-50 text-[#048ED6] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <a href={`mailto:${staff.email}`} className="text-xs font-medium text-gray-600 hover:text-[#048ED6] transition-colors break-all">
                      {staff.email}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <button className="flex items-center gap-2 px-8 py-3 rounded-full border border-gray-300 text-gray-700 font-bold text-sm hover:border-[#048ED6] hover:text-[#048ED6] bg-white transition-colors">
              <ChevronDown className="w-4 h-4" />
              <span>Load More</span>
            </button>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto bg-[#f8fcfb] rounded-[40px] p-12 text-center border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 italic font-medium mb-6">
                In Pursuit of Exceptional Education
              </h2>
              
              <p className="text-gray-600 max-w-xl mx-auto mb-10 leading-relaxed text-sm">
                Our faculty recruitment follows a rigorous selection process, ensuring every teacher embodies our values of excellence, integrity, and lifelong learning.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href={getHref('/about')}
                  className="px-8 py-3.5 bg-[#048ED6] text-white font-bold rounded-full hover:bg-sky-500 transition-colors shadow-md text-sm"
                >
                  Join Our School
                </Link>
                <Link 
                  href={getHref('/news')}
                  className="px-8 py-3.5 bg-gray-200 text-gray-700 font-bold rounded-full hover:bg-gray-300 transition-colors text-sm"
                >
                  View Our Events
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

    </main>
  );
}

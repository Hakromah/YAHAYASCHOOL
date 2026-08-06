import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { BookOpen, Target, HeartHandshake, Home, CheckCircle, GraduationCap, Building, Users, ChevronRight, ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | YAHAYASCHOOL',
  description: 'Learn about our history, mission, leadership, and dual academic curriculum.',
};

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      
      {/* Page Header */}
      <section className="py-16 text-center">
        <Container>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-[#048ED6]">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">About Us</span>
          </div>
          <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-bold text-gray-900 mb-6 font-serif">About Us</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're here to answer your questions and guide your child's educational journey towards Modern Islamic Excellence.
          </p>
        </Container>
      </section>

      {/* Intro Section */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#048ED6] text-white text-xs font-bold tracking-wider">
                EST. 2020
              </span>
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-bold text-gray-900 leading-[1.1] font-serif">
                Education, Practice <br/> <span className="italic text-[#16a34a]">and Advocacy.</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                Yahaya International Islamic & English School blends the depth of traditional Islamic values with the rigorous standards of modern international education, fostering a nurturing environment for holistic student growth.
              </p>
            </div>
            <div className="flex-1 relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden relative shadow-2xl">
                <div className="absolute inset-0 bg-gray-200" />
                {/* Fallback gray box since we don't have the exact image */}
                <div className="w-full h-full object-cover bg-gray-300 flex items-center justify-center text-gray-500">School Building Image</div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Mission & Vision (Blue Shape Section) */}
      <section className="py-16">
        <Container>
          <div className="bg-[#048ED6] rounded-[40px] rounded-br-[120px] p-12 lg:p-24 relative overflow-hidden text-white flex flex-col md:flex-row gap-12 lg:gap-24 items-center">
            
            <div className="flex-1 space-y-12 relative z-10">
              <div className="flex items-center gap-6 group">
                <div className="w-12 h-12 rounded-full bg-white text-[#048ED6] flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-4xl font-bold font-serif opacity-90 group-hover:opacity-100 transition-opacity">Our Mission</h3>
              </div>
              
              <div className="flex items-center gap-6 group">
                <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-4xl font-bold font-serif opacity-70 group-hover:opacity-100 transition-opacity">Our Vision</h3>
              </div>
            </div>

            <div className="w-px h-64 bg-white/20 hidden md:block" />

            <div className="flex-1 relative z-10">
              <p className="text-2xl lg:text-3xl font-light leading-relaxed">
                To provide a comprehensive, balanced education that equips students with both academic excellence and profound moral character grounded in Islamic principles.
              </p>
            </div>

            {/* Decorative shield image behind text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-96 bg-black/10 blur-3xl rounded-full" />
          </div>
          
          {/* Core Values Box */}
          <div className="max-w-5xl mx-auto -mt-12 relative z-20">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-sky-100 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:w-1/3">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 font-serif">Core Values</h3>
                <p className="text-gray-500 text-sm">The pillars that uphold our educational philosophy.</p>
              </div>
              <div className="flex-1 flex justify-between w-full">
                <div className="text-center">
                  <BookOpen className="w-6 h-6 text-[#048ED6] mx-auto mb-2" />
                  <span className="font-semibold text-gray-800">Knowledge ('Ilm)</span>
                </div>
                <div className="text-center">
                  <HeartHandshake className="w-6 h-6 text-[#048ED6] mx-auto mb-2" />
                  <span className="font-semibold text-gray-800">Action (Amal)</span>
                </div>
                <div className="text-center">
                  <Users className="w-6 h-6 text-[#048ED6] mx-auto mb-2" />
                  <span className="font-semibold text-gray-800">Advocacy (Da'wah)</span>
                </div>
                <div className="text-center">
                  <HeartHandshake className="w-6 h-6 text-[#048ED6] mx-auto mb-2" />
                  <span className="font-semibold text-gray-800">Empathy</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Director Message */}
      <section className="py-24">
        <Container>
          <div className="bg-[#048ED6] rounded-[40px] p-4 lg:p-12 relative">
            <div className="bg-white rounded-[32px] p-8 lg:p-16 flex flex-col md:flex-row gap-12 items-start relative">
              <div className="md:w-1/3 flex flex-col items-center text-center pt-8">
                <div className="w-48 h-48 rounded-full bg-gray-200 mb-6 border-8 border-white shadow-xl flex items-center justify-center overflow-hidden">
                  <span className="text-gray-400">Photo</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900">Dr. Ahmad Kromah</h4>
                <p className="text-[#16a34a] font-medium text-sm mt-1">Founding Director</p>
              </div>
              
              <div className="md:w-2/3 space-y-6">
                <div className="text-[#048ED6] text-6xl font-serif">"</div>
                <h3 className="text-3xl font-bold text-gray-900 font-serif leading-tight">
                  Nurturing the intellect and the soul.
                </h3>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>Welcome to Yahaya International. When we established this institution in 2020, our goal was simple yet profound: to create an environment where academic rigor meets spiritual depth.</p>
                  <p>We recognized a growing need for an educational model that does not force families to choose between modern excellence and faith-based values. Here, they are seamlessly integrated. Our students are challenged intellectually while being supported emotionally and spiritually.</p>
                  <p>As you explore our community, you will find a dedicated faculty, state-of-the-art facilities, and most importantly, a vibrant student body eager to learn, practice, and advocate for a better world.</p>
                </div>
                <div className="pt-8">
                  <span className="font-serif italic text-gray-400 text-xl">Ahmad Kromah</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Why Choose Yahaya */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 font-serif mb-4">Why Choose Yahaya International?</h2>
            <p className="text-gray-500">A unique educational environment designed to foster excellence in every dimension of student life.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Home, title: 'Faith-Centered', desc: 'Islamic values are woven into daily life and curriculum.' },
              { icon: GraduationCap, title: 'Academic Excellence', desc: 'Rigorous international standards preparing students for top universities.' },
              { icon: Building, title: 'Modern Facilities', desc: 'State-of-the-art classrooms, labs, and sports complexes.' },
              { icon: Users, title: 'Strong Community', desc: 'A supportive network of educators, parents, and alumni.' }
            ].map((feature, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-[#048ED6] text-white flex items-center justify-center mb-6 shadow-sm">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Timeline Section */}
      <section className="py-24 bg-[#fafafa]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 font-serif">Our Timeline</h2>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-16 relative">
            <div className="lg:w-1/4 flex flex-col gap-8 text-3xl font-bold font-serif text-gray-300">
              <div className="cursor-pointer hover:text-gray-400 transition-colors">2020</div>
              <div className="cursor-pointer hover:text-gray-400 transition-colors">2021</div>
              <div className="text-[#048ED6] flex items-center gap-4">
                2022
                <div className="h-0.5 w-16 bg-[#048ED6]" />
              </div>
              <div className="cursor-pointer hover:text-gray-400 transition-colors">2023</div>
              <div className="cursor-pointer hover:text-gray-400 transition-colors">2024</div>
            </div>
            
            <div className="flex-1 relative rounded-[32px] overflow-hidden">
              <div className="aspect-[16/10] bg-gray-200 relative flex items-center">
                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500">Timeline Image Placeholder</div>
                
                <div className="absolute right-0 top-0 bottom-0 w-2/5 bg-white p-12 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">2022</h3>
                  <h4 className="text-3xl font-bold text-[#048ED6] font-serif leading-tight mb-6">Global Accreditation & Leadership Expansion</h4>
                  <p className="text-gray-600 text-sm leading-relaxed mb-8">
                    A pivotal year marked by our recognition as a leading global institution. We converged knowledge and faith, cultivating future leaders who advocate for justice, embody empathy, and drive positive change in their communities worldwide.
                  </p>
                  <div className="flex items-center gap-4">
                    <button className="w-10 h-10 rounded-full border border-[#048ED6] text-[#048ED6] flex items-center justify-center hover:bg-[#048ED6] hover:text-white transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 rounded-full border border-[#048ED6] text-[#048ED6] flex items-center justify-center hover:bg-[#048ED6] hover:text-white transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Banner */}
      <section className="py-24">
        <Container>
          <div className="bg-gray-50 rounded-3xl p-16 text-center max-w-4xl mx-auto border border-gray-100 shadow-sm">
            <h2 className="text-3xl font-bold font-serif text-gray-900 italic mb-4">In Pursuit of Exceptional Education</h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Our faculty recruitment follows a rigorous selection process, ensuring every teacher embodies our values of excellence, integrity, and lifelong learning.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/admissions" className="px-8 py-3 rounded-full bg-[#048ED6] text-white font-bold hover:bg-sky-500 transition-colors shadow-md">
                Join Our School
              </Link>
              <Link href="/events" className="px-8 py-3 rounded-full bg-gray-200 text-gray-800 font-bold hover:bg-gray-300 transition-colors">
                View Our Events
              </Link>
            </div>
          </div>
        </Container>
      </section>

    </main>
  );
}

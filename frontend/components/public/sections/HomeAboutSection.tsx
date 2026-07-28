import React from 'react';
import { School, GraduationCap, Users, ShieldCheck, BookOpen } from 'lucide-react';
import { Container } from '@/components/ui/Container';

export function HomeAboutSection() {
  return (
    <section className="relative pt-24 pb-48 w-full bg-white overflow-hidden">
      <Container>
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Column: Content */}
          <div className="flex-1 w-full text-slate-800">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 flex items-center justify-center bg-sky-50 rounded text-[#0ea5e9]">
                <School className="w-4 h-4" />
              </div>
              <span className="text-[#0ea5e9] text-sm font-semibold tracking-wider uppercase">
                About Our Legacy
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 leading-tight">
              Fostering Excellence <br />
              Through <span className="text-[#0ea5e9]">Faith and Science</span>
            </h2>
            
            <p className="text-slate-600 text-lg leading-relaxed mb-12 max-w-xl">
              Yahaya International Islamic & English High School is more than just an educational institution; it is a community dedicated to shaping the holistic development of every child. We bridge the gap between traditional Islamic ethics and modern Western education.
            </p>
            
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6 text-center max-w-lg">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-sky-50 text-[#0ea5e9] mb-4">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">250+</h3>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Students</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-sky-50 text-[#0ea5e9] mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">25+</h3>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employees</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-sky-50 text-[#0ea5e9] mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">6+</h3>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Years</p>
              </div>
            </div>
          </div>
          
          {/* Right Column: Image & Floating Card */}
          <div className="flex-1 w-full relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[500px]">
              {/* Placeholder Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80")' }}
              />
            </div>
            
            {/* Floating Info Card */}
            <div className="absolute -bottom-8 -left-8 right-8 bg-[#0ea5e9] p-6 rounded-2xl shadow-xl flex items-center gap-6 text-white">
              <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-white rounded-full text-[#0ea5e9]">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="font-medium text-[15px] leading-snug pr-4">
                Yahaya International Islamic & English High School is more than just an educational institution
              </p>
            </div>
          </div>
          
        </div>
      </Container>
      
      {/* Bottom Curve Divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
        <svg 
          viewBox="0 0 1440 120" 
          className="w-full h-auto" 
          preserveAspectRatio="none"
        >
          <path 
            fill="#0ea5e9" 
            fillOpacity="1" 
            d="M0,0 Q360,120 720,120 T1440,0 L1440,120 L0,120 Z" 
          />
        </svg>
      </div>
    </section>
  );
}

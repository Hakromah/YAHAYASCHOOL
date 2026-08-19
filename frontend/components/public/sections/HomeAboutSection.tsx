import React from 'react';
import { School, GraduationCap, Users, ShieldCheck, BookOpen } from 'lucide-react';
import { Container } from '@/components/ui/Container';

export function HomeAboutSection() {
  return (
    <section className="relative pt-20 pb-36 w-full bg-white overflow-hidden">
      <Container>
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Left Column: Content */}
          <div className="flex-1 w-full text-slate-800">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 flex items-center justify-center bg-sky-50 rounded text-[#048ED6]">
                <School className="w-4 h-4" />
              </div>
              <span className="text-[#048ED6] text-sm font-semibold tracking-wider uppercase">
                About Our Legacy
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-5 text-slate-900 leading-tight">
              Fostering Excellence <br />
              Through <span className="text-[#048ED6]">Faith and Science</span>
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed mb-10 max-w-xl">
              Yahaya International Islamic & English High School is more than just an educational institution; it is a community dedicated to shaping the holistic development of every child. We bridge the gap between traditional Islamic ethics and modern Western education.
            </p>

            {/* Stats Row */}
            <div className="flex justify-between w-full gap-6 text-center max-w-lg">
              <div className="flex flex-col items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-sky-50 text-[#048ED6] mb-4">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">250+</h3>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Students</p>

                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-sky-50 text-[#048ED6] mb-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">25+</h3>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employees</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-sky-50 text-[#048ED6] mb-4">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">6+</h3>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Years</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Image & Floating Card */}
          <div className="flex-1 relative w-full h-full">
            <div className="relative overflow-hidden shadow-xl w-full h-[360px]">
              <img src="/images/figma-home/17.png" alt="floating card" className="absolute -bottom-6 w-[calc(100%-44px)] left-1/2 -translate-x-1/2 shadow-xl flex items-center gap-4 text-white" />
            </div>

            {/* Floating Info Card */}
            <div className="absolute -bottom-6 w-[calc(100%-44px)] left-1/2 -translate-x-1/2 bg-[#048ED6] p-4 rounded shadow-xl flex items-center gap-4 text-white">
              <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-white rounded-full text-[#048ED6]">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="w-[1px] shrink-0 bg-white/50 self-stretch my-1"></div>
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
            fill="#048ED6"
            fillOpacity="1"
            d="M0,0 Q360,120 720,120 T1440,0 L1440,120 L0,120 Z"
          />
        </svg>
      </div>
    </section>
  );
}

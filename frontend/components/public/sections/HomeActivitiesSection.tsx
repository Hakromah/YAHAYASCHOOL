import React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';

interface ActivityCardProps {
  title: string;
  imageUrl: string;
}

function ActivityCard({ title, imageUrl }: ActivityCardProps) {
  return (
    <div className="group relative rounded-lg overflow-hidden cursor-pointer shadow-md w-full aspect-[4/3]">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
      <div className="absolute bottom-0 left-0 p-6 w-full">
        <h4 className="text-white font-medium text-lg drop-shadow-sm transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          {title}
        </h4>
      </div>
    </div>
  );
}

export function HomeActivitiesSection() {
  return (
    <section className="py-20 bg-[#FAFAFA] relative overflow-hidden">
      {/* Subtle background pattern (optional, matches the very faint Islamic pattern in design) */}
      <div className="absolute inset-0 opacity-[0.22] pointer-events-none bg-[url('/images/figma-home/13.png')] bg-[length:360px]" />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          
          {/* Left Column */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <ActivityCard 
              title="Mosque Activities" 
              imageUrl="/images/figma-home/09.png" 
            />
            <ActivityCard 
              title="Public Speaking" 
              imageUrl="/images/figma-home/17.png" 
            />
          </div>
          
          {/* Center Column */}
          <div className="flex flex-col items-center text-center lg:col-span-2 px-4 lg:px-8 py-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-7 leading-tight">
              Seeking knowledge is a <br /> path to goodness.
            </h2>
            
            <div className="w-full aspect-[16/9] mb-8 rounded-lg overflow-hidden shadow-lg relative">
               <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("/images/figma-home/09.png")' }} />
            </div>
            
            <p className="text-slate-600 mb-8 max-w-sm text-[15px]">
              Every action tells a story—see what&apos;s been happening.
            </p>
            
            <Link
              href="/gallery"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#048ED6] text-white text-sm font-medium rounded-full hover:bg-sky-500 transition-colors shadow-md hover:shadow-lg"
            >
              <span>Join us</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Right Column */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <ActivityCard 
              title="Arts & Creativity" 
              imageUrl="/images/figma-home/19.png" 
            />
            <ActivityCard 
              title="Arts & Creativity" 
              imageUrl="/images/figma-home/07-activity.png" 
            />
          </div>

        </div>
      </Container>
    </section>
  );
}

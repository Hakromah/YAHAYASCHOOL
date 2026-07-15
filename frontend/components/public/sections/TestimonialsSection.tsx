'use client';

import React, { useEffect, useState } from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import type { TestimonialsSectionComponent, TestimonialEntity } from '../../../types/cms.types';
import { cmsService } from '../../../services/cms.service';

interface TestimonialsProps {
  data?: TestimonialsSectionComponent;
  initialTestimonials?: TestimonialEntity[];
  locale?: string;
}

const FALLBACK_TESTIMONIALS: TestimonialEntity[] = [
  {
    id: 1,
    authorName: 'Hajjah Mariam Sulaiman',
    authorRole: 'Parent of 2 Senior High Students',
    quote:
      'Enrolling our children at YAHAYASCOOL was the best decision we made. Not only are they topping their Cambridge math and science exams, but their love for Qur\'an and respectful manners (Adab) have transformed our home.',
    rating: 5,
  },
  {
    id: 2,
    authorName: 'Abdullah K. Yilmaz',
    authorRole: 'Alumnus (Class of 2024) — Engineering Student at MIT',
    quote:
      'The dual curriculum taught me rigorous discipline. Completing my Tahfidz while doing Advanced Physics gave me exceptional mental focus that gives me a clear edge at top engineering universities.',
    rating: 5,
  },
  {
    id: 3,
    authorName: 'Dr. Tariq Al-Mansoor',
    authorRole: 'University Professor & PTA Chairman',
    quote:
      'What sets YAHAYASCOOL apart is the uncompromising commitment to high standards. The teachers are dedicated mentors who truly care about the spiritual and intellectual destiny of every student.',
    rating: 5,
  },
];

export function TestimonialsSection({ data, initialTestimonials, locale = 'en' }: TestimonialsProps) {
  const [testimonials, setTestimonials] = useState<TestimonialEntity[]>(initialTestimonials || FALLBACK_TESTIMONIALS);
  const [loading, setLoading] = useState(false);

  const title = data?.title || 'What Parents, Students & Alumni Say';
  const subtitle = data?.subtitle || 'Hear firsthand experiences from the vibrant YAHAYASCOOL community';
  const limit = data?.limit || 6;

  useEffect(() => {
    if (initialTestimonials && initialTestimonials.length > 0) return;
    setLoading(true);
    cmsService.getTestimonials(locale, limit).then((fetched) => {
      if (fetched && fetched.length > 0) {
        setTestimonials(fetched);
      }
      setLoading(false);
    });
  }, [locale, limit, initialTestimonials]);

  return (
    <section className="bg-white py-20 sm:py-28 border-b border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 mb-3 border border-emerald-200">
            Community Voices
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
            {title}
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mt-2">
            {subtitle}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-gray-100 h-64 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test, idx) => (
              <div
                key={idx}
                className="bg-emerald-50/40 hover:bg-emerald-50/80 rounded-3xl p-8 border border-emerald-100 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between relative group"
              >
                <Quote className="absolute top-6 right-6 w-10 h-10 text-emerald-800/10 group-hover:text-emerald-800/20 transition-colors pointer-events-none" />

                <div>
                  {/* Star Rating */}
                  <div className="flex items-center gap-1 mb-5">
                    {[...Array(test.rating || 5)].map((_, sIdx) => (
                      <Star key={sIdx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed italic mb-8 relative z-10">
                    &ldquo;{test.quote}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-emerald-100/80">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-400 font-bold flex items-center justify-center text-base shadow-xs shrink-0">
                    {test.authorName ? test.authorName.charAt(0).toUpperCase() : 'P'}
                  </div>

                  <div className="flex flex-col">
                    <span className="font-bold text-emerald-950 text-sm flex items-center gap-1">
                      <span>{test.authorName}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {test.authorRole || 'Parent & Supporter'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

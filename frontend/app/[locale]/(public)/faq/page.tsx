import React from 'react';
import type { Metadata } from 'next';
import { cmsService } from '@/services/cms.service';
import { HomepageBuilder } from '@/components/public/HomepageBuilder';
import { HelpCircle, ChevronDown, CheckCircle2 } from 'lucide-react';

interface FaqPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FaqPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('faq', locale);

  return {
    title: page?.seo?.metaTitle || (locale === 'ar' ? 'الأسئلة الشائعة | يهايا سكول' : 'Frequently Asked Questions | YAHAYASCOOL'),
    description: page?.seo?.metaDescription || 'Find clear, comprehensive answers regarding admissions, tuition fees, Qur\'an memorization tracks, Cambridge exams, and campus life.',
  };
}

export default async function FaqListingPage({ params }: FaqPageProps) {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('faq', locale);

  if (page?.sections && page.sections.length > 0) {
    return <HomepageBuilder sections={page.sections} locale={locale} />;
  }

  const faqs = await cmsService.getFaqs(locale);

  const fallbackFaqs = faqs && faqs.length > 0 ? faqs : [
    {
      id: 1,
      question: 'Does YAHAYASCOOL prepare students for both international and national examinations?',
      answer: 'Yes. Our senior secondary students sit for Cambridge IGCSE, SAT, and IELTS alongside national senior school certificate examinations, ensuring 100% eligibility for top universities in North America, Europe, Turkey, and across Africa.',
      category: 'Curriculum & Exams',
    },
    {
      id: 2,
      question: 'How does the 3-Year Tahfidz Al-Qur\'an memorization track work?',
      answer: 'Students enrolled in the Tahfidz track have dedicated morning and evening memorization circles led by certified Hafiz instructors with Ijazah. Academic Western subjects are scheduled efficiently during core day hours without overwhelming the student.',
      category: 'Islamic Studies & Tahfidz',
    },
    {
      id: 3,
      question: 'Are boarding and hostel accommodations available on campus?',
      answer: 'Yes. We offer separate, highly secure, fully air-conditioned hostel facilities for both boys and girls, supervised 24/7 by dedicated housemasters and resident medical nurses.',
      category: 'Campus Life & Boarding',
    },
    {
      id: 4,
      question: 'What are the tuition payment options and Waqf scholarship eligibility?',
      answer: 'Tuition can be paid per academic term. Through our Sadaqah Jariyah and Waqf Endowment Fund, need-based and academic merit scholarships covering up to 100% of tuition are awarded annually to exceptional students and orphans.',
      category: 'Admissions & Scholarships',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50/70 pb-24">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs sm:text-sm font-semibold mb-6">
            Clear Answers & Guidance
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-3xl mx-auto font-light leading-relaxed">
            Everything you need to know about our dual curriculum, admission requirements, boarding facilities, and scholarship opportunities.
          </p>
        </div>
      </section>

      {/* FAQ Accordion List */}
      <section className="max-w-4xl mx-auto px-4 sm:px-8 mt-16 space-y-6">
        {fallbackFaqs.map((faq, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-emerald-950 flex items-start gap-3">
                <HelpCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                <span>{faq.question}</span>
              </h3>
            </div>
            <div className="mt-4 pl-9 text-gray-700 text-base leading-relaxed">
              {faq.answer}
            </div>
            {faq.category && (
              <div className="mt-6 pl-9">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                  {faq.category}
                </span>
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}

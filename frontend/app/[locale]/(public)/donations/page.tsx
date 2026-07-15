import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cmsService } from '@/services/cms.service';
import { HomepageBuilder } from '@/components/public/HomepageBuilder';
import { DonationBannerSection } from '@/components/public/sections/DonationBannerSection';
import { HeartHandshake, ShieldCheck, CheckCircle2, DollarSign, Award, Building2, Gift } from 'lucide-react';

interface DonationsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DonationsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('donations', locale);

  return {
    title: page?.seo?.metaTitle || (locale === 'ar' ? 'صندوق الوقف والصدقة الجارية | يهايا سكول' : 'Waqf Endowment & Sadaqah Jariyah | YAHAYASCOOL'),
    description: page?.seo?.metaDescription || 'Invest in eternal charity (Sadaqah Jariyah) by funding science laboratories, orphan scholarships, and campus mosque expansions.',
  };
}

export default async function DonationsPage({ params }: DonationsPageProps) {
  const { locale } = await params;
  const page = await cmsService.getPageBySlug('donations', locale);

  if (page?.sections && page.sections.length > 0) {
    return <HomepageBuilder sections={page.sections} locale={locale} />;
  }

  const campaigns = await cmsService.getDonationCampaigns(locale);

  const fallbackCampaigns = campaigns && campaigns.length > 0 ? campaigns : [
    {
      id: 1,
      title: 'Orphan & Hafiz Scholarship Endowment',
      slug: 'orphan-scholarship-fund',
      description: 'Provides full tuition, hostel accommodation, textbooks, and meals for gifted orphan students memorizing the Holy Qur\'an.',
      targetAmount: 50000,
      raisedAmount: 38500,
    },
    {
      id: 2,
      title: 'Advanced STEM & Artificial Intelligence Research Lab',
      slug: 'stem-ai-lab-fund',
      description: 'Equipping our physics, robotics, and computing laboratories with cutting-edge instruments to foster world-class Muslim innovators.',
      targetAmount: 120000,
      raisedAmount: 74200,
    },
    {
      id: 3,
      title: 'Campus Central Mosque & Islamic Library Expansion',
      slug: 'mosque-library-expansion',
      description: 'Expanding the central Juma\'ah mosque and establishing a classical Arabic manuscript and digital reference library for all students.',
      targetAmount: 80000,
      raisedAmount: 61000,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50/70 pb-24">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-amber-300 text-xs sm:text-sm font-semibold mb-6">
            Sadaqah Jariyah • Eternal Endowment
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6">
            Waqf Endowment Fund
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-3xl mx-auto font-light leading-relaxed">
            &ldquo;When a human being dies, all their deeds come to an end except three: continuous charity (Sadaqah Jariyah), beneficial knowledge, or a righteous child who prays for them.&rdquo; <span className="text-amber-400 font-semibold">— Sahih Muslim</span>
          </p>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 mb-3 tracking-tight">
            Active Waqf Projects & Campaigns
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Every contribution is strictly audited and dedicated 100% to the specified institutional development project.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {fallbackCampaigns.map((camp, idx) => {
            const percent = Math.min(100, Math.round((camp.raisedAmount / (camp.targetAmount || 1)) * 100));
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-600 flex items-center justify-center font-bold mb-6 shadow-xs border border-amber-300/50">
                    <Gift className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-950 mb-3 group-hover:text-emerald-800 transition-colors">
                    {camp.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-8">
                    {camp.description}
                  </p>
                </div>

                <div>
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-2 font-mono">
                      <span>Raised: ${camp.raisedAmount.toLocaleString()}</span>
                      <span>Target: ${camp.targetAmount.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-emerald-900 font-mono">{percent}% Funded</span>
                    <Link
                      href={locale === 'en' ? `/contact?subject=Waqf+Donation+-+${encodeURIComponent(camp.title)}` : `/${locale}/contact?subject=Waqf+Donation`}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-900 text-white hover:bg-emerald-800 shadow-md transition-colors"
                    >
                      Contribute Now
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bank Account Details & Transparency Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-20">
        <div className="bg-emerald-950 rounded-3xl p-8 sm:p-14 text-white border border-emerald-800 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-4">
                DIRECT WIRE TRANSFERS
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                Official School Waqf Bank Details
              </h3>
              <p className="text-emerald-200 text-sm sm:text-base leading-relaxed mb-6">
                For large institutional endowments, Sadaqah Jariyah, and direct international wire transfers, kindly use our verified institutional account below. An official tax-deductible Waqf receipt is issued upon confirmation.
              </p>
              <div className="space-y-2 text-xs sm:text-sm text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Audited annually by Independent Shariah & Financial Board</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-900/80 rounded-2xl p-6 sm:p-8 border border-emerald-700 font-mono text-sm space-y-4 shadow-inner">
              <div className="flex justify-between border-b border-emerald-800 pb-3">
                <span className="text-emerald-300 font-sans">Bank Name:</span>
                <span className="font-bold text-white">First Islamic International Bank</span>
              </div>
              <div className="flex justify-between border-b border-emerald-800 pb-3">
                <span className="text-emerald-300 font-sans">Account Name:</span>
                <span className="font-bold text-white">Yahaya School Waqf Endowment Trust</span>
              </div>
              <div className="flex justify-between border-b border-emerald-800 pb-3">
                <span className="text-emerald-300 font-sans">Account Number (USD):</span>
                <span className="font-bold text-amber-400">8002-9941-2041-001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300 font-sans">SWIFT / IBAN Code:</span>
                <span className="font-bold text-white">FIIB234X / NG89FIIB000800299412041001</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

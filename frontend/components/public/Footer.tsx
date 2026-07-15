'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Send, HeartHandshake, CheckCircle2 } from 'lucide-react';
import type { FooterConfig, NavigationMenuItem } from '../../types/cms.types';

interface FooterProps {
  config?: FooterConfig | null;
  locale?: string;
}

export function Footer({ config, locale = 'en' }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const quickLinks: NavigationMenuItem[] = config?.quickLinks && config.quickLinks.length > 0 ? config.quickLinks : [
    { title: 'About Us & Leadership', url: '/about' },
    { title: 'Academic Curriculum', url: '/programs' },
    { title: 'Online Registration', url: '/online-registration' },
    { title: 'Tuition Fees & Scholarships', url: '/admissions#fees' },
    { title: 'Campus Photo Gallery', url: '/gallery' },
    { title: 'Frequently Asked Questions', url: '/faq' },
  ];

  const departments: NavigationMenuItem[] = config?.departmentsColumn && config.departmentsColumn.length > 0 ? config.departmentsColumn : [
    { title: 'Faculty of Islamic & Qur\'anic Studies', url: '/departments/islamic-studies' },
    { title: 'Faculty of Pure & Applied Sciences', url: '/departments/sciences' },
    { title: 'Languages & Linguistics Department', url: '/departments/languages' },
    { title: 'Humanities & Commerce Faculty', url: '/departments/humanities' },
  ];

  const programs: NavigationMenuItem[] = config?.programsColumn && config.programsColumn.length > 0 ? config.programsColumn : [
    { title: 'Tahfidz Al-Qur\'an Memorization Track', url: '/programs/quran-memorization' },
    { title: 'Advanced Arabic Immersion Track', url: '/programs/arabic-immersion' },
    { title: 'STEM & Robotics Honors Track', url: '/programs/stem-robotics' },
    { title: 'Intensive Summer Academy', url: '/programs/summer-academy' },
  ];

  const contactText = config?.contactText || 'Empowering future Muslim leaders through holistic, world-class Western sciences and rigorous Islamic Qur\'anic scholarship.';
  const copyrightText = config?.copyrightText || '© 2026 YAHAYASCOOL — Yahaya International Islamic and English High School. All rights reserved.';
  const newsletterHeading = config?.newsletterHeading || 'Stay Connected';
  const newsletterSubheading = config?.newsletterSubheading || 'Subscribe for official school circulars, admission deadlines, and Islamic reflections directly to your inbox.';

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      setEmail('');
    }, 800);
  };

  const getHref = (url: string) => {
    if (url.startsWith('http') || url.startsWith('#')) return url;
    if (locale === 'en' || !locale) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return cleanUrl === '/' ? `/${locale}` : `/${locale}${cleanUrl}`;
  };

  return (
    <footer className="bg-emerald-950 text-emerald-100 border-t border-emerald-900 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Top Section: Newsletter & Waqf Callout */}
        <div className="bg-gradient-to-r from-emerald-900/80 to-emerald-950/90 rounded-3xl p-6 sm:p-10 border border-emerald-800/80 shadow-2xl mb-16 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center lg:text-left">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
              OFFICIAL CIRCULARS & UPDATES
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{newsletterHeading}</h3>
            <p className="text-emerald-200 text-sm sm:text-base">{newsletterSubheading}</p>
          </div>

          <div className="w-full lg:w-auto flex-1 max-w-md">
            {subscribed ? (
              <div className="bg-emerald-800/80 border border-emerald-600/60 rounded-2xl p-4 flex items-center gap-3 text-emerald-100 animate-in fade-in">
                <CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0" />
                <span className="text-sm font-medium">Alhamdulillah! You are now subscribed to YAHAYASCOOL updates.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="flex-1 bg-emerald-900/90 border border-emerald-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder:text-emerald-400/70 focus:outline-hidden focus:border-amber-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold px-6 py-3 rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
                >
                  <span>{loading ? 'Subscribing...' : 'Subscribe'}</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Middle Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-14 border-b border-emerald-900/80">
          {/* Column 1: Brand & Bio (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
            <Link href={getHref('/')} className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-emerald-950 font-extrabold text-2xl shadow-md">
                Y<span className="text-emerald-900 text-xs font-semibold">S</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-white">YAHAYASCOOL</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 font-serif">
                  Islamic & English High School
                </span>
              </div>
            </Link>
            <p className="text-emerald-200/90 text-sm leading-relaxed max-w-sm">{contactText}</p>

            <div className="space-y-2 pt-2 text-xs text-emerald-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Plot 18, Education District, Islamic Knowledge Avenue, West Africa</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+234 (0) 800-YAHAYA-S</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>admissions@yahayaschool.edu</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-base font-bold text-white tracking-wide border-b border-emerald-800/80 pb-2">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={getHref(item.url)}
                    className="text-emerald-300 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-amber-400/80 text-xs">›</span>
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Departments */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-base font-bold text-white tracking-wide border-b border-emerald-800/80 pb-2">
              Departments
            </h4>
            <ul className="space-y-2 text-sm">
              {departments.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={getHref(item.url)}
                    className="text-emerald-300 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-amber-400/80 text-xs">›</span>
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Programs & Waqf */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-base font-bold text-white tracking-wide border-b border-emerald-800/80 pb-2">
              Academic Tracks
            </h4>
            <ul className="space-y-2 text-sm">
              {programs.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={getHref(item.url)}
                    className="text-emerald-300 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-amber-400/80 text-xs">›</span>
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="pt-4">
              <Link
                href={getHref('/donations')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 shadow-md transition-colors"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Sadaqah & Waqf Fund</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-400/80 gap-4">
          <p className="text-center sm:text-left">{copyrightText}</p>
          <div className="flex items-center gap-6">
            <Link href={getHref('/privacy-policy')} className="hover:text-emerald-200 transition-colors">
              Privacy Policy
            </Link>
            <Link href={getHref('/terms')} className="hover:text-emerald-200 transition-colors">
              Terms of Service
            </Link>
            <Link href={getHref('/sitemap')} className="hover:text-emerald-200 transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

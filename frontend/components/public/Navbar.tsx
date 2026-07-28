'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from '@/i18n/routing';
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Container } from '../ui/Container';
import { useTranslations } from 'next-intl';

export function Navbar({ locale = 'en' }: { locale?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const pathname = usePathname();

  // Basic link active check
  const isLinkActive = (url: string) => {
    if (url === '/') return pathname === '/' || pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname.includes(url);
  };

  const getHref = (url: string) => {
    if (url.startsWith('http') || url.startsWith('#')) return url;
    if (locale === 'en' || !locale) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return cleanUrl === '/' ? `/${locale}` : `/${locale}${cleanUrl}`;
  };

  const NavLink = ({ href, children, hasDropdown = false }: { href: string; children: React.ReactNode; hasDropdown?: boolean }) => {
    const active = isLinkActive(href);
    return (
      <Link
        href={getHref(href)}
        className={`flex items-center gap-1 text-[15px] font-semibold transition-colors ${
          active ? 'text-[#0ea5e9]' : 'text-gray-800 hover:text-[#0ea5e9]'
        }`}
      >
        {children}
        {hasDropdown && <ChevronDown className="w-4 h-4" />}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm transition-all py-2">
      <Container>
        <div className="flex items-center justify-between h-20">
          
          {/* Left Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 flex-1 justify-end pe-8">
            <NavLink href="/programs">Academic programs</NavLink>
            <NavLink href="/online-learning">Online learning</NavLink>
            <NavLink href="/news">News and events</NavLink>
          </nav>

          {/* Center Logo */}
          <Link href={getHref('/')} className="flex items-center justify-center z-10 shrink-0 mx-4">
            <Image
              src="/headerlogo.png"
              alt="YAHAYASCHOOL Logo"
              width={80}
              height={95}
              className="object-contain hover:scale-105 transition-transform"
              priority
            />
          </Link>

          {/* Right Navigation & Actions */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 flex-1 justify-start ps-8">
            <nav className="flex items-center gap-6 xl:gap-8">
              <NavLink href="/">Home</NavLink>
              
              {/* About Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setAboutDropdownOpen(true)}
                onMouseLeave={() => setAboutDropdownOpen(false)}
              >
                <NavLink href="/about" hasDropdown>About</NavLink>
                {aboutDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2">
                    <Link href={getHref('/about')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600">Overview</Link>
                    <Link href={getHref('/staffs')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600">Our Staff</Link>
                    <Link href={getHref('/career')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600">Careers</Link>
                  </div>
                )}
              </div>

              <NavLink href="/gallery">Gallery</NavLink>
              <NavLink href="/contact">Contact</NavLink>
            </nav>

            <div className="flex items-center gap-4 border-s border-gray-200 ps-6">
              <LanguageSwitcher currentLocale={locale} />
              <Link
                href={getHref('/donations')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-white bg-[#0ea5e9] hover:bg-sky-500 shadow-md transition-all"
              >
                <span>Donations</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-hidden absolute end-4"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-[#0ea5e9]" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </Container>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 pt-4 pb-6 shadow-xl absolute w-full left-0 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col space-y-2">
            <Link href={getHref('/programs')} className="px-4 py-3 rounded-lg text-base font-semibold text-gray-800 hover:bg-sky-50">Academic programs</Link>
            <Link href={getHref('/online-learning')} className="px-4 py-3 rounded-lg text-base font-semibold text-gray-800 hover:bg-sky-50">Online learning</Link>
            <Link href={getHref('/news')} className="px-4 py-3 rounded-lg text-base font-semibold text-gray-800 hover:bg-sky-50">News and events</Link>
            <div className="h-px bg-gray-100 my-2" />
            <Link href={getHref('/')} className="px-4 py-3 rounded-lg text-base font-semibold text-gray-800 hover:bg-sky-50">Home</Link>
            <Link href={getHref('/about')} className="px-4 py-3 rounded-lg text-base font-semibold text-gray-800 hover:bg-sky-50">About</Link>
            <Link href={getHref('/gallery')} className="px-4 py-3 rounded-lg text-base font-semibold text-gray-800 hover:bg-sky-50">Gallery</Link>
            <Link href={getHref('/contact')} className="px-4 py-3 rounded-lg text-base font-semibold text-gray-800 hover:bg-sky-50">Contact</Link>
            
            <div className="pt-4 mt-2 flex flex-col gap-4">
              <div className="flex justify-center">
                <LanguageSwitcher currentLocale={locale} />
              </div>
              <Link
                href={getHref('/donations')}
                className="w-full py-3 rounded-full text-center font-bold text-white bg-[#0ea5e9] hover:bg-sky-500 shadow-md flex items-center justify-center gap-2"
              >
                <span>Donations</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

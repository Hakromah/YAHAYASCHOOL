'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from '@/i18n/routing';
import { Menu, X, ChevronDown, BookOpen, HeartHandshake, GraduationCap } from 'lucide-react';
import type { NavigationMenuItem } from '../../types/cms.types';

interface NavbarProps {
  items?: NavigationMenuItem[];
  locale?: string;
}

const DEFAULT_NAV_ITEMS: NavigationMenuItem[] = [
  { title: 'Home', url: '/' },
  { title: 'About Us', url: '/about' },
  { title: 'Programs', url: '/programs' },
  { title: 'Departments', url: '/departments' },
  { title: 'Admissions', url: '/admissions' },
  { title: 'News & Events', url: '/news' },
  { title: 'Waqf & Donations', url: '/donations' },
  { title: 'FAQ', url: '/faq' },
];

export function Navbar({ items = DEFAULT_NAV_ITEMS, locale = 'en' }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const pathname = usePathname();

  const navItems = items && items.length > 0 ? items : DEFAULT_NAV_ITEMS;

  const isLinkActive = (url: string) => {
    if (url === '/') {
      return pathname === '/' || pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    return pathname.includes(url);
  };

  const getHref = (url: string) => {
    if (url.startsWith('http') || url.startsWith('#')) return url;
    if (locale === 'en' || !locale) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return cleanUrl === '/' ? `/${locale}` : `/${locale}${cleanUrl}`;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & School Title */}
          <Link href={getHref('/')} className="flex items-center gap-3.5 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 flex items-center justify-center text-amber-400 font-extrabold text-2xl shadow-md group-hover:scale-105 transition-transform border border-emerald-700/50">
              Y<span className="text-emerald-300 text-sm font-semibold">S</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-emerald-950 group-hover:text-emerald-800 transition-colors">
                YAHAYASCOOL
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-amber-700 font-serif">
                Islamic & English High School
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item, idx) => {
              const active = isLinkActive(item.url);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div
                  key={idx}
                  className="relative"
                  onMouseEnter={() => hasChildren && setActiveDropdown(idx)}
                  onMouseLeave={() => hasChildren && setActiveDropdown(null)}
                >
                  <Link
                    href={getHref(item.url)}
                    target={item.target || '_self'}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'text-emerald-900 bg-emerald-50/80 font-bold shadow-2xs'
                        : 'text-gray-700 hover:text-emerald-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>{item.title}</span>
                    {hasChildren && <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
                  </Link>

                  {/* Dropdown Menu */}
                  {hasChildren && activeDropdown === idx && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      {item.children!.map((child, cIdx) => (
                        <Link
                          key={cIdx}
                          href={getHref(child.url)}
                          target={child.target || '_self'}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50/80 hover:text-emerald-900 transition-colors"
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href={getHref('/donations')}
              className="hidden xl:flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-emerald-900 bg-amber-100 hover:bg-amber-200 border border-amber-300/60 transition-colors shadow-2xs"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-amber-700" />
              <span>Waqf Fund</span>
            </Link>
            <Link
              href={getHref('/online-registration')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>Apply Online</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-hidden"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-emerald-900" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-6 shadow-xl animate-in fade-in duration-200">
          <div className="flex flex-col space-y-1">
            {navItems.map((item, idx) => {
              const active = isLinkActive(item.url);
              return (
                <Link
                  key={idx}
                  href={getHref(item.url)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    active ? 'bg-emerald-900 text-white font-bold' : 'text-gray-800 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
            <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col gap-2">
              <Link
                href={getHref('/online-registration')}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl text-center font-bold text-white bg-emerald-900 hover:bg-emerald-800 shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span>Apply Online for Admission</span>
              </Link>
              <Link
                href={getHref('/donations')}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl text-center font-semibold text-emerald-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <HeartHandshake className="w-4 h-4 text-amber-700" />
                <span>Support Our Waqf & Scholarships</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

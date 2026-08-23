'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from '@/i18n/routing';
import { Menu, X, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Container } from '../ui/Container';
import { useTranslations } from 'next-intl';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Parallax } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { useLenis } from 'lenis/react';
import 'swiper/css';

export function Navbar({ locale = 'en' }: { locale?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [activeAboutMenu, setActiveAboutMenu] = useState('about');
  const lenis = useLenis();
  const swiperRef = useRef<SwiperType | null>(null);
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close every menu whenever the route changes. Without this the desktop
  // dropdown's backdrop (fixed inset-0, bg-black/50 + backdrop-blur) survives
  // client-side navigation and leaves the destination page blurred — and since
  // that backdrop is pointer-events-none, it cannot be clicked away either.
  useEffect(() => {
    setAboutDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileAboutOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      lenis?.stop();
    } else {
      lenis?.start();
    }
    return () => {
      lenis?.start();
    };
  }, [mobileMenuOpen, lenis]);

  const aboutMenuOptions = [
    { id: 'about', label: 'About Us', href: '/about', image: '/images/figma-home/02-about.jpeg', badge: 'Our Community' },
    { id: 'staffs', label: 'Staffs', href: '/staffs', image: '/images/figma-home/20-news.jpeg', badge: 'Our Team' },
    { id: 'career', label: 'Career', href: '/career', image: '/images/figma-home/15-news.jpeg', badge: 'Join Us' },
  ];

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

  const NavLink = ({ href, children, hasDropdown = false, isOpen = false, className = '' }: { href: string; children: React.ReactNode; hasDropdown?: boolean; isOpen?: boolean; className?: string }) => {
    const active = isLinkActive(href);
    return (
      <Link
        href={getHref(href)}
        className={`flex items-center gap-1 text-[15px] font-semibold transition-colors outline-none ${active ? 'text-[#048ED6]' : 'text-gray-800 hover:text-[#048ED6]'
          } ${className}`}
      >
        {children}
        {hasDropdown && <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isOpen ? '-rotate-180' : 'lg:group-hover:-rotate-180'}`} />}
      </Link>
    );
  };

  return (
    <>
    <header className={`sticky top-0 z-50 bg-white border-b border-gray-100 transition-transform duration-500 ${isVisible ? 'translate-y-0' : '-translate-y-[calc(100%+40px)]'}`}>
      <Container className='max-w-[1920px] px-[var(--spacing-side)]'>
        <div className="w-[300px] h-[40px] max-lg:hidden flex justify-center items-end pointer-events-none absolute bottom-[-12px] left-1/2 -translate-x-1/2 z-[10]">
          <Image
            src="/logo-under.webp"
            alt="Logo under please ignore it"
            width={185}
            height={145}
            className="object-contain lg:hover:scale-105 transition-transform"
            priority
          />
        </div>
        <div className="w-full h-full relative">

          {/* Left Navigation */}
          <nav className='w-full h-24.75 bg-white flex justify-between items-center lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)]'>
            <div className="hidden lg:flex items-center gap-2 xl:gap-(--spacing-gap)  lg:[&_*]:text-[18px] [&_*]:text-[16px]">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/programs">Academic programs</NavLink>
              <NavLink href="/online-learning">Online learning</NavLink>
              <NavLink href="/news">News and events</NavLink>

            </div>

            {/* Center Logo */}
            <Link href={getHref('/')} className="flex lg:max-w-[76px] items-center justify-center z-10 shrink-0">
              <Image
                src="/headerlogo.png"
                alt="YAHAYASCHOOL Logo"
                width={80}
                height={95}
                className="object-contain lg:hover:scale-105  lg:max-w-[76px] max-w-[65px] max-xs:max-w-[55px] transition-transform"
                priority
              />
            </Link>

            {/* Right Navigation & Actions */}
            <div className="hidden lg:flex items-center  gap-5 xl:gap-[40px] h-full justify-end ps-8">
              <nav className="flex items-center h-full gap-2 xl:gap-(--spacing-gap) gap-(--spacing-gap) xl:[&_*]:text-[18px] [&_*]:text-[16px]">


                {/* About Dropdown */}
                <div
                  className="group relative h-full flex items-center outline-none cursor-pointer"
                  onClick={() => setAboutDropdownOpen(!aboutDropdownOpen)}
                >
                  <NavLink href="/about" hasDropdown isOpen={aboutDropdownOpen} className="w-full h-full relative cursor-pointer">About</NavLink>
                  
                  <div
                    // Clicks inside the panel must not reach the wrapper's toggle above:
                    // it would flip the dropdown *open*, and since the backdrop is
                    // pointer-events-none the page would be left blurred with no way to
                    // dismiss it. Most visible when picking the page you are already on,
                    // where the route never changes so no navigation reset fires.
                    onClick={(e) => {
                      e.stopPropagation();
                      setAboutDropdownOpen(false);
                    }}
                    className={`lg:absolute lg:top-full z-50 lg:left-[-150px] pointer-events-none w-full lg:w-[clamp(600px,50vw,690px)] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 transition-all duration-300 origin-top ${aboutDropdownOpen
                      ? 'opacity-100 visible scale-100 pointer-events-auto'
                      : 'opacity-0 invisible scale-95 pointer-events-none lg:group-hover:opacity-100 lg:group-hover:visible lg:group-hover:scale-100 lg:group-hover:pointer-events-auto'
                      }`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-(--spacing-gap)">
                      {/* Left Column - List */}
                      <div className="flex flex-col gap-2">
                        {aboutMenuOptions.map((item, index) => (
                          <Link
                            key={item.id}
                            href={getHref(item.href)}
                            onMouseEnter={() => {
                              setActiveAboutMenu(item.id);
                              if (swiperRef.current) {
                                swiperRef.current.slideTo(index);
                              }
                            }}
                            className={`flex items-center border border-gray-200 text-gray-700 justify-between px-4 py-3 rounded-xl text-[16px] font-medium transition-all cursor-pointer ${activeAboutMenu === item.id
                              ? 'bg-[#048ED6] text-white duration-500 border border-gray-200'
                              : 'bg-white border border-gray-200 text-gray-700 lg:hover:border-gray-300 lg:hover:bg-gray-50'
                              }`}
                          >
                            {item.label}
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                        ))}
                      </div>

                      {/* Right Column - Slider Image (hidden on small screens) */}
                      <div className="hidden lg:block relative rounded-2xl overflow-hidden h-[240px] bg-gray-100">
                        <Swiper
                          direction="vertical"
                          className="w-full h-full"
                          parallax={true}
                          modules={[Parallax]}
                          onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                          }}
                          allowTouchMove={false}
                          speed={800}
                        >
                          {aboutMenuOptions.map((item) => (
                            <SwiperSlide key={item.id} className="group/slide w-full h-full relative overflow-hidden">
                              <div className='w-full h-full relative overflow-hidden'>
                                <a href={getHref(item.href)} className='w-full h-full block overflow-hidden'>
                                  <div className="w-full h-full relative scale-125" data-swiper-parallax-y="-20%">
                                    <Image
                                      src={item.image}
                                      alt={item.label}
                                      fill
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                  <div className="absolute opacity-0 group-[&.swiper-slide-active]/slide:opacity-100 translate-x-[-100%] group-[&.swiper-slide-active]/slide:translate-x-0  group-[&.swiper-slide-active]/slide:delay-300 duration-500 top-4 left-4 group-[&.swiper-slide-active]/slide:bg-white group-[&.swiper-slide-active]/slide:backdrop-blur-sm px-4 py-1.5 rounded-full text-[#048ED6] font-medium text-sm shadow-sm z-10" data-swiper-parallax-y="-20" data-swiper-parallax-opacity="0">
                                    {item.badge}
                                  </div>
                                </a>
                              </div>

                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>
                    </div>
                  </div>
                </div>

                <NavLink href="/gallery">Gallery</NavLink>
                <NavLink href="/contact">Contact</NavLink>
              </nav>

              <div className="flex items-center h-full gap-(--spacing-gap)  border-gray-200">
                <LanguageSwitcher currentLocale={locale} />
                <Link
                  href={getHref('/donations')}
                  className="flex items-center gap-2 px-[32px] py-[13px] rounded-full text-sm font-bold text-white bg-[#048ED6] hover:bg-sky-500 shadow-md transition-all"
                >
                  <span>Donations</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Mobile Menu Toggle & Language */}
            <div className="lg:hidden h-full flex items-center gap-2 max-lg:gap-5 z-50 relative">
              <LanguageSwitcher 
                currentLocale={locale} 
                forceClose={mobileMenuOpen}
                onToggle={(isOpen) => {
                  if (isOpen) setMobileMenuOpen(false);
                }}
              />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                <div className="w-8 h-6 flex flex-col justify-between items-center relative">
                  <span className={`block h-[2px] w-full transform transition duration-300 ease-in-out ${mobileMenuOpen ? 'rotate-45 translate-y-[11px] bg-[#048ED6]' : 'bg-gray-800'}`} />
                  <span className={`block h-[2px] w-full transform transition duration-300 ease-in-out ${mobileMenuOpen ? 'opacity-0 bg-white/0 w-0' : 'bg-gray-800'}`} />
                  <span className={`block h-[2px] w-full transform transition duration-300 ease-in-out ${mobileMenuOpen ? '-rotate-45 -translate-y-[11px] bg-[#048ED6]' : 'bg-gray-800'}`} />
                </div>
              </button>
            </div>
          </nav>
        </div>
      </Container>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 pt-4 pb-6 shadow-xl absolute w-full left-0 z-550 overflow-hidden transition-all duration-300 origin-top animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col">
            <Link href={getHref('/')} className="px-[var(--spacing-side)] py-3 rounded-lg text-[18px] font-semibold text-gray-800">Home</Link>
            
            {/* Mobile About Accordion */}
            <div className="flex flex-col">
              <button 
                onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
                className={`flex justify-between items-center px-[var(--spacing-side)] py-3 text-[18px] font-semibold text-gray-800 transition-colors ${mobileAboutOpen ? 'bg-primary/5' : 'bg-white'}`}
              >
                About
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${mobileAboutOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`grid transition-all duration-300 ease-in-out ${mobileAboutOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden flex flex-col">
                  <div className='flex flex-col w-full bg-primary'>
                  {aboutMenuOptions.map((item, index) => (
                    <Link key={item.id} href={getHref(item.href)} onClick={() => setMobileMenuOpen(false)} className="pl-[calc(var(--spacing-side)+12px)] py-2 text-[16px] border-t-[1px] border-white font-medium text-white">
                      {item.label}
                    </Link>
                  ))}
                  </div>
                </div>
              </div>
            </div>
            <Link href={getHref('/programs')} className="px-[var(--spacing-side)] py-3 rounded-lg text-[18px] font-semibold text-gray-800 ">Academic programs</Link>
            <Link href={getHref('/online-learning')} className="px-[var(--spacing-side)] py-3 rounded-lg text-[18px] font-semibold text-gray-800 ">Online learning</Link>
            <Link href={getHref('/news')} className="px-[var(--spacing-side)] py-3 rounded-lg text-[18px] font-semibold text-gray-800 ">News and events</Link>
            <Link href={getHref('/gallery')} className="px-[var(--spacing-side)] py-3 rounded-lg text-[18px] font-semibold text-gray-800 ">Gallery</Link>
            <Link href={getHref('/contact')} className="px-[var(--spacing-side)] py-3 rounded-lg text-[18px] font-semibold text-gray-800 ">Contact</Link>
            <div className="pt-4 mt-2 flex flex-col gap-4 px-[var(--spacing-side)]">
            
              <Link
                href={getHref('/donations')}
                className="w-full py-3 rounded-full text-center font-bold text-white bg-[#048ED6] flex items-center justify-center gap-2"
              >
                <span>Donations</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>

    {/* Mobile Menu Overlay */}
    {mobileMenuOpen && (
      <div 
        className="fixed inset-0 z-[45] bg-black/50 backdrop-blur-sm lg:hidden"
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />
    )}

    </>
  );
}

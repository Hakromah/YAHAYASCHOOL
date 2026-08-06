'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '../ui/Container';
import { Mail, Phone, BookOpen, GraduationCap, LifeBuoy } from 'lucide-react';
import type { FooterConfig } from '../../types/cms.types';

interface FooterProps {
  config?: FooterConfig | null;
  locale?: string;
}

export function Footer({ locale = 'en' }: FooterProps) {
  return (
    <footer className="bg-white pt-12">
      {/* Top Contact Strip */}
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between py-8 border-b border-gray-100 gap-8">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-500">Follow us on Social Media</span>
            <div className="flex items-center gap-2">
              <a href="#" className="w-8 h-8 rounded-full bg-sky-50 text-[#048ED6] flex items-center justify-center hover:bg-[#048ED6] hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-sky-50 text-[#048ED6] flex items-center justify-center hover:bg-[#048ED6] hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-sky-50 text-[#048ED6] flex items-center justify-center hover:bg-[#048ED6] hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-sky-50 text-[#048ED6] flex items-center justify-center hover:bg-[#048ED6] hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-sky-50 text-[#048ED6] flex items-center justify-center hover:bg-[#048ED6] hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
            </div>
          </div>
          
          <div className="shrink-0 -mt-12 relative z-10 bg-white p-4 rounded-full">
            <Image
              src="/headerlogo.png"
              alt="YAHAYASCHOOL Logo"
              width={80}
              height={95}
              className="object-contain"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-[#048ED6]">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Email</p>
                <p className="text-sm font-semibold text-gray-900">Yahayahighschool@Gmail.com</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-[#048ED6]">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Telephone</p>
                <p className="text-sm font-semibold text-gray-900">+23188368801</p>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Main Footer Links */}
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 py-16">
          <div className="lg:col-span-1 space-y-6">
            <h4 className="text-xs font-bold text-[#048ED6] uppercase tracking-wider">YAHAYA INTERNATIONAL ISLAMIC AND ENGLISH HIGH SCHOOL</h4>
            <h3 className="text-2xl font-bold text-gray-900 font-serif leading-tight">Knowledge Faith & <span className="text-[#048ED6]">Excellence</span></h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Building a brighter future through Islamic values, quality education and character development
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-1.5 rounded-full bg-[#048ED6] text-white text-xs font-bold">Islamic Education</span>
              <span className="px-4 py-1.5 rounded-full bg-[#048ED6] text-white text-xs font-bold">Modern Learning</span>
              <span className="px-4 py-1.5 rounded-full bg-[#048ED6] text-white text-xs font-bold">Bright Future</span>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[#048ED6]">
              <BookOpen className="w-5 h-5" />
              <h4 className="font-bold text-gray-900">Quick Links</h4>
            </div>
            <ul className="space-y-3">
              <li><Link href={`/${locale}/about`} className="text-sm text-gray-600 hover:text-[#048ED6]">About Us</Link></li>
              <li><Link href={`/${locale}/programs`} className="text-sm text-gray-600 hover:text-[#048ED6]">Academic Programs</Link></li>
              <li><Link href={`/${locale}/news`} className="text-sm text-gray-600 hover:text-[#048ED6]">News & Events</Link></li>
              <li><Link href={`/${locale}/gallery`} className="text-sm text-gray-600 hover:text-[#048ED6]">Gallery</Link></li>
              <li><Link href={`/${locale}/careers`} className="text-sm text-gray-600 hover:text-[#048ED6]">Careers</Link></li>
              <li><Link href={`/${locale}/contact`} className="text-sm text-gray-600 hover:text-[#048ED6]">Contact</Link></li>
            </ul>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[#048ED6]">
              <GraduationCap className="w-5 h-5" />
              <h4 className="font-bold text-gray-900">Academics</h4>
            </div>
            <ul className="space-y-3">
              <li><Link href={`/${locale}/departments/quran`} className="text-sm text-gray-600 hover:text-[#048ED6]">Qur'an Department</Link></li>
              <li><Link href={`/${locale}/departments/arabic`} className="text-sm text-gray-600 hover:text-[#048ED6]">Arabic Language</Link></li>
              <li><Link href={`/${locale}/departments/english`} className="text-sm text-gray-600 hover:text-[#048ED6]">English Department</Link></li>
              <li><Link href={`/${locale}/online-learning`} className="text-sm text-gray-600 hover:text-[#048ED6]">Online Learning</Link></li>
              <li><Link href={`/${locale}/student-life`} className="text-sm text-gray-600 hover:text-[#048ED6]">Student Life</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[#048ED6]">
              <LifeBuoy className="w-5 h-5" />
              <h4 className="font-bold text-gray-900">Support</h4>
            </div>
            <ul className="space-y-3">
              <li><Link href={`/${locale}/faq`} className="text-sm text-gray-600 hover:text-[#048ED6]">FAQS</Link></li>
              <li><Link href={`/${locale}/help`} className="text-sm text-gray-600 hover:text-[#048ED6]">Help Center</Link></li>
            </ul>
          </div>
        </div>
      </Container>
      
      {/* Bottom Bar */}
      <div className="bg-[#048ED6] py-4">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/90 text-sm">© 2026 Yahaya International Islamic and English School. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href={`/${locale}/terms`} className="text-white/90 text-sm hover:text-white">Terms of Service</Link>
              <Link href={`/${locale}/privacy`} className="text-white/90 text-sm hover:text-white">Privacy Policy</Link>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}

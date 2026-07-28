'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { ChevronDown } from 'lucide-react';

const LOCALES = [
  { code: 'en', label: 'UK', flag: '🇬🇧' },
  { code: 'ar', label: 'SA', flag: '🇸🇦' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'tr', label: 'TR', flag: '🇹🇷' },
];

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  const current = LOCALES.find((l) => l.code === currentLocale) || LOCALES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchLocale = (locale: string) => {
    setIsOpen(false);
    router.replace(pathname, { locale });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-100 bg-white hover:bg-sky-50 transition-colors shadow-sm"
      >
        <span className="text-lg leading-none">{current.flag}</span>
        <span className="text-sm font-bold text-gray-800">{current.label}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-[#0ea5e9] rounded-xl shadow-xl border border-sky-400 p-2 z-50 flex flex-col gap-1 min-w-[100px] animate-in fade-in slide-in-from-top-2 duration-150">
          {LOCALES.filter(l => l.code !== currentLocale).map((locale, idx) => (
            <React.Fragment key={locale.code}>
              <button
                onClick={() => switchLocale(locale.code)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-sky-500 transition-colors"
              >
                <span className="text-xl leading-none">{locale.flag}</span>
                <span className="text-sm font-bold">{locale.label}</span>
              </button>
              {idx < LOCALES.filter(l => l.code !== currentLocale).length - 1 && (
                <div className="h-px bg-white/30 mx-2 my-0.5" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

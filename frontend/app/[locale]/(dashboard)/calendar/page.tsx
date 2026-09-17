'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight,
  Clock, MapPin, Users, X, Megaphone, Globe, ExternalLink,
  AlertTriangle, RefreshCw, Filter, Search, Printer, Share2,
  Sparkles, CheckCircle2, Bookmark, Grid3X3, List, CalendarDays,
  ArrowRight, ArrowLeft
} from 'lucide-react';
import { cmsService } from '@/services/cms.service';
import type { EventEntity, AnnouncementEntity } from '@/types/cms.types';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';

// ─── Localized String Fallbacks ──────────────────────────────────────────────

const CALENDAR_DICT: Record<'en' | 'ar', Record<string, string>> = {
  en: {
    title: 'Enterprise Academic & Events Calendar',
    subtitle: 'Institutional master calendar — academic events, Islamic observances, examinations, and public ceremonies.',
    today: 'Today',
    refresh: 'Refresh',
    refreshed: 'Calendar refreshed.',
    manageEvents: 'Manage Events',
    allEvents: 'All Events',
    eventTypes: 'Event Types',
    announcements: 'Announcements & Notices',
    viewAll: 'View all →',
    eventsOn: 'Events on',
    eventsIn: 'Events in',
    showMonth: 'Show month ×',
    noEventsDay: 'No events scheduled for this day.',
    noEventsMonth: 'No events scheduled for this month.',
    eventsCreatedHint: 'Events created in the CMS Events module will automatically synchronize here.',
    goToCms: 'Go to Events CMS →',
    registrationRequired: 'Registration Required',
    capacity: 'Capacity',
    seats: 'seats',
    deadline: 'Deadline',
    register: 'Register',
    details: 'Details',
    start: 'Start Date',
    end: 'End Date',
    venue: 'Venue & Location',
    department: 'Department',
    addToGoogle: 'Add to Google Calendar',
    close: 'Close',
    searchPlaceholder: 'Search events by name, location, or keyword...',
    spotlight: 'Upcoming School Event',
    monthView: 'Month Grid',
    splitView: 'Interactive',
    agendaView: 'Agenda',
    printCalendar: 'Print Calendar',
    failedLoad: 'Failed to load calendar data.',
    // Categories
    'Academic': 'Academic',
    'Islamic/Religious': 'Islamic/Religious',
    'Sports': 'Sports',
    'Cultural': 'Cultural',
    'Parent Gathering': 'Parent Gathering',
    'Holiday': 'Holiday',
    'Examination': 'Examination',
  },
  ar: {
    title: 'التقويم المدرسي والفعاليات الرسمية',
    subtitle: 'التقويم المؤسسي المعتمد — الفعاليات الأكاديمية، المناسبات الإسلامية، الامتحانات، والاحتفالات المدرسية.',
    today: 'اليوم',
    refresh: 'تحديث',
    refreshed: 'تم تحديث التقويم بنجاح.',
    manageEvents: 'إدارة الفعاليات',
    allEvents: 'جميع الفعاليات',
    eventTypes: 'تصنيفات الفعاليات',
    announcements: 'الإعلانات والتعميمات',
    viewAll: 'عرض الكل ←',
    eventsOn: 'فعاليات يوم',
    eventsIn: 'فعاليات شهر',
    showMonth: 'عرض فعاليات الشهر ×',
    noEventsDay: 'لا توجد فعاليات مجدولة لهذا اليوم.',
    noEventsMonth: 'لا توجد فعاليات مجدولة لهذا الشهر.',
    eventsCreatedHint: 'الفعاليات التي يتم إضافتها في نظام إدارة الفعاليات ستظهر تلقائياً هنا.',
    goToCms: 'الانتقال إلى إدارة الفعاليات ←',
    registrationRequired: 'التسجيل مطلوب مسبقاً',
    capacity: 'السعة المتاحة',
    seats: 'مقعد',
    deadline: 'الموعد النهائي للتسجيل',
    register: 'تسجيل الآن',
    details: 'عرض التفاصيل',
    start: 'تاريخ البدء',
    end: 'تاريخ الانتهاء',
    venue: 'المقر والموقع',
    department: 'القسم المسؤول',
    addToGoogle: 'إضافة إلى تقويم Google',
    close: 'إغلاق',
    searchPlaceholder: 'بحث عن الفعاليات بالاسم، المكان، أو الموضوع...',
    spotlight: 'أبرز الفعاليات القادمة',
    monthView: 'شبكة الشهر',
    splitView: 'التقويم التفاعلي',
    agendaView: 'جدول المواعيد',
    printCalendar: 'طباعة التقويم',
    failedLoad: 'تعذر تحميل بيانات التقويم.',
    // Categories
    'Academic': 'أكاديمي وتعليمي',
    'Islamic/Religious': 'إسلامي وديني',
    'Sports': 'رياضي وأنشطة',
    'Cultural': 'ثقافي وتربوي',
    'Parent Gathering': 'لقاء أولياء الأمور',
    'Holiday': 'عطلة رسمية',
    'Examination': 'امتحانات واختبارات',
  }
};

function getCalText(key: string, locale: string = 'en'): string {
  const loc = locale === 'ar' ? 'ar' : 'en';
  return CALENDAR_DICT[loc][key] || i18nT(key, locale) || key;
}

// ─── Safe Date Helpers ───────────────────────────────────────────────────────

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(iso: string): Date {
  if (!iso) return new Date();
  const clean = iso.slice(0, 10);
  const [y, m, d] = clean.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function isoToDisplay(iso: string, locale: string = 'en') {
  if (!iso) return '';
  try {
    const d = parseISODate(iso);
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-u-nu-latn' : locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso;
  }
}

function formatMonthTitle(year: number, month: number, locale: string = 'en') {
  try {
    const d = new Date(year, month, 1);
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-u-nu-latn' : locale, {
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return `${month + 1}/${year}`;
  }
}

function eventTypeColor(type?: string) {
  const map: Record<string, string> = {
    'Academic': 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    'Islamic/Religious': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    'Sports': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    'Cultural': 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
    'Parent Gathering': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    'Holiday': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    'Examination': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  };
  return map[type || ''] || 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700';
}

function priorityColor(p: string) {
  if (p === 'urgent') return 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700';
  if (p === 'high') return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700';
  return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
}

// ─── Event Detail Modal ───────────────────────────────────────────────────────

function EventDetailModal({
  event,
  locale,
  onClose,
}: {
  event: EventEntity;
  locale: string;
  onClose: () => void;
}) {
  const isRtl = locale === 'ar';

  const makeGoogleCalendarUrl = () => {
    const startStr = (event.startDate || '').replace(/-/g, '') + 'T090000Z';
    const endStr = (event.endDate || event.startDate || '').replace(/-/g, '') + 'T170000Z';
    const title = encodeURIComponent(event.title || 'School Event');
    const desc = encodeURIComponent(event.description || '');
    const loc = encodeURIComponent(event.location || '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${desc}&location=${loc}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="space-y-1.5 min-w-0 pr-4 rtl:pr-0 rtl:pl-4">
            {event.eventType && (
              <span className={`inline-flex px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${eventTypeColor(event.eventType)}`}>
                {getCalText(event.eventType, locale)}
              </span>
            )}
            <h3 className="font-black text-slate-900 dark:text-white text-lg leading-snug">
              {event.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                {getCalText('start', locale)}
              </p>
              <p className="text-xs font-black text-slate-900 dark:text-white">
                {isoToDisplay(event.startDate, locale)}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                {getCalText('end', locale)}
              </p>
              <p className="text-xs font-black text-slate-900 dark:text-white">
                {isoToDisplay(event.endDate || event.startDate, locale)}
              </p>
            </div>
          </div>

          {event.location && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{getCalText('venue', locale)}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{event.location}</span>
              </div>
            </div>
          )}

          {event.description && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {event.registrationRequired && (
            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {getCalText('registrationRequired', locale)}
                </span>
                {event.capacity && (
                  <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {event.capacity.toLocaleString()} {getCalText('seats', locale)}
                  </span>
                )}
              </div>
              {event.registrationDeadline && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  {getCalText('deadline', locale)}: {isoToDisplay(event.registrationDeadline, locale)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <a
            href={makeGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
            {getCalText('addToGoogle', locale)}
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-black transition-colors cursor-pointer"
          >
            {getCalText('close', locale)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

function MiniCalendar({
  year,
  month,
  events,
  onDayClick,
  selectedDay,
  locale,
}: {
  year: number;
  month: number;
  events: EventEntity[];
  onDayClick: (d: string) => void;
  selectedDay: string | null;
  locale: string;
}) {
  const isRtl = locale === 'ar';
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0 = Sunday
  const today = todayISO();

  // Day headers: Sunday to Saturday
  const dayHeaders = isRtl
    ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map of day -> events
  const eventDaysMap = useMemo(() => {
    const map = new Map<number, EventEntity[]>();
    events.forEach(ev => {
      if (!ev.startDate) return;
      const s = parseISODate(ev.startDate);
      const e = parseISODate(ev.endDate || ev.startDate);
      const cur = new Date(s);
      while (cur <= e) {
        if (cur.getFullYear() === year && cur.getMonth() === month) {
          const d = cur.getDate();
          if (!map.has(d)) map.set(d, []);
          map.get(d)!.push(ev);
        }
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [events, year, month]);

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
        {dayHeaders.map((d, i) => (
          <div key={i} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="aspect-square" />;
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = iso === today;
          const isSelected = iso === selectedDay;
          const dayEvents = eventDaysMap.get(day) || [];
          const hasEvent = dayEvents.length > 0;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick(iso)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-xs font-bold transition-colors cursor-pointer select-none
                ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : isToday
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1.5 ring-emerald-500/50'
                    : hasEvent
                    ? 'bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
              `}
            >
              <span>{day}</span>
              {hasEvent && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-emerald-500'
                    }`}
                  />
                  {dayEvents.length > 1 && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white/70' : 'bg-sky-500'
                      }`}
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Full Month Matrix View ──────────────────────────────────────────────────

function MonthMatrixView({
  year,
  month,
  events,
  selectedDay,
  onDayClick,
  onSelectEvent,
  locale,
}: {
  year: number;
  month: number;
  events: EventEntity[];
  selectedDay: string | null;
  onDayClick: (d: string) => void;
  onSelectEvent: (e: EventEntity) => void;
  locale: string;
}) {
  const isRtl = locale === 'ar';
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0 = Sunday
  const today = todayISO();

  const dayHeaders = isRtl
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const eventDaysMap = useMemo(() => {
    const map = new Map<number, EventEntity[]>();
    events.forEach(ev => {
      if (!ev.startDate) return;
      const s = parseISODate(ev.startDate);
      const e = parseISODate(ev.endDate || ev.startDate);
      const cur = new Date(s);
      while (cur <= e) {
        if (cur.getFullYear() === year && cur.getMonth() === month) {
          const d = cur.getDate();
          if (!map.has(d)) map.set(d, []);
          map.get(d)!.push(ev);
        }
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [events, year, month]);

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-center text-xs font-black text-slate-500 dark:text-slate-400 py-3">
        {dayHeaders.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      {/* Grid cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800 min-h-[580px]">
        {cells.map((day, i) => {
          if (!day) {
            return (
              <div
                key={i}
                className="min-h-[90px] p-2 bg-slate-50/30 dark:bg-slate-950/20"
              />
            );
          }
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = iso === today;
          const isSelected = iso === selectedDay;
          const dayEvents = eventDaysMap.get(day) || [];

          return (
            <div
              key={i}
              onClick={() => onDayClick(iso)}
              className={`min-h-[90px] p-2 transition-colors cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                  : isToday
                  ? 'bg-indigo-50/30 dark:bg-indigo-950/15'
                  : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? 'bg-emerald-600 text-white'
                      : isSelected
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Event chips */}
              <div className="space-y-1 mt-auto">
                {dayEvents.slice(0, 2).map(ev => (
                  <div
                    key={ev.id}
                    onClick={e => {
                      e.stopPropagation();
                      onSelectEvent(ev);
                    }}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate border cursor-pointer hover:scale-[1.02] transition-transform ${eventTypeColor(
                      ev.eventType
                    )}`}
                    title={ev.title}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <span className="text-[9px] font-bold text-slate-400 pl-1">
                    +{dayEvents.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Agenda View ─────────────────────────────────────────────────────────────

function AgendaView({
  events,
  onSelectEvent,
  locale,
}: {
  events: EventEntity[];
  onSelectEvent: (e: EventEntity) => void;
  locale: string;
}) {
  const sorted = useMemo(() => {
    return [...events].sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  }, [events]);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
        <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
          {getCalText('noEventsMonth', locale)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map(ev => (
        <div
          key={ev.id}
          onClick={() => onSelectEvent(ev)}
          className="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4 min-w-0">
            {/* Date Block */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex flex-col items-center justify-center text-center shrink-0">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase">
                {ev.startDate ? isoToDisplay(ev.startDate, locale).split(' ')[1] : '—'}
              </span>
              <span className="text-lg font-black text-emerald-950 dark:text-white leading-none">
                {ev.startDate ? parseISODate(ev.startDate).getDate() : '—'}
              </span>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {ev.eventType && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${eventTypeColor(
                      ev.eventType
                    )}`}
                  >
                    {getCalText(ev.eventType, locale)}
                  </span>
                )}
                {ev.registrationRequired && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    {getCalText('registrationRequired', locale)}
                  </span>
                )}
              </div>

              <h4 className="font-black text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                {ev.title}
              </h4>

              {ev.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {ev.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-xs self-end md:self-center">
            {ev.location && (
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {ev.location}
              </span>
            )}
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1"
            >
              {getCalText('details', locale)}
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchoolCalendarPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [events, setEvents] = useState<EventEntity[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'matrix' | 'agenda'>('split');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventEntity | null>(null);

  // ── Stable Data Loading (NO infinite loops) ───────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let evs = await cmsService.getEvents(locale, 200).catch(() => []);
      if ((!evs || evs.length === 0) && locale !== 'en') {
        evs = await cmsService.getEvents('en', 200).catch(() => []);
      }

      let anns = await cmsService.getAnnouncements(locale).catch(() => []);
      if ((!anns || anns.length === 0) && locale !== 'en') {
        anns = await cmsService.getAnnouncements('en').catch(() => []);
      }

      setEvents(evs || []);
      setAnnouncements(anns || []);
    } catch (err) {
      console.error(err);
      toast.error(getCalText('failedLoad', locale));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Month navigation
  const prevMonth = () => {
    if (month === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else {
      setMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear(y => y + 1);
      setMonth(0);
    } else {
      setMonth(m => m + 1);
    }
  };

  const goToday = () => {
    const n = new Date();
    setYear(n.getFullYear());
    setMonth(n.getMonth());
    setSelectedDay(todayISO());
  };

  // Filtered by month & search
  const monthEvents = useMemo(() => {
    return events.filter(ev => {
      if (!ev.startDate) return false;
      const s = parseISODate(ev.startDate);
      const e = parseISODate(ev.endDate || ev.startDate);
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      const inMonth = s <= monthEnd && e >= monthStart;
      const typeMatch = typeFilter === 'all' || ev.eventType === typeFilter;
      const q = searchQuery.toLowerCase().trim();
      const queryMatch =
        !q ||
        (ev.title || '').toLowerCase().includes(q) ||
        (ev.location || '').toLowerCase().includes(q) ||
        (ev.description || '').toLowerCase().includes(q);

      return inMonth && typeMatch && queryMatch;
    });
  }, [events, year, month, typeFilter, searchQuery]);

  // Events for selected day (or whole month if none selected)
  const displayEvents = useMemo(() => {
    if (!selectedDay) {
      return [...monthEvents].sort((a, b) =>
        (a.startDate || '').localeCompare(b.startDate || '')
      );
    }
    return monthEvents.filter(ev => {
      if (!ev.startDate) return false;
      const s = parseISODate(ev.startDate);
      const e = parseISODate(ev.endDate || ev.startDate);
      const d = parseISODate(selectedDay);
      return s <= d && e >= d;
    });
  }, [monthEvents, selectedDay]);

  // Next Major Upcoming Event (Spotlight)
  const nextSpotlight = useMemo(() => {
    const today = todayISO();
    return (
      events
        .filter(ev => ev.startDate && ev.startDate >= today)
        .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))[0] || null
    );
  }, [events]);

  const upcomingAnnouncements = useMemo(() => {
    const today = todayISO();
    return announcements
      .filter(a => !a.expiryDate || a.expiryDate >= today)
      .slice(0, 5);
  }, [announcements]);

  const eventTypes = [
    'Academic',
    'Islamic/Religious',
    'Examination',
    'Sports',
    'Cultural',
    'Parent Gathering',
    'Holiday',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 shrink-0">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                {getCalText('title', locale)}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {getCalText('subtitle', locale)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={goToday}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            {getCalText('today', locale)}
          </button>
          <button
            type="button"
            onClick={() => {
              loadData();
              toast.success(getCalText('refreshed', locale));
            }}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title={getCalText('refresh', locale)}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title={getCalText('printCalendar', locale)}
          >
            <Printer className="w-4 h-4" />
          </button>
          <Link
            href="/cms/events"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            {getCalText('manageEvents', locale)}
          </Link>
        </div>
      </div>

      {/* ── Next Major Event Spotlight (if available) ── */}
      {nextSpotlight && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 z-10">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-emerald-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {getCalText('spotlight', locale)}
                </span>
                {nextSpotlight.eventType && (
                  <span className="text-[10px] font-bold text-slate-300">
                    • {getCalText(nextSpotlight.eventType, locale)}
                  </span>
                )}
              </div>
              <h3 className="font-black text-sm md:text-base text-white truncate max-w-xl">
                {nextSpotlight.title}
              </h3>
              <p className="text-xs text-emerald-200/80 flex items-center gap-3 flex-wrap">
                <span>{isoToDisplay(nextSpotlight.startDate, locale)}</span>
                {nextSpotlight.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {nextSpotlight.location}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedEvent(nextSpotlight)}
            className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-emerald-50 text-xs font-black transition-colors cursor-pointer shrink-0 z-10"
          >
            {getCalText('details', locale)} →
          </button>
        </div>
      )}

      {/* ── Toolbar: Search, Filters & View Mode ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={getCalText('searchPlaceholder', locale)}
            className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* View Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 shrink-0">
          {(
            [
              ['split', <CalendarDays key="s" className="w-3.5 h-3.5" />, getCalText('splitView', locale)],
              ['matrix', <Grid3X3 key="m" className="w-3.5 h-3.5" />, getCalText('monthView', locale)],
              ['agenda', <List key="a" className="w-3.5 h-3.5" />, getCalText('agendaView', locale)],
            ] as const
          ).map(([mode, icon, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border-none transition-all ${
                viewMode === mode
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Category Chips ── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
            typeFilter === 'all'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
          }`}
        >
          {getCalText('allEvents', locale)} ({events.length})
        </button>
        {eventTypes.map(typ => {
          const count = events.filter(e => e.eventType === typ).length;
          return (
            <button
              key={typ}
              type="button"
              onClick={() => setTypeFilter(typeFilter === typ ? 'all' : typ)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                typeFilter === typ
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
              }`}
            >
              {getCalText(typ, locale)} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* ── Month Matrix View ── */}
      {viewMode === 'matrix' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {formatMonthTitle(year, month, locale)}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>

          <MonthMatrixView
            year={year}
            month={month}
            events={monthEvents}
            selectedDay={selectedDay}
            onDayClick={setSelectedDay}
            onSelectEvent={setSelectedEvent}
            locale={locale}
          />
        </div>
      )}

      {/* ── Agenda View ── */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            {getCalText('agendaView', locale)} ({monthEvents.length})
          </h2>
          <AgendaView
            events={monthEvents}
            onSelectEvent={setSelectedEvent}
            locale={locale}
          />
        </div>
      )}

      {/* ── Split Interactive View (Default) ── */}
      {viewMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Calendar Picker & Announcements */}
          <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {formatMonthTitle(year, month, locale)}
              </h2>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>

            {/* Calendar */}
            <MiniCalendar
              year={year}
              month={month}
              events={events}
              onDayClick={setSelectedDay}
              selectedDay={selectedDay}
              locale={locale}
            />

            {/* Event Types Legend */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                {getCalText('eventTypes', locale)}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {eventTypes.map(typ => (
                  <span
                    key={typ}
                    className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold border ${eventTypeColor(
                      typ
                    )}`}
                  >
                    {getCalText(typ, locale)}
                  </span>
                ))}
              </div>
            </div>

            {/* Announcements Panel */}
            {upcomingAnnouncements.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    {getCalText('announcements', locale)}
                  </h4>
                  <Link
                    href="/announcements"
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    {getCalText('viewAll', locale)}
                  </Link>
                </div>
                <div className="space-y-2">
                  {upcomingAnnouncements.map(a => (
                    <div
                      key={a.id}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1 bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${priorityColor(
                            a.priority
                          )}`}
                        >
                          {a.priority.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {a.targetAudience}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight line-clamp-2">
                        {a.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Events List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {selectedDay
                  ? `${getCalText('eventsOn', locale)} ${isoToDisplay(selectedDay, locale)}`
                  : `${getCalText('eventsIn', locale)} ${formatMonthTitle(year, month, locale)}`}
                <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                  ({displayEvents.length})
                </span>
              </h3>
              {selectedDay && (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold transition-colors cursor-pointer"
                >
                  {getCalText('showMonth', locale)}
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : displayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-14 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
                <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {selectedDay
                    ? getCalText('noEventsDay', locale)
                    : getCalText('noEventsMonth', locale)}
                </p>
                <p className="text-xs text-slate-400 max-w-sm">
                  {getCalText('eventsCreatedHint', locale)}
                </p>
                <Link
                  href="/cms/events"
                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors"
                >
                  {getCalText('goToCms', locale)}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {displayEvents.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="group p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {ev.eventType && (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${eventTypeColor(
                                ev.eventType
                              )}`}
                            >
                              {getCalText(ev.eventType, locale)}
                            </span>
                          )}
                          {ev.registrationRequired && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">
                              {getCalText('registrationRequired', locale)}
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                          {ev.title}
                        </h4>
                        {ev.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right rtl:text-left shrink-0 space-y-0.5 font-mono">
                        <p className="text-xs font-black text-slate-900 dark:text-white">
                          {isoToDisplay(ev.startDate, locale)}
                        </p>
                        {ev.startDate !== ev.endDate && (
                          <p className="text-[10px] text-slate-400">
                            → {isoToDisplay(ev.endDate, locale)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                      <div className="flex items-center gap-3 flex-wrap">
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            {ev.location}
                          </span>
                        )}
                        {ev.capacity && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {ev.capacity.toLocaleString()} {getCalText('seats', locale)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {getCalText('details', locale)}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Event Detail Modal ── */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          locale={locale}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

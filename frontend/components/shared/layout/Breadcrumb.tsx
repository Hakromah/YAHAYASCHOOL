'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { t } from '@/lib/i18n-dict';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Breadcrumb Component
// ─────────────────────────────────────────────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  academic: 'Academic',
  sections: 'Sections',
  users: 'Users',
  create: 'Create',
  edit: 'Edit',
  'audit-logs': 'Audit Logs',
  'activity-logs': 'Activity Logs',
  settings: 'Settings',
  'school-profile': 'School Profile',
  security: 'Security',
  notifications: 'Notifications',
  languages: 'Languages',
  students: 'Students',
  teachers: 'Teachers',
  parents: 'Parents',
  workers: 'Workers',
  finance: 'Finance',
  billing: 'Billing',
  accounting: 'Accounting',
  reports: 'Reports',
  statements: 'Statements',
  hostel: 'Hostel',
  exams: 'Exams',
  attendance: 'Attendance',
  timetable: 'Timetable',
  events: 'Events',
  quran: "Qur'an",
  lms: 'LMS',
  qms: 'QMS',
  llms: 'LLMS',
  library: 'Library',
  inventory: 'Inventory',
  transport: 'Transport',
  assets: 'Assets',
  media: 'Media Library',
  messages: 'Messages',
  directory: 'Directory',
  admissions: 'Admissions',
  clearance: 'Clearance',
};

interface BreadcrumbProps {
  className?: string;
  pageTitle?: string;
}

export function Breadcrumb({ className, pageTitle }: BreadcrumbProps) {
  const pathname = usePathname();
  const locale = useLocale();

  // Build breadcrumb segments from pathname
  const segments = pathname
    .replace(/^\/(en|ar|fr|tr)\//, '/')
    .split('/')
    .filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    // Check if it's an ID (numeric or documentId) — show as detail view
    const isId = /^[a-z0-9]{20,}$/i.test(segment) || /^\d+$/.test(segment);
    const rawLabel = isId ? 'Detail' : (ROUTE_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1));
    const label = t(rawLabel, locale);
    return { href, label, isId };
  });

  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm', className)}
    >
      <Link
        href="/dashboard"
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            {isLast ? (
              <span className="font-medium text-foreground">
                {pageTitle ? t(pageTitle, locale) : crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

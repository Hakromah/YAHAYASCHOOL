import { defineRouting } from 'next-intl/routing';

import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // All supported locales
  locales: ['en', 'ar', 'fr', 'tr'] as const,

  // Default locale — no URL prefix (e.g., /dashboard not /en/dashboard)
  defaultLocale: 'en',

  // Only add locale prefix when not the default locale
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

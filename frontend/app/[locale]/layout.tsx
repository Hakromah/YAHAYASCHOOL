/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Providers } from '@/providers';
import { DirectionProvider } from '@/components/shared/layout/DirectionProvider';
import type { Metadata } from 'next';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Locale Layout
// Sets language direction (RTL for Arabic) and provides i18n messages.
// Avoids nested <html>/<body> tags while updating document direction synchronously.
// ─────────────────────────────────────────────────────────────────────────────

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return {
    title: {
      default: isArabic
        ? 'يهايا سكول — إدارة المدرسة'
        : 'YAHAYASCOOL — School Management',
      template: isArabic ? '%s | يهايا سكول' : '%s | YAHAYASCOOL',
    },
    description: isArabic
      ? 'منصة إدارة المدرسة الدولية الإسلامية والإنجليزية ليهايا'
      : 'Enterprise educational management platform for Yahaya International Islamic and English High School',
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate the incoming locale
  if (!routing.locales.includes(locale as any)) {
    console.warn(`[LocaleLayout] Invalid locale detected: ${locale}`);
    notFound();
  }

  // RTL for Arabic
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  // Load messages for this locale
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <DirectionProvider locale={locale} direction={direction} />
      <div lang={locale} dir={direction} className="min-h-screen flex flex-col w-full">
        <Providers>
          {children}
        </Providers>
      </div>
    </NextIntlClientProvider>
  );
}

import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "@/providers/theme.provider";
import { LenisProvider } from "@/providers/lenis.provider";
import "./globals.css";

// ─────────────────────────────────────────────────────────────────────────────
// Root Layout — Minimal shell with global ThemeProvider
// Locale-specific providers are in app/[locale]/layout.tsx
// Placing ThemeProvider here ensures NextThemesProvider never re-renders across client locale changes
// ─────────────────────────────────────────────────────────────────────────────

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: {
    default: "YAHAYASCOOL — Yahaya International Islamic and English High School",
    template: "%s | YAHAYASCOOL",
  },
  description:
    "Enterprise educational management platform for Yahaya International Islamic and English High School — managing students, teachers, finance, hostel, and more.",
  keywords: ["school management", "Islamic school", "educational platform", "YAHAYASCOOL"],
  authors: [{ name: "YAHAYASCOOL Team" }],
  robots: {
    index: false, // Internal platform — not for public indexing
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning className={outfit.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* width=device-width prevents mobile zoom; interactive-widget keeps layout stable when keyboard appears */}
        <meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content" />
      </head>
      {/* DO NOT add overflow-hidden/clip to body — it kills scroll on all devices */}
      <body className="min-h-svh antialiased bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider>
          <LenisProvider>
            {children}
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

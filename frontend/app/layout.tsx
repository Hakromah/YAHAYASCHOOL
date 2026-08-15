import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "@/providers/theme.provider";
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('yahaya_theme')||localStorage.getItem('theme');if(s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

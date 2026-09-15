import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// The deployed Strapi URL — overridden by NEXT_PUBLIC_STRAPI_URL env var on Vercel
const strapiHostname = (() => {
  const raw = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1339';
  try {
    return new URL(raw).hostname;
  } catch {
    return 'localhost';
  }
})();

const nextConfig: NextConfig = {
  output: 'standalone',

  images: {
    // Keep unoptimized so Vercel free tier doesn't try to proxy-optimize
    // images from an external Strapi origin (which would hit the 1 000 req/month limit).
    // Images are already optimized by Cloudinary before reaching Next.js.
    unoptimized: true,

    // Allow SVG sources safely
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',

    remotePatterns: [
      // ── Local Strapi dev ──────────────────────────────────────────────────
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1339',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '1339',
        pathname: '/uploads/**',
      },

      // ── Deployed Strapi (dynamic hostname from env var) ────────────────────
      // This covers any hosting platform: Render, Railway, Hetzner VPS, etc.
      {
        protocol: 'https',
        hostname: strapiHostname,
        pathname: '/uploads/**',
      },

      // ── Cloudinary CDN ────────────────────────────────────────────────────
      // Strapi uploads go to Cloudinary on production; images are served from
      // res.cloudinary.com or the delivery URL tied to cloud name db9wzb7z5.
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },

      // ── Generic HTTPS wildcard ─────────────────────────────────────────────
      // Fallback so media from any HTTPS Strapi host works without reconfiguring.
      // This is safe because `unoptimized: true` means Next.js never proxies these —
      // it just validates that the <Image> src domain is in the allow-list.
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/image/upload/**',   // Cloudinary delivery URL pattern
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);

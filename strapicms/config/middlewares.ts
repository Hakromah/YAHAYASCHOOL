import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:', 'http:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'https:',                           // allow any HTTPS image (remote Strapi, Cloudinary, etc.)
            'market-assets.strapi.io',
            'res.cloudinary.com',
          ],
          'media-src': ["'self'", 'data:', 'blob:', 'https:'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: ['*'],
      origin: [
        'http://localhost:3002',
        'http://localhost:3001',
        'http://127.0.0.1:3002',
        // ── Production frontend ──────────────────────────────────────────────
        'https://yahayaschool.vercel.app',
        'https://*.vercel.app',               // allow Vercel preview URLs
        process.env.FRONTEND_URL || 'http://localhost:3002',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  // Custom: Filter academicHead relation dropdown to only show Section Head teacher profiles
  'global::academic-head-filter',
];

export default config;

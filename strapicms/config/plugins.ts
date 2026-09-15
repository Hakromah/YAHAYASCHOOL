import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/plain',
  'text/csv',
];

const config = ({ env }: Core.Config.Shared.ConfigParams): Record<string, unknown> => ({
  // ── Users & Permissions ───────────────────────────────────────────────────
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
    },
  },

  // ── Upload / Media ────────────────────────────────────────────────────────
  // When CLOUDINARY_NAME is set (production) → use Cloudinary (persistent).
  // When unset (local dev) → use local filesystem.
  upload: {
    config: {
      provider: env('CLOUDINARY_NAME') ? '@strapi/provider-upload-cloudinary' : 'local',
      providerOptions: env('CLOUDINARY_NAME')
        ? {
            cloud_name: env('CLOUDINARY_NAME'),
            api_key: env('CLOUDINARY_KEY'),
            api_secret: env('CLOUDINARY_SECRET'),
            actionOptions: {
              upload: {
                folder: env('CLOUDINARY_FOLDER', 'yahaya-school'),
              },
            },
          }
        : {},
      sizeLimit: 250 * 1024 * 1024, // 250 MB max upload
    },
  },

  // ── i18n (built-in to Strapi v5) ─────────────────────────────────────────
  i18n: {
    enabled: true,
    config: {
      defaultLocale: env('DEFAULT_LOCALE', 'en'),
      locales: ['en', 'ar', 'fr', 'tr'],
    },
  },

  // ── Email ─────────────────────────────────────────────────────────────────
  // Uncomment + configure when SMTP credentials are ready.
  // Install: npm install @strapi/provider-email-nodemailer
  // email: {
  //   config: {
  //     provider: 'nodemailer',
  //     providerOptions: {
  //       host: env('SMTP_HOST', 'smtp.gmail.com'),
  //       port: env.int('SMTP_PORT', 587),
  //       auth: {
  //         user: env('SMTP_USERNAME', ''),
  //         pass: env('SMTP_PASSWORD', ''),
  //       },
  //       secure: false,
  //     },
  //     settings: {
  //       defaultFrom: env('EMAIL_FROM', 'noreply@yahayascool.edu.ng'),
  //       defaultReplyTo: env('EMAIL_REPLY_TO', 'support@yahayascool.edu.ng'),
  //     },
  //   },
  // },
});

export default config;

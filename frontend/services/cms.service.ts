import { apiClient } from './api.service';
import type {
  HomepageEntity,
  CustomPageEntity,
  ProgramEntity,
  DepartmentEntity,
  ArticleEntity,
  EventEntity,
  AnnouncementEntity,
  TestimonialEntity,
  GalleryItemEntity,
  DownloadItemEntity,
  FaqEntity,
  ContactInfo,
  FooterConfig,
  NavigationMenu,
  PartnerEntity,
  DonationCampaignEntity,
  ContactSubmissionPayload,
  AdmissionApplicationPayload,
} from '../types/cms.types';

// Supported i18n locales to prevent invalid values like 'favicon.ico' from hitting Strapi API
const SUPPORTED_LOCALES = new Set(['en', 'ar', 'fr', 'tr']);
function cleanLocale(locale?: string | null): string {
  if (!locale || typeof locale !== 'string' || !SUPPORTED_LOCALES.has(locale)) {
    return 'en';
  }
  return locale;
}

// Helper to unwrap Strapi v5 API responses where data can be directly returned or wrapped in `{ data: ... }`
function unwrapResponse<T>(res: unknown): T | null {
  if (!res) return null;
  if (typeof res === 'object' && 'data' in res) {
    return (res as { data: T }).data || null;
  }
  return res as T;
}

export const cmsService = {
  /**
   * Fetch dynamic Homepage configuration with populated dynamic zones
   */
  async getHomepage(locale = 'en'): Promise<HomepageEntity | null> {
    try {
      const res = await apiClient.get('/homepage', {
        params: {
          locale: cleanLocale(locale),
          populate: {
            seo: { populate: '*' },
            sections: { populate: '*' },
          },
        },
      });
      return unwrapResponse<HomepageEntity>(res.data);
    } catch (error) {
      console.warn('[cmsService] Failed to fetch homepage:', error);
      return null;
    }
  },

  /**
   * Fetch custom dynamic page by slug (e.g. /about, /admissions)
   */
  async getPageBySlug(slug: string, locale = 'en'): Promise<CustomPageEntity | null> {
    try {
      const res = await apiClient.get('/pages', {
        params: {
          filters: { slug: { $eq: slug } },
          locale: cleanLocale(locale),
          populate: {
            seo: { populate: '*' },
            sections: { populate: '*' },
          },
        },
      });
      const items = unwrapResponse<CustomPageEntity[]>(res.data);
      return items && items.length > 0 ? items[0] : null;
    } catch (error) {
      console.warn(`[cmsService] Failed to fetch page slug="${slug}":`, error);
      return null;
    }
  },

  /**
   * Fetch all academic programs or featured ones
   */
  async getPrograms(locale = 'en', featuredOnly = false, limit = 20): Promise<ProgramEntity[]> {
    try {
      const filters: Record<string, unknown> = {};
      if (featuredOnly) {
        filters.isFeatured = { $eq: true };
      }
      const res = await apiClient.get('/programs', {
        params: {
          filters,
          locale: cleanLocale(locale),
          populate: ['images', 'downloads', 'department'],
          pagination: { limit },
        },
      });
      return unwrapResponse<ProgramEntity[]>(res.data) || [];
    } catch (error) {
      console.warn('[cmsService] Failed to fetch programs:', error);
      return [];
    }
  },

  /**
   * Fetch single program by slug
   */
  async getProgramBySlug(slug: string, locale = 'en'): Promise<ProgramEntity | null> {
    try {
      const res = await apiClient.get('/programs', {
        params: {
          filters: { slug: { $eq: slug } },
          locale: cleanLocale(locale),
          populate: ['images', 'downloads', 'department', 'seo'],
        },
      });
      const items = unwrapResponse<ProgramEntity[]>(res.data);
      return items && items.length > 0 ? items[0] : null;
    } catch (error) {
      console.warn(`[cmsService] Failed to fetch program slug="${slug}":`, error);
      return null;
    }
  },

  /**
   * Fetch all academic/administrative departments
   */
  async getDepartments(locale = 'en', limit = 20): Promise<DepartmentEntity[]> {
    try {
      const res = await apiClient.get('/departments', {
        params: {
          locale: cleanLocale(locale),
          populate: ['gallery', 'programs'],
          pagination: { limit },
        },
      });
      return unwrapResponse<DepartmentEntity[]>(res.data) || [];
    } catch (error) {
      console.warn('[cmsService] Failed to fetch departments:', error);
      return [];
    }
  },

  /**
   * Fetch single department by slug
   */
  async getDepartmentBySlug(slug: string, locale = 'en'): Promise<DepartmentEntity | null> {
    try {
      const res = await apiClient.get('/departments', {
        params: {
          filters: { slug: { $eq: slug } },
          locale: cleanLocale(locale),
          populate: ['gallery', 'programs', 'seo'],
        },
      });
      const items = unwrapResponse<DepartmentEntity[]>(res.data);
      return items && items.length > 0 ? items[0] : null;
    } catch (error) {
      console.warn(`[cmsService] Failed to fetch department slug="${slug}":`, error);
      return null;
    }
  },

  /**
   * Fetch news and articles with pagination
   */
  async getArticles(locale = 'en', page = 1, pageSize = 6, categorySlug?: string): Promise<{ data: ArticleEntity[]; total: number }> {
    try {
      const filters: Record<string, unknown> = {};
      if (categorySlug) {
        filters.category = { slug: { $eq: categorySlug } };
      }
      const res = await apiClient.get('/articles', {
        params: {
          filters,
          locale: cleanLocale(locale),
          populate: ['featuredImage', 'category'],
          sort: ['publishDate:desc', 'createdAt:desc'],
          pagination: { page, pageSize },
        },
      });
      const data = unwrapResponse<ArticleEntity[]>(res.data) || [];
      const total = res.data?.meta?.pagination?.total || data.length;
      return { data, total };
    } catch (error) {
      console.warn('[cmsService] Failed to fetch articles:', error);
      return { data: [], total: 0 };
    }
  },

  /**
   * Fetch single news article by slug
   */
  async getArticleBySlug(slug: string, locale = 'en'): Promise<ArticleEntity | null> {
    try {
      const res = await apiClient.get('/articles', {
        params: {
          filters: { slug: { $eq: slug } },
          locale: cleanLocale(locale),
          populate: ['featuredImage', 'gallery', 'category', 'seo'],
        },
      });
      const items = unwrapResponse<ArticleEntity[]>(res.data);
      return items && items.length > 0 ? items[0] : null;
    } catch (error) {
      console.warn(`[cmsService] Failed to fetch article slug="${slug}":`, error);
      return null;
    }
  },

  /**
   * Fetch upcoming events
   */
  async getEvents(locale = 'en', limit = 10): Promise<EventEntity[]> {
    try {
      const res = await apiClient.get('/events', {
        params: {
          locale: cleanLocale(locale),
          populate: ['banner', 'department'],
          sort: ['startDate:asc'],
          pagination: { limit },
        },
      });
      return unwrapResponse<EventEntity[]>(res.data) || [];
    } catch (error) {
      console.warn('[cmsService] Failed to fetch events:', error);
      return [];
    }
  },

  /**
   * Fetch urgent ticker announcements
   */
  async getAnnouncements(locale = 'en'): Promise<AnnouncementEntity[]> {
    try {
      const res = await apiClient.get('/announcements', {
        params: {
          locale: cleanLocale(locale),
          sort: ['priority:desc', 'createdAt:desc'],
        },
      });
      return unwrapResponse<AnnouncementEntity[]>(res.data) || [];
    } catch (error) {
      console.warn('[cmsService] Failed to fetch announcements:', error);
      return [];
    }
  },

  /**
   * Fetch testimonials
   */
  async getTestimonials(locale = 'en', limit = 6): Promise<TestimonialEntity[]> {
    try {
      const res = await apiClient.get('/testimonials', {
        params: {
          locale: cleanLocale(locale),
          populate: ['avatar'],
          pagination: { limit },
        },
      });
      return unwrapResponse<TestimonialEntity[]>(res.data) || [];
    } catch (error) {
      console.warn('[cmsService] Failed to fetch testimonials:', error);
      return [];
    }
  },

  /**
   * Fetch campus gallery items
   */
  async getGalleryItems(locale = 'en', limit = 12): Promise<GalleryItemEntity[]> {
    try {
      const res = await apiClient.get('/gallery-items', {
        params: {
          locale: cleanLocale(locale),
          populate: ['mediaFile'],
          pagination: { limit },
        },
      });
      return unwrapResponse<GalleryItemEntity[]>(res.data) || [];
    } catch (error) {
      console.warn('[cmsService] Failed to fetch gallery items:', error);
      return [];
    }
  },

  /**
   * Fetch public downloadable brochures and forms
   */
  async getDownloadItems(locale = 'en'): Promise<DownloadItemEntity[]> {
    try {
      const res = await apiClient.get('/download-items', {
        params: {
          locale: cleanLocale(locale),
          populate: ['file'],
        },
      });
      return unwrapResponse<DownloadItemEntity[]>(res.data) || [];
    } catch (error) {
      console.warn('[cmsService] Failed to fetch downloads:', error);
      return [];
    }
  },

  /**
   * Fetch FAQ items
   */
  async getFaqs(locale = 'en', category?: string): Promise<FaqEntity[]> {
    try {
      const filters: Record<string, unknown> = {};
      if (category) filters.category = { $eq: category };
      const res = await apiClient.get('/faqs', {
        params: {
          filters,
          locale: cleanLocale(locale),
          sort: ['order:asc'],
        },
      });
      return unwrapResponse<FaqEntity[]>(res.data) || [];
    } catch (error) {
      console.warn('[cmsService] Failed to fetch FAQs:', error);
      return [];
    }
  },

  /**
   * Fetch global Contact Information & Office Hours
   */
  async getContactInfo(locale = 'en'): Promise<ContactInfo | null> {
    try {
      const res = await apiClient.get('/contact-info', {
        params: { locale: cleanLocale(locale) },
      });
      return unwrapResponse<ContactInfo>(res.data);
    } catch (error) {
      console.warn('[cmsService] Failed to fetch contact info:', error);
      return null;
    }
  },

  /**
   * Fetch dynamic Footer Configuration
   */
  async getFooterConfig(locale = 'en'): Promise<FooterConfig | null> {
    try {
      const res = await apiClient.get('/footer-config', {
        params: { locale: cleanLocale(locale), populate: '*' },
      });
      return unwrapResponse<FooterConfig>(res.data);
    } catch (error) {
      console.warn('[cmsService] Failed to fetch footer config:', error);
      return null;
    }
  },

  /**
   * Fetch navigation menu by location (`header`, `footer`, `topbar`)
   */
  async getNavigationMenu(location: 'header' | 'footer' | 'topbar', locale = 'en'): Promise<NavigationMenu | null> {
    try {
      const res = await apiClient.get('/navigation-menus', {
        params: {
          filters: { location: { $eq: location } },
          locale: cleanLocale(locale),
          populate: { items: { populate: '*' } },
        },
      });
      const items = unwrapResponse<NavigationMenu[]>(res.data);
      return items && items.length > 0 ? items[0] : null;
    } catch (error) {
      console.warn(`[cmsService] Failed to fetch menu location="${location}":`, error);
      return null;
    }
  },

  /**
   * Fetch partners, accreditation bodies, and waqf sponsors
   */
  async getPartners(locale = 'en'): Promise<PartnerEntity[]> {
    try {
      const res = await apiClient.get('/partners', {
        params: {
          locale: cleanLocale(locale),
          populate: ['logo'],
          sort: ['order:asc'],
        },
      });
      return unwrapResponse<PartnerEntity[]>(res.data) || [];
    } catch (error) {
      console.warn('[cmsService] Failed to fetch partners:', error);
      return [];
    }
  },

  /**
   * Fetch active donation campaigns
   */
  async getDonationCampaigns(locale = 'en'): Promise<DonationCampaignEntity[]> {
    try {
      const res = await apiClient.get('/donation-campaigns', {
        params: {
          locale: cleanLocale(locale),
          populate: ['banner'],
        },
      });
      return unwrapResponse<DonationCampaignEntity[]>(res.data) || [];
    } catch (error) {
      console.warn('[cmsService] Failed to fetch donation campaigns:', error);
      return [];
    }
  },

  /**
   * Submit Contact Form Inquiry
   */
  async submitContactForm(payload: ContactSubmissionPayload): Promise<{ success: boolean; message?: string }> {
    try {
      await apiClient.post('/contact-submissions', {
        data: payload,
      });
      return { success: true };
    } catch (error: unknown) {
      console.error('[cmsService] Contact submission error:', error);
      return { success: false, message: 'Failed to submit inquiry. Please try again or contact us via phone.' };
    }
  },

  /**
   * Submit Online Admission Registration Application
   */
  async submitAdmissionApplication(payload: AdmissionApplicationPayload): Promise<{ success: boolean; applicationNumber?: string; message?: string }> {
    try {
      const res = await apiClient.post('/admission-applications', {
        data: payload,
      });
      const created = unwrapResponse<{ applicationNumber?: string }>(res.data);
      return {
        success: true,
        applicationNumber: created?.applicationNumber || 'SUBMITTED',
      };
    } catch (error: unknown) {
      console.error('[cmsService] Admission application error:', error);
      return { success: false, message: 'Failed to submit admission application. Please check all fields or try again.' };
    }
  },
};

/**
 * Helper to resolve Strapi media URL whether absolute or relative
 */
export function getStrapiMediaUrl(media: { url?: string } | null | undefined): string | null {
  if (!media || !media.url) return null;
  if (media.url.startsWith('http://') || media.url.startsWith('https://')) return media.url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1339';
  return `${baseUrl}${media.url.startsWith('/') ? '' : '/'}${media.url}`;
}

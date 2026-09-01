import { apiClient } from './api.service';
import qs from 'qs';
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
  DonationSettingsEntity,
  CareerPositionEntity,
  CareerSettingEntity,
  StaffMemberEntity
} from '../types/cms.types';

export const cmsService = {
  /** Helper for robust querying */
  async fetchStrapi<T>(endpoint: string, queryParams: any = {}): Promise<T | null> {
    try {
      const queryString = qs.stringify(queryParams, { encodeValuesOnly: true });
      const url = `${endpoint}${queryString ? `?${queryString}` : ''}`;
      const { data } = await apiClient.get<{ data: T }>(url);
      return data.data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return null;
    }
  },

  async getHomepage(locale = 'en'): Promise<HomepageEntity | null> {
    const query = {
      locale,
      populate: {
        sections: {
          populate: '*'
        }
      }
    };
    const data = await this.fetchStrapi<HomepageEntity>('/homepage', query);
    // If not found, return empty fallback
    return data || { id: 0, title: 'Home', sections: [] };
  },
  
  async getPageBySlug(slug: string, locale = 'en'): Promise<CustomPageEntity | null> {
    const query = {
      locale,
      filters: { slug: { $eq: slug } },
      populate: {
        seo: { populate: '*' },
        sections: { populate: '*' },
        bulletPoints: { populate: '*' },
        coverImage: { populate: '*' }
      }
    };
    const data = await this.fetchStrapi<CustomPageEntity[]>('/pages', query);
    return data && data.length > 0 ? data[0] : null;
  },

  async getDonationSettings(locale = 'en'): Promise<DonationSettingsEntity | null> {
    const query = {
      locale,
      populate: {
        bankTransfer: {
          populate: {
            image: true,
            bankAccounts: true,
          }
        },
        formLabels: true,
        targetedGiving: true,
        wallOfGratitude: {
          populate: {
            patrons: true
          }
        },
        amounts: true,
        currencies: true,
        designations: true
      }
    };
    const data = await this.fetchStrapi<DonationSettingsEntity>('/donation-setting', query);
    return data;
  },
  
  async getCareerPositions(locale = 'en'): Promise<CareerPositionEntity[]> {
    const query = {
      locale,
      filters: { isActive: { $eq: true } },
      sort: ['order:asc', 'createdAt:desc'],
      populate: ['requirements', 'responsibilities']
    };
    const data = await this.fetchStrapi<CareerPositionEntity[]>('/career-positions', query);
    return data || [];
  },

  async getCareerSetting(locale = 'en'): Promise<CareerSettingEntity | null> {
    const data = await this.fetchStrapi<CareerSettingEntity>('/career-setting', { 
      locale,
      populate: ['formBackgroundImage']
    });
    return data || null;
  },

  async getPrograms(locale = 'en', featuredOnly = false, limit = 20): Promise<ProgramEntity[]> {
    const query: any = {
      locale,
      populate: ['images', 'department'],
      pagination: { limit }
    };
    if (featuredOnly) {
      query.filters = { isFeatured: { $eq: true } };
    }
    const data = await this.fetchStrapi<ProgramEntity[]>('/programs', query);
    return data || [];
  },
  
  async getProgramBySlug(slug: string, locale = 'en'): Promise<ProgramEntity | null> {
    const query = {
      locale,
      filters: { slug: { $eq: slug } },
      populate: '*'
    };
    const data = await this.fetchStrapi<ProgramEntity[]>('/programs', query);
    return data && data.length > 0 ? data[0] : null;
  },
  
  async getDepartments(locale = 'en', limit = 20): Promise<DepartmentEntity[]> {
    const query = {
      locale,
      populate: ['gallery', 'programs'],
      pagination: { limit }
    };
    const data = await this.fetchStrapi<DepartmentEntity[]>('/departments', query);
    return data || [];
  },
  
  async getDepartmentBySlug(slug: string, locale = 'en'): Promise<DepartmentEntity | null> {
    const query = {
      locale,
      filters: { slug: { $eq: slug } },
      populate: '*'
    };
    const data = await this.fetchStrapi<DepartmentEntity[]>('/departments', query);
    return data && data.length > 0 ? data[0] : null;
  },
  
  async getArticles(locale = 'en', page = 1, pageSize = 6, categorySlug?: string): Promise<{ data: ArticleEntity[]; total: number }> {
    const query: any = {
      locale,
      populate: ['featuredImage', 'category', 'gallery'],
      pagination: { page, pageSize }
    };
    if (categorySlug) {
      query.filters = { category: { slug: { $eq: categorySlug } } };
    }
    try {
      const queryString = qs.stringify(query, { encodeValuesOnly: true });
      const { data } = await apiClient.get(`/articles?${queryString}`);
      return {
        data: data.data || [],
        total: data.meta?.pagination?.total || 0
      };
    } catch (e) {
      return { data: [], total: 0 };
    }
  },
  
  async getArticleBySlug(slug: string, locale = 'en'): Promise<ArticleEntity | null> {
    const query = {
      locale,
      filters: { slug: { $eq: slug } },
      populate: '*'
    };
    const data = await this.fetchStrapi<ArticleEntity[]>('/articles', query);
    return data && data.length > 0 ? data[0] : null;
  },
  
  async getEvents(locale = 'en', limit = 10): Promise<EventEntity[]> {
    const query = {
      locale,
      populate: ['banner', 'gallery', 'department'],
      pagination: { limit },
      sort: ['startDate:asc']
    };
    const data = await this.fetchStrapi<EventEntity[]>('/events', query);
    return data || [];
  },
  
  async getAnnouncements(locale = 'en'): Promise<AnnouncementEntity[]> {
    const query = {
      locale,
      pagination: { limit: 5 },
      sort: ['createdAt:desc']
    };
    const data = await this.fetchStrapi<AnnouncementEntity[]>('/announcements', query);
    return data || [];
  },
  
  async getTestimonials(locale = 'en', limit = 6): Promise<TestimonialEntity[]> {
    const query = {
      locale,
      populate: ['avatar'],
      pagination: { limit }
    };
    const data = await this.fetchStrapi<TestimonialEntity[]>('/testimonials', query);
    return data || [];
  },
  
  async getGalleryItems(locale = 'en', limit = 12): Promise<GalleryItemEntity[]> {
    const query = {
      locale,
      populate: ['mediaFile'],
      pagination: { limit }
    };
    const data = await this.fetchStrapi<GalleryItemEntity[]>('/gallery-items', query);
    return data || [];
  },
  
  async getDownloadItems(locale = 'en'): Promise<DownloadItemEntity[]> {
    const query = {
      locale,
      populate: ['file']
    };
    const data = await this.fetchStrapi<DownloadItemEntity[]>('/download-items', query);
    return data || [];
  },
  
  async getFaqs(locale = 'en', category?: string): Promise<FaqEntity[]> {
    const query: any = { locale };
    if (category) {
      query.filters = { category: { slug: { $eq: category } } };
    }
    const data = await this.fetchStrapi<FaqEntity[]>('/faqs', query);
    return data || [];
  },
  
  async getContactInfo(locale = 'en'): Promise<ContactInfo | null> {
    const data = await this.fetchStrapi<ContactInfo>('/contact-info', { locale, populate: '*' });
    // Fallback if not configured in Strapi yet
    return data || {
      id: 0,
      address: '123 School St',
      phone: '+1234567890',
      email: 'info@yahayaschool.com'
    };
  },
  
  async getFooterConfig(locale = 'en'): Promise<FooterConfig | null> {
    const data = await this.fetchStrapi<FooterConfig>('/footer-config', { locale, populate: '*' });
    return data || {
      id: 0,
      copyrightText: '© 2026 YAHAYASCOOL'
    };
  },
  
  async getNavigationMenu(location: 'header' | 'footer' | 'topbar', locale = 'en'): Promise<NavigationMenu | null> {
    const query = {
      locale,
      filters: { location: { $eq: location } },
      populate: {
        items: {
          populate: ['subItems.media']
        }
      }
    };
    
    try {
      const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api'}/navigation-menus?${qs.stringify(query, { encodeValuesOnly: true })}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        if (data && data.length > 0) return data[0];
      }
    } catch (e) {
      console.error('Error fetching navigation menu:', e);
    }
    
    // Fallback for header if Strapi returns nothing
    if (location === 'header') {
      return {
        id: 1,
        name: 'Header',
        slug: 'header',
        location: 'header',
        items: [
          { title: 'Home', url: '/' },
          { title: 'About', url: '/about' },
          { title: 'Admissions', url: '/admissions' },
          { title: 'Contact', url: '/contact' }
        ]
      };
    }
    return null;
  },
  
  async getPartners(locale = 'en'): Promise<PartnerEntity[]> {
    const query = {
      locale,
      populate: ['logo']
    };
    const data = await this.fetchStrapi<PartnerEntity[]>('/partners', query);
    return data || [];
  },
  
  async getDonationCampaigns(locale = 'en'): Promise<DonationCampaignEntity[]> {
    const query = {
      locale,
      populate: ['banner']
    };
    const data = await this.fetchStrapi<DonationCampaignEntity[]>('/donation-campaigns', query);
    return data || [];
  },
  
  async submitContactForm(payload: ContactSubmissionPayload): Promise<{ success: boolean; message?: string }> {
    try {
      await apiClient.post('/contact-submissions', { data: payload });
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Failed to submit form' };
    }
  },
  
  async submitAdmissionApplication(payload: AdmissionApplicationPayload): Promise<{ success: boolean; applicationNumber?: string; message?: string }> {
    try {
      const res = await apiClient.post('/admission-applications', { data: payload });
      return { success: true, applicationNumber: res.data?.data?.applicationNumber || 'APP-00000' };
    } catch (e) {
      return { success: false, message: 'Failed to submit application' };
    }
  },

  async getStaffMembers(locale = 'en'): Promise<StaffMemberEntity[]> {
    const data = await this.fetchStrapi<StaffMemberEntity[]>('/staff-members', {
      locale,
      sort: ['order:asc'],
      populate: ['image'],
    });
    return data || [];
  },

  /**
   * Create a new event
   */
  async createEvent(payload: Partial<EventEntity>): Promise<EventEntity> {
    const res = await apiClient.post('/events', { data: payload });
    return res.data?.data || res.data;
  },

  /**
   * Create a new announcement
   */
  async createAnnouncement(payload: Partial<AnnouncementEntity>): Promise<AnnouncementEntity> {
    const res = await apiClient.post('/announcements', { data: payload });
    return res.data?.data || res.data;
  },
};

export function getStrapiMediaUrl(media: any): string | null {
  if (!media) return null;
  const rawUrl = typeof media === 'string' 
    ? media 
    : (media.url || media.photoUrl || media.avatarUrl || media.data?.attributes?.url || media.data?.url);
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  
  if (rawUrl.startsWith('/')) {
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    return `${strapiUrl}${rawUrl}`;
  }
  
  return rawUrl;
}

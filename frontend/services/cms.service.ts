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

export const cmsService = {
  async getHomepage(locale = 'en'): Promise<HomepageEntity | null> {
    return {
      id: 1,
      title: 'Home',
      sections: [
        {
          __component: 'sections.hero',
          title: 'Welcome to YAHAYASCOOL',
          subtitle: 'Empowering future Muslim leaders.',
          primaryCtaText: 'Apply Now',
          primaryCtaUrl: '/admissions',
        }
      ]
    };
  },
  
  async getPageBySlug(slug: string, locale = 'en'): Promise<CustomPageEntity | null> {
    return { id: 1, title: slug, slug };
  },
  
  async getPrograms(locale = 'en', featuredOnly = false, limit = 20): Promise<ProgramEntity[]> {
    return [];
  },
  
  async getProgramBySlug(slug: string, locale = 'en'): Promise<ProgramEntity | null> {
    return null;
  },
  
  async getDepartments(locale = 'en', limit = 20): Promise<DepartmentEntity[]> {
    return [];
  },
  
  async getDepartmentBySlug(slug: string, locale = 'en'): Promise<DepartmentEntity | null> {
    return null;
  },
  
  async getArticles(locale = 'en', page = 1, pageSize = 6, categorySlug?: string): Promise<{ data: ArticleEntity[]; total: number }> {
    return { data: [], total: 0 };
  },
  
  async getArticleBySlug(slug: string, locale = 'en'): Promise<ArticleEntity | null> {
    return null;
  },
  
  async getEvents(locale = 'en', limit = 10): Promise<EventEntity[]> {
    return [];
  },
  
  async getAnnouncements(locale = 'en'): Promise<AnnouncementEntity[]> {
    return [];
  },
  
  async getTestimonials(locale = 'en', limit = 6): Promise<TestimonialEntity[]> {
    return [];
  },
  
  async getGalleryItems(locale = 'en', limit = 12): Promise<GalleryItemEntity[]> {
    return [];
  },
  
  async getDownloadItems(locale = 'en'): Promise<DownloadItemEntity[]> {
    return [];
  },
  
  async getFaqs(locale = 'en', category?: string): Promise<FaqEntity[]> {
    return [];
  },
  
  async getContactInfo(locale = 'en'): Promise<ContactInfo | null> {
    return {
      id: 1,
      address: '123 School St',
      phone: '+1234567890',
      email: 'info@yahayaschool.com'
    };
  },
  
  async getFooterConfig(locale = 'en'): Promise<FooterConfig | null> {
    return {
      id: 1,
      copyrightText: '© 2026 YAHAYASCOOL'
    };
  },
  
  async getNavigationMenu(location: 'header' | 'footer' | 'topbar', locale = 'en'): Promise<NavigationMenu | null> {
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
    return [];
  },
  
  async getDonationCampaigns(locale = 'en'): Promise<DonationCampaignEntity[]> {
    return [];
  },
  
  async submitContactForm(payload: ContactSubmissionPayload): Promise<{ success: boolean; message?: string }> {
    return { success: true };
  },
  
  async submitAdmissionApplication(payload: AdmissionApplicationPayload): Promise<{ success: boolean; applicationNumber?: string; message?: string }> {
    return { success: true, applicationNumber: 'APP-12345' };
  }
};

export function getStrapiMediaUrl(media: any): string | null {
  if (!media) return null;
  const rawUrl = typeof media === 'string' 
    ? media 
    : (media.url || media.photoUrl || media.avatarUrl || media.data?.attributes?.url || media.data?.url);
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  return rawUrl;
}

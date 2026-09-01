import type { UploadedFile as StrapiMediaFile } from './upload.types';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — CMS TypeScript Definitions
// Covers all single types, collection types, and dynamic zone builder components
// ─────────────────────────────────────────────────────────────────────────────

export interface SeoMetaComponent {
  metaTitle: string;
  metaDescription: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: StrapiMediaFile;
  twitterCardType?: 'summary' | 'summary_large_image';
  schemaOrgJson?: Record<string, unknown>;
  noIndex?: boolean;
  noFollow?: boolean;
}

export interface NavigationMenuItem {
  id?: number;
  title: string;
  url: string;
  target?: '_self' | '_blank';
  icon?: string;
  order?: number;
  isVisible?: boolean;
  children?: NavigationMenuItem[];
}

export interface NavigationMenu {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
  location: 'header' | 'footer' | 'topbar';
  ctaButtonTitle?: string;
  ctaButtonUrl?: string;
  items: NavigationMenuItem[];
}

export interface FooterConfig {
  id: number;
  documentId?: string;
  quickLinks?: NavigationMenuItem[];
  academicsLinks?: NavigationMenuItem[];
  supportLinks?: NavigationMenuItem[];
  logo?: StrapiMediaFile;
  email?: string;
  phone?: string;
  socialLinks?: NavigationMenuItem[];
  brandName?: string;
  brandTagline1?: string;
  brandTagline2?: string;
  brandDescription?: string;
  pills?: NavigationMenuItem[];
  termsLabel?: string;
  privacyUrl?: string;
  privacyLabel?: string;
  socialsLabel?: string;
  emailLabel?: string;
  phoneLabel?: string;
  quickLinksTitle?: string;
  academicsTitle?: string;
  supportTitle?: string;
  contactText?: string;
  copyrightText?: string;
  newsletterHeading?: string;
  newsletterSubheading?: string;
}

export interface ContactInfo {
  id: number;
  documentId?: string;
  campusInfo?: {
    campusTitle?: string;
    addressLabel?: string;
    address: string;
    phoneLabel?: string;
    phone: string;
    whatsappLabel?: string;
    whatsapp?: string;
    emailLabel?: string;
    email: string;
    officeHoursLabel?: string;
    officeHours?: string;
    mapUrl?: string;
    latitude?: number;
    longitude?: number;
  };
  socialMedia?: {
    facebookUrl?: string;
    twitterUrl?: string;
    instagramUrl?: string;
    linkedinUrl?: string;
  };
  contactForm?: {
    formTitle?: string;
    formFirstNameLabel?: string;
    formFirstNamePlaceholder?: string;
    formLastNameLabel?: string;
    formLastNamePlaceholder?: string;
    formEmailLabel?: string;
    formEmailPlaceholder?: string;
    formPhoneLabel?: string;
    formSubjectLabel?: string;
    formMessageLabel?: string;
    formMessagePlaceholder?: string;
    formTermsLinkText?: string;
    formTermsSuffix?: string;
    formSubmitButtonText?: string;
  };
}

export interface StatItem {
  number: string;
  label: string;
  icon?: string;
}

export interface FeatureCardItem {
  title: string;
  description: string;
  icon?: string;
  link?: string;
}

// ── Dynamic Zone Component Interfaces ─────────────────────────────────────────

export interface HeroSectionComponent {
  __component: 'sections.hero';
  badge?: string;
  title: string;
  subtitle?: string;
  backgroundMedia?: StrapiMediaFile;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
}

export interface StatsSectionComponent {
  __component: 'sections.stats';
  title?: string;
  subtitle?: string;
  statsList?: StatItem[];
}

export interface FeatureCardsSectionComponent {
  __component: 'sections.feature-cards';
  title?: string;
  subtitle?: string;
  cards?: FeatureCardItem[];
}


export interface ProgramsGridSectionComponent {
  __component: 'sections.programs-grid';
  title?: string;
  subtitle?: string;
  limit?: number;
  showFeaturedOnly?: boolean;
}

export interface DepartmentsGridSectionComponent {
  __component: 'sections.departments-grid';
  title?: string;
  subtitle?: string;
  limit?: number;
}

export interface NewsGridSectionComponent {
  __component: 'sections.news-grid';
  title?: string;
  subtitle?: string;
  limit?: number;
  categoryFilter?: string;
}

export interface EventsGridSectionComponent {
  __component: 'sections.events-grid';
  title?: string;
  subtitle?: string;
  limit?: number;
}

export interface TestimonialsSectionComponent {
  __component: 'sections.testimonials-slider';
  title?: string;
  subtitle?: string;
  limit?: number;
}

export interface GalleryPreviewSectionComponent {
  __component: 'sections.gallery-preview';
  title?: string;
  subtitle?: string;
  mediaItems?: StrapiMediaFile[];
  viewAllUrl?: string;
}

export interface DonationBannerSectionComponent {
  __component: 'sections.donation-banner';
  badge?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
}

export interface NewsletterSignupSectionComponent {
  __component: 'sections.newsletter-signup';
  title?: string;
  subtitle?: string;
  placeholderText?: string;
  buttonText?: string;
}

export interface SponsorsGridSectionComponent {
  __component: 'sections.sponsors-grid';
  title?: string;
  subtitle?: string;
  partnersList?: Array<{ name: string; logoUrl?: string; websiteUrl?: string }>;
}

export type DynamicZoneSection =
  | HeroSectionComponent
  | StatsSectionComponent
  | FeatureCardsSectionComponent

  | ProgramsGridSectionComponent
  | DepartmentsGridSectionComponent
  | NewsGridSectionComponent
  | EventsGridSectionComponent
  | TestimonialsSectionComponent
  | GalleryPreviewSectionComponent
  | DonationBannerSectionComponent

  | NewsletterSignupSectionComponent
  | SponsorsGridSectionComponent;

// ── Main Content Type Entities ────────────────────────────────────────────────

export interface HomepageEntity {
  id: number;
  documentId?: string;
  title: string;
  seo?: SeoMetaComponent;
  sections?: DynamicZoneSection[];
}

export interface BulletPointComponent {
  id: number;
  text: string;
}

export interface CustomPageEntity {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  seo?: SeoMetaComponent;
  sections?: DynamicZoneSection[];
  bulletPoints?: BulletPointComponent[];
  coverImage?: StrapiMediaFile;
  breadcrumbTitle?: string;
  actionButtonText?: string;
}

export type Page = CustomPageEntity;
export type Program = ProgramEntity;
export type Department = DepartmentEntity;
export type Category = CategoryEntity;
export type Article = ArticleEntity;
export type Event = EventEntity;
export type Announcement = AnnouncementEntity;
export type Testimonial = TestimonialEntity;
export type GalleryItem = GalleryItemEntity;
export type DownloadItem = DownloadItemEntity;
export type StaffMember = StaffMemberEntity;

export interface CareerSettingEntity {
  id: number;
  documentId?: string;
  boardTitle: string;
  boardDescription: string;
  formTitle?: string;
  formFullNameLabel?: string;
  formFullNamePlaceholder?: string;
  formEmailLabel?: string;
  formEmailPlaceholder?: string;
  formPhoneLabel?: string;
  formPhonePlaceholder?: string;
  formUploadInstruction?: string;
  formUploadRequirements?: string;
  formTermsPrefix?: string;
  formTermsLinkText?: string;
  formSubmitButtonText?: string;
  formBackgroundImage?: StrapiMediaFile;
}

export interface ProgramEntity {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  description: string;
  objectives?: string;
  duration?: string;
  requirements?: string;
  coverImage?: StrapiMediaFile;
  images?: StrapiMediaFile[];
  downloads?: StrapiMediaFile[];
  isFeatured?: boolean;
  department?: DepartmentEntity;
  seo?: SeoMetaComponent;
}

export interface DepartmentEntity {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  description?: string;
  headOfDepartment?: string;
  gallery?: StrapiMediaFile[];
  teachers?: Array<{ name: string; title: string; avatar?: string; bio?: string }>;
  announcements?: Array<{ title: string; date: string; content: string }>;
  programs?: ProgramEntity[];
  seo?: SeoMetaComponent;
}

export interface CategoryEntity {
  id: number;
  documentId?: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ArticleEntity {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  featuredImage?: StrapiMediaFile;
  gallery?: StrapiMediaFile[];
  author?: string;
  tags?: string[];
  publishDate?: string;
  isFeatured?: boolean;
  viewsCount?: number;
  category?: CategoryEntity;
  seo?: SeoMetaComponent;
}

export interface EventEntity {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  description: string;
  eventType?: 'Academic' | 'Islamic/Religious' | 'Sports' | 'Cultural' | 'Parent Gathering' | 'Holiday';
  location?: string;
  startDate: string;
  endDate: string;
  registrationRequired?: boolean;
  capacity?: number;
  registrationDeadline?: string;
  banner?: StrapiMediaFile;
  gallery?: StrapiMediaFile[];
  videos?: StrapiMediaFile[];
  downloads?: StrapiMediaFile[];
  department?: DepartmentEntity;
  seo?: SeoMetaComponent;
}

export interface AnnouncementEntity {
  id: number;
  documentId?: string;
  title: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  publishDate?: string;
  expiryDate?: string;
  targetAudience: 'all' | 'students' | 'parents' | 'teachers' | 'public';
}

export interface TestimonialEntity {
  id: number;
  documentId?: string;
  authorName: string;
  authorRole?: string;
  quote: string;
  avatar?: StrapiMediaFile;
  rating?: number;
  isFeatured?: boolean;
}

export interface GalleryItemEntity {
  id: number;
  documentId?: string;
  title: string;
  description?: string;
  caption?: string;
  mediaType: 'photo' | 'video';
  mediaFile?: StrapiMediaFile;
  category?: string;
  isFeatured?: boolean;
}

export interface DownloadItemEntity {
  id: number;
  documentId?: string;
  title: string;
  description?: string;
  file?: StrapiMediaFile;
  category?: string;
  fileSizeLabel?: string;
}

export interface FaqEntity {
  id: number;
  documentId?: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

export interface PartnerEntity {
  id: number;
  documentId?: string;
  name: string;
  logo?: StrapiMediaFile;
  websiteUrl?: string;
  partnerType: 'accreditation' | 'educational' | 'waqf_sponsor' | 'partner';
  order?: number;
}

export interface BankAccountRowComponent {
  id: number;
  label: string;
  value: string;
  canCopy?: boolean;
}

export interface BankAccountComponent {
  id: number;
  title: string;
  icon: 'Globe' | 'Building';
  rows: BankAccountRowComponent[];
}

export interface StringItemComponent {
  id: number;
  value: string;
}

export interface DonationSettingsEntity {
  id: number;
  bankTransfer?: {
    id: number;
    title?: string;
    image?: { url: string; alternativeText?: string };
    bankAccounts?: BankAccountEntity[];
  };
  formLabels?: {
    id: number;
    formTitle?: string;
    amountLabel?: string;
    otherAmountLabel?: string;
    frequencyLabel?: string;
    oneTimeLabel?: string;
    monthlyLabel?: string;
    currencyLabel?: string;
    designationLabel?: string;
    donorInfoLabel?: string;
    fullNameLabel?: string;
    fullNamePlaceholder?: string;
    emailLabel?: string;
    emailPlaceholder?: string;
    phoneLabel?: string;
    submitButtonLabel?: string;
    secureInfoText?: string;
  };
  targetedGiving?: {
    id: number;
    title1?: string;
    title2?: string;
    subtitle?: string;
    raisedLabel?: string;
    goalLabel?: string;
  };
  wallOfGratitude?: {
    id: number;
    title: string;
    subtitle: string;
    patrons: Array<{ id: number; name: string; quote: string }>;
  };
  amounts?: StringItemEntity[];
  currencies?: StringItemEntity[];
  designations?: StringItemComponent[];
}

export interface DonationCampaignEntity {
  id: number;
  documentId?: string;
  title: string;
  slug: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  currency?: string;
  categoryTag?: string;
  buttonText?: string;
  raisedLabel?: string;
  goalLabel?: string;
  banner?: StrapiMediaFile;
  isFeatured?: boolean;
}

export interface ContactSubmissionPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  department?: string;
  message: string;
}

export interface AdmissionApplicationPayload {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  nationality: string;
  religion?: string;
  address: string;
  previousSchool?: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentOccupation?: string;
  desiredProgram: string;
  desiredDepartment: string;
  desiredSection?: string;
  hostelRequired?: boolean;
  medicalInfo?: string;
  passportPhotoId?: number;
  birthCertificateId?: number;
  supportingDocumentIds?: number[];
}

export interface CareerPositionEntity {
  id: number;
  documentId?: string;
  title: string;
  type: string;
  location: string;
  locationUrl?: string;
  isActive: boolean;
  order: number;
  requirements: Array<{ id: number; value: string }>;
  responsibilities: Array<{ id: number; value: string }>;
}

export interface StaffMemberEntity {
  id: number;
  documentId?: string;
  name: string;
  role: string;
  email?: string;
  image: StrapiMediaFile;
  order: number;
  facebookUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
}

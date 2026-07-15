import type { Schema, Struct } from '@strapi/strapi';

export interface ErpBehaviorRecord extends Struct.ComponentSchema {
  collectionName: 'components_erp_behavior_records';
  info: {
    description: 'Student conduct and behavior monitoring records (Green/Yellow/Red)';
    displayName: 'Behavior Record';
    icon: 'shield-alert';
  };
  attributes: {
    category: Schema.Attribute.String & Schema.Attribute.Required;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    description: Schema.Attribute.RichText & Schema.Attribute.Required;
    followUpRequired: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    level: Schema.Attribute.Enumeration<['green', 'yellow', 'red']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'green'>;
    parentNotified: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    recommendation: Schema.Attribute.Text;
    resolution: Schema.Attribute.Text;
    teacherName: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ErpEnrollmentRecord extends Struct.ComponentSchema {
  collectionName: 'components_erp_enrollment_records';
  info: {
    description: 'Historical and active multi-section academic enrollment records';
    displayName: 'Enrollment Record';
    icon: 'user-check';
  };
  attributes: {
    academicYear: Schema.Attribute.String & Schema.Attribute.Required;
    enrollmentDate: Schema.Attribute.Date & Schema.Attribute.Required;
    notes: Schema.Attribute.Text;
    primarySection: Schema.Attribute.String & Schema.Attribute.Required;
    secondarySections: Schema.Attribute.JSON;
    status: Schema.Attribute.Enumeration<
      ['active', 'completed', 'transferred', 'withdrawn']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'active'>;
    term: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ErpMedicalRecord extends Struct.ComponentSchema {
  collectionName: 'components_erp_medical_records';
  info: {
    description: 'Student health and clinic emergency instruction summary';
    displayName: 'Medical Record';
    icon: 'heart';
  };
  attributes: {
    bloodGroup: Schema.Attribute.Enumeration<
      ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    >;
    currentMedications: Schema.Attribute.Text;
    emergencyInstructions: Schema.Attribute.RichText;
    hospitalClinic: Schema.Attribute.String;
    insuranceDetails: Schema.Attribute.Text;
    medicalConditions: Schema.Attribute.Text;
    primaryDoctor: Schema.Attribute.String;
    vaccinationHistory: Schema.Attribute.Text;
  };
}

export interface ErpStaffNote extends Struct.ComponentSchema {
  collectionName: 'components_erp_staff_notes';
  info: {
    description: 'Authorized staff notes with priority and visibility levels';
    displayName: 'Staff Note';
    icon: 'file-text';
  };
  attributes: {
    author: Schema.Attribute.String & Schema.Attribute.Required;
    category: Schema.Attribute.String & Schema.Attribute.Required;
    content: Schema.Attribute.RichText & Schema.Attribute.Required;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    priority: Schema.Attribute.Enumeration<
      ['low', 'normal', 'high', 'urgent']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'normal'>;
    visibility: Schema.Attribute.Enumeration<
      ['internal_staff_only', 'share_with_parent', 'share_with_student']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'internal_staff_only'>;
  };
}

export interface ErpTimelineItem extends Struct.ComponentSchema {
  collectionName: 'components_erp_timeline_items';
  info: {
    description: 'Chronological milestone entries for student ERP timeline';
    displayName: 'Timeline Item';
    icon: 'clock';
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      [
        'Admission',
        'Department Change',
        'Section Change',
        'Parent Update',
        'Hostel Assignment',
        'Behavior Record',
        'Certificate',
        'Exam',
        'Attendance Milestone',
        'Transfer',
        'Graduation',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Admission'>;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    description: Schema.Attribute.RichText;
    loggedBy: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NavigationMenuItem extends Struct.ComponentSchema {
  collectionName: 'components_navigation_menu_items';
  info: {
    description: 'Navigation menu link item with optional icon and child submenus';
    displayName: 'Menu Item';
    icon: 'link';
  };
  attributes: {
    children: Schema.Attribute.JSON;
    icon: Schema.Attribute.String;
    isVisible: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    target: Schema.Attribute.Enumeration<['_self', '_blank']> &
      Schema.Attribute.DefaultTo<'_self'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsCtaBanner extends Struct.ComponentSchema {
  collectionName: 'components_sections_cta_banners';
  info: {
    description: 'High-conversion call to action banner for admissions or inquiries';
    displayName: 'Call To Action Banner';
    icon: 'bullhorn';
  };
  attributes: {
    buttonText: Schema.Attribute.String & Schema.Attribute.Required;
    buttonUrl: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.Text;
    themeStyle: Schema.Attribute.Enumeration<['emerald', 'gold', 'dark']> &
      Schema.Attribute.DefaultTo<'emerald'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsDepartmentsGrid extends Struct.ComponentSchema {
  collectionName: 'components_sections_departments_grids';
  info: {
    description: 'Showcase grid of academic and administrative departments';
    displayName: 'Departments Grid';
    icon: 'briefcase';
  };
  attributes: {
    limit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<6>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Explore our specialized faculty departments'>;
    title: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Departments'>;
  };
}

export interface SectionsDonationBanner extends Struct.ComponentSchema {
  collectionName: 'components_sections_donation_banners';
  info: {
    description: 'Call to action banner highlighting ongoing school development campaigns';
    displayName: 'Donation Banner Section';
    icon: 'heart';
  };
  attributes: {
    badge: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Sadaqah Jariyah'>;
    buttonText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Donate Now'>;
    buttonUrl: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'/donations'>;
    description: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<'Your contributions help build state-of-the-art laboratories, mosques, and scholarship funds for deserving students.'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Support School Development & Islamic Endowment (Waqf)'>;
  };
}

export interface SectionsEventsGrid extends Struct.ComponentSchema {
  collectionName: 'components_sections_events_grids';
  info: {
    description: 'Showcase of upcoming school events with countdown timer support';
    displayName: 'Upcoming Events Grid';
    icon: 'calendar';
  };
  attributes: {
    limit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<3>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Mark your calendar for our upcoming school activities'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Upcoming Events'>;
  };
}

export interface SectionsFeatureCards extends Struct.ComponentSchema {
  collectionName: 'components_sections_feature_cards';
  info: {
    description: 'Grid of core feature or value proposition cards';
    displayName: 'Feature Cards Section';
    icon: 'apps';
  };
  attributes: {
    cards: Schema.Attribute.JSON;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsGalleryPreview extends Struct.ComponentSchema {
  collectionName: 'components_sections_gallery_previews';
  info: {
    description: 'Preview grid of school photos and videos';
    displayName: 'Gallery Preview Section';
    icon: 'picture';
  };
  attributes: {
    mediaItems: Schema.Attribute.Media<'images' | 'videos', true>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'A glimpse into academic and student life at YAHAYASCOOL'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Campus Life & Gallery'>;
    viewAllUrl: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'/gallery'>;
  };
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: 'components_sections_heroes';
  info: {
    description: 'Primary banner section with badge, title, subtitle, CTA buttons, and background image/video';
    displayName: 'Hero Section';
    icon: 'layout';
  };
  attributes: {
    backgroundMedia: Schema.Attribute.Media<'images' | 'videos'>;
    badge: Schema.Attribute.String;
    primaryCtaText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Apply Now'>;
    primaryCtaUrl: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'/admissions'>;
    secondaryCtaText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Explore Programs'>;
    secondaryCtaUrl: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'/programs'>;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsNewsGrid extends Struct.ComponentSchema {
  collectionName: 'components_sections_news_grids';
  info: {
    description: 'Grid or carousel of latest school news articles';
    displayName: 'Latest News Grid';
    icon: 'paper-plane';
  };
  attributes: {
    categoryFilter: Schema.Attribute.String;
    limit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<3>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Stay informed on what is happening at YAHAYASCOOL'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Latest News & Updates'>;
  };
}

export interface SectionsNewsletterSignup extends Struct.ComponentSchema {
  collectionName: 'components_sections_newsletter_signups';
  info: {
    description: 'Email newsletter subscription prompt section';
    displayName: 'Newsletter Signup Block';
    icon: 'envelop';
  };
  attributes: {
    buttonText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Subscribe'>;
    placeholderText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Enter your email address...'>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Receive academic updates, Islamic reminders, and school news directly in your inbox.'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Subscribe to Our Newsletter'>;
  };
}

export interface SectionsPrincipalWelcome extends Struct.ComponentSchema {
  collectionName: 'components_sections_principal_welcomes';
  info: {
    description: 'Welcome message and introduction from the School Principal / Director';
    displayName: 'Principal Welcome Section';
    icon: 'user';
  };
  attributes: {
    avatar: Schema.Attribute.Media<'images'>;
    message: Schema.Attribute.Text & Schema.Attribute.Required;
    principalName: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Sheikh Dr. Yahaya Al-Hassan'>;
    principalTitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Director General & Principal'>;
    quote: Schema.Attribute.String;
    sectionBadge: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<"Principal's Welcome">;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Nurturing Academic Excellence & Moral Integrity'>;
  };
}

export interface SectionsProgramsGrid extends Struct.ComponentSchema {
  collectionName: 'components_sections_programs_grids';
  info: {
    description: 'Showcase grid of academic programs dynamically loaded from CMS';
    displayName: 'Academic Programs Grid';
    icon: 'book';
  };
  attributes: {
    limit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<6>;
    showFeaturedOnly: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Excellence in Islamic and Western Education'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Our Academic Programs'>;
  };
}

export interface SectionsSponsorsGrid extends Struct.ComponentSchema {
  collectionName: 'components_sections_sponsors_grids';
  info: {
    description: 'Grid display of school accreditation bodies, educational partners, and waqf sponsors';
    displayName: 'Partners & Sponsors Grid';
    icon: 'hand-heart';
  };
  attributes: {
    partnersList: Schema.Attribute.JSON;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Accreditations & Global Partners'>;
  };
}

export interface SectionsStats extends Struct.ComponentSchema {
  collectionName: 'components_sections_stats';
  info: {
    description: 'Grid of statistical highlights (e.g., 100% Pass Rate, 1200+ Students)';
    displayName: 'Quick Statistics Section';
    icon: 'bullet-list';
  };
  attributes: {
    statsList: Schema.Attribute.JSON;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsTestimonialsSlider extends Struct.ComponentSchema {
  collectionName: 'components_sections_testimonials_sliders';
  info: {
    description: 'Carousel or grid of parent, student, and alumni testimonials';
    displayName: 'Testimonials Slider';
    icon: 'quote';
  };
  attributes: {
    limit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<6>;
    subtitle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Testimonials from the YAHAYASCOOL community'>;
    title: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'What Parents & Students Say'>;
  };
}

export interface SeoMeta extends Struct.ComponentSchema {
  collectionName: 'components_seo_metas';
  info: {
    description: 'SEO metadata including title, description, keywords, OpenGraph, and Schema.org';
    displayName: 'SEO Meta';
    icon: 'search';
  };
  attributes: {
    canonicalUrl: Schema.Attribute.String;
    keywords: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    noFollow: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    noIndex: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    ogDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    ogImage: Schema.Attribute.Media<'images'>;
    ogTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    schemaOrgJson: Schema.Attribute.JSON;
    twitterCardType: Schema.Attribute.Enumeration<
      ['summary', 'summary_large_image']
    > &
      Schema.Attribute.DefaultTo<'summary_large_image'>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'erp.behavior-record': ErpBehaviorRecord;
      'erp.enrollment-record': ErpEnrollmentRecord;
      'erp.medical-record': ErpMedicalRecord;
      'erp.staff-note': ErpStaffNote;
      'erp.timeline-item': ErpTimelineItem;
      'navigation.menu-item': NavigationMenuItem;
      'sections.cta-banner': SectionsCtaBanner;
      'sections.departments-grid': SectionsDepartmentsGrid;
      'sections.donation-banner': SectionsDonationBanner;
      'sections.events-grid': SectionsEventsGrid;
      'sections.feature-cards': SectionsFeatureCards;
      'sections.gallery-preview': SectionsGalleryPreview;
      'sections.hero': SectionsHero;
      'sections.news-grid': SectionsNewsGrid;
      'sections.newsletter-signup': SectionsNewsletterSignup;
      'sections.principal-welcome': SectionsPrincipalWelcome;
      'sections.programs-grid': SectionsProgramsGrid;
      'sections.sponsors-grid': SectionsSponsorsGrid;
      'sections.stats': SectionsStats;
      'sections.testimonials-slider': SectionsTestimonialsSlider;
      'seo.meta': SeoMeta;
    }
  }
}

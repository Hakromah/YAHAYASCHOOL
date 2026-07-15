import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    adminPermissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::permission'
    >;
    adminUserOwner: Schema.Attribute.Relation<'manyToOne', 'admin::user'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    kind: Schema.Attribute.Enumeration<['content-api', 'admin']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'content-api'>;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    apiToken: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON & Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    apiTokens: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiAcademicCalendarEventAcademicCalendarEvent
  extends Struct.CollectionTypeSchema {
  collectionName: 'academic_calendar_events';
  info: {
    displayName: 'Academic Calendar Event';
    pluralName: 'academic-calendar-events';
    singularName: 'academic-calendar-event';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    academicTerms: Schema.Attribute.Relation<
      'manyToMany',
      'api::academic-term.academic-term'
    >;
    academicYear: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    endDate: Schema.Attribute.Date & Schema.Attribute.Required;
    eventType: Schema.Attribute.Enumeration<
      ['Holiday', 'Exam', 'Meeting', 'Custom']
    > &
      Schema.Attribute.DefaultTo<'Custom'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::academic-calendar-event.academic-calendar-event'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    startDate: Schema.Attribute.Date & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAcademicCertificateTemplateAcademicCertificateTemplate
  extends Struct.CollectionTypeSchema {
  collectionName: 'academic-certificate-templates';
  info: {
    description: 'Global configuration for certificate generation';
    displayName: 'Academic Certificate Template';
    pluralName: 'academic-certificate-templates';
    singularName: 'academic-certificate-template';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      [
        'Excellence',
        'Graduation',
        'Completion',
        'Attendance',
        'Behavior',
        'Custom',
      ]
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    designConfig: Schema.Attribute.JSON;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::academic-certificate-template.academic-certificate-template'
    >;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAcademicCertificateAcademicCertificate
  extends Struct.CollectionTypeSchema {
  collectionName: 'academic-certificates';
  info: {
    description: 'Issued certificates linked to students';
    displayName: 'Academic Certificate';
    pluralName: 'academic-certificates';
    singularName: 'academic-certificate';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    achievementName: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    issueDate: Schema.Attribute.Date;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::academic-certificate.academic-certificate'
    >;
    publishedAt: Schema.Attribute.DateTime;
    serialNumber: Schema.Attribute.String & Schema.Attribute.Unique;
    status: Schema.Attribute.Enumeration<['Valid', 'Revoked']> &
      Schema.Attribute.DefaultTo<'Valid'>;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    template: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-certificate-template.academic-certificate-template'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    verificationID: Schema.Attribute.String & Schema.Attribute.Unique;
  };
}

export interface ApiAcademicResourceAcademicResource
  extends Struct.CollectionTypeSchema {
  collectionName: 'academic_resources';
  info: {
    displayName: 'Academic Resource';
    pluralName: 'academic-resources';
    singularName: 'academic-resource';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    author: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    category: Schema.Attribute.Enumeration<
      ['Document', 'Video', 'Audio', 'Image', 'Archive', 'Link', 'Other']
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    department: Schema.Attribute.Relation<
      'manyToOne',
      'api::department.department'
    >;
    description: Schema.Attribute.Text;
    file: Schema.Attribute.Media<'files' | 'images' | 'videos' | 'audios'>;
    isShared: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::academic-resource.academic-resource'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String;
    version: Schema.Attribute.String;
  };
}

export interface ApiAcademicTermAcademicTerm
  extends Struct.CollectionTypeSchema {
  collectionName: 'academic_terms';
  info: {
    description: 'Specific terms within an academic year (e.g., First Term)';
    displayName: 'Academic Term';
    pluralName: 'academic-terms';
    singularName: 'academic-term';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    academicYear: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    endDate: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::academic-term.academic-term'
    >;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    publishedAt: Schema.Attribute.DateTime;
    startDate: Schema.Attribute.Date & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAcademicTranscriptAcademicTranscript
  extends Struct.CollectionTypeSchema {
  collectionName: 'academic-transcripts';
  info: {
    description: 'Official school transcripts';
    displayName: 'Academic Transcript';
    pluralName: 'academic-transcripts';
    singularName: 'academic-transcript';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dataSnapshot: Schema.Attribute.JSON;
    issueDate: Schema.Attribute.Date;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::academic-transcript.academic-transcript'
    >;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<['Draft', 'Published', 'Revoked']> &
      Schema.Attribute.DefaultTo<'Draft'>;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    transcriptNumber: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    verificationID: Schema.Attribute.String & Schema.Attribute.Unique;
  };
}

export interface ApiAcademicYearAcademicYear
  extends Struct.CollectionTypeSchema {
  collectionName: 'academic_years';
  info: {
    description: 'School academic calendar year with terms and enrollments';
    displayName: 'Academic Year';
    pluralName: 'academic-years';
    singularName: 'academic-year';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    departments: Schema.Attribute.Relation<
      'manyToMany',
      'api::department.department'
    >;
    endDate: Schema.Attribute.Date & Schema.Attribute.Required;
    isCurrent: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::academic-year.academic-year'
    >;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    publishedAt: Schema.Attribute.DateTime;
    sections: Schema.Attribute.Relation<'oneToMany', 'api::section.section'>;
    startDate: Schema.Attribute.Date & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<['planned', 'active', 'completed']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'active'>;
    students: Schema.Attribute.Relation<'manyToMany', 'api::student.student'>;
    terms: Schema.Attribute.Relation<
      'oneToMany',
      'api::academic-term.academic-term'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAdmissionApplicationAdmissionApplication
  extends Struct.CollectionTypeSchema {
  collectionName: 'admission_applications';
  info: {
    description: 'Student online admission applications submitted via website registration portal';
    displayName: 'Admission Application';
    pluralName: 'admission-applications';
    singularName: 'admission-application';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    address: Schema.Attribute.Text & Schema.Attribute.Required;
    applicationNumber: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    birthCertificate: Schema.Attribute.Media<'images' | 'files'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dateOfBirth: Schema.Attribute.Date & Schema.Attribute.Required;
    desiredDepartment: Schema.Attribute.String & Schema.Attribute.Required;
    desiredProgram: Schema.Attribute.String & Schema.Attribute.Required;
    desiredSection: Schema.Attribute.String;
    emergencyContact: Schema.Attribute.JSON;
    firstName: Schema.Attribute.String & Schema.Attribute.Required;
    gender: Schema.Attribute.Enumeration<['male', 'female']> &
      Schema.Attribute.Required;
    guardianInfo: Schema.Attribute.JSON;
    hostelRequired: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    lastName: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::admission-application.admission-application'
    > &
      Schema.Attribute.Private;
    medicalInfo: Schema.Attribute.Text;
    middleName: Schema.Attribute.String;
    nationality: Schema.Attribute.String & Schema.Attribute.Required;
    parentEmail: Schema.Attribute.Email & Schema.Attribute.Required;
    parentName: Schema.Attribute.String & Schema.Attribute.Required;
    parentOccupation: Schema.Attribute.String;
    parentPhone: Schema.Attribute.String & Schema.Attribute.Required;
    passportPhoto: Schema.Attribute.Media<'images'>;
    previousSchool: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    religion: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Islam'>;
    reviewNotes: Schema.Attribute.Text;
    status: Schema.Attribute.Enumeration<
      [
        'Pending',
        'Approved',
        'Rejected',
        'Waiting List',
        'Need More Information',
      ]
    > &
      Schema.Attribute.DefaultTo<'Pending'>;
    supportingDocuments: Schema.Attribute.Media<'images' | 'files', true>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAnnouncementAnnouncement
  extends Struct.CollectionTypeSchema {
  collectionName: 'announcements';
  info: {
    description: 'Public and internal school announcements or ticker alerts';
    displayName: 'Announcement';
    pluralName: 'announcements';
    singularName: 'announcement';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    content: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    expiryDate: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::announcement.announcement'
    >;
    priority: Schema.Attribute.Enumeration<['normal', 'high', 'urgent']> &
      Schema.Attribute.DefaultTo<'normal'>;
    publishDate: Schema.Attribute.DateTime;
    publishedAt: Schema.Attribute.DateTime;
    targetAudience: Schema.Attribute.Enumeration<
      ['all', 'students', 'parents', 'teachers', 'public']
    > &
      Schema.Attribute.DefaultTo<'all'>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiArticleArticle extends Struct.CollectionTypeSchema {
  collectionName: 'articles';
  info: {
    description: 'School news, blog posts, and official publications';
    displayName: 'News & Article';
    pluralName: 'articles';
    singularName: 'article';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    author: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'School Communications'>;
    body: Schema.Attribute.RichText &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    category: Schema.Attribute.Relation<'manyToOne', 'api::category.category'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    featuredImage: Schema.Attribute.Media<'images'>;
    gallery: Schema.Attribute.Media<'images', true>;
    isFeatured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::article.article'
    >;
    publishDate: Schema.Attribute.DateTime;
    publishedAt: Schema.Attribute.DateTime;
    seo: Schema.Attribute.Component<'seo.meta', false>;
    slug: Schema.Attribute.UID<'title'> &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    summary: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    tags: Schema.Attribute.JSON &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    viewsCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiAssessmentCategoryAssessmentCategory
  extends Struct.CollectionTypeSchema {
  collectionName: 'assessment_categories';
  info: {
    description: 'Schema for Assessment Category';
    displayName: 'Assessment Category';
    pluralName: 'assessment-categories';
    singularName: 'assessment-category';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::assessment-category.assessment-category'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAssessmentTypeAssessmentType
  extends Struct.CollectionTypeSchema {
  collectionName: 'assessment_types';
  info: {
    description: 'Schema for Assessment Type';
    displayName: 'Assessment Type';
    pluralName: 'assessment-types';
    singularName: 'assessment-type';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    assessment_category: Schema.Attribute.Relation<
      'manyToOne',
      'api::assessment-category.assessment-category'
    >;
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::assessment-type.assessment-type'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    passingScore: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    weight: Schema.Attribute.Decimal;
  };
}

export interface ApiAttendanceRecordAttendanceRecord
  extends Struct.CollectionTypeSchema {
  collectionName: 'attendance_records';
  info: {
    displayName: 'Attendance Record';
    pluralName: 'attendance-records';
    singularName: 'attendance-record';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    academicTerm: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-term.academic-term'
    >;
    academicYear: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    comments: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::attendance-record.attendance-record'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    section: Schema.Attribute.Relation<'manyToOne', 'api::section.section'>;
    status: Schema.Attribute.Enumeration<
      [
        'Present',
        'Absent',
        'Late',
        'Excused',
        'Medical',
        'Holiday',
        'Suspended',
        'Remote',
      ]
    > &
      Schema.Attribute.Required;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAuditLogAuditLog extends Struct.CollectionTypeSchema {
  collectionName: 'audit_logs';
  info: {
    description: 'System audit trail for all important administrative and financial actions';
    displayName: 'Audit Log';
    pluralName: 'audit-logs';
    singularName: 'audit-log';
  };
  options: {
    comment: '';
    draftAndPublish: false;
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    entity: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    entityId: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    ipAddress: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 45;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::audit-log.audit-log'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    performedBy: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    publishedAt: Schema.Attribute.DateTime;
    severity: Schema.Attribute.Enumeration<
      ['info', 'warning', 'error', 'critical']
    > &
      Schema.Attribute.DefaultTo<'info'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userAgent: Schema.Attribute.Text;
  };
}

export interface ApiCampusCampus extends Struct.CollectionTypeSchema {
  collectionName: 'campuses';
  info: {
    description: 'School campuses and facilities management';
    displayName: 'Campus';
    pluralName: 'campuses';
    singularName: 'campus';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    address: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::campus.campus'>;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    phone: Schema.Attribute.String;
    principalName: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['active', 'inactive', 'under_construction']
    > &
      Schema.Attribute.DefaultTo<'active'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCategoryCategory extends Struct.CollectionTypeSchema {
  collectionName: 'categories';
  info: {
    description: 'Content categories for news and articles';
    displayName: 'Category';
    pluralName: 'categories';
    singularName: 'category';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    articles: Schema.Attribute.Relation<'oneToMany', 'api::article.article'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::category.category'
    >;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'> &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiClassroomClassroom extends Struct.CollectionTypeSchema {
  collectionName: 'classrooms';
  info: {
    displayName: 'Classroom';
    pluralName: 'classrooms';
    singularName: 'classroom';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    building: Schema.Attribute.String;
    campus: Schema.Attribute.Relation<'manyToOne', 'api::campus.campus'>;
    capacity: Schema.Attribute.Integer;
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    floor: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::classroom.classroom'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    resources: Schema.Attribute.JSON;
    roomType: Schema.Attribute.Enumeration<
      [
        'Lecture Room',
        'Laboratory',
        'Library',
        'Auditorium',
        'Mosque',
        'Gym',
        'Other',
      ]
    > &
      Schema.Attribute.DefaultTo<'Lecture Room'>;
    status: Schema.Attribute.Enumeration<
      ['Active', 'Maintenance', 'Inactive']
    > &
      Schema.Attribute.DefaultTo<'Active'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiContactInfoContactInfo extends Struct.SingleTypeSchema {
  collectionName: 'contact_infos';
  info: {
    description: 'School contact details, office hours, and maps';
    displayName: 'Contact Information';
    pluralName: 'contact-infos';
    singularName: 'contact-info';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    address: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    emergencyContacts: Schema.Attribute.JSON;
    googleMapUrl: Schema.Attribute.String;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::contact-info.contact-info'
    >;
    officeHours: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Mon - Fri: 8:00 AM - 4:00 PM'>;
    phone: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    socialMedia: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiContactSubmissionContactSubmission
  extends Struct.CollectionTypeSchema {
  collectionName: 'contact_submissions';
  info: {
    description: 'Inquiries submitted via website contact form';
    displayName: 'Contact Submission';
    pluralName: 'contact-submissions';
    singularName: 'contact-submission';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    department: Schema.Attribute.String;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::contact-submission.contact-submission'
    > &
      Schema.Attribute.Private;
    message: Schema.Attribute.Text & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['New', 'In Progress', 'Resolved', 'Archived']
    > &
      Schema.Attribute.DefaultTo<'New'>;
    subject: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCurriculumCurriculum extends Struct.CollectionTypeSchema {
  collectionName: 'curriculums';
  info: {
    displayName: 'Curriculum';
    pluralName: 'curriculums';
    singularName: 'curriculum';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    academicYear: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    attachments: Schema.Attribute.Media<
      'files' | 'images' | 'videos' | 'audios',
      true
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    department: Schema.Attribute.Relation<
      'manyToOne',
      'api::department.department'
    >;
    description: Schema.Attribute.Text;
    estimatedDuration: Schema.Attribute.String;
    learningOutcomes: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::curriculum.curriculum'
    > &
      Schema.Attribute.Private;
    objectives: Schema.Attribute.Text;
    program: Schema.Attribute.Relation<'manyToOne', 'api::program.program'>;
    publishedAt: Schema.Attribute.DateTime;
    section: Schema.Attribute.Relation<'manyToOne', 'api::section.section'>;
    status: Schema.Attribute.Enumeration<['Active', 'Draft', 'Archived']> &
      Schema.Attribute.DefaultTo<'Draft'>;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    topics: Schema.Attribute.Relation<'oneToMany', 'api::topic.topic'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    version: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ApiDawahActivityDawahActivity
  extends Struct.CollectionTypeSchema {
  collectionName: 'dawah_activities';
  info: {
    description: 'Schema for Dawah Activity';
    displayName: 'Dawah Activity';
    pluralName: 'dawah-activities';
    singularName: 'dawah-activity';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::dawah-activity.dawah-activity'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    photos: Schema.Attribute.Media<'images', true>;
    publishedAt: Schema.Attribute.DateTime;
    students: Schema.Attribute.Relation<'manyToMany', 'api::student.student'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    videos: Schema.Attribute.Media<'videos', true>;
  };
}

export interface ApiDepartmentDepartment extends Struct.CollectionTypeSchema {
  collectionName: 'departments';
  info: {
    description: 'Academic and administrative faculties/departments';
    displayName: 'Department';
    pluralName: 'departments';
    singularName: 'department';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    announcements: Schema.Attribute.JSON;
    code: Schema.Attribute.String;
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#10B981'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.RichText &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    gallery: Schema.Attribute.Media<'images' | 'videos', true>;
    headOfDepartment: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    icon: Schema.Attribute.String & Schema.Attribute.DefaultTo<'book-open'>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::department.department'
    >;
    programs: Schema.Attribute.Relation<'oneToMany', 'api::program.program'>;
    publishedAt: Schema.Attribute.DateTime;
    sectionsList: Schema.Attribute.Relation<
      'oneToMany',
      'api::section.section'
    >;
    seo: Schema.Attribute.Component<'seo.meta', false>;
    slug: Schema.Attribute.UID<'title'> &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    studentsList: Schema.Attribute.Relation<
      'manyToMany',
      'api::student.student'
    >;
    teachers: Schema.Attribute.JSON;
    teachersList: Schema.Attribute.Relation<
      'manyToMany',
      'api::teacher.teacher'
    >;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workersList: Schema.Attribute.Relation<'manyToMany', 'api::worker.worker'>;
  };
}

export interface ApiDonationCampaignDonationCampaign
  extends Struct.CollectionTypeSchema {
  collectionName: 'donation_campaigns';
  info: {
    description: 'School development, waqf, laboratory, and scholarship fundraising campaigns';
    displayName: 'Donation Campaign';
    pluralName: 'donation-campaigns';
    singularName: 'donation-campaign';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    bankInfo: Schema.Attribute.JSON;
    banner: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'USD'>;
    description: Schema.Attribute.RichText &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    donationMethods: Schema.Attribute.JSON;
    isFeatured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::donation-campaign.donation-campaign'
    >;
    publishedAt: Schema.Attribute.DateTime;
    raisedAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    slug: Schema.Attribute.UID<'title'> &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    targetAmount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiDownloadItemDownloadItem
  extends Struct.CollectionTypeSchema {
  collectionName: 'download_items';
  info: {
    description: 'Public documents, brochures, application forms, and prospectuses';
    displayName: 'Download Item';
    pluralName: 'download-items';
    singularName: 'download-item';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    category: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'General'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    file: Schema.Attribute.Media<'files' | 'images'>;
    fileSizeLabel: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'2.4 MB'>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::download-item.download-item'
    >;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEventEvent extends Struct.CollectionTypeSchema {
  collectionName: 'events';
  info: {
    description: 'School calendar activities, sports, lectures, and parent gatherings';
    displayName: 'Event';
    pluralName: 'events';
    singularName: 'event';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    banner: Schema.Attribute.Media<'images'>;
    capacity: Schema.Attribute.Integer;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    department: Schema.Attribute.Relation<
      'manyToOne',
      'api::department.department'
    >;
    description: Schema.Attribute.RichText &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    downloads: Schema.Attribute.Media<'files', true>;
    endDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
    eventType: Schema.Attribute.Enumeration<
      [
        'Academic',
        'Islamic/Religious',
        'Sports',
        'Cultural',
        'Parent Gathering',
        'Holiday',
      ]
    > &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Academic'>;
    gallery: Schema.Attribute.Media<'images', true>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::event.event'>;
    location: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Main School Auditorium'>;
    publishedAt: Schema.Attribute.DateTime;
    registrationDeadline: Schema.Attribute.DateTime;
    registrationRequired: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    seo: Schema.Attribute.Component<'seo.meta', false>;
    slug: Schema.Attribute.UID<'title'> &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    startDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    videos: Schema.Attribute.Media<'videos', true>;
  };
}

export interface ApiExamRoomExamRoom extends Struct.CollectionTypeSchema {
  collectionName: 'exam_rooms';
  info: {
    description: 'Schema for Exam Room';
    displayName: 'Exam Room';
    pluralName: 'exam-rooms';
    singularName: 'exam-room';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    building: Schema.Attribute.String;
    capacity: Schema.Attribute.Integer;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    floor: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::exam-room.exam-room'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiExamScheduleExamSchedule
  extends Struct.CollectionTypeSchema {
  collectionName: 'exam_schedules';
  info: {
    description: 'Schema for Exam Schedule';
    displayName: 'Exam Schedule';
    pluralName: 'exam-schedules';
    singularName: 'exam-schedule';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    endTime: Schema.Attribute.DateTime & Schema.Attribute.Required;
    exam_room: Schema.Attribute.Relation<
      'manyToOne',
      'api::exam-room.exam-room'
    >;
    examination: Schema.Attribute.Relation<
      'manyToOne',
      'api::examination.examination'
    >;
    invigilators: Schema.Attribute.Relation<
      'manyToMany',
      'api::teacher.teacher'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::exam-schedule.exam-schedule'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    startTime: Schema.Attribute.DateTime & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<
      ['Scheduled', 'InProgress', 'Completed', 'Cancelled']
    > &
      Schema.Attribute.DefaultTo<'Scheduled'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiExamSessionExamSession extends Struct.CollectionTypeSchema {
  collectionName: 'exam_sessions';
  info: {
    description: 'Schema for Exam Session';
    displayName: 'Exam Session';
    pluralName: 'exam-sessions';
    singularName: 'exam-session';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    academic_term: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-term.academic-term'
    >;
    academic_year: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    endDate: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::exam-session.exam-session'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    startDate: Schema.Attribute.Date & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<['Upcoming', 'Active', 'Completed']> &
      Schema.Attribute.DefaultTo<'Upcoming'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiExaminationExamination extends Struct.CollectionTypeSchema {
  collectionName: 'examinations';
  info: {
    description: 'Schema for Examination';
    displayName: 'Examination';
    pluralName: 'examinations';
    singularName: 'examination';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    assessment_type: Schema.Attribute.Relation<
      'manyToOne',
      'api::assessment-type.assessment-type'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    durationMinutes: Schema.Attribute.Integer;
    exam_session: Schema.Attribute.Relation<
      'manyToOne',
      'api::exam-session.exam-session'
    >;
    examDate: Schema.Attribute.Date;
    instructions: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::examination.examination'
    > &
      Schema.Attribute.Private;
    passingScore: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    section: Schema.Attribute.Relation<'manyToOne', 'api::section.section'>;
    status: Schema.Attribute.Enumeration<['Draft', 'Published', 'Completed']> &
      Schema.Attribute.DefaultTo<'Draft'>;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    totalMarks: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiFaqFaq extends Struct.CollectionTypeSchema {
  collectionName: 'faqs';
  info: {
    description: 'Frequently asked questions categorized by topic';
    displayName: 'FAQ';
    pluralName: 'faqs';
    singularName: 'faq';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    answer: Schema.Attribute.RichText &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    category: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Admissions'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::faq.faq'>;
    order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    question: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiFooterConfigFooterConfig extends Struct.SingleTypeSchema {
  collectionName: 'footer_configs';
  info: {
    description: 'Dynamic website footer columns, copyright, and newsletter links';
    displayName: 'Footer Configuration';
    pluralName: 'footer-configs';
    singularName: 'footer-config';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    contactText: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    copyrightText: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'\u00A9 2026 YAHAYASCOOL \u2014 Yahaya International Islamic and English High School. All rights reserved.'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    departmentsColumn: Schema.Attribute.JSON &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::footer-config.footer-config'
    >;
    newsletterHeading: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Stay Connected'>;
    newsletterSubheading: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Subscribe for weekly updates and reminders.'>;
    programsColumn: Schema.Attribute.JSON &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    publishedAt: Schema.Attribute.DateTime;
    quickLinks: Schema.Attribute.JSON &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiGalleryItemGalleryItem extends Struct.CollectionTypeSchema {
  collectionName: 'gallery_items';
  info: {
    description: 'Photo and video albums for school gallery';
    displayName: 'Gallery Item';
    pluralName: 'gallery-items';
    singularName: 'gallery-item';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    category: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Campus'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    isFeatured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::gallery-item.gallery-item'
    >;
    mediaFile: Schema.Attribute.Media<'images' | 'videos'>;
    mediaType: Schema.Attribute.Enumeration<['photo', 'video']> &
      Schema.Attribute.DefaultTo<'photo'>;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiGradeBandGradeBand extends Struct.CollectionTypeSchema {
  collectionName: 'grade_bands';
  info: {
    description: 'Schema for Grade Band';
    displayName: 'Grade Band';
    pluralName: 'grade-bands';
    singularName: 'grade-band';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    color: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    gradePoint: Schema.Attribute.Decimal;
    grading_scheme: Schema.Attribute.Relation<
      'manyToOne',
      'api::grading-scheme.grading-scheme'
    >;
    isPass: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    letterGrade: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::grade-band.grade-band'
    > &
      Schema.Attribute.Private;
    maxScore: Schema.Attribute.Decimal & Schema.Attribute.Required;
    minScore: Schema.Attribute.Decimal & Schema.Attribute.Required;
    performanceLevel: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiGradeModerationGradeModeration
  extends Struct.CollectionTypeSchema {
  collectionName: 'grade_moderations';
  info: {
    description: 'Schema for Grade Moderation';
    displayName: 'Grade Moderation';
    pluralName: 'grade-moderations';
    singularName: 'grade-moderation';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    approvedBy: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    comments: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    examination: Schema.Attribute.Relation<
      'manyToOne',
      'api::examination.examination'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::grade-moderation.grade-moderation'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    submittedBy: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflowStatus: Schema.Attribute.Enumeration<
      ['Submitted', 'DepartmentReview', 'Approved', 'Rejected']
    > &
      Schema.Attribute.DefaultTo<'Submitted'>;
  };
}

export interface ApiGradebookEntryGradebookEntry
  extends Struct.CollectionTypeSchema {
  collectionName: 'gradebook_entries';
  info: {
    displayName: 'Gradebook Entry';
    pluralName: 'gradebook-entries';
    singularName: 'gradebook-entry';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    academicTerm: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-term.academic-term'
    >;
    academicYear: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    assessmentType: Schema.Attribute.Enumeration<
      [
        'Homework',
        'Quiz',
        'Project',
        'Participation',
        'Attendance',
        'Exam',
        'Other',
      ]
    > &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::gradebook-entry.gradebook-entry'
    > &
      Schema.Attribute.Private;
    maxScore: Schema.Attribute.Decimal & Schema.Attribute.Required;
    percentage: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    score: Schema.Attribute.Decimal & Schema.Attribute.Required;
    section: Schema.Attribute.Relation<'manyToOne', 'api::section.section'>;
    status: Schema.Attribute.Enumeration<['Draft', 'Published']> &
      Schema.Attribute.DefaultTo<'Draft'>;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    teacherComment: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    weight: Schema.Attribute.Decimal;
  };
}

export interface ApiGradingSchemeGradingScheme
  extends Struct.CollectionTypeSchema {
  collectionName: 'grading_schemes';
  info: {
    description: 'Schema for Grading Scheme';
    displayName: 'Grading Scheme';
    pluralName: 'grading-schemes';
    singularName: 'grading-scheme';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    calculationMethod: Schema.Attribute.Enumeration<
      ['Percentage', 'Grade Points', 'Weighted Average', 'Rubric Based']
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    grade_bands: Schema.Attribute.Relation<
      'oneToMany',
      'api::grade-band.grade-band'
    >;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::grading-scheme.grading-scheme'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    promotionRules: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    version: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
  };
}

export interface ApiGraduationRecordGraduationRecord
  extends Struct.CollectionTypeSchema {
  collectionName: 'graduation-records';
  info: {
    description: 'Tracking for school graduates and alumni transition';
    displayName: 'Graduation Record';
    pluralName: 'graduation-records';
    singularName: 'graduation-record';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    awards: Schema.Attribute.JSON;
    className: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    finalTranscript: Schema.Attribute.Relation<
      'oneToOne',
      'api::academic-transcript.academic-transcript'
    >;
    graduationDate: Schema.Attribute.Date;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::graduation-record.graduation-record'
    >;
    publishedAt: Schema.Attribute.DateTime;
    student: Schema.Attribute.Relation<'oneToOne', 'api::student.student'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiHalaqahHalaqah extends Struct.CollectionTypeSchema {
  collectionName: 'halaqahs';
  info: {
    description: 'Schema for Halaqah';
    displayName: 'Halaqah';
    pluralName: 'halaqahs';
    singularName: 'halaqah';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    corrections: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::halaqah.halaqah'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    quran_group: Schema.Attribute.Relation<
      'manyToOne',
      'api::quran-group.quran-group'
    >;
    students: Schema.Attribute.Relation<'manyToMany', 'api::student.student'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    teacherNotes: Schema.Attribute.Text;
    topic: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    versesCovered: Schema.Attribute.String;
  };
}

export interface ApiHomepageHomepage extends Struct.SingleTypeSchema {
  collectionName: 'homepages';
  info: {
    description: 'Dynamic homepage configuration and builder sections';
    displayName: 'Homepage';
    pluralName: 'homepages';
    singularName: 'homepage';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::homepage.homepage'
    >;
    publishedAt: Schema.Attribute.DateTime;
    sections: Schema.Attribute.DynamicZone<
      [
        'sections.hero',
        'sections.stats',
        'sections.feature-cards',
        'sections.principal-welcome',
        'sections.programs-grid',
        'sections.departments-grid',
        'sections.news-grid',
        'sections.events-grid',
        'sections.testimonials-slider',
        'sections.gallery-preview',
        'sections.donation-banner',
        'sections.sponsors-grid',
        'sections.newsletter-signup',
        'sections.cta-banner',
      ]
    >;
    seo: Schema.Attribute.Component<'seo.meta', false>;
    title: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Welcome to YAHAYASCOOL'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiHomeworkSubmissionHomeworkSubmission
  extends Struct.CollectionTypeSchema {
  collectionName: 'homework_submissions';
  info: {
    displayName: 'Homework Submission';
    pluralName: 'homework-submissions';
    singularName: 'homework-submission';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    attachments: Schema.Attribute.Media<
      'files' | 'images' | 'videos' | 'audios',
      true
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    feedback: Schema.Attribute.Text;
    grade: Schema.Attribute.Decimal;
    homework: Schema.Attribute.Relation<'manyToOne', 'api::homework.homework'>;
    isLate: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::homework-submission.homework-submission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    submissionDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
    textContent: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiHomeworkHomework extends Struct.CollectionTypeSchema {
  collectionName: 'homeworks';
  info: {
    displayName: 'Homework';
    pluralName: 'homeworks';
    singularName: 'homework';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    academicTerm: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-term.academic-term'
    >;
    academicYear: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    assignedDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
    attachments: Schema.Attribute.Media<
      'files' | 'images' | 'videos' | 'audios',
      true
    >;
    category: Schema.Attribute.Enumeration<
      [
        'Reading',
        'Writing',
        'Research',
        'Project',
        'Presentation',
        'Practical',
        'Memorization',
        'Listening',
        'Speaking',
        'Other',
      ]
    > &
      Schema.Attribute.DefaultTo<'Writing'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dueDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
    instructions: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::homework.homework'
    > &
      Schema.Attribute.Private;
    maxScore: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    section: Schema.Attribute.Relation<'manyToOne', 'api::section.section'>;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    submissionType: Schema.Attribute.Enumeration<['Individual', 'Group']> &
      Schema.Attribute.DefaultTo<'Individual'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    visibility: Schema.Attribute.Enumeration<['Draft', 'Published']> &
      Schema.Attribute.DefaultTo<'Draft'>;
  };
}

export interface ApiHonorRollHonorRoll extends Struct.CollectionTypeSchema {
  collectionName: 'honor-rolls';
  info: {
    description: 'Merit lists';
    displayName: 'Honor Roll';
    pluralName: 'honor-rolls';
    singularName: 'honor-roll';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    academic_term: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-term.academic-term'
    >;
    academic_year: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    category: Schema.Attribute.Enumeration<
      [
        "Dean's List",
        "Principal's List",
        'Perfect Attendance',
        'Most Improved',
        'Custom',
      ]
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::honor-roll.honor-roll'
    >;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    students: Schema.Attribute.Relation<'manyToMany', 'api::student.student'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLanguageAchievementLanguageAchievement
  extends Struct.CollectionTypeSchema {
  collectionName: 'language_achievements';
  info: {
    description: 'Schema for Language Achievement';
    displayName: 'Language Achievement';
    pluralName: 'language-achievements';
    singularName: 'language-achievement';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dateEarned: Schema.Attribute.Date & Schema.Attribute.Required;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::language-achievement.language-achievement'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLanguageCertificateLanguageCertificate
  extends Struct.CollectionTypeSchema {
  collectionName: 'language_certificates';
  info: {
    description: 'Schema for Language Certificate';
    displayName: 'Language Certificate';
    pluralName: 'language-certificates';
    singularName: 'language-certificate';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    certificateUrl: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    issueDate: Schema.Attribute.Date & Schema.Attribute.Required;
    language_program: Schema.Attribute.Relation<
      'manyToOne',
      'api::language-program.language-program'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::language-certificate.language-certificate'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<['Draft', 'Issued', 'Revoked']> &
      Schema.Attribute.DefaultTo<'Draft'>;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    type: Schema.Attribute.Enumeration<
      [
        'Course Completion',
        'Level Completion',
        'Reading Excellence',
        'Writing Excellence',
        'Listening Excellence',
        'Speaking Excellence',
        'Grammar Excellence',
        'Vocabulary Excellence',
        'Competition Winner',
      ]
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLanguageCompetitionLanguageCompetition
  extends Struct.CollectionTypeSchema {
  collectionName: 'language_competitions';
  info: {
    description: 'Schema for Language Competition';
    displayName: 'Language Competition';
    pluralName: 'language-competitions';
    singularName: 'language-competition';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    awards: Schema.Attribute.String;
    category: Schema.Attribute.Enumeration<
      [
        'Debate',
        'Speech Contest',
        'Essay Competition',
        'Reading Competition',
        'Spelling Bee',
        'Poetry Recitation',
        'Translation',
        'Storytelling',
      ]
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date;
    judges: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::language-competition.language-competition'
    > &
      Schema.Attribute.Private;
    media: Schema.Attribute.Media<'images' | 'videos', true>;
    publishedAt: Schema.Attribute.DateTime;
    ranking: Schema.Attribute.Integer;
    students: Schema.Attribute.Relation<'manyToMany', 'api::student.student'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLanguageLevelLanguageLevel
  extends Struct.CollectionTypeSchema {
  collectionName: 'language_levels';
  info: {
    description: 'Schema for Language Level';
    displayName: 'Language Level';
    pluralName: 'language-levels';
    singularName: 'language-level';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    expectedCompetencies: Schema.Attribute.Text;
    language_program: Schema.Attribute.Relation<
      'manyToOne',
      'api::language-program.language-program'
    >;
    learningOutcomes: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::language-level.language-level'
    > &
      Schema.Attribute.Private;
    minPassingScore: Schema.Attribute.Decimal;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLanguagePortfolioLanguagePortfolio
  extends Struct.CollectionTypeSchema {
  collectionName: 'language_portfolios';
  info: {
    description: 'Schema for Language Portfolio';
    displayName: 'Language Portfolio';
    pluralName: 'language-portfolios';
    singularName: 'language-portfolio';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    attachments: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    content: Schema.Attribute.RichText;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dateAdded: Schema.Attribute.Date & Schema.Attribute.Required;
    itemType: Schema.Attribute.Enumeration<
      [
        'Writing Sample',
        'Reading Record',
        'Audio Recording',
        'Video Presentation',
        'Project',
        'Grammar Exercise',
      ]
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::language-portfolio.language-portfolio'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    teacherFeedback: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLanguageProgramLanguageProgram
  extends Struct.CollectionTypeSchema {
  collectionName: 'language_programs';
  info: {
    description: 'Schema for Language Program';
    displayName: 'Language Program';
    pluralName: 'language-programs';
    singularName: 'language-program';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    ageGroup: Schema.Attribute.String;
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    durationMonths: Schema.Attribute.Integer;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    language: Schema.Attribute.Enumeration<['Arabic', 'English']> &
      Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::language-program.language-program'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    sections: Schema.Attribute.Relation<'manyToMany', 'api::section.section'>;
    students: Schema.Attribute.Relation<'manyToMany', 'api::student.student'>;
    targetLevel: Schema.Attribute.String;
    teachers: Schema.Attribute.Relation<'manyToMany', 'api::teacher.teacher'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLessonDeliveryLessonDelivery
  extends Struct.CollectionTypeSchema {
  collectionName: 'lesson_deliveries';
  info: {
    displayName: 'Lesson Delivery';
    pluralName: 'lesson-deliveries';
    singularName: 'lesson-delivery';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    actualEndTime: Schema.Attribute.DateTime;
    actualStartTime: Schema.Attribute.DateTime;
    attachments: Schema.Attribute.Media<
      'files' | 'images' | 'videos' | 'audios',
      true
    >;
    completionPercentage: Schema.Attribute.Integer;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    lessonPlan: Schema.Attribute.Relation<
      'oneToOne',
      'api::lesson-plan.lesson-plan'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::lesson-delivery.lesson-delivery'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    teacherReflection: Schema.Attribute.Text;
    topicsCovered: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLessonPlanLessonPlan extends Struct.CollectionTypeSchema {
  collectionName: 'lesson_plans';
  info: {
    displayName: 'Lesson Plan';
    pluralName: 'lesson-plans';
    singularName: 'lesson-plan';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    academicTerm: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-term.academic-term'
    >;
    academicYear: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    assessmentMethod: Schema.Attribute.Text;
    attachments: Schema.Attribute.Media<
      'files' | 'images' | 'videos' | 'audios',
      true
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    curriculum: Schema.Attribute.Relation<
      'manyToOne',
      'api::curriculum.curriculum'
    >;
    homework: Schema.Attribute.Text;
    lessonNumber: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::lesson-plan.lesson-plan'
    > &
      Schema.Attribute.Private;
    objectives: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    section: Schema.Attribute.Relation<'manyToOne', 'api::section.section'>;
    status: Schema.Attribute.Enumeration<
      ['Draft', 'Pending Approval', 'Approved', 'Rejected']
    > &
      Schema.Attribute.DefaultTo<'Draft'>;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    teachingMethod: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMarksEntryMarksEntry extends Struct.CollectionTypeSchema {
  collectionName: 'marks_entries';
  info: {
    description: 'Schema for Marks Entry';
    displayName: 'Marks Entry';
    pluralName: 'marks-entries';
    singularName: 'marks-entry';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    examination: Schema.Attribute.Relation<
      'manyToOne',
      'api::examination.examination'
    >;
    gradePoint: Schema.Attribute.Decimal;
    grading_scheme: Schema.Attribute.Relation<
      'manyToOne',
      'api::grading-scheme.grading-scheme'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::marks-entry.marks-entry'
    > &
      Schema.Attribute.Private;
    percentage: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    rawScore: Schema.Attribute.Decimal;
    status: Schema.Attribute.Enumeration<['Draft', 'Submitted', 'Approved']> &
      Schema.Attribute.DefaultTo<'Draft'>;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    teacherNotes: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMemorizationMemorization
  extends Struct.CollectionTypeSchema {
  collectionName: 'memorizations';
  info: {
    description: 'Schema for Memorization';
    displayName: 'Memorization';
    pluralName: 'memorizations';
    singularName: 'memorization';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    academic_term: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-term.academic-term'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    endingAyah: Schema.Attribute.Integer;
    juzNumber: Schema.Attribute.Integer & Schema.Attribute.Required;
    linesCovered: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::memorization.memorization'
    > &
      Schema.Attribute.Private;
    pagesCovered: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    quran_group: Schema.Attribute.Relation<
      'manyToOne',
      'api::quran-group.quran-group'
    >;
    quran_program: Schema.Attribute.Relation<
      'manyToOne',
      'api::quran-program.quran-program'
    >;
    recordType: Schema.Attribute.Enumeration<
      ['New', 'Revision', 'Correction', 'Assessment']
    >;
    startingAyah: Schema.Attribute.Integer;
    status: Schema.Attribute.Enumeration<
      ['Completed', 'Needs Revision', 'Partially Memorized']
    >;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    studentReflection: Schema.Attribute.Text;
    surah: Schema.Attribute.String & Schema.Attribute.Required;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    teacherNotes: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMurajaahMurajaah extends Struct.CollectionTypeSchema {
  collectionName: 'murajaahs';
  info: {
    description: 'Schema for Murajaah';
    displayName: 'Murajaah';
    pluralName: 'murajaahs';
    singularName: 'murajaah';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    assignedPortions: Schema.Attribute.Text;
    completedPortions: Schema.Attribute.Text;
    completionDate: Schema.Attribute.Date;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dueDate: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::murajaah.murajaah'
    > &
      Schema.Attribute.Private;
    mistakesCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    quran_group: Schema.Attribute.Relation<
      'manyToOne',
      'api::quran-group.quran-group'
    >;
    revisionScore: Schema.Attribute.Decimal;
    status: Schema.Attribute.Enumeration<
      ['Pending', 'In Progress', 'Completed', 'Needs Retest']
    >;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    teacherNotes: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiNavigationMenuNavigationMenu
  extends Struct.CollectionTypeSchema {
  collectionName: 'navigation_menus';
  info: {
    description: 'Dynamic website menus supporting nested children and multi-language links';
    displayName: 'Navigation Menu';
    pluralName: 'navigation-menus';
    singularName: 'navigation-menu';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    items: Schema.Attribute.Component<'navigation.menu-item', true>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::navigation-menu.navigation-menu'
    >;
    location: Schema.Attribute.Enumeration<['header', 'footer', 'topbar']> &
      Schema.Attribute.DefaultTo<'header'>;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiNotificationNotification
  extends Struct.CollectionTypeSchema {
  collectionName: 'notifications';
  info: {
    description: 'Notification queue supporting multiple delivery channels';
    displayName: 'Notification';
    pluralName: 'notifications';
    singularName: 'notification';
  };
  options: {
    comment: '';
    draftAndPublish: false;
  };
  attributes: {
    body: Schema.Attribute.Text & Schema.Attribute.Required;
    channel: Schema.Attribute.Enumeration<
      ['dashboard', 'email', 'sms', 'whatsapp', 'push']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'dashboard'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::notification.notification'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    priority: Schema.Attribute.Enumeration<
      ['low', 'normal', 'high', 'urgent']
    > &
      Schema.Attribute.DefaultTo<'normal'>;
    publishedAt: Schema.Attribute.DateTime;
    readAt: Schema.Attribute.DateTime;
    recipient: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    relatedEntity: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    relatedEntityId: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    scheduledAt: Schema.Attribute.DateTime;
    sender: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    sentAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['pending', 'sent', 'failed', 'read']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiObservationJournalObservationJournal
  extends Struct.CollectionTypeSchema {
  collectionName: 'observation_journals';
  info: {
    description: 'Schema for Observation Journal';
    displayName: 'Observation Journal';
    pluralName: 'observation-journals';
    singularName: 'observation-journal';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    behavior: Schema.Attribute.Integer;
    confidence: Schema.Attribute.Integer;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::observation-journal.observation-journal'
    > &
      Schema.Attribute.Private;
    motivation: Schema.Attribute.Integer;
    participation: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    recommendations: Schema.Attribute.Text;
    strengths: Schema.Attribute.Text;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    visibility: Schema.Attribute.Enumeration<
      ['Teacher Only', 'Parent', 'Director']
    > &
      Schema.Attribute.DefaultTo<'Teacher Only'>;
    weaknesses: Schema.Attribute.Text;
  };
}

export interface ApiPagePage extends Struct.CollectionTypeSchema {
  collectionName: 'pages';
  info: {
    description: 'Custom public pages (e.g. About, Admissions, FAQ)';
    displayName: 'Page';
    pluralName: 'pages';
    singularName: 'page';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::page.page'>;
    publishedAt: Schema.Attribute.DateTime;
    sections: Schema.Attribute.DynamicZone<
      [
        'sections.hero',
        'sections.stats',
        'sections.feature-cards',
        'sections.principal-welcome',
        'sections.programs-grid',
        'sections.departments-grid',
        'sections.news-grid',
        'sections.events-grid',
        'sections.testimonials-slider',
        'sections.gallery-preview',
        'sections.donation-banner',
        'sections.sponsors-grid',
        'sections.newsletter-signup',
        'sections.cta-banner',
      ]
    >;
    seo: Schema.Attribute.Component<'seo.meta', false>;
    slug: Schema.Attribute.UID<'title'> &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiParentParent extends Struct.CollectionTypeSchema {
  collectionName: 'parents';
  info: {
    description: 'Parent and guardian profiles linked to students';
    displayName: 'Parent Management';
    pluralName: 'parents';
    singularName: 'parent';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    address: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    children: Schema.Attribute.Relation<'manyToMany', 'api::student.student'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    emergencyContact: Schema.Attribute.String;
    employer: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    gender: Schema.Attribute.Enumeration<['male', 'female']>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::parent.parent'>;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    nationalId: Schema.Attribute.String;
    notes: Schema.Attribute.RichText &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    occupation: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    passport: Schema.Attribute.String;
    phone: Schema.Attribute.String & Schema.Attribute.Required;
    photo: Schema.Attribute.Media<'images'>;
    preferredLanguage: Schema.Attribute.Enumeration<['en', 'ar', 'fr', 'tr']> &
      Schema.Attribute.DefaultTo<'en'>;
    publishedAt: Schema.Attribute.DateTime;
    relationship: Schema.Attribute.Enumeration<
      ['father', 'mother', 'guardian', 'other']
    > &
      Schema.Attribute.Required;
    religion: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Islam'>;
    schoolId: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiPartnerPartner extends Struct.CollectionTypeSchema {
  collectionName: 'partners';
  info: {
    description: 'School accreditation bodies, educational partners, and waqf sponsors';
    displayName: 'Partner & Sponsor';
    pluralName: 'partners';
    singularName: 'partner';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::partner.partner'
    >;
    logo: Schema.Attribute.Media<'images'>;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    partnerType: Schema.Attribute.Enumeration<
      ['accreditation', 'educational', 'waqf_sponsor', 'partner']
    > &
      Schema.Attribute.DefaultTo<'educational'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    websiteUrl: Schema.Attribute.String;
  };
}

export interface ApiPlacementTestPlacementTest
  extends Struct.CollectionTypeSchema {
  collectionName: 'placement_tests';
  info: {
    description: 'Schema for Placement Test';
    displayName: 'Placement Test';
    pluralName: 'placement-tests';
    singularName: 'placement-test';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dateTaken: Schema.Attribute.Date & Schema.Attribute.Required;
    grammarScore: Schema.Attribute.Decimal;
    language: Schema.Attribute.Enumeration<['Arabic', 'English']> &
      Schema.Attribute.Required;
    listeningScore: Schema.Attribute.Decimal;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::placement-test.placement-test'
    > &
      Schema.Attribute.Private;
    overallScore: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    readingScore: Schema.Attribute.Decimal;
    recommendedLevel: Schema.Attribute.String;
    speakingScore: Schema.Attribute.Decimal;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    teacherNotes: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    vocabularyScore: Schema.Attribute.Decimal;
    writingScore: Schema.Attribute.Decimal;
  };
}

export interface ApiProgramProgram extends Struct.CollectionTypeSchema {
  collectionName: 'programs';
  info: {
    description: "Academic and specialized programs (e.g. Qur'an Memorization, Sciences, Languages)";
    displayName: 'Program';
    pluralName: 'programs';
    singularName: 'program';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    code: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    department: Schema.Attribute.Relation<
      'manyToOne',
      'api::department.department'
    >;
    description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    downloads: Schema.Attribute.Media<'files', true>;
    duration: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Full Academic Year'>;
    images: Schema.Attribute.Media<'images', true>;
    isFeatured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::program.program'
    >;
    objectives: Schema.Attribute.RichText &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    publishedAt: Schema.Attribute.DateTime;
    requirements: Schema.Attribute.RichText &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    sectionsList: Schema.Attribute.Relation<
      'oneToMany',
      'api::section.section'
    >;
    seo: Schema.Attribute.Component<'seo.meta', false>;
    slug: Schema.Attribute.UID<'title'> &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    studentsList: Schema.Attribute.Relation<
      'manyToMany',
      'api::student.student'
    >;
    teachersList: Schema.Attribute.Relation<
      'manyToMany',
      'api::teacher.teacher'
    >;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPromotionRecordPromotionRecord
  extends Struct.CollectionTypeSchema {
  collectionName: 'promotion-records';
  info: {
    description: 'Permanent ledger of promotion decisions';
    displayName: 'Promotion Record';
    pluralName: 'promotion-records';
    singularName: 'promotion-record';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    decision: Schema.Attribute.Enumeration<
      [
        'Promoted',
        'Conditionally Promoted',
        'Repeat Class',
        'Graduated',
        'Transferred',
        'Withdrawn',
      ]
    >;
    fromSection: Schema.Attribute.Relation<'manyToOne', 'api::section.section'>;
    fromYear: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::promotion-record.promotion-record'
    >;
    publishedAt: Schema.Attribute.DateTime;
    remarks: Schema.Attribute.Text;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    toSection: Schema.Attribute.Relation<'manyToOne', 'api::section.section'>;
    toYear: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiQuestionPoolQuestionPool
  extends Struct.CollectionTypeSchema {
  collectionName: 'question_pools';
  info: {
    description: 'Schema for Question Pool';
    displayName: 'Question Pool';
    pluralName: 'question-pools';
    singularName: 'question-pool';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::question-pool.question-pool'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiQuestionQuestion extends Struct.CollectionTypeSchema {
  collectionName: 'questions';
  info: {
    description: 'Schema for Question';
    displayName: 'Question';
    pluralName: 'questions';
    singularName: 'question';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    correctAnswer: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    difficulty: Schema.Attribute.Enumeration<['Easy', 'Medium', 'Hard']>;
    explanation: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::question.question'
    > &
      Schema.Attribute.Private;
    marks: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    question_pool: Schema.Attribute.Relation<
      'manyToOne',
      'api::question-pool.question-pool'
    >;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    tags: Schema.Attribute.JSON;
    text: Schema.Attribute.Text & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      [
        'MCQ',
        'True/False',
        'Short Answer',
        'Essay',
        'Practical',
        'Oral',
        'Other',
      ]
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiQuranAchievementQuranAchievement
  extends Struct.CollectionTypeSchema {
  collectionName: 'quran_achievements';
  info: {
    description: 'Schema for Quran Achievement';
    displayName: 'Quran Achievement';
    pluralName: 'quran-achievements';
    singularName: 'quran-achievement';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dateEarned: Schema.Attribute.Date & Schema.Attribute.Required;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::quran-achievement.quran-achievement'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiQuranAssessmentQuranAssessment
  extends Struct.CollectionTypeSchema {
  collectionName: 'quran_assessments';
  info: {
    description: 'Schema for Quran Assessment';
    displayName: 'Quran Assessment';
    pluralName: 'quran-assessments';
    singularName: 'quran-assessment';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    comments: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::quran-assessment.quran-assessment'
    > &
      Schema.Attribute.Private;
    maxScore: Schema.Attribute.Decimal;
    mistakes: Schema.Attribute.Integer;
    portion: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    quran_group: Schema.Attribute.Relation<
      'manyToOne',
      'api::quran-group.quran-group'
    >;
    score: Schema.Attribute.Decimal;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      [
        'Daily Recitation',
        'Weekly Test',
        'Monthly Test',
        'Quarterly Test',
        'Half Juz',
        'Full Juz',
        'Half Hifz',
        'Complete Hifz',
      ]
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiQuranAttendanceQuranAttendance
  extends Struct.CollectionTypeSchema {
  collectionName: 'quran_attendances';
  info: {
    description: 'Schema for Quran Attendance';
    displayName: 'Quran Attendance';
    pluralName: 'quran-attendances';
    singularName: 'quran-attendance';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    academic_term: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-term.academic-term'
    >;
    arrivalTime: Schema.Attribute.Time;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    departureTime: Schema.Attribute.Time;
    lateReason: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::quran-attendance.quran-attendance'
    > &
      Schema.Attribute.Private;
    participationScore: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    quran_group: Schema.Attribute.Relation<
      'manyToOne',
      'api::quran-group.quran-group'
    >;
    recitationStatus: Schema.Attribute.String;
    remarks: Schema.Attribute.Text;
    status: Schema.Attribute.Enumeration<
      ['Present', 'Absent', 'Late', 'Excused']
    > &
      Schema.Attribute.Required;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiQuranCertificateQuranCertificate
  extends Struct.CollectionTypeSchema {
  collectionName: 'quran_certificates';
  info: {
    description: 'Schema for Quran Certificate';
    displayName: 'Quran Certificate';
    pluralName: 'quran-certificates';
    singularName: 'quran-certificate';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    certificateUrl: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    issueDate: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::quran-certificate.quran-certificate'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    quran_program: Schema.Attribute.Relation<
      'manyToOne',
      'api::quran-program.quran-program'
    >;
    status: Schema.Attribute.Enumeration<['Draft', 'Issued', 'Revoked']> &
      Schema.Attribute.DefaultTo<'Draft'>;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    type: Schema.Attribute.Enumeration<
      [
        'Juz Completion',
        'Half Quran',
        'Full Quran',
        'Excellent Memorization',
        'Perfect Attendance',
        'Outstanding Tajweed',
        'Competition Winner',
      ]
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiQuranCompetitionQuranCompetition
  extends Struct.CollectionTypeSchema {
  collectionName: 'quran_competitions';
  info: {
    description: 'Schema for Quran Competition';
    displayName: 'Quran Competition';
    pluralName: 'quran-competitions';
    singularName: 'quran-competition';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    awards: Schema.Attribute.String;
    category: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date;
    judges: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::quran-competition.quran-competition'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    ranking: Schema.Attribute.Integer;
    students: Schema.Attribute.Relation<'manyToMany', 'api::student.student'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiQuranGroupQuranGroup extends Struct.CollectionTypeSchema {
  collectionName: 'quran_groups';
  info: {
    description: 'Schema for Quran Group';
    displayName: 'Quran Group';
    pluralName: 'quran-groups';
    singularName: 'quran-group';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    capacity: Schema.Attribute.Integer;
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::quran-group.quran-group'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    meetingSchedule: Schema.Attribute.String;
    memorizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::memorization.memorization'
    >;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    quran_program: Schema.Attribute.Relation<
      'manyToOne',
      'api::quran-program.quran-program'
    >;
    students: Schema.Attribute.Relation<'manyToMany', 'api::student.student'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiQuranProgramQuranProgram
  extends Struct.CollectionTypeSchema {
  collectionName: 'quran_programs';
  info: {
    description: 'Schema for Quran Program';
    displayName: 'Quran Program';
    pluralName: 'quran-programs';
    singularName: 'quran-program';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    ageGroup: Schema.Attribute.String;
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    durationMonths: Schema.Attribute.Integer;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::quran-program.quran-program'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    quran_groups: Schema.Attribute.Relation<
      'oneToMany',
      'api::quran-group.quran-group'
    >;
    students: Schema.Attribute.Relation<'manyToMany', 'api::student.student'>;
    targetJuz: Schema.Attribute.Integer;
    teachers: Schema.Attribute.Relation<'manyToMany', 'api::teacher.teacher'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiReportCardReportCard extends Struct.CollectionTypeSchema {
  collectionName: 'report-cards';
  info: {
    description: 'Final issued report card document';
    displayName: 'Report Card';
    pluralName: 'report-cards';
    singularName: 'report-card';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    academic_term: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-term.academic-term'
    >;
    academic_year: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dataSnapshot: Schema.Attribute.JSON;
    issueDate: Schema.Attribute.Date;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::report-card.report-card'
    >;
    publishedAt: Schema.Attribute.DateTime;
    report_template: Schema.Attribute.Relation<
      'manyToOne',
      'api::report-template.report-template'
    >;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    verificationQR: Schema.Attribute.String & Schema.Attribute.Unique;
    workflowStatus: Schema.Attribute.Enumeration<
      ['Draft', 'DepartmentReview', 'DirectorApproval', 'Published', 'Rejected']
    > &
      Schema.Attribute.DefaultTo<'Draft'>;
  };
}

export interface ApiReportTemplateReportTemplate
  extends Struct.CollectionTypeSchema {
  collectionName: 'report-templates';
  info: {
    description: 'Configurable layouts for report cards';
    displayName: 'Report Template';
    pluralName: 'report-templates';
    singularName: 'report-template';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    brandingConfig: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    layoutType: Schema.Attribute.Enumeration<
      [
        'Primary',
        'Secondary',
        'Quran',
        'Arabic',
        'English',
        'Boarding',
        'Custom',
      ]
    > &
      Schema.Attribute.DefaultTo<'Primary'>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::report-template.report-template'
    >;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    signatureConfig: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    version: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
  };
}

export interface ApiRubricRubric extends Struct.CollectionTypeSchema {
  collectionName: 'rubrics';
  info: {
    description: 'Schema for Rubric';
    displayName: 'Rubric';
    pluralName: 'rubrics';
    singularName: 'rubric';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    criteria: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.Text;
    levels: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::rubric.rubric'
    > &
      Schema.Attribute.Private;
    maxPoints: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSchoolIdSequenceSchoolIdSequence
  extends Struct.CollectionTypeSchema {
  collectionName: 'school_id_sequences';
  info: {
    description: 'Sequential counter for School ID generation \u2014 one record per initials prefix';
    displayName: 'School ID Sequence';
    pluralName: 'school-id-sequences';
    singularName: 'school-id-sequence';
  };
  options: {
    comment: '';
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    initials: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 10;
      }>;
    lastSequence: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::school-id-sequence.school-id-sequence'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSchoolProfileSchoolProfile extends Struct.SingleTypeSchema {
  collectionName: 'school_profiles';
  info: {
    description: 'Global school settings, branding, and configuration';
    displayName: 'School Profile';
    pluralName: 'school-profiles';
    singularName: 'school-profile';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    academicYearEnd: Schema.Attribute.Date &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    academicYearStart: Schema.Attribute.Date &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    address: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    defaultLanguage: Schema.Attribute.Enumeration<['en', 'ar', 'fr', 'tr']> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Schema.Attribute.DefaultTo<'en'>;
    email: Schema.Attribute.Email &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    foundedYear: Schema.Attribute.Integer &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Schema.Attribute.SetMinMax<
        {
          max: 2100;
          min: 1900;
        },
        number
      >;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::school-profile.school-profile'
    >;
    logo: Schema.Attribute.Media<'images'> &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    motto: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    phone: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 30;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    registrationNumber: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    schoolName: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<'Yahaya International Islamic and English High School'>;
    socialLinks: Schema.Attribute.JSON &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    timezone: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }> &
      Schema.Attribute.DefaultTo<'Africa/Lagos'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    website: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }> &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
  };
}

export interface ApiSectionSection extends Struct.CollectionTypeSchema {
  collectionName: 'sections';
  info: {
    description: 'Multi-purpose academic sections, groups, levels, or boarding tracks';
    displayName: 'Section';
    pluralName: 'sections';
    singularName: 'section';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    academicYear: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    capacity: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<35>;
    code: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    department: Schema.Attribute.Relation<
      'manyToOne',
      'api::department.department'
    >;
    description: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::section.section'
    >;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    program: Schema.Attribute.Relation<'manyToOne', 'api::program.program'>;
    publishedAt: Schema.Attribute.DateTime;
    students: Schema.Attribute.Relation<'manyToMany', 'api::student.student'>;
    teachers: Schema.Attribute.Relation<'manyToMany', 'api::teacher.teacher'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSkillAssessmentSkillAssessment
  extends Struct.CollectionTypeSchema {
  collectionName: 'skill_assessments';
  info: {
    description: 'Schema for Skill Assessment';
    displayName: 'Skill Assessment';
    pluralName: 'skill-assessments';
    singularName: 'skill-assessment';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    language_program: Schema.Attribute.Relation<
      'manyToOne',
      'api::language-program.language-program'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::skill-assessment.skill-assessment'
    > &
      Schema.Attribute.Private;
    maxScore: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    rubric: Schema.Attribute.JSON;
    score: Schema.Attribute.Decimal;
    skillType: Schema.Attribute.Enumeration<
      [
        'Reading',
        'Writing',
        'Listening',
        'Speaking',
        'Grammar',
        'Vocabulary',
        'Conversation',
        'Pronunciation',
        'Comprehension',
      ]
    > &
      Schema.Attribute.Required;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    teacherFeedback: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiStudentRankingStudentRanking
  extends Struct.CollectionTypeSchema {
  collectionName: 'student-rankings';
  info: {
    description: 'Pre-calculated student rankings';
    displayName: 'Student Ranking';
    pluralName: 'student-rankings';
    singularName: 'student-ranking';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    academic_term: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-term.academic-term'
    >;
    academic_year: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    averageScore: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    isTied: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::student-ranking.student-ranking'
    >;
    publishedAt: Schema.Attribute.DateTime;
    rankContext: Schema.Attribute.Enumeration<
      ['School', 'Department', 'Section', 'Subject', 'Program']
    >;
    rankPosition: Schema.Attribute.Integer;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiStudentResultStudentResult
  extends Struct.CollectionTypeSchema {
  collectionName: 'student-results';
  info: {
    description: 'Calculated final outcome for a student per subject';
    displayName: 'Student Result';
    pluralName: 'student-results';
    singularName: 'student-result';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    academic_term: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-term.academic-term'
    >;
    academic_year: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    caTotal: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    directorComments: Schema.Attribute.Text;
    examTotal: Schema.Attribute.Decimal;
    gradePoint: Schema.Attribute.Decimal;
    isPass: Schema.Attribute.Boolean;
    letterGrade: Schema.Attribute.String;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::student-result.student-result'
    >;
    overallScore: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    teacherComments: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiStudentStudent extends Struct.CollectionTypeSchema {
  collectionName: 'students';
  info: {
    description: 'Comprehensive Student Information System (SIS) profile entity';
    displayName: 'Student Profile';
    pluralName: 'students';
    singularName: 'student';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    academicYears: Schema.Attribute.Relation<
      'manyToMany',
      'api::academic-year.academic-year'
    >;
    address: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    admissionDate: Schema.Attribute.Date;
    admissionNumber: Schema.Attribute.String & Schema.Attribute.Unique;
    barcodeData: Schema.Attribute.String;
    behaviorRecords: Schema.Attribute.Component<'erp.behavior-record', true>;
    biography: Schema.Attribute.RichText &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    city: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    country: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    county: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dateOfBirth: Schema.Attribute.Date;
    departments: Schema.Attribute.Relation<
      'manyToMany',
      'api::department.department'
    >;
    documents: Schema.Attribute.Media<'images' | 'files' | 'videos', true>;
    email: Schema.Attribute.Email;
    emergencyContacts: Schema.Attribute.JSON;
    enrollmentHistory: Schema.Attribute.Component<
      'erp.enrollment-record',
      true
    >;
    firstName: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    gender: Schema.Attribute.Enumeration<['male', 'female']> &
      Schema.Attribute.Required;
    generalNotes: Schema.Attribute.RichText &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    graduationDate: Schema.Attribute.Date;
    lastName: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::student.student'
    >;
    medicalInfo: Schema.Attribute.Component<'erp.medical-record', true>;
    middleName: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    nationalId: Schema.Attribute.String;
    nationality: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    parents: Schema.Attribute.Relation<'manyToMany', 'api::parent.parent'>;
    passportNumber: Schema.Attribute.String;
    phone: Schema.Attribute.String;
    photo: Schema.Attribute.Media<'images'>;
    placeOfBirth: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    programs: Schema.Attribute.Relation<'manyToMany', 'api::program.program'>;
    publishedAt: Schema.Attribute.DateTime;
    qrCodeData: Schema.Attribute.String;
    religion: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Islam'>;
    schoolId: Schema.Attribute.String & Schema.Attribute.Unique;
    sections: Schema.Attribute.Relation<'manyToMany', 'api::section.section'>;
    staffNotes: Schema.Attribute.Component<'erp.staff-note', true>;
    status: Schema.Attribute.Enumeration<
      [
        'active',
        'inactive',
        'suspended',
        'graduated',
        'transferred',
        'withdrawn',
        'expelled',
        'alumni',
      ]
    > &
      Schema.Attribute.DefaultTo<'active'>;
    teachers: Schema.Attribute.Relation<'manyToMany', 'api::teacher.teacher'>;
    timeline: Schema.Attribute.Component<'erp.timeline-item', true>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiSubjectSubject extends Struct.CollectionTypeSchema {
  collectionName: 'subjects';
  info: {
    description: 'Academic Subjects';
    displayName: 'Subject';
    pluralName: 'subjects';
    singularName: 'subject';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activeStatus: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    color: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    creditValue: Schema.Attribute.Decimal;
    defaultWeeklyHours: Schema.Attribute.Integer;
    department: Schema.Attribute.Relation<
      'manyToOne',
      'api::department.department'
    >;
    description: Schema.Attribute.Text;
    displayOrder: Schema.Attribute.Integer;
    icon: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::subject.subject'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    passingScore: Schema.Attribute.Integer;
    programs: Schema.Attribute.Relation<'manyToMany', 'api::program.program'>;
    publishedAt: Schema.Attribute.DateTime;
    sections: Schema.Attribute.Relation<'manyToMany', 'api::section.section'>;
    students: Schema.Attribute.Relation<'manyToMany', 'api::student.student'>;
    subjectType: Schema.Attribute.Enumeration<
      ['Core', 'Elective', 'Extracurricular']
    > &
      Schema.Attribute.DefaultTo<'Core'>;
    teachers: Schema.Attribute.Relation<'manyToMany', 'api::teacher.teacher'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTajweedEvaluationTajweedEvaluation
  extends Struct.CollectionTypeSchema {
  collectionName: 'tajweed_evaluations';
  info: {
    description: 'Schema for Tajweed Evaluation';
    displayName: 'Tajweed Evaluation';
    pluralName: 'tajweed-evaluations';
    singularName: 'tajweed-evaluation';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    evaluationDate: Schema.Attribute.Date & Schema.Attribute.Required;
    fluency: Schema.Attribute.Integer;
    ghunnah: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::tajweed-evaluation.tajweed-evaluation'
    > &
      Schema.Attribute.Private;
    madd: Schema.Attribute.Integer;
    makharij: Schema.Attribute.Integer;
    meemSaakin: Schema.Attribute.Integer;
    noonSaakin: Schema.Attribute.Integer;
    overallScore: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    qalqalah: Schema.Attribute.Integer;
    sifaat: Schema.Attribute.Integer;
    student: Schema.Attribute.Relation<'manyToOne', 'api::student.student'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    teacherComments: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    waqf: Schema.Attribute.Integer;
  };
}

export interface ApiTeacherTeacher extends Struct.CollectionTypeSchema {
  collectionName: 'teachers';
  info: {
    description: 'Faculty, Sheikhs, and teaching staff profiles';
    displayName: 'Teacher Management';
    pluralName: 'teachers';
    singularName: 'teacher';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    address: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    biography: Schema.Attribute.RichText &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    departments: Schema.Attribute.Relation<
      'manyToMany',
      'api::department.department'
    >;
    documents: Schema.Attribute.Media<'files' | 'images', true>;
    email: Schema.Attribute.Email;
    emergencyContact: Schema.Attribute.String;
    employmentDate: Schema.Attribute.Date;
    employmentStatus: Schema.Attribute.Enumeration<
      [
        'active',
        'on_leave',
        'retired',
        'suspended',
        'contract',
        'part_time',
        'full_time',
      ]
    > &
      Schema.Attribute.DefaultTo<'active'>;
    experienceYears: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<5>;
    gender: Schema.Attribute.Enumeration<['male', 'female']>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::teacher.teacher'
    >;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    phone: Schema.Attribute.String & Schema.Attribute.Required;
    photo: Schema.Attribute.Media<'images'>;
    programs: Schema.Attribute.Relation<'manyToMany', 'api::program.program'>;
    publishedAt: Schema.Attribute.DateTime;
    qualifications: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    salaryGrade: Schema.Attribute.String;
    schoolId: Schema.Attribute.String & Schema.Attribute.Unique;
    sections: Schema.Attribute.Relation<'manyToMany', 'api::section.section'>;
    specializations: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    students: Schema.Attribute.Relation<'manyToMany', 'api::student.student'>;
    subjects: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiTestimonialTestimonial extends Struct.CollectionTypeSchema {
  collectionName: 'testimonials';
  info: {
    description: 'Parent, student, and alumni testimonials';
    displayName: 'Testimonial';
    pluralName: 'testimonials';
    singularName: 'testimonial';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    authorName: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    authorRole: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Schema.Attribute.DefaultTo<'Parent'>;
    avatar: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    isFeatured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::testimonial.testimonial'
    >;
    publishedAt: Schema.Attribute.DateTime;
    quote: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    rating: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<5>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTimetableSlotTimetableSlot
  extends Struct.CollectionTypeSchema {
  collectionName: 'timetable_slots';
  info: {
    displayName: 'Timetable Slot';
    pluralName: 'timetable-slots';
    singularName: 'timetable-slot';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    academicTerm: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-term.academic-term'
    >;
    academicYear: Schema.Attribute.Relation<
      'manyToOne',
      'api::academic-year.academic-year'
    >;
    campus: Schema.Attribute.Relation<'manyToOne', 'api::campus.campus'>;
    classroom: Schema.Attribute.Relation<
      'manyToOne',
      'api::classroom.classroom'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dayOfWeek: Schema.Attribute.Enumeration<
      [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ]
    > &
      Schema.Attribute.Required;
    durationMinutes: Schema.Attribute.Integer;
    endTime: Schema.Attribute.Time & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::timetable-slot.timetable-slot'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    section: Schema.Attribute.Relation<'manyToOne', 'api::section.section'>;
    startTime: Schema.Attribute.Time & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<
      ['Active', 'Cancelled', 'Rescheduled']
    > &
      Schema.Attribute.DefaultTo<'Active'>;
    subject: Schema.Attribute.Relation<'manyToOne', 'api::subject.subject'>;
    teacher: Schema.Attribute.Relation<'manyToOne', 'api::teacher.teacher'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTopicTopic extends Struct.CollectionTypeSchema {
  collectionName: 'topics';
  info: {
    displayName: 'Topic';
    pluralName: 'topics';
    singularName: 'topic';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    attachments: Schema.Attribute.Media<
      'files' | 'images' | 'videos' | 'audios',
      true
    >;
    completionStatus: Schema.Attribute.Enumeration<
      ['Pending', 'In Progress', 'Completed']
    > &
      Schema.Attribute.DefaultTo<'Pending'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    curriculum: Schema.Attribute.Relation<
      'manyToOne',
      'api::curriculum.curriculum'
    >;
    description: Schema.Attribute.Text;
    estimatedTime: Schema.Attribute.String;
    learningObjectives: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::topic.topic'> &
      Schema.Attribute.Private;
    orderNumber: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    teachingMethod: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiWorkerWorker extends Struct.CollectionTypeSchema {
  collectionName: 'workers';
  info: {
    description: 'Support staff profiles (Security, Cleaners, Cooks, Drivers, ICT, Mosque Caretakers)';
    displayName: 'Worker Management';
    pluralName: 'workers';
    singularName: 'worker';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    address: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    departments: Schema.Attribute.Relation<
      'manyToMany',
      'api::department.department'
    >;
    documents: Schema.Attribute.Media<'files' | 'images', true>;
    email: Schema.Attribute.Email;
    emergencyContact: Schema.Attribute.String;
    employmentDate: Schema.Attribute.Date;
    employmentStatus: Schema.Attribute.Enumeration<
      [
        'active',
        'on_leave',
        'retired',
        'suspended',
        'contract',
        'part_time',
        'full_time',
      ]
    > &
      Schema.Attribute.DefaultTo<'active'>;
    locale: Schema.Attribute.String;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::worker.worker'>;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    phone: Schema.Attribute.String & Schema.Attribute.Required;
    photo: Schema.Attribute.Media<'images'>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    salaryGrade: Schema.Attribute.String;
    schoolId: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.Text;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    focalPoint: Schema.Attribute.JSON;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.Text;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.Text & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    address: Schema.Attribute.Text;
    avatar: Schema.Attribute.Media<'images'>;
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dateOfBirth: Schema.Attribute.Date;
    displayName: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstName: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    gender: Schema.Attribute.Enumeration<['male', 'female']>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    lastLogin: Schema.Attribute.DateTime;
    lastName: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    nationality: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    phone: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 30;
      }>;
    preferredLanguage: Schema.Attribute.Enumeration<['en', 'ar', 'fr', 'tr']> &
      Schema.Attribute.DefaultTo<'en'>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    schoolId: Schema.Attribute.String &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 11;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::academic-calendar-event.academic-calendar-event': ApiAcademicCalendarEventAcademicCalendarEvent;
      'api::academic-certificate-template.academic-certificate-template': ApiAcademicCertificateTemplateAcademicCertificateTemplate;
      'api::academic-certificate.academic-certificate': ApiAcademicCertificateAcademicCertificate;
      'api::academic-resource.academic-resource': ApiAcademicResourceAcademicResource;
      'api::academic-term.academic-term': ApiAcademicTermAcademicTerm;
      'api::academic-transcript.academic-transcript': ApiAcademicTranscriptAcademicTranscript;
      'api::academic-year.academic-year': ApiAcademicYearAcademicYear;
      'api::admission-application.admission-application': ApiAdmissionApplicationAdmissionApplication;
      'api::announcement.announcement': ApiAnnouncementAnnouncement;
      'api::article.article': ApiArticleArticle;
      'api::assessment-category.assessment-category': ApiAssessmentCategoryAssessmentCategory;
      'api::assessment-type.assessment-type': ApiAssessmentTypeAssessmentType;
      'api::attendance-record.attendance-record': ApiAttendanceRecordAttendanceRecord;
      'api::audit-log.audit-log': ApiAuditLogAuditLog;
      'api::campus.campus': ApiCampusCampus;
      'api::category.category': ApiCategoryCategory;
      'api::classroom.classroom': ApiClassroomClassroom;
      'api::contact-info.contact-info': ApiContactInfoContactInfo;
      'api::contact-submission.contact-submission': ApiContactSubmissionContactSubmission;
      'api::curriculum.curriculum': ApiCurriculumCurriculum;
      'api::dawah-activity.dawah-activity': ApiDawahActivityDawahActivity;
      'api::department.department': ApiDepartmentDepartment;
      'api::donation-campaign.donation-campaign': ApiDonationCampaignDonationCampaign;
      'api::download-item.download-item': ApiDownloadItemDownloadItem;
      'api::event.event': ApiEventEvent;
      'api::exam-room.exam-room': ApiExamRoomExamRoom;
      'api::exam-schedule.exam-schedule': ApiExamScheduleExamSchedule;
      'api::exam-session.exam-session': ApiExamSessionExamSession;
      'api::examination.examination': ApiExaminationExamination;
      'api::faq.faq': ApiFaqFaq;
      'api::footer-config.footer-config': ApiFooterConfigFooterConfig;
      'api::gallery-item.gallery-item': ApiGalleryItemGalleryItem;
      'api::grade-band.grade-band': ApiGradeBandGradeBand;
      'api::grade-moderation.grade-moderation': ApiGradeModerationGradeModeration;
      'api::gradebook-entry.gradebook-entry': ApiGradebookEntryGradebookEntry;
      'api::grading-scheme.grading-scheme': ApiGradingSchemeGradingScheme;
      'api::graduation-record.graduation-record': ApiGraduationRecordGraduationRecord;
      'api::halaqah.halaqah': ApiHalaqahHalaqah;
      'api::homepage.homepage': ApiHomepageHomepage;
      'api::homework-submission.homework-submission': ApiHomeworkSubmissionHomeworkSubmission;
      'api::homework.homework': ApiHomeworkHomework;
      'api::honor-roll.honor-roll': ApiHonorRollHonorRoll;
      'api::language-achievement.language-achievement': ApiLanguageAchievementLanguageAchievement;
      'api::language-certificate.language-certificate': ApiLanguageCertificateLanguageCertificate;
      'api::language-competition.language-competition': ApiLanguageCompetitionLanguageCompetition;
      'api::language-level.language-level': ApiLanguageLevelLanguageLevel;
      'api::language-portfolio.language-portfolio': ApiLanguagePortfolioLanguagePortfolio;
      'api::language-program.language-program': ApiLanguageProgramLanguageProgram;
      'api::lesson-delivery.lesson-delivery': ApiLessonDeliveryLessonDelivery;
      'api::lesson-plan.lesson-plan': ApiLessonPlanLessonPlan;
      'api::marks-entry.marks-entry': ApiMarksEntryMarksEntry;
      'api::memorization.memorization': ApiMemorizationMemorization;
      'api::murajaah.murajaah': ApiMurajaahMurajaah;
      'api::navigation-menu.navigation-menu': ApiNavigationMenuNavigationMenu;
      'api::notification.notification': ApiNotificationNotification;
      'api::observation-journal.observation-journal': ApiObservationJournalObservationJournal;
      'api::page.page': ApiPagePage;
      'api::parent.parent': ApiParentParent;
      'api::partner.partner': ApiPartnerPartner;
      'api::placement-test.placement-test': ApiPlacementTestPlacementTest;
      'api::program.program': ApiProgramProgram;
      'api::promotion-record.promotion-record': ApiPromotionRecordPromotionRecord;
      'api::question-pool.question-pool': ApiQuestionPoolQuestionPool;
      'api::question.question': ApiQuestionQuestion;
      'api::quran-achievement.quran-achievement': ApiQuranAchievementQuranAchievement;
      'api::quran-assessment.quran-assessment': ApiQuranAssessmentQuranAssessment;
      'api::quran-attendance.quran-attendance': ApiQuranAttendanceQuranAttendance;
      'api::quran-certificate.quran-certificate': ApiQuranCertificateQuranCertificate;
      'api::quran-competition.quran-competition': ApiQuranCompetitionQuranCompetition;
      'api::quran-group.quran-group': ApiQuranGroupQuranGroup;
      'api::quran-program.quran-program': ApiQuranProgramQuranProgram;
      'api::report-card.report-card': ApiReportCardReportCard;
      'api::report-template.report-template': ApiReportTemplateReportTemplate;
      'api::rubric.rubric': ApiRubricRubric;
      'api::school-id-sequence.school-id-sequence': ApiSchoolIdSequenceSchoolIdSequence;
      'api::school-profile.school-profile': ApiSchoolProfileSchoolProfile;
      'api::section.section': ApiSectionSection;
      'api::skill-assessment.skill-assessment': ApiSkillAssessmentSkillAssessment;
      'api::student-ranking.student-ranking': ApiStudentRankingStudentRanking;
      'api::student-result.student-result': ApiStudentResultStudentResult;
      'api::student.student': ApiStudentStudent;
      'api::subject.subject': ApiSubjectSubject;
      'api::tajweed-evaluation.tajweed-evaluation': ApiTajweedEvaluationTajweedEvaluation;
      'api::teacher.teacher': ApiTeacherTeacher;
      'api::testimonial.testimonial': ApiTestimonialTestimonial;
      'api::timetable-slot.timetable-slot': ApiTimetableSlotTimetableSlot;
      'api::topic.topic': ApiTopicTopic;
      'api::worker.worker': ApiWorkerWorker;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}

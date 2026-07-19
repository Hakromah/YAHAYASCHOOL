import type { Core } from '@strapi/strapi';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL Role Definitions
// ─────────────────────────────────────────────────────────────────────────────

const SCHOOL_ROLES = [
  {
    name: 'Super Administrator',
    description: 'Full unrestricted access to every feature and permission in the platform',
    type: 'super-administrator',
  },
  {
    name: 'Director',
    description: 'School director with comprehensive management access across all modules',
    type: 'director',
  },
  {
    name: 'Teacher',
    description: 'Teaching staff with access to classroom, attendance, grades, and learning materials',
    type: 'teacher',
  },
  {
    name: 'Student',
    description: 'Student with access to personal grades, timetable, materials, and communications',
    type: 'student',
  },
  {
    name: 'Parent',
    description: 'Parent/guardian with access to child progress, fees, attendance, and school communications',
    type: 'parent',
  },
  {
    name: 'Worker',
    description: 'Non-teaching support staff with limited administrative access',
    type: 'worker',
  },
  {
    name: 'Accountant',
    description: 'Finance staff who can create and manage transactions but cannot approve them',
    type: 'accountant',
  },
  {
    name: 'Account Lead',
    description: 'Senior finance staff with full financial management and transaction approval authority',
    type: 'account-lead',
  },
  {
    name: 'Driver',
    description: 'Transport staff with access to vehicle assignments and student transport records',
    type: 'driver',
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap: Seed roles on startup
// ─────────────────────────────────────────────────────────────────────────────

async function seedRoles(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Seeding school roles...');

  for (const roleData of SCHOOL_ROLES) {
    const existing = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: roleData.type } });

    if (!existing) {
      await strapi.db.query('plugin::users-permissions.role').create({
        data: {
          name: roleData.name,
          description: roleData.description,
          type: roleData.type,
        },
      });
      strapi.log.info(`[YAHAYASCOOL] ✅ Created role: ${roleData.name}`);
    } else {
      strapi.log.info(`[YAHAYASCOOL] ✓ Role already exists: ${roleData.name}`);
    }
  }

  strapi.log.info('[YAHAYASCOOL] Role seeding complete.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap: Seed i18n Locales (en, ar, fr, tr)
// ─────────────────────────────────────────────────────────────────────────────

async function seedLocales(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Seeding i18n locales (en, ar, fr, tr)...');
  const REQUIRED_LOCALES = [
    { code: 'en', name: 'English (en)' },
    { code: 'ar', name: 'Arabic (ar)' },
    { code: 'fr', name: 'French (fr)' },
    { code: 'tr', name: 'Turkish (tr)' },
  ];

  for (const loc of REQUIRED_LOCALES) {
    try {
      const existing = await strapi.db
        .query('plugin::i18n.locale')
        .findOne({ where: { code: loc.code } });

      if (!existing) {
        await strapi.db.query('plugin::i18n.locale').create({
          data: {
            code: loc.code,
            name: loc.name,
          },
        });
        strapi.log.info(`[YAHAYASCOOL] ✅ Created i18n locale: ${loc.name}`);
      } else {
        strapi.log.info(`[YAHAYASCOOL] ✓ i18n locale already exists: ${loc.name}`);
      }
    } catch (err: any) {
      strapi.log.warn(`[YAHAYASCOOL] Could not seed locale ${loc.code}: ${err.message}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle: Auto-generate School ID on user creation
// ─────────────────────────────────────────────────────────────────────────────

function registerUserLifecycles(strapi: Core.Strapi): void {
  strapi.db.lifecycles.subscribe({
    models: ['plugin::users-permissions.user'],

    async beforeCreate(event: any) {
      const { data } = event.params;

      // Only generate if not already set (Super Admin override exception)
      if (data.schoolId) return;

      try {
        let initials = 'XX';

        const firstName = String(data.firstName ?? '').trim();
        const lastName = String(data.lastName ?? '').trim();
        const username = String(data.username ?? '').trim();

        if (firstName && lastName) {
          initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
        } else if (firstName) {
          initials = `${firstName.charAt(0)}${firstName.charAt(1) ?? 'X'}`;
        } else if (username && username.length >= 2) {
          initials = username.substring(0, 2);
        }

        const schoolIdService = strapi.service(
          'api::school-id-sequence.school-id-sequence'
        ) as { generateNextId: (initials: string) => Promise<string> };

        data.schoolId = await schoolIdService.generateNextId(initials);

        strapi.log.info(
          `[YAHAYASCOOL] School ID generated: ${data.schoolId} for user "${data.username ?? data.email}"`
        );
      } catch (error) {
        strapi.log.error('[YAHAYASCOOL] Failed to generate School ID:', error);
        // Do not block user creation — schoolId can be set manually by Super Admin
      }
    },

    async afterCreate(event: any) {
      // Log user creation to audit trail
      try {
        const auditService = strapi.service('api::audit-log.audit-log') as {
          log: (payload: Record<string, unknown>) => Promise<void>;
        };
        await auditService.log({
          action: 'USER_CREATED',
          entity: 'plugin::users-permissions.user',
          entityId: String(event.result?.id ?? ''),
          description: `New user created: ${event.result?.username ?? event.result?.email}`,
          metadata: {
            username: event.result?.username,
            email: event.result?.email,
            schoolId: event.result?.schoolId,
          },
          severity: 'info',
        });
      } catch {
        // Audit log failures must never block main operations
      }
    },

    async afterUpdate(event: any) {
      // Prevent schoolId mutation (immutable after creation)
      // Note: The real enforcement is done at the API layer / policy level
      try {
        const auditService = strapi.service('api::audit-log.audit-log') as {
          log: (payload: Record<string, unknown>) => Promise<void>;
        };
        await auditService.log({
          action: 'USER_UPDATED',
          entity: 'plugin::users-permissions.user',
          entityId: String(event.result?.id ?? ''),
          description: `User updated: ${event.result?.username ?? event.result?.email}`,
          metadata: { updatedFields: Object.keys(event.params?.data ?? {}) },
          severity: 'info',
        });
      } catch {
        // Audit log failures must never block main operations
      }
    },

    async afterDelete(event: any) {
      try {
        const auditService = strapi.service('api::audit-log.audit-log') as {
          log: (payload: Record<string, unknown>) => Promise<void>;
        };
        await auditService.log({
          action: 'USER_DELETED',
          entity: 'plugin::users-permissions.user',
          entityId: String(event.result?.id ?? ''),
          description: `User deleted: ${event.result?.username ?? event.result?.email}`,
          metadata: {
            schoolId: event.result.schoolId,
            username: event.result.username,
          },
          severity: 'warning',
        });
      } catch {
        // Audit log failures must never block main operations
      }
    },
  });

  strapi.log.info('[YAHAYASCOOL] User lifecycle hooks registered.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle: Auto-generate ERP IDs (ST-2026-001, ADM/2026/0101, TCH-2026-001)
// ─────────────────────────────────────────────────────────────────────────────

function registerERPLifecycles(strapi: Core.Strapi): void {
  const modelsWithSequence = [
    { model: 'api::student.student', prefix: 'ST-2026-', idField: 'schoolId', admPrefix: 'ADM/2026/' },
    { model: 'api::teacher.teacher', prefix: 'TCH-2026-', idField: 'schoolId' },
    { model: 'api::parent.parent', prefix: 'PR-2026-', idField: 'schoolId' },
    { model: 'api::worker.worker', prefix: 'WRK-2026-', idField: 'schoolId' },
  ];

  for (const item of modelsWithSequence) {
    strapi.db.lifecycles.subscribe({
      models: [item.model as any],
      async beforeCreate(event: any) {
        const { data } = event.params;
        if (!data[item.idField]) {
          try {
            const count = await strapi.db.query(item.model as any).count({});
            const seq = String(count + 1).padStart(3, '0');
            data[item.idField] = `${item.prefix}${seq}`;
            if (item.admPrefix && !data.admissionNumber) {
              data.admissionNumber = `${item.admPrefix}${seq}`;
            }
          } catch (err: any) {
            strapi.log.warn(`[YAHAYASCOOL] Could not auto-generate ID for ${item.model}: ${err.message}`);
          }
        }
      },
    });
  }
  strapi.log.info('[YAHAYASCOOL] ERP lifecycle hooks registered.');
}


// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap: Seed Public Permissions for Website Access
// ─────────────────────────────────────────────────────────────────────────────

async function seedPublicPermissions(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Seeding public read permissions for CMS...');

  try {
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (!publicRole) {
      strapi.log.warn('[YAHAYASCOOL] Public role not found, skipping permission seeding.');
      return;
    }

    const publicControllers = [
      'api::homepage.homepage',
      'api::page.page',
      'api::program.program',
      'api::department.department',
      'api::article.article',
      'api::category.category',
      'api::event.event',
      'api::announcement.announcement',
      'api::testimonial.testimonial',
      'api::gallery-item.gallery-item',
      'api::download-item.download-item',
      'api::faq.faq',
      'api::contact-info.contact-info',
      'api::footer-config.footer-config',
      'api::navigation-menu.navigation-menu',
      'api::partner.partner',
      'api::donation-campaign.donation-campaign',
      'api::academic-year.academic-year',
      'api::academic-term.academic-term',
      'api::campus.campus',
      'api::section.section',
      // LMS Phase 3A
      'api::subject.subject',
      'api::curriculum.curriculum',
      'api::topic.topic',
      'api::academic-resource.academic-resource',
      'api::classroom.classroom',
      'api::timetable-slot.timetable-slot',
      'api::academic-calendar-event.academic-calendar-event',
      'api::lesson-plan.lesson-plan',
      'api::lesson-delivery.lesson-delivery',
      'api::attendance-record.attendance-record',
      'api::homework.homework',
      'api::homework-submission.homework-submission',
      'api::gradebook-entry.gradebook-entry',
      // QMS Phase 3B
      'api::quran-program.quran-program',
      'api::quran-group.quran-group',
      'api::memorization.memorization',
      'api::murajaah.murajaah',
      'api::tajweed-evaluation.tajweed-evaluation',
      'api::halaqah.halaqah',
      'api::quran-attendance.quran-attendance',
      'api::quran-assessment.quran-assessment',
      'api::dawah-activity.dawah-activity',
      'api::quran-competition.quran-competition',
      'api::quran-achievement.quran-achievement',
      'api::quran-certificate.quran-certificate',
      // LLMS Phase 3C
      'api::language-program.language-program',
      'api::language-level.language-level',
      'api::placement-test.placement-test',
      'api::skill-assessment.skill-assessment',
      'api::language-portfolio.language-portfolio',
      'api::observation-journal.observation-journal',
      'api::language-competition.language-competition',
      'api::language-achievement.language-achievement',
      'api::language-certificate.language-certificate',
      // Assessment Phase 3D-1
      'api::assessment-type.assessment-type',
      'api::assessment-category.assessment-category',
      'api::grading-scheme.grading-scheme',
      'api::grade-band.grade-band',
      'api::rubric.rubric',
      'api::exam-session.exam-session',
      'api::examination.examination',
      'api::question.question',
      'api::question-pool.question-pool',
      'api::exam-schedule.exam-schedule',
      'api::exam-room.exam-room',
      'api::marks-entry.marks-entry',
      'api::grade-moderation.grade-moderation',
      // Phase 3D-2: Results & Reporting
      'api::report-template.report-template',
      'api::student-result.student-result',
      'api::report-card.report-card',
      'api::student-ranking.student-ranking',
      'api::promotion-record.promotion-record',
      'api::graduation-record.graduation-record',
      'api::academic-transcript.academic-transcript',
      'api::academic-certificate-template.academic-certificate-template',
      'api::academic-certificate.academic-certificate',
      'api::honor-roll.honor-roll',
    ];

    for (const controller of publicControllers) {
      for (const action of ['find', 'findOne']) {
        const actionName = `${controller}.${action}`;
        const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
          where: { action: actionName, role: publicRole.id },
        });

        if (!existing) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: {
              action: actionName,
              role: publicRole.id,
            },
          });
        }
      }
    }

    // Allow public create on form endpoints
    for (const controller of ['api::contact-submission.contact-submission', 'api::admission-application.admission-application']) {
      const actionName = `${controller}.create`;
      const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: { action: actionName, role: publicRole.id },
      });

      if (!existing) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: {
            action: actionName,
            role: publicRole.id,
          },
        });
      }
    }

    strapi.log.info('[YAHAYASCOOL] ✅ Public permissions successfully seeded.');

    // Give the Authenticated role access to Dashboard APIs
    const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });
    if (authRole) {
      for (const action of [
        'getAdminDashboard',
        'getDirectorDashboard',
        'getTeacherDashboard',
        'getStudentDashboard',
        'getParentDashboard',
        'getAccountantDashboard',
        'getAccountLeadDashboard',
        'getWorkerDashboard',
        'getDriverDashboard',
      ]) {
        const actionName = `api::dashboard.dashboard.${action}`;
        const existingAuth = await strapi.db.query('plugin::users-permissions.permission').findOne({
          where: { action: actionName, role: authRole.id },
        });
        if (!existingAuth) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: { action: actionName, role: authRole.id },
          });
        }
      }
      strapi.log.info('[YAHAYASCOOL] ✅ Authenticated Dashboard permissions seeded.');
    }
  } catch (error) {
    strapi.log.error('[YAHAYASCOOL] Failed to seed public permissions:', error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap: Seed Core School ERP Data
// ─────────────────────────────────────────────────────────────────────────────

async function seedERPData(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Checking and seeding Core School ERP data...');
  try {
    // 1. Campus
    strapi.log.info('[YAHAYASCOOL] Checking Campus...');
    const campuses = await strapi.db.query('api::campus.campus').findMany({ limit: 1 });
    let mainCampusId = campuses[0]?.id;
    if (campuses.length === 0) {
      strapi.log.info('[YAHAYASCOOL] Creating Campus...');
      const created = await strapi.db.query('api::campus.campus').create({
        data: {
          name: 'Main Islamic & Sciences Campus',
          code: 'MAIN',
          address: 'Plot 18, Education District, Islamic Knowledge Avenue, West Africa',
          phone: '+234 (0) 800-YAHAYA-S',
          email: 'campus@yahayaschool.edu',
          principalName: 'Sheikh Dr. Yahaya Al-Hassan',
          status: 'active',
        },
      });
      mainCampusId = created.id;
      strapi.log.info('[YAHAYASCOOL] ✅ Seeded Main Campus.');
    }

    // 2. Academic Year
    strapi.log.info('[YAHAYASCOOL] Checking Academic Year...');
    const years = await strapi.db.query('api::academic-year.academic-year').findMany({ limit: 1 });
    let currentYearId = years[0]?.id;
    if (years.length === 0) {
      strapi.log.info('[YAHAYASCOOL] Creating Academic Year...');
      const created = await strapi.db.query('api::academic-year.academic-year').create({
        data: {
          name: '2026/2027 Academic Year',
          startDate: '2026-09-01',
          endDate: '2027-06-30',
          status: 'active',
          isCurrent: true,
        },
      });
      currentYearId = created.id;
      strapi.log.info('[YAHAYASCOOL] ✅ Seeded 2026/2027 Academic Year.');
    }

    // 3. Academic Terms
    strapi.log.info('[YAHAYASCOOL] Checking Academic Terms...');
    const terms = await strapi.db.query('api::academic-term.academic-term').findMany({ limit: 1 });
    if (terms.length === 0 && currentYearId) {
      strapi.log.info('[YAHAYASCOOL] Creating Academic Terms...');
      const termData = [
        { name: 'First Term', startDate: '2026-09-01', endDate: '2026-12-15', active: true },
        { name: 'Second Term', startDate: '2027-01-10', endDate: '2027-04-05', active: false },
        { name: 'Third Term', startDate: '2027-04-20', endDate: '2027-07-15', active: false },
      ];
      for (const t of termData) {
        await strapi.db.query('api::academic-term.academic-term').create({
          data: {
            name: t.name,
            startDate: t.startDate,
            endDate: t.endDate,
            academicYear: currentYearId,
            active: t.active,
          },
        });
      }
      strapi.log.info('[YAHAYASCOOL] ✅ Seeded 3 Academic Terms.');
    }

    // 4. Sections
    strapi.log.info('[YAHAYASCOOL] Checking Sections...');
    const sections = await strapi.db.query('api::section.section').findMany({ limit: 1 });
    if (sections.length === 0 && currentYearId) {
      strapi.log.info('[YAHAYASCOOL] Creating Sections...');
      const secData = [
        { name: 'Grade 6A - Tahfidz Honors', code: 'G6A-TH', capacity: 35 },
        { name: 'Grade 6B - STEM Excellence', code: 'G6B-SE', capacity: 35 },
        { name: 'Grade 7A - Arabic Immersion', code: 'G7A-AI', capacity: 35 },
        { name: 'Grade 8A - Islamic Scholarship', code: 'G8A-IS', capacity: 30 },
        { name: 'Boarding Group 1', code: 'BRD-G1', capacity: 50 },
      ];
      for (const s of secData) {
        await strapi.db.query('api::section.section').create({
          data: {
            name: s.name,
            code: s.code,
            capacity: s.capacity,
            active: true,
            academicYear: currentYearId,
          },
        });
      }
      strapi.log.info('[YAHAYASCOOL] ✅ Seeded 5 Academic Sections.');
    }

    // 5. Teachers
    strapi.log.info('[YAHAYASCOOL] Checking Teachers...');
    const teachers = await strapi.db.query('api::teacher.teacher').findMany({ limit: 1 });
    if (teachers.length === 0) {
      const tData = [
        { name: 'Sheikh Dr. Yahaya Al-Hassan', schoolId: 'TCH-2026-001', qualifications: 'Ph.D. Islamic Sciences', specializations: 'Qur\'an Tajweed, Fiqh', phone: '+2348011111101', email: 'director@yahayaschool.edu', salaryGrade: 'Grade A1' },
        { name: 'Ustadh Ibrahim Al-Maliki', schoolId: 'TCH-2026-002', qualifications: 'M.A. Hadith Studies', specializations: 'Classical Hadith, Arabic Rhetoric', phone: '+2348011111102', email: 'ibrahim@yahayaschool.edu', salaryGrade: 'Grade A2' },
        { name: 'Dr. Fatima Abdullah', schoolId: 'TCH-2026-003', qualifications: 'Ph.D. Biochemistry', specializations: 'Advanced Chemistry, Biology', phone: '+2348011111103', email: 'fatima@yahayaschool.edu', salaryGrade: 'Grade A2' },
        { name: 'Sheikh Tariq Al-Mansoor', schoolId: 'TCH-2026-004', qualifications: 'B.A. Shariah & Qira\'at', specializations: 'Ten Qira\'at, Memorization', phone: '+2348011111104', email: 'tariq@yahayaschool.edu', salaryGrade: 'Grade B1' },
        { name: 'Madame Amina Diop', schoolId: 'TCH-2026-005', qualifications: 'M.A. French & Linguistics', specializations: 'French Literature, English Grammar', phone: '+2348011111105', email: 'amina@yahayaschool.edu', salaryGrade: 'Grade B1' },
        { name: 'Mr. Yusuf Al-Farsi', schoolId: 'TCH-2026-006', qualifications: 'M.Sc. Computer Engineering', specializations: 'Robotics, Python Computing', phone: '+2348011111106', email: 'yusuf@yahayaschool.edu', salaryGrade: 'Grade B2' },
        { name: 'Dr. Zainab Al-Qasimi', schoolId: 'TCH-2026-007', qualifications: 'Ph.D. Applied Mathematics', specializations: 'Calculus, Pure Mathematics', phone: '+2348011111107', email: 'zainab@yahayaschool.edu', salaryGrade: 'Grade A2' },
        { name: 'Ustadh Bilal Al-Habashi', schoolId: 'TCH-2026-008', qualifications: 'B.A. Islamic History', specializations: 'Seerah, Islamic Civilization', phone: '+2348011111108', email: 'bilal@yahayaschool.edu', salaryGrade: 'Grade B2' },
      ];
      for (const t of tData) {
        await strapi.documents('api::teacher.teacher').create({
          data: {
            ...t,
            gender: t.name.includes('Dr. Fatima') || t.name.includes('Amina') || t.name.includes('Zainab') ? 'female' : 'male',
            employmentStatus: 'active',
            experienceYears: 7,
          },
          status: 'published'
        });
      }
      strapi.log.info('[YAHAYASCOOL] ✅ Seeded 8 Teachers.');
    }

    // 6. Parents
    strapi.log.info('[YAHAYASCOOL] Checking Parents...');
    const parents = await strapi.db.query('api::parent.parent').findMany({ limit: 1 });
    if (parents.length === 0) {
      strapi.log.info('[YAHAYASCOOL] Creating Parents...');
      const pData = [
        { name: 'Sheikh Tariq Al-Mansoor Senior', schoolId: 'PR-2026-001', relationship: 'father', phone: '+2348022222201', email: 'tariq.parent@gmail.com', occupation: 'Merchant & Scholar' },
        { name: 'Dr. Fatima Abdullah Senior', schoolId: 'PR-2026-002', relationship: 'mother', phone: '+2348022222202', email: 'fatima.parent@gmail.com', occupation: 'Pediatric Surgeon' },
        { name: 'Mr. Yusuf Diop Senior', schoolId: 'PR-2026-003', relationship: 'father', phone: '+2348022222203', email: 'yusuf.parent@gmail.com', occupation: 'Diplomat' },
        { name: 'Madame Amina Diop Senior', schoolId: 'PR-2026-004', relationship: 'mother', phone: '+2348022222204', email: 'amina.parent@gmail.com', occupation: 'International Consultant' },
        { name: 'Engineer Ali Al-Qasimi', schoolId: 'PR-2026-005', relationship: 'father', phone: '+2348022222205', email: 'ali.parent@gmail.com', occupation: 'Civil Architect' },
      ];
      for (const p of pData) {
        await strapi.documents('api::parent.parent').create({
          data: {
            ...p,
            relationship: p.relationship as any,
            preferredLanguage: 'en',
            religion: 'Islam',
          },
          status: 'published'
        });
      }
      strapi.log.info('[YAHAYASCOOL] ✅ Seeded 5 Parents.');
    }

    // 7. Workers
    strapi.log.info('[YAHAYASCOOL] Checking Workers...');
    const workers = await strapi.db.query('api::worker.worker').findMany({ limit: 1 });
    if (workers.length === 0) {
      strapi.log.info('[YAHAYASCOOL] Creating Workers...');
      const wData = [
        { name: 'Captain Khalid Al-Saud', schoolId: 'WRK-2026-001', role: 'Chief Security Officer', phone: '+2348033333301', email: 'khalid@yahayaschool.edu', salaryGrade: 'Grade W1' },
        { name: 'Chef Rashid Al-Mahmoud', schoolId: 'WRK-2026-002', role: 'Campus Head Chef', phone: '+2348033333302', email: 'rashid@yahayaschool.edu', salaryGrade: 'Grade W2' },
        { name: 'Mr. Suleiman Al-Bashir', schoolId: 'WRK-2026-003', role: 'Senior Transport Driver', phone: '+2348033333303', email: 'suleiman@yahayaschool.edu', salaryGrade: 'Grade W3' },
        { name: 'Eng. Tariq Al-Zahrani', schoolId: 'WRK-2026-004', role: 'ICT Specialist & Network Admin', phone: '+2348033333304', email: 'tariqz@yahayaschool.edu', salaryGrade: 'Grade W1' },
        { name: 'Sheikh Dawood Al-Hafiz', schoolId: 'WRK-2026-005', role: 'Mosque Caretaker & Muazzin', phone: '+2348033333305', email: 'dawood@yahayaschool.edu', salaryGrade: 'Grade W2' },
        { name: 'Mrs. Hawa Al-Tijani', schoolId: 'WRK-2026-006', role: 'Campus Head Nurse', phone: '+2348033333306', email: 'hawa@yahayaschool.edu', salaryGrade: 'Grade W1' },
      ];
      for (const w of wData) {
        await strapi.documents('api::worker.worker').create({
          data: {
            ...w,
            employmentStatus: 'active',
          },
          status: 'published'
        });
      }
      strapi.log.info('[YAHAYASCOOL] ✅ Seeded 6 Support Workers.');
    }

    // 8. Students
    strapi.log.info('[YAHAYASCOOL] Checking Students...');
    const students = await strapi.db.query('api::student.student').findMany({ limit: 1 });
    if (students.length === 0) {
      strapi.log.info('[YAHAYASCOOL] Creating Students...');
      const sNames = [
        { f: 'Ahmed', l: 'Al-Mansoor', g: 'male', id: 'ST-2026-001', adm: 'ADM/2026/0101' },
        { f: 'Mariam', l: 'Abdullah', g: 'female', id: 'ST-2026-002', adm: 'ADM/2026/0102' },
        { f: 'Yusuf', l: 'Diop', g: 'male', id: 'ST-2026-003', adm: 'ADM/2026/0103' },
        { f: 'Zainab', l: 'Al-Farsi', g: 'female', id: 'ST-2026-004', adm: 'ADM/2026/0104' },
        { f: 'Ibrahim', l: 'Al-Qasimi', g: 'male', id: 'ST-2026-005', adm: 'ADM/2026/0105' },
        { f: 'Fatima', l: 'Al-Habashi', g: 'female', id: 'ST-2026-006', adm: 'ADM/2026/0106' },
        { f: 'Omar', l: 'Al-Khattab', g: 'male', id: 'ST-2026-007', adm: 'ADM/2026/0107' },
        { f: 'Khadija', l: 'Bint Khuwailid', g: 'female', id: 'ST-2026-008', adm: 'ADM/2026/0108' },
        { f: 'Hassan', l: 'Ali', g: 'male', id: 'ST-2026-009', adm: 'ADM/2026/0109' },
        { f: 'Hussein', l: 'Ali', g: 'male', id: 'ST-2026-010', adm: 'ADM/2026/0110' },
        { f: 'Aisha', l: 'Al-Siddiq', g: 'female', id: 'ST-2026-011', adm: 'ADM/2026/0111' },
        { f: 'Bilal', l: 'Ibn Rabah', g: 'male', id: 'ST-2026-012', adm: 'ADM/2026/0112' },
        { f: 'Safiya', l: 'Al-Banna', g: 'female', id: 'ST-2026-013', adm: 'ADM/2026/0113' },
        { f: 'Tariq', l: 'Ibn Ziyad', g: 'male', id: 'ST-2026-014', adm: 'ADM/2026/0114' },
        { f: 'Noura', l: 'Al-Ghamdi', g: 'female', id: 'ST-2026-015', adm: 'ADM/2026/0115' },
      ];

      for (const st of sNames) {
        await strapi.documents('api::student.student').create({
          data: {
            schoolId: st.id,
            admissionNumber: st.adm,
            firstName: st.f,
            lastName: st.l,
            gender: st.g as any,
            dateOfBirth: '2012-05-14',
            nationality: 'Nigerian',
            religion: 'Islam',
            status: 'active',
            admissionDate: '2026-09-01',
            biography: `<p>Dedicated student of Tahfidz and Sciences enrolled at YAHAYASCOOL.</p>`,
            timeline: [
              { date: '2026-09-01', title: 'Admitted to YAHAYASCOOL', category: 'Admission', description: '<p>Successfully passed entrance examination and interview with Sheikh Dr. Yahaya Al-Hassan.</p>', loggedBy: 'Admissions Office' },
              { date: '2026-09-05', title: 'Assigned to Grade 6A Tahfidz Honors', category: 'Section Change', description: '<p>Placed in primary memorization track under Ustadh Ibrahim Al-Maliki.</p>', loggedBy: 'Academic Registrar' }
            ],
            behaviorRecords: [
              { teacherName: 'Ustadh Ibrahim Al-Maliki', date: '2026-10-12', level: 'green', category: 'Qur\'an Memorization Excellence', description: '<p>Demonstrated outstanding focus and memorized 5 extra pages of Surah Al-Baqarah during weekend review.</p>', recommendation: 'Commended in morning assembly.' }
            ],
          },
          status: 'published'
        });
      }
      strapi.log.info('[YAHAYASCOOL] ✅ Seeded 15 Student Profiles with Timeline & Behavior records.');
    }
  } catch (error: any) {
    strapi.log.error('[YAHAYASCOOL] Error seeding ERP data:', error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap: Seed Initial Sample CMS Content
// ─────────────────────────────────────────────────────────────────────────────

async function seedSampleContent(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Checking and seeding initial sample content...');

  try {
    // 1. Seed Homepage if not exists
    strapi.log.info('[YAHAYASCOOL] Checking Homepage...');
    try {
      const existingHomepage = await strapi.db.query('api::homepage.homepage').findMany({ limit: 1 });
      if (existingHomepage.length === 0) {
        strapi.log.info('[YAHAYASCOOL] Creating Homepage...');
        await strapi.documents('api::homepage.homepage').create({
          data: {
            title: 'Welcome to YAHAYASCOOL',
            sections: [
              {
                __component: 'sections.hero',
                badge: 'Bismillah ir-Rahman ir-Rahim',
                title: 'Yahaya International Islamic & English High School',
                subtitle: 'Empowering future Muslim leaders with world-class Western sciences, rigorous Islamic scholarship, and exemplary Qur\'anic moral excellence.',
                primaryCtaText: 'Online Admissions Application',
                primaryCtaUrl: '/online-registration',
                secondaryCtaText: 'Explore Our Programs',
                secondaryCtaUrl: '/programs',
              },
              {
                __component: 'sections.stats',
                title: 'Academic & Moral Excellence in Numbers',
                subtitle: 'A track record of distinction and integrity',
                statsList: [
                  { number: '100%', label: 'University Acceptance', icon: 'graduation-cap' },
                  { number: '1,200+', label: 'Active Students', icon: 'users' },
                  { number: '30+', label: 'Hafiz Qur\'an Graduates Annually', icon: 'book-open' },
                  { number: '1:12', label: 'Teacher to Student Ratio', icon: 'award' },
                ],
              },
              {
                __component: 'sections.principal-welcome',
                sectionBadge: 'Principal\'s Welcome',
                title: 'Nurturing Academic Excellence & Moral Integrity',
                principalName: 'Sheikh Dr. Yahaya Al-Hassan',
                principalTitle: 'Director General & Principal',
                message: 'At Yahaya International Islamic and English High School, we believe that true education is the harmonization of intellectual brilliance with spiritual depth. Our mission is to raise a disciplined, innovative, and God-fearing generation capable of leading global institutions while embodying the timeless ethical virtues of Islam.',
                quote: 'Knowledge without character is like a tree without fruit.',
              },
              {
                __component: 'sections.programs-grid',
                title: 'Our Academic Programs',
                subtitle: 'Excellence across Islamic Sciences and Western Disciplines',
                limit: 6,
                showFeaturedOnly: false,
              },
              {
                __component: 'sections.departments-grid',
                title: 'Specialized Departments',
                subtitle: 'Dedicated faculties ensuring comprehensive subject mastery',
                limit: 4,
              },
              {
                __component: 'sections.news-grid',
                title: 'Latest News & Updates',
                subtitle: 'Stay connected with campus announcements and achievements',
                limit: 3,
              },
              {
                __component: 'sections.events-grid',
                title: 'Upcoming Calendar Events',
                subtitle: 'Join our academic symposiums, Islamic gatherings, and parent days',
                limit: 3,
              },
              {
                __component: 'sections.donation-banner',
                badge: 'Sadaqah Jariyah & Waqf',
                title: 'Support School Development & Islamic Endowment',
                description: 'Your continuous charity (Sadaqah Jariyah) directly builds science research laboratories, campus mosques, and full tuition scholarships for talented orphans.',
                buttonText: 'Contribute to Our Waqf Fund',
                buttonUrl: '/donations',
              },
              {
                __component: 'sections.cta-banner',
                title: 'Ready to Join the YAHAYASCOOL Community?',
                description: 'Applications for the upcoming 2026/2027 academic year are now open. Secure your child\'s future today.',
                buttonText: 'Start Online Application',
                buttonUrl: '/online-registration',
                themeStyle: 'emerald',
              },
            ],
          },
          status: 'published'
        });
        strapi.log.info('[YAHAYASCOOL] ✅ Seeded initial Homepage with 9 dynamic sections.');
      }
    } catch (e: any) {
      strapi.log.error('[YAHAYASCOOL] Error seeding Homepage:', e.message);
    }

    // 2. Seed Contact Info if not exists
    try {
      const existingContact = await strapi.db.query('api::contact-info.contact-info').findMany({ limit: 1 });
      if (existingContact.length === 0) {
        await strapi.documents('api::contact-info.contact-info').create({
          data: {
            address: 'Plot 18, Education District, Islamic Knowledge Avenue, West Africa',
            phone: '+234 (0) 800-YAHAYA-S',
            email: 'admissions@yahayaschool.edu',
            officeHours: 'Monday - Thursday: 7:30 AM - 4:00 PM | Friday: 7:30 AM - 12:30 PM',
            googleMapUrl: 'https://maps.google.com/?q=Yahaya+International+School',
          },
          status: 'published'
        });
        strapi.log.info('[YAHAYASCOOL] ✅ Seeded Contact Info.');
      }
    } catch (e: any) {
      strapi.log.error('[YAHAYASCOOL] Error seeding Contact Info:', e.message);
    }

    // 3. Seed Footer Config if not exists
    try {
      const existingFooter = await strapi.db.query('api::footer-config.footer-config').findMany({ limit: 1 });
      strapi.log.info('[DEBUG] existingFooter: ' + JSON.stringify(existingFooter));
      
      if (existingFooter.length === 0) {
        const createdFooter = await strapi.documents('api::footer-config.footer-config').create({
          data: {
            quickLinks: [
              { title: 'About Us', url: '/about' },
              { title: 'Admissions & Fees', url: '/admissions' },
              { title: 'Online Registration', url: '/online-registration' },
              { title: 'Campus Gallery', url: '/gallery' },
              { title: 'Frequently Asked Questions', url: '/faq' },
            ],
            departmentsColumn: [
              { title: 'Islamic & Qur\'an Department', url: '/departments/islamic-studies' },
              { title: 'Science & Technology', url: '/departments/sciences' },
              { title: 'Languages & Linguistics', url: '/departments/languages' },
              { title: 'Humanities & Commerce', url: '/departments/humanities' },
            ],
            programsColumn: [
              { title: 'Tahfidz Al-Qur\'an (Memorization)', url: '/programs/quran-memorization' },
              { title: 'Advanced Arabic Immersion', url: '/programs/arabic-immersion' },
              { title: 'STEM & Robotics Excellence', url: '/programs/stem-robotics' },
              { title: 'Intensive Summer Academy', url: '/programs/summer-academy' },
            ],
            contactText: 'Empowering future Muslim leaders through holistic Islamic and English education.',
            copyrightText: '© 2026 YAHAYASCOOL — Yahaya International Islamic and English High School. All rights reserved.',
            newsletterHeading: 'Stay Informed',
            newsletterSubheading: 'Receive official school circulars and academic reminders directly.',
          },
          status: 'published'
        });
        strapi.log.info('[YAHAYASCOOL] ✅ Seeded Footer Config. Created: ' + JSON.stringify(createdFooter));
      } else {
        strapi.log.info('[DEBUG] Footer Config already exists, skipping creation.');
      }
    } catch (e: any) {
      strapi.log.error('[YAHAYASCOOL] Error seeding Footer Config:', e.message);
    }

    // 4. Seed Navigation Menus if not exists
    try {
      const existingHeaderMenu = await strapi.db.query('api::navigation-menu.navigation-menu').findMany({ where: { location: 'header' }, limit: 1 });
      if (existingHeaderMenu.length === 0) {
        await strapi.documents('api::navigation-menu.navigation-menu').create({
          data: {
            name: 'Main Navigation Header',
            slug: 'main-header-menu',
            location: 'header',
            items: [
              { title: 'Home', url: '/', order: 1, target: '_self', isVisible: true },
              { title: 'About Us', url: '/about', order: 2, target: '_self', isVisible: true },
              { title: 'Programs', url: '/programs', order: 3, target: '_self', isVisible: true },
              { title: 'Departments', url: '/departments', order: 4, target: '_self', isVisible: true },
              { title: 'Admissions', url: '/admissions', order: 5, target: '_self', isVisible: true },
              { title: 'News & Events', url: '/news', order: 6, target: '_self', isVisible: true },
              { title: 'Donations & Waqf', url: '/donations', order: 7, target: '_self', isVisible: true },
              { title: 'Contact', url: '/contact', order: 8, target: '_self', isVisible: true },
            ],
          },
          status: 'published'
        });
        strapi.log.info('[YAHAYASCOOL] ✅ Seeded Main Header Menu.');
      }
    } catch (e: any) {
      strapi.log.error('[YAHAYASCOOL] Error seeding Header Menu:', e.message);
    }

    // 5. Seed sample Programs if empty
    try {
      const existingPrograms = await strapi.db.query('api::program.program').findMany({ limit: 1 });
      if (existingPrograms.length === 0) {
        await strapi.documents('api::program.program').create({
          data: {
            title: 'Tahfidz Al-Qur\'an & Tajweed Mastery',
            slug: 'quran-memorization',
            description: 'A dedicated, structured 3-year memorization track guiding students to memorize the entire Holy Qur\'an with flawless Tajweed alongside standard high school coursework.',
            duration: '3 Academic Years',
            isFeatured: true,
          },
          status: 'published'
        });
        await strapi.documents('api::program.program').create({
          data: {
            title: 'Advanced Arabic Language & Rhetoric Immersion',
            slug: 'arabic-immersion',
            description: 'Immersive Classical and Modern Standard Arabic curriculum designed to foster fluency, classical text analysis, and eloquence in speech.',
            duration: 'Full High School Track',
            isFeatured: true,
          },
          status: 'published'
        });
        await strapi.documents('api::program.program').create({
          data: {
            title: 'STEM & Robotics Honors Track',
            slug: 'stem-robotics',
            description: 'Rigorous Western science preparation in Physics, Chemistry, Biology, and Advanced Computing, preparing graduates for top global engineering and medical universities.',
            duration: '4 Academic Years',
            isFeatured: true,
          },
          status: 'published'
        });
        strapi.log.info('[YAHAYASCOOL] ✅ Seeded 3 Sample Academic Programs.');
      }
    } catch (e: any) {
      strapi.log.error('[YAHAYASCOOL] Error seeding Programs:', e.message);
    }

    // 6. Seed sample Departments if empty
    try {
      const existingDepts = await strapi.db.query('api::department.department').findMany({ limit: 1 });
      if (existingDepts.length === 0) {
        await strapi.documents('api::department.department').create({
          data: {
            title: 'Faculty of Islamic Sciences & Qur\'an',
            slug: 'islamic-studies',
            headOfDepartment: 'Ustadh Ibrahim Al-Maliki',
            description: '<p>Dedicated to Qur\'anic studies, Hadith, Fiqh, and Islamic Ethics.</p>',
          },
          status: 'published'
        });
        await strapi.documents('api::department.department').create({
          data: {
            title: 'Faculty of Pure & Applied Sciences',
            slug: 'sciences',
            headOfDepartment: 'Dr. Fatima Abdullah',
            description: '<p>Comprising Biology, Chemistry, Physics, and Mathematics laboratories.</p>',
          },
          status: 'published'
        });
        strapi.log.info('[YAHAYASCOOL] ✅ Seeded 2 Sample Departments.');
      }
    } catch (e: any) {
      strapi.log.error('[YAHAYASCOOL] Error seeding Departments:', e.message);
    }
  } catch (error) {
    strapi.log.error('[YAHAYASCOOL] Error seeding sample content:', error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap: Seed Core LMS Foundation Data (Phase 3A)
// ─────────────────────────────────────────────────────────────────────────────

async function seedLmsData(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Checking and seeding LMS Phase 3A Foundation data...');
  try {
    const existingSubjects = await strapi.db.query('api::subject.subject').findMany({ limit: 1 });
    if (existingSubjects.length === 0) {
      const sData = [
        { name: 'Mathematics', code: 'MAT-101', subjectType: 'Core', color: 'blue', icon: 'calculator', defaultWeeklyHours: 5, passingScore: 50, creditValue: 3.0, displayOrder: 1 },
        { name: 'Qur\'an Memorization', code: 'QUR-101', subjectType: 'Core', color: 'emerald', icon: 'book', defaultWeeklyHours: 10, passingScore: 70, creditValue: 4.0, displayOrder: 2 },
        { name: 'Arabic Language', code: 'ARB-101', subjectType: 'Core', color: 'amber', icon: 'languages', defaultWeeklyHours: 6, passingScore: 60, creditValue: 3.0, displayOrder: 3 },
        { name: 'Physics', code: 'PHY-101', subjectType: 'Elective', color: 'purple', icon: 'atom', defaultWeeklyHours: 4, passingScore: 50, creditValue: 3.0, displayOrder: 4 },
        { name: 'Islamic Ethics (Akhlaq)', code: 'AKH-101', subjectType: 'Core', color: 'teal', icon: 'heart', defaultWeeklyHours: 2, passingScore: 50, creditValue: 1.0, displayOrder: 5 }
      ];
      
      for (const s of sData) {
        await strapi.documents('api::subject.subject').create({
          data: {
            ...(s as any),
            activeStatus: true,
          },
          status: 'published'
        });
      }
      strapi.log.info('[YAHAYASCOOL] ✅ Seeded 5 Academic Subjects.');
    }

    const existingClassrooms = await strapi.db.query('api::classroom.classroom').findMany({ limit: 1 });
    if (existingClassrooms.length === 0) {
      const campuses = await strapi.db.query('api::campus.campus').findMany({ limit: 1 });
      const mainCampusId = campuses[0]?.id;

      const cData = [
        { name: 'Al-Khawarizmi Lab', code: 'RM-101', capacity: 30, building: 'Science Block', floor: '1st Floor', roomType: 'Laboratory', resources: { projector: true, smartBoard: true } as any },
        { name: 'Imam Malik Hall', code: 'RM-102', capacity: 50, building: 'Islamic Block', floor: 'Ground Floor', roomType: 'Lecture Room', resources: { projector: false, smartBoard: false, airConditioning: true } as any },
        { name: 'Ibn Sina Computing Center', code: 'RM-103', capacity: 40, building: 'Technology Block', floor: '2nd Floor', roomType: 'Laboratory', resources: { computers: 40, smartBoard: true } as any }
      ];

      for (const c of cData) {
        await strapi.documents('api::classroom.classroom').create({
          data: {
            ...(c as any),
            status: 'Active',
            campus: mainCampusId
          },
          status: 'published'
        });
      }
      strapi.log.info('[YAHAYASCOOL] ✅ Seeded 3 Classrooms.');
    }
  } catch (error) {
    strapi.log.error('[YAHAYASCOOL] Error seeding LMS data:', error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap: Seed Finance Permissions
// ─────────────────────────────────────────────────────────────────────────────

async function seedFinancePermissions(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Seeding Finance permissions...');
  try {
    const knex = strapi.db.connection;
    const roles = await knex('up_roles').select('id', 'type');
    // SECURITY FIX: Only grant finance permissions to authenticated role, NEVER public
    const targetRoles = roles.filter((r: any) => r.type === 'authenticated');
    const financeApis = [
      'finance-accounting-period', 'finance-budget', 'finance-currency', 'finance-exchange-rate', 
      'finance-expense', 'finance-hold', 'finance-invoice', 
      'finance-journal-entry', 'finance-ledger-entry', 'finance-payroll', 
      'finance-receipt', 'finance-scholarship', 'finance-sequence-counter'
    ];
    // SECURITY FIX: Exclude delete from general authenticated permissions
    const actions = ['find', 'findOne', 'create', 'update'];
    const now = new Date();
    const crypto = require('crypto');

    for (const api of financeApis) {
      for (const action of actions) {
        const actionStr = `api::${api}.${api}.${action}`;
        let existing = await knex('up_permissions').where('action', actionStr).first();
        let permId;
        if (!existing) {
          const docId = crypto.randomBytes(12).toString('hex');
          const [result] = await knex('up_permissions').insert({
            document_id: docId,
            action: actionStr,
            created_at: now,
            updated_at: now,
            published_at: now
          }).returning('id');
          permId = typeof result === 'object' ? result.id : result;
          strapi.log.info(`[YAHAYASCOOL] Created permission ${actionStr} (${permId})`);
        } else {
          permId = existing.id;
        }
        for (const role of targetRoles) {
          const linkExist = await knex('up_permissions_role_lnk').where({ permission_id: permId, role_id: role.id }).first();
          if (!linkExist) {
            await knex('up_permissions_role_lnk').insert({ permission_id: permId, role_id: role.id });
          }
        }
      }
    }
    strapi.log.info('[YAHAYASCOOL] ✅ Finance permissions seeded (authenticated only).');
  } catch (error) {
    strapi.log.error('[YAHAYASCOOL] Error seeding Finance permissions:', error);
  }
}

async function reconcileInvoiceBalances(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Running startup invoice settlement reconciliation...');
  try {
    let page = 1;
    const pageSize = 500;
    let receipts: any[] = [];
    let fetchMore = true;

    while (fetchMore) {
      const batch = await strapi.documents('api::finance-receipt.finance-receipt').findMany({
        populate: ['invoice', 'student'],
        pagination: { page, pageSize }
      });
      receipts = receipts.concat(batch);
      if (batch.length < pageSize) {
        fetchMore = false;
      } else {
        page++;
      }
    }
    
    // Group payments by invoice ID
    const paymentsByInvoice: Record<string, number> = {};
    for (const r of receipts) {
      if (r.invoice) {
        const invoiceDocId = r.invoice.documentId || String(r.invoice.id || r.invoice);
        const paymentAmountInInvoiceCurrency = Number(r.paymentAmount || 0) * Number(r.exchangeRateToInvoice || 1);
        paymentsByInvoice[invoiceDocId] = (paymentsByInvoice[invoiceDocId] || 0) + paymentAmountInInvoiceCurrency;
      }
    }

    // Update each invoice
    for (const [invoiceDocId, paidAmount] of Object.entries(paymentsByInvoice)) {
      try {
        const invoice = await strapi.documents('api::finance-invoice.finance-invoice').findOne({
          documentId: invoiceDocId
        });
        if (invoice) {
          const totalAmount = Number(invoice.totalAmount || 0);
          const remainingBalance = Math.max(0, totalAmount - paidAmount);
          let newStatus = invoice.status;
          if (remainingBalance <= 0) {
            newStatus = 'paid';
          } else if (paidAmount > 0) {
            newStatus = 'partially_paid';
          }
          
          await strapi.documents('api::finance-invoice.finance-invoice').update({
            documentId: invoiceDocId,
            data: {
              paidAmount,
              remainingBalance,
              status: newStatus as any
            }
          });
          strapi.log.info(`[YAHAYASCOOL] Reconciled invoice ${invoice.invoiceNumber || invoice.id}: Paid=${paidAmount}, Remaining=${remainingBalance}`);
        }
      } catch (err: any) {
        strapi.log.error(`[YAHAYASCOOL] Failed to reconcile invoice docId ${invoiceDocId}:`, err.message);
      }
    }
  } catch (error: any) {
    strapi.log.error('[YAHAYASCOOL] Error running invoice reconciliation:', error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Strapi Application Entry Point
// ─────────────────────────────────────────────────────────────────────────────

export default {
  /**
   * Register phase — runs before the application is initialized.
   * Safe to register lifecycle hooks here.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    registerUserLifecycles(strapi);
    registerERPLifecycles(strapi);
  },

  /**
   * Bootstrap phase — runs after the application is fully initialized.
   * Safe to interact with the database here (roles seeding, etc.).
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await seedRoles(strapi);
    await seedLocales(strapi);
    await seedPublicPermissions(strapi);
    await seedERPData(strapi);
    await seedSampleContent(strapi);
    await seedLmsData(strapi);
    await seedFinancePermissions(strapi);
    await reconcileInvoiceBalances(strapi);
  },
};

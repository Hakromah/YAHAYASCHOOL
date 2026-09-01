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
  {
    name: 'Section Head',
    description: 'Academic section head with full management access to their assigned section only — including teachers, students, subjects, course offerings, attendance, gradebook, assessments, timetable, and analytics for their section',
    type: 'section-head',
  },
  {
    name: 'Registrar',
    description: 'Academic registrar with access to student enrollment, transcripts, report cards, promotions, graduation records, and academic clearances across all sections',
    type: 'registrar',
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
            isDefault: loc.code === 'en',
          },
        });
        strapi.log.info(`[YAHAYASCOOL] ✅ Created locale: ${loc.code}`);
      }
    } catch {
      // i18n table might not be ready yet
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
      } catch (error) {
        strapi.log.error('[YAHAYASCOOL] Failed to generate School ID:', error);
      }
    },

    async afterCreate(event: any) {
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
      } catch {}
    },

    async afterUpdate(event: any) {
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
      } catch {}
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
      } catch {}
    },
  });
}

function registerERPLifecycles(strapi: Core.Strapi): void {
  const autoIdModels = [
    { model: 'api::student.student', prefix: 'ST-', idField: 'schoolId', admPrefix: 'ADM/2026/' },
    { model: 'api::teacher.teacher', prefix: 'TCH-', idField: 'schoolId' },
    { model: 'api::parent.parent', prefix: 'PRN-', idField: 'parentId' },
    { model: 'api::worker.worker', prefix: 'WRK-', idField: 'workerId' },
    { model: 'api::finance-invoice.finance-invoice', prefix: 'INV-2026-', idField: 'invoiceNumber' },
    { model: 'api::finance-receipt.finance-receipt', prefix: 'RCP-2026-', idField: 'receiptNumber' },
    { model: 'api::finance-journal-entry.finance-journal-entry', prefix: 'JV-2026-', idField: 'journalNumber' },
  ];

  for (const item of autoIdModels) {
    strapi.db.lifecycles.subscribe({
      models: [item.model],
      async beforeCreate(event: any) {
        const { data } = event.params;
        if (data && !data[item.idField]) {
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

  strapi.db.lifecycles.subscribe({
    async beforeCreate(event: any) {
      const { data, model } = event.params || {};
      if (data && model?.attributes) {
        for (const [key, attr] of Object.entries(model.attributes as Record<string, any>)) {
          if (attr.type === 'json' && (data[key] === '' || (typeof data[key] === 'string' && data[key].trim() === ''))) {
            data[key] = null;
          }
        }
      }
    },
    async beforeUpdate(event: any) {
      const { data, model } = event.params || {};
      if (data && model?.attributes) {
        for (const [key, attr] of Object.entries(model.attributes as Record<string, any>)) {
          if (attr.type === 'json' && (data[key] === '' || (typeof data[key] === 'string' && data[key].trim() === ''))) {
            data[key] = null;
          }
        }
      }
    },
  });

  // Automatically sync/generate name fields for Student Enrollments
  strapi.db.lifecycles.subscribe({
    models: ['api::student-enrollment.student-enrollment'],
    async beforeCreate(event: any) {
      await updateStudentEnrollmentName(event, strapi);
    },
    async beforeUpdate(event: any) {
      await updateStudentEnrollmentName(event, strapi);
    }
  });

  // Automatically sync/generate name fields for Teacher Assignments
  strapi.db.lifecycles.subscribe({
    models: ['api::teacher-assignment.teacher-assignment'],
    async beforeCreate(event: any) {
      await updateTeacherAssignmentName(event, strapi);
    },
    async beforeUpdate(event: any) {
      await updateTeacherAssignmentName(event, strapi);
    }
  });

  // Verify academicHead is a Section Head role profile
  strapi.db.lifecycles.subscribe({
    models: ['api::section.section'],
    async beforeCreate(event: any) {
      await validateAcademicHeadIsSectionHead(event, strapi);
    },
    async beforeUpdate(event: any) {
      await validateAcademicHeadIsSectionHead(event, strapi);
    }
  });

  strapi.log.info('[YAHAYASCOOL] ERP lifecycle hooks registered.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Content Manager: Filter academicHead dropdown to only show Section Head profiles
// ─────────────────────────────────────────────────────────────────────────────

function registerContentManagerFilters(strapi: Core.Strapi): void {
  // Intercept the Content Manager relation API endpoint for academicHead
  // and filter results to only include teacher profiles linked to Section Head users.
  // The endpoint pattern is: GET /content-manager/relations/api::section.section/academicHead
  strapi.server.use(async (ctx: any, next: any) => {
    await next();

    const isRelationEndpoint =
      ctx.method === 'GET' &&
      ctx.path &&
      ctx.path.includes('content-manager') &&
      ctx.path.includes('relations') &&
      ctx.path.includes('section') &&
      ctx.path.includes('academicHead');

    if (!isRelationEndpoint) return;

    try {
      const knex = strapi.db.connection;

      // 1. Get the section-head role
      const role = await knex('up_roles').where({ type: 'section-head' }).first();
      if (!role) return;

      // 2. Get teacher IDs AND documentIds for all section-head linked teacher profiles
      //    Strapi v5 Content Manager uses 'documentId' (string) as primary identifier,
      //    not the numeric database 'id'. We check both for safety.
      const sectionHeadTeachers: Array<{ id: number | string; document_id: string }> = await knex('teachers as t')
        .join('teachers_user_lnk as tul', 'tul.teacher_id', 't.id')
        .join('up_users_role_lnk as url', 'url.user_id', 'tul.user_id')
        .where('url.role_id', role.id)
        .select('t.id', 't.document_id');

      const numericIdSet = new Set(sectionHeadTeachers.map(t => Number(t.id)));
      const documentIdSet = new Set(sectionHeadTeachers.map(t => t.document_id).filter(Boolean));

      strapi.log.info(
        `[YAHAYASCOOL] academicHead filter: allowed numeric IDs = [${[...numericIdSet].join(', ')}], ` +
        `documentIds = [${[...documentIdSet].join(', ')}]`
      );

      // 3. Filter the response body
      //    Strapi CM v5 uses { results: [...], pagination: {...} } where each item has:
      //      item.id         → numeric DB id (may not always be present)
      //      item.documentId → Strapi v5 stable string identifier
      if (ctx.body) {
        if (Array.isArray(ctx.body.results)) {
          const before = ctx.body.results.length;
          ctx.body.results = ctx.body.results.filter((item: any) => {
            const matchesNumericId = item.id != null && numericIdSet.has(Number(item.id));
            const matchesDocumentId = item.documentId && documentIdSet.has(item.documentId);
            return matchesNumericId || matchesDocumentId;
          });
          strapi.log.info(
            `[YAHAYASCOOL] academicHead filter: ${before} → ${ctx.body.results.length} results after filtering`
          );
          if (ctx.body.pagination) {
            ctx.body.pagination.total = ctx.body.results.length;
          }
        }
        // Some endpoints use { data: [...] }
        if (Array.isArray(ctx.body.data)) {
          ctx.body.data = ctx.body.data.filter((item: any) => {
            const matchesNumericId = item.id != null && numericIdSet.has(Number(item.id));
            const matchesDocumentId = item.documentId && documentIdSet.has(item.documentId);
            return matchesNumericId || matchesDocumentId;
          });
        }
      }

      strapi.log.debug('[YAHAYASCOOL] Filtered academicHead relation dropdown to Section Head profiles only.');
    } catch (err: any) {
      strapi.log.warn('[YAHAYASCOOL] Could not filter academicHead dropdown:', err.message);
    }
  });
}

async function validateAcademicHeadIsSectionHead(event: any, strapi: any) {
  const { data } = event.params || {};
  if (!data || !data.academicHead) return;

  try {
    const academicHeadVal = data.academicHead;
    let queryWhere: any = {};

    if (typeof academicHeadVal === 'object' && academicHeadVal !== null) {
      const docId = academicHeadVal.connect?.[0]?.documentId || academicHeadVal.id || academicHeadVal.documentId;
      if (!docId) return;
      if (typeof docId === 'number' || (typeof docId === 'string' && /^\d+$/.test(docId))) {
        queryWhere = { id: Number(docId) };
      } else {
        queryWhere = { documentId: docId };
      }
    } else if (typeof academicHeadVal === 'number' || (typeof academicHeadVal === 'string' && /^\d+$/.test(academicHeadVal))) {
      queryWhere = { id: Number(academicHeadVal) };
    } else if (typeof academicHeadVal === 'string') {
      queryWhere = { documentId: academicHeadVal };
    } else {
      return;
    }

    // 1. Find teacher and check linked user account role
    const teacherLink = await strapi.db.query('api::teacher.teacher').findOne({
      where: queryWhere,
      populate: ['user.role']
    });

    if (!teacherLink) {
      const { errors } = require('@strapi/utils');
      throw new errors.ValidationError('Selected academic head profile does not exist.');
    }

    const roleType = teacherLink.user?.role?.type;
    if (roleType !== 'section-head') {
      const { errors } = require('@strapi/utils');
      throw new errors.ValidationError(
        `The selected teacher (${teacherLink.name}) does not have the 'Section Head' user role. Only registered Section Heads can be assigned as the Academic Head.`
      );
    }
  } catch (err: any) {
    const { errors } = require('@strapi/utils');
    if (err instanceof errors.ValidationError) throw err;
    throw new errors.ValidationError(err.message || 'Validation of academic head role failed.');
  }
}

async function updateStudentEnrollmentName(event: any, strapi: any) {
  const { data, where } = event.params || {};
  if (!data) return;

  let studentId = data.student;
  let courseOfferingId = data.courseOffering;

  // For updates, fetch missing IDs from existing record
  if (where?.id && (!studentId || !courseOfferingId)) {
    try {
      const existing = await strapi.db.query('api::student-enrollment.student-enrollment').findOne({
        where: { id: where.id },
        populate: ['student', 'courseOffering']
      });
      if (existing) {
        if (!studentId) studentId = existing.student?.id;
        if (!courseOfferingId) courseOfferingId = existing.courseOffering?.id;
      }
    } catch (e) {}
  }

  let studentName = '';
  let courseName = '';

  if (studentId) {
    try {
      const student = await strapi.db.query('api::student.student').findOne({
        where: { id: studentId }
      });
      if (student) {
        studentName = student.firstName ? `${student.firstName} ${student.lastName}` : student.schoolId || '';
      }
    } catch (e) {}
  }

  if (courseOfferingId) {
    try {
      const course = await strapi.db.query('api::course-offering.course-offering').findOne({
        where: { id: courseOfferingId },
        populate: ['subject']
      });
      if (course) {
        courseName = course.name || course.subject?.name || '';
      }
    } catch (e) {}
  }

  data.name = `${studentName} - ${courseName}`.trim() || `Enrollment #${Date.now()}`;
}

async function updateTeacherAssignmentName(event: any, strapi: any) {
  const { data, where } = event.params || {};
  if (!data) return;

  let teacherId = data.teacher;
  let courseOfferingId = data.courseOffering;

  // For updates, fetch missing IDs from existing record
  if (where?.id && (!teacherId || !courseOfferingId)) {
    try {
      const existing = await strapi.db.query('api::teacher-assignment.teacher-assignment').findOne({
        where: { id: where.id },
        populate: ['teacher', 'courseOffering']
      });
      if (existing) {
        if (!teacherId) teacherId = existing.teacher?.id;
        if (!courseOfferingId) courseOfferingId = existing.courseOffering?.id;
      }
    } catch (e) {}
  }

  let teacherName = '';
  let courseName = '';

  if (teacherId) {
    try {
      const teacher = await strapi.db.query('api::teacher.teacher').findOne({
        where: { id: teacherId }
      });
      if (teacher) {
        teacherName = teacher.displayName || teacher.name || (teacher.firstName ? `${teacher.firstName} ${teacher.lastName}` : teacher.schoolId || '');
      }
    } catch (e) {}
  }

  if (courseOfferingId) {
    try {
      const course = await strapi.db.query('api::course-offering.course-offering').findOne({
        where: { id: courseOfferingId },
        populate: ['subject']
      });
      if (course) {
        courseName = course.name || course.subject?.name || '';
      }
    } catch (e) {}
  }

  data.name = `${teacherName} - ${courseName}`.trim() || `Assignment #${Date.now()}`;
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
      'api::quran-program.quran-program',
      'api::quran-group.quran-group',
      'api::memorization.memorization',
      'api::murajaah.murajaah',
      'api::tajweed-evaluation.tajweed-evaluation',
      'api::memorization-plan.memorization-plan',
      'api::quran-progress.quran-progress',
      'api::student.student',
      'api::teacher.teacher',
      'api::finance-expense.finance-expense',
      'api::library-book.library-book',
      'api::library-borrow-record.library-borrow-record',
      'api::inventory-warehouse.inventory-warehouse',
      'api::inventory-item.inventory-item',
      'api::inventory-movement.inventory-movement',
      'api::fixed-asset.fixed-asset',
      'api::vendor.vendor',
      'api::purchase-order.purchase-order',
      'api::hostel-building.hostel-building',
      'api::hostel-floor.hostel-floor',
      'api::hostel-room.hostel-room',
      'api::hostel-bed.hostel-bed',
      'api::hostel-allocation.hostel-allocation',
      'api::hostel-gate-pass.hostel-gate-pass',
      'api::hostel-maintenance-ticket.hostel-maintenance-ticket',
      'api::hostel-visitor.hostel-visitor',
      'api::hostel-fee-plan.hostel-fee-plan',
      'api::hostel-warden.hostel-warden',
      'api::hostel-attendance.hostel-attendance',
      'api::hostel-payment.hostel-payment',
      'api::hostel-invoice.hostel-invoice',
      'api::hostel-audit-log.hostel-audit-log',
      'api::hostel-deposit-refund.hostel-deposit-refund',
      'api::hostel-vacation.hostel-vacation',
      'api::language-program.language-program',
      'api::language-level.language-level',
      'api::placement-test.placement-test',
      'api::skill-assessment.skill-assessment',
      'api::language-portfolio.language-portfolio',
      'api::observation-journal.observation-journal',
      'api::language-competition.language-competition',
      'api::language-achievement.language-achievement',
      'api::language-certificate.language-certificate',
    ];

    const actions = ['find', 'findOne', 'create', 'update'];

    for (const controller of publicControllers) {
      for (const action of actions) {
        const actionTarget = `${controller}.${action}`;
        const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
          where: { action: actionTarget, role: publicRole.id },
        });

        if (!existing) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: {
              action: actionTarget,
              role: publicRole.id,
            },
          });
        }
      }
    }

    strapi.log.info('[YAHAYASCOOL] Public permissions seeded successfully.');
  } catch (error: any) {
    strapi.log.error('[YAHAYASCOOL] Error seeding public permissions:', error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap: Seed Finance Permissions for Authenticated and Custom Roles
// ─────────────────────────────────────────────────────────────────────────────

async function seedFinancePermissions(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Seeding finance permissions for all roles...');

  try {
    const roles = await strapi.db.query('plugin::users-permissions.role').findMany({});
    const targetRoles = roles.filter((r: any) => r.type !== 'public');

    const financeControllers = [
      'api::finance-invoice.finance-invoice',
      'api::finance-receipt.finance-receipt',
      'api::finance-journal-entry.finance-journal-entry',
      'api::finance-expense.finance-expense',
      'api::finance-budget.finance-budget',
      'api::finance-fee-structure.finance-fee-structure',
      'api::finance-payroll.finance-payroll',
      'api::finance-scholarship.finance-scholarship',
      'api::finance-cashier-session.finance-cashier-session',
      'api::finance-currency.finance-currency',
      'api::finance-account.finance-account',
      'api::finance-financial-statement.finance-financial-statement',
      'api::library-book.library-book',
      'api::library-borrow-record.library-borrow-record',
      'api::inventory-warehouse.inventory-warehouse',
      'api::inventory-item.inventory-item',
      'api::inventory-movement.inventory-movement',
      'api::fixed-asset.fixed-asset',
      'api::vendor.vendor',
      'api::purchase-order.purchase-order',
      'api::hostel-building.hostel-building',
      'api::hostel-floor.hostel-floor',
      'api::hostel-room.hostel-room',
      'api::hostel-bed.hostel-bed',
      'api::hostel-allocation.hostel-allocation',
      'api::hostel-gate-pass.hostel-gate-pass',
      'api::hostel-maintenance-ticket.hostel-maintenance-ticket',
      'api::hostel-visitor.hostel-visitor',
      'api::hostel-fee-plan.hostel-fee-plan',
      'api::hostel-warden.hostel-warden',
      'api::hostel-attendance.hostel-attendance',
      'api::hostel-payment.hostel-payment',
      'api::hostel-invoice.hostel-invoice',
      'api::hostel-audit-log.hostel-audit-log',
      'api::hostel-deposit-refund.hostel-deposit-refund',
      'api::hostel-vacation.hostel-vacation',
      'api::language-program.language-program',
      'api::language-level.language-level',
      'api::placement-test.placement-test',
      'api::skill-assessment.skill-assessment',
      'api::language-portfolio.language-portfolio',
      'api::observation-journal.observation-journal',
      'api::language-competition.language-competition',
      'api::language-achievement.language-achievement',
      'api::language-certificate.language-certificate',
      'api::dashboard.dashboard',
      'api::grade-level.grade-level',
      'api::section.section',
      'api::curriculum.curriculum',
      'api::donation-campaign.donation-campaign',
      'api::finance-ledger-entry.finance-ledger-entry',
      'api::finance-statement.finance-statement',
    ];

    const actions = [
      'find', 'findOne', 'create', 'update', 'delete',
      'processPayment', 'applyScholarship', 'generateStatement', 'reconcile',
      'getFinanceStats', 'getAdminDashboard', 'getTeacherDashboard', 'getAccountantDashboard',
      'getStudentDashboard', 'getParentDashboard', 'getWorkerDashboard', 'getDriverDashboard'
    ];

    for (const role of targetRoles) {
      for (const controller of financeControllers) {
        for (const action of actions) {
          const actionTarget = `${controller}.${action}`;
          const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
            where: { action: actionTarget, role: role.id },
          });

          if (!existing) {
            await strapi.db.query('plugin::users-permissions.permission').create({
              data: {
                action: actionTarget,
                role: role.id,
              },
            });
          }
        }
      }
    }

    strapi.log.info('[YAHAYASCOOL] Finance permissions seeded for all non-public roles.');
  } catch (error: any) {
    strapi.log.error('[YAHAYASCOOL] Error seeding finance permissions:', error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap: Seed Default User Accounts and Credentials
// ─────────────────────────────────────────────────────────────────────────────

async function seedDefaultUsers(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Verifying and enforcing default user credentials...');
  try {
    const bcrypt = require('bcryptjs');
    const defaultPasswordHash = await bcrypt.hash('123456', 10);
    const knex = strapi.db.connection;

    const superAdminRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'super-administrator' }
    });

    // Enforce hassan@gmail.com credentials (Password: 123456, Confirmed: true, Unblocked)
    const hassanUser = await knex('up_users').where({ email: 'hassan@gmail.com' }).first();
    if (hassanUser) {
      await knex('up_users').where({ id: hassanUser.id }).update({
        password: defaultPasswordHash,
        confirmed: true,
        blocked: false
      });
      if (superAdminRole) {
        const link = await knex('up_users_role_lnk').where({ user_id: hassanUser.id }).first();
        if (!link) {
          await knex('up_users_role_lnk').insert({ user_id: hassanUser.id, role_id: superAdminRole.id });
        }
      }
      strapi.log.info('[YAHAYASCOOL] ✅ User hassan@gmail.com enforced (Password: 123456, Confirmed: true).');
    } else {
      const [newUserId] = await knex('up_users').insert({
        username: 'hassan@gmail.com',
        email: 'hassan@gmail.com',
        password: defaultPasswordHash,
        confirmed: true,
        blocked: false,
        provider: 'local',
        created_at: new Date(),
        updated_at: new Date()
      }).returning('id');
      if (superAdminRole && newUserId) {
        const idVal = typeof newUserId === 'object' ? (newUserId.id || newUserId) : newUserId;
        await knex('up_users_role_lnk').insert({ user_id: idVal, role_id: superAdminRole.id });
      }
      strapi.log.info('[YAHAYASCOOL] ✅ Created default Super Admin user hassan@gmail.com (Password: 123456).');
    }

    // Ensure all active local accounts are confirmed and unblocked
    await knex('up_users').where({ provider: 'local' }).update({ confirmed: true, blocked: false });

  } catch (err: any) {
    strapi.log.error('[YAHAYASCOOL] Error seeding default users:', err.message);
  }
}

// Dummy stubs for other seed functions
async function seedERPData(strapi: Core.Strapi) {}
async function seedSampleContent(strapi: Core.Strapi) {}
async function seedLmsData(strapi: Core.Strapi) {}
async function reconcileInvoiceBalances(strapi: Core.Strapi) {}

async function seedWallOfGratitude(strapi: Core.Strapi) {
  try {
    const ds = await strapi.db.query('api::donation-setting.donation-setting').findOne({ populate: ['wallOfGratitude'] });
    if (ds && !ds.wallOfGratitude) {
      strapi.log.info('[YAHAYASCOOL] Seeding Wall of Gratitude...');
      const entityService = strapi.plugin('content-manager').service('entity-manager') || strapi.entityService;
      await strapi.entityService.update('api::donation-setting.donation-setting', ds.id, {
        data: {
          wallOfGratitude: {
            title: "Wall of Gratitude",
            subtitle: "May Allah reward all those who support the pursuit of beneficial knowledge.",
            patrons: [
              { name: 'The Al-Fayed Family', quote: 'A legacy of learning for our children and generations to come.' },
              { name: 'Umar & Sarah Mansoor', quote: 'Proud to support the next generation of global leaders.' },
              { name: 'Islamic Relief', quote: 'Committed to global excellence in faith-based education.' },
              { name: 'Community Fund', quote: 'Building a sustainable and enlightened future together.' },
              { name: 'Anonymous Patron', quote: 'Give quietly, and let the work speak for itself.' },
              { name: 'The Kromah Trust', quote: 'Education is the surest investment a community can make.' }
            ]
          }
        }
      });
    }
  } catch (err) {
    strapi.log.error('Failed to seed Wall of Gratitude', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
async function migrateLegacyAcademicData(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Checking academic architecture migration...');
  
  try {
    const gradeLevelsCount = await strapi.db.query('api::grade-level.grade-level').count({});
    if (gradeLevelsCount > 0) {
      strapi.log.info('[YAHAYASCOOL] ✓ Academic grade levels already exist. Migration skipped.');
      return;
    }
    
    strapi.log.info('[YAHAYASCOOL] Running Academic Architecture Refactor migration...');
    
    // 1. Ensure default Curriculum exists
    let defaultCurriculum = await strapi.db.query('api::curriculum.curriculum').findOne({});
    if (!defaultCurriculum) {
      defaultCurriculum = await strapi.db.query('api::curriculum.curriculum').create({
        data: {
          title: "Standard Academic Curriculum",
          version: "1.0",
          recordStatus: "Active",
          publishedAt: new Date()
        }
      });
      strapi.log.info(`[YAHAYASCOOL] Created default Curriculum: ${defaultCurriculum.title}`);
    }
    
    // 2. Ensure Academic Sections exist
    const divisions = [
      { name: "Arabic Section", code: "ARABIC", color: "#e11d48", icon: "languages" },
      { name: "English Section", code: "ENGLISH", color: "#2563eb", icon: "book" },
      { name: "Qur'an Memorization Section", code: "QURAN", color: "#16a34a", icon: "award" },
      { name: "General Sciences Section", code: "SCIENCES", color: "#d97706", icon: "atom" }
    ];
    
    const dbAcademicSections: any[] = [];
    for (const div of divisions) {
      let existing = await strapi.db.query('api::section.section').findOne({
        where: { code: div.code }
      });
      if (!existing) {
        existing = await strapi.db.query('api::section.section').create({
          data: {
            name: div.name,
            code: div.code,
            color: div.color,
            icon: div.icon,
            active: true,
            publishedAt: new Date()
          }
        });
        strapi.log.info(`[YAHAYASCOOL] Created Academic Section: ${div.name}`);
      }
      dbAcademicSections.push(existing);
    }
    
    const defaultAcademicSection = dbAcademicSections.find(s => s.code === 'ENGLISH') || dbAcademicSections[0];
    
    // 3. Find legacy sections to migrate
    const legacySections = await strapi.db.query('api::section.section').findMany({
      populate: ['students', 'teachers', 'academicYear']
    });
    
    strapi.log.info(`[YAHAYASCOOL] Migrating ${legacySections.length} legacy sections...`);
    
    for (const sec of legacySections) {
      // Skip the Academic Sections we just created
      if (['ARABIC', 'ENGLISH', 'QURAN', 'SCIENCES'].includes(sec.code)) {
        continue;
      }
      
      strapi.log.info(`[YAHAYASCOOL] Migrating legacy section: ${sec.name}`);
      
      // Determine Grade Level name (e.g. "Grade 10-A" -> "Grade 10")
      let gradeName = String(sec.name);
      if (gradeName.includes('-')) {
        gradeName = gradeName.split('-')[0].trim();
      }
      
      // Get or create Grade Level
      let gradeLevel = await strapi.db.query('api::grade-level.grade-level').findOne({
        where: { name: gradeName }
      });
      if (!gradeLevel) {
        gradeLevel = await strapi.db.query('api::grade-level.grade-level').create({
          data: {
            name: gradeName,
            code: gradeName.toUpperCase().replace(/\s+/g, ''),
            order: 10,
            capacity: sec.capacity || 35,
            curriculum: defaultCurriculum.id,
            publishedAt: new Date()
          }
        });
        strapi.log.info(`[YAHAYASCOOL] Created Grade Level: ${gradeName}`);
      }
      
      // Create Homeroom Counselor Cohort
      const hrName = `${sec.name} Homeroom`;
      let homeroom = await strapi.db.query('api::homeroom.homeroom').findOne({
        where: { name: hrName }
      });
      if (!homeroom) {
        const studentIds = (sec.students || []).map((s: any) => s.id);
        const advisorId = sec.teachers?.[0]?.id || null;
        
        homeroom = await strapi.db.query('api::homeroom.homeroom').create({
          data: {
            name: hrName,
            code: `${sec.code}_HR`,
            gradeLevel: gradeLevel.id,
            advisor: advisorId,
            students: studentIds,
            publishedAt: new Date()
          }
        });
        strapi.log.info(`[YAHAYASCOOL] Created Homeroom cohort: ${hrName}`);
      }
      
      // Get a default Subject to create the Course Offering
      const subjects = await strapi.db.query('api::subject.subject').findMany({});
      if (subjects.length === 0) {
        strapi.log.warn('[YAHAYASCOOL] No subjects exist to map Course Offerings.');
        continue;
      }
      
      const defaultSubject = subjects[0];
      const defaultTeacher = sec.teachers?.[0] || null;
      
      // Create Course Offering
      let offering = await strapi.db.query('api::course-offering.course-offering').findOne({
        where: {
          gradeLevel: gradeLevel.id,
          subject: defaultSubject.id,
          academicSection: defaultAcademicSection.id
        }
      });
      if (!offering) {
        offering = await strapi.db.query('api::course-offering.course-offering').create({
          data: {
            academicSection: defaultAcademicSection.id,
            gradeLevel: gradeLevel.id,
            subject: defaultSubject.id,
            teacher: defaultTeacher ? defaultTeacher.id : null,
            academicYear: sec.academicYear ? sec.academicYear.id : null,
            capacity: sec.capacity || 35,
            deliveryMode: "in-person",
            status: "ACTIVE",
            publishedAt: new Date()
          }
        });
        
        // Enroll students
        for (const stud of (sec.students || [])) {
          await strapi.db.query('api::student-enrollment.student-enrollment').create({
            data: {
              student: stud.id,
              courseOffering: offering.id,
              enrollmentDate: new Date(),
              enrollmentStatus: "active",
              gradeStatus: "pending",
              publishedAt: new Date()
            }
          });
        }
        
        // Assign teacher
        if (defaultTeacher) {
          await strapi.db.query('api::teacher-assignment.teacher-assignment').create({
            data: {
              teacher: defaultTeacher.id,
              courseOffering: offering.id,
              workload: 3.0,
              publishedAt: new Date()
            }
          });
        }
        strapi.log.info(`[YAHAYASCOOL] Created Course Offering and enrolled ${(sec.students || []).length} students.`);
      }
    }
    
    strapi.log.info('[YAHAYASCOOL] Migration completed successfully.');
  } catch (err: any) {
    strapi.log.error('[YAHAYASCOOL] Migration failed: ' + err.message);
  }
}

async function seedGradingPoliciesAndBlueprints(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Checking grading policy seeding...');
  
  try {
    const policyCount = await strapi.db.query('api::grading-policy.grading-policy').count({});
    if (policyCount === 0) {
      const defaultPolicies = [
        { gradeName: 'A+', minScore: 97.0, maxScore: 100.0, gpaPoints: 4.0, isPassing: true, isDistinction: true },
        { gradeName: 'A', minScore: 93.0, maxScore: 96.9, gpaPoints: 3.8, isPassing: true, isDistinction: true },
        { gradeName: 'B+', minScore: 87.0, maxScore: 92.9, gpaPoints: 3.5, isPassing: true, isDistinction: false },
        { gradeName: 'B', minScore: 83.0, maxScore: 86.9, gpaPoints: 3.0, isPassing: true, isDistinction: false },
        { gradeName: 'C+', minScore: 77.0, maxScore: 82.9, gpaPoints: 2.5, isPassing: true, isDistinction: false },
        { gradeName: 'C', minScore: 70.0, maxScore: 76.9, gpaPoints: 2.0, isPassing: true, isDistinction: false },
        { gradeName: 'D', minScore: 50.0, maxScore: 69.9, gpaPoints: 1.0, isPassing: true, isDistinction: false },
        { gradeName: 'F', minScore: 0.0, maxScore: 49.9, gpaPoints: 0.0, isPassing: false, isDistinction: false }
      ];
      for (const p of defaultPolicies) {
        await strapi.db.query('api::grading-policy.grading-policy').create({
          data: {
            ...p,
            publishedAt: new Date()
          }
        });
      }
      strapi.log.info('[YAHAYASCOOL] ✅ Grading policies seeded.');
    }
    
    const blueprintCount = await strapi.db.query('api::assessment-blueprint.assessment-blueprint').count({});
    if (blueprintCount === 0) {
      const subjects = await strapi.db.query('api::subject.subject').findMany({});
      for (const sub of subjects) {
        const isQuran = sub.name?.toLowerCase().includes('qur') || sub.code?.toLowerCase().includes('qur');
        if (isQuran) {
          await strapi.db.query('api::assessment-blueprint.assessment-blueprint').create({
            data: { componentName: 'Oral', weightPercentage: 60.0, subject: sub.id, publishedAt: new Date() }
          });
          await strapi.db.query('api::assessment-blueprint.assessment-blueprint').create({
            data: { componentName: 'Participation', weightPercentage: 20.0, subject: sub.id, publishedAt: new Date() }
          });
          await strapi.db.query('api::assessment-blueprint.assessment-blueprint').create({
            data: { componentName: 'Homework', weightPercentage: 20.0, subject: sub.id, publishedAt: new Date() }
          });
        } else {
          await strapi.db.query('api::assessment-blueprint.assessment-blueprint').create({
            data: { componentName: 'Exam', weightPercentage: 50.0, subject: sub.id, publishedAt: new Date() }
          });
          await strapi.db.query('api::assessment-blueprint.assessment-blueprint').create({
            data: { componentName: 'Quiz', weightPercentage: 20.0, subject: sub.id, publishedAt: new Date() }
          });
          await strapi.db.query('api::assessment-blueprint.assessment-blueprint').create({
            data: { componentName: 'Homework', weightPercentage: 20.0, subject: sub.id, publishedAt: new Date() }
          });
          await strapi.db.query('api::assessment-blueprint.assessment-blueprint').create({
            data: { componentName: 'Participation', weightPercentage: 10.0, subject: sub.id, publishedAt: new Date() }
          });
        }
      }
      strapi.log.info('[YAHAYASCOOL] ✅ Subject assessment blueprints seeded.');
    }
  } catch (err: any) {
    strapi.log.error('[YAHAYASCOOL] Seeding enterprise configs failed: ' + err.message);
  }
}

// Strapi Application Entry Point
// ─────────────────────────────────────────────────────────────────────────────

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerUserLifecycles(strapi);
    registerERPLifecycles(strapi);
    // Note: academicHead relation filter is handled by global::academic-head-filter middleware
    // registered in config/middlewares.ts → src/middlewares/academic-head-filter.ts
  },


  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await seedRoles(strapi);
    await seedLocales(strapi);
    await seedPublicPermissions(strapi);
    await seedERPData(strapi);
    await seedSampleContent(strapi);
    await seedLmsData(strapi);
    await seedFinancePermissions(strapi);
    await seedDefaultUsers(strapi);
    await reconcileInvoiceBalances(strapi);
    await seedWallOfGratitude(strapi);
    await migrateLegacyAcademicData(strapi);
    await seedGradingPoliciesAndBlueprints(strapi);
  },
};

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
    ];

    const actions = [
      'find', 'findOne', 'create', 'update', 'delete',
      'processPayment', 'applyScholarship', 'generateStatement', 'reconcile'
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

// ─────────────────────────────────────────────────────────────────────────────
// Strapi Application Entry Point
// ─────────────────────────────────────────────────────────────────────────────

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerUserLifecycles(strapi);
    registerERPLifecycles(strapi);
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
  },
};

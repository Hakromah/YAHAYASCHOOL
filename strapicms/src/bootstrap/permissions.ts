import type { Core } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap: System Roles, Locales, API Permissions, and Default Super Admin
// ─────────────────────────────────────────────────────────────────────────────

const ROLES_TO_SEED = [
  { name: 'Super Administrator', type: 'super-administrator', description: 'Unrestricted access to all system modules and configurations.' },
  { name: 'Director', type: 'director', description: 'Executive academic and operational oversight across all campuses.' },
  { name: 'Account Lead', type: 'account-lead', description: 'Senior financial controller overseeing budgets, audits, and approvals.' },
  { name: 'Accountant', type: 'accountant', description: 'Manages billing, fee collection, payroll, and general ledger entries.' },
  { name: 'Registrar', type: 'registrar', description: 'Manages student admissions, enrollment records, transcripts, and clearance.' },
  { name: 'Section Head', type: 'section-head', description: 'Oversees a specific academic division (e.g., Arabic, English, Hifz).' },
  { name: 'Teacher', type: 'teacher', description: 'Faculty member managing classes, attendance, homework, and gradebooks.' },
  { name: 'Advisor', type: 'advisor', description: 'Provides student counseling, mentorship, and behavioral guidance.' },
  { name: 'Librarian', type: 'librarian', description: 'Manages library catalog, book circulation, and digital resources.' },
  { name: 'Warden', type: 'warden', description: 'Manages hostel buildings, room allocations, gate passes, and discipline.' },
  { name: 'Driver', type: 'driver', description: 'Manages school transport routes, vehicles, and student pickup/drop-off.' },
  { name: 'Worker', type: 'worker', description: 'General support, maintenance, security, and administrative staff.' },
  { name: 'Parent', type: 'parent', description: 'Guardian portal access for viewing child progress, attendance, and invoices.' },
  { name: 'Student', type: 'student', description: 'Student portal access for courses, homework, grades, and Quran progress.' },
];

const LOCALES_TO_SEED = [
  { code: 'en', name: 'English (en)' },
  { code: 'fr', name: 'French (fr)' },
  { code: 'ar', name: 'Arabic (ar)' },
];

export async function seedRoles(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Verifying RBAC roles...');
  for (const roleDef of ROLES_TO_SEED) {
    try {
      const existing = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: roleDef.type },
      });
      if (!existing) {
        await strapi.db.query('plugin::users-permissions.role').create({
          data: roleDef,
        });
        strapi.log.info(`[YAHAYASCOOL] Created role: ${roleDef.name} (${roleDef.type})`);
      }
    } catch (err: any) {
      strapi.log.error(`[YAHAYASCOOL] Error seeding role "${roleDef.name}":`, err.message);
    }
  }
}

export async function seedLocales(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Verifying i18n locales (en, fr, ar)...');
  for (const localeDef of LOCALES_TO_SEED) {
    try {
      const existing = await strapi.db.query('plugin::i18n.locale').findOne({
        where: { code: localeDef.code },
      });
      if (!existing) {
        await strapi.db.query('plugin::i18n.locale').create({
          data: localeDef,
        });
        strapi.log.info(`[YAHAYASCOOL] Created locale: ${localeDef.name}`);
      }
    } catch (err: any) {
      strapi.log.error(`[YAHAYASCOOL] Error seeding locale "${localeDef.code}":`, err.message);
    }
  }
}

export async function seedPublicPermissions(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Seeding public permissions for CMS & Website...');

  try {
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (!publicRole) return;

    const publicControllers = [
      'api::homepage.homepage',
      'api::about-page.about-page',
      'api::login-page.login-page',
      'api::privacy-page.privacy-page',
      'api::page.page',
      'api::program.program',
      'api::department.department',
      'api::school-academic-program.school-academic-program',
      'api::school-academic-programs-page.school-academic-programs-page',
      'api::online-learning-page.online-learning-page',
      'api::online-course.online-course',
      'api::news-page.news-page',
      'api::newsletter-subscriber.newsletter-subscriber',
      'api::event.event',
      'api::announcement.announcement',
      'api::testimonial.testimonial',
      'api::gallery-item.gallery-item',
      'api::faq.faq',
      'api::contact-info.contact-info',
      'api::contact-submission.contact-submission',
      'api::admission-application.admission-application',
      'api::career-position.career-position',
      'api::career-setting.career-setting',
      'api::staff-member.staff-member',
      'api::pursuit-cta.pursuit-cta',
      'api::footer-config.footer-config',
      'api::navigation-menu.navigation-menu',
      'api::donation-campaign.donation-campaign',
      'api::donation-setting.donation-setting',
      'api::school-profile.school-profile',
      'api::academic-certificate.academic-certificate',
      'api::academic-transcript.academic-transcript',
      'api::transcript-version.transcript-version',
    ];

    const existing = await strapi.db.query('plugin::users-permissions.permission').findMany({
      where: { role: publicRole.id },
      select: ['action'],
    });
    const existingSet = new Set((existing || []).map((p: any) => p.action));

    const actions = ['find', 'findOne', 'create'];
    for (const controller of publicControllers) {
      for (const action of actions) {
        const actionTarget = `${controller}.${action}`;
        if (!existingSet.has(actionTarget)) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: { action: actionTarget, role: publicRole.id },
          });
        }
      }
    }
  } catch (error: any) {
    strapi.log.error('[YAHAYASCOOL] Error seeding public permissions:', error.message);
  }
}

export async function seedRolePermissions(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Seeding complete API and user permissions for all non-public roles...');

  try {
    const roles = await strapi.db.query('plugin::users-permissions.role').findMany({});
    const targetRoles = roles.filter((r: any) => r.type !== 'public');

    // Dynamically discover all active API folders in src/api
    const apiDir = path.resolve(__dirname, '..', 'api');
    let apiNames: string[] = [];
    if (fs.existsSync(apiDir)) {
      apiNames = fs.readdirSync(apiDir).filter((f) => {
        try {
          return fs.statSync(path.join(apiDir, f)).isDirectory();
        } catch {
          return false;
        }
      });
    }

    const standardActions = [
      'find', 'findOne', 'create', 'update', 'delete',
      'processPayment', 'applyScholarship', 'generateStatement', 'reconcile',
      'getFinanceStats', 'getAdminDashboard', 'getTeacherDashboard', 'getAccountantDashboard',
      'getStudentDashboard', 'getParentDashboard', 'getWorkerDashboard', 'getDriverDashboard',
      'markAsRead', 'markAllAsRead',
    ];

    const actionTargets: string[] = [];

    for (const apiName of apiNames) {
      for (const act of standardActions) {
        actionTargets.push(`api::${apiName}.${apiName}.${act}`);
      }
    }

    // Users & Permissions plugin actions
    actionTargets.push('plugin::users-permissions.user.me');
    actionTargets.push('plugin::users-permissions.user.find');
    actionTargets.push('plugin::users-permissions.user.findOne');
    actionTargets.push('plugin::users-permissions.user.create');
    actionTargets.push('plugin::users-permissions.user.update');
    actionTargets.push('plugin::users-permissions.user.destroy');
    actionTargets.push('plugin::users-permissions.role.find');
    actionTargets.push('plugin::users-permissions.role.findOne');
    actionTargets.push('plugin::users-permissions.auth.changePassword');

    // Media Upload plugin actions
    actionTargets.push('plugin::upload.content-api.find');
    actionTargets.push('plugin::upload.content-api.findOne');
    actionTargets.push('plugin::upload.content-api.upload');
    actionTargets.push('plugin::upload.content-api.destroy');

    for (const role of targetRoles) {
      const existing = await strapi.db.query('plugin::users-permissions.permission').findMany({
        where: { role: role.id },
        select: ['action'],
      });
      const existingSet = new Set((existing || []).map((p: any) => p.action));
      const missing = actionTargets.filter((a) => !existingSet.has(a));

      if (missing.length > 0) {
        strapi.log.info(`[YAHAYASCOOL] Seeding ${missing.length} missing permissions for role: ${role.name} (${role.type})...`);
        for (const actionTarget of missing) {
          try {
            await strapi.db.query('plugin::users-permissions.permission').create({
              data: { action: actionTarget, role: role.id },
            });
          } catch {}
        }
      }
    }
  } catch (error: any) {
    strapi.log.error('[YAHAYASCOOL] Error seeding role permissions:', error.message);
  }
}

export async function seedDefaultUsers(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Verifying default user accounts...');
  try {
    const bcrypt = require('bcryptjs');
    const defaultPasswordHash = await bcrypt.hash('123456', 10);
    const knex = strapi.db.connection;

    const superAdminRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'super-administrator' },
    });

    const hassanUser = await knex('up_users').where({ email: 'hassan@gmail.com' }).first();
    if (hassanUser) {
      await knex('up_users').where({ id: hassanUser.id }).update({
        password: defaultPasswordHash,
        confirmed: true,
        blocked: false,
      });
      if (superAdminRole) {
        const link = await knex('up_users_role_lnk').where({ user_id: hassanUser.id }).first();
        if (!link) {
          await knex('up_users_role_lnk').insert({ user_id: hassanUser.id, role_id: superAdminRole.id });
        }
      }
    } else {
      const [newUserId] = await knex('up_users')
        .insert({
          username: 'hassan@gmail.com',
          email: 'hassan@gmail.com',
          password: defaultPasswordHash,
          confirmed: true,
          blocked: false,
          provider: 'local',
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('id');
      if (superAdminRole && newUserId) {
        const idVal = typeof newUserId === 'object' ? newUserId.id || newUserId : newUserId;
        await knex('up_users_role_lnk').insert({ user_id: idVal, role_id: superAdminRole.id });
      }
    }

    await knex('up_users').where({ provider: 'local' }).update({ confirmed: true, blocked: false });
  } catch (err: any) {
    strapi.log.error('[YAHAYASCOOL] Error seeding default users:', err.message);
  }
}

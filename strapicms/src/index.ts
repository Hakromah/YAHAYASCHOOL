import type { Core } from '@strapi/strapi';
import { registerUserLifecycles, deduplicateAndSyncAllUsers } from './lifecycles/user-profile-sync';
import { registerERPLifecycles } from './lifecycles/erp-lifecycles';
import {
  seedRoles,
  seedLocales,
  seedPublicPermissions,
  seedRolePermissions,
  seedDefaultUsers,
} from './bootstrap/permissions';
import {
  seedAcademicDefaults,
  seedGradingPoliciesAndBlueprints,
  seedQuranData,
  syncContentManagerMainFields,
} from './bootstrap/erp-seeds';
import { seedWebsiteCMS } from './bootstrap/cms-seeds';

// ─────────────────────────────────────────────────────────────────────────────
// Strapi Application Entry Point
// ─────────────────────────────────────────────────────────────────────────────

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerUserLifecycles(strapi);
    registerERPLifecycles(strapi);
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // 1. Roles, Locales, API Permissions & Default Users
    await seedRoles(strapi);
    await seedLocales(strapi);
    await seedPublicPermissions(strapi);
    await seedRolePermissions(strapi);
    await seedDefaultUsers(strapi);

    // 2. Deduplicate legacy ERP rows & synchronize all User <-> Profile links
    await deduplicateAndSyncAllUsers(strapi);

    // 3. Seed ERP defaults (Curriculum, Sections, Grading Policies, Blueprints, QMS) & sync Admin mainFields
    await seedAcademicDefaults(strapi);
    await seedGradingPoliciesAndBlueprints(strapi);
    await seedQuranData(strapi);
    await syncContentManagerMainFields(strapi);

    // 4. Seed Public Website CMS Pages
    await seedWebsiteCMS(strapi);
  },
};

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
  seedGradingPoliciesAndBlueprints,
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

    // 3. Seed grading defaults & sync Admin display fields
    //    (Academic Sections, Curriculums and Quran Programs/Groups are managed by the administration only)
    await seedGradingPoliciesAndBlueprints(strapi);
    await syncContentManagerMainFields(strapi);

    // 4. Seed Public Website CMS Pages
    await seedWebsiteCMS(strapi);
  },
};

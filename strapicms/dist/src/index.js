"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_profile_sync_1 = require("./lifecycles/user-profile-sync");
const erp_lifecycles_1 = require("./lifecycles/erp-lifecycles");
const permissions_1 = require("./bootstrap/permissions");
const erp_seeds_1 = require("./bootstrap/erp-seeds");
const cms_seeds_1 = require("./bootstrap/cms-seeds");
// ─────────────────────────────────────────────────────────────────────────────
// Strapi Application Entry Point
// ─────────────────────────────────────────────────────────────────────────────
exports.default = {
    register({ strapi }) {
        (0, user_profile_sync_1.registerUserLifecycles)(strapi);
        (0, erp_lifecycles_1.registerERPLifecycles)(strapi);
    },
    async bootstrap({ strapi }) {
        // 1. Roles, Locales, API Permissions & Default Users
        await (0, permissions_1.seedRoles)(strapi);
        await (0, permissions_1.seedLocales)(strapi);
        await (0, permissions_1.seedPublicPermissions)(strapi);
        await (0, permissions_1.seedRolePermissions)(strapi);
        await (0, permissions_1.seedDefaultUsers)(strapi);
        // 2. Deduplicate legacy ERP rows & synchronize all User <-> Profile links
        await (0, user_profile_sync_1.deduplicateAndSyncAllUsers)(strapi);
        // 3. Seed grading defaults & sync Admin display fields
        //    (Academic Sections, Curriculums and Quran Programs/Groups are managed by the administration only)
        await (0, erp_seeds_1.seedGradingPoliciesAndBlueprints)(strapi);
        await (0, erp_seeds_1.syncContentManagerMainFields)(strapi);
        // 4. Seed Public Website CMS Pages
        await (0, cms_seeds_1.seedWebsiteCMS)(strapi);
    },
};

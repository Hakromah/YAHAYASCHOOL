"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncUserProfile = syncUserProfile;
exports.deduplicateAndSyncAllUsers = deduplicateAndSyncAllUsers;
exports.registerUserLifecycles = registerUserLifecycles;
// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle: Bidirectional User <-> Profile (Teacher / Student / Parent / Worker) Synchronization
// Automatically creates and links the corresponding ERP profile whenever a User
// is created or updated in Strapi, and ensures existing users are synced on boot.
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_TO_INITIALS = {
    'super-administrator': 'SA',
    director: 'DR',
    'account-lead': 'AL',
    accountant: 'AC',
    registrar: 'RG',
    'section-head': 'SH',
    teacher: 'TC',
    advisor: 'AD',
    librarian: 'LB',
    warden: 'WD',
    driver: 'DV',
    worker: 'WK',
    parent: 'PR',
    student: 'ST',
    authenticated: 'US',
};
async function syncUserProfile(userId, strapi) {
    var _a, _b, _c, _d, _e, _f;
    try {
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { id: userId },
            populate: ['role', 'avatar', 'teacher', 'student', 'parent', 'worker'],
        });
        if (!user || !user.role)
            return;
        const roleType = (user.role.type || '').toLowerCase();
        const roleName = (user.role.name || '').toLowerCase();
        const firstName = user.firstName || user.username || (user.email ? user.email.split('@')[0] : 'User');
        const lastName = user.lastName || '';
        const fullName = user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || user.email;
        const gender = user.gender === 'female' ? 'female' : 'male';
        // 1. TEACHER / SECTION-HEAD / DIRECTOR
        if (['teacher', 'section-head', 'director'].includes(roleType) ||
            roleName.includes('teacher') ||
            roleName.includes('section head')) {
            const existing = await strapi.db.query('api::teacher.teacher').findOne({
                where: {
                    $or: [
                        { user: user.id },
                        ...(user.email ? [{ email: user.email }] : []),
                        ...(user.schoolId ? [{ schoolId: user.schoolId }] : []),
                    ],
                },
            });
            const schoolId = user.schoolId || (existing === null || existing === void 0 ? void 0 : existing.schoolId) || `TCH-${String(user.id).padStart(3, '0')}`;
            if (!existing) {
                await strapi.db.query('api::teacher.teacher').create({
                    data: {
                        name: fullName,
                        email: user.email,
                        phone: user.phone || null,
                        gender,
                        schoolId,
                        status: 'active',
                        employmentType: 'full-time',
                        joiningDate: new Date().toISOString().split('T')[0],
                        user: user.id,
                        ...(((_a = user.avatar) === null || _a === void 0 ? void 0 : _a.id) ? { photo: user.avatar.id } : {}),
                    },
                });
                strapi.log.info(`[YAHAYASCOOL] Auto-created & linked Teacher profile for User #${user.id} (${user.email})`);
            }
            else {
                await strapi.db.query('api::teacher.teacher').update({
                    where: { id: existing.id },
                    data: {
                        user: user.id,
                        name: existing.name || fullName,
                        email: existing.email || user.email,
                        phone: existing.phone || user.phone || null,
                        schoolId: existing.schoolId || schoolId,
                        ...(((_b = user.avatar) === null || _b === void 0 ? void 0 : _b.id) && !existing.photo ? { photo: user.avatar.id } : {}),
                    },
                });
            }
        }
        // 2. STUDENT
        if (roleType === 'student' || roleName.includes('student')) {
            const existing = await strapi.db.query('api::student.student').findOne({
                where: {
                    $or: [
                        { user: user.id },
                        ...(user.email ? [{ email: user.email }] : []),
                        ...(user.schoolId ? [{ schoolId: user.schoolId }] : []),
                    ],
                },
            });
            const schoolId = user.schoolId || (existing === null || existing === void 0 ? void 0 : existing.schoolId) || `ST-${String(user.id).padStart(3, '0')}`;
            const admissionNumber = (existing === null || existing === void 0 ? void 0 : existing.admissionNumber) || `ADM/2026/${String(user.id).padStart(3, '0')}`;
            if (!existing) {
                await strapi.db.query('api::student.student').create({
                    data: {
                        firstName,
                        lastName: lastName || 'Student',
                        email: user.email,
                        phone: user.phone || null,
                        gender,
                        schoolId,
                        admissionNumber,
                        enrollmentDate: new Date().toISOString().split('T')[0],
                        status: 'active',
                        user: user.id,
                        ...(((_c = user.avatar) === null || _c === void 0 ? void 0 : _c.id) ? { photo: user.avatar.id } : {}),
                    },
                });
                strapi.log.info(`[YAHAYASCOOL] Auto-created & linked Student profile for User #${user.id} (${user.email})`);
            }
            else {
                await strapi.db.query('api::student.student').update({
                    where: { id: existing.id },
                    data: {
                        user: user.id,
                        firstName: existing.firstName || firstName,
                        lastName: existing.lastName || lastName || 'Student',
                        email: existing.email || user.email,
                        phone: existing.phone || user.phone || null,
                        schoolId: existing.schoolId || schoolId,
                        ...(((_d = user.avatar) === null || _d === void 0 ? void 0 : _d.id) && !existing.photo ? { photo: user.avatar.id } : {}),
                    },
                });
            }
        }
        // 3. PARENT
        if (roleType === 'parent' || roleName.includes('parent')) {
            const existing = await strapi.db.query('api::parent.parent').findOne({
                where: {
                    $or: [
                        { user: user.id },
                        ...(user.email ? [{ email: user.email }] : []),
                        ...(user.schoolId ? [{ parentId: user.schoolId }] : []),
                    ],
                },
            });
            const parentId = user.schoolId || (existing === null || existing === void 0 ? void 0 : existing.parentId) || `PRN-${String(user.id).padStart(3, '0')}`;
            if (!existing) {
                await strapi.db.query('api::parent.parent').create({
                    data: {
                        parentId,
                        firstName,
                        lastName: lastName || 'Parent',
                        email: user.email,
                        phone: user.phone || '0000000000',
                        gender,
                        relationshipType: 'Guardian',
                        status: 'Active',
                        user: user.id,
                        ...(((_e = user.avatar) === null || _e === void 0 ? void 0 : _e.id) ? { photo: user.avatar.id } : {}),
                    },
                });
                strapi.log.info(`[YAHAYASCOOL] Auto-created & linked Parent profile for User #${user.id} (${user.email})`);
            }
            else {
                await strapi.db.query('api::parent.parent').update({
                    where: { id: existing.id },
                    data: {
                        user: user.id,
                        email: existing.email || user.email,
                        parentId: existing.parentId || parentId,
                    },
                });
            }
        }
        // 4. WORKER / STAFF
        if (['worker', 'driver', 'warden', 'librarian', 'accountant', 'account-lead', 'registrar', 'advisor'].includes(roleType)) {
            const existing = await strapi.db.query('api::worker.worker').findOne({
                where: {
                    $or: [
                        { user: user.id },
                        ...(user.email ? [{ email: user.email }] : []),
                        ...(user.schoolId ? [{ workerId: user.schoolId }] : []),
                    ],
                },
            });
            const workerId = user.schoolId || (existing === null || existing === void 0 ? void 0 : existing.workerId) || `WRK-${String(user.id).padStart(3, '0')}`;
            if (!existing) {
                await strapi.db.query('api::worker.worker').create({
                    data: {
                        workerId,
                        firstName,
                        lastName: lastName || 'Staff',
                        email: user.email,
                        phone: user.phone || '0000000000',
                        gender: gender === 'female' ? 'Female' : 'Male',
                        status: 'Active',
                        user: user.id,
                        ...(((_f = user.avatar) === null || _f === void 0 ? void 0 : _f.id) ? { photo: user.avatar.id } : {}),
                    },
                });
                strapi.log.info(`[YAHAYASCOOL] Auto-created & linked Worker profile for User #${user.id} (${user.email})`);
            }
            else {
                await strapi.db.query('api::worker.worker').update({
                    where: { id: existing.id },
                    data: {
                        user: user.id,
                        email: existing.email || user.email,
                        workerId: existing.workerId || workerId,
                    },
                });
            }
        }
    }
    catch (err) {
        strapi.log.warn(`[YAHAYASCOOL] syncUserProfile warning for User #${userId}: ${err.message}`);
    }
}
async function deduplicateAndSyncAllUsers(strapi) {
    strapi.log.info('[YAHAYASCOOL] Synchronizing all existing Users with Teacher, Student, Parent, and Worker profiles...');
    try {
        // 1. Clean up any duplicate document_id rows created when draftAndPublish was previously enabled on ERP tables
        const erpTables = ['teachers', 'students', 'parents', 'workers', 'sections', 'academic_years', 'academic_terms'];
        const knex = strapi.db.connection;
        for (const table of erpTables) {
            try {
                const hasTable = await knex.schema.hasTable(table);
                if (!hasTable)
                    continue;
                // Keep the lowest id (or the one with relations) per document_id if duplicates exist
                await knex.raw(`
          DELETE FROM "${table}" a
          USING "${table}" b
          WHERE a.document_id IS NOT NULL
            AND a.document_id = b.document_id
            AND a.id > b.id;
        `);
            }
            catch { }
        }
        // 2. Sync all existing users to their profiles
        const users = await strapi.db.query('plugin::users-permissions.user').findMany({
            populate: ['role'],
        });
        for (const u of users) {
            await syncUserProfile(u.id, strapi);
        }
        strapi.log.info(`[YAHAYASCOOL] Verified profile links for ${users.length} users.`);
    }
    catch (err) {
        strapi.log.warn(`[YAHAYASCOOL] User profile sync notice: ${err.message}`);
    }
}
function registerUserLifecycles(strapi) {
    strapi.db.lifecycles.subscribe({
        models: ['plugin::users-permissions.user'],
        async beforeCreate(event) {
            var _a;
            const { data } = event.params;
            if (data.schoolId)
                return;
            try {
                let initials = 'US';
                if (data.role) {
                    const roleId = typeof data.role === 'object' ? data.role.id : data.role;
                    if (roleId) {
                        const roleRecord = await strapi.db.query('plugin::users-permissions.role').findOne({
                            where: { id: roleId },
                        });
                        if (roleRecord === null || roleRecord === void 0 ? void 0 : roleRecord.type) {
                            initials = (_a = ROLE_TO_INITIALS[roleRecord.type]) !== null && _a !== void 0 ? _a : 'US';
                        }
                    }
                }
                const schoolIdService = strapi.service('api::school-id-sequence.school-id-sequence');
                data.schoolId = await schoolIdService.generateNextId(initials);
            }
            catch (error) {
                strapi.log.error('[YAHAYASCOOL] Failed to generate School ID:', error);
            }
        },
        async afterCreate(event) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            try {
                if ((_a = event.result) === null || _a === void 0 ? void 0 : _a.id) {
                    await syncUserProfile(event.result.id, strapi);
                }
                const auditService = strapi.service('api::audit-log.audit-log');
                await auditService.log({
                    action: 'USER_CREATED',
                    entity: 'plugin::users-permissions.user',
                    entityId: String((_c = (_b = event.result) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : ''),
                    description: `New user created: ${(_e = (_d = event.result) === null || _d === void 0 ? void 0 : _d.username) !== null && _e !== void 0 ? _e : (_f = event.result) === null || _f === void 0 ? void 0 : _f.email}`,
                    metadata: {
                        username: (_g = event.result) === null || _g === void 0 ? void 0 : _g.username,
                        email: (_h = event.result) === null || _h === void 0 ? void 0 : _h.email,
                        schoolId: (_j = event.result) === null || _j === void 0 ? void 0 : _j.schoolId,
                    },
                    severity: 'info',
                });
            }
            catch { }
        },
        async afterUpdate(event) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            try {
                if ((_a = event.result) === null || _a === void 0 ? void 0 : _a.id) {
                    await syncUserProfile(event.result.id, strapi);
                }
                const auditService = strapi.service('api::audit-log.audit-log');
                await auditService.log({
                    action: 'USER_UPDATED',
                    entity: 'plugin::users-permissions.user',
                    entityId: String((_c = (_b = event.result) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : ''),
                    description: `User updated: ${(_e = (_d = event.result) === null || _d === void 0 ? void 0 : _d.username) !== null && _e !== void 0 ? _e : (_f = event.result) === null || _f === void 0 ? void 0 : _f.email}`,
                    metadata: { updatedFields: Object.keys((_h = (_g = event.params) === null || _g === void 0 ? void 0 : _g.data) !== null && _h !== void 0 ? _h : {}) },
                    severity: 'info',
                });
            }
            catch { }
        },
        async afterDelete(event) {
            var _a, _b, _c, _d, _e, _f, _g;
            try {
                const auditService = strapi.service('api::audit-log.audit-log');
                await auditService.log({
                    action: 'USER_DELETED',
                    entity: 'plugin::users-permissions.user',
                    entityId: String((_b = (_a = event.result) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : ''),
                    description: `User deleted: ${(_d = (_c = event.result) === null || _c === void 0 ? void 0 : _c.username) !== null && _d !== void 0 ? _d : (_e = event.result) === null || _e === void 0 ? void 0 : _e.email}`,
                    metadata: {
                        schoolId: (_f = event.result) === null || _f === void 0 ? void 0 : _f.schoolId,
                        username: (_g = event.result) === null || _g === void 0 ? void 0 : _g.username,
                    },
                    severity: 'warning',
                });
            }
            catch { }
        },
    });
}

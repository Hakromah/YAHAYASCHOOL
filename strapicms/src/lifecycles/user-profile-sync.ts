import type { Core } from '@strapi/strapi';

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle: Bidirectional User <-> Profile (Teacher / Student / Parent / Worker) Synchronization
// Automatically creates and links the corresponding ERP profile whenever a User
// is created or updated in Strapi, and ensures existing users are synced on boot.
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_TO_INITIALS: Record<string, string> = {
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

export async function syncUserProfile(userId: number, strapi: any) {
  try {
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: userId },
      populate: ['role', 'avatar', 'teacher', 'student', 'parent', 'worker'],
    });
    if (!user || !user.role) return;

    const roleType = (user.role.type || '').toLowerCase();
    const roleName = (user.role.name || '').toLowerCase();

    const firstName = user.firstName || user.username || (user.email ? user.email.split('@')[0] : 'User');
    const lastName = user.lastName || '';
    const fullName = user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || user.email;
    const gender = user.gender === 'female' ? 'female' : 'male';

    // 1. TEACHER / SECTION-HEAD / DIRECTOR
    if (
      ['teacher', 'section-head', 'director'].includes(roleType) ||
      roleName.includes('teacher') ||
      roleName.includes('section head')
    ) {
      const existing = await strapi.db.query('api::teacher.teacher').findOne({
        where: {
          $or: [
            { user: user.id },
            ...(user.email ? [{ email: user.email }] : []),
            ...(user.schoolId ? [{ schoolId: user.schoolId }] : []),
          ],
        },
      });

      const schoolId = user.schoolId || existing?.schoolId || `TCH-${String(user.id).padStart(3, '0')}`;

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
            ...(user.avatar?.id ? { photo: user.avatar.id } : {}),
          },
        });
        strapi.log.info(`[YAHAYASCOOL] Auto-created & linked Teacher profile for User #${user.id} (${user.email})`);
      } else {
        await strapi.db.query('api::teacher.teacher').update({
          where: { id: existing.id },
          data: {
            user: user.id,
            name: existing.name || fullName,
            email: existing.email || user.email,
            phone: existing.phone || user.phone || null,
            schoolId: existing.schoolId || schoolId,
            ...(user.avatar?.id && !existing.photo ? { photo: user.avatar.id } : {}),
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

      const schoolId = user.schoolId || existing?.schoolId || `ST-${String(user.id).padStart(3, '0')}`;
      const admissionNumber = existing?.admissionNumber || `ADM/2026/${String(user.id).padStart(3, '0')}`;

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
            ...(user.avatar?.id ? { photo: user.avatar.id } : {}),
          },
        });
        strapi.log.info(`[YAHAYASCOOL] Auto-created & linked Student profile for User #${user.id} (${user.email})`);
      } else {
        await strapi.db.query('api::student.student').update({
          where: { id: existing.id },
          data: {
            user: user.id,
            firstName: existing.firstName || firstName,
            lastName: existing.lastName || lastName || 'Student',
            email: existing.email || user.email,
            phone: existing.phone || user.phone || null,
            schoolId: existing.schoolId || schoolId,
            ...(user.avatar?.id && !existing.photo ? { photo: user.avatar.id } : {}),
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

      const parentId = user.schoolId || existing?.parentId || `PRN-${String(user.id).padStart(3, '0')}`;

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
            ...(user.avatar?.id ? { photo: user.avatar.id } : {}),
          },
        });
        strapi.log.info(`[YAHAYASCOOL] Auto-created & linked Parent profile for User #${user.id} (${user.email})`);
      } else {
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

      const workerId = user.schoolId || existing?.workerId || `WRK-${String(user.id).padStart(3, '0')}`;

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
            ...(user.avatar?.id ? { photo: user.avatar.id } : {}),
          },
        });
        strapi.log.info(`[YAHAYASCOOL] Auto-created & linked Worker profile for User #${user.id} (${user.email})`);
      } else {
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
  } catch (err: any) {
    strapi.log.warn(`[YAHAYASCOOL] syncUserProfile warning for User #${userId}: ${err.message}`);
  }
}

export async function deduplicateAndSyncAllUsers(strapi: Core.Strapi): Promise<void> {
  strapi.log.info('[YAHAYASCOOL] Synchronizing all existing Users with Teacher, Student, Parent, and Worker profiles...');
  try {
    // 1. Clean up any duplicate document_id rows created when draftAndPublish was previously enabled on ERP tables
    const erpTables = ['teachers', 'students', 'parents', 'workers', 'sections', 'academic_years', 'academic_terms'];
    const knex = strapi.db.connection;
    for (const table of erpTables) {
      try {
        const hasTable = await knex.schema.hasTable(table);
        if (!hasTable) continue;
        // Keep the lowest id (or the one with relations) per document_id if duplicates exist
        await knex.raw(`
          DELETE FROM "${table}" a
          USING "${table}" b
          WHERE a.document_id IS NOT NULL
            AND a.document_id = b.document_id
            AND a.id > b.id;
        `);
      } catch {}
    }

    // 2. Sync all existing users to their profiles
    const users = await strapi.db.query('plugin::users-permissions.user').findMany({
      populate: ['role'],
    });
    for (const u of users) {
      await syncUserProfile(u.id, strapi);
    }
    strapi.log.info(`[YAHAYASCOOL] Verified profile links for ${users.length} users.`);
  } catch (err: any) {
    strapi.log.warn(`[YAHAYASCOOL] User profile sync notice: ${err.message}`);
  }
}

export function registerUserLifecycles(strapi: Core.Strapi): void {
  strapi.db.lifecycles.subscribe({
    models: ['plugin::users-permissions.user'],

    async beforeCreate(event: any) {
      const { data } = event.params;
      if (data.schoolId) return;

      try {
        let initials = 'US';
        if (data.role) {
          const roleId = typeof data.role === 'object' ? (data.role as { id?: number }).id : data.role;
          if (roleId) {
            const roleRecord = await strapi.db.query('plugin::users-permissions.role').findOne({
              where: { id: roleId },
            });
            if (roleRecord?.type) {
              initials = ROLE_TO_INITIALS[roleRecord.type] ?? 'US';
            }
          }
        }

        const schoolIdService = strapi.service('api::school-id-sequence.school-id-sequence') as {
          generateNextId: (initials: string) => Promise<string>;
        };
        data.schoolId = await schoolIdService.generateNextId(initials);
      } catch (error) {
        strapi.log.error('[YAHAYASCOOL] Failed to generate School ID:', error);
      }
    },

    async afterCreate(event: any) {
      try {
        if (event.result?.id) {
          await syncUserProfile(event.result.id, strapi);
        }
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
        if (event.result?.id) {
          await syncUserProfile(event.result.id, strapi);
        }
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
            schoolId: event.result?.schoolId,
            username: event.result?.username,
          },
          severity: 'warning',
        });
      } catch {}
    },
  });
}

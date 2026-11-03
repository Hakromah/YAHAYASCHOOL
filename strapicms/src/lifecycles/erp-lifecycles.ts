import type { Core } from '@strapi/strapi';

// ─────────────────────────────────────────────────────────────────────────────
// ERP Lifecycles: Auto-ID Generation, JSON Sanitization, Enrollment/Assignment
// Display Names, and Academic Section Head Validation.
// ─────────────────────────────────────────────────────────────────────────────

export function registerERPLifecycles(strapi: Core.Strapi): void {
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

  // Teacher profile beforeCreate: auto-fill from user or auto-link
  strapi.db.lifecycles.subscribe({
    models: ['api::teacher.teacher'],
    async beforeCreate(event: any) {
      const { data } = event.params;
      if (!data) return;
      if (data.user) {
        try {
          const user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { id: data.user },
            populate: ['avatar'],
          });
          if (user) {
            if (!data.name)
              data.name =
                user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;
            if (!data.email) data.email = user.email;
            if (!data.phone && user.phone) data.phone = user.phone;
            if (!data.gender && user.gender) data.gender = user.gender;
            if (!data.schoolId && user.schoolId) data.schoolId = user.schoolId;
            if (!data.photo && user.avatar?.id) data.photo = user.avatar.id;
          }
        } catch {}
      } else if (data.email || data.schoolId) {
        try {
          const user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: {
              $or: [
                ...(data.email ? [{ email: data.email }] : []),
                ...(data.schoolId ? [{ schoolId: data.schoolId }] : []),
              ],
            },
          });
          if (user) {
            data.user = user.id;
          }
        } catch {}
      }
    },
  });

  // Student profile beforeCreate: auto-fill from user or auto-link
  strapi.db.lifecycles.subscribe({
    models: ['api::student.student'],
    async beforeCreate(event: any) {
      const { data } = event.params;
      if (!data) return;
      if (data.user) {
        try {
          const user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { id: data.user },
            populate: ['avatar'],
          });
          if (user) {
            if (!data.firstName) data.firstName = user.firstName || user.username;
            if (!data.lastName) data.lastName = user.lastName || 'Student';
            if (!data.email) data.email = user.email;
            if (!data.phone && user.phone) data.phone = user.phone;
            if (!data.gender && user.gender) data.gender = user.gender;
            if (!data.schoolId && user.schoolId) data.schoolId = user.schoolId;
            if (!data.photo && user.avatar?.id) data.photo = user.avatar.id;
          }
        } catch {}
      } else if (data.email || data.schoolId) {
        try {
          const user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: {
              $or: [
                ...(data.email ? [{ email: data.email }] : []),
                ...(data.schoolId ? [{ schoolId: data.schoolId }] : []),
              ],
            },
          });
          if (user) {
            data.user = user.id;
          }
        } catch {}
      }
    },
  });

  // Global JSON field sanitization across all models
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
    },
  });

  // Automatically sync/generate name fields for Teacher Assignments
  strapi.db.lifecycles.subscribe({
    models: ['api::teacher-assignment.teacher-assignment'],
    async beforeCreate(event: any) {
      await updateTeacherAssignmentName(event, strapi);
    },
    async beforeUpdate(event: any) {
      await updateTeacherAssignmentName(event, strapi);
    },
  });

  // Verify academicHead has a teaching or faculty role
  strapi.db.lifecycles.subscribe({
    models: ['api::section.section'],
    async beforeCreate(event: any) {
      await validateAcademicHeadRole(event, strapi);
    },
    async beforeUpdate(event: any) {
      await validateAcademicHeadRole(event, strapi);
    },
  });

  strapi.log.info('[YAHAYASCOOL] ERP lifecycle hooks registered.');
}

async function validateAcademicHeadRole(event: any, strapi: any) {
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

    const teacherLink = await strapi.db.query('api::teacher.teacher').findOne({
      where: queryWhere,
      populate: ['user.role'],
    });

    if (!teacherLink) return;

    const roleType = teacherLink.user?.role?.type;
    if (roleType && !['section-head', 'teacher', 'director', 'super-administrator', 'authenticated'].includes(roleType)) {
      const { errors } = require('@strapi/utils');
      throw new errors.ValidationError(
        `The selected teacher (${teacherLink.name}) must have a faculty or leadership role.`
      );
    }
  } catch (err: any) {
    const { errors } = require('@strapi/utils');
    if (err instanceof errors.ValidationError) throw err;
    strapi.log.warn('[YAHAYASCOOL] validateAcademicHead error:', err.message);
  }
}

async function updateStudentEnrollmentName(event: any, strapi: any) {
  const { data, where } = event.params || {};
  if (!data) return;

  let studentId = data.student;
  let courseOfferingId = data.courseOffering;

  if (where?.id && (!studentId || !courseOfferingId)) {
    try {
      const existing = await strapi.db.query('api::student-enrollment.student-enrollment').findOne({
        where: { id: where.id },
        populate: ['student', 'courseOffering'],
      });
      if (existing) {
        if (!studentId) studentId = existing.student?.id;
        if (!courseOfferingId) courseOfferingId = existing.courseOffering?.id;
      }
    } catch {}
  }

  let studentName = '';
  let courseName = '';

  if (studentId) {
    try {
      const student = await strapi.db.query('api::student.student').findOne({
        where: { id: studentId },
      });
      if (student) {
        studentName = student.firstName ? `${student.firstName} ${student.lastName}` : student.schoolId || '';
      }
    } catch {}
  }

  if (courseOfferingId) {
    try {
      const course = await strapi.db.query('api::course-offering.course-offering').findOne({
        where: { id: courseOfferingId },
        populate: ['subject'],
      });
      if (course) {
        courseName = course.name || course.subject?.name || '';
      }
    } catch {}
  }

  data.name = `${studentName} - ${courseName}`.trim() || `Enrollment #${Date.now()}`;
}

async function updateTeacherAssignmentName(event: any, strapi: any) {
  const { data, where } = event.params || {};
  if (!data) return;

  let teacherId = data.teacher;
  let courseOfferingId = data.courseOffering;

  if (where?.id && (!teacherId || !courseOfferingId)) {
    try {
      const existing = await strapi.db.query('api::teacher-assignment.teacher-assignment').findOne({
        where: { id: where.id },
        populate: ['teacher', 'courseOffering'],
      });
      if (existing) {
        if (!teacherId) teacherId = existing.teacher?.id;
        if (!courseOfferingId) courseOfferingId = existing.courseOffering?.id;
      }
    } catch {}
  }

  let teacherName = '';
  let courseName = '';

  if (teacherId) {
    try {
      const teacher = await strapi.db.query('api::teacher.teacher').findOne({
        where: { id: teacherId },
      });
      if (teacher) {
        teacherName =
          teacher.displayName ||
          teacher.name ||
          (teacher.firstName ? `${teacher.firstName} ${teacher.lastName}` : teacher.schoolId || '');
      }
    } catch {}
  }

  if (courseOfferingId) {
    try {
      const course = await strapi.db.query('api::course-offering.course-offering').findOne({
        where: { id: courseOfferingId },
        populate: ['subject'],
      });
      if (course) {
        courseName = course.name || course.subject?.name || '';
      }
    } catch {}
  }

  data.name = `${teacherName} - ${courseName}`.trim() || `Assignment #${Date.now()}`;
}

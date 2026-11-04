import type { Core } from '@strapi/strapi';

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap: Grading Policies, Assessment Blueprints & Content Manager display fields
// NOTE: Academic Sections, Curriculums, Quran Programs and Quran Groups are NOT
// seeded. They are created and managed exclusively by the school administration.
// ─────────────────────────────────────────────────────────────────────────────

export async function seedGradingPoliciesAndBlueprints(strapi: Core.Strapi): Promise<void> {
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
        { gradeName: 'F', minScore: 0.0, maxScore: 49.9, gpaPoints: 0.0, isPassing: false, isDistinction: false },
      ];
      for (const p of defaultPolicies) {
        await strapi.db.query('api::grading-policy.grading-policy').create({ data: p });
      }
      strapi.log.info('[YAHAYASCOOL] Grading policies seeded.');
    }

    const blueprintCount = await strapi.db.query('api::assessment-blueprint.assessment-blueprint').count({});
    if (blueprintCount === 0) {
      const subjects = await strapi.db.query('api::subject.subject').findMany({});
      for (const sub of subjects) {
        const isQuran = sub.name?.toLowerCase().includes('qur') || sub.code?.toLowerCase().includes('qur');
        if (isQuran) {
          await strapi.db.query('api::assessment-blueprint.assessment-blueprint').create({
            data: { componentName: 'Oral', weightPercentage: 60.0, subject: sub.id },
          });
          await strapi.db.query('api::assessment-blueprint.assessment-blueprint').create({
            data: { componentName: 'Participation', weightPercentage: 20.0, subject: sub.id },
          });
          await strapi.db.query('api::assessment-blueprint.assessment-blueprint').create({
            data: { componentName: 'Homework', weightPercentage: 20.0, subject: sub.id },
          });
        } else {
          await strapi.db.query('api::assessment-blueprint.assessment-blueprint').create({
            data: { componentName: 'Exam', weightPercentage: 50.0, subject: sub.id },
          });
          await strapi.db.query('api::assessment-blueprint.assessment-blueprint').create({
            data: { componentName: 'Quiz', weightPercentage: 20.0, subject: sub.id },
          });
          await strapi.db.query('api::assessment-blueprint.assessment-blueprint').create({
            data: { componentName: 'Homework', weightPercentage: 20.0, subject: sub.id },
          });
          await strapi.db.query('api::assessment-blueprint.assessment-blueprint').create({
            data: { componentName: 'Participation', weightPercentage: 10.0, subject: sub.id },
          });
        }
      }
      strapi.log.info('[YAHAYASCOOL] Subject assessment blueprints seeded.');
    }
  } catch (err: any) {
    strapi.log.error('[YAHAYASCOOL] Seeding grading policies/blueprints failed: ' + err.message);
  }
}

export async function syncContentManagerMainFields(strapi: Core.Strapi): Promise<void> {
  try {
    const knex = strapi.db.connection;

    // 1. Backfill missing or placeholder names on Course Offerings, Student Enrollments, and Teacher Assignments
    const offerings = await strapi.db.query('api::course-offering.course-offering').findMany({
      populate: ['subject', 'gradeLevel', 'academicSection', 'academicYear'],
    });
    for (const co of offerings) {
      if (!co.name || co.name === '-' || co.name.trim() === '') {
        const parts = [co.subject?.name, co.gradeLevel?.name, co.academicSection?.name].filter(Boolean);
        const newName =
          parts.length > 0
            ? co.academicYear?.name
              ? `${parts.join(' - ')} (${co.academicYear.name})`
              : parts.join(' - ')
            : `Course Offering #${co.id}`;
        await knex('course_offerings').where({ id: co.id }).update({ name: newName });
      }
    }

    const enrollments = await strapi.db.query('api::student-enrollment.student-enrollment').findMany({
      populate: ['student', 'courseOffering'],
    });
    for (const se of enrollments) {
      if (!se.name || se.name === '-' || se.name.trim() === '') {
        const studentLabel =
          [se.student?.firstName, se.student?.lastName].filter(Boolean).join(' ') ||
          se.student?.schoolId ||
          'Student';
        const courseLabel = se.courseOffering?.name || 'Course';
        await knex('student_enrollments')
          .where({ id: se.id })
          .update({ name: `${studentLabel} - ${courseLabel}` });
      }
    }

    const assignments = await strapi.db.query('api::teacher-assignment.teacher-assignment').findMany({
      populate: ['teacher', 'courseOffering'],
    });
    for (const ta of assignments) {
      if (!ta.name || ta.name === '-' || ta.name.trim() === '') {
        const teacherLabel = ta.teacher?.name || ta.teacher?.schoolId || 'Teacher';
        const courseLabel = ta.courseOffering?.name || 'Course';
        await knex('teacher_assignments')
          .where({ id: ta.id })
          .update({ name: `${teacherLabel} - ${courseLabel}` });
      }
    }

    // 2. Ensure Strapi Content Manager displays human-readable mainField for all relations and lists
    const preferredOrder = [
      'name', 'fullName', 'title', 'budgetTitle', 'subjectName',
      'componentName', 'gradeName', 'firstName',
      'invoiceNumber', 'receiptNumber', 'journalNumber', 'voucherNumber',
      'applicationNumber', 'certificateNumber', 'transcriptNumber',
      'routeName', 'buildingName', 'roomNumber', 'code', 'email', 'schoolId',
    ];

    const bestMainFieldByUid: Record<string, string> = {
      'plugin::users-permissions.user': 'username',
      'plugin::users-permissions.role': 'name',
    };

    for (const [uid, ct] of Object.entries(strapi.contentTypes as Record<string, any>)) {
      if (!uid.startsWith('api::')) continue;
      const attrs = ct.attributes || {};
      let chosen = 'documentId';
      for (const cand of preferredOrder) {
        if (attrs[cand] && ['string', 'uid', 'email'].includes(attrs[cand].type)) {
          chosen = cand;
          break;
        }
      }
      bestMainFieldByUid[uid] = chosen;
    }

    const cmRows = await knex('strapi_core_store_settings')
      .where('key', 'like', 'plugin_content_manager_configuration_content_types::api::%')
      .select('id', 'key', 'value');

    for (const row of cmRows) {
      const uid = row.key.replace('plugin_content_manager_configuration_content_types::', '');
      const targetMain = bestMainFieldByUid[uid];
      const ct = (strapi.contentTypes as Record<string, any>)[uid];
      if (!targetMain || !ct) continue;

      let val: any;
      try {
        val = JSON.parse(row.value);
      } catch {
        continue;
      }

      let changed = false;
      if (
        val.settings &&
        ['documentId', 'id', 'schoolId'].includes(val.settings.mainField) &&
        targetMain !== val.settings.mainField
      ) {
        val.settings.mainField = targetMain;
        if (['documentId', 'id', 'schoolId'].includes(val.settings.defaultSortBy)) {
          val.settings.defaultSortBy = targetMain;
        }
        changed = true;
      }

      if (uid === 'api::course-offering.course-offering' && val.layouts) {
        if (Array.isArray(val.layouts.list) && !val.layouts.list.includes('name')) {
          val.layouts.list = ['id', 'name', 'subject', 'gradeLevel', 'academicSection', 'teacher'];
          changed = true;
        }
      }

      const attrs = ct.attributes || {};
      for (const [fieldName, meta] of Object.entries((val.metadatas || {}) as Record<string, any>)) {
        const attrDef = attrs[fieldName];
        if (attrDef?.type === 'relation' && attrDef.target && bestMainFieldByUid[attrDef.target]) {
          const relTargetBest = bestMainFieldByUid[attrDef.target];
          const curEditMain = meta?.edit?.mainField;
          if (curEditMain && curEditMain !== relTargetBest && ['documentId', 'id', 'schoolId'].includes(curEditMain)) {
            meta.edit.mainField = relTargetBest;
            changed = true;
          }
        }
      }

      if (changed) {
        await knex('strapi_core_store_settings')
          .where({ id: row.id })
          .update({ value: JSON.stringify(val) });
      }
    }
  } catch (err: any) {
    strapi.log.warn('[YAHAYASCOOL] Content Manager mainField sync notice: ' + err.message);
  }
}

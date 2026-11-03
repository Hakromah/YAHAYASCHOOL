import type { Core } from '@strapi/strapi';

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap: Academic Defaults, Grading Policies, Assessment Blueprints & Quran Data
// ─────────────────────────────────────────────────────────────────────────────

export async function seedAcademicDefaults(strapi: Core.Strapi): Promise<void> {
  try {
    let defaultCurriculum = await strapi.db.query('api::curriculum.curriculum').findOne({});
    if (!defaultCurriculum) {
      defaultCurriculum = await strapi.db.query('api::curriculum.curriculum').create({
        data: {
          title: 'Standard Academic Curriculum',
          version: '1.0',
          recordStatus: 'Active',
        },
      });
    }

    const divisions = [
      { name: 'Arabic Section', code: 'ARABIC', color: '#e11d48', icon: 'languages' },
      { name: 'English Section', code: 'ENGLISH', color: '#2563eb', icon: 'book' },
      { name: "Qur'an Memorization Section", code: 'QURAN', color: '#16a34a', icon: 'award' },
      { name: 'General Sciences Section', code: 'SCIENCES', color: '#d97706', icon: 'atom' },
    ];

    for (const div of divisions) {
      const existing = await strapi.db.query('api::section.section').findOne({
        where: { code: div.code },
      });
      if (!existing) {
        await strapi.db.query('api::section.section').create({
          data: {
            name: div.name,
            code: div.code,
            color: div.color,
            icon: div.icon,
            active: true,
          },
        });
      }
    }
  } catch (err: any) {
    strapi.log.warn('[YAHAYASCOOL] Academic defaults seed notice: ' + err.message);
  }
}

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

export async function seedQuranData(strapi: Core.Strapi): Promise<void> {
  try {
    const students = await strapi.db.query('api::student.student').findMany({ limit: 10 });
    const teachers = await strapi.db.query('api::teacher.teacher').findMany({ limit: 10 });

    if (students.length === 0 || teachers.length === 0) return;

    const s1 = students[0]?.id;
    const s2 = students[1]?.id || s1;
    const s3 = students[2]?.id || s1;

    const t1 = teachers[0]?.id;
    const t2 = teachers[1]?.id || t1;
    const t3 = teachers[2]?.id || t1;

    const programCount = await strapi.db.query('api::quran-program.quran-program').count({});
    if (programCount === 0) {
      const programs = [
        {
          name: 'Tajweed Mastery & Pronunciation (Tahsin)',
          code: 'PROG-TAHSIN-01',
          description: 'Comprehensive foundation covering Makharij, Sifaat, Ahkam Nun & Mim Sakinah, and Madd elongation rules.',
          durationMonths: 6,
          targetJuz: 1,
          ageGroup: 'All Ages',
          isActive: true,
          teachers: [t1, t2],
          students: [s1, s2, s3],
        },
        {
          name: 'Junior Hifz Intensive (Juz 1 to 5)',
          code: 'PROG-HIFZ-JR',
          description: 'Structured daily memorization and retention for young scholars covering Juz 26 to 30.',
          durationMonths: 12,
          targetJuz: 5,
          ageGroup: '6-12 Years',
          isActive: true,
          teachers: [t2, t3],
          students: [s2, s3],
        },
        {
          name: 'Senior Hifz Program (Juz 1 to 30)',
          code: 'PROG-HIFZ-SR',
          description: 'Full Quran memorization track with Sanad preparation and daily Murajaah.',
          durationMonths: 36,
          targetJuz: 30,
          ageGroup: '12-18 Years',
          isActive: true,
          teachers: [t1, t3],
          students: [s1, s2, s3],
        },
        {
          name: 'Murajaah & Retention Circle',
          code: 'PROG-MURAJ-01',
          description: 'Continuous revision cycle designed for Huffaz to maintain their memorization.',
          durationMonths: 12,
          targetJuz: 30,
          ageGroup: 'Huffaz',
          isActive: true,
          teachers: [t1],
          students: [s1, s3],
        },
        {
          name: "Qira'at & Classical Recitation",
          code: 'PROG-QIRAAT-01',
          description: 'Advanced study of the 10 Minor and Major Recitation Styles with scholarly Sanad.',
          durationMonths: 24,
          targetJuz: 30,
          ageGroup: 'Advanced',
          isActive: true,
          teachers: [t1, t2],
          students: [s1],
        },
      ];

      for (const p of programs) {
        await strapi.db.query('api::quran-program.quran-program').create({ data: p });
      }
    }

    const groupCount = await strapi.db.query('api::quran-group.quran-group').count({});
    if (groupCount <= 2) {
      const dbPrograms = await strapi.db.query('api::quran-program.quran-program').findMany({});
      const progTahsin = dbPrograms.find((p: any) => p.code === 'PROG-TAHSIN-01')?.id || dbPrograms[0]?.id;
      const progJr = dbPrograms.find((p: any) => p.code === 'PROG-HIFZ-JR')?.id || dbPrograms[0]?.id;
      const progSr = dbPrograms.find((p: any) => p.code === 'PROG-HIFZ-SR')?.id || dbPrograms[0]?.id;
      const progMuraj = dbPrograms.find((p: any) => p.code === 'PROG-MURAJ-01')?.id || dbPrograms[0]?.id;

      const groups = [
        {
          name: 'Halaqah Imam Nafi (Advanced Hifz)',
          code: 'GRP-NAFI-01',
          capacity: 15,
          meetingSchedule: 'Mon-Fri 07:30 - 09:30 AM',
          location: 'Main Quran Hall - Pillar 1',
          isActive: true,
          teacher: t1,
          quran_program: progSr,
          students: [s1, s2, s3],
        },
        {
          name: 'Halaqah Imam Asim (Beginner Tahsin)',
          code: 'GRP-ASIM-01',
          capacity: 20,
          meetingSchedule: 'Mon, Wed, Fri 10:00 - 11:30 AM',
          location: 'Tahsin Lab B',
          isActive: true,
          teacher: t2,
          quran_program: progTahsin,
          students: [s1, s2],
        },
        {
          name: 'Halaqah Imam Warsh (Junior Hifz)',
          code: 'GRP-WARSH-01',
          capacity: 12,
          meetingSchedule: 'Mon-Thu 02:00 - 04:00 PM',
          location: 'West Wing Hifz Suite',
          isActive: true,
          teacher: t3,
          quran_program: progJr,
          students: [s2, s3],
        },
        {
          name: 'Halaqah Ibn Kathir (Evening Revision Circle)',
          code: 'GRP-KATHIR-01',
          capacity: 25,
          meetingSchedule: 'Sat-Sun 04:30 - 06:30 PM',
          location: 'Central Musalla',
          isActive: true,
          teacher: t1,
          quran_program: progMuraj,
          students: [s1, s3],
        },
      ];

      for (const g of groups) {
        const exist = await strapi.db.query('api::quran-group.quran-group').findOne({ where: { code: g.code } });
        if (!exist) {
          await strapi.db.query('api::quran-group.quran-group').create({ data: g });
        }
      }
    }
  } catch (err: any) {
    strapi.log.error('[YAHAYASCOOL] Failed to seed Quran data: ' + err.message);
  }
}

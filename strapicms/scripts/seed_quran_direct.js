const { Client } = require('pg');
const crypto = require('crypto');

function genDocId() {
  return crypto.randomBytes(12).toString('hex');
}

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  database: 'yahaya_scool',
  user: 'postgres',
  password: 'postgres18',
});

async function seedQuran() {
  await client.connect();
  console.log('Connected to PostgreSQL database yahaya_scool.');

  // 1. Fetch Students
  const studentsRes = await client.query('SELECT id, first_name, last_name, school_id FROM students ORDER BY id ASC');
  const students = studentsRes.rows;
  console.log(`Found ${students.length} students:`, students.map(s => `[${s.id}] ${s.first_name} ${s.last_name}`));

  // 2. Fetch Teachers
  const teachersRes = await client.query('SELECT id, name, school_id FROM teachers ORDER BY id ASC');
  const teachers = teachersRes.rows;
  console.log(`Found ${teachers.length} teachers:`, teachers.map(t => `[${t.id}] ${t.name}`));

  if (students.length === 0 || teachers.length === 0) {
    console.error('Cannot seed Quran without students and teachers!');
    await client.end();
    return;
  }

  const s1 = students[0].id;
  const s2 = students[1] ? students[1].id : s1;
  const s3 = students[2] ? students[2].id : s1;

  const t1 = teachers[0].id;
  const t2 = teachers[1] ? teachers[1].id : t1;
  const t3 = teachers[2] ? teachers[2].id : t1;

  const now = new Date().toISOString();

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Seed Quran Programs (draft & publish: true => draft row + published row)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Quran Programs ---');
  const programsData = [
    {
      name: 'Tajweed Mastery & Pronunciation (Tahsin)',
      code: 'PROG-TAHSIN-01',
      description: 'Comprehensive foundation covering Makharij (points of articulation), Sifaat (characteristics of letters), Ahkam Nun & Mim Sakinah, and Madd elongation rules with practical oral application.',
      duration_months: 6,
      target_juz: 1,
      age_group: 'All Ages',
      is_active: true,
      teachers: [t1, t2],
      students: [s1, s2, s3],
    },
    {
      name: 'Junior Hifz Intensive (Juz 1 to 5)',
      code: 'PROG-HIFZ-JR',
      description: 'Structured daily memorization and retention for young scholars covering Juz 26 to 30 (Juz Amma, Tabarak, Qadd Sami, Adh-Dhariyat, Al-Ahqaf) with daily sabqi and manzil revision.',
      duration_months: 12,
      target_juz: 5,
      age_group: '6-12 Years',
      is_active: true,
      teachers: [t2, t3],
      students: [s2, s3],
    },
    {
      name: 'Senior Hifz Program (Juz 1 to 30)',
      code: 'PROG-HIFZ-SR',
      description: 'Full Quran memorization track with Sanad preparation, rigorous daily Murajaah (Sabqi & Manzil), and Waqf/Ibtida mastery under qualified Sheikhs.',
      duration_months: 36,
      target_juz: 30,
      age_group: '12-18 Years',
      is_active: true,
      teachers: [t1, t3],
      students: [s1, s2, s3],
    },
    {
      name: 'Murajaah & Retention Circle',
      code: 'PROG-MURAJ-01',
      description: 'Continuous revision cycle designed for Huffaz to maintain their memorization with daily multi-juz test cycles and error tracking.',
      duration_months: 12,
      target_juz: 30,
      age_group: 'Huffaz',
      is_active: true,
      teachers: [t1],
      students: [s1, s3],
    },
    {
      name: "Qira'at & Classical Recitation",
      code: 'PROG-QIRAAT-01',
      description: "Advanced study of the 10 Minor and Major Recitation Styles (Hafs 'an Asim, Warsh 'an Nafi', Qalun, Ad-Duri) with scholarly Sanad.",
      duration_months: 24,
      target_juz: 30,
      age_group: 'Advanced',
      is_active: true,
      teachers: [t1, t2],
      students: [s1],
    },
  ];

  const programIds = {}; // code -> { draftId, pubId, docId }

  for (const p of programsData) {
    const existing = await client.query('SELECT id, document_id, published_at FROM quran_programs WHERE code = $1', [p.code]);
    if (existing.rows.length === 0) {
      const docId = genDocId();
      // Insert draft
      const draftRes = await client.query(`
        INSERT INTO quran_programs (document_id, name, code, description, duration_months, target_juz, age_group, is_active, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, NULL, 'en')
        RETURNING id;
      `, [docId, p.name, p.code, p.description, p.duration_months, p.target_juz, p.age_group, p.is_active, now]);
      const draftId = draftRes.rows[0].id;

      // Insert published
      const pubRes = await client.query(`
        INSERT INTO quran_programs (document_id, name, code, description, duration_months, target_juz, age_group, is_active, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $9, 'en')
        RETURNING id;
      `, [docId, p.name, p.code, p.description, p.duration_months, p.target_juz, p.age_group, p.is_active, now]);
      const pubId = pubRes.rows[0].id;

      // Link teachers & students to both rows
      for (const rowId of [draftId, pubId]) {
        for (let i = 0; i < p.teachers.length; i++) {
          await client.query(`INSERT INTO quran_programs_teachers_lnk (quran_program_id, teacher_id, teacher_ord) VALUES ($1, $2, $3)`, [rowId, p.teachers[i], i + 1]);
        }
        for (let i = 0; i < p.students.length; i++) {
          await client.query(`INSERT INTO quran_programs_students_lnk (quran_program_id, student_id, student_ord) VALUES ($1, $2, $3)`, [rowId, p.students[i], i + 1]);
        }
      }

      programIds[p.code] = { draftId, pubId, docId };
      console.log(`✓ Created Program: ${p.name} (Code: ${p.code}, ID: ${pubId})`);
    } else {
      const pubRow = existing.rows.find(r => r.published_at !== null) || existing.rows[0];
      const draftRow = existing.rows.find(r => r.published_at === null) || existing.rows[0];
      programIds[p.code] = { draftId: draftRow.id, pubId: pubRow.id, docId: pubRow.document_id };
      console.log(`- Program already exists: ${p.name} (Code: ${p.code})`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Seed Quran Groups (draft & publish: true)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Quran Groups ---');
  const groupsData = [
    {
      name: 'Halaqah Imam Nafi (Advanced Hifz)',
      code: 'GRP-NAFI-01',
      capacity: 15,
      meeting_schedule: 'Mon-Fri 07:30 - 09:30 AM',
      location: 'Main Quran Hall - Pillar 1',
      is_active: true,
      teacher_id: t1,
      program_code: 'PROG-HIFZ-SR',
      students: [s1, s2, s3],
    },
    {
      name: 'Halaqah Imam Asim (Beginner Tahsin)',
      code: 'GRP-ASIM-01',
      capacity: 20,
      meeting_schedule: 'Mon, Wed, Fri 10:00 - 11:30 AM',
      location: 'Tahsin Lab B',
      is_active: true,
      teacher_id: t2,
      program_code: 'PROG-TAHSIN-01',
      students: [s1, s2],
    },
    {
      name: 'Halaqah Imam Warsh (Junior Hifz)',
      code: 'GRP-WARSH-01',
      capacity: 12,
      meeting_schedule: 'Mon-Thu 02:00 - 04:00 PM',
      location: 'West Wing Hifz Suite',
      is_active: true,
      teacher_id: t3,
      program_code: 'PROG-HIFZ-JR',
      students: [s2, s3],
    },
    {
      name: 'Halaqah Ibn Kathir (Evening Revision Circle)',
      code: 'GRP-KATHIR-01',
      capacity: 25,
      meeting_schedule: 'Sat-Sun 04:30 - 06:30 PM',
      location: 'Central Musalla',
      is_active: true,
      teacher_id: t1,
      program_code: 'PROG-MURAJ-01',
      students: [s1, s3],
    },
  ];

  const groupIds = {}; // code -> { draftId, pubId, docId }

  for (const g of groupsData) {
    const existing = await client.query('SELECT id, document_id, published_at FROM quran_groups WHERE code = $1', [g.code]);
    if (existing.rows.length === 0) {
      const docId = genDocId();
      const prog = programIds[g.program_code];

      // Draft
      const draftRes = await client.query(`
        INSERT INTO quran_groups (document_id, name, code, capacity, meeting_schedule, location, is_active, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, NULL, 'en')
        RETURNING id;
      `, [docId, g.name, g.code, g.capacity, g.meeting_schedule, g.location, g.is_active, now]);
      const draftId = draftRes.rows[0].id;

      // Published
      const pubRes = await client.query(`
        INSERT INTO quran_groups (document_id, name, code, capacity, meeting_schedule, location, is_active, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $8, 'en')
        RETURNING id;
      `, [docId, g.name, g.code, g.capacity, g.meeting_schedule, g.location, g.is_active, now]);
      const pubId = pubRes.rows[0].id;

      for (const rowId of [draftId, pubId]) {
        // Link teacher
        await client.query(`INSERT INTO quran_groups_teacher_lnk (quran_group_id, teacher_id) VALUES ($1, $2)`, [rowId, g.teacher_id]);
        // Link program
        if (prog) {
          await client.query(`INSERT INTO quran_groups_quran_program_lnk (quran_group_id, quran_program_id, quran_group_ord) VALUES ($1, $2, 1)`, [rowId, prog.pubId]);
        }
        // Link students
        for (let i = 0; i < g.students.length; i++) {
          await client.query(`INSERT INTO quran_groups_students_lnk (quran_group_id, student_id, student_ord) VALUES ($1, $2, $3)`, [rowId, g.students[i], i + 1]);
        }
      }

      groupIds[g.code] = { draftId, pubId, docId };
      console.log(`✓ Created Quran Group: ${g.name} (Code: ${g.code}, ID: ${pubId})`);
    } else {
      const pubRow = existing.rows.find(r => r.published_at !== null) || existing.rows[0];
      const draftRow = existing.rows.find(r => r.published_at === null) || existing.rows[0];
      groupIds[g.code] = { draftId: draftRow.id, pubId: pubRow.id, docId: pubRow.document_id };
      console.log(`- Group already exists: ${g.name} (Code: ${g.code})`);
    }
  }

  const primaryGroup = groupIds['GRP-NAFI-01'] || Object.values(groupIds)[0];
  const primaryProg = programIds['PROG-HIFZ-SR'] || Object.values(programIds)[0];

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Seed Memorization Records (draft & publish: false)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Memorization Records ---');
  const memorizationsData = [
    {
      student_id: s1,
      teacher_id: t1,
      program_code: 'PROG-HIFZ-SR',
      group_code: 'GRP-NAFI-01',
      juz_number: 1,
      surah: 'Al-Baqarah',
      starting_ayah: 1,
      ending_ayah: 25,
      pages_covered: 5.0,
      lines_covered: 75,
      record_type: 'New',
      record_status: 'Completed',
      teacher_notes: 'Flawless retention, pristine articulation of Makharij. Ready to proceed to Ayah 26.',
      date: '2026-10-06',
    },
    {
      student_id: s1,
      teacher_id: t1,
      program_code: 'PROG-HIFZ-SR',
      group_code: 'GRP-NAFI-01',
      juz_number: 1,
      surah: 'Al-Baqarah',
      starting_ayah: 26,
      ending_ayah: 48,
      pages_covered: 4.5,
      lines_covered: 68,
      record_type: 'New',
      record_status: 'Completed',
      teacher_notes: 'Minor slip on Ayah 34 corrected on second repetition. Solid retention.',
      date: '2026-10-07',
    },
    {
      student_id: s2,
      teacher_id: t2,
      program_code: 'PROG-TAHSIN-01',
      group_code: 'GRP-ASIM-01',
      juz_number: 30,
      surah: 'An-Naba',
      starting_ayah: 1,
      ending_ayah: 40,
      pages_covered: 2.0,
      lines_covered: 30,
      record_type: 'Revision',
      record_status: 'Completed',
      teacher_notes: 'Pristine recitation of complete Surah An-Naba with proper Waqf and Ibtida.',
      date: '2026-10-05',
    },
    {
      student_id: s2,
      teacher_id: t2,
      program_code: 'PROG-HIFZ-JR',
      group_code: 'GRP-WARSH-01',
      juz_number: 30,
      surah: "An-Nazi'at",
      starting_ayah: 1,
      ending_ayah: 26,
      pages_covered: 1.5,
      lines_covered: 22,
      record_type: 'New',
      record_status: 'Partially Memorized',
      teacher_notes: 'Needs reinforcement on verses 15-20. Recommended 10x repetitions at home.',
      date: '2026-10-06',
    },
    {
      student_id: s3,
      teacher_id: t3,
      program_code: 'PROG-HIFZ-SR',
      group_code: 'GRP-NAFI-01',
      juz_number: 16,
      surah: 'Maryam',
      starting_ayah: 1,
      ending_ayah: 36,
      pages_covered: 3.5,
      lines_covered: 52,
      record_type: 'New',
      record_status: 'Completed',
      teacher_notes: 'Melodious recitation and deep adherence to elongation rules (Madd).',
      date: '2026-10-06',
    },
    {
      student_id: s3,
      teacher_id: t3,
      program_code: 'PROG-MURAJ-01',
      group_code: 'GRP-KATHIR-01',
      juz_number: 15,
      surah: 'Al-Kahf',
      starting_ayah: 1,
      ending_ayah: 31,
      pages_covered: 4.0,
      lines_covered: 60,
      record_type: 'Revision',
      record_status: 'Completed',
      teacher_notes: 'Quarterly assessment passed with high distinction (98%).',
      date: '2026-10-07',
    },
    {
      student_id: s1,
      teacher_id: t1,
      program_code: 'PROG-HIFZ-SR',
      group_code: 'GRP-NAFI-01',
      juz_number: 22,
      surah: 'Ya-Sin',
      starting_ayah: 1,
      ending_ayah: 40,
      pages_covered: 3.0,
      lines_covered: 45,
      record_type: 'Assessment',
      record_status: 'Completed',
      teacher_notes: 'Passed oral examination board review with high distinction.',
      date: '2026-10-04',
    },
    {
      student_id: s2,
      teacher_id: t2,
      program_code: 'PROG-TAHSIN-01',
      group_code: 'GRP-ASIM-01',
      juz_number: 29,
      surah: 'Al-Mulk',
      starting_ayah: 1,
      ending_ayah: 30,
      pages_covered: 2.5,
      lines_covered: 38,
      record_type: 'Correction',
      record_status: 'Needs Revision',
      teacher_notes: 'Pronunciation of Ghunnah on Ayah 12 requires fine-tuning before sign-off.',
      date: '2026-10-03',
    },
  ];

  for (const m of memorizationsData) {
    const existing = await client.query(
      'SELECT id FROM memorizations WHERE surah = $1 AND starting_ayah = $2 AND date = $3',
      [m.surah, m.starting_ayah, m.date]
    );
    if (existing.rows.length === 0) {
      const docId = genDocId();
      const prog = programIds[m.program_code] || primaryProg;
      const grp = groupIds[m.group_code] || primaryGroup;

      const res = await client.query(`
        INSERT INTO memorizations (document_id, juz_number, surah, starting_ayah, ending_ayah, pages_covered, lines_covered, record_type, record_status, teacher_notes, date, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12, $12, 'en')
        RETURNING id;
      `, [docId, m.juz_number, m.surah, m.starting_ayah, m.ending_ayah, m.pages_covered, m.lines_covered, m.record_type, m.record_status, m.teacher_notes, m.date, now]);
      const memId = res.rows[0].id;

      await client.query(`INSERT INTO memorizations_student_lnk (memorization_id, student_id) VALUES ($1, $2)`, [memId, m.student_id]);
      await client.query(`INSERT INTO memorizations_teacher_lnk (memorization_id, teacher_id) VALUES ($1, $2)`, [memId, m.teacher_id]);
      if (prog) await client.query(`INSERT INTO memorizations_quran_program_lnk (memorization_id, quran_program_id) VALUES ($1, $2)`, [memId, prog.pubId]);
      if (grp) await client.query(`INSERT INTO memorizations_quran_group_lnk (memorization_id, quran_group_id, memorization_ord) VALUES ($1, $2, 1)`, [memId, grp.pubId]);

      console.log(`✓ Created Memorization log: Surah ${m.surah} (${m.starting_ayah}-${m.ending_ayah}) for Student ID ${m.student_id}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Seed Murajaah (Revision) Records (draft & publish: false)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Murajaah Records ---');
  const murajaahsData = [
    {
      student_id: s1,
      teacher_id: t1,
      group_code: 'GRP-NAFI-01',
      assigned_portions: 'Juz 1 (Surah Al-Baqarah Ayah 1 - 141)',
      completed_portions: 'Juz 1 (Full 20 Pages)',
      revision_score: 96.5,
      mistakes_count: 2,
      teacher_notes: 'Solid retention. Two minor hesitation marks on page 14.',
      record_status: 'Completed',
      due_date: '2026-10-07',
      completion_date: '2026-10-07',
    },
    {
      student_id: s2,
      teacher_id: t2,
      group_code: 'GRP-ASIM-01',
      assigned_portions: 'Juz 30 (Surah An-Naba to An-Nas)',
      completed_portions: 'Surah An-Naba to Al-Buruj',
      revision_score: 88.0,
      mistakes_count: 5,
      teacher_notes: 'Short surahs memorized well; longer surahs in Juz 30 need another review cycle.',
      record_status: 'In Progress',
      due_date: '2026-10-10',
      completion_date: null,
    },
    {
      student_id: s3,
      teacher_id: t3,
      group_code: 'GRP-KATHIR-01',
      assigned_portions: 'Juz 15-16 (Al-Isra & Al-Kahf)',
      completed_portions: 'Juz 15-16 Complete',
      revision_score: 99.0,
      mistakes_count: 0,
      teacher_notes: 'Exceptional mastery. Zero hesitations and zero mistakes.',
      record_status: 'Completed',
      due_date: '2026-10-05',
      completion_date: '2026-10-05',
    },
    {
      student_id: s1,
      teacher_id: t1,
      group_code: 'GRP-NAFI-01',
      assigned_portions: 'Juz 2 (Al-Baqarah Ayah 142 - 252)',
      completed_portions: '',
      revision_score: 0,
      mistakes_count: 0,
      teacher_notes: 'Scheduled for upcoming Friday morning recitation circle.',
      record_status: 'Pending',
      due_date: '2026-10-12',
      completion_date: null,
    },
    {
      student_id: s2,
      teacher_id: t2,
      group_code: 'GRP-WARSH-01',
      assigned_portions: 'Juz 29 (Surah Al-Mulk to Al-Mursalat)',
      completed_portions: 'Surah Al-Mulk & Al-Qalam',
      revision_score: 68.0,
      mistakes_count: 8,
      teacher_notes: 'Score below 75% threshold. Retest scheduled for next Monday.',
      record_status: 'Needs Retest',
      due_date: '2026-10-08',
      completion_date: '2026-10-08',
    },
  ];

  for (const mu of murajaahsData) {
    const existing = await client.query('SELECT id FROM murajaahs WHERE assigned_portions = $1 AND due_date = $2', [mu.assigned_portions, mu.due_date]);
    if (existing.rows.length === 0) {
      const docId = genDocId();
      const grp = groupIds[mu.group_code] || primaryGroup;

      const res = await client.query(`
        INSERT INTO murajaahs (document_id, assigned_portions, completed_portions, revision_score, mistakes_count, teacher_notes, record_status, due_date, completion_date, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $10, 'en')
        RETURNING id;
      `, [docId, mu.assigned_portions, mu.completed_portions, mu.revision_score, mu.mistakes_count, mu.teacher_notes, mu.record_status, mu.due_date, mu.completion_date, now]);
      const muId = res.rows[0].id;

      await client.query(`INSERT INTO murajaahs_student_lnk (murajaah_id, student_id) VALUES ($1, $2)`, [muId, mu.student_id]);
      await client.query(`INSERT INTO murajaahs_teacher_lnk (murajaah_id, teacher_id) VALUES ($1, $2)`, [muId, mu.teacher_id]);
      if (grp) await client.query(`INSERT INTO murajaahs_quran_group_lnk (murajaah_id, quran_group_id) VALUES ($1, $2)`, [muId, grp.pubId]);

      console.log(`✓ Created Murajaah record: ${mu.assigned_portions} (${mu.record_status})`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Seed Tajweed Evaluations (draft & publish: true)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Tajweed Evaluations ---');
  const tajweedData = [
    {
      student_id: s1,
      teacher_id: t1,
      makharij: 95,
      sifaat: 92,
      ghunnah: 98,
      madd: 90,
      qalqalah: 94,
      waqf: 96,
      noon_saakin: 97,
      meem_saakin: 95,
      fluency: 93,
      overall_score: 94.4,
      teacher_comments: 'Exemplary understanding of Makharij Al-Huruf and Ahkam Al-Madd. Highly recommended for Ijazah track.',
      evaluation_date: '2026-10-02',
    },
    {
      student_id: s2,
      teacher_id: t2,
      makharij: 84,
      sifaat: 80,
      ghunnah: 88,
      madd: 82,
      qalqalah: 85,
      waqf: 78,
      noon_saakin: 86,
      meem_saakin: 84,
      fluency: 82,
      overall_score: 83.2,
      teacher_comments: 'Good progress in throat letters (Halqiyyah). Continued practice on Waqf and Ibtida advised.',
      evaluation_date: '2026-10-04',
    },
    {
      student_id: s3,
      teacher_id: t3,
      makharij: 98,
      sifaat: 96,
      ghunnah: 99,
      madd: 95,
      qalqalah: 97,
      waqf: 98,
      noon_saakin: 100,
      meem_saakin: 98,
      fluency: 97,
      overall_score: 97.6,
      teacher_comments: 'Masterful recitation with precise timing on Madd Munfasil & Muttasil. Perfect score on Noon Sakinah.',
      evaluation_date: '2026-10-06',
    },
  ];

  for (const te of tajweedData) {
    const existing = await client.query('SELECT id FROM tajweed_evaluations WHERE evaluation_date = $1', [te.evaluation_date]);
    if (existing.rows.length === 0) {
      const docId = genDocId();

      // Draft
      const draftRes = await client.query(`
        INSERT INTO tajweed_evaluations (document_id, makharij, sifaat, ghunnah, madd, qalqalah, waqf, noon_saakin, meem_saakin, fluency, overall_score, teacher_comments, evaluation_date, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14, NULL, 'en')
        RETURNING id;
      `, [docId, te.makharij, te.sifaat, te.ghunnah, te.madd, te.qalqalah, te.waqf, te.noon_saakin, te.meem_saakin, te.fluency, te.overall_score, te.teacher_comments, te.evaluation_date, now]);
      const draftId = draftRes.rows[0].id;

      // Published
      const pubRes = await client.query(`
        INSERT INTO tajweed_evaluations (document_id, makharij, sifaat, ghunnah, madd, qalqalah, waqf, noon_saakin, meem_saakin, fluency, overall_score, teacher_comments, evaluation_date, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14, $14, 'en')
        RETURNING id;
      `, [docId, te.makharij, te.sifaat, te.ghunnah, te.madd, te.qalqalah, te.waqf, te.noon_saakin, te.meem_saakin, te.fluency, te.overall_score, te.teacher_comments, te.evaluation_date, now]);
      const pubId = pubRes.rows[0].id;

      for (const rowId of [draftId, pubId]) {
        await client.query(`INSERT INTO tajweed_evaluations_student_lnk (tajweed_evaluation_id, student_id) VALUES ($1, $2)`, [rowId, te.student_id]);
        await client.query(`INSERT INTO tajweed_evaluations_teacher_lnk (tajweed_evaluation_id, teacher_id) VALUES ($1, $2)`, [rowId, te.teacher_id]);
      }

      console.log(`✓ Created Tajweed Evaluation: Score ${te.overall_score} for Student ID ${te.student_id}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Seed Halaqahs (draft & publish: true)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Halaqahs ---');
  const halaqahsData = [
    {
      topic: 'Ahkam At-Tajweed: Rules of Noon & Meem Mushaddadatain',
      verses_covered: 'Surah Al-Baqarah 1-20',
      corrections: 'Clarified 2-harakah duration for Ghunnah on Noon/Meem with Shaddah.',
      teacher_notes: 'All students demonstrated clear understanding and practical recitation.',
      date: '2026-10-01',
      teacher_id: t1,
      group_code: 'GRP-NAFI-01',
      students: [s1, s2, s3],
    },
    {
      topic: 'Tafsir & Tadabbur: The Parable of the Companions of the Cave',
      verses_covered: 'Surah Al-Kahf 9-26',
      corrections: 'Focus on proper elongation in Madd Lazim Kalimi Muthaqqal.',
      teacher_notes: 'Students actively participated in discussion on youth and steadfast faith.',
      date: '2026-10-03',
      teacher_id: t1,
      group_code: 'GRP-NAFI-01',
      students: [s1, s3],
    },
    {
      topic: 'Oral Retention Board: Juz 30 Speed Recitation with Precision',
      verses_covered: 'Juz 30 (Complete)',
      corrections: 'Adjusted breathing pacing for Surah An-Nazi\'at.',
      teacher_notes: 'Group demonstrated high synergy and retention.',
      date: '2026-10-05',
      teacher_id: t2,
      group_code: 'GRP-ASIM-01',
      students: [s1, s2],
    },
    {
      topic: 'Sifaat Al-Huruf: Distinguishing Hams vs Jahr and Shiddah vs Rakhawah',
      verses_covered: 'Surah Al-Mulk 1-15',
      corrections: 'Corrected air release on letters Ta and Kaf in Sukoon.',
      teacher_notes: 'Hands-on phonetic exercise with acoustic feedback.',
      date: '2026-10-07',
      teacher_id: t3,
      group_code: 'GRP-WARSH-01',
      students: [s2, s3],
    },
  ];

  for (const h of halaqahsData) {
    const existing = await client.query('SELECT id FROM halaqahs WHERE topic = $1 AND date = $2', [h.topic, h.date]);
    if (existing.rows.length === 0) {
      const docId = genDocId();
      const grp = groupIds[h.group_code] || primaryGroup;

      const draftRes = await client.query(`
        INSERT INTO halaqahs (document_id, topic, verses_covered, corrections, teacher_notes, date, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7, NULL, 'en')
        RETURNING id;
      `, [docId, h.topic, h.verses_covered, h.corrections, h.teacher_notes, h.date, now]);
      const draftId = draftRes.rows[0].id;

      const pubRes = await client.query(`
        INSERT INTO halaqahs (document_id, topic, verses_covered, corrections, teacher_notes, date, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $7, 'en')
        RETURNING id;
      `, [docId, h.topic, h.verses_covered, h.corrections, h.teacher_notes, h.date, now]);
      const pubId = pubRes.rows[0].id;

      for (const rowId of [draftId, pubId]) {
        await client.query(`INSERT INTO halaqahs_teacher_lnk (halaqah_id, teacher_id) VALUES ($1, $2)`, [rowId, h.teacher_id]);
        if (grp) await client.query(`INSERT INTO halaqahs_quran_group_lnk (halaqah_id, quran_group_id) VALUES ($1, $2)`, [rowId, grp.pubId]);
        for (let i = 0; i < h.students.length; i++) {
          await client.query(`INSERT INTO halaqahs_students_lnk (halaqah_id, student_id, student_ord) VALUES ($1, $2, $3)`, [rowId, h.students[i], i + 1]);
        }
      }

      console.log(`✓ Created Halaqah session: ${h.topic}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Seed Quran Achievements (draft & publish: true)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Quran Achievements ---');
  const achievementsData = [
    {
      student_id: s1,
      title: 'Juz 30 (Juz Amma) Completion Distinction',
      description: 'Successfully memorized and recited the complete 30th Juz in a single sitting with Tajweed certification.',
      date_earned: '2026-09-15',
    },
    {
      student_id: s1,
      title: 'Perfect Tajweed Accuracy Badge',
      description: 'Attained a 95%+ score across all phonetic categories during the institutional Tajweed evaluation.',
      date_earned: '2026-10-02',
    },
    {
      student_id: s3,
      title: 'Consistent 30-Day Murajaah Streak',
      description: 'Completed daily revision without missing a single scheduled portion for 30 consecutive calendar days.',
      date_earned: '2026-10-01',
    },
    {
      student_id: s3,
      title: 'Top Reciter of the Month - October 2026',
      description: 'Awarded for exceptional vocal melodiousness, proper Waqf technique, and high spiritual discipline.',
      date_earned: '2026-10-05',
    },
    {
      student_id: s2,
      title: '500 Verses Memorized Milestone',
      description: 'Crossed the milestone of 500 cumulative memorized verses in the Senior Tahfidz Track.',
      date_earned: '2026-09-28',
    },
  ];

  for (const ach of achievementsData) {
    const existing = await client.query('SELECT id FROM quran_achievements WHERE title = $1', [ach.title]);
    if (existing.rows.length === 0) {
      const docId = genDocId();

      const draftRes = await client.query(`
        INSERT INTO quran_achievements (document_id, title, description, date_earned, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $5, NULL, 'en')
        RETURNING id;
      `, [docId, ach.title, ach.description, ach.date_earned, now]);
      const draftId = draftRes.rows[0].id;

      const pubRes = await client.query(`
        INSERT INTO quran_achievements (document_id, title, description, date_earned, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $5, $5, 'en')
        RETURNING id;
      `, [docId, ach.title, ach.description, ach.date_earned, now]);
      const pubId = pubRes.rows[0].id;

      for (const rowId of [draftId, pubId]) {
        await client.query(`INSERT INTO quran_achievements_student_lnk (quran_achievement_id, student_id) VALUES ($1, $2)`, [rowId, ach.student_id]);
      }

      console.log(`✓ Created Achievement Badge: ${ach.title}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Seed Quran Certificates (draft & publish: false)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Quran Certificates ---');
  const certificatesData = [
    {
      student_id: s1,
      program_code: 'PROG-HIFZ-JR',
      type: 'Juz Completion',
      issue_date: '2026-09-20',
      record_status: 'Issued',
      certificate_url: 'https://yahayaschool.org/certificates/quran/CERT-JUZ30-001.pdf',
    },
    {
      student_id: s3,
      program_code: 'PROG-TAHSIN-01',
      type: 'Outstanding Tajweed',
      issue_date: '2026-10-02',
      record_status: 'Issued',
      certificate_url: 'https://yahayaschool.org/certificates/quran/CERT-TAJ-002.pdf',
    },
    {
      student_id: s2,
      program_code: 'PROG-HIFZ-JR',
      type: 'Excellent Memorization',
      issue_date: '2026-10-05',
      record_status: 'Draft',
      certificate_url: 'https://yahayaschool.org/certificates/quran/CERT-MEM-003.pdf',
    },
    {
      student_id: s1,
      program_code: 'PROG-HIFZ-SR',
      type: 'Competition Winner',
      issue_date: '2026-08-30',
      record_status: 'Issued',
      certificate_url: 'https://yahayaschool.org/certificates/quran/CERT-COMP-004.pdf',
    },
  ];

  for (const cert of certificatesData) {
    const existing = await client.query('SELECT id FROM quran_certificates WHERE type = $1 AND issue_date = $2', [cert.type, cert.issue_date]);
    if (existing.rows.length === 0) {
      const docId = genDocId();
      const prog = programIds[cert.program_code] || primaryProg;

      const res = await client.query(`
        INSERT INTO quran_certificates (document_id, type, issue_date, record_status, certificate_url, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $6, $6, 'en')
        RETURNING id;
      `, [docId, cert.type, cert.issue_date, cert.record_status, cert.certificate_url, now]);
      const certId = res.rows[0].id;

      await client.query(`INSERT INTO quran_certificates_student_lnk (quran_certificate_id, student_id) VALUES ($1, $2)`, [certId, cert.student_id]);
      if (prog) await client.query(`INSERT INTO quran_certificates_quran_program_lnk (quran_certificate_id, quran_program_id) VALUES ($1, $2)`, [certId, prog.pubId]);

      console.log(`✓ Created Certificate: ${cert.type} for Student ID ${cert.student_id}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. Seed Quran Competitions (draft & publish: true)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Quran Competitions ---');
  const competitionsData = [
    {
      name: 'Annual National Ramadan Quran Championship 2026',
      category: 'Full Quran Recitation & Tajweed',
      date: '2026-04-10',
      judges: 'Sheikh Amadou Kromah, Sheikh Dr. Bilal Ismail, Sheikh Mahmud Al-Banna',
      ranking: 1,
      awards: 'Gold Trophy, $1,500 Scholarship Grant & Umrah Trip',
      students: [s1, s3],
    },
    {
      name: 'Inter-School Tahfidz & Tartil Contest',
      category: '10 Juz Category (Ages 12-16)',
      date: '2026-08-15',
      judges: 'Sheikh Ansoumane, Ustadha Aisha Camara',
      ranking: 2,
      awards: 'Silver Medal & $500 Learning Voucher',
      students: [s2, s3],
    },
    {
      name: 'Yahaya School Youth Voice of the Quran 2026',
      category: 'Beautiful Recitation (Maqamat & Tajweed)',
      date: '2026-10-01',
      judges: 'Sheikh Amadou Kromah, Ustadz Ahmet',
      ranking: 1,
      awards: 'First Place Trophy & Islamic Encyclopedia Set',
      students: [s1, s2, s3],
    },
  ];

  for (const comp of competitionsData) {
    const existing = await client.query('SELECT id FROM quran_competitions WHERE name = $1', [comp.name]);
    if (existing.rows.length === 0) {
      const docId = genDocId();

      const draftRes = await client.query(`
        INSERT INTO quran_competitions (document_id, name, category, date, judges, ranking, awards, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, NULL, 'en')
        RETURNING id;
      `, [docId, comp.name, comp.category, comp.date, comp.judges, comp.ranking, comp.awards, now]);
      const draftId = draftRes.rows[0].id;

      const pubRes = await client.query(`
        INSERT INTO quran_competitions (document_id, name, category, date, judges, ranking, awards, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $8, 'en')
        RETURNING id;
      `, [docId, comp.name, comp.category, comp.date, comp.judges, comp.ranking, comp.awards, now]);
      const pubId = pubRes.rows[0].id;

      for (const rowId of [draftId, pubId]) {
        for (let i = 0; i < comp.students.length; i++) {
          await client.query(`INSERT INTO quran_competitions_students_lnk (quran_competition_id, student_id, student_ord) VALUES ($1, $2, $3)`, [rowId, comp.students[i], i + 1]);
        }
      }

      console.log(`✓ Created Competition: ${comp.name}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. Seed Quran Attendances (draft & publish: false)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Quran Attendances ---');
  const attendancesData = [
    {
      student_id: s1,
      teacher_id: t1,
      group_code: 'GRP-NAFI-01',
      date: '2026-10-07',
      record_status: 'Present',
      arrival_time: '07:25:00',
      departure_time: '09:35:00',
      recitation_status: 'Excellent',
      participation_score: 98,
      remarks: 'Prompt arrival, participated actively in opening Duas and completed full assigned quarter.',
    },
    {
      student_id: s2,
      teacher_id: t1,
      group_code: 'GRP-NAFI-01',
      date: '2026-10-07',
      record_status: 'Present',
      arrival_time: '07:30:00',
      departure_time: '09:30:00',
      recitation_status: 'Good',
      participation_score: 92,
      remarks: 'Attentive during peer review session.',
    },
    {
      student_id: s3,
      teacher_id: t1,
      group_code: 'GRP-NAFI-01',
      date: '2026-10-07',
      record_status: 'Late',
      arrival_time: '07:55:00',
      departure_time: '09:30:00',
      late_reason: 'Morning school bus transit traffic delay',
      recitation_status: 'Good',
      participation_score: 85,
      remarks: 'Caught up with recitation portion after class.',
    },
    {
      student_id: s1,
      teacher_id: t1,
      group_code: 'GRP-NAFI-01',
      date: '2026-10-06',
      record_status: 'Present',
      arrival_time: '07:28:00',
      departure_time: '09:30:00',
      recitation_status: 'Outstanding',
      participation_score: 100,
      remarks: 'Recited without a single hesitation.',
    },
    {
      student_id: s2,
      teacher_id: t1,
      group_code: 'GRP-NAFI-01',
      date: '2026-10-06',
      record_status: 'Excused',
      arrival_time: null,
      departure_time: null,
      late_reason: 'Medical clinic appointment',
      recitation_status: 'Excused',
      participation_score: 0,
      remarks: 'Doctor note received and approved.',
    },
    {
      student_id: s3,
      teacher_id: t1,
      group_code: 'GRP-NAFI-01',
      date: '2026-10-06',
      record_status: 'Present',
      arrival_time: '07:29:00',
      departure_time: '09:30:00',
      recitation_status: 'Excellent',
      participation_score: 95,
      remarks: 'Mastered the assigned Tajweed verses.',
    },
  ];

  for (const att of attendancesData) {
    const existing = await client.query('SELECT id FROM quran_attendances WHERE student_id = $1 AND date = $2', [att.student_id, att.date]).catch(() => ({ rows: [] }));
    const docId = genDocId();
    const grp = groupIds[att.group_code] || primaryGroup;

    const res = await client.query(`
      INSERT INTO quran_attendances (document_id, date, record_status, arrival_time, departure_time, late_reason, recitation_status, participation_score, remarks, created_at, updated_at, published_at, locale)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $10, 'en')
      RETURNING id;
    `, [docId, att.date, att.record_status, att.arrival_time, att.departure_time, att.late_reason, att.recitation_status, att.participation_score, att.remarks, now]);
    const attId = res.rows[0].id;

    await client.query(`INSERT INTO quran_attendances_student_lnk (quran_attendance_id, student_id) VALUES ($1, $2)`, [attId, att.student_id]);
    await client.query(`INSERT INTO quran_attendances_teacher_lnk (quran_attendance_id, teacher_id) VALUES ($1, $2)`, [attId, att.teacher_id]);
    if (grp) await client.query(`INSERT INTO quran_attendances_quran_group_lnk (quran_attendance_id, quran_group_id) VALUES ($1, $2)`, [attId, grp.pubId]);

    console.log(`✓ Created Attendance log: Date ${att.date}, Student ID ${att.student_id} (${att.record_status})`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. Seed Dawah Activities (draft & publish: true)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Dawah Activities ---');
  const dawahData = [
    {
      title: 'Friday Community Quran & Youth Halal Circle',
      description: 'Senior Hifz scholars led a public recitation and translation circle for local youth and neighborhood families, sharing insights from Surah Al-Kahf.',
      location: 'Sinkor Community Cultural Centre',
      date: '2026-10-02',
      teacher_id: t1,
      students: [s1, s2, s3],
    },
    {
      title: 'Quranic Literacy Outreach for Orphans & Underprivileged Youth',
      description: 'Weekend instructional workshop providing free Arabic alphabet workbooks, Tajweed flashcards, and basic recitation lessons to 45 children.',
      location: 'Monrovia Hope Orphanage Hall',
      date: '2026-09-25',
      teacher_id: t2,
      students: [s1, s3],
    },
    {
      title: 'Interfaith Dialogue & Values of Compassion in the Quran',
      description: 'Academic presentation and interactive Q&A session presenting Islamic universal values of mercy, environmental stewardship, and neighborly benevolence.',
      location: 'University District Public Auditorium',
      date: '2026-10-05',
      teacher_id: t1,
      students: [s1, s2],
    },
  ];

  for (const d of dawahData) {
    const existing = await client.query('SELECT id FROM dawah_activities WHERE title = $1', [d.title]);
    if (existing.rows.length === 0) {
      const docId = genDocId();

      const draftRes = await client.query(`
        INSERT INTO dawah_activities (document_id, title, description, location, date, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $6, NULL, 'en')
        RETURNING id;
      `, [docId, d.title, d.description, d.location, d.date, now]);
      const draftId = draftRes.rows[0].id;

      const pubRes = await client.query(`
        INSERT INTO dawah_activities (document_id, title, description, location, date, created_at, updated_at, published_at, locale)
        VALUES ($1, $2, $3, $4, $5, $6, $6, $6, 'en')
        RETURNING id;
      `, [docId, d.title, d.description, d.location, d.date, now]);
      const pubId = pubRes.rows[0].id;

      for (const rowId of [draftId, pubId]) {
        await client.query(`INSERT INTO dawah_activities_teacher_lnk (dawah_activity_id, teacher_id) VALUES ($1, $2)`, [rowId, d.teacher_id]);
        for (let i = 0; i < d.students.length; i++) {
          await client.query(`INSERT INTO dawah_activities_students_lnk (dawah_activity_id, student_id, student_ord) VALUES ($1, $2, $3)`, [rowId, d.students[i], i + 1]);
        }
      }

      console.log(`✓ Created Dawah Activity: ${d.title}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. Seed Quran API Permissions to Public and Authenticated roles
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- Granting Permissions to All User Roles ---');
  const quranControllers = [
    'api::quran-program.quran-program',
    'api::quran-group.quran-group',
    'api::memorization.memorization',
    'api::murajaah.murajaah',
    'api::tajweed-evaluation.tajweed-evaluation',
    'api::halaqah.halaqah',
    'api::quran-achievement.quran-achievement',
    'api::quran-certificate.quran-certificate',
    'api::quran-competition.quran-competition',
    'api::quran-attendance.quran-attendance',
    'api::dawah-activity.dawah-activity',
    'api::quran-assessment.quran-assessment',
    'api::memorization-plan.memorization-plan',
    'api::quran-progress.quran-progress',
    'api::course-offering.course-offering',
  ];

  const actions = ['find', 'findOne', 'create', 'update', 'delete'];

  const allRolesRes = await client.query('SELECT id, type, name FROM up_roles');
  for (const role of allRolesRes.rows) {
    for (const ctrl of quranControllers) {
      for (const act of actions) {
        const actionTarget = `${ctrl}.${act}`;
        const existingPerm = await client.query(`
          SELECT p.id 
          FROM up_permissions p
          JOIN up_permissions_role_lnk lnk ON lnk.permission_id = p.id
          WHERE p.action = $1 AND lnk.role_id = $2
        `, [actionTarget, role.id]);

        if (existingPerm.rows.length === 0) {
          const docId = genDocId();
          const permRes = await client.query(`
            INSERT INTO up_permissions (document_id, action, created_at, updated_at, published_at, locale)
            VALUES ($1, $2, $3, $3, $3, 'en')
            RETURNING id;
          `, [docId, actionTarget, now]);
          const permId = permRes.rows[0].id;

          await client.query(`
            INSERT INTO up_permissions_role_lnk (permission_id, role_id)
            VALUES ($1, $2);
          `, [permId, role.id]);
        }
      }
    }
    console.log(`✓ Permissions granted for role: ${role.name} (${role.type})`);
  }

  console.log('\n=============================================');
  console.log('✅ ALL QURAN DATA AND PERMISSIONS SUCCESSFULLY SEEDED IN STRAPI!');
  console.log('=============================================');

  await client.end();
}

seedQuran().catch(err => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});

import type { Core } from '@strapi/strapi';
import fs from 'fs';
import path from 'path';

async function seedNewsPage(strapi: Core.Strapi) {
  try {
    const newsPage = (await strapi.entityService.findMany('api::news-page.news-page', {
      populate: ['featuredEvents', 'newsletterCard']
    })) as any;

    const defaultNewsletterCard = {
      title: 'Stay Updated',
      subtitle: 'Get the latest school news and event reminders straight to your inbox.',
      placeholderText: 'Email Address',
      buttonText: 'Subscribe',
    };

    if (newsPage?.id && !newsPage?.newsletterCard) {
      await strapi.entityService.update('api::news-page.news-page', newsPage.id, {
        data: { newsletterCard: defaultNewsletterCard }
      });
      strapi.log.info('[YAHAYASCOOL] News Page newsletterCard seeded!');
    }

    if (!newsPage?.featuredEvents || newsPage.featuredEvents.length === 0) {
      strapi.log.info('[YAHAYASCOOL] Seeding News Page...');
      const FEATURED = [
        {
          eyebrow: 'School Stories', headlineLine1: 'News, Events &', headlineLine2: 'Community',
          lede: 'Discover the latest happenings at Yahaya International. From academic achievements to spiritual milestones, our stories reflect our commitment to faith, learning and character.',
          image: '/images/figma-home/09.png', month: 'JUL', day: '15', category: 'CEREMONY', title: 'Graduation Ceremony',
          time: '10:00 AM - 1:00 PM', place: 'Main Auditorium', blurb: 'Join us as we celebrate the achievements of our graduating class.', href: '/news/science-tech-fair-2024',
          buttonText: 'Read More',
        },
        {
          eyebrow: 'Campus Life', headlineLine1: 'A New Home', headlineLine2: 'for Hifz',
          lede: 'Our dedicated memorization centre opens its doors, giving students a purpose-built space for recitation, review and quiet study.',
          image: '/images/figma-home/17.png', month: 'SEP', day: '12', category: 'OPENING', title: 'Memorization Hub',
          time: '9:00 AM - 11:00 AM', place: 'Hifz Centre', blurb: 'The doors open on our dedicated Hifz learning centre.', href: '/news/new-memorization-hub',
          buttonText: 'Read More',
        },
        {
          eyebrow: "D'awah", headlineLine1: 'Service Beyond', headlineLine2: 'the Gates',
          lede: 'Senior students carried our values into three neighbourhoods this month, leading an outreach programme built on listening as much as teaching.',
          image: '/images/figma-home/19.png', month: 'JUN', day: '18', category: "D'AWAH", title: 'Community Outreach',
          time: '2:00 PM - 5:00 PM', place: 'City Centre', blurb: 'Senior students lead an outreach programme across three neighbourhoods.', href: '/news/community-dawah',
          buttonText: 'Read More',
        },
        {
          eyebrow: 'Achievement', headlineLine1: 'Character, and', headlineLine2: 'Scholarship',
          lede: 'The Excellence Awards recognise the students whose work and conduct set the tone for everyone around them.',
          image: '/images/figma-home/07-activity.png', month: 'MAY', day: '10', category: 'AWARDS', title: 'Excellence Awards',
          time: '11:00 AM - 1:00 PM', place: 'Main Hall', blurb: 'Recognising outstanding academic and character achievement.', href: '/news/excellence-awards',
          buttonText: 'Read More',
        },
        {
          eyebrow: 'Events', headlineLine1: 'Ideas Worth', headlineLine2: 'Gathering For',
          lede: 'A full day of talks and demonstrations, bringing together some of the brightest minds working in the field today.',
          image: '/images/figma-home/13.png', month: 'AUG', day: '05', category: 'EVENTS', title: 'Innovation Summit',
          time: '10:00 AM - 4:00 PM', place: 'Library Annex', blurb: 'A day of talks bringing together the brightest minds in the field.', href: '/news/innovation-summit',
          buttonText: 'Read More',
        },
      ];
      const featuredEvents = [];
      for (const item of FEATURED) {
         let imageId = null;
         const imagePath = path.resolve(process.cwd(), '../frontend/public', item.image.slice(1));
         if (fs.existsSync(imagePath)) {
           const stat = fs.statSync(imagePath);
           const file = {
             path: imagePath,
             name: path.basename(imagePath),
             type: 'image/png',
             size: stat.size,
           };
           try {
             const uploadedFiles = await strapi.plugin('upload').service('upload').upload({
               data: {},
               files: file,
             });
             if (uploadedFiles && uploadedFiles.length > 0) {
               imageId = uploadedFiles[0].id;
             }
           } catch(e: any) {
             strapi.log.error('Upload failed: ', e.message);
           }
         }
         const { image, ...rest } = item;
         featuredEvents.push({ ...rest, image: imageId });
      }
      
      const id = newsPage?.id;
      if (id) {
        await strapi.entityService.update('api::news-page.news-page', id, {
          data: { featuredEvents }
        });
      } else {
        await strapi.entityService.create('api::news-page.news-page', {
          data: { featuredEvents, title: 'News, Events & Community' }
        });
      }
      strapi.log.info('[YAHAYASCOOL] News Page seeded!');
    }
  } catch (err: any) {
    strapi.log.error('[YAHAYASCOOL] Failed to seed news page:', err.message);
  }
}

async function seedSchoolAcademicPrograms(strapi: Core.Strapi) {
  try {
    // 1. Seed Main Programs Page if not already created
    const page = await (strapi.entityService as any).findMany('api::school-academic-programs-page.school-academic-programs-page', {
      populate: ['approachItems']
    });

    const defaultApproachItems = [
      {
        icon: 'Zap',
        title: 'Academic Rigor',
        description: 'Challenging curriculum and high expectations that inspire deep understanding and excellence in every subject.'
      },
      {
        icon: 'Heart',
        title: 'Faith & Character',
        description: 'Islamic values are woven into daily learning to nurture integrity, compassion, and a sense of purpose.'
      },
      {
        icon: 'Users',
        title: 'Mentorship',
        description: 'Caring teachers guide each student through personalized support and meaningful relationships beyond the textbook.'
      },
      {
        icon: 'Compass',
        title: 'Real-World Discovery',
        description: 'Experiential projects, fieldwork, and technology connect classroom learning to the world around us.'
      }
    ];

    if (!page) {
      strapi.log.info('[YAHAYASCOOL] Seeding School Academic Programs Page...');
      await (strapi.entityService as any).create('api::school-academic-programs-page.school-academic-programs-page', {
        data: {
          title: 'Academic Programs',
          breadcrumbTitle: 'Academic programs',
          tagline: 'LEARNING WITH PURPOSE',
          headlineLine1: 'Knowledge Rooted in Faith.',
          headlineLine2: 'Excellence Built for Life.',
          lede: 'Rigorous academics, Islamic character, and global readiness—nurturing curious minds and compassionate hearts to lead with purpose and confidence.',
          approachTagline: 'OUR APPROACH',
          approachTitle: 'How Learning Comes to Life',
          approachStatValue: '98%',
          approachStatDescription: 'UNIVERSITY PLACEMENT RATE FOR OUR GRADUATES',
          approachItems: defaultApproachItems,
          publishedAt: new Date().toISOString(),
        }
      });
      strapi.log.info('[YAHAYASCOOL] School Academic Programs Page seeded!');
    }

    // Helper to find or upload image from frontend/public
    const getOrUploadImage = async (relPath: string) => {
      const imagePath = path.resolve(process.cwd(), '../frontend/public', relPath.replace(/^\//, ''));
      if (!fs.existsSync(imagePath)) return null;
      const fileName = path.basename(imagePath);
      try {
        const existing = await (strapi.entityService as any).findMany('plugin::upload.file', {
          filters: { name: { $eq: fileName } }
        });
        if (existing && existing.length > 0) {
          return existing[0].id;
        }
        const stat = fs.statSync(imagePath);
        const ext = path.extname(imagePath).toLowerCase();
        const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
        const uploadedFiles = await strapi.plugin('upload').service('upload').upload({
          data: {},
          files: {
            path: imagePath,
            filepath: imagePath,
            name: fileName,
            originalFilename: fileName,
            type: mime,
            mimetype: mime,
            size: stat.size,
          },
        });
        return uploadedFiles?.[0]?.id || null;
      } catch (e: any) {
        strapi.log.warn(`[YAHAYASCOOL] getOrUploadImage (${relPath}) failed: ${e.message}`);
        return null;
      }
    };

    const pathwayLeftId = await getOrUploadImage('images/figma-home/17.png');
    const pathwayTopId = await getOrUploadImage('images/figma-home/09.png');
    const pathwayBottomId = await getOrUploadImage('images/figma-home/13.png');

    // 2. Seed Programs Collection if empty
    const existingPrograms = await (strapi.entityService as any).findMany('api::school-academic-program.school-academic-program');
    if (!existingPrograms || existingPrograms.length === 0) {
      strapi.log.info('[YAHAYASCOOL] Seeding School Academic Programs collection...');
      const PROGRAMS = [
        {
          title: 'English Language & Literature',
          slug: 'english',
          eyebrow: 'Academic Excellence',
          headlineLine1: 'English Language &',
          headlineLine2: 'Global Communication',
          shortDescription: 'Immerse in an environment where language skills flourish. Our English programs are designed to build confidence, fluency, and a deep understanding of global literature and communication.',
          description: 'Our English program equips students with mastery in writing, critical analysis, rhetoric, and literature, fostering confident communicators who can articulate ideas with precision and moral clarity on the global stage.',
          image: '/images/figma-home/03-programs.jpeg',
          pathwayTitle: 'The English Pathway',
          pathwayDescription: 'A structured four-tier curriculum bridging foundational language mechanics with advanced argumentative writing and classic literature.',
          pathwaySteps: [
            { stageNumber: 1, title: 'Foundational Grammar & Phonetics', description: 'Mastering syntax, vocabulary expansion, and phonetic clarity.' },
            { stageNumber: 2, title: 'Literary Analysis & Rhetoric', description: 'Exploring world literature, identifying stylistic devices, and deconstructing arguments.' },
            { stageNumber: 3, title: 'Persuasive & Academic Writing', description: 'Rigorous research essays, debate structures, and scholarly presentations.' },
            { stageNumber: 4, title: 'Global Discourse & Capstone', description: 'Independent literary thesis, public speaking, and international benchmark preparation.' },
          ],
          order: 1,
        },
        {
          title: 'Arabic Language & Classical Studies',
          slug: 'arabic',
          eyebrow: 'Sacred Scholarship',
          headlineLine1: 'Classical Arabic &',
          headlineLine2: "Qur'anic Linguistics",
          shortDescription: 'Comprehensive Nahw, Sarf, and Balaghah curriculum connecting students directly to original Islamic texts and modern fluency.',
          description: 'Delivering deep fluency in classical and modern standard Arabic through immersive instruction in grammar, rhetoric, and Arabic literary traditions.',
          image: '/images/figma-home/19.png',
          pathwayTitle: 'The Arabic Pathway',
          pathwayDescription: 'From alphabetization and morphology to classical rhetoric and textual exegesis.',
          pathwaySteps: [
            { stageNumber: 1, title: 'Mabadi al-Lughah (Fundamentals)', description: 'Phonology, basic orthography, and fundamental vocabulary.' },
            { stageNumber: 2, title: 'Nahw & Sarf Mastery', description: 'Systematic study of grammatical syntax and morphological derivation.' },
            { stageNumber: 3, title: 'Balaghah & Literature', description: 'Appreciation of poetic meters, rhetorical eloquence, and stylistic nuance.' },
            { stageNumber: 4, title: 'Classical Textual Analysis', description: 'Direct engagement with foundational treatises and classical manuscripts.' },
          ],
          order: 2,
        },
        {
          title: "Qur'an Memorization & Tajweed (Hifz)",
          slug: 'quran-memorization',
          eyebrow: 'Divine Revelation',
          headlineLine1: 'Knowledge Rooted in Faith.',
          headlineLine2: 'Excellence Built for Life.',
          shortDescription: "Guided Hifz program with tajweed, understanding, and character building—rooted in love for the Qur'an.",
          description: "Yahaya International's Quran Memorization & Hifz Program offers a scholarly environment where spiritual devotion meets academic rigor, nurturing tomorrow's leaders through the wisdom of the Holy Quran.",
          image: '/images/figma-home/09.png',
          pathwayTitle: 'The Hifz Pathway',
          pathwayDescription: 'Our Quran Memorization program is more than a curriculum; it is a transformative journey. We combine traditional Ottoman and African memorization techniques with modern pedagogical approaches to ensure deep retention and authentic Tajweed.',
          pathwaySteps: [
            { stageNumber: 1, title: 'Intensive Memorization', description: 'Daily structured sessions focused on new verses, previous revision, and long-term retention.' },
            { stageNumber: 2, title: 'Tafsir & Understanding', description: 'Weekly sessions exploring the context and meaning of the memorized portions.' },
            { stageNumber: 3, title: 'Tajweed Mastery', description: 'Rigorous phonetics training ensuring perfect pronunciation and adherence to recitation rules.' },
            { stageNumber: 4, title: 'Character Building', description: 'Aligning student behavior with the morals and ethics found within the memorized texts.' },
          ],
          order: 3,
        },
        {
          title: "D'awah & Islamic Leadership",
          slug: 'dawah',
          eyebrow: 'Faith & Leadership',
          headlineLine1: 'Faith, Dialogue &',
          headlineLine2: 'Community Impact',
          shortDescription: 'Fostering ethical leaders trained in apologetics, cross-cultural communication, and compassionate community outreach.',
          description: 'Equipping young Muslims with sound theological reasoning, empathy, and effective public speaking to represent Islam with grace and intellect.',
          image: '/images/figma-home/17.png',
          pathwayTitle: "The D'awah Pathway",
          pathwayDescription: 'Developing character, public speaking, and community service through hands-on mentorship.',
          pathwaySteps: [
            { stageNumber: 1, title: 'Foundations of Aqeedah & Fiqh', description: 'Sound orthodox understanding of essential beliefs and practical rulings.' },
            { stageNumber: 2, title: 'Cross-Cultural Dialogue', description: 'Techniques in respectful discussion, addressing common misconceptions, and bridge-building.' },
            { stageNumber: 3, title: 'Public Speaking & Khutbah', description: 'Training in speech delivery, pulpit communication, and media literacy.' },
            { stageNumber: 4, title: 'Community Engagement Practicum', description: 'Fieldwork in charitable initiatives and local mentorship programs.' },
          ],
          order: 4,
        },
        {
          title: 'Online Learning Academy',
          slug: 'online',
          eyebrow: 'Flexible Education',
          headlineLine1: 'Global Classroom,',
          headlineLine2: 'Borderless Learning',
          shortDescription: 'Access our world-class dual curriculum from anywhere in the world through interactive live classes and recorded lectures.',
          description: 'Our online portal bridges geographical boundaries, offering students worldwide access to certified scholars, interactive classrooms, and self-paced modules.',
          image: '/images/figma-home/11.png',
          pathwayTitle: 'The Digital Learning Pathway',
          pathwayDescription: 'Modern blended education combining live sessions, interactive assignments, and digital office hours.',
          pathwaySteps: [
            { stageNumber: 1, title: 'Digital Onboarding & LMS Mastery', description: 'Orientation to the virtual classroom, digital library, and collaboration tools.' },
            { stageNumber: 2, title: 'Interactive Live Classes', description: 'Real-time engagement with instructors and peer breakout discussions.' },
            { stageNumber: 3, title: 'Self-Paced Exploration', description: 'Rich multimedia lecture recordings, quizzes, and automated practice modules.' },
            { stageNumber: 4, title: 'Continuous Evaluation & Feedback', description: 'Personalized mentor feedback and international proctored assessments.' },
          ],
          order: 5,
        },
      ];

      for (const prog of PROGRAMS) {
        let coverImageId = await getOrUploadImage(prog.image);
        const { image, ...progData } = prog;
        await (strapi.entityService as any).create('api::school-academic-program.school-academic-program', {
          data: {
            ...progData,
            coverImage: coverImageId,
            pathwayImageLeft: pathwayLeftId,
            pathwayImageTop: pathwayTopId,
            pathwayImageBottom: pathwayBottomId,
            publishedAt: new Date().toISOString()
          }
        });
      }
      strapi.log.info('[YAHAYASCOOL] School Academic Programs seeded successfully!');
    } else {
      // 3. Update existing programs to have pathwayImageLeft, pathwayImageTop, pathwayImageBottom populated
      try {
        if ((strapi as any).documents) {
          const docService = (strapi as any).documents('api::school-academic-program.school-academic-program');
          const docs = await docService.findMany({
            locale: '*',
            populate: ['pathwayImageLeft', 'pathwayImageTop', 'pathwayImageBottom']
          });

          if (docs && docs.length > 0) {
            for (const doc of docs) {
              const updateData: any = {};
              if (!doc.pathwayImageLeft && pathwayLeftId) updateData.pathwayImageLeft = pathwayLeftId;
              if (!doc.pathwayImageTop && pathwayTopId) updateData.pathwayImageTop = pathwayTopId;
              if (!doc.pathwayImageBottom && pathwayBottomId) updateData.pathwayImageBottom = pathwayBottomId;

              if (Object.keys(updateData).length > 0) {
                await docService.update({
                  documentId: doc.documentId,
                  locale: doc.locale,
                  data: updateData
                });
                if (doc.publishedAt) {
                  await docService.publish({
                    documentId: doc.documentId,
                    locale: doc.locale,
                  });
                }
                strapi.log.info(`[YAHAYASCOOL] Updated pathway images for documentId=${doc.documentId} (${doc.slug})`);
              }
            }
          }
        }
      } catch (docErr: any) {
        strapi.log.warn('[YAHAYASCOOL] Document Service update fallback: ' + docErr.message);
        // Fallback to entityService
        const allPrograms = await (strapi.entityService as any).findMany('api::school-academic-program.school-academic-program', {
          populate: ['pathwayImageLeft', 'pathwayImageTop', 'pathwayImageBottom']
        });

        if (allPrograms && allPrograms.length > 0) {
          for (const prog of allPrograms) {
            const updateData: any = {};
            if (!prog.pathwayImageLeft && pathwayLeftId) updateData.pathwayImageLeft = pathwayLeftId;
            if (!prog.pathwayImageTop && pathwayTopId) updateData.pathwayImageTop = pathwayTopId;
            if (!prog.pathwayImageBottom && pathwayBottomId) updateData.pathwayImageBottom = pathwayBottomId;

            if (Object.keys(updateData).length > 0) {
              await (strapi.entityService as any).update('api::school-academic-program.school-academic-program', prog.id, {
                data: updateData
              });
              strapi.log.info(`[YAHAYASCOOL] Fallback updated pathway images for program id=${prog.id} (${prog.slug})`);
            }
          }
        }
      }

      // Ensure published rows also have the media morphs synced
      try {
        await strapi.db.connection.raw(`
          INSERT INTO files_related_mph (file_id, related_id, related_type, field, "order")
          SELECT f.file_id, p_pub.id, f.related_type, f.field, f."order"
          FROM files_related_mph f
          JOIN school_academic_programs p_draft ON f.related_id = p_draft.id
          JOIN school_academic_programs p_pub ON p_pub.document_id = p_draft.document_id AND p_pub.id != p_draft.id
          WHERE f.related_type = 'api::school-academic-program.school-academic-program'
            AND f.field IN ('pathwayImageLeft', 'pathwayImageTop', 'pathwayImageBottom')
            AND NOT EXISTS (
              SELECT 1 FROM files_related_mph existing
              WHERE existing.related_id = p_pub.id
                AND existing.related_type = f.related_type
                AND existing.field = f.field
            );
        `);
      } catch (syncErr: any) {
        // silent
      }
    }

    // 4. Configure Content Manager edit layout with clear labels and 3-column collage row
    try {
      const layoutConfigKey = 'plugin_content_manager_configuration_content_types::api::school-academic-program.school-academic-program';
      const existingConfig = await strapi.db.query('strapi::core-store').findOne({
        where: { key: layoutConfigKey }
      });
      
      const configValue = {
        settings: {
          bulkable: true,
          filterable: true,
          searchable: true,
          pageSize: 10,
          relationOpenMode: 'modal',
          mainField: 'title',
          defaultSortBy: 'order',
          defaultSortOrder: 'ASC'
        },
        metadatas: {
          id: { edit: {}, list: { label: 'id', searchable: true, sortable: true } },
          title: { edit: { label: 'Program Title', visible: true, editable: true }, list: { label: 'Title', searchable: true, sortable: true } },
          slug: { edit: { label: 'URL Slug', visible: true, editable: true }, list: { label: 'Slug', searchable: true, sortable: true } },
          eyebrow: { edit: { label: 'Eyebrow / Badge', visible: true, editable: true }, list: { label: 'Eyebrow', searchable: true, sortable: true } },
          headlineLine1: { edit: { label: 'Headline Line 1', visible: true, editable: true } },
          headlineLine2: { edit: { label: 'Headline Line 2', visible: true, editable: true } },
          shortDescription: { edit: { label: 'Short Description (Card Summary)', visible: true, editable: true } },
          description: { edit: { label: 'Detailed Description', visible: true, editable: true } },
          coverImage: { edit: { label: 'Cover Image', visible: true, editable: true }, list: { label: 'Cover Image', searchable: false, sortable: false } },
          primaryButtonText: { edit: { label: 'Primary Button Text', visible: true, editable: true } },
          primaryButtonUrl: { edit: { label: 'Primary Button URL', visible: true, editable: true } },
          downloadButtonText: { edit: { label: 'Download Button Text', visible: true, editable: true } },
          downloadPdf: { edit: { label: 'Prospectus / Syllabus PDF', visible: true, editable: true } },
          pathwayTitle: { edit: { label: 'Pathway Section Title', visible: true, editable: true } },
          pathwayDescription: { edit: { label: 'Pathway Section Description', visible: true, editable: true } },
          pathwaySteps: { edit: { label: 'Pathway Steps (Stages)', visible: true, editable: true } },
          pathwayImageLeft: {
            edit: {
              label: 'Pathway Left Image (Tall Vertical)',
              description: 'Collage left tall photo (Figma 17.png)',
              visible: true,
              editable: true
            },
            list: { label: 'Pathway Left Image', searchable: false, sortable: false }
          },
          pathwayImageTop: {
            edit: {
              label: 'Pathway Top Image (Right Top)',
              description: 'Collage right top photo (Figma 09.png)',
              visible: true,
              editable: true
            },
            list: { label: 'Pathway Top Image', searchable: false, sortable: false }
          },
          pathwayImageBottom: {
            edit: {
              label: 'Pathway Bottom Image (Right Bottom)',
              description: 'Collage right bottom photo (Figma 13.png)',
              visible: true,
              editable: true
            },
            list: { label: 'Pathway Bottom Image', searchable: false, sortable: false }
          },
          pathwayImages: { edit: { label: 'Legacy Pathway Images (Fallback)', visible: false, editable: true } },
          order: { edit: { label: 'Order', visible: true, editable: true }, list: { label: 'Order', searchable: true, sortable: true } },
          isFeatured: { edit: { label: 'Is Featured', visible: true, editable: true }, list: { label: 'Featured', searchable: true, sortable: true } },
          seo: { edit: { label: 'SEO Metadata', visible: true, editable: true } },
          createdAt: { edit: { label: 'createdAt', visible: false, editable: true }, list: { label: 'createdAt', searchable: true, sortable: true } },
          updatedAt: { edit: { label: 'updatedAt', visible: false, editable: true }, list: { label: 'updatedAt', searchable: true, sortable: true } },
          createdBy: { edit: { label: 'createdBy', visible: false, editable: true }, list: { label: 'createdBy', searchable: true, sortable: true } },
          updatedBy: { edit: { label: 'updatedBy', visible: false, editable: true }, list: { label: 'updatedBy', searchable: true, sortable: true } },
          documentId: { edit: {}, list: { label: 'documentId', searchable: true, sortable: true } }
        },
        layouts: {
          list: ['id', 'title', 'slug', 'order', 'isFeatured'],
          edit: [
            [{ name: 'title', size: 6 }, { name: 'slug', size: 6 }],
            [{ name: 'eyebrow', size: 6 }, { name: 'order', size: 6 }],
            [{ name: 'headlineLine1', size: 6 }, { name: 'headlineLine2', size: 6 }],
            [{ name: 'shortDescription', size: 12 }],
            [{ name: 'description', size: 12 }],
            [{ name: 'coverImage', size: 6 }, { name: 'isFeatured', size: 6 }],
            [{ name: 'primaryButtonText', size: 6 }, { name: 'primaryButtonUrl', size: 6 }],
            [{ name: 'downloadButtonText', size: 6 }, { name: 'downloadPdf', size: 6 }],
            [{ name: 'pathwayTitle', size: 6 }, { name: 'pathwayDescription', size: 6 }],
            [{ name: 'pathwaySteps', size: 12 }],
            [{ name: 'pathwayImageLeft', size: 4 }, { name: 'pathwayImageTop', size: 4 }, { name: 'pathwayImageBottom', size: 4 }],
            [{ name: 'seo', size: 12 }]
          ]
        },
        uid: 'api::school-academic-program.school-academic-program'
      };

      if (!existingConfig) {
        await strapi.db.query('strapi::core-store').create({
          data: {
            key: layoutConfigKey,
            value: JSON.stringify(configValue),
            type: 'plugin',
            environment: null,
            tag: null
          }
        });
        strapi.log.info('[YAHAYASCOOL] Content Manager layout for school-academic-program created!');
      } else {
        await strapi.db.query('strapi::core-store').update({
          where: { key: layoutConfigKey },
          data: {
            value: JSON.stringify(configValue)
          }
        });
        strapi.log.info('[YAHAYASCOOL] Content Manager layout for school-academic-program updated!');
      }
    } catch (e: any) {
      strapi.log.warn('[YAHAYASCOOL] Failed to set layout config: ' + e.message);
    }
  } catch (err: any) {
    strapi.log.error('[YAHAYASCOOL] Failed to seed school academic programs:', err.message);
  }
}

async function seedOnlineLearning(strapi: Core.Strapi) {
  try {
    // Helper to find or upload image from frontend/public
    const getOrUploadImage = async (relPath: string) => {
      const imagePath = path.resolve(process.cwd(), '../frontend/public', relPath.replace(/^\//, ''));
      if (!fs.existsSync(imagePath)) return null;
      const fileName = path.basename(imagePath);
      try {
        const existing = await (strapi.entityService as any).findMany('plugin::upload.file', {
          filters: { name: { $eq: fileName } }
        });
        if (existing && existing.length > 0) {
          return existing[0].id;
        }
        const stat = fs.statSync(imagePath);
        const ext = path.extname(imagePath).toLowerCase();
        const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
        const uploadedFiles = await strapi.plugin('upload').service('upload').upload({
          data: {},
          files: {
            path: imagePath,
            filepath: imagePath,
            name: fileName,
            originalFilename: fileName,
            type: mime,
            mimetype: mime,
            size: stat.size,
          },
        });
        return uploadedFiles?.[0]?.id || null;
      } catch (e: any) {
        strapi.log.warn(`[YAHAYASCOOL] getOrUploadImage (${relPath}) failed: ${e.message}`);
        return null;
      }
    };

    const heroImageId = await getOrUploadImage('images/figma-home/09.png');
    const approachImageId = await getOrUploadImage('images/figma-home/02-about.jpeg');

    // 1. Seed Online Learning Page if not already created
    const page = await (strapi.entityService as any).findMany('api::online-learning-page.online-learning-page', {
      populate: ['approachItems', 'heroImage', 'approachImage']
    });

    const defaultApproachItems = [
      {
        icon: 'Zap',
        title: 'Academic Rigor',
        description: 'Challenging curriculum and high expectations that inspire deep understanding and excellence in every subject.'
      },
      {
        icon: 'Heart',
        title: 'Faith & Character',
        description: 'Islamic values are woven into daily learning to nurture integrity, compassion, and a sense of purpose.'
      },
      {
        icon: 'Users',
        title: 'Mentorship',
        description: 'Caring teachers guide each student through personalized support and meaningful relationships beyond the textbook.'
      },
      {
        icon: 'Compass',
        title: 'Real-World Discovery',
        description: 'Experiential projects, fieldwork, and technology connect classroom learning to the world around us.'
      }
    ];

    if (!page) {
      strapi.log.info('[YAHAYASCOOL] Seeding Online Learning Page...');
      await (strapi.entityService as any).create('api::online-learning-page.online-learning-page', {
        data: {
          title: 'Online Learning',
          breadcrumbTitle: 'Online Learning',
          tagline: 'LEARNING WITH PURPOSE',
          headlineLine1: 'Knowledge at Your',
          headlineLine2: 'Fingertips',
          lede: 'Access world-class Islamic and academic education from anywhere in the world. Begin your journey of lifelong learning today.',
          heroImage: heroImageId,
          liveLessonButtonText: 'Live Lesson',
          liveLessonButtonUrl: '#',
          coursesSectionTitle: 'Online Courses',
          coursesSectionSubtitle: 'Explore our live and recorded offerings',
          joinEnrollmentButtonText: 'Join Enrollment',
          approachTagline: 'OUR APPROACH',
          approachTitle: 'How Learning Comes to Life',
          approachImage: approachImageId,
          approachStatValue: '98%',
          approachStatDescription: 'UNIVERSITY PLACEMENT RATE FOR OUR GRADUATES',
          approachItems: defaultApproachItems,
          popupTitle: 'Pay Online',
          popupDefaultAmount: 500,
          popupCurrencies: 'USD,EUR,GBP,LRD',
          popupNote: 'Your donation is safe, secure and tax-deductible.',
          publishedAt: new Date().toISOString(),
        }
      });
      strapi.log.info('[YAHAYASCOOL] Online Learning Page seeded!');
    }

    const existingCourses = await (strapi.entityService as any).findMany('api::online-course.online-course');
    if (!existingCourses || existingCourses.length === 0) {
      strapi.log.info('[YAHAYASCOOL] Seeding Online Courses collection...');
      const COURSES = [
        {
          title: 'Advanced Arabic Grammar',
          slug: 'advanced-arabic-grammar',
          tag: 'Languages • Advanced',
          badge: 'New Release',
          description: 'An intensive study into classical Nahw and Sarf for profound textual understanding.',
          image: '/images/figma-home/13.png',
          price: 500,
          buttonText: 'Join Enrollment',
          order: 1,
        },
        {
          title: 'Tajweed Foundations',
          slug: 'tajweed-foundations',
          tag: 'Qur’an • Beginner',
          badge: 'New Release',
          description: 'Articulation and rhythm taught from first principles, corrected one to one.',
          image: '/images/figma-home/17.png',
          price: 500,
          buttonText: 'Join Enrollment',
          order: 2,
        },
        {
          title: 'Islamic History',
          slug: 'islamic-history',
          tag: 'Humanities • Intermediate',
          badge: 'New Release',
          description: 'The major periods and figures, read through primary sources rather than summaries.',
          image: '/images/figma-home/07-activity.png',
          price: 500,
          buttonText: 'Join Enrollment',
          order: 3,
        },
        {
          title: 'English for Academic Study',
          slug: 'english-for-academic-study',
          tag: 'Languages • Intermediate',
          badge: 'New Release',
          description: 'Speaking, writing, and listening built around the demands of academic work.',
          image: '/images/figma-home/09.png',
          price: 500,
          buttonText: 'Join Enrollment',
          order: 4,
        },
        {
          title: 'Qur’anic Arabic',
          slug: 'quranic-arabic',
          tag: 'Qur’an • Intermediate',
          badge: 'New Release',
          description: 'Vocabulary and syntax drawn directly from the text, taught verse by verse.',
          image: '/images/figma-home/19.png',
          price: 500,
          buttonText: 'Join Enrollment',
          order: 5,
        },
        {
          title: 'Fiqh Essentials',
          slug: 'fiqh-essentials',
          tag: 'Islamic Studies • Beginner',
          badge: 'New Release',
          description: 'Practical jurisprudence for daily life, with evidence given for every ruling.',
          image: '/images/figma-home/03-programs.jpeg',
          price: 500,
          buttonText: 'Join Enrollment',
          order: 6,
        },
      ];

      for (const course of COURSES) {
        const imageId = await getOrUploadImage(course.image);
        const { image, ...courseData } = course;
        await (strapi.entityService as any).create('api::online-course.online-course', {
          data: {
            ...courseData,
            image: imageId,
            isFeatured: true,
            enrollmentOpen: true,
            publishedAt: new Date().toISOString(),
          }
        });
      }
      strapi.log.info('[YAHAYASCOOL] Online Courses collection seeded!');
    }

    try {
      await strapi.db.connection.raw(`
        INSERT OR IGNORE INTO files_related_morphs (file_id, related_id, related_type, field, "order")
        SELECT f.file_id, p_pub.id, f.related_type, f.field, f."order"
        FROM files_related_morphs f
        JOIN online_courses p_draft ON f.related_id = p_draft.id AND f.related_type = 'api::online-course.online-course'
        JOIN online_courses p_pub ON p_pub.document_id = p_draft.document_id AND p_pub.published_at IS NOT NULL
        WHERE p_draft.published_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM files_related_morphs existing
            WHERE existing.related_id = p_pub.id
              AND existing.related_type = f.related_type
              AND existing.field = f.field
          );
      `);
      await strapi.db.connection.raw(`
        INSERT OR IGNORE INTO files_related_morphs (file_id, related_id, related_type, field, "order")
        SELECT f.file_id, p_pub.id, f.related_type, f.field, f."order"
        FROM files_related_morphs f
        JOIN online_learning_pages p_draft ON f.related_id = p_draft.id AND f.related_type = 'api::online-learning-page.online-learning-page'
        JOIN online_learning_pages p_pub ON p_pub.document_id = p_draft.document_id AND p_pub.published_at IS NOT NULL
        WHERE p_draft.published_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM files_related_morphs existing
            WHERE existing.related_id = p_pub.id
              AND existing.related_type = f.related_type
              AND existing.field = f.field
          );
      `);
    } catch (e: any) {}

    try {
      const pageConfigKey = 'plugin_content_manager_configuration_content_types::api::online-learning-page.online-learning-page';
      const existingPageConfig = await strapi.db.query('strapi::core-store').findOne({ where: { key: pageConfigKey } });
      const pageConfigValue = {
        settings: {
          bulkable: true,
          filterable: true,
          searchable: true,
          pageSize: 10,
          relationOpenMode: 'modal',
          mainField: 'title',
          defaultSortBy: 'title',
          defaultSortOrder: 'ASC'
        },
        metadatas: {
          id: { edit: {}, list: { label: 'id', searchable: true, sortable: true } },
          title: { edit: { label: 'Page Title', visible: true, editable: true }, list: { label: 'Title', searchable: true, sortable: true } },
          breadcrumbTitle: { edit: { label: 'Breadcrumb Title', visible: true, editable: true } },
          tagline: { edit: { label: 'Hero Eyebrow Tagline', visible: true, editable: true } },
          headlineLine1: { edit: { label: 'Headline Line 1', visible: true, editable: true } },
          headlineLine2: { edit: { label: 'Headline Line 2 (Accent)', visible: true, editable: true } },
          lede: { edit: { label: 'Hero Lede Description', visible: true, editable: true } },
          heroImage: { edit: { label: 'Hero Leaf Image', visible: true, editable: true } },
          liveLessonButtonText: { edit: { label: 'Live Lesson Button Text', visible: true, editable: true } },
          liveLessonButtonUrl: { edit: { label: 'Live Lesson Button URL', visible: true, editable: true } },
          coursesSectionTitle: { edit: { label: 'Courses Section Title', visible: true, editable: true } },
          coursesSectionSubtitle: { edit: { label: 'Courses Section Subtitle', visible: true, editable: true } },
          joinEnrollmentButtonText: { edit: { label: 'Join Enrollment Button Text (Default)', visible: true, editable: true } },
          approachTagline: { edit: { label: 'Approach Tagline', visible: true, editable: true } },
          approachTitle: { edit: { label: 'Approach Title', visible: true, editable: true } },
          approachImage: { edit: { label: 'Approach Image', visible: true, editable: true } },
          approachStatValue: { edit: { label: 'Approach Stat Value', visible: true, editable: true } },
          approachStatDescription: { edit: { label: 'Approach Stat Description', visible: true, editable: true } },
          approachItems: { edit: { label: 'Approach Items', visible: true, editable: true } },
          popupTitle: { edit: { label: 'Popup Modal Title (Legacy)', visible: false, editable: true } },
          popupTabPayOnline: { edit: { label: 'Tab 1: Pay Online Label', visible: true, editable: true } },
          popupTabAlreadyPaid: { edit: { label: 'Tab 2: Already Paid Label', visible: true, editable: true } },
          popupPayOnlineTitle: { edit: { label: 'Pay Online Banner Title', visible: true, editable: true } },
          popupAlreadyPaidTitle: { edit: { label: 'Already Paid Form Title', visible: true, editable: true } },
          popupNameLabel: { edit: { label: 'Pay Online: Name Field Label', visible: true, editable: true } },
          popupNamePlaceholder: { edit: { label: 'Pay Online: Name Placeholder', visible: true, editable: true } },
          popupEmailLabel: { edit: { label: 'Pay Online: Email Field Label', visible: true, editable: true } },
          popupEmailPlaceholder: { edit: { label: 'Pay Online: Email Placeholder', visible: true, editable: true } },
          popupPhoneLabel: { edit: { label: 'Pay Online: Phone Field Label', visible: true, editable: true } },
          popupSelectCourseLabel: { edit: { label: 'Pay Online: Course Dropdown Label', visible: true, editable: true } },
          popupSelectAmountLabel: { edit: { label: 'Pay Online: Amount Field Label', visible: true, editable: true } },
          popupDefaultAmount: { edit: { label: 'Pay Online: Default Amount ($)', visible: true, editable: true } },
          popupSelectCurrencyLabel: { edit: { label: 'Pay Online: Currency Dropdown Label', visible: true, editable: true } },
          popupCurrencies: { edit: { label: 'Pay Online: Currencies (comma-separated)', visible: true, editable: true } },
          popupCheckoutButtonText: { edit: { label: 'Pay Online: Checkout Button Text', visible: true, editable: true } },
          popupNote: { edit: { label: 'Pay Online: Bottom Security/Tax Note', visible: true, editable: true } },
          popupCountryPlaceholder: { edit: { label: 'Already Paid: Country Placeholder', visible: true, editable: true } },
          popupTopicPlaceholder: { edit: { label: 'Already Paid: Topic Placeholder', visible: true, editable: true } },
          popupMessagePlaceholder: { edit: { label: 'Already Paid: Message Placeholder', visible: true, editable: true } },
          popupReceiptLabel: { edit: { label: 'Already Paid: Receipt Upload Label', visible: true, editable: true } },
          popupReceiptHint: { edit: { label: 'Already Paid: Receipt Upload Hint', visible: true, editable: true } },
          popupTermsLinkText: { edit: { label: 'Terms: Link Text ("Read the legal terms...")', visible: true, editable: true } },
          popupTermsSuffix: { edit: { label: 'Terms: Suffix Text ("I have accept it")', visible: true, editable: true } },
          popupSendMessageButtonText: { edit: { label: 'Already Paid: Submit Button Text', visible: true, editable: true } },
          seo: { edit: { label: 'SEO Metadata', visible: true, editable: true } }
        },
        layouts: {
          list: ['id', 'title'],
          edit: [
            [{ name: 'title', size: 6 }, { name: 'breadcrumbTitle', size: 6 }],
            [{ name: 'tagline', size: 12 }],
            [{ name: 'headlineLine1', size: 6 }, { name: 'headlineLine2', size: 6 }],
            [{ name: 'lede', size: 12 }],
            [{ name: 'heroImage', size: 6 }, { name: 'liveLessonButtonText', size: 3 }, { name: 'liveLessonButtonUrl', size: 3 }],
            [{ name: 'coursesSectionTitle', size: 4 }, { name: 'coursesSectionSubtitle', size: 4 }, { name: 'joinEnrollmentButtonText', size: 4 }],
            [{ name: 'approachTagline', size: 6 }, { name: 'approachTitle', size: 6 }],
            [{ name: 'approachImage', size: 6 }, { name: 'approachStatValue', size: 3 }, { name: 'approachStatDescription', size: 3 }],
            [{ name: 'approachItems', size: 12 }],
            [{ name: 'popupTabPayOnline', size: 3 }, { name: 'popupTabAlreadyPaid', size: 3 }, { name: 'popupPayOnlineTitle', size: 3 }, { name: 'popupAlreadyPaidTitle', size: 3 }],
            [{ name: 'popupNameLabel', size: 3 }, { name: 'popupNamePlaceholder', size: 3 }, { name: 'popupEmailLabel', size: 3 }, { name: 'popupEmailPlaceholder', size: 3 }],
            [{ name: 'popupPhoneLabel', size: 4 }, { name: 'popupSelectCourseLabel', size: 4 }, { name: 'popupCheckoutButtonText', size: 4 }],
            [{ name: 'popupSelectAmountLabel', size: 3 }, { name: 'popupDefaultAmount', size: 3 }, { name: 'popupSelectCurrencyLabel', size: 3 }, { name: 'popupCurrencies', size: 3 }],
            [{ name: 'popupNote', size: 12 }],
            [{ name: 'popupCountryPlaceholder', size: 4 }, { name: 'popupTopicPlaceholder', size: 4 }, { name: 'popupSendMessageButtonText', size: 4 }],
            [{ name: 'popupMessagePlaceholder', size: 12 }],
            [{ name: 'popupReceiptLabel', size: 6 }, { name: 'popupReceiptHint', size: 6 }],
            [{ name: 'popupTermsLinkText', size: 6 }, { name: 'popupTermsSuffix', size: 6 }],
            [{ name: 'seo', size: 12 }]
          ]
        },
        uid: 'api::online-learning-page.online-learning-page'
      };

      if (!existingPageConfig) {
        await strapi.db.query('strapi::core-store').create({
          data: { key: pageConfigKey, value: JSON.stringify(pageConfigValue), type: 'plugin' }
        });
      } else {
        await strapi.db.query('strapi::core-store').update({
          where: { key: pageConfigKey },
          data: { value: JSON.stringify(pageConfigValue) }
        });
      }

      const courseConfigKey = 'plugin_content_manager_configuration_content_types::api::online-course.online-course';
      const existingCourseConfig = await strapi.db.query('strapi::core-store').findOne({ where: { key: courseConfigKey } });
      const courseConfigValue = {
        settings: {
          bulkable: true,
          filterable: true,
          searchable: true,
          pageSize: 10,
          relationOpenMode: 'modal',
          mainField: 'title',
          defaultSortBy: 'order',
          defaultSortOrder: 'ASC'
        },
        metadatas: {
          id: { edit: {}, list: { label: 'id', searchable: true, sortable: true } },
          title: { edit: { label: 'Course Title', visible: true, editable: true }, list: { label: 'Title', searchable: true, sortable: true } },
          slug: { edit: { label: 'URL Slug', visible: true, editable: true }, list: { label: 'Slug', searchable: true, sortable: true } },
          tag: { edit: { label: 'Category / Tag (e.g. Languages • Advanced)', visible: true, editable: true }, list: { label: 'Tag', searchable: true, sortable: true } },
          badge: { edit: { label: 'Badge (e.g. New Release)', visible: true, editable: true }, list: { label: 'Badge', searchable: true, sortable: true } },
          description: { edit: { label: 'Description', visible: true, editable: true } },
          image: { edit: { label: 'Course Cover Photo', visible: true, editable: true }, list: { label: 'Image', searchable: false, sortable: false } },
          price: { edit: { label: 'Price / Fee ($)', visible: true, editable: true }, list: { label: 'Price', searchable: true, sortable: true } },
          buttonText: { edit: { label: 'Button Text (Default: "Join Enrollment")', visible: true, editable: true }, list: { label: 'Button Text', searchable: true, sortable: true } },
          order: { edit: { label: 'Display Order', visible: true, editable: true }, list: { label: 'Order', searchable: true, sortable: true } },
          isFeatured: { edit: { label: 'Is Featured', visible: true, editable: true }, list: { label: 'Featured', searchable: true, sortable: true } },
          enrollmentOpen: { edit: { label: 'Enrollment Open', visible: true, editable: true }, list: { label: 'Open', searchable: true, sortable: true } }
        },
        layouts: {
          list: ['id', 'title', 'tag', 'price', 'buttonText', 'order', 'enrollmentOpen'],
          edit: [
            [{ name: 'title', size: 6 }, { name: 'slug', size: 6 }],
            [{ name: 'tag', size: 6 }, { name: 'badge', size: 6 }],
            [{ name: 'description', size: 12 }],
            [{ name: 'image', size: 4 }, { name: 'price', size: 4 }, { name: 'buttonText', size: 4 }],
            [{ name: 'order', size: 4 }, { name: 'isFeatured', size: 4 }, { name: 'enrollmentOpen', size: 4 }]
          ]
        },
        uid: 'api::online-course.online-course'
      };

      if (!existingCourseConfig) {
        await strapi.db.query('strapi::core-store').create({
          data: { key: courseConfigKey, value: JSON.stringify(courseConfigValue), type: 'plugin' }
        });
      } else {
        await strapi.db.query('strapi::core-store').update({
          where: { key: courseConfigKey },
          data: { value: JSON.stringify(courseConfigValue) }
        });
      }
      strapi.log.info('[YAHAYASCOOL] Content Manager layouts for online-learning configured!');
    } catch (e: any) {
      strapi.log.warn('[YAHAYASCOOL] Failed to set online learning layout configs: ' + e.message);
    }
  } catch (err: any) {
    strapi.log.error('[YAHAYASCOOL] Failed to seed online learning:', err.message);
  }
}

async function seedHomepage(strapi: Core.Strapi) {
  try {
    const getOrUploadImage = async (relPath: string) => {
      const imagePath = path.resolve(process.cwd(), '../frontend/public', relPath.replace(/^\//, ''));
      if (!fs.existsSync(imagePath)) return null;
      const fileName = path.basename(imagePath);
      try {
        const existing = await (strapi.entityService as any).findMany('plugin::upload.file', {
          filters: { name: { $eq: fileName } }
        });
        if (existing && existing.length > 0) {
          return existing[0].id;
        }
        const stat = fs.statSync(imagePath);
        const ext = path.extname(imagePath).toLowerCase();
        const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
        const uploadedFiles = await strapi.plugin('upload').service('upload').upload({
          data: {},
          files: {
            path: imagePath,
            filepath: imagePath,
            name: fileName,
            originalFilename: fileName,
            type: mime,
            mimetype: mime,
            size: stat.size,
          },
        });
        return uploadedFiles?.[0]?.id || null;
      } catch (e: any) {
        strapi.log.warn(`[YAHAYASCOOL] getOrUploadImage (${relPath}) failed: ${e.message}`);
        return null;
      }
    };

    // Preload image IDs
    const img19 = await getOrUploadImage('images/figma-home/19.png');
    const imgSlide2 = (await getOrUploadImage('images/figma-home/slide2-new.png')) || (await getOrUploadImage('images/figma-home/01-hero.jpeg'));
    const img17 = await getOrUploadImage('images/figma-home/17.png');
    const imgAbout = (await getOrUploadImage('home/aboutImage.png')) || (await getOrUploadImage('images/figma-home/02-about.jpeg'));
    const img09 = await getOrUploadImage('images/figma-home/09.png');
    const img07 = await getOrUploadImage('images/figma-home/07-activity.png');
    const img13 = await getOrUploadImage('images/figma-home/13.png');
    const imgHero01 = await getOrUploadImage('images/figma-home/01-hero.jpeg');
    const imgNews20 = await getOrUploadImage('images/figma-home/20-news.jpeg');
    const imgProg04 = await getOrUploadImage('images/figma-home/04-programs.jpeg');
    const imgAct08 = await getOrUploadImage('images/figma-home/08-activity.jpeg');

    const LOCALES_DATA: Record<string, any> = {
      en: {
        title: 'Welcome to YAHAYASCOOL',
        heroEstablishedText: 'EST. 2020',
        heroPrimaryCtaText: 'Start Application',
        heroPrimaryCtaUrl: '/contact',
        heroPhone: '+23188368801',
        heroEmail: 'info@yahayaschool.com',
        heroWhatsapp: '23188368801',
        heroSlides: [
          {
            titlePart1: 'Education, Practice',
            titlePart2: 'and Advocacy.',
            description: 'Yahaya International Islamic & English School blends the depth of traditional Islamic values with the rigorous standards of modern international education, fostering a nurturing environment for holistic student growth.',
          },
          {
            titlePart1: 'Nurturing Minds,',
            titlePart2: 'Building Futures.',
            description: 'Our comprehensive curriculum is designed to challenge students intellectually while supporting their emotional and spiritual well-being.',
          },
          {
            titlePart1: 'Excellence in',
            titlePart2: 'Every Step.',
            description: 'Join a community dedicated to academic excellence, moral integrity, and lifelong learning in a supportive environment.',
          }
        ],
        aboutEyebrow: 'About Our Legacy',
        aboutHeadingLine1: 'Fostering Excellence',
        aboutHeadingLine2: 'Through',
        aboutHeadingHighlight: 'Faith and Science',
        aboutBody: 'Yahaya International Islamic & English High School is more than just an educational institution; it is a community dedicated to shaping the holistic development of every child. We bridge the gap between traditional Islamic ethics and modern Western education.',
        aboutCaption: 'Yahaya International Islamic & English High School is more than just an educational institution',
        aboutStat1Number: 250,
        aboutStat1Suffix: '+',
        aboutStat1Label: 'Students',
        aboutStat2Number: 25,
        aboutStat2Suffix: '+',
        aboutStat2Label: 'Employees',
        aboutStat3Number: 6,
        aboutStat3Suffix: '+',
        aboutStat3Label: 'Years',
        programsEyebrow: 'Our Programs',
        programsTitle: 'Explore Our Programs',
        programsDescription: 'Contribute to modern facilities and learning environments equipped with the latest educational technology. Pathways designed to cultivate scholarship, character, and leadership.',
        programsLearnMoreText: 'Learn More',
        quoteAttribution: '— Sahih al-Bukhari and Sahih Muslim',
        quoteText: 'Actions are judged by intentions, and every person will have only what they intended.',
        quoteBookArabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
        quoteBookTranslation: 'and every man shall have only that which he intended',
        activitiesHeading: 'Seeking knowledge is a path to goodness.',
        activitiesSubtitle: 'Every action tells a story—see what\'s been happening.',
        activitiesCtaText: 'Join us',
        activitiesCtaUrl: '/gallery',
        activitiesCards: [
          { title: 'Mosque Activities' },
          { title: 'Public Speaking' },
          { title: 'Arts & Creativity' },
          { title: 'Sports & Recreation' },
        ],
        testimonialsHeading: 'Kind Words From Our Community',
        testimonialsSubtitle: 'Hear from the parents, alumni and community leaders who have shaped — and been shaped by — life at Yahaya International.',
        testimonials: [
          {
            name: 'Mia Thompson',
            role: 'PARENT',
            title: 'A transformative experience for our child.',
            quote: '"Since enrolling our daughter at Yahaya International, we have seen remarkable growth not just in her academic performance but in her character. The seamless integration of Islamic values with rigorous modern education is exactly what we were looking for."',
            rating: 5,
          },
          {
            name: 'James Miller',
            role: 'ALUMNUS',
            title: 'It highlights academic satisfaction, testimonials.',
            quote: '"My years at Yahaya International completely transformed my worldview. The attention to detail in the curriculum and the ease of access to mentors allowed me to maintain my faith identity while delivering world-class academic performance. It\'s not just a school; it\'s a competitive advantage."',
            rating: 5,
          },
          {
            name: 'Olivia Carter',
            role: 'COMMUNITY LEADER',
            title: 'An institution built on true excellence.',
            quote: '"The leadership at Yahaya International demonstrates a profound commitment to educational excellence. I have witnessed firsthand how they nurture students into well-rounded individuals ready to tackle global challenges with moral integrity."',
            rating: 5,
          },
          {
            name: 'Matthew Bennett',
            role: 'PARENT',
            title: 'The best decision we made.',
            quote: '"We evaluated many schools before choosing Yahaya International. The facilities are modern, the teachers are highly qualified, and the emphasis on both D\'awah and STEM makes it a unique and invaluable environment for our children."',
            rating: 5,
          },
        ],
        newsEyebrow: 'News & Events',
        newsHeading: 'Latest News & Updates',
        newsDescription: 'Stay informed with the latest happenings, academic milestones, and announcements from Yahaya School.',
        newsReadMoreText: 'Read More',
        newsViewAllText: 'View All News',
        newsViewAllUrl: '/news',
      },
      ar: {
        title: 'مرحبا بكم في يهايا سكول',
        heroEstablishedText: 'تأسست ٢٠٢٠',
        heroPrimaryCtaText: 'ابدأ التقديم',
        heroPrimaryCtaUrl: '/contact',
        heroPhone: '+23188368801',
        heroEmail: 'info@yahayaschool.com',
        heroWhatsapp: '23188368801',
        heroSlides: [
          {
            titlePart1: 'التعليم، الممارسة',
            titlePart2: 'والتوجيه.',
            description: 'تدمج مدرسة يهايا الدولية الإسلامية والإنجليزية بين عمق القيم الإسلامية التقليدية والمعايير الصارمة للتعليم الدولي الحديث، مما يوفر بيئة حاضنة للنمو الشامل للطلاب.',
          },
          {
            titlePart1: 'رعاية العقول،',
            titlePart2: 'بناء المستقبل.',
            description: 'تم تصميم منهجنا الشامل لتحدي الطلاب فكريًا مع دعم رفاهيتهم العاطفية والروحية.',
          },
          {
            titlePart1: 'التميز في',
            titlePart2: 'كل خطوة.',
            description: 'انضم إلى مجتمع مكرس للتميز الأكاديمي والنزاهة الأخلاقية والتعلم مدى الحياة في بيئة داعمة.',
          }
        ],
        aboutEyebrow: 'عن إرثنا',
        aboutHeadingLine1: 'تعزيز التميز',
        aboutHeadingLine2: 'من خلال',
        aboutHeadingHighlight: 'الإيمان والعلم',
        aboutBody: 'مدرسة يهايا الدولية الإسلامية والإنجليزية هي أكثر من مجرد مؤسسة تعليمية؛ إنها مجتمع مكرس لتشكيل التنمية الشاملة لكل طفل. نحن نسد الفجوة بين الأخلاق الإسلامية التقليدية والتعليم الغربي الحديث.',
        aboutCaption: 'مدرسة يهايا الدولية الإسلامية والإنجليزية هي أكثر من مجرد مؤسسة تعليمية',
        aboutStat1Number: 250,
        aboutStat1Suffix: '+',
        aboutStat1Label: 'طالباً',
        aboutStat2Number: 25,
        aboutStat2Suffix: '+',
        aboutStat2Label: 'موظفاً',
        aboutStat3Number: 6,
        aboutStat3Suffix: '+',
        aboutStat3Label: 'سنوات',
        programsEyebrow: 'برامجنا',
        programsTitle: 'استكشف برامجنا',
        programsDescription: 'ساهم في المرافق الحديثة وبيئات التعلم المجهزة بأحدث التقنيات التعليمية. مسارات مصممة لغرس العلم والأخلاق والقيادة.',
        programsLearnMoreText: 'اعرف المزيد',
        quoteAttribution: '— صحيح البخاري وصحيح مسلم',
        quoteText: 'إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى.',
        quoteBookArabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
        quoteBookTranslation: 'وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
        activitiesHeading: 'طلب العلم طريق إلى الخير.',
        activitiesSubtitle: 'كل عمل يحكي قصة - شاهد ما كان يحدث.',
        activitiesCtaText: 'انضم إلينا',
        activitiesCtaUrl: '/gallery',
        activitiesCards: [
          { title: 'أنشطة المسجد' },
          { title: 'الخطابة العامة' },
          { title: 'الفنون والإبداع' },
          { title: 'الرياضة والترفيه' },
        ],
        testimonialsHeading: 'كلمات طيبة من مجتمعنا',
        testimonialsSubtitle: 'استمع إلى الآباء والخريجين وقادة المجتمع الذين شكلوا - وتشكلوا بـ - الحياة في مدرسة يهايا الدولية.',
        testimonials: [
          {
            name: 'ميا طومسون',
            role: 'ولي أمر',
            title: 'تجربة تحويلية لطفلتنا.',
            quote: '"منذ تسجيل ابنتنا في يهايا الدولية، شهدنا نموًا ملحوظًا ليس فقط في أدائها الأكاديمي بل في شخصيتها. إن الدمج السلس للقيم الإسلامية مع التعليم الحديث الصارم هو بالضبط ما كنا نبحث عنه."',
            rating: 5,
          },
          {
            name: 'جيمس ميلر',
            role: 'خريج',
            title: 'إنه يبرز الرضا الأكاديمي، شهادات.',
            quote: '"سنواتي في يهايا الدولية غيرت نظرتي للعالم تمامًا. إن الاهتمام بالتفاصيل في المناهج الدراسية وسهولة الوصول إلى الموجهين سمح لي بالحفاظ على هويتي الإيمانية مع تقديم أداء أكاديمي عالمي المستوى. إنها ليست مجرد مدرسة؛ إنها ميزة تنافسية."',
            rating: 5,
          },
          {
            name: 'أوليفيا كارتر',
            role: 'قائدة مجتمع',
            title: 'مؤسسة مبنية على التميز الحقيقي.',
            quote: '"تُظهر القيادة في يهايا الدولية التزامًا عميقًا بالتميز التعليمي. لقد شهدت بنفسي كيف يربون الطلاب ليصبحوا أفرادًا متكاملين مستعدين لمواجهة التحديات العالمية بنزاهة أخلاقية."',
            rating: 5,
          },
          {
            name: 'ماثيو بينيت',
            role: 'ولي أمر',
            title: 'أفضل قرار اتخذناه.',
            quote: '"لقد قمنا بتقييم العديد من المدارس قبل اختيار يهايا الدولية. المرافق حديثة، والمعلمون مؤهلون تأهيلاً عالياً، والتركيز على كل من الدعوة والعلوم والتكنولوجيا والهندسة والرياضيات يجعلها بيئة فريدة ولا تقدر بثمن لأطفالنا."',
            rating: 5,
          },
        ],
        newsEyebrow: 'الأخبار والفعاليات',
        newsHeading: 'أحدث الأخبار والتحديثات',
        newsDescription: 'ابق على اطلاع دائم بآخر الأحداث والإنجازات الأكاديمية والإعلانات من مدرسة يهايا.',
        newsReadMoreText: 'اقرأ المزيد',
        newsViewAllText: 'عرض كل الأخبار',
        newsViewAllUrl: '/news',
      },
      tr: {
        title: 'YAHAYASCOOL\'a Hoş Geldiniz',
        heroEstablishedText: 'KRL. 2020',
        heroPrimaryCtaText: 'Başvuruyu Başlat',
        heroPrimaryCtaUrl: '/contact',
        heroPhone: '+23188368801',
        heroEmail: 'info@yahayaschool.com',
        heroWhatsapp: '23188368801',
        heroSlides: [
          {
            titlePart1: 'Eğitim, Uygulama',
            titlePart2: 've Savunuculuk.',
            description: 'Yahaya Uluslararası İslam ve İngiliz Okulu, geleneksel İslami değerlerin derinliğini modern uluslararası eğitimin titiz standartlarıyla harmanlayarak, bütünsel öğrenci gelişimi için besleyici bir ortam sağlar.',
          },
          {
            titlePart1: 'Zihinleri Beslemek,',
            titlePart2: 'Geleceği İnşa Etmek.',
            description: 'Kapsamlı müfredatımız, öğrencilere zihinsel olarak meydan okumak ve aynı zamanda duygusal ve ruhsal esenliklerini desteklemek için tasarlanmıştır.',
          },
          {
            titlePart1: 'Her Adımda',
            titlePart2: 'Mükemmellik.',
            description: 'Destekleyici bir ortamda akademik mükemmellik, ahlaki bütünlük ve yaşam boyu öğrenmeye adanmış bir topluluğa katılın.',
          }
        ],
        aboutEyebrow: 'Mirasımız Hakkında',
        aboutHeadingLine1: 'Mükemmelliği Teşvik Etmek',
        aboutHeadingLine2: 'Yoluyla',
        aboutHeadingHighlight: 'İnanç ve Bilim',
        aboutBody: 'Yahaya Uluslararası İslami ve İngiliz Lisesi sadece bir eğitim kurumu olmaktan öte; her çocuğun bütünsel gelişimini şekillendirmeye adanmış bir topluluktur. Geleneksel İslami ahlak ile modern Batı eğitimi arasındaki boşluğu kapatıyoruz.',
        aboutCaption: 'Yahaya Uluslararası İslami ve İngiliz Lisesi sadece bir eğitim kurumu değildir',
        aboutStat1Number: 250,
        aboutStat1Suffix: '+',
        aboutStat1Label: 'Öğrenci',
        aboutStat2Number: 25,
        aboutStat2Suffix: '+',
        aboutStat2Label: 'Çalışan',
        aboutStat3Number: 6,
        aboutStat3Suffix: '+',
        aboutStat3Label: 'Yıl',
        programsEyebrow: 'Programlarımız',
        programsTitle: 'Programlarımızı Keşfedin',
        programsDescription: 'En son eğitim teknolojileriyle donatılmış modern tesislere ve öğrenme ortamlarına katkıda bulunun. Bursiyerlik, karakter ve liderlik geliştirmek için tasarlanmış yollar.',
        programsLearnMoreText: 'Daha Fazla Bilgi',
        quoteAttribution: '— Sahih-i Buhari ve Sahih-i Müslim',
        quoteText: 'Ameller ancak niyetlere göredir ve herkese sadece niyet ettiği şey vardır.',
        quoteBookArabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
        quoteBookTranslation: 've herkese sadece niyet ettiği şey vardır',
        activitiesHeading: 'İlim aramak iyiliğe giden bir yoldur.',
        activitiesSubtitle: 'Her eylem bir hikaye anlatır - neler olup bittiğini görün.',
        activitiesCtaText: 'Bize katılın',
        activitiesCtaUrl: '/gallery',
        activitiesCards: [
          { title: 'Cami Etkinlikleri' },
          { title: 'Topluluk Önünde Konuşma' },
          { title: 'Sanat ve Yaratıcılık' },
          { title: 'Spor ve Rekreasyon' },
        ],
        testimonialsHeading: 'Topluluğumuzdan Nazik Sözler',
        testimonialsSubtitle: 'Yahaya International\'da yaşamı şekillendiren — ve yaşam tarafından şekillendirilen — ebeveynlerden, mezunlardan ve toplum liderlerinden dinleyin.',
        testimonials: [
          {
            name: 'Mia Thompson',
            role: 'VELİ',
            title: 'Çocuğumuz için dönüştürücü bir deneyim.',
            quote: '"Kızımızı Yahaya International\'a kaydettirdiğimizden beri, sadece akademik performansında değil, karakterinde de dikkate değer bir büyüme gördük. İslami değerlerin titiz modern eğitimle kusursuz entegrasyonu tam olarak aradığımız şeydi."',
            rating: 5,
          },
          {
            name: 'James Miller',
            role: 'MEZUN',
            title: 'Akademik memnuniyeti, referansları vurgular.',
            quote: '"Yahaya International\'daki yıllarım dünya görüşümü tamamen değiştirdi. Müfredattaki detaylara verilen önem ve mentorlara erişim kolaylığı, dünya standartlarında akademik performans sunarken inanç kimliğimi korumamı sağladı. Bu sadece bir okul değil; rekabet avantajı."',
            rating: 5,
          },
          {
            name: 'Olivia Carter',
            role: 'TOPLUM LİDERİ',
            title: 'Gerçek mükemmellik üzerine inşa edilmiş bir kurum.',
            quote: '"Yahaya International\'daki liderlik, eğitim mükemmelliğine derin bir bağlılık göstermektedir. Öğrencileri ahlaki dürüstlükle küresel zorluklarla başa çıkmaya hazır çok yönlü bireyler olarak nasıl yetiştirdiklerine ilk elden tanık oldum."',
            rating: 5,
          },
          {
            name: 'Matthew Bennett',
            role: 'VELİ',
            title: 'Verdiğimiz en iyi karar.',
            quote: '"Yahaya International\'ı seçmeden önce birçok okulu değerlendirdik. Tesisler modern, öğretmenler son derece kalifiye ve hem Da\'wah hem de STEM\'e verilen önem burayı çocuklarımız için eşsiz ve paha biçilmez bir ortam haline getiriyor."',
            rating: 5,
          },
        ],
        newsEyebrow: 'Haberler & Etkinlikler',
        newsHeading: 'En Son Haberler & Güncellemeler',
        newsDescription: 'Yahaya School\'dan en son gelişmeler, akademik başarılar ve duyurulardan haberdar olun.',
        newsReadMoreText: 'Daha Fazla Oku',
        newsViewAllText: 'Tüm Haberleri Görüntüle',
        newsViewAllUrl: '/news',
      },
      fr: {
        title: 'Bienvenue à YAHAYASCOOL',
        heroEstablishedText: 'EST. 2020',
        heroPrimaryCtaText: 'Commencer l\'inscription',
        heroPrimaryCtaUrl: '/contact',
        heroPhone: '+23188368801',
        heroEmail: 'info@yahayaschool.com',
        heroWhatsapp: '23188368801',
        heroSlides: [
          {
            titlePart1: 'Éducation, Pratique',
            titlePart2: 'et Plaidoyer.',
            description: 'L\'école internationale islamique et anglaise Yahaya allie la profondeur des valeurs islamiques traditionnelles aux normes rigoureuses de l\'éducation internationale moderne, favorisant un environnement stimulant pour la croissance globale des élèves.',
          },
          {
            titlePart1: 'Nourrir les esprits,',
            titlePart2: 'Construire l\'avenir.',
            description: 'Notre programme complet est conçu pour stimuler intellectuellement les étudiants tout en soutenant leur bien-être émotionnel et spirituel.',
          },
          {
            titlePart1: 'L\'excellence à',
            titlePart2: 'chaque étape.',
            description: 'Rejoignez une communauté dédiée à l\'excellence académique, à l\'intégrité morale et à l\'apprentissage tout au long de la vie dans un environnement favorable.',
          }
        ],
        aboutEyebrow: 'Notre Héritage',
        aboutHeadingLine1: 'Promouvoir l\'Excellence',
        aboutHeadingLine2: 'À Travers',
        aboutHeadingHighlight: 'la Foi et la Science',
        aboutBody: 'L\'école secondaire internationale islamique et anglaise Yahaya est plus qu\'une simple institution éducative ; c\'est une communauté dédiée au développement holistique de chaque enfant. Nous comblons le fossé entre l\'éthique islamique traditionnelle et l\'éducation occidentale moderne.',
        aboutCaption: 'L\'école secondaire internationale islamique et anglaise Yahaya est plus qu\'une simple institution éducative',
        aboutStat1Number: 250,
        aboutStat1Suffix: '+',
        aboutStat1Label: 'Élèves',
        aboutStat2Number: 25,
        aboutStat2Suffix: '+',
        aboutStat2Label: 'Employés',
        aboutStat3Number: 6,
        aboutStat3Suffix: '+',
        aboutStat3Label: 'Années',
        programsEyebrow: 'Nos Programmes',
        programsTitle: 'Explorez Nos Programmes',
        programsDescription: 'Contribuez à des installations modernes et à des environnements d\'apprentissage équipés des dernières technologies éducatives. Des parcours conçus pour cultiver le savoir, le caractère et le leadership.',
        programsLearnMoreText: 'En Savoir Plus',
        quoteAttribution: '— Sahih al-Bukhari et Sahih Muslim',
        quoteText: 'Les actions ne valent que par leurs intentions, et chacun n\'aura que ce qu\'il a eu l\'intention de faire.',
        quoteBookArabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
        quoteBookTranslation: 'et chacun n\'aura que ce qu\'il a eu l\'intention de faire',
        activitiesHeading: 'La recherche de la connaissance est un chemin vers le bien.',
        activitiesSubtitle: 'Chaque action raconte une histoire - découvrez ce qui s\'est passé.',
        activitiesCtaText: 'Rejoignez-nous',
        activitiesCtaUrl: '/gallery',
        activitiesCards: [
          { title: 'Activités de la Mosquée' },
          { title: 'Prise de Parole en Public' },
          { title: 'Arts et Créativité' },
          { title: 'Sports et Loisirs' },
        ],
        testimonialsHeading: 'Mots Gentils de Notre Communauté',
        testimonialsSubtitle: 'Écoutez les parents, les anciens élèves et les dirigeants communautaires qui ont façonné — et été façonnés par — la vie à Yahaya International.',
        testimonials: [
          {
            name: 'Mia Thompson',
            role: 'PARENT',
            title: 'Une expérience transformatrice pour notre enfant.',
            quote: '"Depuis l\'inscription de notre fille à Yahaya International, nous avons constaté une croissance remarquable non seulement dans ses résultats académiques, mais aussi dans son caractère. L\'intégration harmonieuse des valeurs islamiques avec une éducation moderne rigoureuse est exactement ce que nous recherchions."',
            rating: 5,
          },
          {
            name: 'James Miller',
            role: 'ANCIEN ÉLÈVE',
            title: 'Cela souligne la satisfaction académique, témoignages.',
            quote: '"Mes années à Yahaya International ont complètement transformé ma vision du monde. L\'attention portée aux détails dans le programme et la facilité d\'accès aux mentors m\'ont permis de maintenir mon identité de foi tout en offrant des performances académiques de classe mondiale. Ce n\'est pas seulement une école ; c\'est un avantage concurrentiel."',
            rating: 5,
          },
          {
            name: 'Olivia Carter',
            role: 'LEADER COMMUNAUTAIRE',
            title: 'Une institution bâtie sur la véritable excellence.',
            quote: '"La direction de Yahaya International fait preuve d\'un profond engagement envers l\'excellence éducative. J\'ai été témoin de première main de la façon dont ils nourrissent les élèves pour en faire des individus équilibrés prêts à relever des défis mondiaux avec une intégrité morale."',
            rating: 5,
          },
          {
            name: 'Matthew Bennett',
            role: 'PARENT',
            title: 'La meilleure décision que nous ayons prise.',
            quote: '"Nous avons évalué de nombreuses écoles avant de choisir Yahaya International. Les installations sont modernes, les enseignants sont hautement qualifiés, et l\'accent mis à la fois sur la Da\'wah et les STEM en fait un environnement unique et inestimable pour nos enfants."',
            rating: 5,
          },
        ],
        newsEyebrow: 'Actualités & Événements',
        newsHeading: 'Dernières Actualités & Mises à jour',
        newsDescription: 'Restez informé des derniers événements, des jalons académiques et des annonces de l\'école Yahaya.',
        newsReadMoreText: 'En Savoir Plus',
        newsViewAllText: 'Voir Toutes les Actualités',
        newsViewAllUrl: '/news',
      }
    };

    let homepageDocId: string | null = null;
    const docService = (strapi as any).documents ? (strapi as any).documents('api::homepage.homepage') : null;

    if (docService) {
      const existingEntries = await docService.findMany({ locale: '*' });
      if (existingEntries && existingEntries.length > 0) {
        homepageDocId = existingEntries[0].documentId;
      }
    }

    const buildPayload = (loc: string) => {
      const d = LOCALES_DATA[loc] || LOCALES_DATA.en;
      return {
        title: d.title,
        heroEstablishedText: d.heroEstablishedText,
        heroPrimaryCtaText: d.heroPrimaryCtaText,
        heroPrimaryCtaUrl: d.heroPrimaryCtaUrl,
        heroPhone: d.heroPhone,
        heroEmail: d.heroEmail,
        heroWhatsapp: d.heroWhatsapp,
        heroSlides: [
          {
            titlePart1: d.heroSlides[0].titlePart1,
            titlePart2: d.heroSlides[0].titlePart2,
            description: d.heroSlides[0].description,
            image: img19,
          },
          {
            titlePart1: d.heroSlides[1].titlePart1,
            titlePart2: d.heroSlides[1].titlePart2,
            description: d.heroSlides[1].description,
            image: imgSlide2 || imgHero01,
          },
          {
            titlePart1: d.heroSlides[2].titlePart1,
            titlePart2: d.heroSlides[2].titlePart2,
            description: d.heroSlides[2].description,
            image: img17,
          },
        ],
        aboutEyebrow: d.aboutEyebrow,
        aboutHeadingLine1: d.aboutHeadingLine1,
        aboutHeadingLine2: d.aboutHeadingLine2,
        aboutHeadingHighlight: d.aboutHeadingHighlight,
        aboutBody: d.aboutBody,
        aboutImage: imgAbout,
        aboutCaption: d.aboutCaption,
        aboutStat1Number: d.aboutStat1Number,
        aboutStat1Suffix: d.aboutStat1Suffix,
        aboutStat1Label: d.aboutStat1Label,
        aboutStat2Number: d.aboutStat2Number,
        aboutStat2Suffix: d.aboutStat2Suffix,
        aboutStat2Label: d.aboutStat2Label,
        aboutStat3Number: d.aboutStat3Number,
        aboutStat3Suffix: d.aboutStat3Suffix,
        aboutStat3Label: d.aboutStat3Label,
        programsEyebrow: d.programsEyebrow,
        programsTitle: d.programsTitle,
        programsDescription: d.programsDescription,
        programsLearnMoreText: d.programsLearnMoreText,
        quoteAttribution: d.quoteAttribution,
        quoteText: d.quoteText,
        quoteBookArabic: d.quoteBookArabic,
        quoteBookTranslation: d.quoteBookTranslation,
        activitiesHeading: d.activitiesHeading,
        activitiesSubtitle: d.activitiesSubtitle,
        activitiesCenterImage: img19,
        activitiesCtaText: d.activitiesCtaText,
        activitiesCtaUrl: d.activitiesCtaUrl,
        activitiesCards: [
          { title: d.activitiesCards[0].title, image: img09 },
          { title: d.activitiesCards[1].title, image: img17 },
          { title: d.activitiesCards[2].title, image: img07 },
          { title: d.activitiesCards[3].title, image: img13 },
        ],
        testimonialsHeading: d.testimonialsHeading,
        testimonialsSubtitle: d.testimonialsSubtitle,
        testimonials: [
          { ...d.testimonials[0], image: imgHero01 },
          { ...d.testimonials[1], image: imgNews20 },
          { ...d.testimonials[2], image: imgProg04 },
          { ...d.testimonials[3], image: imgAct08 },
        ],
        newsEyebrow: d.newsEyebrow,
        newsHeading: d.newsHeading,
        newsDescription: d.newsDescription,
        newsReadMoreText: d.newsReadMoreText,
        newsViewAllText: d.newsViewAllText,
        newsViewAllUrl: d.newsViewAllUrl,
        seo: {
          metaTitle: d.title,
          metaDescription: d.aboutBody ? d.aboutBody.slice(0, 160) : '',
        },
        publishedAt: new Date().toISOString(),
      };
    };

    if (docService) {
      if (!homepageDocId) {
        strapi.log.info('[YAHAYASCOOL] Seeding Homepage (EN)...');
        const enCreated = await docService.create({
          locale: 'en',
          data: buildPayload('en'),
        });
        homepageDocId = enCreated.documentId;
        await docService.publish({
          documentId: homepageDocId,
          locale: 'en',
        });
        strapi.log.info('[YAHAYASCOOL] Homepage (EN) created and published!');
      }

      const otherLocales = ['ar', 'tr', 'fr'];
      for (const loc of otherLocales) {
        try {
          const locExisting = await docService.findOne({
            documentId: homepageDocId,
            locale: loc,
          });
          if (!locExisting) {
            strapi.log.info(`[YAHAYASCOOL] Seeding Homepage (${loc})...`);
            await docService.update({
              documentId: homepageDocId,
              locale: loc,
              data: buildPayload(loc),
            });
            await docService.publish({
              documentId: homepageDocId,
              locale: loc,
            });
            strapi.log.info(`[YAHAYASCOOL] Homepage (${loc}) created and published!`);
          }
        } catch (locErr: any) {
          strapi.log.warn(`[YAHAYASCOOL] Error seeding Homepage (${loc}): ${locErr.message}`);
        }
      }
    }

    try {
      await strapi.db.connection.raw(`
        INSERT OR IGNORE INTO files_related_morphs (file_id, related_id, related_type, field, "order")
        SELECT f.file_id, p_pub.id, f.related_type, f.field, f."order"
        FROM files_related_morphs f
        JOIN homepages p_draft ON f.related_id = p_draft.id AND f.related_type = 'api::homepage.homepage'
        JOIN homepages p_pub ON p_pub.document_id = p_draft.document_id AND p_pub.published_at IS NOT NULL
        WHERE p_draft.published_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM files_related_morphs existing
            WHERE existing.related_id = p_pub.id
              AND existing.related_type = f.related_type
              AND existing.field = f.field
          );
      `);
    } catch (e: any) {}

    try {
      const homepageConfigKey = 'plugin_content_manager_configuration_content_types::api::homepage.homepage';
      const existingConfig = await strapi.db.query('strapi::core-store').findOne({ where: { key: homepageConfigKey } });
      const homepageConfigValue = {
        settings: {
          bulkable: true,
          filterable: true,
          searchable: true,
          pageSize: 10,
          relationOpenMode: 'modal',
          mainField: 'title',
          defaultSortBy: 'title',
          defaultSortOrder: 'ASC'
        },
        metadatas: {
          id: { edit: {}, list: { label: 'id', searchable: true, sortable: true } },
          title: { edit: { label: 'Page Title', visible: true, editable: true }, list: { label: 'Title', searchable: true, sortable: true } },
          seo: { edit: { label: 'SEO Metadata', visible: true, editable: true } },
          heroSlides: { edit: { label: 'Hero Slides Carousel (3 Slides)', visible: true, editable: true } },
          heroEstablishedText: { edit: { label: 'Hero Established Label (e.g. EST. 2020)', visible: true, editable: true } },
          heroPrimaryCtaText: { edit: { label: 'Hero Primary CTA Text', visible: true, editable: true } },
          heroPrimaryCtaUrl: { edit: { label: 'Hero Primary CTA URL', visible: true, editable: true } },
          heroPhone: { edit: { label: 'Quick Contact Phone', visible: true, editable: true } },
          heroEmail: { edit: { label: 'Quick Contact Email', visible: true, editable: true } },
          heroWhatsapp: { edit: { label: 'Quick Contact WhatsApp', visible: true, editable: true } },
          aboutEyebrow: { edit: { label: 'About Section Eyebrow', visible: true, editable: true } },
          aboutHeadingLine1: { edit: { label: 'About Heading Line 1', visible: true, editable: true } },
          aboutHeadingLine2: { edit: { label: 'About Heading Line 2', visible: true, editable: true } },
          aboutHeadingHighlight: { edit: { label: 'About Heading Highlight (Blue)', visible: true, editable: true } },
          aboutBody: { edit: { label: 'About Body Description', visible: true, editable: true } },
          aboutImage: { edit: { label: 'About Section Photo', visible: true, editable: true } },
          aboutCaption: { edit: { label: 'About Photo Caption Card', visible: true, editable: true } },
          aboutStat1Number: { edit: { label: 'Stat 1: Number', visible: true, editable: true } },
          aboutStat1Suffix: { edit: { label: 'Stat 1: Suffix (+)', visible: true, editable: true } },
          aboutStat1Label: { edit: { label: 'Stat 1: Label', visible: true, editable: true } },
          aboutStat2Number: { edit: { label: 'Stat 2: Number', visible: true, editable: true } },
          aboutStat2Suffix: { edit: { label: 'Stat 2: Suffix (+)', visible: true, editable: true } },
          aboutStat2Label: { edit: { label: 'Stat 2: Label', visible: true, editable: true } },
          aboutStat3Number: { edit: { label: 'Stat 3: Number', visible: true, editable: true } },
          aboutStat3Suffix: { edit: { label: 'Stat 3: Suffix (+)', visible: true, editable: true } },
          aboutStat3Label: { edit: { label: 'Stat 3: Label', visible: true, editable: true } },
          programsEyebrow: { edit: { label: 'Programs Section Eyebrow', visible: true, editable: true } },
          programsTitle: { edit: { label: 'Programs Section Title', visible: true, editable: true } },
          programsDescription: { edit: { label: 'Programs Section Description', visible: true, editable: true } },
          programsLearnMoreText: { edit: { label: 'Programs Learn More Button', visible: true, editable: true } },
          quoteAttribution: { edit: { label: 'Hadith Attribution (e.g. Sahih al-Bukhari)', visible: true, editable: true } },
          quoteText: { edit: { label: 'Hadith Quote (Animated Fill)', visible: true, editable: true } },
          quoteBookArabic: { edit: { label: '3D Book Arabic Text', visible: true, editable: true } },
          quoteBookTranslation: { edit: { label: '3D Book Translation Text', visible: true, editable: true } },
          activitiesHeading: { edit: { label: 'Activities Section Heading', visible: true, editable: true } },
          activitiesSubtitle: { edit: { label: 'Activities Section Subtitle', visible: true, editable: true } },
          activitiesCenterImage: { edit: { label: 'Activities Center Hero Image', visible: true, editable: true } },
          activitiesCtaText: { edit: { label: 'Activities CTA Button Text', visible: true, editable: true } },
          activitiesCtaUrl: { edit: { label: 'Activities CTA URL', visible: true, editable: true } },
          activitiesCards: { edit: { label: 'Activity Cards (4 Cards)', visible: true, editable: true } },
          testimonialsHeading: { edit: { label: 'Testimonials Section Heading', visible: true, editable: true } },
          testimonialsSubtitle: { edit: { label: 'Testimonials Section Subtitle', visible: true, editable: true } },
          testimonials: { edit: { label: 'Community Testimonials (Tabs & Slider)', visible: true, editable: true } },
          newsEyebrow: { edit: { label: 'News Section Eyebrow', visible: true, editable: true } },
          newsHeading: { edit: { label: 'News Section Heading', visible: true, editable: true } },
          newsDescription: { edit: { label: 'News Section Description', visible: true, editable: true } },
          newsReadMoreText: { edit: { label: 'News Read More Button Text', visible: true, editable: true } },
          newsViewAllText: { edit: { label: 'News View All Button Text', visible: true, editable: true } },
          newsViewAllUrl: { edit: { label: 'News View All URL', visible: true, editable: true } }
        },
        layouts: {
          list: ['id', 'title'],
          edit: [
            [{ name: 'title', size: 6 }, { name: 'seo', size: 6 }],
            [{ name: 'heroSlides', size: 12 }],
            [{ name: 'heroEstablishedText', size: 4 }, { name: 'heroPrimaryCtaText', size: 4 }, { name: 'heroPrimaryCtaUrl', size: 4 }],
            [{ name: 'heroPhone', size: 4 }, { name: 'heroEmail', size: 4 }, { name: 'heroWhatsapp', size: 4 }],
            [{ name: 'aboutEyebrow', size: 12 }],
            [{ name: 'aboutHeadingLine1', size: 4 }, { name: 'aboutHeadingLine2', size: 4 }, { name: 'aboutHeadingHighlight', size: 4 }],
            [{ name: 'aboutBody', size: 12 }],
            [{ name: 'aboutImage', size: 6 }, { name: 'aboutCaption', size: 6 }],
            [{ name: 'aboutStat1Number', size: 2 }, { name: 'aboutStat1Suffix', size: 2 }, { name: 'aboutStat1Label', size: 8 }],
            [{ name: 'aboutStat2Number', size: 2 }, { name: 'aboutStat2Suffix', size: 2 }, { name: 'aboutStat2Label', size: 8 }],
            [{ name: 'aboutStat3Number', size: 2 }, { name: 'aboutStat3Suffix', size: 2 }, { name: 'aboutStat3Label', size: 8 }],
            [{ name: 'programsEyebrow', size: 6 }, { name: 'programsTitle', size: 6 }],
            [{ name: 'programsDescription', size: 8 }, { name: 'programsLearnMoreText', size: 4 }],
            [{ name: 'quoteAttribution', size: 12 }],
            [{ name: 'quoteText', size: 12 }],
            [{ name: 'quoteBookArabic', size: 6 }, { name: 'quoteBookTranslation', size: 6 }],
            [{ name: 'activitiesHeading', size: 6 }, { name: 'activitiesSubtitle', size: 6 }],
            [{ name: 'activitiesCenterImage', size: 6 }, { name: 'activitiesCtaText', size: 3 }, { name: 'activitiesCtaUrl', size: 3 }],
            [{ name: 'activitiesCards', size: 12 }],
            [{ name: 'testimonialsHeading', size: 6 }, { name: 'testimonialsSubtitle', size: 6 }],
            [{ name: 'testimonials', size: 12 }],
            [{ name: 'newsEyebrow', size: 6 }, { name: 'newsHeading', size: 6 }],
            [{ name: 'newsDescription', size: 12 }],
            [{ name: 'newsReadMoreText', size: 4 }, { name: 'newsViewAllText', size: 4 }, { name: 'newsViewAllUrl', size: 4 }]
          ]
        }
      };

      if (existingConfig) {
        await strapi.db.query('strapi::core-store').update({
          where: { key: homepageConfigKey },
          data: { value: JSON.stringify(homepageConfigValue) }
        });
      } else {
        await strapi.db.query('strapi::core-store').create({
          data: {
            key: homepageConfigKey,
            value: JSON.stringify(homepageConfigValue),
            type: 'plugin_content_manager_configuration',
            environment: null,
            tag: null
          }
        });
      }
      strapi.log.info('[YAHAYASCOOL] Content Manager layout for homepage configured!');
    } catch (e: any) {
      strapi.log.warn('[YAHAYASCOOL] Failed to set homepage layout configs: ' + e.message);
    }
  } catch (err: any) {
    strapi.log.error('[YAHAYASCOOL] Failed to seed homepage:', err.message);
  }
}

async function seedLoginPage(strapi: Core.Strapi) {
  try {
    const getOrUploadImage = async (relPath: string) => {
      const imagePath = path.resolve(process.cwd(), '../frontend/public', relPath.replace(/^\//, ''));
      if (!fs.existsSync(imagePath)) return null;
      const fileName = path.basename(imagePath);
      try {
        const existing = await (strapi.entityService as any).findMany('plugin::upload.file', {
          filters: { name: { $eq: fileName } }
        });
        if (existing && existing.length > 0) {
          return existing[0].id;
        }
        const stat = fs.statSync(imagePath);
        const ext = path.extname(imagePath).toLowerCase();
        const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
        const uploadedFiles = await strapi.plugin('upload').service('upload').upload({
          data: {},
          files: {
            path: imagePath,
            filepath: imagePath,
            name: fileName,
            originalFilename: fileName,
            type: mime,
            mimetype: mime,
            size: stat.size,
          },
        });
        return uploadedFiles?.[0]?.id || null;
      } catch (e: any) {
        strapi.log.warn(`[YAHAYASCOOL] getOrUploadImage (${relPath}) failed: ${e.message}`);
        return null;
      }
    };

    const logoId = (await getOrUploadImage('yahaya-logo.jpeg')) || (await getOrUploadImage('headerlogo.png'));

    const LOCALES_DATA: Record<string, any> = {
      en: {
        title: 'Portal Sign In - YAHAYASCOOL',
        schoolName: 'Yahaya International Islamic',
        schoolNameHighlight: 'and English High School',
        tagline: 'Empowering minds through Islamic values and modern education.',
        features: [
          { icon: 'Shield', text: 'Secure & Role-Based Access Control' },
          { icon: 'BookOpen', text: 'Complete School Management Suite' },
          { icon: 'Globe', text: 'Multilingual: English · العربية · Français · Türkçe' },
        ],
        signInTitle: 'Welcome Back',
        signInSubtitle: 'Sign in to your YAHAYASCOOL account',
        identifierLabel: 'Email Address',
        identifierPlaceholder: 'admin@yahayascool.edu.ng',
        passwordLabel: 'Password',
        passwordPlaceholder: '••••••••',
        rememberMeText: 'Remember me',
        forgotPasswordText: 'Forgot password?',
        loginButtonText: 'Sign In',
        versionText: 'YAHAYASCOOL v1.0',
        copyrightText: '© 2026 Yahaya International Islamic and English High School. All rights reserved.',
        backToHomeText: 'Back to Website',
      },
      ar: {
        title: 'تسجيل الدخول إلى البوابة - يهايا سكول',
        schoolName: 'مدرسة يحيى الدولية الإسلامية',
        schoolNameHighlight: 'والثانوية الإنجليزية',
        tagline: 'تمكين العقول عبر القيم الإسلامية والتعليم العصري المتميز.',
        features: [
          { icon: 'Shield', text: 'نظام أمان متقدم وصلاحيات دخول حسب الأدوار' },
          { icon: 'BookOpen', text: 'منظومة إدارية وأكاديمية متكاملة للمدرسة' },
          { icon: 'Globe', text: 'متعدد اللغات: English · العربية · Français · Türkçe' },
        ],
        signInTitle: 'مرحباً بعودتك',
        signInSubtitle: 'سجل الدخول للوصول إلى بوابتك التعليمية والإدارية',
        identifierLabel: 'البريد الإلكتروني',
        identifierPlaceholder: 'admin@yahayascool.edu.ng',
        passwordLabel: 'كلمة المرور',
        passwordPlaceholder: '••••••••',
        rememberMeText: 'تذكرني',
        forgotPasswordText: 'نسيت كلمة المرور؟',
        loginButtonText: 'تسجيل الدخول',
        versionText: 'YAHAYASCOOL v1.0',
        copyrightText: '© 2026 مدرسة يحيى الدولية الإسلامية والإنجليزية. جميع الحقوق محفوظة.',
        backToHomeText: 'العودة إلى الموقع الرئيسي',
      },
      tr: {
        title: 'Portal Girişi - YAHAYASCOOL',
        schoolName: 'Yahaya Uluslararası İslami',
        schoolNameHighlight: 've İngiliz Lisesi',
        tagline: 'İslami değerler ve çağdaş eğitimle zihinleri geleceğe hazırlıyoruz.',
        features: [
          { icon: 'Shield', text: 'Güvenli ve Role Dayalı Erişim Kontrolü' },
          { icon: 'BookOpen', text: 'Kapsamlı Okul Yönetim Sistemi' },
          { icon: 'Globe', text: 'Çok Dilli: English · العربية · Français · Türkçe' },
        ],
        signInTitle: 'Tekrar Hoş Geldiniz',
        signInSubtitle: 'Portalınıza erişmek için bilgilerinizi giriniz',
        identifierLabel: 'E-posta Adresi',
        identifierPlaceholder: 'admin@yahayascool.edu.ng',
        passwordLabel: 'Şifre',
        passwordPlaceholder: '••••••••',
        rememberMeText: 'Beni hatırla',
        forgotPasswordText: 'Şifremi unuttum',
        loginButtonText: 'Giriş Yap',
        versionText: 'YAHAYASCOOL v1.0',
        copyrightText: '© 2026 Yahaya Uluslararası İslami ve İngiliz Lisesi. Tüm hakları saklıdır.',
        backToHomeText: 'Ana Sayfaya Dön',
      },
      fr: {
        title: 'Connexion au Portail - YAHAYASCOOL',
        schoolName: 'Lycée International Islamique',
        schoolNameHighlight: 'et Anglais Yahaya',
        tagline: 'Éveiller les esprits par les valeurs islamiques et l\'excellence académique.',
        features: [
          { icon: 'Shield', text: 'Accès sécurisé et contrôle basé sur les rôles' },
          { icon: 'BookOpen', text: 'Suite complète de gestion scolaire' },
          { icon: 'Globe', text: 'Multilingue: English · العربية · Français · Türkçe' },
        ],
        signInTitle: 'Bienvenue',
        signInSubtitle: 'Connectez-vous pour accéder à votre portail',
        identifierLabel: 'Adresse Email',
        identifierPlaceholder: 'admin@yahayascool.edu.ng',
        passwordLabel: 'Mot de passe',
        passwordPlaceholder: '••••••••',
        rememberMeText: 'Se souvenir de moi',
        forgotPasswordText: 'Mot de passe oublié ?',
        loginButtonText: 'Se connecter',
        versionText: 'YAHAYASCOOL v1.0',
        copyrightText: '© 2026 Lycée International Islamique et Anglais Yahaya. Tous droits réservés.',
        backToHomeText: 'Retour au site',
      },
    };

    let loginDocId: string | null = null;
    const docService = (strapi as any).documents ? (strapi as any).documents('api::login-page.login-page') : null;

    if (docService) {
      const existingEntries = await docService.findMany({ locale: '*' });
      if (existingEntries && existingEntries.length > 0) {
        loginDocId = existingEntries[0].documentId;
      }
    }

    const buildPayload = (loc: string) => {
      const d = LOCALES_DATA[loc] || LOCALES_DATA.en;
      return {
        title: d.title,
        badgeLogo: logoId,
        schoolName: d.schoolName,
        schoolNameHighlight: d.schoolNameHighlight,
        tagline: d.tagline,
        features: d.features,
        signInTitle: d.signInTitle,
        signInSubtitle: d.signInSubtitle,
        identifierLabel: d.identifierLabel,
        identifierPlaceholder: d.identifierPlaceholder,
        passwordLabel: d.passwordLabel,
        passwordPlaceholder: d.passwordPlaceholder,
        rememberMeText: d.rememberMeText,
        forgotPasswordText: d.forgotPasswordText,
        loginButtonText: d.loginButtonText,
        versionText: d.versionText,
        copyrightText: d.copyrightText,
        backToHomeText: d.backToHomeText,
        seo: {
          metaTitle: d.title,
          metaDescription: d.tagline,
        },
        publishedAt: new Date().toISOString(),
      };
    };

    if (docService) {
      if (!loginDocId) {
        strapi.log.info('[YAHAYASCOOL] Seeding Login Page (EN)...');
        const enCreated = await docService.create({
          locale: 'en',
          data: buildPayload('en'),
        });
        loginDocId = enCreated.documentId;
        await docService.publish({
          documentId: loginDocId,
          locale: 'en',
        });
        strapi.log.info('[YAHAYASCOOL] Login Page (EN) created and published!');
      }

      const otherLocales = ['ar', 'tr', 'fr'];
      for (const loc of otherLocales) {
        try {
          const locExisting = await docService.findOne({
            documentId: loginDocId,
            locale: loc,
          });
          if (!locExisting) {
            strapi.log.info(`[YAHAYASCOOL] Seeding Login Page (${loc})...`);
            await docService.update({
              documentId: loginDocId,
              locale: loc,
              data: buildPayload(loc),
            });
            await docService.publish({
              documentId: loginDocId,
              locale: loc,
            });
            strapi.log.info(`[YAHAYASCOOL] Login Page (${loc}) created and published!`);
          }
        } catch (locErr: any) {
          strapi.log.warn(`[YAHAYASCOOL] Error seeding Login Page (${loc}): ${locErr.message}`);
        }
      }
    }

    try {
      const loginConfigKey = 'plugin_content_manager_configuration_content_types::api::login-page.login-page';
      const existingConfig = await strapi.db.query('strapi::core-store').findOne({ where: { key: loginConfigKey } });
      const loginConfigValue = {
        settings: {
          bulkable: true,
          filterable: true,
          searchable: true,
          pageSize: 10,
          relationOpenMode: 'modal',
          mainField: 'title',
          defaultSortBy: 'title',
          defaultSortOrder: 'ASC'
        },
        metadatas: {
          id: { edit: {}, list: { label: 'id', searchable: true, sortable: true } },
          title: { edit: { label: 'Page Title', visible: true, editable: true }, list: { label: 'Title', searchable: true, sortable: true } },
          seo: { edit: { label: 'SEO Metadata', visible: true, editable: true } },
          badgeLogo: { edit: { label: 'School Crest Logo Badge', visible: true, editable: true } },
          schoolName: { edit: { label: 'Branding: School Name', visible: true, editable: true } },
          schoolNameHighlight: { edit: { label: 'Branding: Highlighted Suffix', visible: true, editable: true } },
          tagline: { edit: { label: 'Branding: Tagline / Description', visible: true, editable: true } },
          features: { edit: { label: 'Branding: Feature Badges (3 items)', visible: true, editable: true } },
          signInTitle: { edit: { label: 'Form: Sign-in Heading', visible: true, editable: true } },
          signInSubtitle: { edit: { label: 'Form: Sign-in Subtitle', visible: true, editable: true } },
          identifierLabel: { edit: { label: 'Form: Identifier / Email Label', visible: true, editable: true } },
          identifierPlaceholder: { edit: { label: 'Form: Identifier Placeholder', visible: true, editable: true } },
          passwordLabel: { edit: { label: 'Form: Password Label', visible: true, editable: true } },
          passwordPlaceholder: { edit: { label: 'Form: Password Placeholder', visible: true, editable: true } },
          rememberMeText: { edit: { label: 'Form: Remember Me Checkbox Label', visible: true, editable: true } },
          forgotPasswordText: { edit: { label: 'Form: Forgot Password Link Text', visible: true, editable: true } },
          loginButtonText: { edit: { label: 'Form: Submit Button Text', visible: true, editable: true } },
          backToHomeText: { edit: { label: 'Navigation: Back to Website Button Text', visible: true, editable: true } },
          versionText: { edit: { label: 'Footer: Version Label', visible: true, editable: true } },
          copyrightText: { edit: { label: 'Footer: Copyright Notice', visible: true, editable: true } }
        },
        layouts: {
          list: ['id', 'title'],
          edit: [
            [{ name: 'title', size: 6 }, { name: 'seo', size: 6 }],
            [{ name: 'badgeLogo', size: 12 }],
            [{ name: 'schoolName', size: 6 }, { name: 'schoolNameHighlight', size: 6 }],
            [{ name: 'tagline', size: 12 }],
            [{ name: 'features', size: 12 }],
            [{ name: 'signInTitle', size: 6 }, { name: 'signInSubtitle', size: 6 }],
            [{ name: 'identifierLabel', size: 6 }, { name: 'identifierPlaceholder', size: 6 }],
            [{ name: 'passwordLabel', size: 6 }, { name: 'passwordPlaceholder', size: 6 }],
            [{ name: 'rememberMeText', size: 4 }, { name: 'forgotPasswordText', size: 4 }, { name: 'loginButtonText', size: 4 }],
            [{ name: 'backToHomeText', size: 4 }, { name: 'versionText', size: 4 }, { name: 'copyrightText', size: 4 }]
          ]
        }
      };
      if (existingConfig) {
        await strapi.db.query('strapi::core-store').update({
          where: { key: loginConfigKey },
          data: { value: JSON.stringify(loginConfigValue) }
        });
      } else {
        await strapi.db.query('strapi::core-store').create({
          data: {
            key: loginConfigKey,
            value: JSON.stringify(loginConfigValue),
            type: 'plugin_content_manager_configuration',
            environment: null,
            tag: null
          }
        });
      }
      strapi.log.info('[YAHAYASCOOL] Content Manager layout for login-page configured!');
    } catch (confErr: any) {
      strapi.log.warn(`[YAHAYASCOOL] Failed to set Login Page content-manager layout: ${confErr.message}`);
    }
  } catch (err: any) {
    strapi.log.warn(`[YAHAYASCOOL] seedLoginPage failed: ${err.message}`);
  }
}

async function seedPrivacyPage(strapi: Core.Strapi) {
  try {
    const LOCALES_DATA: Record<string, any> = {
      en: {
        title: 'Privacy Policy',
        breadcrumbTitle: 'Privacy Policy',
        lastUpdated: 'Last Updated: August 2026',
        content: `<h3>1. Information We Collect</h3>
<p>We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our programs, or otherwise contact us. This includes:</p>
<ul>
  <li>Names and contact information (phone numbers, email addresses)</li>
  <li>Educational history and transcripts</li>
  <li>Billing and payment information</li>
</ul>
<hr/>
<h3>2. How We Use Your Information</h3>
<p>We use personal information collected via our website for a variety of business purposes, including:</p>
<ol>
  <li>Facilitating the enrollment process.</li>
  <li>Sending administrative information to you.</li>
  <li>Responding to your inquiries and support requests.</li>
</ol>
<hr/>
<h3>3. Information Sharing</h3>
<p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We do not sell your personal data to third parties.</p>
<hr/>
<h3>4. Data Security</h3>
<p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process.</p>
<hr/>
<h3>5. Your Privacy Rights</h3>
<p>You may review, change, or terminate your account at any time. If you have questions or comments about your privacy rights, you may email us at <strong>info@yahayaschool.com</strong>.</p>`,
        seo: {
          metaTitle: 'Privacy Policy | YAHAYASCHOOL',
          metaDescription: 'Learn how Yahaya International Islamic and English High School collects, uses, and safeguards your personal information.',
        },
      },
      ar: {
        title: 'سياسة الخصوصية',
        breadcrumbTitle: 'سياسة الخصوصية',
        lastUpdated: 'آخر تحديث: أغسطس ٢٠٢٦',
        content: `<h3>١. المعلومات التي نجمعها</h3>
<p>نقوم بجمع المعلومات الشخصية التي تقدمها لنا طواعية عند التسجيل في الموقع، أو الإعراب عن اهتمامك بالحصول على معلومات عنا أو عن برامجنا، أو عند الاتصال بنا بأي شكل آخر. يشمل ذلك:</p>
<ul>
  <li>الأسماء ومعلومات الاتصال (أرقام الهواتف، عناوين البريد الإلكتروني)</li>
  <li>التاريخ التعليمي والسجلات الأكاديمية</li>
  <li>معلومات الفواتير والدفع</li>
</ul>
<hr/>
<h3>٢. كيف نستخدم معلوماتك</h3>
<p>نستخدم المعلومات الشخصية التي يتم جمعها عبر موقعنا لأغراض تجارية متنوعة، بما في ذلك:</p>
<ol>
  <li>تسهيل عملية التسجيل.</li>
  <li>إرسال المعلومات الإدارية إليك.</li>
  <li>الرد على استفساراتك وطلبات الدعم.</li>
</ol>
<hr/>
<h3>٣. مشاركة المعلومات</h3>
<p>نحن لا نشارك المعلومات إلا بموافقتك، أو للامتثال للقوانين، أو لتقديم الخدمات لك، أو لحماية حقوقك، أو للوفاء بالالتزامات التجارية. نحن لا نبيع بياناتك الشخصية لأطراف ثالثة.</p>
<hr/>
<h3>٤. أمن البيانات</h3>
<p>لقد قمنا بتنفيذ تدابير أمنية فنية وتنظيمية مناسبة مصممة لحماية أمن أي معلومات شخصية نعالجها.</p>
<hr/>
<h3>٥. حقوق الخصوصية الخاصة بك</h3>
<p>يمكنك مراجعة حسابك أو تغييره أو إنهائه في أي وقت. إذا كانت لديك أسئلة أو تعليقات حول حقوق الخصوصية الخاصة بك، يمكنك مراسلتنا عبر البريد الإلكتروني على <strong>info@yahayaschool.com</strong>.</p>`,
        seo: {
          metaTitle: 'سياسة الخصوصية | يهايا سكول',
          metaDescription: 'تعرف على كيفية قيام مدرسة يحيى الدولية الإسلامية والإنجليزية بجمع معلوماتك الشخصية واستخدامها وحمايتها.',
        },
      },
      tr: {
        title: 'Gizlilik Politikası',
        breadcrumbTitle: 'Gizlilik Politikası',
        lastUpdated: 'Son Güncelleme: Ağustos 2026',
        content: `<h3>1. Topladığımız Bilgiler</h3>
<p>Web sitesine kayıt olduğunuzda, bizimle veya programlarımızla ilgili bilgi almak istediğinizi belirttiğinizde veya bizimle başka bir şekilde iletişime geçtiğinizde gönüllü olarak sağladığınız kişisel bilgileri topluyoruz. Bunlar şunları içerir:</p>
<ul>
  <li>İsimler ve iletişim bilgileri (telefon numaraları, e-posta adresleri)</li>
  <li>Eğitim geçmişi ve transkriptler</li>
  <li>Fatura ve ödeme bilgileri</li>
</ul>
<hr/>
<h3>2. Bilgilerinizi Nasıl Kullanıyoruz</h3>
<p>Web sitemiz aracılığıyla toplanan kişisel bilgileri çeşitli iş amaçları için kullanıyoruz, bunlara şunlar dahildir:</p>
<ol>
  <li>Kayıt sürecini kolaylaştırmak.</li>
  <li>Size idari bilgiler göndermek.</li>
  <li>Sorularınıza ve destek taleplerinize yanıt vermek.</li>
</ol>
<hr/>
<h3>3. Bilgi Paylaşımı</h3>
<p>Bilgileri yalnızca onayınızla, yasalara uymak, size hizmet sunmak, haklarınızı korumak veya ticari yükümlülükleri yerine getirmek için paylaşıyoruz. Kişisel verilerinizi üçüncü şahıslara satmıyoruz.</p>
<hr/>
<h3>4. Veri Güvenliği</h3>
<p>İşlediğimiz tüm kişisel bilgilerin güvenliğini korumak için tasarlanmış uygun teknik ve kurumsal güvenlik önlemlerini uyguladık.</p>
<hr/>
<h3>5. Gizlilik Haklarınız</h3>
<p>Hesabınızı istediğiniz zaman inceleyebilir, değiştirebilir veya sonlandırabilirsiniz. Gizlilik haklarınızla ilgili soru veya yorumlarınız varsa bize <strong>info@yahayaschool.com</strong> adresinden e-posta gönderebilirsiniz.</p>`,
        seo: {
          metaTitle: 'Gizlilik Politikası | YAHAYASCOOL',
          metaDescription: 'Yahaya Uluslararası İslami ve İngiliz Lisesi olarak kişisel bilgilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu öğrenin.',
        },
      },
      fr: {
        title: 'Politique de Confidentialité',
        breadcrumbTitle: 'Politique de Confidentialité',
        lastUpdated: 'Dernière mise à jour : Août 2026',
        content: `<h3>1. Informations que nous collectons</h3>
<p>Nous collectons les informations personnelles que vous nous fournissez volontairement lorsque vous vous inscrivez sur le site Web, exprimez un intérêt à obtenir des informations sur nous ou nos programmes, ou nous contactez d'une autre manière. Cela inclut :</p>
<ul>
  <li>Noms et coordonnées (numéros de téléphone, adresses e-mail)</li>
  <li>Antécédents scolaires et relevés de notes</li>
  <li>Informations de facturation et de paiement</li>
</ul>
<hr/>
<h3>2. Comment nous utilisons vos informations</h3>
<p>Nous utilisons les informations personnelles collectées via notre site Web à diverses fins commerciales, notamment :</p>
<ol>
  <li>Faciliter le processus d'inscription.</li>
  <li>Vous envoyer des informations administratives.</li>
  <li>Répondre à vos demandes de renseignements et d'assistance.</li>
</ol>
<hr/>
<h3>3. Partage d'informations</h3>
<p>Nous ne partageons des informations qu'avec votre consentement, pour nous conformer aux lois, pour vous fournir des services, pour protéger vos droits ou pour remplir des obligations commerciales. Nous ne vendons pas vos données personnelles à des tiers.</p>
<hr/>
<h3>4. Sécurité des données</h3>
<p>Nous avons mis en place des mesures de sécurité techniques et organisationnelles appropriées conçues pour protéger la sécurité de toute information personnelle que nous traitons.</p>
<hr/>
<h3>5. Vos droits à la confidentialité</h3>
<p>Vous pouvez consulter, modifier ou résilier votre compte à tout moment. Si vous avez des questions ou des commentaires sur vos droits à la confidentialité, vous pouvez nous envoyer un e-mail à <strong>info@yahayaschool.com</strong>.</p>`,
        seo: {
          metaTitle: 'Politique de Confidentialité | YAHAYASCOOL',
          metaDescription: 'Découvrez comment le Lycée International Islamique et Anglais Yahaya collecte, utilise et protège vos informations personnelles.',
        },
      },
    };

    let privacyDocId: string | null = null;
    const docService = (strapi as any).documents ? (strapi as any).documents('api::privacy-page.privacy-page') : null;

    if (docService) {
      const existingEntries = await docService.findMany({ locale: '*' });
      if (existingEntries && existingEntries.length > 0) {
        privacyDocId = existingEntries[0].documentId;
      }
    }

    const buildPayload = (loc: string) => {
      const d = LOCALES_DATA[loc] || LOCALES_DATA.en;
      return {
        title: d.title,
        breadcrumbTitle: d.breadcrumbTitle,
        lastUpdated: d.lastUpdated,
        content: d.content,
        seo: d.seo,
        publishedAt: new Date().toISOString(),
      };
    };

    if (docService) {
      if (!privacyDocId) {
        strapi.log.info('[YAHAYASCOOL] Seeding Privacy Page (EN)...');
        const enCreated = await docService.create({
          locale: 'en',
          data: buildPayload('en'),
        });
        privacyDocId = enCreated.documentId;
        await docService.publish({
          documentId: privacyDocId,
          locale: 'en',
        });
        strapi.log.info('[YAHAYASCOOL] Privacy Page (EN) created and published!');
      }

      const otherLocales = ['ar', 'tr', 'fr'];
      for (const loc of otherLocales) {
        try {
          const locExisting = await docService.findOne({
            documentId: privacyDocId,
            locale: loc,
          });
          if (!locExisting) {
            strapi.log.info(`[YAHAYASCOOL] Seeding Privacy Page (${loc})...`);
            await docService.update({
              documentId: privacyDocId,
              locale: loc,
              data: buildPayload(loc),
            });
            await docService.publish({
              documentId: privacyDocId,
              locale: loc,
            });
            strapi.log.info(`[YAHAYASCOOL] Privacy Page (${loc}) created and published!`);
          }
        } catch (locErr: any) {
          strapi.log.warn(`[YAHAYASCOOL] Error seeding Privacy Page (${loc}): ${locErr.message}`);
        }
      }
    }

    try {
      const privacyConfigKey = 'plugin_content_manager_configuration_content_types::api::privacy-page.privacy-page';
      const existingConfig = await strapi.db.query('strapi::core-store').findOne({ where: { key: privacyConfigKey } });
      const privacyConfigValue = {
        settings: {
          bulkable: true,
          filterable: true,
          searchable: true,
          pageSize: 10,
          relationOpenMode: 'modal',
          mainField: 'title',
          defaultSortBy: 'title',
          defaultSortOrder: 'ASC'
        },
        metadatas: {
          id: { edit: {}, list: { label: 'id', searchable: true, sortable: true } },
          title: { edit: { label: 'Page Heading', visible: true, editable: true }, list: { label: 'Title', searchable: true, sortable: true } },
          breadcrumbTitle: { edit: { label: 'Breadcrumb Label', visible: true, editable: true } },
          lastUpdated: { edit: { label: 'Last Updated Date / Subtitle', visible: true, editable: true } },
          content: { edit: { label: 'Privacy Policy Document Body', visible: true, editable: true } },
          seo: { edit: { label: 'SEO Metadata', visible: true, editable: true } }
        },
        layouts: {
          list: ['id', 'title'],
          edit: [
            [{ name: 'title', size: 6 }, { name: 'breadcrumbTitle', size: 6 }],
            [{ name: 'lastUpdated', size: 6 }, { name: 'seo', size: 6 }],
            [{ name: 'content', size: 12 }]
          ]
        }
      };
      if (existingConfig) {
        await strapi.db.query('strapi::core-store').update({
          where: { key: privacyConfigKey },
          data: { value: JSON.stringify(privacyConfigValue) }
        });
      } else {
        await strapi.db.query('strapi::core-store').create({
          data: {
            key: privacyConfigKey,
            value: JSON.stringify(privacyConfigValue),
            type: 'plugin_content_manager_configuration',
            environment: null,
            tag: null
          }
        });
      }
      strapi.log.info('[YAHAYASCOOL] Content Manager layout for privacy-page configured!');
    } catch (confErr: any) {
      strapi.log.warn(`[YAHAYASCOOL] Failed to set Privacy Page content-manager layout: ${confErr.message}`);
    }
  } catch (err: any) {
    strapi.log.warn(`[YAHAYASCOOL] seedPrivacyPage failed: ${err.message}`);
  }
}



// ─────────────────────────────────────────────────────────────────────────────

const SCHOOL_ROLES = [
  {
    name: 'Super Administrator',
    description: 'Full unrestricted access to every feature and permission in the platform',
    type: 'super-administrator',
  },
  {
    name: 'Director',
    description: 'School director with comprehensive management access across all modules',
    type: 'director',
  },
  {
    name: 'Teacher',
    description: 'Teaching staff with access to classroom, attendance, grades, and learning materials',
    type: 'teacher',
  },
  {
    name: 'Student',
    description: 'Student with access to personal grades, timetable, materials, and communications',
    type: 'student',
  },
  {
    name: 'Parent',
    description: 'Parent/guardian with access to child progress, fees, attendance, and school communications',
    type: 'parent',
  },
  {
    name: 'Worker',
    description: 'Non-teaching support staff with limited administrative access',
    type: 'worker',
  },
  {
    name: 'Accountant',
    description: 'Finance staff who can create and manage transactions but cannot approve them',
    type: 'accountant',
  },
  {
    name: 'Account Lead',
    description: 'Senior finance staff with full financial management and transaction approval authority',
    type: 'account-lead',
  },
  {
    name: 'Driver',
    description: 'Transport staff with access to vehicle assignments and student transport records',
    type: 'driver',
  },
  {
    name: 'Section Head',
    description: 'Academic section head with full management access to their assigned section only — including teachers, students, subjects, course offerings, attendance, gradebook, assessments, timetable, and analytics for their section',
    type: 'section-head',
  },
  {
    name: 'Registrar',
    description: 'Academic registrar with access to student enrollment, transcripts, report cards, promotions, graduation records, and academic clearances across all sections',
    type: 'registrar',
  },
] as const;

async function seedWallOfGratitude(strapi: Core.Strapi) {
  try {
    const ds = await strapi.db.query('api::donation-setting.donation-setting').findOne({ populate: ['wallOfGratitude'] });
    if (ds && !ds.wallOfGratitude) {
      strapi.log.info('[YAHAYASCOOL] Seeding Wall of Gratitude...');
      const entityService = strapi.plugin('content-manager').service('entity-manager') || strapi.entityService;
      await strapi.entityService.update('api::donation-setting.donation-setting', ds.id, {
        data: {
          wallOfGratitude: {
            title: "Wall of Gratitude",
            subtitle: "May Allah reward all those who support the pursuit of beneficial knowledge.",
            patrons: [
              { name: 'The Al-Fayed Family', quote: 'A legacy of learning for our children and generations to come.' },
              { name: 'Umar & Sarah Mansoor', quote: 'Proud to support the next generation of global leaders.' },
              { name: 'Islamic Relief', quote: 'Committed to global excellence in faith-based education.' },
              { name: 'Community Fund', quote: 'Building a sustainable and enlightened future together.' },
              { name: 'Anonymous Patron', quote: 'Give quietly, and let the work speak for itself.' },
              { name: 'The Kromah Trust', quote: 'Education is the surest investment a community can make.' }
            ]
          }
        }
      });
    }
  } catch (err) {
    strapi.log.error('Failed to seed Wall of Gratitude', err);
  }
}

export async function seedWebsiteCMS(strapi: Core.Strapi): Promise<void> {
  await seedWallOfGratitude(strapi);
  await seedNewsPage(strapi);
  await seedSchoolAcademicPrograms(strapi);
  await seedOnlineLearning(strapi);
  await seedHomepage(strapi);
  await seedLoginPage(strapi);
  await seedPrivacyPage(strapi);
}

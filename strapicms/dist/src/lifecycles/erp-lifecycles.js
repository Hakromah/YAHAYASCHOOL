"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerERPLifecycles = registerERPLifecycles;
// ─────────────────────────────────────────────────────────────────────────────
// ERP Lifecycles: Auto-ID Generation, JSON Sanitization, Enrollment/Assignment
// Display Names, and Academic Section Head Validation.
// ─────────────────────────────────────────────────────────────────────────────
function registerERPLifecycles(strapi) {
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
            async beforeCreate(event) {
                const { data } = event.params;
                if (data && !data[item.idField]) {
                    try {
                        const count = await strapi.db.query(item.model).count({});
                        const seq = String(count + 1).padStart(3, '0');
                        data[item.idField] = `${item.prefix}${seq}`;
                        if (item.admPrefix && !data.admissionNumber) {
                            data.admissionNumber = `${item.admPrefix}${seq}`;
                        }
                    }
                    catch (err) {
                        strapi.log.warn(`[YAHAYASCOOL] Could not auto-generate ID for ${item.model}: ${err.message}`);
                    }
                }
            },
        });
    }
    // Teacher profile beforeCreate: auto-fill from user or auto-link
    strapi.db.lifecycles.subscribe({
        models: ['api::teacher.teacher'],
        async beforeCreate(event) {
            var _a;
            const { data } = event.params;
            if (!data)
                return;
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
                        if (!data.email)
                            data.email = user.email;
                        if (!data.phone && user.phone)
                            data.phone = user.phone;
                        if (!data.gender && user.gender)
                            data.gender = user.gender;
                        if (!data.schoolId && user.schoolId)
                            data.schoolId = user.schoolId;
                        if (!data.photo && ((_a = user.avatar) === null || _a === void 0 ? void 0 : _a.id))
                            data.photo = user.avatar.id;
                    }
                }
                catch { }
            }
            else if (data.email || data.schoolId) {
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
                }
                catch { }
            }
        },
    });
    // Student profile beforeCreate: auto-fill from user or auto-link
    strapi.db.lifecycles.subscribe({
        models: ['api::student.student'],
        async beforeCreate(event) {
            var _a;
            const { data } = event.params;
            if (!data)
                return;
            if (data.user) {
                try {
                    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
                        where: { id: data.user },
                        populate: ['avatar'],
                    });
                    if (user) {
                        if (!data.firstName)
                            data.firstName = user.firstName || user.username;
                        if (!data.lastName)
                            data.lastName = user.lastName || 'Student';
                        if (!data.email)
                            data.email = user.email;
                        if (!data.phone && user.phone)
                            data.phone = user.phone;
                        if (!data.gender && user.gender)
                            data.gender = user.gender;
                        if (!data.schoolId && user.schoolId)
                            data.schoolId = user.schoolId;
                        if (!data.photo && ((_a = user.avatar) === null || _a === void 0 ? void 0 : _a.id))
                            data.photo = user.avatar.id;
                    }
                }
                catch { }
            }
            else if (data.email || data.schoolId) {
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
                }
                catch { }
            }
        },
    });
    // Global JSON field sanitization across all models
    strapi.db.lifecycles.subscribe({
        async beforeCreate(event) {
            const { data, model } = event.params || {};
            if (data && (model === null || model === void 0 ? void 0 : model.attributes)) {
                for (const [key, attr] of Object.entries(model.attributes)) {
                    if (attr.type === 'json' && (data[key] === '' || (typeof data[key] === 'string' && data[key].trim() === ''))) {
                        data[key] = null;
                    }
                }
            }
        },
        async beforeUpdate(event) {
            const { data, model } = event.params || {};
            if (data && (model === null || model === void 0 ? void 0 : model.attributes)) {
                for (const [key, attr] of Object.entries(model.attributes)) {
                    if (attr.type === 'json' && (data[key] === '' || (typeof data[key] === 'string' && data[key].trim() === ''))) {
                        data[key] = null;
                    }
                }
            }
        },
    });
    // Automatically sync/generate name fields for Course Offerings
    strapi.db.lifecycles.subscribe({
        models: ['api::course-offering.course-offering'],
        async beforeCreate(event) {
            await updateCourseOfferingName(event, strapi);
        },
        async beforeUpdate(event) {
            await updateCourseOfferingName(event, strapi);
        },
    });
    // Automatically sync/generate name fields for Student Enrollments
    strapi.db.lifecycles.subscribe({
        models: ['api::student-enrollment.student-enrollment'],
        async beforeCreate(event) {
            await updateStudentEnrollmentName(event, strapi);
        },
        async beforeUpdate(event) {
            await updateStudentEnrollmentName(event, strapi);
        },
    });
    // Automatically sync/generate name fields for Teacher Assignments
    strapi.db.lifecycles.subscribe({
        models: ['api::teacher-assignment.teacher-assignment'],
        async beforeCreate(event) {
            await updateTeacherAssignmentName(event, strapi);
        },
        async beforeUpdate(event) {
            await updateTeacherAssignmentName(event, strapi);
        },
    });
    // Verify academicHead has a teaching or faculty role
    strapi.db.lifecycles.subscribe({
        models: ['api::section.section'],
        async beforeCreate(event) {
            await validateAcademicHeadRole(event, strapi);
        },
        async beforeUpdate(event) {
            await validateAcademicHeadRole(event, strapi);
        },
    });
    strapi.log.info('[YAHAYASCOOL] ERP lifecycle hooks registered.');
}
async function resolveRelationRecord(strapi, modelUid, relVal, populate) {
    var _a, _b, _c;
    if (!relVal)
        return null;
    let queryWhere = null;
    if (typeof relVal === 'number' || (typeof relVal === 'string' && /^\d+$/.test(relVal))) {
        queryWhere = { id: Number(relVal) };
    }
    else if (typeof relVal === 'string') {
        queryWhere = { documentId: relVal };
    }
    else if (typeof relVal === 'object') {
        const item = ((_a = relVal.connect) === null || _a === void 0 ? void 0 : _a[0]) || ((_b = relVal.set) === null || _b === void 0 ? void 0 : _b[0]) || relVal;
        const idOrDoc = (_c = item === null || item === void 0 ? void 0 : item.id) !== null && _c !== void 0 ? _c : item === null || item === void 0 ? void 0 : item.documentId;
        if (typeof idOrDoc === 'number' || (typeof idOrDoc === 'string' && /^\d+$/.test(idOrDoc))) {
            queryWhere = { id: Number(idOrDoc) };
        }
        else if (typeof idOrDoc === 'string') {
            queryWhere = { documentId: idOrDoc };
        }
    }
    if (!queryWhere)
        return null;
    try {
        return await strapi.db.query(modelUid).findOne({
            where: queryWhere,
            ...(populate ? { populate } : {}),
        });
    }
    catch {
        return null;
    }
}
async function updateCourseOfferingName(event, strapi) {
    var _a, _b, _c, _d;
    const { data, where } = event.params || {};
    if (!data)
        return;
    if (data.name && typeof data.name === 'string' && data.name.trim() !== '' && data.name.trim() !== '-') {
        return;
    }
    let subjectVal = data.subject;
    let gradeVal = data.gradeLevel;
    let sectionVal = data.academicSection;
    let yearVal = data.academicYear;
    if ((where === null || where === void 0 ? void 0 : where.id) && (!subjectVal || !gradeVal || !sectionVal)) {
        try {
            const existing = await strapi.db.query('api::course-offering.course-offering').findOne({
                where: { id: where.id },
                populate: ['subject', 'gradeLevel', 'academicSection', 'academicYear'],
            });
            if (existing) {
                if (!subjectVal)
                    subjectVal = (_a = existing.subject) === null || _a === void 0 ? void 0 : _a.id;
                if (!gradeVal)
                    gradeVal = (_b = existing.gradeLevel) === null || _b === void 0 ? void 0 : _b.id;
                if (!sectionVal)
                    sectionVal = (_c = existing.academicSection) === null || _c === void 0 ? void 0 : _c.id;
                if (!yearVal)
                    yearVal = (_d = existing.academicYear) === null || _d === void 0 ? void 0 : _d.id;
            }
        }
        catch { }
    }
    const subject = await resolveRelationRecord(strapi, 'api::subject.subject', subjectVal);
    const grade = await resolveRelationRecord(strapi, 'api::grade-level.grade-level', gradeVal);
    const section = await resolveRelationRecord(strapi, 'api::section.section', sectionVal);
    const year = await resolveRelationRecord(strapi, 'api::academic-year.academic-year', yearVal);
    const mainParts = [subject === null || subject === void 0 ? void 0 : subject.name, grade === null || grade === void 0 ? void 0 : grade.name, section === null || section === void 0 ? void 0 : section.name].filter(Boolean);
    if (mainParts.length > 0) {
        data.name = (year === null || year === void 0 ? void 0 : year.name) ? `${mainParts.join(' - ')} (${year.name})` : mainParts.join(' - ');
    }
    else if (!data.name) {
        data.name = `Course Offering #${Date.now()}`;
    }
}
async function validateAcademicHeadRole(event, strapi) {
    var _a, _b;
    const { data } = event.params || {};
    if (!data || !data.academicHead)
        return;
    try {
        const teacherLink = await resolveRelationRecord(strapi, 'api::teacher.teacher', data.academicHead, ['user.role']);
        if (!teacherLink)
            return;
        const roleType = (_b = (_a = teacherLink.user) === null || _a === void 0 ? void 0 : _a.role) === null || _b === void 0 ? void 0 : _b.type;
        if (roleType && !['section-head', 'teacher', 'director', 'super-administrator', 'authenticated'].includes(roleType)) {
            const { errors } = require('@strapi/utils');
            throw new errors.ValidationError(`The selected teacher (${teacherLink.name}) must have a faculty or leadership role.`);
        }
    }
    catch (err) {
        const { errors } = require('@strapi/utils');
        if (err instanceof errors.ValidationError)
            throw err;
        strapi.log.warn('[YAHAYASCOOL] validateAcademicHead error:', err.message);
    }
}
async function updateStudentEnrollmentName(event, strapi) {
    var _a, _b, _c;
    const { data, where } = event.params || {};
    if (!data)
        return;
    let studentVal = data.student;
    let courseOfferingVal = data.courseOffering;
    if ((where === null || where === void 0 ? void 0 : where.id) && (!studentVal || !courseOfferingVal)) {
        try {
            const existing = await strapi.db.query('api::student-enrollment.student-enrollment').findOne({
                where: { id: where.id },
                populate: ['student', 'courseOffering'],
            });
            if (existing) {
                if (!studentVal)
                    studentVal = (_a = existing.student) === null || _a === void 0 ? void 0 : _a.id;
                if (!courseOfferingVal)
                    courseOfferingVal = (_b = existing.courseOffering) === null || _b === void 0 ? void 0 : _b.id;
            }
        }
        catch { }
    }
    const student = await resolveRelationRecord(strapi, 'api::student.student', studentVal);
    const course = await resolveRelationRecord(strapi, 'api::course-offering.course-offering', courseOfferingVal, ['subject']);
    const studentName = student
        ? [student.firstName, student.lastName].filter(Boolean).join(' ') || student.schoolId || ''
        : '';
    const courseName = course ? course.name || ((_c = course.subject) === null || _c === void 0 ? void 0 : _c.name) || '' : '';
    const parts = [studentName, courseName].filter(Boolean);
    data.name = parts.length > 0 ? parts.join(' - ') : `Enrollment #${Date.now()}`;
}
async function updateTeacherAssignmentName(event, strapi) {
    var _a, _b, _c;
    const { data, where } = event.params || {};
    if (!data)
        return;
    let teacherVal = data.teacher;
    let courseOfferingVal = data.courseOffering;
    if ((where === null || where === void 0 ? void 0 : where.id) && (!teacherVal || !courseOfferingVal)) {
        try {
            const existing = await strapi.db.query('api::teacher-assignment.teacher-assignment').findOne({
                where: { id: where.id },
                populate: ['teacher', 'courseOffering'],
            });
            if (existing) {
                if (!teacherVal)
                    teacherVal = (_a = existing.teacher) === null || _a === void 0 ? void 0 : _a.id;
                if (!courseOfferingVal)
                    courseOfferingVal = (_b = existing.courseOffering) === null || _b === void 0 ? void 0 : _b.id;
            }
        }
        catch { }
    }
    const teacher = await resolveRelationRecord(strapi, 'api::teacher.teacher', teacherVal);
    const course = await resolveRelationRecord(strapi, 'api::course-offering.course-offering', courseOfferingVal, ['subject']);
    const teacherName = teacher
        ? teacher.displayName || teacher.name || [teacher.firstName, teacher.lastName].filter(Boolean).join(' ') || teacher.schoolId || ''
        : '';
    const courseName = course ? course.name || ((_c = course.subject) === null || _c === void 0 ? void 0 : _c.name) || '' : '';
    const parts = [teacherName, courseName].filter(Boolean);
    data.name = parts.length > 0 ? parts.join(' - ') : `Assignment #${Date.now()}`;
}

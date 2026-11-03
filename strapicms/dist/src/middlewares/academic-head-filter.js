"use strict";
/**
 * academic-head-filter middleware
 *
 * Ensures GET requests to the Strapi Content Manager relation endpoint for
 * the `academicHead` field on Academic Section allow all faculty and leadership
 * teacher profiles (`section-head`, `teacher`, `director`, `super-administrator`)
 * as well as any teacher profile not yet linked to a restricted role.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => {
    return async (ctx, next) => {
        var _a;
        await next();
        const path = ctx.path || '';
        const method = ctx.method || '';
        const isTargetEndpoint = method === 'GET' &&
            path.includes('relations') &&
            path.includes('academicHead');
        if (!isTargetEndpoint)
            return;
        try {
            const strapi = ((_a = ctx.state) === null || _a === void 0 ? void 0 : _a.strapi) || global.strapi;
            if (!strapi)
                return;
            const knex = strapi.db.connection;
            const roles = await knex('up_roles')
                .whereIn('type', ['section-head', 'teacher', 'director', 'super-administrator', 'authenticated'])
                .select('id');
            const roleIds = roles.map((r) => r.id);
            if (roleIds.length === 0)
                return;
            const eligibleTeachers = await knex('teachers as t')
                .leftJoin('teachers_user_lnk as tul', 'tul.teacher_id', 't.id')
                .leftJoin('up_users_role_lnk as url', 'url.user_id', 'tul.user_id')
                .where((builder) => {
                builder.whereIn('url.role_id', roleIds).orWhereNull('tul.user_id').orWhereNull('url.role_id');
            })
                .select('t.id', 't.document_id');
            const numericIdSet = new Set(eligibleTeachers.map((t) => Number(t.id)));
            const documentIdSet = new Set(eligibleTeachers.map((t) => t.document_id).filter(Boolean));
            if (ctx.body) {
                const isMatch = (item) => {
                    const byNumericId = item.id != null && numericIdSet.has(Number(item.id));
                    const byDocumentId = item.documentId != null && documentIdSet.has(item.documentId);
                    return byNumericId || byDocumentId;
                };
                if (Array.isArray(ctx.body.results)) {
                    ctx.body.results = ctx.body.results.filter(isMatch);
                    if (ctx.body.pagination) {
                        ctx.body.pagination.total = ctx.body.results.length;
                    }
                }
                if (Array.isArray(ctx.body.data)) {
                    ctx.body.data = ctx.body.data.filter(isMatch);
                }
            }
        }
        catch (err) {
            console.warn('[YAHAYASCOOL] academicHead-filter middleware notice:', err.message);
        }
    };
};

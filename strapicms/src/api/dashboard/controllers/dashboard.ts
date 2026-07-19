export default {
  async getAdminDashboard(ctx: any) {
    const stats = await strapi.service('api::dashboard.dashboard').getAdminStats();
    ctx.body = { data: stats };
  },

  async getDirectorDashboard(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const stats = await strapi.service('api::dashboard.dashboard').getDirectorStats();
    ctx.body = { data: stats };
  },

  async getTeacherDashboard(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const stats = await strapi.service('api::dashboard.dashboard').getTeacherStats(user.id);
    ctx.body = { data: stats };
  },

  async getStudentDashboard(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const stats = await strapi.service('api::dashboard.dashboard').getStudentStats(user.id);
    ctx.body = { data: stats };
  },

  async getParentDashboard(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const stats = await strapi.service('api::dashboard.dashboard').getParentStats(user.id);
    ctx.body = { data: stats };
  },

  async getAccountantDashboard(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const stats = await strapi.service('api::dashboard.dashboard').getAccountantStats();
    ctx.body = { data: stats };
  },

  async getAccountLeadDashboard(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const stats = await strapi.service('api::dashboard.dashboard').getAccountLeadStats();
    ctx.body = { data: stats };
  },

  async getWorkerDashboard(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const stats = await strapi.service('api::dashboard.dashboard').getWorkerStats(user.id);
    ctx.body = { data: stats };
  },

  async getDriverDashboard(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const stats = await strapi.service('api::dashboard.dashboard').getDriverStats(user.id);
    ctx.body = { data: stats };
  },

  async getFinanceStats(ctx: any) {
    const { academicYear = '2026-2027' } = ctx.query;
    const stats = await strapi.service('api::dashboard.dashboard').getExecutiveFinanceStats(String(academicYear));
    ctx.body = { data: stats };
  },
};

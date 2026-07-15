export default {
  async getAdminDashboard(ctx) {
    const stats = await strapi.service('api::dashboard.dashboard').getAdminStats();
    ctx.body = { data: stats };
  },
  async getTeacherDashboard(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const stats = await strapi.service('api::dashboard.dashboard').getTeacherStats(user.id);
    ctx.body = { data: stats };
  },
  async getStudentDashboard(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const stats = await strapi.service('api::dashboard.dashboard').getStudentStats(user.id);
    ctx.body = { data: stats };
  },
  async getParentDashboard(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const stats = await strapi.service('api::dashboard.dashboard').getParentStats(user.id);
    ctx.body = { data: stats };
  }
};

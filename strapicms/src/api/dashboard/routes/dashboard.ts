export default {
  routes: [
    {
      method: 'GET',
      path: '/dashboard/admin',
      handler: 'dashboard.getAdminDashboard',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/dashboard/teacher',
      handler: 'dashboard.getTeacherDashboard',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/dashboard/student',
      handler: 'dashboard.getStudentDashboard',
      config: { policies: [] }
    },
    {
      method: 'GET',
      path: '/dashboard/parent',
      handler: 'dashboard.getParentDashboard',
      config: { policies: [] }
    }
  ]
};

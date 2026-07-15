export default () => ({
  async getAdminStats() {
    return {
      students: await strapi.documents('api::student.student').count(),
      teachers: await strapi.documents('api::teacher.teacher').count(),
      parents: await strapi.documents('api::parent.parent').count(),
      departments: await strapi.documents('api::department.department').count()
    };
  },
  async getTeacherStats(userId: number) {
    // In a real app, you would filter by teacher.user.id = userId
    return { assignedClasses: 3, pendingAssessments: 5, pendingHomework: 12 };
  },
  async getStudentStats(userId: number) {
    return { attendance: 95, pendingAssignments: 2, recentGrade: 'A-' };
  },
  async getParentStats(userId: number) {
    return { childrenCount: 2, outstandingFees: 1500, upcomingEvents: 1 };
  }
});

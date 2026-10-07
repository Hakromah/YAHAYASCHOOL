import { apiClient } from './api.service';
import type { StrapiCollectionResponse, StrapiSingleResponse } from '../types/api.types';
import type { 
  QuranProgram, QuranGroup, Memorization, Murajaah, TajweedEvaluation, 
  Halaqah, QuranAttendance, QuranAssessment, DawahActivity, QuranCompetition, 
  QuranAchievement, QuranCertificate 
} from '../types/qms.types';

export const qmsService = {
  // Programs
  getPrograms: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranProgram>>('/quran-programs?populate=*&sort=createdAt:desc');
    return response.data.data;
  },

  createProgram: async (data: Partial<QuranProgram>) => {
    const response = await apiClient.post<StrapiSingleResponse<QuranProgram>>('/quran-programs', { data });
    return response.data.data;
  },

  // Groups / Halaqat
  getGroups: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranGroup>>('/quran-groups?populate=*&sort=name:asc');
    return response.data.data;
  },

  // Memorization
  getMemorizationRecords: async (studentId?: number | string) => {
    const url = studentId 
      ? `/memorizations?filters[student][id][$eq]=${studentId}&populate=*&sort=date:desc`
      : '/memorizations?populate=*&sort=date:desc&pagination[limit]=500';
    const response = await apiClient.get<StrapiCollectionResponse<Memorization>>(url);
    return response.data.data;
  },

  createMemorizationRecord: async (data: any) => {
    const response = await apiClient.post<StrapiSingleResponse<Memorization>>('/memorizations', { data });
    return response.data.data;
  },

  updateMemorizationRecord: async (id: number | string, data: any) => {
    const response = await apiClient.put<StrapiSingleResponse<Memorization>>(`/memorizations/${id}`, { data });
    return response.data.data;
  },

  deleteMemorizationRecord: async (id: number | string) => {
    await apiClient.delete(`/memorizations/${id}`);
  },

  // Revision (Murajaah)
  getMurajaahRecords: async (studentId?: number | string) => {
    const url = studentId 
      ? `/murajaahs?filters[student][id][$eq]=${studentId}&populate=*&sort=dueDate:desc`
      : '/murajaahs?populate=*&sort=dueDate:desc&pagination[limit]=500';
    const response = await apiClient.get<StrapiCollectionResponse<Murajaah>>(url);
    return response.data.data;
  },

  createMurajaahRecord: async (data: any) => {
    const response = await apiClient.post<StrapiSingleResponse<Murajaah>>('/murajaahs', { data });
    return response.data.data;
  },

  updateMurajaahRecord: async (id: number | string, data: any) => {
    const response = await apiClient.put<StrapiSingleResponse<Murajaah>>(`/murajaahs/${id}`, { data });
    return response.data.data;
  },

  deleteMurajaahRecord: async (id: number | string) => {
    await apiClient.delete(`/murajaahs/${id}`);
  },

  // Tajweed
  getTajweedEvaluations: async (studentId?: number | string) => {
    const url = studentId 
      ? `/tajweed-evaluations?filters[student][id][$eq]=${studentId}&populate=*&sort=evaluationDate:desc`
      : '/tajweed-evaluations?populate=*&sort=evaluationDate:desc&pagination[limit]=500';
    const response = await apiClient.get<StrapiCollectionResponse<TajweedEvaluation>>(url);
    return response.data.data;
  },

  createTajweedEvaluation: async (data: any) => {
    const response = await apiClient.post<StrapiSingleResponse<TajweedEvaluation>>('/tajweed-evaluations', { data });
    return response.data.data;
  },

  // Daily Halaqah
  getHalaqahs: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<Halaqah>>('/halaqahs?populate=*&sort=date:desc');
    return response.data.data;
  },

  createHalaqah: async (data: any) => {
    const response = await apiClient.post<StrapiSingleResponse<Halaqah>>('/halaqahs', { data });
    return response.data.data;
  },

  // Attendance
  getAttendance: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranAttendance>>('/quran-attendances?populate=*&sort=date:desc');
    return response.data.data;
  },

  createAttendance: async (data: any) => {
    const response = await apiClient.post<StrapiSingleResponse<QuranAttendance>>('/quran-attendances', { data });
    return response.data.data;
  },

  // Assessments
  getAssessments: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranAssessment>>('/quran-assessments?populate=*&sort=date:desc');
    return response.data.data;
  },

  // Da'wah
  getDawahActivities: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<DawahActivity>>('/dawah-activities?populate=*&sort=date:desc');
    return response.data.data;
  },

  // Competitions
  getCompetitions: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranCompetition>>('/quran-competitions?populate=*&sort=date:desc');
    return response.data.data;
  },

  // Achievements
  getAchievements: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranAchievement>>('/quran-achievements?populate=*&sort=dateEarned:desc');
    return response.data.data;
  },

  getQuranAchievements: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranAchievement>>('/quran-achievements?populate=*&sort=dateEarned:desc');
    return response.data.data;
  },

  getQuranPrograms: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranProgram>>('/quran-programs?populate=*&sort=id:asc');
    return response.data.data;
  },

  // Certificates
  getCertificates: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuranCertificate>>('/quran-certificates?populate=*&sort=issueDate:desc');
    return response.data.data;
  },

  // CSV Export Utility
  exportToCSV: (data: any[], filename = 'qms-export.csv') => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(h => {
            const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

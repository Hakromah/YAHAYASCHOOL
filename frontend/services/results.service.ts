import { apiClient } from './api.service';
import type { StrapiCollectionResponse, StrapiSingleResponse } from '../types/api.types';
import type { 
  ReportCard, StudentResult, StudentRanking, PromotionRecord, 
  AcademicTranscript, GraduationRecord, AcademicCertificate, HonorRoll 
} from '../types/results.types';

export const resultsService = {
  // Report Cards
  getReportCards: async (termId?: number, studentId?: number) => {
    let url = '/report-cards?populate=*&sort=createdAt:desc';
    if (termId && studentId) {
      url = `/report-cards?filters[academic_term][id][$eq]=${termId}&filters[student][id][$eq]=${studentId}&populate=*`;
    } else if (termId) {
      url = `/report-cards?filters[academic_term][id][$eq]=${termId}&populate=*`;
    } else if (studentId) {
      url = `/report-cards?filters[student][id][$eq]=${studentId}&populate=*`;
    }
    const response = await apiClient.get<StrapiCollectionResponse<ReportCard>>(url);
    return response.data.data;
  },

  getStudentResults: async (termId?: number, studentId?: number) => {
    let url = '/student-results?populate=*';
    if (termId && studentId) {
      url = `/student-results?filters[academic_term][id][$eq]=${termId}&filters[student][id][$eq]=${studentId}&populate=*`;
    } else if (studentId) {
      url = `/student-results?filters[student][id][$eq]=${studentId}&populate=*`;
    }
    const response = await apiClient.get<StrapiCollectionResponse<StudentResult>>(url);
    return response.data.data;
  },

  // Rankings & Merit
  getRankings: async (termId?: number, context?: string) => {
    let url = '/student-rankings?populate=*&sort=rankPosition:asc';
    if (termId && context) {
      url = `/student-rankings?filters[academic_term][id][$eq]=${termId}&filters[rankContext][$eq]=${context}&populate=*&sort=rankPosition:asc`;
    } else if (termId) {
      url = `/student-rankings?filters[academic_term][id][$eq]=${termId}&populate=*&sort=rankPosition:asc`;
    }
    const response = await apiClient.get<StrapiCollectionResponse<StudentRanking>>(url);
    return response.data.data;
  },

  getHonorRolls: async (termId?: number) => {
    const url = termId 
      ? `/honor-rolls?filters[academic_term][id][$eq]=${termId}&populate=*` 
      : '/honor-rolls?populate=*';
    const response = await apiClient.get<StrapiCollectionResponse<HonorRoll>>(url);
    return response.data.data;
  },

  // Promotion & Graduation
  getPromotionRecords: async (yearId?: number) => {
    const url = yearId 
      ? `/promotion-records?filters[fromYear][id][$eq]=${yearId}&populate=*` 
      : '/promotion-records?populate=*';
    const response = await apiClient.get<StrapiCollectionResponse<PromotionRecord>>(url);
    return response.data.data;
  },

  getGraduationRecords: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<GraduationRecord>>('/graduation-records?populate=*&sort=graduationDate:desc');
    return response.data.data;
  },

  // Transcripts & Certificates
  getTranscripts: async (studentId?: number) => {
    const url = studentId 
      ? `/academic-transcripts?filters[student][id][$eq]=${studentId}&populate=*` 
      : '/academic-transcripts?populate=*';
    const response = await apiClient.get<StrapiCollectionResponse<AcademicTranscript>>(url);
    return response.data.data;
  },

  getCertificates: async (studentId?: number) => {
    const url = studentId 
      ? `/academic-certificates?filters[student][id][$eq]=${studentId}&populate=*` 
      : '/academic-certificates?populate=*';
    const response = await apiClient.get<StrapiCollectionResponse<AcademicCertificate>>(url);
    return response.data.data;
  }
};

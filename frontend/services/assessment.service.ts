import { apiClient } from './api.service';
import type { StrapiCollectionResponse, StrapiSingleResponse } from '../types/api.types';
import type { 
  AssessmentType, AssessmentCategory, GradingScheme, GradeBand, Rubric, 
  ExamSession, Examination, Question, QuestionPool, ExamSchedule, ExamRoom, 
  MarksEntry, GradeModeration 
} from '../types/assessment.types';

export const assessmentService = {
  // Grading & Assessment Setup
  getGradingSchemes: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<GradingScheme>>('/grading-schemes?populate=*');
    return response.data.data;
  },
  
  getAssessmentTypes: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<AssessmentType>>('/assessment-types?populate=*');
    return response.data.data;
  },

  // Examinations
  getExamSessions: async (termId?: number) => {
    const url = termId 
      ? `/exam-sessions?filters[academic_term][id][$eq]=${termId}&populate=*&sort=startDate:desc`
      : '/exam-sessions?populate=*&sort=startDate:desc';
    const response = await apiClient.get<StrapiCollectionResponse<ExamSession>>(url);
    return response.data.data;
  },

  getExaminations: async (sessionId?: number, teacherId?: number) => {
    let url = '/examinations?populate=*&sort=examDate:desc';
    if (sessionId && teacherId) {
      url = `/examinations?filters[exam_session][id][$eq]=${sessionId}&filters[teacher][id][$eq]=${teacherId}&populate=*&sort=examDate:desc`;
    } else if (sessionId) {
      url = `/examinations?filters[exam_session][id][$eq]=${sessionId}&populate=*&sort=examDate:desc`;
    } else if (teacherId) {
      url = `/examinations?filters[teacher][id][$eq]=${teacherId}&populate=*&sort=examDate:desc`;
    }
    const response = await apiClient.get<StrapiCollectionResponse<Examination>>(url);
    return response.data.data;
  },

  // Question Bank
  getQuestionPools: async () => {
    const response = await apiClient.get<StrapiCollectionResponse<QuestionPool>>('/question-pools?populate=*');
    return response.data.data;
  },

  getQuestions: async (subjectId?: number) => {
    const url = subjectId 
      ? `/questions?filters[subject][id][$eq]=${subjectId}&populate=*`
      : '/questions?populate=*';
    const response = await apiClient.get<StrapiCollectionResponse<Question>>(url);
    return response.data.data;
  },

  // Marks Entry
  getMarksEntries: async (examinationId?: number, studentId?: number) => {
    let url = '/marks-entries?populate=*';
    if (examinationId && studentId) {
      url = `/marks-entries?filters[examination][id][$eq]=${examinationId}&filters[student][id][$eq]=${studentId}&populate=*`;
    } else if (examinationId) {
      url = `/marks-entries?filters[examination][id][$eq]=${examinationId}&populate=*`;
    } else if (studentId) {
      url = `/marks-entries?filters[student][id][$eq]=${studentId}&populate=*`;
    }
    const response = await apiClient.get<StrapiCollectionResponse<MarksEntry>>(url);
    return response.data.data;
  },

  // Moderation
  getGradeModerations: async (examinationId?: number) => {
    const url = examinationId 
      ? `/grade-moderations?filters[examination][id][$eq]=${examinationId}&populate=*`
      : '/grade-moderations?populate=*';
    const response = await apiClient.get<StrapiCollectionResponse<GradeModeration>>(url);
    return response.data.data;
  }
};

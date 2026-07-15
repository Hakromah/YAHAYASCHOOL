import { apiClient } from './api.service';
import type {
  Student,
  Teacher,
  Parent,
  Worker,
  Section,
  Campus,
  AcademicYear,
  AcademicTerm,
  DirectorySearchParams,
  PaginatedERPResponse,
} from '../types/erp.types';

// Helper to unwrap Strapi v5 responses which may be `{ data: [...], meta: {...} }` or `[...]`
function unwrapPaginated<T>(res: unknown): PaginatedERPResponse<T> {
  if (res && typeof res === 'object' && 'data' in res) {
    const response = res as { data: T[]; meta?: any };
    return {
      data: Array.isArray(response.data) ? response.data : [response.data].filter(Boolean),
      meta: response.meta || { pagination: { page: 1, pageSize: 25, pageCount: 1, total: Array.isArray(response.data) ? response.data.length : 1 } },
    };
  }
  const arr = Array.isArray(res) ? res : [res].filter(Boolean);
  return {
    data: arr as T[],
    meta: { pagination: { page: 1, pageSize: arr.length, pageCount: 1, total: arr.length } },
  };
}

function unwrapSingle<T>(res: unknown): T | null {
  if (!res) return null;
  if (typeof res === 'object' && 'data' in res) {
    const data = (res as { data: any }).data;
    if (Array.isArray(data)) return data[0] || null;
    return data || null;
  }
  return res as T;
}

export const erpService = {
  // ─────────────────────────────────────────────────────────────────────────────
  // Students
  // ─────────────────────────────────────────────────────────────────────────────
  async getStudents(params: DirectorySearchParams = {}, locale = 'en'): Promise<PaginatedERPResponse<Student>> {
    try {
      const filters: any = {};
      if (params.query) {
        filters.$or = [
          { firstName: { $containsi: params.query } },
          { lastName: { $containsi: params.query } },
          { schoolId: { $containsi: params.query } },
          { admissionNumber: { $containsi: params.query } },
        ];
      }
      if (params.gender && params.gender !== 'all') {
        filters.gender = params.gender;
      }
      if (params.status && params.status !== 'all') {
        filters.status = params.status;
      }
      if (params.section && params.section !== 'all') {
        filters.sections = { code: { $eq: params.section } };
      }

      const res = await apiClient.get('/students', {
        params: {
          locale,
          publicationState: 'preview',
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          pagination: {
            page: params.page || 1,
            pageSize: params.pageSize || 12,
          },
          sort: params.sort || 'schoolId:asc',
          populate: ['photo', 'sections', 'parents', 'timeline', 'behaviorRecords', 'enrollmentHistory', 'departments'],
        },
      });
      return unwrapPaginated<Student>(res.data);
    } catch (error) {
      console.warn('[erpService] Failed to fetch students:', error);
      return { data: [], meta: { pagination: { page: 1, pageSize: 12, pageCount: 0, total: 0 } } };
    }
  },

  async getStudentById(id: string | number, locale = 'en'): Promise<Student | null> {
    try {
      const res = await apiClient.get(`/students/${id}`, {
        params: {
          locale,
          populate: ['photo', 'sections', 'parents', 'teachers', 'timeline', 'behaviorRecords', 'enrollmentHistory', 'medicalInfo', 'staffNotes', 'documents', 'departments', 'programs', 'academicYears'],
        },
      });
      return unwrapSingle<Student>(res.data);
    } catch (error) {
      console.warn(`[erpService] Failed to fetch student ${id}:`, error);
      return null;
    }
  },

  async getStudentBySchoolId(schoolId: string, locale = 'en'): Promise<Student | null> {
    try {
      const res = await apiClient.get('/students', {
        params: {
          locale,
          filters: { schoolId: { $eq: schoolId } },
          populate: ['photo', 'sections', 'parents', 'teachers', 'timeline', 'behaviorRecords', 'enrollmentHistory', 'medicalInfo', 'staffNotes', 'documents', 'departments', 'programs', 'academicYears'],
        },
      });
      const paginated = unwrapPaginated<Student>(res.data);
      return paginated.data[0] || null;
    } catch (error) {
      console.warn(`[erpService] Failed to fetch student by schoolId ${schoolId}:`, error);
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Teachers
  // ─────────────────────────────────────────────────────────────────────────────
  async getTeachers(params: DirectorySearchParams = {}, locale = 'en'): Promise<PaginatedERPResponse<Teacher>> {
    try {
      const filters: any = {};
      if (params.query) {
        filters.$or = [
          { name: { $containsi: params.query } },
          { schoolId: { $containsi: params.query } },
          { specializations: { $containsi: params.query } },
        ];
      }
      if (params.gender && params.gender !== 'all') {
        filters.gender = params.gender;
      }
      if (params.status && params.status !== 'all') {
        filters.employmentStatus = params.status;
      }
      if (params.section && params.section !== 'all') {
        filters.sections = { code: { $eq: params.section } };
      }

      const res = await apiClient.get('/teachers', {
        params: {
          locale,
          publicationState: 'preview',
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          pagination: {
            page: params.page || 1,
            pageSize: params.pageSize || 12,
          },
          sort: params.sort || 'schoolId:asc',
          populate: ['photo', 'departments', 'sections', 'programs'],
        },
      });
      return unwrapPaginated<Teacher>(res.data);
    } catch (error) {
      console.warn('[erpService] Failed to fetch teachers:', error);
      return { data: [], meta: { pagination: { page: 1, pageSize: 12, pageCount: 0, total: 0 } } };
    }
  },

  async getTeacherById(id: string | number, locale = 'en'): Promise<Teacher | null> {
    try {
      const res = await apiClient.get(`/teachers/${id}`, {
        params: {
          locale,
          populate: ['photo', 'departments', 'sections', 'programs', 'students', 'documents'],
        },
      });
      return unwrapSingle<Teacher>(res.data);
    } catch (error) {
      console.warn(`[erpService] Failed to fetch teacher ${id}:`, error);
      return null;
    }
  },

  async getTeacherBySchoolId(schoolId: string, locale = 'en'): Promise<Teacher | null> {
    try {
      const res = await apiClient.get('/teachers', {
        params: {
          locale,
          filters: { schoolId: { $eq: schoolId } },
          populate: ['photo', 'departments', 'sections', 'programs', 'students', 'documents'],
        },
      });
      const paginated = unwrapPaginated<Teacher>(res.data);
      return paginated.data[0] || null;
    } catch (error) {
      console.warn(`[erpService] Failed to fetch teacher by schoolId ${schoolId}:`, error);
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Parents
  // ─────────────────────────────────────────────────────────────────────────────
  async getParents(params: DirectorySearchParams = {}, locale = 'en'): Promise<PaginatedERPResponse<Parent>> {
    try {
      const filters: any = {};
      if (params.query) {
        filters.$or = [
          { name: { $containsi: params.query } },
          { schoolId: { $containsi: params.query } },
          { phone: { $containsi: params.query } },
        ];
      }
      const res = await apiClient.get('/parents', {
        params: {
          locale,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          pagination: {
            page: params.page || 1,
            pageSize: params.pageSize || 12,
          },
          sort: params.sort || 'schoolId:asc',
          populate: ['photo', 'children'],
        },
      });
      return unwrapPaginated<Parent>(res.data);
    } catch (error) {
      console.warn('[erpService] Failed to fetch parents:', error);
      return { data: [], meta: { pagination: { page: 1, pageSize: 12, pageCount: 0, total: 0 } } };
    }
  },

  async getParentById(id: string | number, locale = 'en'): Promise<Parent | null> {
    try {
      const res = await apiClient.get(`/parents/${id}`, {
        params: {
          locale,
          populate: ['photo', 'children'],
        },
      });
      return unwrapSingle<Parent>(res.data);
    } catch (error) {
      console.warn(`[erpService] Failed to fetch parent ${id}:`, error);
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Workers
  // ─────────────────────────────────────────────────────────────────────────────
  async getWorkers(params: DirectorySearchParams = {}, locale = 'en'): Promise<PaginatedERPResponse<Worker>> {
    try {
      const filters: any = {};
      if (params.query) {
        filters.$or = [
          { name: { $containsi: params.query } },
          { schoolId: { $containsi: params.query } },
          { role: { $containsi: params.query } },
        ];
      }
      const res = await apiClient.get('/workers', {
        params: {
          locale,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          pagination: {
            page: params.page || 1,
            pageSize: params.pageSize || 12,
          },
          sort: params.sort || 'schoolId:asc',
          populate: ['photo', 'departments'],
        },
      });
      return unwrapPaginated<Worker>(res.data);
    } catch (error) {
      console.warn('[erpService] Failed to fetch workers:', error);
      return { data: [], meta: { pagination: { page: 1, pageSize: 12, pageCount: 0, total: 0 } } };
    }
  },

  async getWorkerById(id: string | number, locale = 'en'): Promise<Worker | null> {
    try {
      const res = await apiClient.get(`/workers/${id}`, {
        params: {
          locale,
          populate: ['photo', 'departments', 'documents'],
        },
      });
      return unwrapSingle<Worker>(res.data);
    } catch (error) {
      console.warn(`[erpService] Failed to fetch worker ${id}:`, error);
      return null;
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Sections & Infrastructure
  // ─────────────────────────────────────────────────────────────────────────────
  async getSections(locale = 'en'): Promise<Section[]> {
    try {
      const res = await apiClient.get('/sections', {
        params: { locale, populate: ['academicYear', 'department', 'program', 'teachers'] },
      });
      const paginated = unwrapPaginated<Section>(res.data);
      return paginated.data;
    } catch (error) {
      console.warn('[erpService] Failed to fetch sections:', error);
      return [];
    }
  },

  async getCampuses(locale = 'en'): Promise<Campus[]> {
    try {
      const res = await apiClient.get('/campuses', { params: { locale } });
      const paginated = unwrapPaginated<Campus>(res.data);
      return paginated.data;
    } catch (error) {
      console.warn('[erpService] Failed to fetch campuses:', error);
      return [];
    }
  },

  async getAcademicYears(locale = 'en'): Promise<AcademicYear[]> {
    try {
      const res = await apiClient.get('/academic-years', { params: { locale, populate: ['terms'] } });
      const paginated = unwrapPaginated<AcademicYear>(res.data);
      return paginated.data;
    } catch (error) {
      console.warn('[erpService] Failed to fetch academic years:', error);
      return [];
    }
  },
};

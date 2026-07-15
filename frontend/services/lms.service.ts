import { apiClient } from './api.service';
import type {
  SubjectResponse,
  SubjectsResponse,
  CurriculumResponse,
  CurriculumsResponse,
  TimetableSlotResponse,
  TimetableSlotsResponse,
  HomeworkResponse,
  HomeworksResponse,
  AttendanceResponse,
  GradebookResponse
} from '@/types/lms.types';
import qs from 'qs';

// ─────────────────────────────────────────────────────────────────────────────
// Subject & Curriculum Services
// ─────────────────────────────────────────────────────────────────────────────

export const getSubjects = async (params = {}) => {
  const query = qs.stringify({ populate: '*', ...params }, { encodeValuesOnly: true });
  const res = await apiClient.get<SubjectsResponse>(`/subjects?${query}`);
  return res.data;
};

export const getCurriculums = async (params = {}) => {
  const query = qs.stringify({ populate: '*', ...params }, { encodeValuesOnly: true });
  const res = await apiClient.get<CurriculumsResponse>(`/curriculums?${query}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Timetable Services
// ─────────────────────────────────────────────────────────────────────────────

export const getTimetables = async (params = {}) => {
  const query = qs.stringify(
    {
      populate: ['teacher', 'subject', 'classroom', 'section'],
      ...params,
    },
    { encodeValuesOnly: true }
  );
  const res = await apiClient.get<TimetableSlotsResponse>(`/timetable-slots?${query}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Homework Services
// ─────────────────────────────────────────────────────────────────────────────

export const getHomeworks = async (params = {}) => {
  const query = qs.stringify(
    {
      populate: ['subject', 'teacher', 'section'],
      ...params,
    },
    { encodeValuesOnly: true }
  );
  const res = await apiClient.get<HomeworksResponse>(`/homeworks?${query}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// Attendance & Gradebook Services
// ─────────────────────────────────────────────────────────────────────────────

export const getAttendanceRecords = async (params = {}) => {
  const query = qs.stringify(
    {
      populate: ['student', 'section', 'subject'],
      ...params,
    },
    { encodeValuesOnly: true }
  );
  const res = await apiClient.get<AttendanceResponse>(`/attendance-records?${query}`);
  return res.data;
};

export const getGradebookEntries = async (params = {}) => {
  const query = qs.stringify(
    {
      populate: ['student', 'section', 'subject', 'teacher'],
      ...params,
    },
    { encodeValuesOnly: true }
  );
  const res = await apiClient.get<GradebookResponse>(`/gradebook-entries?${query}`);
  return res.data;
};

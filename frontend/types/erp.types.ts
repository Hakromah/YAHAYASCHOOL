import type { UploadedFile as StrapiMedia } from './upload.types';

// ─────────────────────────────────────────────────────────────────────────────
// Repeatable Component Types (`src/components/erp/`)
// ─────────────────────────────────────────────────────────────────────────────

export interface EnrollmentRecord {
  id?: number;
  academicYear: string;
  sectionCode: string;
  enrollmentDate: string;
  status: 'enrolled' | 'promoted' | 'repeated' | 'transferred' | 'withdrawn';
  notes?: string;
}

export interface TimelineItem {
  id?: number;
  date: string;
  title: string;
  category: 'Admission' | 'Academic' | 'Behavioral' | 'Medical' | 'Achievement' | 'Section Change' | 'General';
  description: string; // HTML or Text
  loggedBy?: string;
}

export interface BehaviorRecord {
  id?: number;
  teacherName: string;
  date: string;
  level: 'green' | 'yellow' | 'red';
  category: string;
  description: string;
  recommendation?: string;
}

export interface MedicalRecord {
  id?: number;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  allergies?: string;
  chronicConditions?: string;
  emergencyCarePlan?: string;
  doctorContact?: string;
}

export interface StaffNote {
  id?: number;
  authorName: string;
  authorRole: string;
  date: string;
  noteContent: string;
  isPrivate: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalized Core ERP Entity Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Campus {
  id: number;
  documentId?: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  status: 'active' | 'inactive' | 'under_construction';
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicTerm {
  id: number;
  documentId?: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  academicYear?: AcademicYear;
}

export interface AcademicYear {
  id: number;
  documentId?: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed';
  isCurrent: boolean;
  terms?: AcademicTerm[];
  sections?: Section[];
}

export interface Section {
  id: number;
  documentId?: string;
  name: string;
  code: string;
  capacity: number;
  description?: string;
  active: boolean;
  department?: any;
  program?: any;
  academicYear?: AcademicYear;
  students?: Student[];
  teachers?: Teacher[];
}

export interface Parent {
  id: number;
  documentId?: string;
  schoolId?: string;
  name: string;
  gender?: 'male' | 'female';
  occupation?: string;
  employer?: string;
  relationship: 'father' | 'mother' | 'guardian' | 'other';
  phone: string;
  email?: string;
  address?: string;
  nationalId?: string;
  passport?: string;
  emergencyContact?: string;
  preferredLanguage?: 'en' | 'ar' | 'fr' | 'tr';
  religion?: string;
  notes?: string;
  photo?: StrapiMedia;
  children?: Student[];
}

export interface Teacher {
  id: number;
  documentId?: string;
  schoolId?: string;
  name: string;
  gender?: 'male' | 'female';
  qualifications?: string;
  specializations?: string;
  experienceYears?: number;
  subjects?: any;
  phone: string;
  email?: string;
  address?: string;
  employmentDate?: string;
  employmentStatus: 'active' | 'on_leave' | 'retired' | 'suspended' | 'contract' | 'part_time' | 'full_time';
  salaryGrade?: string;
  biography?: string;
  emergencyContact?: string;
  photo?: StrapiMedia;
  documents?: StrapiMedia[];
  departments?: any[];
  programs?: any[];
  sections?: Section[];
  students?: Student[];
}

export interface Worker {
  id: number;
  documentId?: string;
  schoolId?: string;
  name: string;
  role: string;
  employmentDate?: string;
  employmentStatus: 'active' | 'on_leave' | 'retired' | 'suspended' | 'contract' | 'part_time' | 'full_time';
  salaryGrade?: string;
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  photo?: StrapiMedia;
  documents?: StrapiMedia[];
  departments?: any[];
}

export interface Student {
  id: number;
  documentId?: string;
  schoolId?: string;
  admissionNumber?: string;
  photo?: StrapiMedia;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'male' | 'female';
  dateOfBirth?: string;
  nationality?: string;
  religion?: string;
  placeOfBirth?: string;
  nationalId?: string;
  passportNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  county?: string;
  country?: string;
  admissionDate?: string;
  graduationDate?: string;
  status: 'active' | 'inactive' | 'suspended' | 'graduated' | 'transferred' | 'withdrawn' | 'expelled' | 'alumni';
  biography?: string;
  generalNotes?: string;
  emergencyContacts?: any;
  qrCodeData?: string;
  barcodeData?: string;
  parents?: Parent[];
  departments?: any[];
  programs?: any[];
  sections?: Section[];
  teachers?: Teacher[];
  academicYears?: AcademicYear[];
  enrollmentHistory?: EnrollmentRecord[];
  timeline?: TimelineItem[];
  behaviorRecords?: BehaviorRecord[];
  medicalInfo?: MedicalRecord[];
  staffNotes?: StaffNote[];
  documents?: StrapiMedia[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Directory Search & Filter Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface DirectorySearchParams {
  query?: string;
  section?: string;
  gender?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface PaginatedERPResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

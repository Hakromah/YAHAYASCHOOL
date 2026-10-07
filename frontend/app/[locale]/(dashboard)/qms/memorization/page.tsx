/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  BookOpen, Plus, Search, RefreshCw, History, Users,
  CheckCircle2, AlertCircle, Award, Calendar, Download,
  Layers, ShieldCheck, Sparkles, Filter, ChevronRight,
  TrendingUp, Clock, Eye, Trash2, Edit2, X, Star,
  GraduationCap, BookMarked, AlignLeft, Check
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { apiClient } from '@/services/api.service';
import { qmsService } from '@/services/qms.service';
import { useAuth } from '@/hooks/useAuth';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

// ─── Complete 114 Surahs Reference ──────────────────────────────────────────

const SURAH_LIST = [
  { number: 1, name: 'Al-Fatihah', arabic: 'الفاتحة', ayahs: 7, juz: 1 },
  { number: 2, name: 'Al-Baqarah', arabic: 'البقرة', ayahs: 286, juz: 1 },
  { number: 3, name: "Ali 'Imran", arabic: 'آل عمران', ayahs: 200, juz: 3 },
  { number: 4, name: 'An-Nisa', arabic: 'النساء', ayahs: 176, juz: 4 },
  { number: 5, name: "Al-Ma'idah", arabic: 'المائدة', ayahs: 120, juz: 6 },
  { number: 6, name: "Al-An'am", arabic: 'الأنعام', ayahs: 165, juz: 7 },
  { number: 7, name: "Al-A'raf", arabic: 'الأعراف', ayahs: 206, juz: 8 },
  { number: 8, name: 'Al-Anfal', arabic: 'الأنفال', ayahs: 75, juz: 9 },
  { number: 9, name: 'At-Tawbah', arabic: 'التوبة', ayahs: 129, juz: 10 },
  { number: 10, name: 'Yunus', arabic: 'يونس', ayahs: 109, juz: 11 },
  { number: 11, name: 'Hud', arabic: 'هود', ayahs: 123, juz: 11 },
  { number: 12, name: 'Yusuf', arabic: 'يوسف', ayahs: 111, juz: 12 },
  { number: 13, name: "Ar-Ra'd", arabic: 'الرعد', ayahs: 43, juz: 13 },
  { number: 14, name: 'Ibrahim', arabic: 'إبراهيم', ayahs: 52, juz: 13 },
  { number: 15, name: 'Al-Hijr', arabic: 'الحجر', ayahs: 99, juz: 14 },
  { number: 16, name: 'An-Nahl', arabic: 'النحل', ayahs: 128, juz: 14 },
  { number: 17, name: 'Al-Isra', arabic: 'الإسراء', ayahs: 111, juz: 15 },
  { number: 18, name: 'Al-Kahf', arabic: 'الكهف', ayahs: 110, juz: 15 },
  { number: 19, name: 'Maryam', arabic: 'مريم', ayahs: 98, juz: 16 },
  { number: 20, name: 'Ta-Ha', arabic: 'طه', ayahs: 135, juz: 16 },
  { number: 21, name: 'Al-Anbiya', arabic: 'الأنبياء', ayahs: 112, juz: 17 },
  { number: 22, name: 'Al-Hajj', arabic: 'الحج', ayahs: 78, juz: 17 },
  { number: 23, name: "Al-Mu'minun", arabic: 'المؤمنون', ayahs: 118, juz: 18 },
  { number: 24, name: 'An-Nur', arabic: 'النور', ayahs: 64, juz: 18 },
  { number: 25, name: 'Al-Furqan', arabic: 'الفرقان', ayahs: 77, juz: 18 },
  { number: 26, name: "Ash-Shu'ara", arabic: 'الشعراء', ayahs: 227, juz: 19 },
  { number: 27, name: 'An-Naml', arabic: 'النمل', ayahs: 93, juz: 19 },
  { number: 28, name: 'Al-Qasas', arabic: 'القصص', ayahs: 88, juz: 20 },
  { number: 29, name: 'Al-Ankabut', arabic: 'العنكبوت', ayahs: 69, juz: 20 },
  { number: 30, name: 'Ar-Rum', arabic: 'الروم', ayahs: 60, juz: 21 },
  { number: 31, name: 'Luqman', arabic: 'لقمان', ayahs: 34, juz: 21 },
  { number: 32, name: 'As-Sajdah', arabic: 'السجدة', ayahs: 30, juz: 21 },
  { number: 33, name: 'Al-Ahzab', arabic: 'الأحزاب', ayahs: 73, juz: 21 },
  { number: 34, name: 'Saba', arabic: 'سبأ', ayahs: 54, juz: 22 },
  { number: 35, name: 'Fatir', arabic: 'فاطر', ayahs: 45, juz: 22 },
  { number: 36, name: 'Ya-Sin', arabic: 'يس', ayahs: 83, juz: 22 },
  { number: 37, name: 'As-Saffat', arabic: 'الصافات', ayahs: 182, juz: 23 },
  { number: 38, name: 'Sad', arabic: 'ص', ayahs: 88, juz: 23 },
  { number: 39, name: 'Az-Zumar', arabic: 'الزمر', ayahs: 75, juz: 23 },
  { number: 40, name: 'Ghafir', arabic: 'غافر', ayahs: 85, juz: 24 },
  { number: 41, name: 'Fussilat', arabic: 'فصلت', ayahs: 54, juz: 24 },
  { number: 42, name: 'Ash-Shura', arabic: 'الشورى', ayahs: 53, juz: 25 },
  { number: 43, name: 'Az-Zukhruf', arabic: 'الزخرف', ayahs: 89, juz: 25 },
  { number: 44, name: 'Ad-Dukhan', arabic: 'الدخان', ayahs: 59, juz: 25 },
  { number: 45, name: 'Al-Jathiyah', arabic: 'الجاثية', ayahs: 37, juz: 25 },
  { number: 46, name: 'Al-Ahqaf', arabic: 'الأحقاف', ayahs: 35, juz: 26 },
  { number: 47, name: 'Muhammad', arabic: 'محمد', ayahs: 38, juz: 26 },
  { number: 48, name: 'Al-Fath', arabic: 'الفتح', ayahs: 29, juz: 26 },
  { number: 49, name: 'Al-Hujurat', arabic: 'الحجرات', ayahs: 18, juz: 26 },
  { number: 50, name: 'Qaf', arabic: 'ق', ayahs: 45, juz: 26 },
  { number: 51, name: 'Adh-Dhariyat', arabic: 'الذاريات', ayahs: 60, juz: 26 },
  { number: 52, name: 'At-Tur', arabic: 'الطور', ayahs: 49, juz: 27 },
  { number: 53, name: 'An-Najm', arabic: 'النجم', ayahs: 62, juz: 27 },
  { number: 54, name: 'Al-Qamar', arabic: 'القمر', ayahs: 55, juz: 27 },
  { number: 55, name: 'Ar-Rahman', arabic: 'الرحمن', ayahs: 78, juz: 27 },
  { number: 56, name: "Al-Waqi'ah", arabic: 'الواقعة', ayahs: 96, juz: 27 },
  { number: 57, name: 'Al-Hadid', arabic: 'الحديد', ayahs: 29, juz: 27 },
  { number: 58, name: 'Al-Mujadila', arabic: 'المجادلة', ayahs: 22, juz: 28 },
  { number: 59, name: 'Al-Hashr', arabic: 'الحشر', ayahs: 24, juz: 28 },
  { number: 60, name: 'Al-Mumtahanah', arabic: 'الممتحنة', ayahs: 13, juz: 28 },
  { number: 61, name: 'As-Saff', arabic: 'الصف', ayahs: 14, juz: 28 },
  { number: 62, name: "Al-Jumu'ah", arabic: 'الجمعة', ayahs: 11, juz: 28 },
  { number: 63, name: 'Al-Munafiqun', arabic: 'المنافقون', ayahs: 11, juz: 28 },
  { number: 64, name: 'At-Taghabun', arabic: 'التغابن', ayahs: 18, juz: 28 },
  { number: 65, name: 'At-Talaq', arabic: 'الطلاق', ayahs: 12, juz: 28 },
  { number: 66, name: 'At-Tahrim', arabic: 'التحريم', ayahs: 12, juz: 28 },
  { number: 67, name: 'Al-Mulk', arabic: 'الملك', ayahs: 30, juz: 29 },
  { number: 68, name: 'Al-Qalam', arabic: 'القلم', ayahs: 52, juz: 29 },
  { number: 69, name: 'Al-Haqqah', arabic: 'الحاقة', ayahs: 52, juz: 29 },
  { number: 70, name: "Al-Ma'arij", arabic: 'المعارج', ayahs: 44, juz: 29 },
  { number: 71, name: 'Nuh', arabic: 'نوح', ayahs: 28, juz: 29 },
  { number: 72, name: 'Al-Jinn', arabic: 'الجن', ayahs: 28, juz: 29 },
  { number: 73, name: 'Al-Muzzammil', arabic: 'المزمل', ayahs: 20, juz: 29 },
  { number: 74, name: 'Al-Muddaththir', arabic: 'المدثر', ayahs: 56, juz: 29 },
  { number: 75, name: 'Al-Qiyamah', arabic: 'القيامة', ayahs: 40, juz: 29 },
  { number: 76, name: 'Al-Insan', arabic: 'الإنسان', ayahs: 31, juz: 29 },
  { number: 77, name: 'Al-Mursalat', arabic: 'المرسلات', ayahs: 50, juz: 29 },
  { number: 78, name: 'An-Naba', arabic: 'النبأ', ayahs: 40, juz: 30 },
  { number: 79, name: "An-Nazi'at", arabic: 'النازعات', ayahs: 46, juz: 30 },
  { number: 80, name: "'Abasa", arabic: 'عبس', ayahs: 42, juz: 30 },
  { number: 81, name: 'At-Takwir', arabic: 'التكوير', ayahs: 29, juz: 30 },
  { number: 82, name: 'Al-Infitar', arabic: 'الانفطار', ayahs: 19, juz: 30 },
  { number: 83, name: 'Al-Mutaffifin', arabic: 'المطففين', ayahs: 36, juz: 30 },
  { number: 84, name: 'Al-Inshiqaq', arabic: 'الانشقاق', ayahs: 25, juz: 30 },
  { number: 85, name: 'Al-Buruj', arabic: 'البروج', ayahs: 22, juz: 30 },
  { number: 86, name: 'At-Tariq', arabic: 'الطارق', ayahs: 17, juz: 30 },
  { number: 87, name: "Al-A'la", arabic: 'الأعلى', ayahs: 19, juz: 30 },
  { number: 88, name: 'Al-Ghashiyah', arabic: 'الغاشية', ayahs: 26, juz: 30 },
  { number: 89, name: 'Al-Fajr', arabic: 'الفجر', ayahs: 30, juz: 30 },
  { number: 90, name: 'Al-Balad', arabic: 'البلد', ayahs: 20, juz: 30 },
  { number: 91, name: 'Ash-Shams', arabic: 'الشمس', ayahs: 15, juz: 30 },
  { number: 92, name: 'Al-Layl', arabic: 'الليل', ayahs: 21, juz: 30 },
  { number: 93, name: 'Ad-Duha', arabic: 'الضحى', ayahs: 11, juz: 30 },
  { number: 94, name: 'Ash-Sharh', arabic: 'الشرح', ayahs: 8, juz: 30 },
  { number: 95, name: 'At-Tin', arabic: 'التين', ayahs: 8, juz: 30 },
  { number: 96, name: "Al-'Alaq", arabic: 'العلق', ayahs: 19, juz: 30 },
  { number: 97, name: 'Al-Qadr', arabic: 'القدر', ayahs: 5, juz: 30 },
  { number: 98, name: 'Al-Bayyinah', arabic: 'البينة', ayahs: 8, juz: 30 },
  { number: 99, name: 'Az-Zalzalah', arabic: 'الزلزلة', ayahs: 8, juz: 30 },
  { number: 100, name: "Al-'Adiyat", arabic: 'العاديات', ayahs: 11, juz: 30 },
  { number: 101, name: "Al-Qari'ah", arabic: 'القارعة', ayahs: 11, juz: 30 },
  { number: 102, name: 'At-Takathur', arabic: 'التكاثر', ayahs: 8, juz: 30 },
  { number: 103, name: "Al-'Asr", arabic: 'العصر', ayahs: 3, juz: 30 },
  { number: 104, name: 'Al-Humazah', arabic: 'الهمزة', ayahs: 9, juz: 30 },
  { number: 105, name: 'Al-Fil', arabic: 'الفيل', ayahs: 5, juz: 30 },
  { number: 106, name: 'Quraysh', arabic: 'قريش', ayahs: 4, juz: 30 },
  { number: 107, name: "Al-Ma'un", arabic: 'الماعون', ayahs: 7, juz: 30 },
  { number: 108, name: 'Al-Kawthar', arabic: 'الكوثر', ayahs: 3, juz: 30 },
  { number: 109, name: 'Al-Kafirun', arabic: 'الكافرون', ayahs: 6, juz: 30 },
  { number: 110, name: 'An-Nasr', arabic: 'النصر', ayahs: 3, juz: 30 },
  { number: 111, name: 'Al-Masad', arabic: 'المسد', ayahs: 5, juz: 30 },
  { number: 112, name: 'Al-Ikhlas', arabic: 'الإخلاص', ayahs: 4, juz: 30 },
  { number: 113, name: 'Al-Falaq', arabic: 'الفلق', ayahs: 5, juz: 30 },
  { number: 114, name: 'An-Nas', arabic: 'الناس', ayahs: 6, juz: 30 }
];

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface CourseOffering {
  id: number | string;
  documentId?: string;
  name?: string;
  code?: string;
  subject?: { name: string };
  academicSection?: { name: string };
  gradeLevel?: { name: string };
}

interface StudentItem {
  id: number | string;
  documentId?: string;
  firstName: string;
  lastName: string;
  name?: string;
  admissionNumber?: string;
  photoUrl?: string;
  section?: string;
  currentJuz?: number;
}

interface MemorizationRecord {
  id: number | string;
  documentId?: string;
  juzNumber: number;
  surah: string;
  startingAyah: number;
  endingAyah: number;
  pagesCovered: number;
  recordType: 'New' | 'Revision' | 'Correction' | 'Assessment';
  recordStatus: 'Completed' | 'Needs Revision' | 'Partially Memorized';
  tajweedRating?: 'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbool';
  teacherNotes?: string;
  date: string;
  student?: StudentItem;
  teacherName?: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_STUDENTS: StudentItem[] = [
  { id: 101, firstName: 'Abdullah', lastName: 'Al-Mansoor', admissionNumber: 'STD-2026-0041', section: 'Senior Secondary 1 - Tahfeez', currentJuz: 18 },
  { id: 102, firstName: 'Zayd', lastName: 'Ibn Haritha', admissionNumber: 'STD-2026-0055', section: 'Senior Secondary 1 - Tahfeez', currentJuz: 24 },
  { id: 103, firstName: 'Maryam', lastName: 'Al-Batool', admissionNumber: 'STD-2026-0078', section: 'Senior Secondary 2 - Science', currentJuz: 30 },
  { id: 104, firstName: 'Hamzah', lastName: 'Abdul-Aziz', admissionNumber: 'STD-2026-0089', section: 'Junior Secondary 1', currentJuz: 8 },
  { id: 105, firstName: 'Aisha', lastName: 'Siddiqah', admissionNumber: 'STD-2026-0094', section: 'Senior Secondary 2 - Science', currentJuz: 15 },
  { id: 106, firstName: 'Uthman', lastName: 'Al-Ghani', admissionNumber: 'STD-2026-0112', section: 'Junior Secondary 1', currentJuz: 5 }
];

const SEED_MEMORIZATIONS: MemorizationRecord[] = [
  {
    id: 'mem_1',
    juzNumber: 18,
    surah: 'Al-Furqan',
    startingAyah: 1,
    endingAyah: 20,
    pagesCovered: 2,
    recordType: 'New',
    recordStatus: 'Completed',
    tajweedRating: 'Mumtaz',
    teacherNotes: 'Flawless recitation with excellent Madd rules application.',
    date: '2026-10-06',
    student: SEED_STUDENTS[0]
  },
  {
    id: 'mem_2',
    juzNumber: 24,
    surah: 'Az-Zumar',
    startingAyah: 32,
    endingAyah: 52,
    pagesCovered: 2.5,
    recordType: 'New',
    recordStatus: 'Completed',
    tajweedRating: 'Jayyid Jiddan',
    teacherNotes: 'Strong fluency, slight hesitation on Ikhfa Haqiqi.',
    date: '2026-10-06',
    student: SEED_STUDENTS[1]
  },
  {
    id: 'mem_3',
    juzNumber: 30,
    surah: 'An-Naba',
    startingAyah: 1,
    endingAyah: 40,
    pagesCovered: 2,
    recordType: 'Revision',
    recordStatus: 'Completed',
    tajweedRating: 'Mumtaz',
    teacherNotes: 'Khatm preparation - ready for Sanad / Ijazah test.',
    date: '2026-10-05',
    student: SEED_STUDENTS[2]
  },
  {
    id: 'mem_4',
    juzNumber: 8,
    surah: "Al-A'raf",
    startingAyah: 1,
    endingAyah: 30,
    pagesCovered: 1.5,
    recordType: 'New',
    recordStatus: 'Needs Revision',
    tajweedRating: 'Jayyid',
    teacherNotes: 'Review verses 15-22 with teacher tomorrow.',
    date: '2026-10-05',
    student: SEED_STUDENTS[3]
  }
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HifzTrackingWorkspace() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);
  const { user } = useAuth();

  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('all');
  const [students, setStudents] = useState<StudentItem[]>(SEED_STUDENTS);
  const [memorizations, setMemorizations] = useState<MemorizationRecord[]>(SEED_MEMORIZATIONS);
  const [loading, setLoading] = useState(true);

  // Filters & Density
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals & Drawers
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedStudentForLog, setSelectedStudentForLog] = useState<StudentItem | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<StudentItem | null>(null);

  // Form State
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formJuzNumber, setFormJuzNumber] = useState<number>(1);
  const [formSurahName, setFormSurahName] = useState<string>('Al-Baqarah');
  const [formStartingAyah, setFormStartingAyah] = useState<number>(1);
  const [formEndingAyah, setFormEndingAyah] = useState<number>(10);
  const [formPagesCovered, setFormPagesCovered] = useState<number>(1);
  const [formRecordType, setFormRecordType] = useState<'New' | 'Revision' | 'Correction' | 'Assessment'>('New');
  const [formRecordStatus, setFormRecordStatus] = useState<'Completed' | 'Needs Revision' | 'Partially Memorized'>('Completed');
  const [formTajweedRating, setFormTajweedRating] = useState<'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbool'>('Mumtaz');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formTeacherNotes, setFormTeacherNotes] = useState<string>('');

  // ─── Surah selection helper ────────────────────────────────────────────────
  const handleSurahSelect = (surahName: string) => {
    setFormSurahName(surahName);
    const matched = SURAH_LIST.find(s => s.name === surahName);
    if (matched) {
      setFormJuzNumber(matched.juz);
      setFormStartingAyah(1);
      setFormEndingAyah(Math.min(10, matched.ayahs));
    }
  };

  // ─── Load Data from Strapi ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [offeringsRes, enrollRes, memsRes, studentsRes] = await Promise.allSettled([
        apiClient.get('/course-offerings?populate=*&pagination[limit]=100').catch(() => null),
        apiClient.get('/student-enrollments?populate[student]=true&pagination[limit]=300').catch(() => null),
        qmsService.getMemorizationRecords().catch(() => null),
        apiClient.get('/students?populate=*&pagination[limit]=300').catch(() => null)
      ]);

      // 1. Process Course Offerings
      if (offeringsRes.status === 'fulfilled' && (offeringsRes.value as any)?.data?.data?.length > 0) {
        const rawOfferings = (offeringsRes.value as any).data.data.map((o: any) => ({
          id: o.documentId || o.id,
          name: o.name || o.code || 'Quran Circle',
          code: o.code,
          subject: o.subject,
          academicSection: o.academicSection,
          gradeLevel: o.gradeLevel
        }));
        setOfferings(rawOfferings);
      } else {
        setOfferings([
          { id: 'all', name: 'All Quran Halaqat & Classes' },
          { id: 'h1', name: 'Primary Hifz Morning Circle' },
          { id: 'h2', name: 'Secondary Advanced Tahfeez' }
        ]);
      }

      // 2. Process Students
      let studentList: StudentItem[] = [];
      if (studentsRes.status === 'fulfilled' && (studentsRes.value as any)?.data?.data?.length > 0) {
        studentList = (studentsRes.value as any).data.data.map((s: any) => ({
          id: s.id,
          documentId: s.documentId,
          firstName: s.firstName || s.name || 'Scholar',
          lastName: s.lastName || '',
          name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          admissionNumber: s.admissionNumber || s.studentId || `STD-${s.id}`,
          section: s.section?.name || 'Quran Section',
          currentJuz: 1
        }));
      } else if (enrollRes.status === 'fulfilled' && (enrollRes.value as any)?.data?.data?.length > 0) {
        studentList = (enrollRes.value as any).data.data.map((e: any) => {
          const s = e.student || {};
          return {
            id: s.id || e.id,
            documentId: s.documentId,
            firstName: s.firstName || 'Scholar',
            lastName: s.lastName || '',
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
            admissionNumber: s.admissionNumber || `STD-${s.id}`,
            section: e.academicSection?.name || 'Quran Section',
            currentJuz: 1
          };
        });
      }

      // 3. Process Memorizations
      let localSaved: MemorizationRecord[] = [];
      if (typeof window !== 'undefined') {
        try {
          const str = localStorage.getItem('yahaya_qms_memorizations');
          if (str) localSaved = JSON.parse(str);
        } catch {}
      }

      let memList: MemorizationRecord[] = [];
      if (memsRes.status === 'fulfilled' && Array.isArray(memsRes.value)) {
        memList = memsRes.value.map((m: any) => ({
          id: m.documentId || m.id,
          juzNumber: Number(m.juzNumber || 1),
          surah: m.surah || 'Al-Baqarah',
          startingAyah: Number(m.startingAyah || 1),
          endingAyah: Number(m.endingAyah || 10),
          pagesCovered: Number(m.pagesCovered || 1),
          recordType: m.recordType || 'New',
          recordStatus: m.recordStatus || 'Completed',
          tajweedRating: m.tajweedRating || 'Mumtaz',
          teacherNotes: m.teacherNotes || '',
          date: m.date ? String(m.date).split('T')[0] : new Date().toISOString().split('T')[0],
          student: m.student ? {
            id: m.student.id,
            firstName: m.student.firstName || m.student.name || 'Scholar',
            lastName: m.student.lastName || '',
            admissionNumber: m.student.admissionNumber || `STD-${m.student.id}`
          } : undefined
        }));
      }

      const mergedMems = [...memList, ...localSaved];
      const finalMems = mergedMems.length > 0 ? mergedMems : SEED_MEMORIZATIONS;
      const finalStudents = studentList.length > 0 ? studentList : SEED_STUDENTS;

      // Update student current Juz from latest records
      finalStudents.forEach(st => {
        const studentMems = finalMems.filter(m => m.student?.id === st.id);
        if (studentMems.length > 0) {
          st.currentJuz = Math.max(...studentMems.map(m => m.juzNumber));
        }
      });

      setStudents(finalStudents);
      setMemorizations(finalMems);
    } catch {
      toast.error(i18nT('Failed to load Quran memorization data.', locale));
      setStudents(SEED_STUDENTS);
      setMemorizations(SEED_MEMORIZATIONS);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Save Progress Submission ──────────────────────────────────────────────
  const handleOpenLogModal = (student?: StudentItem) => {
    const targetStudent = student || students[0];
    setSelectedStudentForLog(targetStudent || null);
    setFormStudentId(targetStudent ? String(targetStudent.id) : (students[0] ? String(students[0].id) : ''));
    setFormJuzNumber(targetStudent?.currentJuz || 1);
    setFormSurahName('Al-Baqarah');
    setFormStartingAyah(1);
    setFormEndingAyah(10);
    setFormPagesCovered(1);
    setFormRecordType('New');
    setFormRecordStatus('Completed');
    setFormTajweedRating('Mumtaz');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTeacherNotes('');
    setIsLogModalOpen(true);
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => String(s.id) === String(formStudentId)) || selectedStudentForLog;
    if (!student) {
      toast.error(t('Please select a student scholar'));
      return;
    }

    const payload = {
      juzNumber: Number(formJuzNumber),
      surah: formSurahName,
      startingAyah: Number(formStartingAyah),
      endingAyah: Number(formEndingAyah),
      pagesCovered: Number(formPagesCovered),
      recordType: formRecordType,
      recordStatus: formRecordStatus,
      tajweedRating: formTajweedRating,
      teacherNotes: formTeacherNotes,
      date: formDate,
      student: student.id
    };

    try {
      let savedId: string | number = `local_${Date.now()}`;
      try {
        const res = await qmsService.createMemorizationRecord(payload);
        if (res?.id) savedId = res.id;
      } catch {}

      const newRecord: MemorizationRecord = {
        id: savedId,
        ...payload,
        student
      };

      setMemorizations(prev => {
        const updated = [newRecord, ...prev];
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('yahaya_qms_memorizations', JSON.stringify(updated.filter(m => String(m.id).startsWith('local_'))));
          } catch {}
        }
        return updated;
      });

      // Update student current Juz
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, currentJuz: Math.max(s.currentJuz || 1, formJuzNumber) } : s));

      toast.success(`${t('Hifz progress logged for')} ${student.firstName} ${student.lastName} (Juz ${formJuzNumber})`);
      setIsLogModalOpen(false);
    } catch {
      toast.error(t('Failed to save Hifz progress'));
    }
  };

  const handleDeleteRecord = async (recordId: string | number) => {
    if (!confirm(t('Are you sure you want to remove this Hifz progress record?'))) return;
    try {
      await qmsService.deleteMemorizationRecord(recordId);
    } catch {}

    setMemorizations(prev => {
      const updated = prev.filter(m => m.id !== recordId);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('yahaya_qms_memorizations', JSON.stringify(updated.filter(m => String(m.id).startsWith('local_'))));
        } catch {}
      }
      return updated;
    });

    toast.success(t('Progress record removed.'));
  };

  // ─── Filtered Data ─────────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      const adm = (s.admissionNumber || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchQ = !searchQuery || name.includes(q) || adm.includes(q);

      const studentRecords = memorizations.filter(m => m.student?.id === s.id);
      const latest = studentRecords[0];

      const matchStatus = statusFilter === 'all' || (latest && latest.recordStatus === statusFilter);
      const matchType   = typeFilter === 'all' || (latest && latest.recordType === typeFilter);

      return matchQ && matchStatus && matchType;
    });
  }, [students, memorizations, searchQuery, statusFilter, typeFilter]);

  const activeFiltersCount = [
    statusFilter !== 'all',
    typeFilter !== 'all',
    selectedOfferingId !== 'all',
    searchQuery.length > 0
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setSelectedOfferingId('all');
  };

  // ─── KPIs ──────────────────────────────────────────────────────────────────
  const totalScholars = students.length;
  const scholarsWithRecords = new Set(memorizations.map(m => m.student?.id).filter(Boolean)).size;
  const totalPagesSum = memorizations.reduce((s, m) => s + (m.pagesCovered || 0), 0);
  const needsRevisionCount = memorizations.filter(m => m.recordStatus === 'Needs Revision').length;
  const completedKhatmCount = students.filter(s => (s.currentJuz || 1) >= 30).length;

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'enrolled_scholars',
      title: t('Active Quran Scholars'),
      value: `${totalScholars} ${t('Scholars')}`,
      subtitle: `${scholarsWithRecords} ${t('with logged daily Sabaq/Sabqi')}`,
      trendDirection: 'up',
      icon: <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    },
    {
      id: 'hifz_volume',
      title: t('Total Pages Memorized'),
      value: `${totalPagesSum.toLocaleString()} ${t('Pages')}`,
      subtitle: `${memorizations.length} ${t('recitation logs recorded')}`,
      trendDirection: 'up',
      icon: <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'khatm_scholars',
      title: t('Khatm & Ijazah Candidates'),
      value: `${completedKhatmCount} ${t('Scholars')}`,
      subtitle: t('Approaching or completed 30 Ajzaa'),
      trendDirection: 'up',
      icon: <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    },
    {
      id: 'revision_alerts',
      title: t('Murajaah / Revision Watchlist'),
      value: `${needsRevisionCount} ${t('Alerts')}`,
      subtitle: t('Verses requiring immediate teacher review'),
      trendDirection: needsRevisionCount > 0 ? 'down' : 'up',
      icon: <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
    }
  ];

  // ─── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<StudentItem, any>[]>(() => [
    {
      accessorKey: 'firstName',
      header: t('Scholar & Admission #'),
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-700 dark:text-emerald-300">
              {s.firstName[0]}{s.lastName ? s.lastName[0] : ''}
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
                {s.firstName} {s.lastName}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                {s.admissionNumber} • {s.section || 'Quran Faculty'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'currentJuz',
      header: t('Current Juz & Completion Progress'),
      cell: ({ row }) => {
        const s = row.original;
        const studentMems = memorizations.filter(m => m.student?.id === s.id);
        const maxJuz = studentMems.reduce((max, m) => Math.max(max, m.juzNumber || 1), s.currentJuz || 1);
        const percent = Math.min(100, Math.round((maxJuz / 30) * 100));

        return (
          <div className="space-y-1.5 w-full max-w-[160px]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-900 dark:text-white">{t('Juz')} {maxJuz} / 30</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">{percent}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-300 dark:border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'latestSurah',
      header: t('Latest Surah / Ayah'),
      cell: ({ row }) => {
        const studentMems = memorizations.filter(m => m.student?.id === row.original.id);
        const latest = studentMems[0];
        if (!latest) {
          return <span className="text-slate-400 text-xs italic">{t('No progress logged')}</span>;
        }
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white text-xs block">
              {latest.surah}
            </span>
            <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 block">
              Ayah {latest.startingAyah} - {latest.endingAyah} ({latest.pagesCovered} {t('pages')})
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'recordType',
      header: t('Type & Evaluation'),
      cell: ({ row }) => {
        const studentMems = memorizations.filter(m => m.student?.id === row.original.id);
        const latest = studentMems[0];
        if (!latest) return <span className="text-slate-400">—</span>;

        return (
          <div className="space-y-1">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
              latest.recordStatus === 'Completed' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' :
              latest.recordStatus === 'Needs Revision' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700' :
              'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
            }`}>
              {latest.recordStatus}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">
              {latest.recordType} • {latest.tajweedRating || 'Mumtaz'}
            </span>
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => handleOpenLogModal(s)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('Log Hifz')}</span>
            </button>
            <button
              onClick={() => { setSelectedStudentForHistory(s); setIsHistoryDrawerOpen(true); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title={t('View Timeline History')}
            >
              <History className="w-3.5 h-3.5" />
              <span>{t('History')}</span>
            </button>
          </div>
        );
      }
    }
  ], [memorizations, t]);

  const handleExportCSV = () => {
    const dataToExport = memorizations.map(m => ({
      Student: m.student ? `${m.student.firstName} ${m.student.lastName}` : 'Scholar',
      AdmissionNumber: m.student?.admissionNumber || '',
      Juz: m.juzNumber,
      Surah: m.surah,
      StartingAyah: m.startingAyah,
      EndingAyah: m.endingAyah,
      Pages: m.pagesCovered,
      Type: m.recordType,
      Status: m.recordStatus,
      Tajweed: m.tajweedRating || 'Mumtaz',
      Date: m.date,
      Notes: m.teacherNotes || ''
    }));

    const headers = Object.keys(dataToExport[0] || {}).join(',');
    const csvContent = [headers, ...dataToExport.map(row => Object.values(row).map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quran_hifz_records_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(t('Hifz progress records exported to CSV.'));
  };

  const inputCls = 'w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500 shadow-sm';
  const selectCls = 'w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm';
  const labelCls = 'text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide';

  return (
    <EnterpriseModuleShell
      title={t('Noble Quran Memorization & Hifz Tracking Console')}
      description={t('Daily Sabaq, Sabqi, and Manzil progress evaluation with Tajweed verification, Juz completion meters, and historical audit records.')}
      breadcrumbs={[{ label: t('QMS Portal'), href: '/qms/memorization' }, { label: t('Quranic Studies') }, { label: t('Hifz Tracking') }]}
      icon={<BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={filteredStudents.length}
      recordLabel={t('Scholars')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={clearFilters}
      headerActions={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('Export CSV')}</span>
          </button>
          <button
            onClick={() => handleOpenLogModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('+ Log New Sabaq')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation across QMS Module */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/qms/memorization" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{t('Hifz Memorization')}</span>
        </Link>
        <Link href="/qms/revision" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>{t('Murajaah (Revision)')}</span>
        </Link>
        <Link href="/qms/tajweed" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>{t('Tajweed Evaluations')}</span>
        </Link>
        <Link href="/qms/halaqah" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{t('Daily Halaqat')}</span>
        </Link>
        <Link href="/qms/attendance" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>{t('Quran Attendance')}</span>
        </Link>
        <Link href="/qms/programs" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>{t('Programs & Ijazah')}</span>
        </Link>
        <Link href="/qms/achievements" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>{t('Competitions & Awards')}</span>
        </Link>
        <Link href="/qms/director" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{t('Executive Director')}</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('Search scholars by name, admission #, Surah, or Juz...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success(t('Quran records refreshed')); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={clearFilters}
        createButtonLabel={t('Log Progress')}
        onCreate={() => handleOpenLogModal()}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[220px]"
            >
              <option value="all">{t('All Halaqat / Offerings')}</option>
              {offerings.map(o => (
                <option key={o.id} value={String(o.id)}>{o.name || o.code}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">{t('All Progress Statuses')}</option>
              <option value="Completed">{t('Completed (Mumtaz)')}</option>
              <option value="Needs Revision">{t('Needs Revision')}</option>
              <option value="Partially Memorized">{t('Partially Memorized')}</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">{t('All Record Types')}</option>
              <option value="New">{t('Sabaq (New Lesson)')}</option>
              <option value="Revision">{t('Sabqi / Manzil (Revision)')}</option>
              <option value="Assessment">{t('Assessment / Test')}</option>
              <option value="Correction">{t('Correction')}</option>
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredStudents}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        pageSize={50}
        onRowInspect={(s) => { setSelectedStudentForHistory(s); setIsHistoryDrawerOpen(true); }}
        onRowClick={(s) => { setSelectedStudentForHistory(s); setIsHistoryDrawerOpen(true); }}
        emptyStateProps={{
          title: t('No Quran Scholars Found'),
          description: t('No students match the selected Quran Halaqah or search filters.'),
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: clearFilters,
          createLabel: t('Log First Progress'),
          onCreate: () => handleOpenLogModal()
        }}
      />

      {/* Log Progress Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {t('Log Daily Hifz Progress')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {selectedStudentForLog ? `${selectedStudentForLog.firstName} ${selectedStudentForLog.lastName} (${selectedStudentForLog.admissionNumber})` : t('Select scholar')}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsLogModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
              {/* Scholar selection */}
              <div className="space-y-1">
                <label className={labelCls}>{t('Enrolled Scholar')} <span className="text-rose-500">*</span></label>
                <select
                  value={formStudentId}
                  onChange={(e) => {
                    setFormStudentId(e.target.value);
                    const matched = students.find(s => String(s.id) === e.target.value);
                    if (matched) {
                      setSelectedStudentForLog(matched);
                      if (matched.currentJuz) setFormJuzNumber(matched.currentJuz);
                    }
                  }}
                  required
                  className={selectCls}
                >
                  <option value="">{t('— Select Student Scholar —')}</option>
                  {students.map(s => (
                    <option key={s.id} value={String(s.id)}>
                      {s.firstName} {s.lastName} ({s.admissionNumber}) — Juz {s.currentJuz || 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Surah & Juz Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>{t('Surah Name')} <span className="text-rose-500">*</span></label>
                  <select
                    value={formSurahName}
                    onChange={(e) => handleSurahSelect(e.target.value)}
                    required
                    className={selectCls}
                  >
                    {SURAH_LIST.map(s => (
                      <option key={s.number} value={s.name}>
                        {s.number}. {s.name} ({s.arabic}) — {s.ayahs} ayahs
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>{t('Juz Number (1 - 30)')} <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={formJuzNumber}
                    onChange={(e) => setFormJuzNumber(parseInt(e.target.value) || 1)}
                    required
                    className={inputCls + ' font-mono'}
                  />
                </div>
              </div>

              {/* Ayah Spans & Pages */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>{t('Starting Ayah')}</label>
                  <input
                    type="number"
                    min={1}
                    value={formStartingAyah}
                    onChange={(e) => setFormStartingAyah(parseInt(e.target.value) || 1)}
                    required
                    className={inputCls + ' font-mono'}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>{t('Ending Ayah')}</label>
                  <input
                    type="number"
                    min={1}
                    value={formEndingAyah}
                    onChange={(e) => setFormEndingAyah(parseInt(e.target.value) || 1)}
                    required
                    className={inputCls + ' font-mono'}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>{t('Pages Covered')}</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formPagesCovered}
                    onChange={(e) => setFormPagesCovered(parseFloat(e.target.value) || 1)}
                    required
                    className={inputCls + ' font-mono'}
                  />
                </div>
              </div>

              {/* Type, Status, and Tajweed Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>{t('Record Type')}</label>
                  <select
                    value={formRecordType}
                    onChange={(e) => setFormRecordType(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="New">{t('Sabaq (New Lesson)')}</option>
                    <option value="Revision">{t('Sabqi / Manzil (Revision)')}</option>
                    <option value="Assessment">{t('Assessment / Test')}</option>
                    <option value="Correction">{t('Correction')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>{t('Recitation Status')}</label>
                  <select
                    value={formRecordStatus}
                    onChange={(e) => setFormRecordStatus(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="Completed">{t('Completed')}</option>
                    <option value="Needs Revision">{t('Needs Revision')}</option>
                    <option value="Partially Memorized">{t('Partially Memorized')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>{t('Tajweed Grade')}</label>
                  <select
                    value={formTajweedRating}
                    onChange={(e) => setFormTajweedRating(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="Mumtaz">Mumtaz (Excellent - 95%+)</option>
                    <option value="Jayyid Jiddan">Jayyid Jiddan (Very Good - 85%+)</option>
                    <option value="Jayyid">Jayyid (Good - 75%+)</option>
                    <option value="Maqbool">Maqbool (Pass - 60%+)</option>
                  </select>
                </div>
              </div>

              {/* Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>{t('Date Recorded')}</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>{t('Teacher Notes & Guidance')}</label>
                  <input
                    type="text"
                    value={formTeacherNotes}
                    onChange={(e) => setFormTeacherNotes(e.target.value)}
                    placeholder={t('e.g. Focus on Ghunnah on Ayah 12')}
                    className={inputCls}
                  />
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={handleSaveProgress as any}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{t('Save Hifz Entry')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Drawer */}
      {isHistoryDrawerOpen && selectedStudentForHistory && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedStudentForHistory.firstName} {selectedStudentForHistory.lastName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedStudentForHistory.admissionNumber} • {t('Current Progress')}: Juz {selectedStudentForHistory.currentJuz || 1}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsHistoryDrawerOpen(false)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {t('Chronological Hifz Audit Trail')}
              </h4>
              <button
                onClick={() => {
                  handleOpenLogModal(selectedStudentForHistory);
                  setIsHistoryDrawerOpen(false);
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {t('Log Sabaq')}
              </button>
            </div>

            {memorizations.filter(m => m.student?.id === selectedStudentForHistory.id).length === 0 ? (
              <div className="text-center py-16 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">{t('No Hifz records logged for this scholar yet.')}</p>
              </div>
            ) : (
              memorizations
                .filter(m => m.student?.id === selectedStudentForHistory.id)
                .map((record) => (
                  <div
                    key={record.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-mono">
                          {t('Juz')} {record.juzNumber}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {record.surah}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {record.date}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-mono">
                      <span>Ayah {record.startingAyah} - {record.endingAyah} ({record.pagesCovered} {t('pages')})</span>
                      <span className={`font-bold ${
                        record.recordStatus === 'Completed' ? 'text-emerald-600 dark:text-emerald-400' :
                        record.recordStatus === 'Needs Revision' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {record.recordStatus} • {record.tajweedRating || 'Mumtaz'}
                      </span>
                    </div>

                    {record.teacherNotes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 italic">
                        &ldquo;{record.teacherNotes}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> {t('Delete Record')}
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Clock, Plus, Search, RefreshCw, Calendar, Download,
  CheckCircle2, AlertCircle, BookOpen, ShieldCheck, Filter,
  Users, Eye, Trash2, Edit2, X, Check, ArrowRight,
  TrendingUp, Star, RotateCcw, Award, Layers,
  GraduationCap, UserCheck, UserX, UserMinus, Save
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

interface StudentAttendanceItem {
  id: string;
  documentId?: string;
  studentId: string;
  studentName: string;
  studentAdmission?: string;
  circleName: string;
  date: string;
  status: 'Present' | 'Late' | 'Absent' | 'Excused';
  arrivalTime?: string;
  remarks?: string;
  recordedBy?: string;
}

const INITIAL_ATTENDANCES: StudentAttendanceItem[] = [
  {
    id: 'att-001',
    studentId: '101',
    studentName: 'Zayd ibn Thabit',
    studentAdmission: 'YAH-2026-001',
    circleName: 'Fajr Tahfeez Excellence Circle',
    date: '2026-10-07',
    status: 'Present',
    arrivalTime: '05:55 AM',
    remarks: 'Punctual with full Sabaq preparation.',
    recordedBy: 'Ustadh Ahmad Al-Kurdi'
  },
  {
    id: 'att-002',
    studentId: '102',
    studentName: 'Abdullah ibn Masood',
    studentAdmission: 'YAH-2026-002',
    circleName: 'Fajr Tahfeez Excellence Circle',
    date: '2026-10-07',
    status: 'Present',
    arrivalTime: '06:00 AM',
    remarks: 'On time, lead first round of Murajaah.',
    recordedBy: 'Ustadh Ahmad Al-Kurdi'
  },
  {
    id: 'att-003',
    studentId: '103',
    studentName: 'Ubayy ibn Kaab',
    studentAdmission: 'YAH-2026-003',
    circleName: 'Intermediate Hifz & Murajaah',
    date: '2026-10-07',
    status: 'Late',
    arrivalTime: '06:25 AM',
    remarks: '15 mins late due to transport delay.',
    recordedBy: 'Ustadh Bilal Mansoor'
  },
  {
    id: 'att-004',
    studentId: '104',
    studentName: 'Fatimah Az-Zahra',
    studentAdmission: 'YAH-2026-004',
    circleName: 'Advanced Hifz Circle (Girls)',
    date: '2026-10-07',
    status: 'Present',
    arrivalTime: '07:50 AM',
    remarks: 'Early arrival, highly prepared.',
    recordedBy: 'Ustadha Maryam Al-Ghamdi'
  },
  {
    id: 'att-005',
    studentId: '105',
    studentName: 'Aisha Siddiqah',
    studentAdmission: 'YAH-2026-005',
    circleName: 'Advanced Hifz Circle (Girls)',
    date: '2026-10-07',
    status: 'Excused',
    remarks: 'Medical appointment excused by parent.',
    recordedBy: 'Ustadha Maryam Al-Ghamdi'
  }
];

export default function QuranAttendancePage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user } = useAuth();

  const [attendances, setAttendances] = useState<StudentAttendanceItem[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Filters & UI
  const [query, setQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedCircleFilter, setSelectedCircleFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [inspectedRecord, setInspectedRecord] = useState<StudentAttendanceItem | null>(null);
  const [editingRecord, setEditingRecord] = useState<StudentAttendanceItem | null>(null);

  // Form State
  const [formStudentId, setFormStudentId] = useState('');
  const [formCircleName, setFormCircleName] = useState('Fajr Tahfeez Excellence Circle');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'Present' | 'Late' | 'Absent' | 'Excused'>('Present');
  const [formArrivalTime, setFormArrivalTime] = useState('06:00 AM');
  const [formRemarks, setFormRemarks] = useState('');

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [attRes, studentsRes, enrollRes] = await Promise.allSettled([
        apiClient.get('/attendance-records?populate=*&pagination[limit]=300').catch(() => null),
        apiClient.get('/students?populate=*&pagination[limit]=300').catch(() => null),
        apiClient.get('/student-enrollments?populate[student]=true&pagination[limit]=300').catch(() => null)
      ]);

      // 1. Process Students
      let studentList: any[] = [];
      if (studentsRes.status === 'fulfilled' && (studentsRes.value as any)?.data?.data?.length > 0) {
        studentList = (studentsRes.value as any).data.data.map((s: any) => ({
          id: String(s.id),
          documentId: s.documentId,
          name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
          admissionNumber: s.admissionNumber || s.studentId || `STD-${s.id}`,
          section: s.section?.name || 'Quran Section'
        }));
      } else if (enrollRes.status === 'fulfilled' && (enrollRes.value as any)?.data?.data?.length > 0) {
        studentList = (enrollRes.value as any).data.data.map((e: any) => {
          const s = e.student || {};
          return {
            id: String(s.id || e.id),
            documentId: s.documentId,
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Scholar',
            admissionNumber: s.admissionNumber || `STD-${s.id || e.id}`,
            section: e.academicSection?.name || 'Quran Circle'
          };
        });
      }

      if (studentList.length === 0) {
        studentList = [
          { id: '101', name: 'Zayd ibn Thabit', admissionNumber: 'YAH-2026-001', section: 'Tahfeez A' },
          { id: '102', name: 'Abdullah ibn Masood', admissionNumber: 'YAH-2026-002', section: 'Tahfeez A' },
          { id: '103', name: 'Ubayy ibn Kaab', admissionNumber: 'YAH-2026-003', section: 'Tahfeez B' },
          { id: '104', name: 'Fatimah Az-Zahra', admissionNumber: 'YAH-2026-004', section: 'Hifz Girls 1' },
          { id: '105', name: 'Aisha Siddiqah', admissionNumber: 'YAH-2026-005', section: 'Hifz Girls 1' }
        ];
      }
      setStudents(studentList);

      // 2. Process Attendances
      let localSaved: StudentAttendanceItem[] = [];
      if (typeof window !== 'undefined') {
        try {
          const str = localStorage.getItem('yahaya_qms_attendance_records');
          if (str) localSaved = JSON.parse(str);
        } catch {}
      }

      if (attRes.status === 'fulfilled' && (attRes.value as any)?.data?.data?.length > 0) {
        const mapped: StudentAttendanceItem[] = (attRes.value as any).data.data.map((a: any) => ({
          id: String(a.id || a.documentId),
          documentId: a.documentId,
          studentId: String(a.student?.id || ''),
          studentName: a.student?.name || `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.trim() || 'Scholar',
          studentAdmission: a.student?.admissionNumber || '',
          circleName: a.courseOffering?.name || a.circleName || 'Tahfeez Halaqah',
          date: a.date ? String(a.date).split('T')[0] : new Date().toISOString().split('T')[0],
          status: a.recordStatus || a.status || 'Present',
          arrivalTime: a.arrivalTime || '06:00 AM',
          remarks: a.comments || a.remarks || '',
          recordedBy: a.teacher?.name || 'Ustadh Lead'
        }));
        setAttendances(mapped);
      } else if (localSaved.length > 0) {
        setAttendances(localSaved);
      } else {
        setAttendances(INITIAL_ATTENDANCES);
        if (typeof window !== 'undefined') {
          localStorage.setItem('yahaya_qms_attendance_records', JSON.stringify(INITIAL_ATTENDANCES));
        }
      }
    } catch {
      toast.error('Failed to load Quran attendance records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Sync to local storage
  const saveAttendancesLocally = (next: StudentAttendanceItem[]) => {
    setAttendances(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('yahaya_qms_attendance_records', JSON.stringify(next));
      } catch {}
    }
  };

  // ── Quick Roll Call Action ────────────────────────────────────────────────
  const handleBatchMarkAll = (status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    const next = attendances.map(a => {
      if (a.date === selectedDate) {
        return { ...a, status, arrivalTime: status === 'Present' ? '06:00 AM' : status === 'Late' ? '06:20 AM' : undefined };
      }
      return a;
    });
    saveAttendancesLocally(next);
    toast.success(`Marked all scholars as [${status.toUpperCase()}] for ${selectedDate}`);
  };

  const handleQuickStatusChange = (recordId: string, status: StudentAttendanceItem['status']) => {
    const next = attendances.map(a => {
      if (a.id === recordId) {
        return {
          ...a,
          status,
          arrivalTime: status === 'Present' ? (a.arrivalTime || '06:00 AM') : status === 'Late' ? '06:20 AM' : undefined
        };
      }
      return a;
    });
    saveAttendancesLocally(next);
    toast.success(`Updated status to ${status}`);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    setFormStudentId(students[0]?.id ? String(students[0].id) : '101');
    setFormCircleName('Fajr Tahfeez Excellence Circle');
    setFormDate(selectedDate);
    setFormStatus('Present');
    setFormArrivalTime('06:00 AM');
    setFormRemarks('');
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (rec: StudentAttendanceItem) => {
    setEditingRecord(rec);
    setFormStudentId(rec.studentId);
    setFormCircleName(rec.circleName);
    setFormDate(rec.date);
    setFormStatus(rec.status);
    setFormArrivalTime(rec.arrivalTime || '06:00 AM');
    setFormRemarks(rec.remarks || '');
    setShowEditModal(true);
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedStudent = students.find(s => String(s.id) === formStudentId);
    const studentName = matchedStudent ? matchedStudent.name : 'Scholar';
    const studentAdmission = matchedStudent?.admissionNumber || '';

    const payload: Partial<StudentAttendanceItem> = {
      studentId: formStudentId,
      studentName,
      studentAdmission,
      circleName: formCircleName,
      date: formDate,
      status: formStatus,
      arrivalTime: formStatus === 'Present' || formStatus === 'Late' ? formArrivalTime : undefined,
      remarks: formRemarks,
      recordedBy: (user as any)?.name || user?.username || 'Ustadh Lead'
    };

    try {
      if (editingRecord) {
        const updated: StudentAttendanceItem = {
          ...editingRecord,
          ...payload
        };
        const next = attendances.map(a => a.id === editingRecord.id ? updated : a);
        saveAttendancesLocally(next);
        if (inspectedRecord?.id === editingRecord.id) setInspectedRecord(updated);
        toast.success(`Updated attendance for ${studentName}`);
        setShowEditModal(false);
      } else {
        const newRecord: StudentAttendanceItem = {
          id: `att-${Date.now()}`,
          ...(payload as any)
        };
        const next = [newRecord, ...attendances];
        saveAttendancesLocally(next);
        toast.success(`Logged attendance for ${studentName} [${formStatus}]`);
        setShowCreateModal(false);
      }
    } catch {
      toast.error('Failed to save attendance record');
    }
  };

  const handleDeleteRecord = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove attendance log for "${name}"?`)) return;
    const next = attendances.filter(a => a.id !== id);
    saveAttendancesLocally(next);
    toast.success('Removed attendance record');
    if (inspectedRecord?.id === id) setInspectedRecord(null);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredAttendances.map(a => ({
      ID: a.id,
      StudentName: a.studentName,
      AdmissionNumber: a.studentAdmission,
      HalaqahCircle: a.circleName,
      Date: a.date,
      Status: a.status.toUpperCase(),
      ArrivalTime: a.arrivalTime || 'N/A',
      Remarks: a.remarks || '',
      RecordedBy: a.recordedBy || 'Ustadh'
    }));
    qmsService.exportToCSV(dataToExport, `quran-attendance-${selectedDate}.csv`);
    toast.success('Attendance registry exported to CSV');
  };

  // ── Filtered Records ──────────────────────────────────────────────────────
  const filteredAttendances = useMemo(() => {
    return attendances.filter(a => {
      const matchQ = !query ||
        a.studentName.toLowerCase().includes(query.toLowerCase()) ||
        a.circleName.toLowerCase().includes(query.toLowerCase()) ||
        (a.studentAdmission && a.studentAdmission.toLowerCase().includes(query.toLowerCase())) ||
        (a.remarks && a.remarks.toLowerCase().includes(query.toLowerCase()));
      const matchStatus = selectedStatusFilter === 'all' || a.status === selectedStatusFilter;
      const matchCircle = selectedCircleFilter === 'all' || a.circleName === selectedCircleFilter;
      return matchQ && matchStatus && matchCircle;
    });
  }, [attendances, query, selectedStatusFilter, selectedCircleFilter]);

  const activeFiltersCount = [
    selectedStatusFilter !== 'all',
    selectedCircleFilter !== 'all',
    query.length > 0
  ].filter(Boolean).length;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const presentCount = useMemo(() => attendances.filter(a => a.status === 'Present').length, [attendances]);
  const lateCount = useMemo(() => attendances.filter(a => a.status === 'Late').length, [attendances]);
  const absentCount = useMemo(() => attendances.filter(a => a.status === 'Absent').length, [attendances]);
  const excusedCount = useMemo(() => attendances.filter(a => a.status === 'Excused').length, [attendances]);
  const attendanceRate = useMemo(() => {
    const total = attendances.length;
    if (total === 0) return 100;
    return Number((((presentCount + lateCount) / total) * 100).toFixed(1));
  }, [attendances, presentCount, lateCount]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'attendance_rate',
      title: 'Halaqah Punctuality Rate',
      value: `${attendanceRate}%`,
      subtitle: `${presentCount + lateCount} of ${attendances.length} attended today`,
      trendDirection: attendanceRate >= 90 ? 'up' : 'neutral',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'present_count',
      title: 'Scholars Present On-Time',
      value: `${presentCount} Present`,
      subtitle: 'Arrived prior to or at circle start',
      trendDirection: 'up',
      icon: <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'late_count',
      title: 'Tardy / Late Arrivals',
      value: `${lateCount} Late`,
      subtitle: 'Arrived after circle commencement',
      trendDirection: lateCount > 0 ? 'down' : 'up',
      icon: <Clock className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'absent_count',
      title: 'Unexcused Absences',
      value: `${absentCount} Absent`,
      subtitle: `${excusedCount} excused medical/parent notices`,
      trendDirection: absentCount > 0 ? 'down' : 'up',
      icon: <UserX className="w-5 h-5 text-rose-600 dark:text-rose-400" />
    }
  ];

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<StudentAttendanceItem, any>[]>(() => [
    {
      accessorKey: 'studentName',
      header: 'Quran Student & Circle',
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block">
              {a.studentName}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {a.studentAdmission && (
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {a.studentAdmission}
                </span>
              )}
              <span className="text-[11px] text-slate-500">
                {a.circleName}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Attendance Status',
      cell: ({ row }) => {
        const a = row.original;
        const statusConfigs: Record<string, { label: string; cls: string; icon: any }> = {
          Present: { label: 'Present', cls: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800', icon: CheckCircle2 },
          Late: { label: 'Late Arrival', cls: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800', icon: Clock },
          Absent: { label: 'Absent', cls: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800', icon: UserX },
          Excused: { label: 'Excused', cls: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800', icon: UserMinus }
        };
        const cfg = statusConfigs[a.status] || { label: a.status, cls: 'bg-slate-100 text-slate-700', icon: CheckCircle2 };
        const Icon = cfg.icon;
        return (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${cfg.cls}`}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{cfg.label}</span>
            </span>
            {a.arrivalTime && (
              <span className="text-[11px] font-mono font-bold text-slate-500">
                {a.arrivalTime}
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'remarks',
      header: 'Teacher Notes / Remarks',
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 italic max-w-xs truncate block">
          {row.original.remarks || '—'}
        </span>
      )
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
          {row.original.date}
        </span>
      )
    },
    {
      id: 'quickActions',
      header: 'Quick Roll Call',
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="flex items-center gap-1" onClick={(evt) => evt.stopPropagation()}>
            <button
              onClick={() => handleQuickStatusChange(a.id, 'Present')}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                a.status === 'Present'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-slate-200 dark:border-slate-700'
              }`}
              title="Mark Present"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleQuickStatusChange(a.id, 'Late')}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                a.status === 'Late'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-slate-200 dark:border-slate-700'
              }`}
              title="Mark Late"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleQuickStatusChange(a.id, 'Absent')}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                a.status === 'Absent'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-slate-200 dark:border-slate-700'
              }`}
              title="Mark Absent"
            >
              <UserX className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={(evt) => evt.stopPropagation()}>
            <button
              onClick={() => setInspectedRecord(a)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Inspect attendance"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
            <button
              onClick={() => handleOpenEditModal(a)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Edit attendance"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteRecord(a.id, a.studentName)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Delete log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    }
  ], [attendances, inspectedRecord]);

  // Styling helpers
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300';
  const modalCls = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200';
  const modalPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto';

  return (
    <EnterpriseModuleShell
      title="Daily Quran Attendance & Punctuality Registry"
      description="Track scholar attendance across Fajr, morning, and afternoon Tahfeez circles with arrival timestamps and punctuality performance monitoring."
      breadcrumbs={[{ label: 'Quran System', href: '/qms/memorization' }, { label: 'Quran Attendance' }]}
      icon={<Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={filteredAttendances.length}
      recordLabel="Records"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => {
        setQuery('');
        setSelectedStatusFilter('all');
        setSelectedCircleFilter('all');
      }}
      headerActions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Roll Call Buttons */}
          <button
            onClick={() => handleBatchMarkAll('Present')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Mark All Present</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Log Individual Entry</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/qms/memorization" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>New Memorization (Hifz)</span>
        </Link>
        <Link href="/qms/revision" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Revision (Murajaah)</span>
        </Link>
        <Link href="/qms/tajweed" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Tajweed Evaluations</span>
        </Link>
        <Link href="/qms/halaqah" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Daily Halaqat</span>
        </Link>
        <Link href="/qms/attendance" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Quran Attendance</span>
        </Link>
        <Link href="/qms/programs" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Programs & Tracks</span>
        </Link>
        <Link href="/qms/achievements" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-500" />
          <span>Achievements</span>
        </Link>
        <Link href="/qms/director" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Director Overview</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search attendance by student name, circle, or remarks..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Attendance records refreshed'); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => {
          setQuery('');
          setSelectedStatusFilter('all');
          setSelectedCircleFilter('all');
        }}
        createButtonLabel="+ Log Entry"
        onCreate={handleOpenCreateModal}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Filter by Date"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              aria-label="Filter by Attendance Status"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late Arrival</option>
              <option value="Absent">Absent</option>
              <option value="Excused">Excused</option>
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredAttendances}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        onRowInspect={(row) => setInspectedRecord(row)}
        onRowClick={(row) => setInspectedRecord(row)}
        emptyStateProps={{
          title: 'No Quran Attendance Records Found',
          description: 'No student attendance records match your current filter settings.',
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: () => {
            setQuery('');
            setSelectedStatusFilter('all');
            setSelectedCircleFilter('all');
          },
          createLabel: 'Log First Attendance Entry',
          onCreate: handleOpenCreateModal
        }}
      />

      {/* Inspector Modal */}
      {inspectedRecord && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 sm:p-8 max-w-xl w-full space-y-6`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                      {inspectedRecord.circleName}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {inspectedRecord.status}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {inspectedRecord.studentName}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(inspectedRecord)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Log</span>
                </button>
                <button
                  onClick={() => setInspectedRecord(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-white font-bold transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Attendance Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Session Date</span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {inspectedRecord.date}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Arrival Timestamp</span>
                <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1 block">
                  {inspectedRecord.arrivalTime || 'Standard Time'}
                </span>
              </div>
            </div>

            {/* Teacher Notes */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Teacher Observations ({inspectedRecord.recordedBy || 'Ustadh Lead'})
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                "{inspectedRecord.remarks || 'No special attendance incident reported.'}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 max-w-md w-full space-y-5`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {showEditModal ? 'Edit Attendance Record' : 'Record Scholar Attendance'}
                </h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-4">
              <div className="space-y-1">
                <label className={labelCls + ' flex items-center gap-1.5'}>
                  <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Select Student
                </label>
                <select
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  required
                  className={selectCls}
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.admissionNumber || s.id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Halaqah Circle</label>
                <input
                  type="text"
                  required
                  value={formCircleName}
                  onChange={(e) => setFormCircleName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Attendance Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late Arrival</option>
                    <option value="Absent">Absent</option>
                    <option value="Excused">Excused</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Arrival Time</label>
                  <input
                    type="text"
                    value={formArrivalTime}
                    onChange={(e) => setFormArrivalTime(e.target.value)}
                    placeholder="06:00 AM"
                    className={inputCls + ' font-mono'}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Remarks / Reason for Absence</label>
                <textarea
                  rows={2}
                  placeholder="Notes on punctuality, absence excuse, or recitation readiness..."
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  {showEditModal ? 'Update Record' : 'Save Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

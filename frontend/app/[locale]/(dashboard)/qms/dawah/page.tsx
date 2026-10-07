/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Megaphone, Plus, Search, RefreshCw, Calendar, Download,
  CheckCircle2, AlertCircle, BookOpen, ShieldCheck, Filter,
  Users, Eye, Trash2, Edit2, X, Check, ArrowRight,
  TrendingUp, Award, Clock, Layers, RotateCcw, MapPin,
  GraduationCap, UserCheck, Sparkles, Trophy, Star, Image
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

interface DawahActivityItem {
  id: string;
  documentId?: string;
  title: string;
  category: 'community_outreach' | 'ramadan_program' | 'youth_seminar' | 'mosque_khatm' | 'interfaith_dialogue';
  date: string;
  location: string;
  coordinatorName: string;
  volunteersCount: number;
  attendeesCount: number;
  description: string;
  status: 'completed' | 'active' | 'upcoming';
  imageUrl?: string;
  createdAt: string;
}

const INITIAL_ACTIVITIES: DawahActivityItem[] = [
  {
    id: 'daw-001',
    title: 'Annual Grand Ramadan Khatm & Taraweeh Leadership',
    category: 'ramadan_program',
    date: '2026-03-25',
    location: 'Central Mosque & Musalla Campus',
    coordinatorName: 'Ustadh Ahmad Al-Kurdi',
    volunteersCount: 24,
    attendeesCount: 850,
    description: 'Senior Tahfeez scholars led the nightly Taraweeh and Tahajjud prayers concluding full 30-Juz recitation.',
    status: 'completed',
    createdAt: '2026-03-25T00:00:00Z'
  },
  {
    id: 'daw-002',
    title: 'Community Youth Tajweed & Phonetics Workshop',
    category: 'youth_seminar',
    date: '2026-10-15',
    location: 'Campus Auditorium Hall A',
    coordinatorName: 'Ustadh Bilal Mansoor',
    volunteersCount: 15,
    attendeesCount: 120,
    description: 'Free public workshop introducing Noorani Qaidah rules, correct letter articulation, and melodic recitation for youth.',
    status: 'upcoming',
    createdAt: '2026-10-01T00:00:00Z'
  },
  {
    id: 'daw-003',
    title: 'Inter-Mosque Quranic Charity & Gift Drive',
    category: 'community_outreach',
    date: '2026-09-10',
    location: 'Regional Community Centers',
    coordinatorName: 'Ustadha Maryam Al-Ghamdi',
    volunteersCount: 30,
    attendeesCount: 400,
    description: 'Distribution of 500 printed Mus-hafs and Tajweed study guides to underprivileged community schools.',
    status: 'completed',
    createdAt: '2026-09-10T00:00:00Z'
  },
  {
    id: 'daw-004',
    title: 'Grand Public Khatm Convocation Ceremony',
    category: 'mosque_khatm',
    date: '2026-11-20',
    location: 'Grand Campus Amphitheater',
    coordinatorName: 'Sheikh Dr. Umar Farooq',
    volunteersCount: 45,
    attendeesCount: 1200,
    description: 'Public graduation and formal Sanad conferral ceremony celebrating this year\'s graduating cohort of Huffaz.',
    status: 'upcoming',
    createdAt: '2026-10-05T00:00:00Z'
  }
];

export default function DawahActivitiesPage() {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const { user } = useAuth();

  const [activities, setActivities] = useState<DawahActivityItem[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & UI
  const [query, setQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [inspectedActivity, setInspectedActivity] = useState<DawahActivityItem | null>(null);
  const [editingActivity, setEditingActivity] = useState<DawahActivityItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<DawahActivityItem['category']>('community_outreach');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formLocation, setFormLocation] = useState('Central Campus Musalla');
  const [formCoordinator, setFormCoordinator] = useState('');
  const [formVolunteers, setFormVolunteers] = useState('15');
  const [formAttendees, setFormAttendees] = useState('200');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<DawahActivityItem['status']>('upcoming');

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dawRes, teachersRes] = await Promise.allSettled([
        qmsService.getDawahActivities().catch(() => null),
        apiClient.get('/teachers?populate=*&pagination[limit]=100').catch(() => null)
      ]);

      // 1. Process Teachers
      let teacherList: any[] = [];
      if (teachersRes.status === 'fulfilled' && (teachersRes.value as any)?.data?.data?.length > 0) {
        teacherList = (teachersRes.value as any).data.data.map((teach: any) => ({
          id: teach.id,
          name: teach.name || `${teach.firstName || ''} ${teach.lastName || ''}`.trim() || 'Teacher'
        }));
      }
      setTeachers(teacherList);

      // 2. Process Activities
      let localSaved: DawahActivityItem[] = [];
      if (typeof window !== 'undefined') {
        try {
          const str = localStorage.getItem('yahaya_qms_dawah_activities');
          if (str) localSaved = JSON.parse(str);
        } catch {}
      }

      if (dawRes.status === 'fulfilled' && dawRes.value && (dawRes.value as any).length > 0) {
        const mapped: DawahActivityItem[] = (dawRes.value as any).map((d: any) => ({
          id: String(d.id || d.documentId),
          documentId: d.documentId,
          title: d.title || 'Community Outreach Program',
          category: d.category || 'community_outreach',
          date: d.date ? String(d.date).split('T')[0] : new Date().toISOString().split('T')[0],
          location: d.location || 'Central Campus',
          coordinatorName: d.teacher?.name || d.coordinatorName || 'Ustadh Coordinator',
          volunteersCount: d.students?.length || d.volunteersCount || 12,
          attendeesCount: d.attendeesCount || 150,
          description: d.description || '',
          status: d.status || 'active',
          createdAt: d.createdAt || new Date().toISOString()
        }));
        setActivities(mapped);
      } else if (localSaved.length > 0) {
        setActivities(localSaved);
      } else {
        setActivities(INITIAL_ACTIVITIES);
        if (typeof window !== 'undefined') {
          localStorage.setItem('yahaya_qms_dawah_activities', JSON.stringify(INITIAL_ACTIVITIES));
        }
      }
    } catch {
      toast.error('Failed to load Da\'wah activities.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Sync to local storage
  const saveActivitiesLocally = (next: DawahActivityItem[]) => {
    setActivities(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('yahaya_qms_dawah_activities', JSON.stringify(next));
      } catch {}
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setEditingActivity(null);
    setFormTitle('Community Quranic Workshop & Khatm');
    setFormCategory('community_outreach');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormLocation('Central Mosque Amphitheater');
    setFormCoordinator(teachers[0]?.name || (user as any)?.name || user?.username || 'Ustadh Ahmad Al-Kurdi');
    setFormVolunteers('20');
    setFormAttendees('300');
    setFormDescription('Public Quran recitation, Tajweed workshop, and distribution of Islamic educational resources.');
    setFormStatus('upcoming');
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (act: DawahActivityItem) => {
    setEditingActivity(act);
    setFormTitle(act.title);
    setFormCategory(act.category);
    setFormDate(act.date);
    setFormLocation(act.location);
    setFormCoordinator(act.coordinatorName);
    setFormVolunteers(String(act.volunteersCount));
    setFormAttendees(String(act.attendeesCount));
    setFormDescription(act.description);
    setFormStatus(act.status);
    setShowEditModal(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Partial<DawahActivityItem> = {
      title: formTitle,
      category: formCategory,
      date: formDate,
      location: formLocation,
      coordinatorName: formCoordinator,
      volunteersCount: parseInt(formVolunteers) || 10,
      attendeesCount: parseInt(formAttendees) || 100,
      description: formDescription,
      status: formStatus
    };

    try {
      if (editingActivity) {
        const updated: DawahActivityItem = {
          ...editingActivity,
          ...payload
        };
        const next = activities.map(a => a.id === editingActivity.id ? updated : a);
        saveActivitiesLocally(next);
        if (inspectedActivity?.id === editingActivity.id) setInspectedActivity(updated);
        toast.success(`Updated activity: ${formTitle}`);
        setShowEditModal(false);
      } else {
        const newAct: DawahActivityItem = {
          id: `daw-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...(payload as any)
        };
        const next = [newAct, ...activities];
        saveActivitiesLocally(next);
        toast.success(`Registered program: ${formTitle}`);
        setShowCreateModal(false);
      }
    } catch {
      toast.error('Failed to save Da\'wah activity');
    }
  };

  const handleDeleteActivity = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove Da'wah activity "${name}"?`)) return;
    const next = activities.filter(a => a.id !== id);
    saveActivitiesLocally(next);
    toast.success('Removed Da\'wah activity');
    if (inspectedActivity?.id === id) setInspectedActivity(null);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredActivities.map(a => ({
      ID: a.id,
      Title: a.title,
      Category: a.category.toUpperCase(),
      Date: a.date,
      Location: a.location,
      Coordinator: a.coordinatorName,
      VolunteersCount: a.volunteersCount,
      EstimatedAttendees: a.attendeesCount,
      Status: a.status.toUpperCase(),
      Description: a.description
    }));
    qmsService.exportToCSV(dataToExport, `dawah-activities-registry-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Da\'wah programs registry exported to CSV');
  };

  // ── Filtered Records ──────────────────────────────────────────────────────
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const matchQ = !query ||
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.location.toLowerCase().includes(query.toLowerCase()) ||
        a.coordinatorName.toLowerCase().includes(query.toLowerCase()) ||
        a.description.toLowerCase().includes(query.toLowerCase());
      const matchCat = selectedCategoryFilter === 'all' || a.category === selectedCategoryFilter;
      const matchStatus = selectedStatusFilter === 'all' || a.status === selectedStatusFilter;
      return matchQ && matchCat && matchStatus;
    });
  }, [activities, query, selectedCategoryFilter, selectedStatusFilter]);

  const activeFiltersCount = [
    selectedCategoryFilter !== 'all',
    selectedStatusFilter !== 'all',
    query.length > 0
  ].filter(Boolean).length;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalVolunteers = useMemo(() => activities.reduce((sum, a) => sum + (a.volunteersCount || 0), 0), [activities]);
  const totalBeneficiaries = useMemo(() => activities.reduce((sum, a) => sum + (a.attendeesCount || 0), 0), [activities]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'active_initiatives',
      title: 'Active Community Outreach',
      value: `${activities.length} Programs`,
      subtitle: `${activities.filter(a => a.status === 'upcoming').length} scheduled upcoming`,
      trendDirection: 'up',
      icon: <Megaphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'community_reach',
      title: 'Estimated Beneficiaries',
      value: `${totalBeneficiaries.toLocaleString()} People`,
      subtitle: 'Attendees across public programs',
      trendDirection: 'up',
      icon: <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'student_volunteers',
      title: 'Student Service Volunteers',
      value: `${totalVolunteers} Scholars`,
      subtitle: 'Enrolled in outreach leadership',
      trendDirection: 'up',
      icon: <GraduationCap className="w-5 h-5 text-amber-500" />
    },
    {
      id: 'mosque_affiliations',
      title: 'Partner Mosques & Centers',
      value: '12 Locations',
      subtitle: 'Institutional outreach footprint',
      trendDirection: 'up',
      icon: <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    }
  ];

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<DawahActivityItem, any>[]>(() => [
    {
      accessorKey: 'title',
      header: 'Program Title & Category',
      cell: ({ row }) => {
        const a = row.original;
        const catMap: Record<string, { label: string; color: string }> = {
          ramadan_program: { label: 'Ramadan Taraweeh', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
          youth_seminar: { label: 'Youth Workshop', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300' },
          community_outreach: { label: 'Outreach & Charity', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
          mosque_khatm: { label: 'Grand Khatm Event', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
          interfaith_dialogue: { label: 'Public Dialogue', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' }
        };
        const meta = catMap[a.category] || { label: a.category, color: 'bg-slate-100 text-slate-700' };
        return (
          <div className="space-y-1">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${meta.color}`}>
              {meta.label}
            </span>
            <div className="font-bold text-slate-900 dark:text-white text-xs block">
              {a.title}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'location',
      header: 'Location & Coordinator',
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              {a.location}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block">
              Lead: {a.coordinatorName}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'volunteersCount',
      header: 'Participation & Reach',
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="text-xs font-mono space-y-0.5">
            <span className="font-black text-emerald-700 dark:text-emerald-400 block">
              {a.volunteersCount} Student Volunteers
            </span>
            <span className="text-[11px] text-slate-500 block">
              ~{a.attendeesCount} Beneficiaries
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'date',
      header: 'Event Date',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
          {row.original.date}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status;
        const statusMap: Record<string, string> = {
          completed: 'approved',
          active: 'on_track',
          upcoming: 'submitted'
        };
        return <StatusBadge status={statusMap[s] || s} size="sm" />;
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
              onClick={() => setInspectedActivity(a)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Inspect activity"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
            <button
              onClick={() => handleOpenEditModal(a)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Edit event"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteActivity(a.id, a.title)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Delete activity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    }
  ], [activities, inspectedActivity]);

  // Styling helpers
  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500';
  const selectCls = 'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer';
  const labelCls = 'text-xs font-bold text-slate-700 dark:text-slate-300';
  const modalCls = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200';
  const modalPanelCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto';

  return (
    <EnterpriseModuleShell
      title="Community Da'wah, Outreach & Mosque Initiatives"
      description="Manage community outreach campaigns, Taraweeh recitation leadership, public youth workshops, and student volunteer service."
      breadcrumbs={[{ label: 'Quran System', href: '/qms/memorization' }, { label: 'Da\'wah Activities' }]}
      icon={<Megaphone className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={filteredActivities.length}
      recordLabel="Programs"
      activeFilterCount={activeFiltersCount}
      onClearFilters={() => {
        setQuery('');
        setSelectedCategoryFilter('all');
        setSelectedStatusFilter('all');
      }}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Registry</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Schedule Program</span>
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
        <Link href="/qms/attendance" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
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
        <Link href="/qms/dawah" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Megaphone className="w-3.5 h-3.5" />
          <span>Da'wah Activities</span>
        </Link>
        <Link href="/qms/director" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Director Overview</span>
        </Link>
      </div>

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search programs by title, location, or coordinator..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadData(); toast.success('Da\'wah registry refreshed'); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={() => {
          setQuery('');
          setSelectedCategoryFilter('all');
          setSelectedStatusFilter('all');
        }}
        createButtonLabel="+ New Event"
        onCreate={handleOpenCreateModal}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              aria-label="Filter by Category"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Program Categories</option>
              <option value="community_outreach">Community Outreach</option>
              <option value="ramadan_program">Ramadan Taraweeh Leadership</option>
              <option value="youth_seminar">Youth Workshop</option>
              <option value="mosque_khatm">Grand Mosque Khatm</option>
            </select>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Event Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active Now</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        }
      />

      <EnterpriseDataGrid
        data={filteredActivities}
        columns={columns}
        isLoading={loading}
        density={density}
        maxHeight={570}
        onRowInspect={(row) => setInspectedActivity(row)}
        onRowClick={(row) => setInspectedActivity(row)}
        emptyStateProps={{
          title: 'No Da\'wah Activities Found',
          description: 'No community programs match your current filter settings.',
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: () => {
            setQuery('');
            setSelectedCategoryFilter('all');
            setSelectedStatusFilter('all');
          },
          createLabel: 'Schedule First Program',
          onCreate: handleOpenCreateModal
        }}
      />

      {/* Inspector Modal */}
      {inspectedActivity && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 sm:p-8 max-w-2xl w-full space-y-6`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 uppercase">
                      {inspectedActivity.status}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                    {inspectedActivity.title}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(inspectedActivity)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Event</span>
                </button>
                <button
                  onClick={() => setInspectedActivity(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-white font-bold transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Event Date</span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {inspectedActivity.date}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Student Volunteers</span>
                <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1 block">
                  {inspectedActivity.volunteersCount}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Attendees</span>
                <span className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  ~{inspectedActivity.attendeesCount}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Location</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block truncate">
                  {inspectedActivity.location}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500">Program Scope & Objectives</h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {inspectedActivity.description || 'Community outreach initiative.'}
              </p>
            </div>

            {/* Coordinator */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300">
                  {inspectedActivity.coordinatorName[0]}
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-xs block">
                    {inspectedActivity.coordinatorName}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Program Lead / Coordinator
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono">
                {inspectedActivity.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className={modalCls}>
          <div className={`${modalPanelCls} p-6 max-w-xl w-full space-y-5`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {showEditModal ? 'Edit Da\'wah Activity' : 'Schedule Community Outreach Program'}
                </h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Program Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Grand Ramadan Khatm Leadership"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Program Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className={selectCls}
                  >
                    <option value="community_outreach">Community Outreach & Charity</option>
                    <option value="ramadan_program">Ramadan Taraweeh Leadership</option>
                    <option value="youth_seminar">Youth Tajweed Workshop</option>
                    <option value="mosque_khatm">Grand Mosque Khatm Convocation</option>
                    <option value="interfaith_dialogue">Public Islamic Dialogue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Event Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Location / Mosque Venue</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Coordinator</label>
                  <input
                    type="text"
                    required
                    value={formCoordinator}
                    onChange={(e) => setFormCoordinator(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Volunteers</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formVolunteers}
                    onChange={(e) => setFormVolunteers(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Estimated Attendees</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formAttendees}
                    onChange={(e) => setFormAttendees(e.target.value)}
                    className={inputCls + ' font-mono'}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Description & Public Schedule</label>
                <textarea
                  rows={2}
                  placeholder="Program agenda, recitation schedule, resource distribution details..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
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
                  {showEditModal ? 'Update Program' : 'Schedule Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EnterpriseModuleShell>
  );
}

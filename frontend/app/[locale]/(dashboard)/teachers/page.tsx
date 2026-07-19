'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  UserCheck, Search, Upload, Download, ArrowRight,
  Filter, Layers, RefreshCw, Award, Mail, Phone, Eye,
  BookOpen, Clock, CheckCircle2, Shield, Calendar
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import type { Teacher, Section } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { BulkImportModal } from '@/components/erp/BulkImportModal';
import { BulkExportModal } from '@/components/erp/BulkExportModal';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { Avatar } from '@/components/shared/Avatar';
import { toast } from 'sonner';

export default function TeachersListPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await erpService.getTeachers({ query, status: statusFilter, pageSize: 100 });
      setTeachers(res.data || []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      toast.error('Failed to sync faculty registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadTeachers, 200);
    return () => clearTimeout(timer);
  }, [query, statusFilter, departmentFilter]);

  const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (departmentFilter !== 'all' ? 1 : 0);

  const handleClearFilters = () => {
    setStatusFilter('all');
    setDepartmentFilter('all');
    setQuery('');
    toast.success('Faculty filters reset.');
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total',
      title: 'Active Faculty & Sheikhs',
      value: teachers.length || '142',
      subtitle: '▲ +6 new instructors this term',
      trendDirection: 'up',
      icon: <UserCheck className="w-5 h-5" />,
      isActive: statusFilter === 'active',
      onClick: () => {
        setStatusFilter(statusFilter === 'active' ? 'all' : 'active');
        toast.info(statusFilter === 'active' ? 'Showing all faculty' : 'Filtered to Active Faculty only');
      },
      badgeText: 'LMS Core'
    },
    {
      id: 'load',
      title: 'Active Teaching Load',
      value: '98.5%',
      subtitle: 'Average 22 periods per instructor',
      trendDirection: 'up',
      icon: <BookOpen className="w-5 h-5" />,
      onClick: () => toast.success('Opened faculty teaching load breakdown')
    },
    {
      id: 'heads',
      title: 'Department Leaders',
      value: '12',
      subtitle: 'Hifz, Islamic Studies, Sciences & Arabic',
      trendDirection: 'neutral',
      icon: <Award className="w-5 h-5" />,
      onClick: () => toast.info('Viewing department leaders directory')
    },
    {
      id: 'leave',
      title: 'On Leave / Substitute Needed',
      value: Math.floor((teachers.length || 142) * 0.04).toString(),
      subtitle: 'Current active leave approvals',
      trendDirection: 'down',
      icon: <Clock className="w-5 h-5" />,
      isActive: statusFilter === 'on_leave',
      onClick: () => {
        setStatusFilter(statusFilter === 'on_leave' ? 'all' : 'on_leave');
        toast.info(statusFilter === 'on_leave' ? 'Showing all faculty' : 'Filtered to Faculty On Leave');
      }
    }
  ];

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'name',
        header: 'Faculty Instructor & Employee ID',
        cell: ({ row }) => {
          const tch = row.original;
          const name = tch.name || tch.fullName || tch.displayName || [tch.firstName, tch.lastName].filter(Boolean).join(' ') || tch.username || 'Unnamed Instructor';
          const idStr = tch.employeeId || tch.schoolId || tch.code || tch.documentId || (tch.id ? (typeof tch.id === 'string' && tch.id.startsWith('EMP') ? tch.id : 'EMP-' + String(tch.id).padStart(4, '0')) : 'EMP-0001');
          const photo = tch.photoUrl || tch.avatarUrl || tch.photo?.url || tch.avatar?.url;

          return (
            <div className="flex items-center gap-3">
              <Avatar src={photo} name={name} size="md" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-sm">
                  {name}
                </p>
                <span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-bold block mt-0.5">
                  {idStr}
                </span>
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'department',
        header: 'Academic Department & Qualification',
        cell: ({ row }) => {
          const tch = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">{tch.department || 'Islamic & Arabic Studies'}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block">{tch.qualification || 'Senior Hifz Sheikh'}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'contact',
        header: 'Faculty Credentials',
        cell: ({ row }) => {
          const tch = row.original;
          const phone = tch.phone || tch.contactPhone || '+231 770 000 000';
          const email = tch.email || tch.contactEmail || 'faculty@yahayaschool.edu';

          return (
            <div className="space-y-1 font-mono text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                <Mail className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'Teaching Status',
        cell: ({ row }) => {
          const status = row.original.status || 'Active';
          return <StatusBadge status={status} size="sm" />;
        }
      },
      {
        id: 'actions',
        header: 'Inspect Profile',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRow(row.original);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-600 dark:bg-slate-800 text-slate-700 hover:text-white dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Inspect</span>
          </button>
        )
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Faculty & Sheikhs Academic Registry"
      description="Browse all teaching faculty, Islamic scholars, section homeroom advisors, and department heads across campuses with full S/4 real-time metrics."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Teachers' }]}
      icon={<UserCheck className="w-8 h-8" />}
      recordCount={teachers.length}
      recordLabel="Instructors"
      activeFilterCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Roster</span>
          </button>
        </div>
      }
    >
      {/* Interactive Clickable KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} isLoading={loading && teachers.length === 0} />

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search faculty by name, employee ID, department, or qualification..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadTeachers}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
        createButtonLabel="+ Onboard Instructor"
        onCreate={() => toast.info('New Faculty Onboarding application form opened.')}
        customFilterNodes={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter teachers by status"
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-emerald-600 shadow-2xs"
            >
              <option value="all">All Teaching Statuses</option>
              <option value="active">Active On Duty</option>
              <option value="on_leave">On Leave / Substitute</option>
              <option value="part_time">Part-Time / Visiting Sheikh</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              aria-label="Filter teachers by department"
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-emerald-600 shadow-2xs"
            >
              <option value="all">All Departments</option>
              <option value="Hifz & Quranic Studies">Hifz & Quranic Studies</option>
              <option value="Islamic & Arabic Sciences">Islamic & Arabic Sciences</option>
              <option value="STEM & Standard Curriculum">STEM & Standard Curriculum</option>
            </select>
          </div>
        }
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={teachers}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedRow(row)}
        onRowClick={(row) => setSelectedRow(row)}
        onRowEdit={(row) => toast.info(`Opening teacher profile editor for ${row.name || 'Instructor'}`)}
        emptyStateProps={{
          title: 'No Instructors Found',
          description: 'No teaching faculty exist matching your search query or department criteria.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: 'Onboard New Instructor',
          onCreate: () => toast.info('Opened new faculty registration modal')
        }}
      />

      {/* Slide-Out Profile Inspection Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow}
        category="teacher"
      />

      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        entityType="teacher"
        onSuccess={loadTeachers}
      />
      <BulkExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={teachers}
        entityType="teacher"
      />
    </EnterpriseModuleShell>
  );
}

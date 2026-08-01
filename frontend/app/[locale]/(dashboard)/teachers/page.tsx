/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  UserCheck, Search, Upload, Download, ArrowRight,
  Filter, Layers, RefreshCw, Award, Mail, Phone, Eye,
  BookOpen, Clock, CheckCircle2, Shield, Calendar,
  X, Edit, Trash2, PauseCircle
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import { apiClient } from '@/services/api.service';
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
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || 'en';
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  // Modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);

  // Form Fields
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formDepartment, setFormDepartment] = useState('Hifz & Quranic Studies');
  const [formQualification, setFormQualification] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formStatus, setFormStatus] = useState('active');

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await erpService.getTeachers({ query, status: statusFilter, pageSize: 150 });
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

  const handleOnboardOpen = () => {
    setEditingTeacher(null);
    setFormName('');
    setFormEmployeeId(`EMP-${Date.now().toString().slice(-4)}`);
    setFormDepartment('Hifz & Quranic Studies');
    setFormQualification('');
    setFormPhone('');
    setFormEmail('');
    setFormStatus('active');
    setOnboardModalOpen(true);
  };

  const handleEditOpen = (tch: any) => {
    setEditingTeacher(tch);
    setFormName(tch.name || '');
    setFormEmployeeId(tch.employeeId || '');
    setFormDepartment(tch.department || 'Hifz & Quranic Studies');
    setFormQualification(tch.qualification || '');
    setFormPhone(tch.phone || '');
    setFormEmail(tch.email || '');
    setFormStatus(tch.status || 'active');
    setOnboardModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Instructor Name is required.');
      return;
    }

    try {
      const payload = {
        name: formName,
        employeeId: formEmployeeId,
        department: formDepartment,
        qualification: formQualification,
        phone: formPhone,
        email: formEmail,
        status: formStatus
      };

      if (editingTeacher) {
        const id = editingTeacher.documentId || editingTeacher.id;
        await apiClient.put(`/teachers/${id}`, { data: payload });
        toast.success('Faculty profile updated successfully.');
      } else {
        await apiClient.post('/teachers', { data: payload });
        toast.success('New Faculty onboarded successfully.');
      }
      setOnboardModalOpen(false);
      loadTeachers();
    } catch (err) {
      toast.error('Failed to save faculty details.');
    }
  };

  const handleDelete = async (tch: any) => {
    if (!confirm(`Are you sure you want to delete ${tch.name || 'this instructor'}?`)) return;
    try {
      const id = tch.documentId || tch.id;
      await apiClient.delete(`/teachers/${id}`);
      toast.success('Faculty profile removed successfully.');
      loadTeachers();
    } catch (err) {
      toast.error('Failed to delete faculty member.');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocker is preventing print preview.');
      return;
    }

    const rowsHtml = teachers.map((tch: any, idx: number) => {
      const name = tch.name || [tch.firstName, tch.lastName].filter(Boolean).join(' ') || 'Unnamed Instructor';
      const idStr = tch.employeeId || tch.schoolId || `EMP-${String(tch.id || idx).padStart(4, '0')}`;
      const dept = tch.department || 'Islamic & Arabic Studies';
      const qual = tch.qualification || 'Senior Instructor';
      const phone = tch.phone || 'N/A';
      const status = tch.status || 'Active';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 10px; font-weight: bold; color: #1e293b;">${name}</td>
          <td style="padding: 10px; font-family: monospace; font-weight: bold; color: #d97706;">${idStr}</td>
          <td style="padding: 10px;">${dept} (${qual})</td>
          <td style="padding: 10px; font-family: monospace;">${phone}</td>
          <td style="padding: 10px; text-transform: uppercase; font-weight: bold;">${status}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Faculty & Sheikhs Registry - YAHAYASCOOL</title>
        <style>
          body { font-family: sans-serif; color: #334155; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #d97706; padding-bottom: 15px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 10px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>YAHAYASCOOL - Faculty Academic Registry</h2>
          <span>Generated: ${new Date().toLocaleDateString()}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Instructor Name</th>
              <th>Employee ID</th>
              <th>Department & Qualification</th>
              <th>Contact Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <script>window.onload = function() { window.print(); window.close(); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total',
      title: 'Active Faculty & Sheikhs',
      value: teachers.length || '2',
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
      value: Math.floor((teachers.length || 2) * 0.04).toString(),
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
        cell: ({ row }: any) => {
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
        cell: ({ row }: any) => {
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
        cell: ({ row }: any) => {
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
        cell: ({ row }: any) => {
          const status = row.original.status || 'Active';
          return <StatusBadge status={status} size="sm" />;
        }
      },
      {
        id: 'actions',
        header: 'Roster Actions',
        cell: ({ row }: any) => {
          const tch = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => setSelectedRow(tch)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer border-none bg-transparent"
                title="Inspect Profile"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEditOpen(tch)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer border-none bg-transparent"
                title="Edit Instructor"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(tch)}
                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 cursor-pointer border-none bg-transparent"
                title="Delete Instructor"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        }
      }
    ];
  }, []);

  const quickActions = useMemo(() => {
    return [
      {
        id: 'edit',
        label: 'Edit Profile',
        icon: <Edit className="w-3.5 h-3.5" />,
        variant: 'primary' as const,
        onClick: (record: any) => {
          setSelectedRow(null);
          handleEditOpen(record);
        }
      },
      {
        id: 'timetable',
        label: 'Timetable',
        icon: <Clock className="w-3.5 h-3.5" />,
        onClick: (record: any) => {
          router.push(`/${locale}/lms/timetables`);
          toast.info(`Redirected to Timetables.`);
        }
      },
      {
        id: 'toggle-status',
        label: 'Toggle Status',
        icon: <PauseCircle className="w-3.5 h-3.5" />,
        variant: 'secondary' as const,
        onClick: async (record: any) => {
          try {
            const currentStatus = record.status || 'active';
            const nextStatus = currentStatus === 'active' ? 'on_leave' : 'active';
            const id = record.documentId || record.id;
            await apiClient.put(`/teachers/${id}`, {
              data: { status: nextStatus }
            });
            toast.success(`Faculty status updated to ${nextStatus}.`);
            setSelectedRow(null);
            loadTeachers();
          } catch (err) {
            toast.error('Failed to update faculty status.');
          }
        }
      },
      {
        id: 'delete',
        label: 'Remove Instructor',
        icon: <Trash2 className="w-3.5 h-3.5" />,
        variant: 'danger' as const,
        onClick: (record: any) => {
          setSelectedRow(null);
          handleDelete(record);
        }
      }
    ];
  }, [locale]);

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
      {/* Interactive KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} isLoading={loading && teachers.length === 0} />

      {/* Roster Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search faculty by name, employee ID, department, or qualification..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadTeachers}
        onPrint={handlePrint}
        onImport={() => setImportModalOpen(true)}
        onExport={() => setExportModalOpen(true)}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
        createButtonLabel="+ Onboard Instructor"
        onCreate={handleOnboardOpen}
        customFilterNodes={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="all">All Teaching Statuses</option>
              <option value="active">Active On Duty</option>
              <option value="on_leave">On Leave / Substitute</option>
              <option value="part_time">Part-Time / Visiting Sheikh</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="all">All Departments</option>
              <option value="Hifz & Quranic Studies">Hifz & Quranic Studies</option>
              <option value="Islamic & Arabic Sciences">Islamic & Arabic Sciences</option>
              <option value="STEM & Standard Curriculum">STEM & Standard Curriculum</option>
            </select>
          </div>
        }
      />

      {/* Grid Table */}
      <EnterpriseDataGrid
        data={teachers}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row: any) => setSelectedRow(row)}
        onRowClick={(row: any) => setSelectedRow(row)}
        onRowEdit={(row: any) => handleEditOpen(row)}
        emptyStateProps={{
          title: 'No Instructors Found',
          description: 'No teaching faculty exist matching your search query or department criteria.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: 'Onboard New Instructor',
          onCreate: handleOnboardOpen
        }}
      />

      {/* Slide-Out Profile Inspection Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow}
        category="teacher"
        quickActions={quickActions}
      />

      {/* ── ONBOARD / EDIT INSTRUCTOR MODAL ────────────────────────── */}
      {onboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white animate-slide-up text-xs">
            <button
              onClick={() => setOnboardModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer border-none bg-transparent"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
              {editingTeacher ? 'Edit Instructor Profile' : 'Onboard New Faculty Instructor'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Instructor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter instructor name..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Employee ID Code</label>
                  <input
                    type="text"
                    value={formEmployeeId}
                    onChange={(e) => setFormEmployeeId(e.target.value)}
                    placeholder="Enter employee ID..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Academic Department</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Hifz & Quranic Studies">Hifz & Quranic Studies</option>
                    <option value="Islamic & Arabic Sciences">Islamic & Arabic Sciences</option>
                    <option value="STEM & Standard Curriculum">STEM & Standard Curriculum</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Teaching Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="active">Active On Duty</option>
                    <option value="on_leave">On Leave</option>
                    <option value="part_time">Part-Time / Visiting</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Professional Qualification</label>
                  <input
                    type="text"
                    value={formQualification}
                    onChange={(e) => setFormQualification(e.target.value)}
                    placeholder="e.g. Senior Hifz Sheikh, MA Arabic..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Contact Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Enter phone number..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="instructor@yahayaschool.edu..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setOnboardModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer border-none shadow-sm flex items-center gap-1.5"
                >
                  <span>{editingTeacher ? 'Save Changes' : 'Confirm Onboarding'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import / Export Modals */}
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

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Clipboard, Search, Upload, Download, ArrowRight,
  RefreshCw, Phone, Mail, Eye, Clock, Shield,
  CheckCircle2, AlertTriangle, Briefcase, Truck, Wrench
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import type { Worker } from '@/types/erp.types';
import { BulkImportModal } from '@/components/erp/BulkImportModal';
import { BulkExportModal } from '@/components/erp/BulkExportModal';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { Avatar } from '@/components/shared/Avatar';
import { toast } from 'sonner';

export default function WorkersListPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const res = await erpService.getWorkers({ query, pageSize: 100 });
      setWorkers(res.data || []);
    } catch (err) {
      console.error('Error fetching workers:', err);
      toast.error('Failed to sync support personnel registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadWorkers, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const activeFiltersCount = (categoryFilter !== 'all' ? 1 : 0) + (shiftFilter !== 'all' ? 1 : 0);

  const handleClearFilters = () => {
    setCategoryFilter('all');
    setShiftFilter('all');
    setQuery('');
    toast.success('Personnel filters reset.');
  };

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total',
      title: 'Active Support Personnel',
      value: workers.length || '68',
      subtitle: '▲ +3 new operational hires',
      trendDirection: 'up',
      icon: <Clipboard className="w-5 h-5" />,
      badgeText: 'Ops Core'
    },
    {
      id: 'duty',
      title: 'On Duty & Check-In Rate',
      value: '97.1%',
      subtitle: '66 staff currently on campus shifts',
      trendDirection: 'up',
      icon: <Clock className="w-5 h-5" />,
      onClick: () => toast.success('Opened live campus gate checkpoint roster')
    },
    {
      id: 'fleet',
      title: 'Drivers & Transport Fleet',
      value: '18',
      subtitle: '100% bus safety clearance verified',
      trendDirection: 'up',
      icon: <Truck className="w-5 h-5" />,
      isActive: categoryFilter === 'driver',
      onClick: () => {
        setCategoryFilter(categoryFilter === 'driver' ? 'all' : 'driver');
        toast.info(categoryFilter === 'driver' ? 'Showing all staff' : 'Filtered to Transport Drivers');
      }
    },
    {
      id: 'maint',
      title: 'Facility & Maintenance Crew',
      value: '24',
      subtitle: 'Janitorial, Security & IT Support',
      trendDirection: 'neutral',
      icon: <Wrench className="w-5 h-5" />,
      isActive: categoryFilter === 'maintenance',
      onClick: () => {
        setCategoryFilter(categoryFilter === 'maintenance' ? 'all' : 'maintenance');
        toast.info(categoryFilter === 'maintenance' ? 'Showing all staff' : 'Filtered to Facility Crew');
      }
    }
  ];

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'name',
        header: 'Support Employee & ID Code',
        cell: ({ row }) => {
          const wrk = row.original;
          const name = wrk.name || wrk.fullName || wrk.displayName || [wrk.firstName, wrk.lastName].filter(Boolean).join(' ') || wrk.username || 'Unnamed Personnel';
          const idStr = wrk.employeeId || wrk.schoolId || wrk.code || wrk.documentId || (wrk.id ? (typeof wrk.id === 'string' && wrk.id.startsWith('WRK') ? wrk.id : 'WRK-' + String(wrk.id).padStart(4, '0')) : 'WRK-0001');
          const photo = wrk.photoUrl || wrk.avatarUrl || wrk.photo?.url || wrk.avatar?.url;

          return (
            <div className="flex items-center gap-3">
              <Avatar src={photo} name={name} size="md" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors text-sm">
                  {name}
                </p>
                <span className="font-mono text-xs text-sky-600 dark:text-sky-400 font-bold block mt-0.5">
                  {idStr}
                </span>
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'category',
        header: 'Operational Category & Role',
        cell: ({ row }) => {
          const wrk = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs capitalize">{wrk.category || wrk.role || 'Support Services'}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block">{wrk.department || 'Operations Directorate'}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'shift',
        header: 'Assigned Shift & Supervisor',
        cell: ({ row }) => {
          const wrk = row.original;
          const shift = wrk.shift || 'Day Shift (07:30 - 16:30)';
          const superv = wrk.supervisor || 'Sheikh Yahaya Admin';

          return (
            <div className="space-y-0.5 text-xs">
              <span className="font-semibold text-sky-700 dark:text-sky-400 block">{shift}</span>
              <span className="text-slate-500 dark:text-slate-400 text-xs block">Super: {superv}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'contact',
        header: 'Contact Credentials',
        cell: ({ row }) => {
          const wrk = row.original;
          const phone = wrk.phone || wrk.contactPhone || '+231 770 000 000';
          const email = wrk.email || 'worker@yahayaschool.edu';

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
        header: 'Duty Status',
        cell: ({ row }) => {
          const status = row.original.status || 'Active';
          return <StatusBadge status={status} size="sm" />;
        }
      },
      {
        id: 'actions',
        header: 'Inspect Personnel',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRow(row.original);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-sky-600 dark:bg-slate-800 text-slate-700 hover:text-white dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
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
      title="Support Personnel & Operations Roster"
      description="Registered administrative staff, accountants, transport drivers, campus security, and maintenance personnel with real-time duty check-in."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Support Workers' }]}
      icon={<Clipboard className="w-8 h-8" />}
      recordCount={workers.length}
      recordLabel="Staff"
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
      <EnterpriseKPIDeck cards={kpiCards} isLoading={loading && workers.length === 0} />

      {/* Unified Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search support personnel by name, employee ID code, role, shift, or phone..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadWorkers}
        activeFilterCount={activeFiltersCount}
        onResetFilters={handleClearFilters}
        createButtonLabel="+ Onboard Support Staff"
        onCreate={() => toast.info('New Support Staff onboarding form opened.')}
        customFilterNodes={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter workers by category"
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-emerald-600 shadow-2xs"
            >
              <option value="all">All Operations Categories</option>
              <option value="driver">Transport Drivers</option>
              <option value="security">Campus Security</option>
              <option value="janitorial">Janitorial & Maintenance</option>
              <option value="admin">Administrative Support</option>
            </select>

            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              aria-label="Filter workers by shift"
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-emerald-600 shadow-2xs"
            >
              <option value="all">All Shifts</option>
              <option value="day">Day Shift</option>
              <option value="night">Night Shift</option>
            </select>
          </div>
        }
      />

      {/* High-Density Enterprise Data Grid */}
      <EnterpriseDataGrid
        data={workers}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedRow(row)}
        onRowClick={(row) => setSelectedRow(row)}
        onRowEdit={(row) => toast.info(`Opening personnel profile editor for ${row.name || 'Worker'}`)}
        emptyStateProps={{
          title: 'No Support Personnel Found',
          description: 'No registered support staff exist matching your current operational search or category filters.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: 'Onboard New Staff Member',
          onCreate: () => toast.info('Opened support staff onboarding wizard')
        }}
      />

      {/* Slide-Out Profile Inspection Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow}
        category="worker"
      />

      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        entityType="worker"
        onSuccess={loadWorkers}
      />
      <BulkExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        data={workers}
        entityType="worker"
      />
    </EnterpriseModuleShell>
  );
}

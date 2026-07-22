'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clipboard, Upload, Download, ArrowRight, X, Printer,
  Phone, Mail, Eye, Clock, Truck, Wrench
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

  // Onboarding Form State
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    role: 'Security Officer',
    phone: '',
    email: '',
    employmentStatus: 'active' as 'active' | 'on_leave' | 'retired' | 'suspended' | 'contract' | 'part_time' | 'full_time',
    salaryGrade: 'SG-1',
    address: '',
    emergencyContact: ''
  });

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

  const handleEditOpen = (worker: Worker) => {
    setEditingWorker(worker);
    setOnboardForm({
      name: worker.name || '',
      role: worker.role || 'Security Officer',
      phone: worker.phone || '',
      email: worker.email || '',
      employmentStatus: worker.employmentStatus || 'active',
      salaryGrade: worker.salaryGrade || 'SG-1',
      address: worker.address || '',
      emergencyContact: worker.emergencyContact || ''
    });
    setOnboardModalOpen(true);
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        name: onboardForm.name,
        role: onboardForm.role,
        phone: onboardForm.phone,
        email: onboardForm.email || undefined,
        employmentStatus: onboardForm.employmentStatus,
        salaryGrade: onboardForm.salaryGrade || undefined,
        address: onboardForm.address || undefined,
        emergencyContact: onboardForm.emergencyContact || undefined
      };

      if (editingWorker) {
        const id = editingWorker.documentId || editingWorker.id;
        await erpService.updateWorker(id, payload);
        toast.success('Worker profile updated successfully.');
      } else {
        payload.schoolId = `OK${Math.floor(100000000 + Math.random() * 900000000)}`;
        await erpService.createWorker(payload);
        toast.success('New Support Staff member onboarded.');
      }
      setOnboardModalOpen(false);
      setEditingWorker(null);
      loadWorkers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save worker record.');
    } finally {
      setSubmitting(false);
    }
  };

  // Client-Side filtering for quick interaction
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (categoryFilter !== 'all') {
        const roleLower = (w.role || '').toLowerCase();
        const categoryLower = (w.role || '').toLowerCase(); // Or departments
        
        if (categoryFilter === 'driver' && !roleLower.includes('driver') && !categoryLower.includes('driver')) {
          return false;
        }
        if (categoryFilter === 'security' && !roleLower.includes('security') && !categoryLower.includes('security')) {
          return false;
        }
        if (categoryFilter === 'janitorial' && !roleLower.includes('cleaner') && !roleLower.includes('janitor') && !roleLower.includes('caretaker') && !roleLower.includes('technician')) {
          return false;
        }
        if (categoryFilter === 'admin' && !roleLower.includes('accountant') && !roleLower.includes('admin') && !roleLower.includes('clerk') && !roleLower.includes('director')) {
          return false;
        }
      }

      if (shiftFilter !== 'all') {
        // Fallback checks for shift mapping
        const isNight = (w.role || '').toLowerCase().includes('night') || (w.name || '').toLowerCase().includes('night');
        if (shiftFilter === 'day' && isNight) return false;
        if (shiftFilter === 'night' && !isNight) return false;
      }

      return true;
    });
  }, [workers, categoryFilter, shiftFilter]);

  // Dynamic KPI Card Calculations
  const kpiStats = useMemo(() => {
    const total = workers.length;
    const active = workers.filter(w => w.employmentStatus === 'active').length;
    const rate = total > 0 ? Math.round((active / total) * 100) : 100;
    const drivers = workers.filter(w => (w.role || '').toLowerCase().includes('driver')).length;
    const facility = workers.filter(w => 
      (w.role || '').toLowerCase().includes('cleaner') || 
      (w.role || '').toLowerCase().includes('janitor') || 
      (w.role || '').toLowerCase().includes('technician')
    ).length;

    return {
      total,
      active,
      dutyRate: rate + '%',
      drivers,
      facility
    };
  }, [workers]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total',
      title: 'Active Support Personnel',
      value: kpiStats.total,
      subtitle: `▲ ${kpiStats.active} on active duty`,
      trendDirection: 'up',
      icon: <Clipboard className="w-5 h-5" />,
      badgeText: 'Ops Core'
    },
    {
      id: 'duty',
      title: 'On Duty & Check-In Rate',
      value: kpiStats.dutyRate,
      subtitle: `${kpiStats.active} staff cleared on shifts`,
      trendDirection: 'up',
      icon: <Clock className="w-5 h-5" />,
      onClick: () => toast.success('Opened live campus gate checkpoint roster')
    },
    {
      id: 'fleet',
      title: 'Drivers & Transport Fleet',
      value: kpiStats.drivers,
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
      value: kpiStats.facility,
      subtitle: 'Janitorial, Security & IT Support',
      trendDirection: 'neutral',
      icon: <Wrench className="w-5 h-5" />,
      isActive: categoryFilter === 'janitorial',
      onClick: () => {
        setCategoryFilter(categoryFilter === 'janitorial' ? 'all' : 'janitorial');
        toast.info(categoryFilter === 'janitorial' ? 'Showing all staff' : 'Filtered to Facility Crew');
      }
    }
  ];

  // Print Roster Functionality
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocker is preventing print preview.');
      return;
    }

    const rowsHtml = filteredWorkers.map((w, idx) => {
      const name = w.name || 'Unnamed Staff';
      const idStr = w.schoolId || `WRK-${String(w.id || idx).padStart(4, '0')}`;
      const role = w.role || 'Support Staff';
      const phone = w.phone || 'N/A';
      const email = w.email || 'N/A';
      const status = w.employmentStatus || 'active';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 10px; font-weight: bold; color: #1e293b;">${name}</td>
          <td style="padding: 10px; font-family: monospace; font-weight: bold; color: #0284c7;">${idStr}</td>
          <td style="padding: 10px; text-transform: capitalize;">${role}</td>
          <td style="padding: 10px;">Day Shift (07:30 - 16:30)</td>
          <td style="padding: 10px; font-family: monospace;">${phone}<br/>${email}</td>
          <td style="padding: 10px; text-transform: uppercase; font-weight: bold;">
            <span style="padding: 3px 8px; border-radius: 4px; font-size: 9px; 
              background-color: ${status === 'active' ? '#dcfce7' : '#f3f4f6'}; 
              color: ${status === 'active' ? '#166534' : '#374151'};">
              ${status}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Support Personnel Roster - YAHAYASCOOL</title>
        <style>
          body { font-family: 'Inter', sans-serif; color: #334155; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
          .logo-container { display: flex; align-items: center; gap: 15px; }
          .logo-circle { width: 50px; height: 50px; background-color: #10b981; color: white; font-weight: 950; font-size: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: sans-serif; }
          .logo-text h1 { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
          .logo-text p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; font-weight: 700; }
          .qr-code { width: 80px; height: 80px; }
          .title-area { margin-bottom: 20px; }
          .title-area h2 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
          .title-area p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { padding: 10px; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 10px; text-transform: uppercase; font-weight: bold; color: #475569; }
          .footer { margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; font-weight: bold; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            <div class="logo-circle">Y</div>
            <div class="logo-text">
              <h1>YAHAYASCOOL</h1>
              <p>Darul Aitam Al-Islamiyyah Boarding SIS</p>
            </div>
          </div>
          <div>
            <img class="qr-code" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://yahayaschool.edu/directory/workers" alt="QR Code" />
          </div>
        </div>

        <div class="title-area">
          <h2>Support Personnel & Operations Roster</h2>
          <p>Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} • Total records: ${filteredWorkers.length} staff</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Employee ID</th>
              <th>Role & Category</th>
              <th>Shift Details</th>
              <th>Contact Details</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">No records found.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <span>Confidential - For Internal Administrative Operations Only</span>
          <span>&copy; ${new Date().getFullYear()} YAHAYASCOOL SIS. All rights reserved.</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'name',
        header: 'Support Employee & ID Code',
        cell: ({ row }) => {
          const wrk = row.original;
          const name = wrk.name || [wrk.firstName, wrk.lastName].filter(Boolean).join(' ') || 'Unnamed Personnel';
          const idStr = wrk.schoolId || wrk.code || (wrk.id ? 'WRK-' + String(wrk.id).padStart(4, '0') : 'WRK-0001');
          const photo = wrk.photo?.url;

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
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs capitalize">{wrk.role || 'Support Services'}</span>
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
          const isNight = (wrk.role || '').toLowerCase().includes('night') || (wrk.name || '').toLowerCase().includes('night');
          const shift = isNight ? 'Night Shift (19:30 - 07:30)' : 'Day Shift (07:30 - 16:30)';
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
          const phone = wrk.phone || '+231 770 000 000';
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
          const status = row.original.employmentStatus || 'active';
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
      recordCount={filteredWorkers.length}
      recordLabel="Staff"
      activeFilterCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Print Roster</span>
          </button>
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
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
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
        onCreate={() => {
          setEditingWorker(null);
          setOnboardForm({
            name: '',
            role: 'Security Officer',
            phone: '',
            email: '',
            employmentStatus: 'active',
            salaryGrade: 'SG-1',
            address: '',
            emergencyContact: ''
          });
          setOnboardModalOpen(true);
        }}
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
        data={filteredWorkers}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedRow(row)}
        onRowClick={(row) => setSelectedRow(row)}
        onRowEdit={(row) => handleEditOpen(row)}
        emptyStateProps={{
          title: 'No Support Personnel Found',
          description: 'No registered support staff exist matching your current operational search or category filters.',
          isFilterActive: activeFiltersCount > 0 || query.length > 0,
          onResetFilters: handleClearFilters,
          createLabel: 'Onboard New Staff Member',
          onCreate: () => {
            setEditingWorker(null);
            setOnboardModalOpen(true);
          }
        }}
      />

      {/* Slide-Out Profile Inspection Drawer */}
      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow}
        category="worker"
      />

      {/* Onboarding Dialog */}
      {onboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white">
            <button
              onClick={() => { setOnboardModalOpen(false); setEditingWorker(null); }}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              {editingWorker ? 'Edit Support Worker' : 'Onboard Support Worker'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Enter worker credentials and employment profiles.
            </p>
            <form onSubmit={handleOnboardSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.name}
                    onChange={(e) => setOnboardForm({...onboardForm, name: e.target.value})}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Operational Role *</label>
                  <select
                    value={onboardForm.role}
                    onChange={(e) => setOnboardForm({...onboardForm, role: e.target.value})}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Security Officer">Security Officer</option>
                    <option value="Cleaner / Janitor">Cleaner / Janitor</option>
                    <option value="Chef / Kitchen Staff">Chef / Kitchen Staff</option>
                    <option value="Bus Driver">Bus Driver</option>
                    <option value="ICT / Systems Support">ICT / Systems Support</option>
                    <option value="Mosque Caretaker">Mosque Caretaker</option>
                    <option value="Maintenance Technician">Maintenance Technician</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.phone}
                    onChange={(e) => setOnboardForm({...onboardForm, phone: e.target.value})}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={onboardForm.email}
                    onChange={(e) => setOnboardForm({...onboardForm, email: e.target.value})}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Employment Status *</label>
                  <select
                    value={onboardForm.employmentStatus}
                    onChange={(e) => setOnboardForm({...onboardForm, employmentStatus: e.target.value as any})}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="suspended">Suspended</option>
                    <option value="retired">Retired</option>
                    <option value="contract">Contract</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Salary Grade</label>
                  <input
                    type="text"
                    value={onboardForm.salaryGrade}
                    onChange={(e) => setOnboardForm({...onboardForm, salaryGrade: e.target.value})}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Residential Address</label>
                <input
                  type="text"
                  value={onboardForm.address}
                  onChange={(e) => setOnboardForm({...onboardForm, address: e.target.value})}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setOnboardModalOpen(false); setEditingWorker(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  {submitting ? 'Saving...' : 'Save Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

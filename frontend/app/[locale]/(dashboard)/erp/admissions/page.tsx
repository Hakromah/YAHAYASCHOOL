'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap, FileCheck, Calendar, Award, UserCheck, Plus, CheckCircle2,
  Clock, AlertCircle, ArrowRight, FileText, Filter, Eye, DollarSign
} from 'lucide-react';
import { admissionsService } from '@/services/admissions.service';
import type { AdmissionApplication, AdmissionStage } from '@/types/enterprise.types';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { SlideOutDrawer } from '@/components/erp/SlideOutDrawer';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

export default function AdmissionsERPPage() {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [density, setDensity] = useState<TableDensity>('cozy');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await admissionsService.getApplications(stageFilter);
      setApplications(data);
    } catch {
      toast.error('Failed to load admission applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [stageFilter]);

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchQuery = !query || 
        app.applicantName.toLowerCase().includes(query.toLowerCase()) || 
        app.applicationNumber.toLowerCase().includes(query.toLowerCase()) ||
        app.email.toLowerCase().includes(query.toLowerCase());
      const matchStage = stageFilter === 'all' || app.stage === stageFilter;
      return matchQuery && matchStage;
    });
  }, [applications, query, stageFilter]);

  const kpiCards: EnterpriseKPICard[] = useMemo(() => {
    const total = applications.length;
    const review = applications.filter(a => a.stage === 'document_verification' || a.stage === 'interview_scheduled').length;
    const approved = applications.filter(a => a.stage === 'registrar_approval' || a.stage === 'finance_approval' || a.stage === 'director_approval').length;
    const enrolled = applications.filter(a => a.stage === 'enrolled' || a.stage === 'student_created').length;

    return [
      {
        id: 'total_apps',
        title: 'Total Applications (2026-2027)',
        value: total.toString(),
        subtitle: 'Online, Offline & Transfer Applicants',
        trendDirection: 'up',
        icon: <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        id: 'under_review',
        title: 'Document & Interview Review',
        value: review.toString(),
        subtitle: 'Awaiting Registrar verification',
        trendDirection: 'neutral',
        icon: <Clock className="w-5 h-5 text-amber-500" />
      },
      {
        id: 'pending_approval',
        title: 'Pending Director Approval',
        value: approved.toString(),
        subtitle: 'Assessment passed, ready for decision',
        trendDirection: 'up',
        icon: <FileCheck className="w-5 h-5 text-sky-500" />
      },
      {
        id: 'enrolled_scholars',
        title: 'Enrolled Scholars (Auto-Invoiced)',
        value: enrolled.toString(),
        subtitle: 'Student ID & Tuition Invoice Generated',
        trendDirection: 'up',
        icon: <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      }
    ];
  }, [applications]);

  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    return [
      {
        accessorKey: 'applicationNumber',
        header: 'Application & Applicant',
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="space-y-0.5">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{app.applicationNumber}</span>
              <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors text-xs sm:text-sm max-w-sm truncate">
                {app.applicantName}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">{app.email}</span>
            </div>
          );
        }
      },
      {
        accessorKey: 'gradeApplyingFor',
        header: 'Target Grade & Program',
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-slate-900 dark:text-white text-xs block">{row.original.gradeApplyingFor}</span>
            <span className="text-[11px] text-slate-500 capitalize">{row.original.applicationType} Application</span>
          </div>
        )
      },
      {
        accessorKey: 'guardianName',
        header: 'Guardian Info',
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block">{row.original.guardianName} ({row.original.guardianRelationship})</span>
            <span className="font-mono text-[11px] text-slate-500">{row.original.guardianPhone}</span>
          </div>
        )
      },
      {
        accessorKey: 'stage',
        header: 'Workflow Stage',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold uppercase">
            <Clock className="w-3 h-3 text-indigo-500" />
            {row.original.stage.replace(/_/g, ' ')}
          </span>
        )
      },
      {
        accessorKey: 'status',
        header: 'Enrollment Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRow(app);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" />
                Inspect
              </button>
              {app.stage !== 'enrolled' && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await admissionsService.advanceStage(app, 'enrolled', 'Registrar Lead');
                    loadData();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs"
                >
                  Advance →
                </button>
              )}
            </div>
          );
        }
      }
    ];
  }, []);

  return (
    <EnterpriseModuleShell
      title="Admissions ERP & Student Onboarding Console"
      description="Automated 10-step admission workflow from online application, document verification, and assessment to automatic Student ID and Tuition Invoice generation."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Admissions ERP' }]}
      icon={<GraduationCap className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
      recordCount={filteredApplications.length}
      recordLabel="Applications"
      onClearFilters={() => setStageFilter('all')}
      headerActions={
        <button
          onClick={async () => {
            await admissionsService.submitApplication({
              firstName: 'Mariam',
              lastName: 'Bah',
              email: 'mariam.bah@example.com',
              phone: '+231 886 443 119',
              gradeApplyingFor: 'Grade 10 - STEM',
              guardianName: 'Suleiman Bah',
              guardianPhone: '+231 886 443 000',
              guardianRelationship: 'Father'
            });
            loadData();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ New Application</span>
        </button>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search applications by applicant name, ADM number, email..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={loadData}
        customFilterNodes={
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            aria-label="Filter by admission stage"
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-semibold shadow-2xs"
          >
            <option value="all">All Admission Stages</option>
            <option value="application_received">Application Received</option>
            <option value="document_verification">Document Verification</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="assessment_completed">Assessment Completed</option>
            <option value="enrolled">Enrolled & Auto-Invoiced</option>
          </select>
        }
      />

      <EnterpriseDataGrid
        data={filteredApplications}
        columns={columns}
        isLoading={loading}
        density={density}
        onRowInspect={(row) => setSelectedRow(row)}
      />

      <SlideOutDrawer
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        record={selectedRow ? {
          ...selectedRow,
          name: selectedRow.applicantName,
          id: selectedRow.applicationNumber,
          role: selectedRow.gradeApplyingFor,
          status: selectedRow.status,
          email: selectedRow.email,
          balance: selectedRow.generatedInvoiceId ? `Invoice ${selectedRow.generatedInvoiceId}` : 'Pending Invoice'
        } : null}
        category="admissions"
      />
    </EnterpriseModuleShell>
  );
}

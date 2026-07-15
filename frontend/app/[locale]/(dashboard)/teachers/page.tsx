'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck, Search, Upload, Download, ArrowRight,
  Filter, Layers, RefreshCw, Award, Mail, Phone
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import type { Teacher, Section } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { RelationshipChip } from '@/components/erp/RelationshipChip';
import { BulkImportModal } from '@/components/erp/BulkImportModal';
import { BulkExportModal } from '@/components/erp/BulkExportModal';

export default function TeachersListPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    async function loadTeachers() {
      setLoading(true);
      try {
        const res = await erpService.getTeachers({ query, status: statusFilter, pageSize: 100 });
        setTeachers(res.data);
      } catch (err) {
        console.error('Error fetching teachers:', err);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(loadTeachers, 250);
    return () => clearTimeout(timer);
  }, [query, statusFilter]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-100 flex items-center gap-2.5">
            <UserCheck className="w-8 h-8 text-amber-400" />
            <span>Faculty & Sheikhs Registry</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Browse all teaching faculty, Islamic scholars, and academic department leaders across campuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Roster</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty by name, school ID (#TCH-2026-001), or specialization..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors font-medium"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-amber-500"
        >
          <option value="all">Employment Status: All</option>
          <option value="active">Active Teaching</option>
          <option value="full_time">Full Time</option>
          <option value="part_time">Part Time</option>
          <option value="contract">Contract Scholar</option>
          <option value="on_leave">On Leave</option>
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm animate-pulse flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
          <span>Retrieving faculty profiles from database...</span>
        </div>
      ) : teachers.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400">
          <UserCheck className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">No faculty members found</h3>
          <p className="text-xs text-slate-500 mt-1">Adjust search terms or click Import CSV to create records.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((tch) => (
            <div key={tch.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-amber-500/50 transition-all flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-amber-400">
                    {tch.schoolId || `#TCH-${tch.id}`}
                  </span>
                  <StatusBadge status={tch.employmentStatus || 'active'} size="sm" />
                </div>

                <h3 className="text-base font-bold text-white mb-1">{tch.name}</h3>
                <p className="text-xs text-amber-300 font-semibold mb-2">{tch.specializations || tch.qualifications || 'Teaching Faculty'}</p>

                {tch.sections && tch.sections.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 my-2">
                    {tch.sections.map((sec: any) => (
                      <RelationshipChip key={sec.id} type="section" label={sec.code} />
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-400 space-y-1">
                  <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {tch.phone || 'N/A'}</p>
                  {tch.email && <p className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 text-slate-500" /> {tch.email}</p>}
                </div>
              </div>

              <Link
                href={`/teachers/${tch.documentId || tch.id}`}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white font-bold text-xs transition-all"
              >
                <span>View Teaching Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      <BulkImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} entityType="teacher" onSuccess={() => window.location.reload()} />
      <BulkExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} entityType="teacher" data={teachers} />
    </div>
  );
}

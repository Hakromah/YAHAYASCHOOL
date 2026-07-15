'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap, Search, Upload, Download, ArrowRight,
  Filter, Layers, RefreshCw, UserPlus, Grid, List
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import type { Student, Section } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { RelationshipChip } from '@/components/erp/RelationshipChip';
import { BulkImportModal } from '@/components/erp/BulkImportModal';
import { BulkExportModal } from '@/components/erp/BulkExportModal';

export default function StudentsListPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    async function loadStudents() {
      setLoading(true);
      try {
        const [secList, stRes] = await Promise.all([
          erpService.getSections(),
          erpService.getStudents({ query, gender: genderFilter, status: statusFilter, section: sectionFilter, pageSize: 100 }),
        ]);
        setSections(secList);
        setStudents(stRes.data);
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(loadStudents, 250);
    return () => clearTimeout(timer);
  }, [query, genderFilter, statusFilter, sectionFilter]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-100 flex items-center gap-2.5">
            <GraduationCap className="w-8 h-8 text-emerald-400" />
            <span>Student Information System (SIS)</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Complete registry of all enrolled students, alumni, and admissions across academic sections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Roster</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name, admission number (#ST-2026-001), or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Gender: All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Status: All</option>
            <option value="active">Active Enrolled</option>
            <option value="suspended">Suspended</option>
            <option value="graduated">Graduated / Alumni</option>
            <option value="transferred">Transferred</option>
          </select>

          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Section: All</option>
            {sections.map((s) => (
              <option key={s.id} value={s.code}>{s.code} ({s.name})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm animate-pulse flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Retrieving student SIS profiles from database...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">No students matching filter</h3>
          <p className="text-xs text-slate-500 mt-1">Adjust search parameters or click Import CSV to create records.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Admission # / School ID</th>
                <th className="py-3.5 px-4 font-semibold">Full Student Name</th>
                <th className="py-3.5 px-4 font-semibold">Assigned Section</th>
                <th className="py-3.5 px-4 font-semibold">Gender</th>
                <th className="py-3.5 px-4 font-semibold">Registered Parents</th>
                <th className="py-3.5 px-4 font-semibold">Admission Date</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    {st.schoolId || st.admissionNumber || `#ST-${st.id}`}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-100">
                    {st.firstName} {st.middleName ? `${st.middleName} ` : ''}{st.lastName}
                  </td>
                  <td className="py-3 px-4">
                    {st.sections && st.sections.length > 0 ? (
                      <RelationshipChip type="section" label={st.sections[0].code} sublabel={st.sections[0].name} />
                    ) : (
                      <span className="text-slate-500 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4 capitalize">{st.gender}</td>
                  <td className="py-3 px-4">
                    {st.parents && st.parents.length > 0 ? (
                      <span className="text-slate-300 font-semibold">{st.parents[0].name} ({st.parents[0].phone})</span>
                    ) : (
                      <span className="text-slate-500 italic">No guardian linked</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {st.admissionDate ? new Date(st.admissionDate).toLocaleDateString() : '2026-09-01'}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={st.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/students/${st.documentId || st.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-xs transition-all"
                    >
                      <span>360° Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BulkImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} entityType="student" onSuccess={() => window.location.reload()} />
      <BulkExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} entityType="student" data={students} />
    </div>
  );
}

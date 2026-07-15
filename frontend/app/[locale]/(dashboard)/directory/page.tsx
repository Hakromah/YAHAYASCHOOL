'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, GraduationCap, UserCheck, Clipboard, Search, Filter,
  Download, Upload, Grid, List, ArrowRight, RefreshCw, Layers
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import type { Student, Teacher, Parent, Worker, Section } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { BulkImportModal } from '@/components/erp/BulkImportModal';
import { BulkExportModal } from '@/components/erp/BulkExportModal';

export default function PeopleDirectoryPage() {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'parents' | 'workers'>('students');
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [loading, setLoading] = useState(false);

  // Data
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    async function loadDirectoryData() {
      setLoading(true);
      try {
        const [secList] = await Promise.all([erpService.getSections()]);
        setSections(secList);

        if (activeTab === 'students') {
          const res = await erpService.getStudents({ query, gender: genderFilter, status: statusFilter, section: sectionFilter, pageSize: 50 });
          setStudents(res.data);
        } else if (activeTab === 'teachers') {
          const res = await erpService.getTeachers({ query, gender: genderFilter, status: statusFilter, section: sectionFilter, pageSize: 50 });
          setTeachers(res.data);
        } else if (activeTab === 'parents') {
          const res = await erpService.getParents({ query, pageSize: 50 });
          setParents(res.data);
        } else {
          const res = await erpService.getWorkers({ query, pageSize: 50 });
          setWorkers(res.data);
        }
      } catch (err) {
        console.error('Error loading directory data:', err);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(loadDirectoryData, 250); // debounce search
    return () => clearTimeout(timer);
  }, [activeTab, query, genderFilter, statusFilter, sectionFilter]);

  const currentData = () => {
    switch (activeTab) {
      case 'students': return students;
      case 'teachers': return teachers;
      case 'parents': return parents;
      case 'workers': return workers;
    }
  };

  const getProfileLink = (item: any) => {
    const id = item.documentId || item.id;
    switch (activeTab) {
      case 'students': return `/students/${id}`;
      case 'teachers': return `/teachers/${id}`;
      case 'parents': return `/parents/${id}`;
      case 'workers': return `/workers/${id}`;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-100 flex items-center gap-2.5">
            <Users className="w-8 h-8 text-emerald-400" />
            <span>Unified People Registry & SIS Directory</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Browse, search, and manage all students, faculty, guardians, and support staff across school campuses.
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
            <span>Export Directory</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {[
          { id: 'students', label: 'Students SIS', icon: GraduationCap, count: activeTab === 'students' ? students.length : undefined },
          { id: 'teachers', label: 'Faculty & Sheikhs', icon: UserCheck, count: activeTab === 'teachers' ? teachers.length : undefined },
          { id: 'parents', label: 'Registered Parents', icon: Users, count: activeTab === 'parents' ? parents.length : undefined },
          { id: 'workers', label: 'Support Staff', icon: Clipboard, count: activeTab === 'workers' ? workers.length : undefined },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setQuery(''); setGenderFilter('all'); setStatusFilter('all'); setSectionFilter('all'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                active
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab} by name, school ID, email, or phone...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-medium"
          />
        </div>

        {/* Filters (show based on activeTab) */}
        <div className="flex flex-wrap items-center gap-3">
          {(activeTab === 'students' || activeTab === 'teachers') && (
            <>
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
                <option value="active">Active</option>
                {activeTab === 'students' && (
                  <>
                    <option value="suspended">Suspended</option>
                    <option value="graduated">Graduated / Alumni</option>
                    <option value="transferred">Transferred</option>
                  </>
                )}
                {activeTab === 'teachers' && (
                  <>
                    <option value="on_leave">On Leave</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                  </>
                )}
              </select>
            </>
          )}

          {activeTab === 'students' && sections.length > 0 && (
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-emerald-500 max-w-[160px]"
            >
              <option value="all">Section: All</option>
              {sections.map((s) => (
                <option key={s.id} value={s.code}>{s.code} ({s.name})</option>
              ))}
            </select>
          )}

          {/* View Toggle */}
          <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Card Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm animate-pulse flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Retrieving directory records from database...</span>
        </div>
      ) : currentData().length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">No matching records found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Adjust your search query or filters above, or click &quot;Import CSV&quot; to seed new records into this directory.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-3.5 px-4 font-semibold">School ID / Code</th>
                <th className="py-3.5 px-4 font-semibold">Full Name</th>
                {activeTab === 'students' && <th className="py-3.5 px-4 font-semibold">Assigned Section</th>}
                {activeTab === 'teachers' && <th className="py-3.5 px-4 font-semibold">Specialization / Subject</th>}
                {activeTab === 'parents' && <th className="py-3.5 px-4 font-semibold">Relationship</th>}
                {activeTab === 'workers' && <th className="py-3.5 px-4 font-semibold">Role / Position</th>}
                <th className="py-3.5 px-4 font-semibold">Contact Phone</th>
                <th className="py-3.5 px-4 font-semibold">Status / Type</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {currentData().map((item: any, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    {item.schoolId || item.admissionNumber || `#${item.id}`}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-100">
                    {item.firstName ? `${item.firstName} ${item.lastName || ''}` : item.name}
                  </td>
                  {activeTab === 'students' && (
                    <td className="py-3 px-4">
                      {item.sections && item.sections.length > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono text-[11px]">
                          {item.sections[0].code}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                  )}
                  {activeTab === 'teachers' && (
                    <td className="py-3 px-4 text-slate-300 truncate max-w-[200px]">
                      {item.specializations || item.qualifications || 'Teaching Faculty'}
                    </td>
                  )}
                  {activeTab === 'parents' && (
                    <td className="py-3 px-4 capitalize text-slate-300">
                      {item.relationship || 'Parent/Guardian'}
                    </td>
                  )}
                  {activeTab === 'workers' && (
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {item.role || 'Support Staff'}
                    </td>
                  )}
                  <td className="py-3 px-4 font-mono text-slate-400">{item.phone || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={item.status || item.employmentStatus || 'active'} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={getProfileLink(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white font-bold text-xs transition-all"
                    >
                      <span>Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentData().map((item: any, idx) => (
            <div key={item.id || idx} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-emerald-500/50 transition-all flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {item.schoolId || item.admissionNumber || `#${item.id}`}
                  </span>
                  <StatusBadge status={item.status || item.employmentStatus || 'active'} size="sm" />
                </div>

                <h3 className="text-base font-bold text-white mb-1">
                  {item.firstName ? `${item.firstName} ${item.lastName || ''}` : item.name}
                </h3>

                {activeTab === 'students' && item.sections && item.sections.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Section: <strong className="text-slate-200">{item.sections[0].code}</strong></span>
                  </div>
                )}
                {activeTab === 'teachers' && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {item.specializations || item.qualifications || 'Teaching Faculty'}
                  </p>
                )}
                {activeTab === 'parents' && (
                  <p className="text-xs text-slate-400 capitalize mt-1">
                    Relationship: <strong className="text-slate-200">{item.relationship}</strong>
                  </p>
                )}
                {activeTab === 'workers' && (
                  <p className="text-xs text-slate-300 font-semibold mt-1">
                    {item.role || 'Support Staff'}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-400">
                  <p>Phone: {item.phone || 'N/A'}</p>
                  {item.email && <p className="truncate">Email: {item.email}</p>}
                </div>
              </div>

              <Link
                href={getProfileLink(item)}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white font-bold text-xs transition-all"
              >
                <span>Open 360° Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <BulkImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        entityType={activeTab === 'students' ? 'student' : activeTab === 'teachers' ? 'teacher' : activeTab === 'parents' ? 'parent' : 'worker'}
        onSuccess={() => window.location.reload()}
      />

      <BulkExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        entityType={activeTab === 'students' ? 'student' : activeTab === 'teachers' ? 'teacher' : activeTab === 'parents' ? 'parent' : 'worker'}
        data={currentData()}
      />
    </div>
  );
}

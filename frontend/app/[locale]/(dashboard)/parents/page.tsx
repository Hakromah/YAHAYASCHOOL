'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Search, Upload, Download, ArrowRight,
  RefreshCw, Phone, Mail, GraduationCap
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import type { Parent } from '@/types/erp.types';
import { BulkImportModal } from '@/components/erp/BulkImportModal';
import { BulkExportModal } from '@/components/erp/BulkExportModal';

export default function ParentsListPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    async function loadParents() {
      setLoading(true);
      try {
        const res = await erpService.getParents({ query, pageSize: 100 });
        setParents(res.data);
      } catch (err) {
        console.error('Error fetching parents:', err);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(loadParents, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-100 flex items-center gap-2.5">
            <Users className="w-8 h-8 text-purple-400" />
            <span>Parents & Guardians Registry</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Registered mothers, fathers, and legal guardians linked to enrolled students.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all"
          >
            <Upload className="w-4 h-4 text-purple-400" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Registry</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search parent by name, phone number, or employer..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-medium"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm animate-pulse flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
          <span>Retrieving parents registry from database...</span>
        </div>
      ) : parents.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">No parent records found</h3>
          <p className="text-xs text-slate-500 mt-1">Adjust search terms or use CSV import to register guardians.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parents.map((parent) => (
            <div key={parent.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-purple-500/50 transition-all flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase">
                    {parent.relationship}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{parent.phone}</span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{parent.name}</h3>
                {parent.occupation && <p className="text-xs text-slate-400">Occupation: {parent.occupation}</p>}

                {parent.children && parent.children.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs space-y-1">
                    <span className="text-slate-500 font-semibold text-[11px]">Linked Students:</span>
                    <div className="flex flex-wrap gap-1">
                      {parent.children.map((ch: any) => (
                        <Link
                          key={ch.id}
                          href={`/students/${ch.documentId || ch.id}`}
                          className="px-2 py-0.5 rounded bg-slate-950 hover:bg-emerald-950 text-emerald-400 border border-slate-800 font-mono text-[11px] transition-colors"
                        >
                          {ch.firstName} {ch.lastName}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href={`/parents/${parent.documentId || parent.id}`}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white font-bold text-xs transition-all"
              >
                <span>Guardian Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      <BulkImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} entityType="parent" onSuccess={() => window.location.reload()} />
      <BulkExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} entityType="parent" data={parents} />
    </div>
  );
}

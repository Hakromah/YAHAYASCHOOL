'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clipboard, Search, Upload, Download, ArrowRight,
  RefreshCw, Phone, Mail
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import type { Worker } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { BulkImportModal } from '@/components/erp/BulkImportModal';
import { BulkExportModal } from '@/components/erp/BulkExportModal';

export default function WorkersListPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    async function loadWorkers() {
      setLoading(true);
      try {
        const res = await erpService.getWorkers({ query, pageSize: 100 });
        setWorkers(res.data);
      } catch (err) {
        console.error('Error fetching workers:', err);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(loadWorkers, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-100 flex items-center gap-2.5">
            <Clipboard className="w-8 h-8 text-sky-400" />
            <span>Support Workers & Staff Registry</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Registered administrative staff, accountants, bus drivers, campus security, and operations personnel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all"
          >
            <Upload className="w-4 h-4 text-sky-400" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Roster</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff member by name, role (Account Lead, Driver, Security), or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-medium"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm animate-pulse flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
          <span>Retrieving support workers roster from database...</span>
        </div>
      ) : workers.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400">
          <Clipboard className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">No support workers found</h3>
          <p className="text-xs text-slate-500 mt-1">Adjust search terms or click Import CSV to seed staff records.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((wrk) => (
            <div key={wrk.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-sky-500/50 transition-all flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-sky-400">
                    {wrk.schoolId || `#WRK-${wrk.id}`}
                  </span>
                  <StatusBadge status={wrk.employmentStatus || 'active'} size="sm" />
                </div>

                <h3 className="text-base font-bold text-white mb-1">{wrk.name}</h3>
                <p className="text-xs text-sky-300 font-bold mb-2">{wrk.role}</p>

                <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-400 space-y-1">
                  <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {wrk.phone}</p>
                  {wrk.email && <p className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 text-slate-500" /> {wrk.email}</p>}
                </div>
              </div>

              <Link
                href={`/workers/${wrk.documentId || wrk.id}`}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white font-bold text-xs transition-all"
              >
                <span>Staff Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      <BulkImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} entityType="worker" onSuccess={() => window.location.reload()} />
      <BulkExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} entityType="worker" data={workers} />
    </div>
  );
}

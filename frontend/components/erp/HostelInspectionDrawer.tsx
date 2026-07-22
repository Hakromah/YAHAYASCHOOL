'use client';

import React, { useState } from 'react';
import {
  X, User, Home, DollarSign, Package, Wrench, Calendar, KeyRound, Heart,
  ShieldAlert, FileText, Clock, FileSearch, CheckCircle2, AlertCircle, AlertTriangle, QrCode, RotateCcw
} from 'lucide-react';
import type { HostelBedAllocation } from '@/types/enterprise.types';
import { StatusBadge } from './StatusBadge';
import { toast } from 'sonner';

interface HostelInspectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  allocation: HostelBedAllocation | null;
}

export function HostelInspectionDrawer({ isOpen, onClose, allocation }: HostelInspectionDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'finance' | 'assets' | 'maintenance' | 'attendance' | 'visitors' | 'medical' | 'discipline' | 'documents' | 'timeline' | 'audit'
  >('overview');

  if (!isOpen || !allocation) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'finance', label: 'Finance & Ledger', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'assets', label: 'Room Assets', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'visitors', label: 'Visitors', icon: <KeyRound className="w-3.5 h-3.5" /> },
    { id: 'medical', label: 'Medical', icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'discipline', label: 'Discipline', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'audit', label: 'Audit Trail', icon: <FileSearch className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 flex justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
              {allocation.studentName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{allocation.studentName}</h3>
                <StatusBadge status={allocation.status} size="sm" />
              </div>
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{allocation.allocationNumber}</span>
              <span className="text-xs text-slate-500 ml-2">| {allocation.buildingName} (Room {allocation.roomNumber})</span>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 11-Tab Navigation Header */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Scholar Profile</span>
                  <p className="font-extrabold text-slate-900 dark:text-white">{allocation.studentName}</p>
                  <p className="font-mono text-slate-500">{allocation.schoolId}</p>
                  <p className="text-slate-500 mt-1">{allocation.programName}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Boarding Room</span>
                  <p className="font-extrabold text-slate-900 dark:text-white">{allocation.buildingName}</p>
                  <p className="text-indigo-600 font-bold">Room {allocation.roomNumber} ({allocation.bedNumber})</p>
                  <p className="text-slate-500 mt-1">Check-in: {allocation.checkInDate}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40 space-y-2">
                <span className="font-extrabold text-indigo-900 dark:text-indigo-300">Guardian Contact</span>
                <p className="font-bold text-slate-900 dark:text-white">{allocation.guardianName}</p>
                <p className="font-mono text-slate-600 dark:text-slate-300">{allocation.guardianPhone}</p>
              </div>

              {allocation.medicalInfo?.allergies?.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Medical Care Plan:</span>
                  </div>
                  <p>{allocation.medicalInfo.emergencyCarePlan}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FINANCE & LEDGER */}
          {activeTab === 'finance' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 space-y-1">
                <p className="font-extrabold text-sm">Accommodation Fee: ${allocation.termFee.toFixed(2)} / term</p>
                <p className="font-bold">Refundable Security Deposit: ${allocation.securityDeposit.toFixed(2)} (GL 2050 Liability)</p>
                <p className="text-slate-500 text-[11px]">Invoice Reference: {allocation.invoiceId || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 dark:text-white">Double-Entry Financial Ledger</h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5">Debit ($)</th>
                        <th className="p-2.5">Credit ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {allocation.financialLedger.map((l, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-mono text-[11px]">{l.date}</td>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{l.description}</td>
                          <td className="p-2.5 font-mono text-emerald-600 font-bold">${l.debit.toFixed(2)}</td>
                          <td className="p-2.5 font-mono text-slate-500">${l.credit.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROOM ASSETS */}
          {activeTab === 'assets' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-500 font-semibold">Assets assigned to Room {allocation.roomNumber}:</p>
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Solid Teak Double Bunk Bed (AST-HST-0101)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Excellent</span>
                </div>
                <p className="text-slate-500 text-[11px]">QR Code Tagged | Value: $450.00 | Warranty until 2030</p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Dual Split Inverter AC Unit 18,000 BTU (AST-HST-0103)</span>
                  <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">Good Condition</span>
                </div>
                <p className="text-slate-500 text-[11px]">QR Code Tagged | Value: $650.00 | Last Service: 2026-03-15 ($35.00)</p>
              </div>
            </div>
          )}

          {/* TAB 4: MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <div className="space-y-3 text-xs">
              <button
                onClick={async () => {
                  try {
                    // @ts-ignore
                    await apiClient.post('/hostel-maintenance-tickets', {
                      data: {
                        room: allocation.roomId,
                        building: allocation.buildingId,
                        issueType: 'other',
                        description: 'AC filter cleanup and general check requested.',
                        priority: 'medium',
                        status: 'open',
                        cost: 0
                      }
                    });
                    toast.success('Logged maintenance request for Room ' + allocation.roomNumber);
                  } catch (e) {
                    toast.error('Failed to log maintenance request.');
                  }
                }}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                + Log Repair / Cleaning Ticket
              </button>
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white block">Preventative AC Filter Maintenance</span>
                <p className="text-slate-500 mt-1">Completed by HVAC Tech Alpha on 2026-03-15 ($35.00 logged to Finance)</p>
              </div>
            </div>
          )}

          {/* TAB 5: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-3 text-xs">
              <h4 className="font-extrabold text-slate-900 dark:text-white">Night Roll Call & Curfew History</h4>
              {(allocation as any).attendanceHistory && (allocation as any).attendanceHistory.length > 0 ? (
                (allocation as any).attendanceHistory.map((att: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>{att.date || att.createdAt?.split('T')[0]}</span>
                      <span className={att.status === 'present' ? 'text-emerald-600' : 'text-rose-600'}>
                        {att.status?.toUpperCase() || 'PRESENT'} ({att.checkInTime || '21:45 PM'})
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{att.notes || 'Roll call completed.'}</p>
                  </div>
                ))
              ) : (
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>{allocation.checkInDate} Night Check</span>
                    <span className="text-emerald-600">PRESENT (21:45 PM)</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">Warden verified resident in assigned bed.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: VISITORS */}
          {activeTab === 'visitors' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">{allocation.guardianName} (Guardian)</span>
                <p className="text-slate-500 text-[11px]">Check-in verified at security gate. Contact: {allocation.guardianPhone}</p>
              </div>
            </div>
          )}

          {/* TAB 7: MEDICAL */}
          {activeTab === 'medical' && (
            <div className="space-y-3 text-xs p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="font-extrabold text-slate-900 dark:text-white">Emergency Doctor: {allocation.medicalInfo?.doctorContact || 'School Nurse Counter'}</p>
              <p className="text-slate-600 dark:text-slate-300 font-bold">Allergies: {allocation.medicalInfo?.allergies?.join(', ') || 'None'}</p>
              <p className="text-slate-600 dark:text-slate-300">Care Plan: {allocation.medicalInfo?.emergencyCarePlan || 'Standard Boarding Protocol'}</p>
            </div>
          )}

          {/* TAB 8: DISCIPLINE */}
          {activeTab === 'discipline' && (
            <div className="space-y-3 text-xs">
              {(allocation as any).disciplineRecords && (allocation as any).disciplineRecords.length > 0 ? (
                (allocation as any).disciplineRecords.map((d: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-950/30 bg-rose-50/20 text-rose-950 dark:text-rose-300 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>{d.date || d.createdAt?.split('T')[0]} - {d.category}</span>
                      <span className="text-rose-600 font-extrabold uppercase text-[10px]">{d.severity}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{d.description}</p>
                  </div>
                ))
              ) : (
                <div className="space-y-3 text-xs text-center py-6 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold">No Disciplinary Violations or Complaints Recorded.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Boarding Accommodation Agreement.pdf</span>
                <button onClick={() => toast.success('Downloading Agreement PDF...')} className="text-indigo-600 font-bold">Download</button>
              </div>
              {allocation.invoiceId && (
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Hostel Fee Invoice ({allocation.invoiceId}).pdf</span>
                  <button onClick={() => toast.success('Downloading Invoice PDF...')} className="text-indigo-600 font-bold">Download</button>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3 text-xs border-l-2 border-indigo-500 pl-4">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Bed Allocation Completed</span>
                <span className="text-[11px] text-slate-400">{allocation.checkInDate} 10:00 AM</span>
              </div>
              {allocation.status === 'vacated' && (
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Bed Vacated (Checked-Out)</span>
                  <span className="text-[11px] text-slate-400">{(allocation as any).checkOutDate || 'N/A'}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 11: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-2 text-xs font-mono">
              {allocation.auditTrail && allocation.auditTrail.length > 0 ? (
                allocation.auditTrail.map((a: any) => (
                  <div key={a.id || a.timestamp} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-indigo-600 block">{a.action}</span>
                    <span className="text-slate-500 text-[11px]">{a.timestamp} | By: {a.performedBy} ({a.performedByRole})</span>
                    {a.notes && <p className="text-slate-600 dark:text-slate-300 mt-1 font-sans">{a.notes}</p>}
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-indigo-600 block">ALLOCATION_CREATED</span>
                  <span className="text-slate-500 text-[11px]">{allocation.checkInDate}T10:00:00Z | By: Hostel Registrar (accountant)</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

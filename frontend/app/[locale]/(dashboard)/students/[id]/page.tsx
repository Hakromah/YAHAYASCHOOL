'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap, User, BookOpen, Layers, Calendar, AlertCircle,
  HeartPulse, FileText, Clock, DollarSign, Home, Shield, Award,
  CheckCircle2, ArrowLeft, Phone, Mail, MapPin, QrCode, Share2,
  Download, Printer, RefreshCw, AlertTriangle
} from 'lucide-react';
import { erpService } from '@/services/erp.service';
import type { Student } from '@/types/erp.types';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { RelationshipChip } from '@/components/erp/RelationshipChip';
import { TimelineFeed } from '@/components/erp/TimelineFeed';
import { BehaviorLevelCard } from '@/components/erp/BehaviorLevelCard';
import { getStrapiMediaUrl } from '@/services/cms.service';

export default function StudentSISProfilePage() {
  const params = useParams();
  const idOrDocumentId = params?.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'identity' | 'academic' | 'behavior' | 'medical' | 'documents' | 'attendance' | 'finance' | 'hostel' | 'quran'
  >('overview');

  useEffect(() => {
    if (!idOrDocumentId) return;
    async function loadStudent() {
      setLoading(true);
      try {
        const data = await erpService.getStudentById(idOrDocumentId);
        setStudent(data);
      } catch (err) {
        console.error('Failed loading student profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStudent();
  }, [idOrDocumentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="text-sm font-semibold">Loading Student 360° SIS Dossier...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center rounded-2xl border border-slate-800 bg-slate-900/60 my-12">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-100">Student Profile Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          The requested student ID ({idOrDocumentId}) does not exist or has been removed.
        </p>
        <Link
          href="/students"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Student Roster</span>
        </Link>
      </div>
    );
  }

  const fullName = `${student.firstName} ${student.middleName ? `${student.middleName} ` : ''}${student.lastName}`;
  const photoUrl = student.photo ? getStrapiMediaUrl(student.photo) : null;

  const tabs = [
    { id: 'overview', label: 'Dossier Overview', icon: GraduationCap },
    { id: 'identity', label: 'Identity & Demographics', icon: User },
    { id: 'academic', label: 'Academic & Multi-Sections', icon: Layers },
    { id: 'behavior', label: 'Timeline & Behavior', icon: Award },
    { id: 'medical', label: 'Medical & Notes', icon: HeartPulse },
    { id: 'documents', label: 'Documents & Media', icon: FileText },
    { id: 'quran', label: 'Qur\'an Memorization (Phase 3)', icon: BookOpen, placeholder: true },
    { id: 'attendance', label: 'Attendance Track (Phase 4)', icon: Clock, placeholder: true },
    { id: 'finance', label: 'Fee & Billing Ledger (Phase 6)', icon: DollarSign, placeholder: true },
    { id: 'hostel', label: 'Hostel Assignment (Phase 5)', icon: Home, placeholder: true },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Back to Students Roster</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 md:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Photo Box */}
          <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-slate-950 flex items-center justify-center flex-shrink-0 shadow-lg">
            {photoUrl ? (
              <Image src={photoUrl} alt={fullName} fill className="object-cover" />
            ) : (
              <GraduationCap className="w-12 h-12 text-emerald-400/60" />
            )}
          </div>

          {/* Core Identity Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold">
                {student.schoolId || student.admissionNumber || `#ST-${student.id}`}
              </span>
              <StatusBadge status={student.status} size="md" />
              <span className="text-xs text-slate-400 font-mono">Enrolled: {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'Sep 2026'}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white truncate">{fullName}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              {student.gender && <span className="capitalize font-semibold text-emerald-400">Gender: {student.gender}</span>}
              {student.nationality && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {student.nationality}</span>}
              {student.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-500" /> {student.phone}</span>}
              {student.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {student.email}</span>}
            </div>
          </div>

          {/* QR / Barcode Quick Access */}
          <div className="hidden lg:flex flex-col items-end gap-1.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-right">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
              <QrCode className="w-4 h-4" />
              <span>SIS-QR Verify</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">ID: {student.documentId?.slice(0, 8) || student.id}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-3 no-scrollbar">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                active
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900/80 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${t.placeholder && !active ? 'text-amber-400/80' : ''}`} />
              <span>{t.label}</span>
              {t.placeholder && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] uppercase tracking-tighter">
                  ERP Phase
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[400px]">
        {/* ── 1. Overview Tab ──────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Academic Sections & Programs Summary */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
                <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <span>Current Multi-Section Assignments</span>
                </h3>
                {student.sections && student.sections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {student.sections.map((sec: any) => (
                      <RelationshipChip key={sec.id} type="section" label={sec.code} sublabel={sec.name} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No active class section currently assigned.</p>
                )}

                <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">Enrolled Programs:</span>
                    {student.programs && student.programs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {student.programs.map((p: any) => (
                          <RelationshipChip key={p.id} type="program" label={p.name} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Standard High School Curriculum</span>
                    )}
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">Departments:</span>
                    {student.departments && student.departments.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {student.departments.map((d: any) => (
                          <RelationshipChip key={d.id} type="department" label={d.name} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Islamic & STEM High School</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Biography & General Notes */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
                <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>Biography & General Student Profile</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {student.biography || student.generalNotes || 'Enrolled student at Yahaya International Islamic & English High School. Exhibiting commitment to moral leadership and academic excellence.'}
                </p>
              </div>

              {/* Recent Behavior Brief */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <span>Recent Behavior & Achievement Log</span>
                  </h3>
                  <button onClick={() => setActiveTab('behavior')} className="text-xs text-emerald-400 hover:underline font-bold">
                    View Full Feed →
                  </button>
                </div>
                {student.behaviorRecords && student.behaviorRecords.length > 0 ? (
                  <div className="space-y-3">
                    {student.behaviorRecords.slice(0, 2).map((b, idx) => (
                      <BehaviorLevelCard key={idx} record={b} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No behavioral records logged for this academic term.</p>
                )}
              </div>
            </div>

            {/* Right Column: Parents, Teachers, & Emergency */}
            <div className="space-y-6">
              {/* Linked Parents & Guardians */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
                <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-400" />
                  <span>Linked Parents / Guardians</span>
                </h3>
                {student.parents && student.parents.length > 0 ? (
                  <div className="space-y-3">
                    {student.parents.map((p) => (
                      <div key={p.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Link href={`/parents/${p.documentId || p.id}`} className="text-sm font-bold text-purple-300 hover:underline">
                            {p.name}
                          </Link>
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase">
                            {p.relationship}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" /> {p.phone}
                        </p>
                        {p.occupation && (
                          <p className="text-[11px] text-slate-400">Occupation: {p.occupation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No guardian registry record linked yet.</p>
                )}
              </div>

              {/* Assigned Teachers & Sheikhs */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
                <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-400" />
                  <span>Assigned Faculty & Sheikhs</span>
                </h3>
                {student.teachers && student.teachers.length > 0 ? (
                  <div className="space-y-2">
                    {student.teachers.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div>
                          <Link href={`/teachers/${t.documentId || t.id}`} className="text-xs font-bold text-amber-300 hover:underline">
                            {t.name}
                          </Link>
                          <p className="text-[11px] text-slate-500 truncate max-w-[160px]">{t.specializations || 'Academic Faculty'}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{t.phone || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No direct teachers assigned outside section defaults.</p>
                )}
              </div>

              {/* Emergency Contact Summary */}
              <div className="rounded-2xl border border-rose-900/40 bg-rose-950/10 p-6 shadow-xl">
                <h3 className="text-sm font-bold text-rose-300 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Emergency Care & Contact Info</span>
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  {student.emergencyContacts ? JSON.stringify(student.emergencyContacts) : 'In emergency, contact primary parent/guardian listed above immediately.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. Identity & Demographics Tab ──────────────────────────────── */}
        {activeTab === 'identity' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-8 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              <span>Full Identity & Demographics Record</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">First Name</span>
                <p className="text-sm font-bold text-slate-100">{student.firstName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Middle Name</span>
                <p className="text-sm font-bold text-slate-100">{student.middleName || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Last Name / Family</span>
                <p className="text-sm font-bold text-slate-100">{student.lastName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Date of Birth</span>
                <p className="text-sm font-mono text-slate-200">{student.dateOfBirth || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Place of Birth</span>
                <p className="text-sm text-slate-200">{student.placeOfBirth || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Nationality / Citizenship</span>
                <p className="text-sm font-bold text-emerald-400">{student.nationality || 'Ghanaian / International'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">National ID / Ghanacard #</span>
                <p className="text-sm font-mono text-slate-200">{student.nationalId || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Passport Number</span>
                <p className="text-sm font-mono text-slate-200">{student.passportNumber || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Religion / Faith Track</span>
                <p className="text-sm font-bold text-amber-400">{student.religion || 'Islam (Sunni)'}</p>
              </div>

              <div className="md:col-span-3 pt-4 border-t border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">Home / Residential Address</span>
                <p className="text-sm text-slate-200">{student.address || 'Accra, Greater Accra Region, Ghana'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. Academic & Multi-Sections Tab ────────────────────────────── */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>Multi-Section Assignment & Enrollment History</span>
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Under the YAHAYASCOOL Core ERP model, students can simultaneously belong to an academic grade section (e.g., Grade 10A) and specialized religious/language sections (e.g., Tahfidz Group 2 or Advanced Arabic).
              </p>

              {student.enrollmentHistory && student.enrollmentHistory.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="p-3">Academic Year</th>
                        <th className="p-3">Section Code</th>
                        <th className="p-3">Enrollment Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Staff Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {student.enrollmentHistory.map((h, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-slate-100">{h.academicYear}</td>
                          <td className="p-3 font-mono text-emerald-400">{h.sectionCode}</td>
                          <td className="p-3 font-mono">{new Date(h.enrollmentDate).toLocaleDateString()}</td>
                          <td className="p-3"><StatusBadge status={h.status} size="sm" /></td>
                          <td className="p-3 text-slate-400">{h.notes || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                  No historical enrollment records logged. Current active section assignment is governed by the overview tab.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 4. Timeline & Behavior Tab ──────────────────────────────────── */}
        {activeTab === 'behavior' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <span>Behavioral & Disciplinary Records</span>
              </h3>
              {student.behaviorRecords && student.behaviorRecords.length > 0 ? (
                <div className="space-y-4">
                  {student.behaviorRecords.map((rec, i) => (
                    <BehaviorLevelCard key={i} record={rec} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-8 text-center">No commendations or disciplinary notices recorded.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>Student Life Chronological Timeline</span>
              </h3>
              <TimelineFeed items={student.timeline} emptyMessage="No life events or milestone records logged yet." />
            </div>
          </div>
        )}

        {/* ── 5. Medical & Notes Tab ──────────────────────────────────────── */}
        {activeTab === 'medical' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-400" />
                <span>Medical Info & Care Plan</span>
              </h3>
              {student.medicalInfo && student.medicalInfo.length > 0 ? (
                student.medicalInfo.map((m, idx) => (
                  <div key={idx} className="space-y-4 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 font-semibold">Blood Group:</span>
                      <span className="px-3 py-1 rounded bg-rose-500/20 text-rose-300 font-bold text-sm">{m.bloodGroup || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">Allergies / Contraindications:</span>
                      <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">{m.allergies || 'None reported'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">Chronic Conditions:</span>
                      <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">{m.chronicConditions || 'None reported'}</p>
                    </div>
                    {m.emergencyCarePlan && (
                      <div>
                        <span className="text-rose-400 font-semibold block mb-1">Emergency Care Plan:</span>
                        <p className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-200">{m.emergencyCarePlan}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic py-8 text-center">No specialized medical records submitted by parents.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Internal Staff Observations & Notes</span>
              </h3>
              {student.staffNotes && student.staffNotes.length > 0 ? (
                <div className="space-y-3">
                  {student.staffNotes.map((note, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-200">
                        <span>{note.authorName} <span className="text-slate-500 font-normal">({note.authorRole})</span></span>
                        <span className="font-mono text-[11px] text-slate-400">{new Date(note.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{note.noteContent}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-8 text-center">No internal staff notes recorded.</p>
              )}
            </div>
          </div>
        )}

        {/* ── 6. Documents & Media Tab ────────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>Uploaded Student Dossier Documents</span>
            </h3>
            {student.documents && student.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {student.documents.map((doc, idx) => (
                  <a
                    key={idx}
                    href={getStrapiMediaUrl(doc) || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 flex items-center gap-3 transition-all group"
                  >
                    <FileText className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{doc.name || `Document #${idx + 1}`}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{(doc.size || 0).toFixed(1)} KB • {doc.ext || 'PDF'}</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-12 text-center">No attached birth certificates, transcripts, or passport files found.</p>
            )}
          </div>
        )}

        {/* ── 7-10. Future Phase Placeholders ─────────────────────────────── */}
        {(activeTab === 'quran' || activeTab === 'attendance' || activeTab === 'finance' || activeTab === 'hostel') && (
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/30 max-w-3xl mx-auto space-y-4 my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              {activeTab === 'quran' && <BookOpen className="w-8 h-8" />}
              {activeTab === 'attendance' && <Clock className="w-8 h-8" />}
              {activeTab === 'finance' && <DollarSign className="w-8 h-8" />}
              {activeTab === 'hostel' && <Home className="w-8 h-8" />}
            </div>

            <h3 className="text-xl font-black text-white">
              {activeTab === 'quran' && 'Qur\'an & Tahfidz Tracking Console — Coming in Phase 3'}
              {activeTab === 'attendance' && 'Daily & Subject Attendance Engine — Coming in Phase 4'}
              {activeTab === 'finance' && 'Student Billing Ledger & Fee Management — Coming in Phase 6'}
              {activeTab === 'hostel' && 'Hostel & Dormitory Allocation — Coming in Phase 5'}
            </h3>

            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              This entity relationship ({student.schoolId}) is already primed inside the Phase 2 Master ERP Database schema. When {activeTab} modules are deployed in upcoming project phases, this tab will dynamically render real-time logs directly from the central PostgreSQL tables without requiring schema refactoring.
            </p>

            <div className="pt-4">
              <span className="inline-block px-4 py-1.5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-semibold border border-slate-700">
                Architecture Status: Ready & Normalized
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

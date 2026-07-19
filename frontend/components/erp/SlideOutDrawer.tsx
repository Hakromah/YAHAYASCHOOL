/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { cn } from '@/lib/utils';
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  FileText,
  Heart,
  History,
  Home,
  Key,
  Layers,
  MessageSquare,
  PauseCircle, Printer,
  QrCode, Shield,
  StickyNote, User,
  X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/shared/Avatar';

export type DrawerTabId =
  | 'overview'
  | 'academic'
  | 'finance'
  | 'attendance'
  | 'hostel'
  | 'quran'
  | 'documents'
  | 'timeline'
  | 'audit'
  | 'permissions'
  | 'notes';

export interface SmartQuickAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: (record: any) => void;
}

export interface SlideOutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  title?: string;
  category?: 'student' | 'teacher' | 'parent' | 'worker' | 'directory' | 'finance' | 'event' | 'admissions' | 'generic';
  quickActions?: SmartQuickAction[];
  customTabsContent?: Partial<Record<DrawerTabId | string, React.ReactNode>>;
  tabsListOverride?: { id: DrawerTabId | string; label: string; icon: React.ReactNode }[];
  hideIntelligence?: boolean;
  statsBarOverride?: React.ReactNode;
}

export function SlideOutDrawer({
  isOpen,
  onClose,
  record,
  title = 'Record Profile Inspection',
  category = 'generic',
  quickActions,
  customTabsContent = {},
  tabsListOverride,
  hideIntelligence = false,
  statsBarOverride,
}: SlideOutDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTabId | string>('overview');
  const [noteText, setNoteText] = useState('');
  const [savedNotes, setSavedNotes] = useState<string[]>(['Verified administrative clearance for Phase 3E.', 'Assigned to Grade 5 Hifz track.']);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  // Extract common attributes or use generic fields
  const name = record.name || record.applicantName || record.title || record.fullName || 'Unnamed Record';
  const idStr = record.id || record.code || record.applicationId || 'ERP-0000';
  const roleOrGrade = record.role || record.gradeApplied || record.grade || record.category || record.department || 'General Profile';
  const statusStr = record.status || record.state || 'Active';
  const emailOrPhone = record.email || record.phone || record.contactPhone || 'No Contact Info';
  const guardianOrSupervisor = record.parentName || record.guardian || record.supervisor || 'N/A';
  const avatarUrl = record.avatarUrl || record.photoUrl || null;

  // Determine status color badge
  const isGreen = ['active', 'approved', 'paid', 'verified', 'enrolled', 'excellent', 'upcoming'].some(k => statusStr.toLowerCase().includes(k));
  const isRed = ['suspended', 'overdue', 'rejected', 'terminated', 'cancelled'].some(k => statusStr.toLowerCase().includes(k));
  const statusColor = isGreen
    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold'
    : isRed
      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold'
      : 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold';

  // Default Smart Actions based on category
  const defaultActions: SmartQuickAction[] = quickActions || (
    category === 'student' ? [
      { id: 'edit', label: 'Edit Profile', icon: <Edit className="w-3.5 h-3.5" />, variant: 'primary', onClick: () => toast.info(`Editing ${name}`) },
      { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-3.5 h-3.5" />, onClick: () => toast.success(`Viewing attendance for ${name}`) },
      { id: 'homework', label: 'Homework', icon: <BookOpen className="w-3.5 h-3.5" />, onClick: () => toast.info(`Opened homework logs for ${name}`) },
      { id: 'fees', label: 'Fees & Billing', icon: <DollarSign className="w-3.5 h-3.5" />, onClick: () => toast.info(`Opened fee ledger for ${name}`) },
      { id: 'print', label: 'Print ID Card', icon: <Printer className="w-3.5 h-3.5" />, onClick: () => toast.success(`Printing ID Card for ${name}...`) },
      { id: 'suspend', label: 'Suspend', icon: <PauseCircle className="w-3.5 h-3.5" />, variant: 'danger', onClick: () => toast.error(`Suspension confirmation requested for ${name}`) },
    ] : category === 'teacher' ? [
      { id: 'edit', label: 'Edit Teacher', icon: <Edit className="w-3.5 h-3.5" />, variant: 'primary', onClick: () => toast.info(`Editing teacher profile`) },
      { id: 'assign-sub', label: 'Assign Subject', icon: <BookOpen className="w-3.5 h-3.5" />, onClick: () => toast.success(`Assigning subject to ${name}`) },
      { id: 'assign-sec', label: 'Assign Section', icon: <Layers className="w-3.5 h-3.5" />, onClick: () => toast.success(`Assigning section to ${name}`) },
      { id: 'timetable', label: 'Timetable', icon: <Clock className="w-3.5 h-3.5" />, onClick: () => toast.info(`Opened teacher timetable`) },
      { id: 'eval', label: 'Evaluation', icon: <Award className="w-3.5 h-3.5" />, onClick: () => toast.info(`Opened KPI evaluation report`) },
    ] : category === 'parent' ? [
      { id: 'fees', label: 'Fee Clearance', icon: <DollarSign className="w-3.5 h-3.5" />, variant: 'primary', onClick: () => toast.info(`Viewing family billing ledger`) },
      { id: 'children', label: 'Linked Children', icon: <Heart className="w-3.5 h-3.5" />, onClick: () => toast.success(`Viewing children linked to ${name}`) },
      { id: 'msg', label: 'Send Message', icon: <MessageSquare className="w-3.5 h-3.5" />, onClick: () => toast.info(`Opening SMS/Email composer for ${name}`) },
    ] : category === 'worker' ? [
      { id: 'shift', label: 'Shift Roster', icon: <Clock className="w-3.5 h-3.5" />, variant: 'primary', onClick: () => toast.info(`Opened shift schedule`) },
      { id: 'payroll', label: 'Payroll Ledger', icon: <DollarSign className="w-3.5 h-3.5" />, onClick: () => toast.success(`Opened worker payroll slip`) },
      { id: 'leave', label: 'Leave Request', icon: <Calendar className="w-3.5 h-3.5" />, onClick: () => toast.info(`Opened leave application modal`) },
    ] : [
      { id: 'edit', label: 'Edit Record', icon: <Edit className="w-3.5 h-3.5" />, variant: 'primary', onClick: () => toast.info(`Editing record ${idStr}`) },
      { id: 'print', label: 'Print Summary', icon: <Printer className="w-3.5 h-3.5" />, onClick: () => toast.success(`Printing record summary`) },
      { id: 'audit', label: 'View Logs', icon: <History className="w-3.5 h-3.5" />, onClick: () => setActiveTab('audit') },
    ]
  );

  const tabsList = tabsListOverride || [
    { id: 'overview', label: 'Overview', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'academic', label: 'Academic', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'finance', label: 'Finance', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'hostel', label: 'Hostel', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'quran', label: "Qur'an", icon: <Award className="w-3.5 h-3.5" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'timeline', label: 'Timeline', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'audit', label: 'Audit Logs', icon: <History className="w-3.5 h-3.5" /> },
    { id: 'permissions', label: 'Permissions', icon: <Key className="w-3.5 h-3.5" /> },
    { id: 'notes', label: 'Notes', icon: <StickyNote className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 flex justify-end">
      {/* Drawer Container */}
      <div
        className="w-full max-w-5xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-auto animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label={`Profile inspection for ${name}`}
      >
        <div className="w-full h-full max-h-[90vh] overflow-auto p-1 border border-yellow-600/80 rounded-lg shadow-lg">
          {/* Header Bar */}
          <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 relative">
            <div className="flex items-start gap-4">
              {/* Large Photo / Avatar */}
              <div className="relative shrink-0">
                <Avatar
                  src={record.photo || record.avatarUrl || record.photoUrl}
                  name={name}
                  size="xl"
                  className="border border-slate-200 dark:border-slate-700 shadow-sm"
                />
                <span className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400" title="Active S/4 Record">
                  <Shield className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Profile Information & QR Badge */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                    {idStr}
                  </span>
                  <span className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border", statusColor)}>
                    {statusStr}
                  </span>
                  <button
                    onClick={() => toast.success(`Viewing QR Code & Barcode for ${idStr}`)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="View ID QR Code"
                  >
                    <QrCode className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                    <span>QR Code</span>
                  </button>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {name}
                </h2>

                <p className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-3 font-medium">
                  <span>Role/Program: <strong className="text-emerald-700 dark:text-emerald-400">{roleOrGrade}</strong></span>
                  <span>•</span>
                  <span>Contact: <strong className="font-mono text-slate-800 dark:text-slate-200">{emailOrPhone}</strong></span>
                  <span>•</span>
                  <span>Guardian/Super: <strong className="text-slate-800 dark:text-slate-200">{guardianOrSupervisor}</strong></span>
                </p>

                {/* Quick Status Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  {statsBarOverride ? statsBarOverride : (
                    <>
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold shadow-2xs">
                        Balance: <strong className={isRed ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>{record.balance || '$0.00 (Cleared)'}</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold shadow-2xs">
                        Attendance: <strong className="text-sky-600 dark:text-sky-400">{record.attendanceRate || '96.4%'}</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-semibold shadow-2xs">
                        GPA: <strong className="text-amber-600 dark:text-amber-400">{record.gpa || '3.84 A-'}</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 shadow-2xs">
                        Behavior: <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> <strong className="text-emerald-600 dark:text-emerald-400">Excellent</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Smart Quick Actions Bar */}
          <div className="px-4 sm:px-6 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-1 font-mono">
              Quick Actions:
            </span>
            {defaultActions.map((act) => (
              <button
                key={act.id}
                onClick={() => act.onClick(record)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs",
                  act.variant === 'primary'
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : act.variant === 'danger'
                      ? "bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                )}
              >
                {act.icon}
                <span>{act.label}</span>
              </button>
            ))}
          </div>

          {/* Navigation Tabs Bar */}
          <div className="px-4 sm:px-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
            <div className="flex items-center gap-1 min-w-max">
              {tabsList.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer",
                    activeTab === tab.id
                      ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area (Tabs + Right Sidebar Intelligence) */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            {/* Left / Center Panel: Tab Content */}
            <div className="lg:col-span-2 p-5 sm:p-6 space-y-6">
              {customTabsContent[activeTab] ? (
                customTabsContent[activeTab]
              ) : activeTab === 'overview' ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
                      Institutional Record Summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 space-y-1 shadow-2xs">
                        <span className="text-slate-500 dark:text-slate-400 font-mono">Full Record Name</span>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{name}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 space-y-1 shadow-2xs">
                        <span className="text-slate-500 dark:text-slate-400 font-mono">Primary ID Code</span>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">{idStr}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 space-y-1 shadow-2xs">
                        <span className="text-slate-500 dark:text-slate-400 font-mono">Assigned Program / Section</span>
                        <p className="font-bold text-slate-900 dark:text-white">{roleOrGrade}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 space-y-1 shadow-2xs">
                        <span className="text-slate-500 dark:text-slate-400 font-mono">Status & Clearance</span>
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Verified & Cleared</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
                      Contact & Emergency Directory
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Primary Contact / Email</span>
                        <strong className="text-slate-900 dark:text-slate-100 font-mono">{emailOrPhone}</strong>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Linked Parent / Supervisor</span>
                        <strong className="text-emerald-600 dark:text-emerald-300">{guardianOrSupervisor}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'notes' ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-2">
                    Confidential Administrative Notes
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add an internal note or clearance remark..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
                    />
                    <button
                      onClick={() => {
                        if (!noteText.trim()) return;
                        setSavedNotes([noteText, ...savedNotes]);
                        setNoteText('');
                        toast.success('Note added to record timeline.');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm"
                    >
                      Add Note
                    </button>
                  </div>
                  <div className="space-y-2.5 pt-2">
                    {savedNotes.map((note, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start justify-between gap-3 shadow-2xs">
                        <span>{note}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono shrink-0">By Admin</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeTab === 'academic' ? (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-2">
                    Academics Profile Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block font-bold mb-1">Class / Section</span>
                      <strong className="text-slate-955 dark:text-slate-100">{record.sections?.[0]?.sectionName || record.grade || 'Not Assigned'}</strong>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block font-bold mb-1">Enrollment Date</span>
                      <strong className="text-slate-955 dark:text-slate-100">{record.admissionDate ? new Date(record.admissionDate).toLocaleDateString() : 'N/A'}</strong>
                    </div>
                  </div>
                  <div className="pt-4 text-center">
                    <Link
                      href={`/students/${record.documentId || record.id}?tab=academic`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Full Academic Dossier</span>
                    </Link>
                  </div>
                </div>
              ) : activeTab === 'finance' ? (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-2">
                    Finance ERP Profile Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block font-bold mb-1">Wallet Balance</span>
                      <strong className="text-emerald-500 text-sm font-black">+${Number(record.advanceBalance || 0).toFixed(2)}</strong>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block font-bold mb-1">Outstanding Balance</span>
                      <strong className="text-rose-500 text-sm font-black">${Number(record.outstandingBalance || record.remainingBalance || 0).toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="pt-4 text-center">
                    <Link
                      href={`/students/${record.documentId || record.id}?tab=finance`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Full Billing & Wallet Ledger</span>
                    </Link>
                  </div>
                </div>
              ) : activeTab === 'attendance' ? (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-2">
                    Attendance Log Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block font-bold mb-1">Average Attendance</span>
                      <strong className="text-emerald-500 font-black">98.2%</strong>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block font-bold mb-1">Gate Logs Today</span>
                      <strong className="text-slate-955 dark:text-slate-100 font-bold">Present (07:42 AM)</strong>
                    </div>
                  </div>
                  <div className="pt-4 text-center">
                    <Link
                      href={`/students/${record.documentId || record.id}?tab=attendance`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Full Attendance Tracker</span>
                    </Link>
                  </div>
                </div>
              ) : activeTab === 'quran' ? (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-2">
                    Quran Tahfidz Memorization Progress
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block font-bold mb-0.5">Juz</span>
                      <strong className="text-slate-955 dark:text-slate-100 font-bold">15</strong>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block font-bold mb-0.5">Surah</span>
                      <strong className="text-slate-955 dark:text-slate-100 font-bold">Al-Israa</strong>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block font-bold mb-0.5">Muraja'ah</span>
                      <strong className="text-slate-955 dark:text-slate-100 font-bold">Al-Kahf</strong>
                    </div>
                  </div>
                  <div className="pt-4 text-center">
                    <Link
                      href={`/students/${record.documentId || record.id}?tab=quran`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Quran Memorization console</span>
                    </Link>
                  </div>
                </div>
              ) : activeTab === 'hostel' ? (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono border-b border-slate-200 dark:border-slate-800 pb-2">
                    Hostel Allocation Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block font-bold mb-1">Building</span>
                      <strong className="text-slate-955 dark:text-slate-100 font-bold">Al-Bukhari Hall</strong>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 block font-bold mb-1">Room</span>
                      <strong className="text-slate-955 dark:text-slate-100 font-bold">Room 205 (Floor 2)</strong>
                    </div>
                  </div>
                  <div className="pt-4 text-center">
                    <Link
                      href={`/students/${record.documentId || record.id}?tab=hostel`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Hostel Assignments</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2 animate-in fade-in">
                  <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase font-mono">{activeTab} Summary</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                    To view comprehensive transaction files, permission states, behavior reports, and logs, open the student's 360° dossier.
                  </p>
                  <div className="pt-2">
                    <Link
                      href={`/students/${record.documentId || record.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Student 360° Dossier</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar Intelligence Feed (Refinement #10) */}
            {/* Right Sidebar Intelligence Feed (Refinement #10) */}
            {!hideIntelligence && (
              <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-900/30 border-t lg:border-t-0 border-slate-200 dark:border-slate-800 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      <span>Sidebar Intelligence</span>
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Live Sync</span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        <span>Recent Attendance</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Present (Today)</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-300 text-[11px] font-medium truncate">Logged in at Gate 1 Mosque Entrance (07:42 AM)</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        <span>Recent Financial Status</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Cleared</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-300 text-[11px] font-medium truncate">Term 1 Tuition Receipt #INV-8891 verified.</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        <span>Recent Academic / Task</span>
                        <span className="text-sky-600 dark:text-sky-400 font-bold">Surah Al-Mulk</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-300 text-[11px] font-medium truncate">Muraja'ah recitation scored 96% with Tajweed.</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 text-xs space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        <span>Audit Log Entry</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">Updated</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-300 text-[11px] font-medium truncate">Role permissions inspected by Super Admin.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 text-center">
                  <button
                    onClick={() => toast.info(`Full comprehensive dossier exported for ${idStr}`)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Export Full Dossier Report</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

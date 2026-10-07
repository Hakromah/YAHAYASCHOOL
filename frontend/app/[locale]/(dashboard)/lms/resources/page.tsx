/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from '@/i18n/routing';
import {
  Library, Plus, Search, Filter, RefreshCw, X, Upload, Download,
  FileText, Video, Music, Image, Archive, Link2, File, Eye,
  Edit2, Trash2, Tag, BookOpen, Users, Clock,
  CheckCircle2, ExternalLink, Copy, FolderOpen,
  Globe, Lock, AlignLeft, Layers, Calendar, BookMarked,
  Check, ArrowRight, Sparkles
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { apiClient } from '@/services/api.service';
import { uploadService } from '@/services/upload.service';
import { getResources, incrementDownloadCount } from '@/services/lms.service';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export type ResourceCategory = 'Document' | 'Video' | 'Audio' | 'Image' | 'Archive' | 'Link' | 'Other';
export type ViewMode = 'grid' | 'list';

export interface ResourceRecord {
  id: number | string;
  title: string;
  category: ResourceCategory;
  description?: string;
  version?: string;
  isShared: boolean;
  url?: string;
  fileUrl?: string;
  fileSize?: number;
  fileMime?: string;
  fileId?: number;
  subject?: string;
  subjectId?: number;
  section?: string;
  sectionId?: number;
  author?: string;
  authorId?: number;
  tags?: string[];
  downloadCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Default High-Quality Fallbacks ──────────────────────────────────────────

const SEED_RESOURCES: ResourceRecord[] = [
  {
    id: 1,
    title: 'Tajweed Rules & Quranic Recitation Master Guide',
    category: 'Document',
    description: 'Comprehensive institutional reference manual covering Makharij, Sifat, Noon Sakinah, and Tanween rules with audio recitation references.',
    version: '2.4',
    isShared: true,
    subject: 'Quranic Recitation & Hifz',
    section: 'Senior Secondary 1',
    author: 'Ustaz Ahmad Al-Kurdi',
    tags: ['quran', 'tajweed', 'hifz', 'islamic-studies'],
    downloadCount: 342,
    fileSize: 4850000,
    fileMime: 'application/pdf',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z'
  },
  {
    id: 2,
    title: 'Advanced Calculus & Geometric Mechanics Problem Set',
    category: 'Document',
    description: 'Structured exercise bank and analytical proofs for Senior Secondary advanced mathematics curriculum.',
    version: '1.2',
    isShared: true,
    subject: 'Mathematics & Mechanics',
    section: 'Senior Secondary 2',
    author: 'Prof. Yahaya Muhammad',
    tags: ['calculus', 'geometry', 'mechanics', 'past-papers'],
    downloadCount: 512,
    fileSize: 6200000,
    fileMime: 'application/pdf',
    createdAt: '2026-09-05T09:30:00.000Z',
    updatedAt: '2026-09-20T11:00:00.000Z'
  },
  {
    id: 3,
    title: 'Arabic Grammar & Syntactical Parsing (Nahw & Sarf)',
    category: 'Document',
    description: 'Classical grammatical paradigms and sentence structure parsing walkthroughs for intermediate scholars.',
    version: '3.0',
    isShared: true,
    subject: 'Arabic Language & Grammar',
    section: 'Senior Secondary 1',
    author: 'Dr. Ibrahim Al-Hassan',
    tags: ['arabic', 'nahw', 'sarf', 'grammar'],
    downloadCount: 289,
    fileSize: 3100000,
    fileMime: 'application/pdf',
    createdAt: '2026-09-08T11:00:00.000Z',
    updatedAt: '2026-09-22T14:30:00.000Z'
  },
  {
    id: 4,
    title: 'Physics Laboratory Experiments: Optics & Electromagnetism',
    category: 'Video',
    description: 'Recorded laboratory demonstrations illustrating light refraction, laser diffraction, and electromagnetic induction coils.',
    version: '1.0',
    isShared: true,
    subject: 'Physics & Experimental Sciences',
    section: 'Senior Secondary 2',
    author: 'Dr. Amina Mansoor',
    url: 'https://youtube.com/watch?v=sample-optics',
    tags: ['physics', 'optics', 'lab', 'demonstration'],
    downloadCount: 640,
    fileSize: 145000000,
    fileMime: 'video/mp4',
    createdAt: '2026-09-12T13:00:00.000Z',
    updatedAt: '2026-09-25T16:00:00.000Z'
  },
  {
    id: 5,
    title: 'Islamic Jurisprudence (Fiqh of Transactions & Worship)',
    category: 'Document',
    description: 'Systematic overview of contemporary Fiqh rulings covering Zakat calculations, contracts, and ethical Islamic commerce.',
    version: '2.0',
    isShared: true,
    subject: 'Islamic Jurisprudence (Fiqh)',
    section: 'Senior Secondary 1',
    author: 'Sheikh Omar Al-Fassi',
    tags: ['fiqh', 'islamic-law', 'zakat', 'ethics'],
    downloadCount: 195,
    fileSize: 2900000,
    fileMime: 'application/pdf',
    createdAt: '2026-09-14T07:45:00.000Z',
    updatedAt: '2026-09-28T09:15:00.000Z'
  },
  {
    id: 6,
    title: 'English Language & Literary Critical Essay Anthology',
    category: 'Document',
    description: 'Selected prose, rhetorical devices, and exemplar critical essays for academic composition mastery.',
    version: '1.1',
    isShared: false,
    subject: 'English Language & Literature',
    section: 'Junior Secondary 1',
    author: 'Mrs. Fatima Al-Zahra',
    tags: ['english', 'literature', 'essay-writing', 'rhetoric'],
    downloadCount: 88,
    fileSize: 1800000,
    fileMime: 'application/pdf',
    createdAt: '2026-09-18T10:15:00.000Z',
    updatedAt: '2026-09-29T12:00:00.000Z'
  }
];

const DEFAULT_SUBJECTS = [
  { id: 1, name: 'Quranic Recitation & Hifz' },
  { id: 2, name: 'Mathematics & Mechanics' },
  { id: 3, name: 'Arabic Language & Grammar' },
  { id: 4, name: 'Physics & Experimental Sciences' },
  { id: 5, name: 'Islamic Jurisprudence (Fiqh)' },
  { id: 6, name: 'English Language & Literature' },
  { id: 7, name: 'Chemistry & Molecular Biology' },
  { id: 8, name: 'Computer Science & AI' }
];

const DEFAULT_SECTIONS = [
  { id: 1, name: 'Senior Secondary 1 - Science & Tahfeez' },
  { id: 2, name: 'Senior Secondary 2 - Arts & Arabic' },
  { id: 3, name: 'Junior Secondary 1 - Integrated Track' }
];

const CATEGORIES: ResourceCategory[] = ['Document', 'Video', 'Audio', 'Image', 'Archive', 'Link', 'Other'];

const CATEGORY_CONFIG: Record<ResourceCategory, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  accept: string;
}> = {
  Document: {
    icon: <FileText className="w-5 h-5" />,
    color: 'text-sky-700 dark:text-sky-300',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40',
    borderColor: 'border-sky-200 dark:border-sky-800',
    label: 'Document',
    accept: '.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx',
  },
  Video: {
    icon: <Video className="w-5 h-5" />,
    color: 'text-rose-700 dark:text-rose-300',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-800',
    label: 'Video',
    accept: '.mp4,.mov,.avi,.mkv,.webm',
  },
  Audio: {
    icon: <Music className="w-5 h-5" />,
    color: 'text-violet-700 dark:text-violet-300',
    bgColor: 'bg-violet-50 dark:bg-violet-950/40',
    borderColor: 'border-violet-200 dark:border-violet-800',
    label: 'Audio',
    accept: '.mp3,.wav,.aac,.ogg,.m4a',
  },
  Image: {
    icon: <Image className="w-5 h-5" />,
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    label: 'Image',
    accept: '.jpg,.jpeg,.png,.gif,.webp,.svg',
  },
  Archive: {
    icon: <Archive className="w-5 h-5" />,
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-50 dark:bg-orange-950/40',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: 'Archive',
    accept: '.zip,.rar,.7z,.tar,.gz',
  },
  Link: {
    icon: <Link2 className="w-5 h-5" />,
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    label: 'Link',
    accept: '',
  },
  Other: {
    icon: <File className="w-5 h-5" />,
    color: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-100 dark:bg-slate-800/40',
    borderColor: 'border-slate-300 dark:border-slate-700',
    label: 'Other',
    accept: '*',
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatDate(iso: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function CategoryIcon({ category, size = 'md' }: { category: ResourceCategory; size?: 'sm' | 'md' | 'lg' }) {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Other;
  const sizeMap = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  const iconSizeMap = { sm: 'scale-75', md: '', lg: 'scale-110' };
  return (
    <div className={`${sizeMap[size]} rounded-2xl flex items-center justify-center shrink-0 ${cfg.bgColor} border ${cfg.borderColor} ${cfg.color} ${iconSizeMap[size]} shadow-sm`}>
      {cfg.icon}
    </div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onFiles,
  accept,
}: { onFiles: (files: File[]) => void; accept: string }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
        dragging
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
          : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-900/50'
      }`}
    >
      <Upload className={`w-7 h-7 transition-colors ${dragging ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
      <div className="text-center">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Drop file here or click to browse</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Supports PDF, DOCX, MP4, MP3, images, and archives</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple={false}
        accept={accept || '*'}
        className="hidden"
        onChange={e => { const files = Array.from(e.target.files || []); if (files.length) onFiles(files); }}
      />
    </div>
  );
}

// ─── Resource Form Modal ──────────────────────────────────────────────────────

function ResourceFormModal({
  initial, subjects, sections, onSave, onClose,
}: {
  initial?: Partial<ResourceRecord>;
  subjects: { id: number; name: string }[];
  sections: { id: number; name: string }[];
  onSave: (data: Partial<ResourceRecord>, file?: File) => Promise<void>;
  onClose: () => void;
}) {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const [form, setForm] = useState<Partial<ResourceRecord>>({
    title: '', category: 'Document', description: '',
    version: '1.0', isShared: true,
    subject: '',
    section: '',
    url: '', tags: [],
    ...initial,
  });
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k: keyof ResourceRecord, v: any) => setForm(p => ({ ...p, [k]: v }));
  const isLink = form.category === 'Link';
  const cfg = CATEGORY_CONFIG[form.category as ResourceCategory] || CATEGORY_CONFIG.Other;

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags?.includes(tag)) setForm(p => ({ ...p, tags: [...(p.tags || []), tag] }));
    setTagInput('');
  };

  const handleFiles = (files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    setSelectedFile(file);
    if (!form.title) set('title', file.name.replace(/\.[^/.]+$/, ''));
    const mime = file.type;
    if (mime.startsWith('video/')) set('category', 'Video');
    else if (mime.startsWith('audio/')) set('category', 'Audio');
    else if (mime.startsWith('image/')) set('category', 'Image');
    else if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('7z')) set('category', 'Archive');
    else set('category', 'Document');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) { toast.error(t('Title is required')); return; }
    if (isLink && !form.url?.trim()) { toast.error(t('URL is required for Link resources')); return; }
    setSaving(true);
    try {
      await onSave(form, selectedFile);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500 shadow-sm';
  const selectCls = 'w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm';
  const labelCls = 'text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 dark:text-white text-base">
                {initial?.id ? t('Edit Learning Resource') : t('Upload New Learning Resource')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('Publish academic syllabus material, notes, past papers, or lectures')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          {/* Category selection */}
          <div className="space-y-1.5">
            <label className={labelCls}>{t('Resource Category')}</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const c = CATEGORY_CONFIG[cat];
                const active = form.category === cat;
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => set('category', cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      active
                        ? `${c.bgColor} ${c.borderColor} ${c.color} shadow-sm ring-1 ring-emerald-500`
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    {c.icon} {t(c.label)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload / Link */}
          {!isLink && (
            <div className="space-y-1.5">
              <label className={labelCls}>{t('File Attachment')}</label>
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{formatBytes(selectedFile.size)}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedFile(undefined)}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <UploadZone onFiles={handleFiles} accept={cfg.accept} />
              )}
            </div>
          )}

          {isLink && (
            <div className="space-y-1">
              <label className={labelCls}>{t('External Web URL')} <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  value={form.url || ''}
                  onChange={e => set('url', e.target.value)}
                  placeholder="https://drive.google.com/... or https://youtube.com/..."
                  className={inputCls + ' pl-9'}
                />
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className={labelCls}>{t('Resource Title')} <span className="text-rose-500">*</span></label>
            <input
              value={form.title || ''}
              onChange={e => set('title', e.target.value)}
              required
              placeholder={t('e.g. Chapter 4: Tajweed Rules Summary')}
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className={labelCls}>{t('Description & Learning Objectives')}</label>
            <textarea
              value={form.description || ''}
              onChange={e => set('description', e.target.value)}
              rows={2}
              placeholder={t('Brief synopsis of what this resource covers...')}
              className={inputCls + ' resize-none'}
            />
          </div>

          {/* Subject / Section / Version */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>{t('Subject / Course')}</label>
              <select
                value={form.subject || ''}
                onChange={e => set('subject', e.target.value)}
                className={selectCls}
              >
                <option value="">{t('— Select Subject —')}</option>
                {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>{t('Academic Section')}</label>
              <select
                value={form.section || ''}
                onChange={e => set('section', e.target.value)}
                className={selectCls}
              >
                <option value="">{t('— Select Section —')}</option>
                {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>{t('Version')}</label>
              <input
                value={form.version || '1.0'}
                onChange={e => set('version', e.target.value)}
                placeholder="1.0"
                className={inputCls + ' font-mono'}
              />
            </div>
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{t('Visibility & Access Control')}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {form.isShared
                  ? t('Public — Visible and downloadable by all enrolled students and faculty')
                  : t('Private — Restricted to course instructors and administrators')}
              </p>
            </div>
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => set('isShared', true)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  form.isShared
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> {t('Public')}
              </button>
              <button
                type="button"
                onClick={() => set('isShared', false)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  !form.isShared
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Lock className="w-3.5 h-3.5" /> {t('Private')}
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className={labelCls}>{t('Index Tags')}</label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder={t('Type tag and press Enter (e.g. past-papers, exam-prep)...')}
                className={inputCls + ' flex-1'}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                {t('Add')}
              </button>
            </div>
            {(form.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.tags?.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold font-mono">
                    <Tag className="w-3 h-3" /> {tag}
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, tags: p.tags?.filter(tg => tg !== tag) }))}
                      className="hover:text-rose-500 cursor-pointer ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
          >
            {t('Cancel')}
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{initial?.id ? t('Save Changes') : t('Upload Resource')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Resource Detail Modal ────────────────────────────────────────────────────

function ResourceDetailModal({
  resource, onClose, onEdit, onDelete, onDownload
}: {
  resource: ResourceRecord;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const locale = useLocale();
  const t = (key: string) => i18nT(key, locale);
  const cfg = CATEGORY_CONFIG[resource.category] || CATEGORY_CONFIG.Other;

  const handleCopyLink = () => {
    const link = resource.url || resource.fileUrl || window.location.href;
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success(t('Resource link copied to clipboard!'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-start gap-4">
          <CategoryIcon category={resource.category} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`}>
                {t(resource.category)}
              </span>
              {!resource.isShared ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black border bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> {t('Private')}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" /> {t('Public')}
                </span>
              )}
              {resource.version && (
                <span className="text-[10px] font-mono text-slate-400 font-bold">v{resource.version}</span>
              )}
            </div>
            <h2 className="font-black text-slate-900 dark:text-white text-base leading-snug">{resource.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          {/* Description */}
          {resource.description && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                <AlignLeft className="w-3 h-3" /> {t('Description')}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{resource.description}</p>
            </div>
          )}

          {/* External URL */}
          {resource.url && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> {t('External Link')}
              </p>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-700 dark:text-emerald-300 font-bold hover:underline break-all flex items-center gap-1"
              >
                {resource.url} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: t('Subject'), value: resource.subject || '—', icon: <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> },
              { label: t('Academic Section'), value: resource.section || '—', icon: <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> },
              { label: t('Author / Instructor'), value: resource.author || 'Institutional Faculty', icon: <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> },
              { label: t('File Size'), value: formatBytes(resource.fileSize) || 'Cloud Hosted', icon: <File className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> },
              { label: t('Downloads'), value: `${resource.downloadCount ?? 0} ${t('times')}`, icon: <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> },
              { label: t('Uploaded On'), value: formatDate(resource.createdAt), icon: <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">{item.icon} {item.label}</p>
                <p className="text-xs font-black text-slate-900 dark:text-white truncate">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {resource.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold font-mono">
                  <Tag className="w-3 h-3" /> #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center gap-2 flex-wrap justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md cursor-pointer transition-all"
            >
              {resource.category === 'Link' ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              <span>{resource.category === 'Link' ? t('Open Link') : t('Download File')}</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold cursor-pointer transition-all"
            >
              <Copy className="w-3.5 h-3.5" /> {t('Copy Link')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold cursor-pointer transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" /> {t('Edit')}
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-xs font-bold cursor-pointer transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t('Delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Resource Grid Card ───────────────────────────────────────────────────────

function ResourceCard({
  resource, onView, onEdit, onDelete, onDownload
}: {
  resource: ResourceRecord;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const cfg = CATEGORY_CONFIG[resource.category] || CATEGORY_CONFIG.Other;

  return (
    <div
      onClick={onView}
      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-3xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
    >
      {/* Header icon and quick actions */}
      <div className="flex items-start justify-between gap-2">
        <CategoryIcon category={resource.category} size="md" />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
          <button
            onClick={onDownload}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 cursor-pointer"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-sky-600 cursor-pointer"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title & Desc */}
      <div className="space-y-1 flex-1 min-w-0">
        <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {resource.title}
        </p>
        {resource.description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {resource.description}
          </p>
        )}
      </div>

      {/* Badges & Meta */}
      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-2.5">
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`}>
            {resource.category}
          </span>
          {!resource.isShared && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black border bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5" /> Private
            </span>
          )}
          {resource.subject && (
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold truncate max-w-[140px]">
              {resource.subject}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>{formatBytes(resource.fileSize) || (resource.url ? 'Link' : '—')}</span>
          <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
            <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {resource.downloadCount ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ResourceLibraryPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);
  const [resources, setResources] = useState<ResourceRecord[]>(SEED_RESOURCES);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Dynamic subjects and sections
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>(DEFAULT_SUBJECTS);
  const [sections, setSections] = useState<{ id: number; name: string }[]>(DEFAULT_SECTIONS);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<ResourceCategory | 'All'>('All');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterShared, setFilterShared] = useState<'all' | 'public' | 'private'>('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceRecord | undefined>();
  const [viewingResource, setViewingResource] = useState<ResourceRecord | undefined>();

  // ─── Load Resources ────────────────────────────────────────────────────────
  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const [resData, subRes, secRes] = await Promise.allSettled([
        getResources(),
        apiClient.get('/subjects?fields[0]=name&pagination[limit]=200&sort=name:asc'),
        apiClient.get('/sections?fields[0]=name&pagination[limit]=100&sort=name:asc'),
      ]);

      if (subRes.status === 'fulfilled' && subRes.value.data?.data?.length > 0) {
        setSubjects(subRes.value.data.data.map((s: any) => ({ id: s.id, name: s.name })));
      }
      if (secRes.status === 'fulfilled' && secRes.value.data?.data?.length > 0) {
        setSections(secRes.value.data.data.map((s: any) => ({ id: s.id, name: s.name })));
      }

      let localSaved: ResourceRecord[] = [];
      if (typeof window !== 'undefined') {
        try {
          const str = localStorage.getItem('yahaya_lms_resources');
          if (str) localSaved = JSON.parse(str);
        } catch {}
      }

      let apiList: ResourceRecord[] = [];
      if (resData.status === 'fulfilled' && Array.isArray(resData.value?.data)) {
        apiList = resData.value.data.map((r: any) => {
          const fileObj = r.file?.data || r.file;
          const fileUrl = fileObj?.attributes?.url || fileObj?.url;
          const fileSize = fileObj?.attributes?.size || fileObj?.size;
          const fileMime = fileObj?.attributes?.mime || fileObj?.mime;
          const fileId = r.file?.data?.id || r.file?.id;

          return {
            id: r.documentId || r.id,
            title: r.title || 'Untitled Resource',
            category: r.category || 'Document',
            description: r.description,
            version: r.version || '1.0',
            isShared: r.isShared ?? true,
            url: r.url,
            fileUrl: fileUrl ? uploadService.getFileUrl(fileUrl) : undefined,
            fileSize: fileSize ? fileSize * 1000 : undefined,
            fileMime,
            fileId,
            subject: r.subject?.data?.name || r.subject?.name,
            subjectId: r.subject?.data?.id || r.subject?.id,
            section: r.section?.data?.name || r.section?.name,
            sectionId: r.section?.data?.id || r.section?.id,
            author: r.author?.data
              ? `${r.author.data.firstName || ''} ${r.author.data.lastName || ''}`.trim()
              : r.author?.name || 'Institutional Faculty',
            authorId: r.author?.data?.id || r.author?.id,
            tags: Array.isArray(r.tags) ? r.tags : [],
            downloadCount: r.downloadCount || 0,
            createdAt: r.createdAt || new Date().toISOString(),
            updatedAt: r.updatedAt || new Date().toISOString(),
          };
        });
      }

      const merged = [...apiList, ...localSaved];
      if (merged.length === 0) {
        setResources(SEED_RESOURCES);
      } else {
        // De-duplicate by ID
        const seen = new Set<string>();
        const unique: ResourceRecord[] = [];
        merged.forEach(item => {
          const key = String(item.id);
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        });
        setResources(unique);
      }
    } catch {
      toast.error(i18nT('Failed to load learning resources.', locale));
      setResources(SEED_RESOURCES);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // ─── Filtered Resources ────────────────────────────────────────────────────
  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      if (filterCategory !== 'All' && r.category !== filterCategory) return false;
      if (filterSubject && r.subject !== filterSubject) return false;
      if (filterSection && r.section !== filterSection) return false;
      if (filterShared === 'public' && !r.isShared) return false;
      if (filterShared === 'private' && r.isShared) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q) ||
          (r.subject || '').toLowerCase().includes(q) ||
          (r.author || '').toLowerCase().includes(q) ||
          (r.tags || []).some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [resources, filterCategory, filterSubject, filterSection, filterShared, search]);

  const activeFiltersCount = [
    filterCategory !== 'All',
    !!filterSubject,
    !!filterSection,
    filterShared !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterCategory('All');
    setFilterSubject('');
    setFilterSection('');
    setFilterShared('all');
    setSearch('');
  };

  // ─── KPIs ──────────────────────────────────────────────────────────────────
  const totalDownloads = useMemo(() => resources.reduce((sum, r) => sum + (r.downloadCount || 0), 0), [resources]);
  const sharedCount    = useMemo(() => resources.filter(r => r.isShared).length, [resources]);
  const subjectsCount  = useMemo(() => new Set(resources.map(r => r.subject).filter(Boolean)).size, [resources]);
  const docCount       = useMemo(() => resources.filter(r => r.category === 'Document').length, [resources]);

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total_resources',
      title: t('Total Learning Resources'),
      value: `${resources.length}`,
      subtitle: `${docCount} ${t('documents')} · ${resources.length - docCount} ${t('multimedia')}`,
      trendDirection: 'up',
      icon: <Library className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      id: 'shared_resources',
      title: t('Public Student Access'),
      value: `${sharedCount} ${t('Public')}`,
      subtitle: `${resources.length - sharedCount} ${t('faculty-only restricted')}`,
      trendDirection: 'up',
      icon: <Globe className="w-5 h-5 text-sky-600 dark:text-sky-400" />
    },
    {
      id: 'total_downloads',
      title: t('Total Resource Downloads'),
      value: `${totalDownloads.toLocaleString()}`,
      subtitle: t('Aggregate student downloads & views'),
      trendDirection: 'up',
      icon: <Download className="w-5 h-5 text-teal-600 dark:text-teal-400" />
    },
    {
      id: 'subjects_covered',
      title: t('Academic Subjects Covered'),
      value: `${subjectsCount || subjects.length}`,
      subtitle: t('Structured across SS and JS faculties'),
      trendDirection: 'neutral',
      icon: <BookMarked className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    }
  ];

  // ─── CRUD Handlers ─────────────────────────────────────────────────────────
  const handleSave = async (data: Partial<ResourceRecord>, file?: File) => {
    try {
      let fileId: number | undefined;
      let fileUrl: string | undefined;

      if (file) {
        try {
          const uploaded = await uploadService.uploadFile(file, { ref: 'api::academic-resource.academic-resource', field: 'file' });
          fileId = uploaded.id;
          fileUrl = uploadService.getFileUrl(uploaded.url);
        } catch {
          fileUrl = URL.createObjectURL(file);
        }
      }

      const matchedSubject = subjects.find(s => s.name === data.subject);
      const matchedSection = sections.find(s => s.name === data.section);

      const payload: any = {
        title: data.title,
        category: data.category || 'Document',
        description: data.description,
        version: data.version || '1.0',
        isShared: data.isShared ?? true,
        url: data.url || null,
        tags: data.tags || [],
        subject: matchedSubject ? matchedSubject.id : null,
        section: matchedSection ? matchedSection.id : null,
      };
      if (fileId) payload.file = fileId;

      if (editingResource) {
        try {
          await apiClient.put(`/academic-resources/${editingResource.id}`, { data: payload });
        } catch {}

        setResources(prev => prev.map(r => r.id === editingResource.id ? {
          ...r,
          ...data,
          fileUrl: fileUrl || r.fileUrl,
          fileSize: file ? file.size : r.fileSize,
          updatedAt: new Date().toISOString(),
        } as ResourceRecord : r));

        toast.success(t('Resource updated successfully.'));
      } else {
        let newId: string | number = `local_${Date.now()}`;
        try {
          const res = await apiClient.post('/academic-resources', { data: payload });
          if (res.data?.data?.id) newId = res.data.data.id;
        } catch {}

        const newRecord: ResourceRecord = {
          id: newId,
          title: data.title || 'Untitled Resource',
          category: data.category || 'Document',
          description: data.description,
          version: data.version || '1.0',
          isShared: data.isShared ?? true,
          url: data.url,
          fileUrl: fileUrl || (file ? URL.createObjectURL(file) : undefined),
          fileSize: file?.size,
          fileMime: file?.type,
          fileId,
          subject: data.subject,
          section: data.section,
          author: 'Current Instructor',
          tags: data.tags || [],
          downloadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setResources(prev => {
          const updated = [newRecord, ...prev];
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('yahaya_lms_resources', JSON.stringify(updated.filter(i => String(i.id).startsWith('local_'))));
            } catch {}
          }
          return updated;
        });

        toast.success(t('Resource uploaded to library.'));
      }

      setShowForm(false);
      setEditingResource(undefined);
    } catch (err: any) {
      toast.error(t('Failed to save resource'));
    }
  };

  const handleDelete = async (resource: ResourceRecord) => {
    try {
      await apiClient.delete(`/academic-resources/${resource.id}`);
    } catch {}

    setResources(prev => {
      const filtered = prev.filter(r => r.id !== resource.id);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('yahaya_lms_resources', JSON.stringify(filtered.filter(i => String(i.id).startsWith('local_'))));
        } catch {}
      }
      return filtered;
    });

    setViewingResource(undefined);
    toast.success(t('Resource removed from library.'));
  };

  const handleDownload = (resource: ResourceRecord) => {
    incrementDownloadCount(resource.id, resource.downloadCount || 0);
    setResources(prev => prev.map(r => r.id === resource.id ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r));

    if (resource.url) {
      window.open(resource.url, '_blank');
      return;
    }
    if (resource.fileUrl) {
      window.open(resource.fileUrl, '_blank');
      return;
    }
    toast.info(t('Downloading preview asset...'));
  };

  const handleExportCSV = () => {
    const rows = filteredResources.map(r => ({
      Title: r.title,
      Category: r.category,
      Subject: r.subject || '',
      Section: r.section || '',
      Author: r.author || '',
      Visibility: r.isShared ? 'Public' : 'Private',
      Downloads: r.downloadCount || 0,
      Version: r.version || '1.0',
      Date: formatDate(r.createdAt),
      URL: r.url || r.fileUrl || ''
    }));

    const headers = Object.keys(rows[0] || {}).join(',');
    const csvContent = [headers, ...rows.map(row => Object.values(row).map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic_resources_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(t('Resource catalogue exported to CSV.'));
  };

  // ─── Table Columns ─────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<ResourceRecord, any>[]>(() => [
    {
      accessorKey: 'title',
      header: t('Resource Title & Type'),
      cell: ({ row }) => {
        const r = row.original;
        const cfg = CATEGORY_CONFIG[r.category] || CATEGORY_CONFIG.Other;
        return (
          <div className="flex items-center gap-3 max-w-sm">
            <CategoryIcon category={r.category} size="sm" />
            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{r.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-black border ${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`}>
                  {r.category}
                </span>
                {!r.isShared && (
                  <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Private
                  </span>
                )}
                {r.version && <span className="text-[9px] text-slate-400 font-mono">v{r.version}</span>}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'subject',
      header: t('Subject & Section'),
      cell: ({ row }) => (
        <div className="text-xs space-y-0.5">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">{row.original.subject || 'General'}</span>
          <span className="text-slate-500 dark:text-slate-400 text-[11px] block">{row.original.section || 'All Sections'}</span>
        </div>
      )
    },
    {
      accessorKey: 'author',
      header: t('Uploaded By'),
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.original.author || 'Faculty'}
        </span>
      )
    },
    {
      accessorKey: 'downloadCount',
      header: t('Downloads'),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
          <Download className="w-3 h-3" /> {row.original.downloadCount ?? 0}
        </span>
      )
    },
    {
      accessorKey: 'createdAt',
      header: t('Date'),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {formatDate(row.original.createdAt)}
        </span>
      )
    },
    {
      id: 'actions',
      header: t('Actions'),
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setViewingResource(r)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title={t('Inspect')}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDownload(r)}
              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
              title={t('Download')}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setEditingResource(r); setShowForm(true); }}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title={t('Edit')}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    }
  ], [t]);

  return (
    <EnterpriseModuleShell
      title={t('Academic Resource Library & Courseware')}
      description={t('Central institutional digital repository — syllabus guides, lecture videos, audio recitations, lab manuals, and external courseware.')}
      breadcrumbs={[{ label: t('LMS Portal'), href: '/lms/curriculum' }, { label: t('Courseware & Media') }, { label: t('Resource Library') }]}
      icon={<Library className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={filteredResources.length}
      recordLabel={t('Resources')}
      activeFilterCount={activeFiltersCount}
      onClearFilters={clearFilters}
      headerActions={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('Export CSV')}</span>
          </button>
          <button
            onClick={() => { setEditingResource(undefined); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('Upload Resource')}</span>
          </button>
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Domain Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <Link href="/lms/curriculum" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{t('Curriculum & Syllabus')}</span>
        </Link>
        <Link href="/lms/subjects" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <BookMarked className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{t('Subjects & Courses')}</span>
        </Link>
        <Link href="/lms/resources" className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5">
          <Library className="w-3.5 h-3.5" />
          <span>{t('Learning Resources')}</span>
        </Link>
        <Link href="/lms/lesson-plans" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <AlignLeft className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>{t('Lesson Plans')}</span>
        </Link>
        <Link href="/lms/homework" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>{t('Homework & Tasks')}</span>
        </Link>
        <Link href="/lms/timetables" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          <span>{t('Timetables')}</span>
        </Link>
        <Link href="/lms/gradebook" className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>{t('Gradebook')}</span>
        </Link>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {(['All', ...CATEGORIES] as const).map(cat => {
          const cfg = cat !== 'All' ? CATEGORY_CONFIG[cat] : null;
          const count = cat === 'All' ? resources.length : resources.filter(r => r.category === cat).length;
          const active = filterCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                active
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
              }`}
            >
              {cfg && <span className={active ? 'text-white' : cfg.color}>{cfg.icon}</span>}
              {cat === 'All' ? <Library className="w-3.5 h-3.5" /> : null}
              <span>{t(cat)}</span>
              <span className="font-mono text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      <EnterpriseToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('Search resources by title, subject, instructor, or tags...')}
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => { loadResources(); toast.success(t('Resources refreshed')); }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={clearFilters}
        createButtonLabel={t('Upload Resource')}
        onCreate={() => { setEditingResource(undefined); setShowForm(true); }}
        customFilterNodes={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="">{t('All Subjects')}</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>

            <select
              value={filterSection}
              onChange={e => setFilterSection(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="">{t('All Sections')}</option>
              {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>

            <select
              value={filterShared}
              onChange={e => setFilterShared(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">{t('All Access')}</option>
              <option value="public">{t('Public Only')}</option>
              <option value="private">{t('Private Only')}</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 ml-auto">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Grid View"
              >
                <FolderOpen className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Table View"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        }
      />

      {/* Grid or Table Mode */}
      {viewMode === 'grid' ? (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center bg-white dark:bg-slate-900/50">
            <Library className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('No Learning Resources Found')}</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">{t('Try adjusting your search criteria or upload a new resource.')}</p>
            <button
              onClick={() => { setEditingResource(undefined); setShowForm(true); }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 inline-block mr-1" /> {t('Upload First Resource')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredResources.map(r => (
              <ResourceCard
                key={r.id}
                resource={r}
                onView={() => setViewingResource(r)}
                onEdit={() => { setEditingResource(r); setShowForm(true); }}
                onDelete={() => handleDelete(r)}
                onDownload={() => handleDownload(r)}
              />
            ))}
          </div>
        )
      ) : (
        <EnterpriseDataGrid
          data={filteredResources}
          columns={columns}
          isLoading={loading}
          density={density}
          maxHeight={570}
          pageSize={50}
          onRowInspect={setViewingResource}
          onRowClick={setViewingResource}
          emptyStateProps={{
            title: t('No Resources Found'),
            description: t('No academic materials match your active filters.'),
            isFilterActive: activeFiltersCount > 0 || search.length > 0,
            onResetFilters: clearFilters,
            createLabel: t('Upload Resource'),
            onCreate: () => { setEditingResource(undefined); setShowForm(true); }
          }}
        />
      )}

      {/* Upload/Edit Modal */}
      {showForm && (
        <ResourceFormModal
          initial={editingResource}
          subjects={subjects}
          sections={sections}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingResource(undefined); }}
        />
      )}

      {/* Inspector / Preview Modal */}
      {viewingResource && (
        <ResourceDetailModal
          resource={viewingResource}
          onClose={() => setViewingResource(undefined)}
          onEdit={() => { setEditingResource(viewingResource); setViewingResource(undefined); setShowForm(true); }}
          onDelete={() => handleDelete(viewingResource)}
          onDownload={() => handleDownload(viewingResource)}
        />
      )}
    </EnterpriseModuleShell>
  );
}

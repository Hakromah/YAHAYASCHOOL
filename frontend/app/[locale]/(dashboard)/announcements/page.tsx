'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { Link } from '@/i18n/routing';
import {
  Megaphone, Plus, Bell, Users, X, RefreshCw,
  AlertTriangle, Info, CheckCircle2, Clock, Calendar as CalendarIcon,
  Filter, Pin, ExternalLink, Send, Trash2, Eye, ShieldCheck,
  UserCheck, AlertCircle, Sparkles, Share2, Layers
} from 'lucide-react';
import { cmsService } from '@/services/cms.service';
import { notificationService } from '@/services/notification.service';
import type { AnnouncementEntity } from '@/types/cms.types';
import { NotificationPriorityEnum, NotificationChannelEnum } from '@/types/enums';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function isoToDisplay(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function priorityConfig(p: AnnouncementEntity['priority']) {
  switch (p) {
    case 'urgent':
      return {
        badge: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        banner: 'border-l-4 border-l-rose-500 bg-rose-50/70 dark:bg-rose-950/20',
        dot: 'bg-rose-500 animate-pulse',
        icon: <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />,
        label: 'URGENT',
      };
    case 'high':
      return {
        badge: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        banner: 'border-l-4 border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/10',
        dot: 'bg-amber-500',
        icon: <Bell className="w-4 h-4 text-amber-500 shrink-0" />,
        label: 'HIGH',
      };
    default:
      return {
        badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        banner: 'border-l-4 border-l-slate-300 dark:border-l-slate-600 bg-white dark:bg-slate-900',
        dot: 'bg-slate-400',
        icon: <Info className="w-4 h-4 text-slate-400 shrink-0" />,
        label: 'NORMAL',
      };
  }
}

function audienceConfig(a: AnnouncementEntity['targetAudience']) {
  const map: Record<string, { label: string; color: string }> = {
    all: { label: 'All Campus', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' },
    students: { label: 'Students', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' },
    parents: { label: 'Parents / Guardians', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
    teachers: { label: 'Faculty / Staff', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
    public: { label: 'Public Bulletin', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  };
  return map[a] || { label: a || 'All', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' };
}

function isExpired(a: AnnouncementEntity) {
  return !!a.expiryDate && a.expiryDate < todayISO();
}

/**
 * Check if a role is authorized to publish school announcements.
 * Rule: Only Administrators and Section/Department Heads can publish.
 */
function isAuthorizedToPublish(roleStr: string): boolean {
  const r = roleStr.toLowerCase().replace(/[\s_-]+/g, '');
  const authorized = [
    'superadministrator',
    'admin',
    'administrator',
    'director',
    'executivedirector',
    'dean',
    'registrar',
    'principal',
    'sectionhead',
    'departmenthead',
    'headteacher',
    'headmaster',
  ];
  return authorized.some(auth => r.includes(auth));
}

// ─── Modal: Create Announcement ───────────────────────────────────────────────

function CreateAnnouncementModal({
  onClose,
  onSaved,
  currentUserId,
  currentUserName,
  currentUserRole,
}: {
  onClose: () => void;
  onSaved: () => void;
  currentUserId?: number;
  currentUserName: string;
  currentUserRole: string;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<AnnouncementEntity['priority']>('normal');
  const [targetAudience, setTargetAudience] = useState<AnnouncementEntity['targetAudience']>('all');
  const [publishDate, setPublishDate] = useState(todayISO());
  const [expiryDate, setExpiryDate] = useState('');
  const [notifyAll, setNotifyAll] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the announcement record in Strapi
      const newAnnouncement = await cmsService.createAnnouncement({
        title,
        content,
        priority,
        targetAudience,
        publishDate: publishDate || undefined,
        expiryDate: expiryDate || undefined,
      });

      // 2. Auto-dispatch a system-wide / group Notification record so all stakeholders' notification bells light up immediately
      if (notifyAll) {
        try {
          await notificationService.sendNotification({
            title: `📢 Announcement: ${title}`,
            body: content,
            channel: NotificationChannelEnum.Dashboard,
            priority: (priority as NotificationPriorityEnum) || NotificationPriorityEnum.Normal,
            senderId: currentUserId,
            metadata: {
              group: targetAudience === 'all' ? 'All Campus' : targetAudience,
              isBroadcast: true,
              isAnnouncement: true,
              announcementId: newAnnouncement.id || newAnnouncement.documentId,
              senderName: currentUserName,
              senderRole: currentUserRole,
            },
            relatedEntity: 'Announcement',
            relatedEntityId: String(newAnnouncement.id || newAnnouncement.documentId || ''),
          });

          // Dispatch event so active browser windows immediately update their bells
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('notifications-update', { detail: { action: 'new' } }));
          }
        } catch (notifErr) {
          console.warn('Notification dispatch notice:', notifErr);
        }
      }

      toast.success('Announcement published and dispatched to all dashboards.');
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to publish announcement: ' + (err?.message || 'Server error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 px-6 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">Post Official Announcement</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Publish institutional bulletins across portal dashboards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Announcement Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. End of Term Parent-Teacher Conference Schedule"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Announcement Content *
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write the full announcement text, agenda, instructions, or policy updates..."
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-none focus:border-sky-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent / Critical</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-sky-500 transition-colors"
              >
                <option value="all">Platform-Wide (All)</option>
                <option value="students">Students Only</option>
                <option value="parents">Parents / Guardians</option>
                <option value="teachers">Faculty / Staff</option>
                <option value="public">Public Bulletin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Publish Date
              </label>
              <input
                type="date"
                value={publishDate}
                onChange={e => setPublishDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          {/* Sync Option */}
          <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/60 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="notifyAll"
              checked={notifyAll}
              onChange={e => setNotifyAll(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="notifyAll" className="text-xs text-sky-900 dark:text-sky-200 cursor-pointer leading-tight">
              <span className="font-bold block">Broadcast to Notification Bells</span>
              <span>Automatically trigger the notification bell badge for all matching user accounts in real time.</span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Publish Bulletin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Announcement Detail Inspector ─────────────────────────────────────

function AnnouncementDetailModal({
  announcement,
  onClose,
  onDelete,
  canDelete,
}: {
  announcement: AnnouncementEntity;
  onClose: () => void;
  onDelete: (a: AnnouncementEntity) => void;
  canDelete: boolean;
}) {
  const pc = priorityConfig(announcement.priority);
  const ac = audienceConfig(announcement.targetAudience);
  const expired = isExpired(announcement);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="space-y-2 flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-2 flex-wrap">
              {pc.icon}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${pc.badge}`}>
                {pc.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${ac.color}`}>
                <Users className="w-2.5 h-2.5 inline-block mr-1" />
                {ac.label}
              </span>
              {expired && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400 dark:bg-slate-800">
                  EXPIRED
                </span>
              )}
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">
              {announcement.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Published Date</p>
              <p className="font-black text-slate-900 dark:text-white mt-0.5">
                {isoToDisplay(announcement.publishDate || announcement.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Expiry Date</p>
              <p className="font-black text-slate-900 dark:text-white mt-0.5">
                {announcement.expiryDate ? isoToDisplay(announcement.expiryDate) : 'Open / Ongoing'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Bulletin Message</h4>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line">
              {announcement.content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div>
            {canDelete && (
              <button
                onClick={() => {
                  onDelete(announcement);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Announcement
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              Notifications Center
            </Link>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────

function AnnouncementCard({
  announcement,
  onInspect,
  onDelete,
  canDelete,
}: {
  announcement: AnnouncementEntity;
  onInspect: (a: AnnouncementEntity) => void;
  onDelete: (a: AnnouncementEntity) => void;
  canDelete: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const pc = priorityConfig(announcement.priority);
  const ac = audienceConfig(announcement.targetAudience);
  const expired = isExpired(announcement);

  return (
    <div className={cn('rounded-2xl border shadow-xs transition-all hover:shadow-md bg-white dark:bg-slate-900', expired ? 'opacity-65' : '', pc.banner)}>
      <div className="p-5 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {pc.icon}
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${pc.badge}`}>{pc.label}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${ac.color}`}>
              <Users className="w-2.5 h-2.5 inline-block mr-1" />{ac.label}
            </span>
            {expired && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400 dark:bg-slate-800">
                EXPIRED
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 shrink-0 whitespace-nowrap">
              {announcement.publishDate ? isoToDisplay(announcement.publishDate) : isoToDisplay(announcement.createdAt)}
            </span>
            {canDelete && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDelete(announcement);
                }}
                className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                title="Delete Announcement"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onInspect(announcement)}
          className="text-base font-black text-slate-900 dark:text-white leading-tight hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors"
        >
          {announcement.title}
        </h3>

        {/* Content */}
        <p className={cn('text-sm text-slate-600 dark:text-slate-300 leading-relaxed', !expanded && announcement.content.length > 180 ? 'line-clamp-3' : '')}>
          {announcement.content}
        </p>
        {announcement.content.length > 180 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
          >
            {expanded ? 'Show less ↑' : 'Read full bulletin ↓'}
          </button>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            {announcement.expiryDate && !expired && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3 text-amber-500" /> Expires {isoToDisplay(announcement.expiryDate)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onInspect(announcement)}
              className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Inspect Details <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);
  const { user, role } = useAuth();
  const { userRole } = usePermissions();
  const userRoleStr = String(userRole || role || '').toLowerCase();

  // Permission: only admin and section heads can publish
  const canPublish = isAuthorizedToPublish(userRoleStr);

  const currentUserId = (user as any)?.id as number | undefined;
  const currentUserName = (user as any)?.firstName
    ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim()
    : (user as any)?.username || 'Administrator';
  const currentUserRoleLabel = userRoleStr ? userRoleStr.replace('-', ' ') : 'Administrator';

  // ── State ───────────────────────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState<AnnouncementEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [showExpired, setShowExpired] = useState(false);
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inspectAnnouncement, setInspectAnnouncement] = useState<AnnouncementEntity | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cmsService.getAnnouncements(locale || 'en', 100);
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleDeleteAnnouncement = async (announcement: AnnouncementEntity) => {
    // In Strapi v5, document service requires documentId for permanent deletion
    const targetId = announcement.documentId || announcement.id;
    if (!targetId) return;

    if (!window.confirm(`Are you sure you want to permanently delete the announcement "${announcement.title}"?`)) {
      return;
    }

    setAnnouncements(prev => prev.filter(a => 
      (a.documentId ? a.documentId !== announcement.documentId : true) && 
      (a.id ? a.id !== announcement.id : true)
    ));
    if (inspectAnnouncement?.id === announcement.id || inspectAnnouncement?.documentId === announcement.documentId) {
      setInspectAnnouncement(null);
    }
    toast.success('Announcement removed.');

    try {
      await cmsService.deleteAnnouncement(targetId);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications-update', { detail: { action: 'refresh' } }));
      }
    } catch (err: any) {
      toast.error('Failed to delete on server: ' + (err?.message || 'Please try again.'));
      loadData();
    }
  };

  /**
   * Determine if current user can delete a specific announcement
   */
  const canUserDelete = (a: AnnouncementEntity): boolean => {
    if (canPublish) return true;
    return false;
  };

  // ── Filtering & Sorting ──────────────────────────────────────────────────────

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(a => {
      const q2 = query.toLowerCase();
      const matchQ = !query || a.title.toLowerCase().includes(q2) || a.content.toLowerCase().includes(q2);
      const matchP = priorityFilter === 'all' || a.priority === priorityFilter;
      const matchA = audienceFilter === 'all' || a.targetAudience === audienceFilter;
      const matchEx = showExpired || !isExpired(a);
      return matchQ && matchP && matchA && matchEx;
    });
  }, [announcements, query, priorityFilter, audienceFilter, showExpired]);

  const activeFiltersCount = [
    priorityFilter !== 'all',
    audienceFilter !== 'all',
    showExpired,
    query.trim().length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setPriorityFilter('all');
    setAudienceFilter('all');
    setShowExpired(false);
    setQuery('');
  };

  const urgentCount = announcements.filter(a => a.priority === 'urgent' && !isExpired(a)).length;
  const highCount = announcements.filter(a => a.priority === 'high' && !isExpired(a)).length;
  const activeCount = announcements.filter(a => !isExpired(a)).length;
  const expiredCount = announcements.filter(isExpired).length;

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total',
      title: 'Active Announcements',
      value: String(activeCount),
      subtitle: `${expiredCount} expired notices`,
      trendDirection: 'neutral',
      icon: <Megaphone className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      isActive: priorityFilter === 'all',
      onClick: () => setPriorityFilter('all'),
    },
    {
      id: 'urgent',
      title: 'Urgent Bulletins',
      value: String(urgentCount),
      subtitle: 'Immediate action required',
      trendDirection: urgentCount > 0 ? 'down' : 'up',
      icon: <AlertTriangle className={`w-5 h-5 ${urgentCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />,
      isActive: priorityFilter === 'urgent',
      onClick: () => setPriorityFilter(priorityFilter === 'urgent' ? 'all' : 'urgent'),
    },
    {
      id: 'high',
      title: 'High Priority',
      value: String(highCount),
      subtitle: 'Important institutional notices',
      trendDirection: 'neutral',
      icon: <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      isActive: priorityFilter === 'high',
      onClick: () => setPriorityFilter(priorityFilter === 'high' ? 'all' : 'high'),
    },
    {
      id: 'all_count',
      title: 'Total Records',
      value: String(announcements.length),
      subtitle: 'All archives including expired',
      trendDirection: 'neutral',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
  ];

  const sortedAnnouncements = useMemo(() => {
    const order: Record<string, number> = { urgent: 0, high: 1, normal: 2 };
    return [...filteredAnnouncements].sort((a, b) => {
      const pDiff = (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      const aDate = a.publishDate || a.createdAt || '';
      const bDate = b.publishDate || b.createdAt || '';
      return bDate.localeCompare(aDate);
    });
  }, [filteredAnnouncements]);

  return (
    <EnterpriseModuleShell
      title="Announcements & School Bulletins"
      description="Broadcast official notices, fee alerts, academic updates, and urgent bulletins across student, parent, and faculty portals."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Communication' }, { label: 'Announcements' }]}
      icon={<Megaphone className="w-8 h-8 text-sky-600 dark:text-sky-400" />}
      recordCount={filteredAnnouncements.length}
      recordLabel="Bulletins"
      activeFilterCount={activeFiltersCount}
      onClearFilters={clearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all"
          >
            <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Notification Center
          </Link>

          {canPublish && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-xs font-black shadow-lg shadow-sky-600/30 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Post Announcement
            </button>
          )}
        </div>
      }
    >
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Quick Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { href: '/announcements', label: 'Announcements', active: true },
          { href: '/notifications', label: 'Notifications Hub', active: false },
          { href: '/messages', label: 'Messages', active: false },
          { href: '/cms/events', label: 'CMS Events', active: false },
          { href: '/calendar', label: 'Calendar', active: false },
        ].map(({ href, label, active }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all',
              active
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Urgent Warning Banner */}
      {urgentCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse shrink-0" />
          <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
            {urgentCount} urgent bulletin{urgentCount > 1 ? 's' : ''} require immediate attention.
          </p>
          <button
            onClick={() => setPriorityFilter('urgent')}
            className="ml-auto px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-colors cursor-pointer"
          >
            View Urgent
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Priority</label>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Target Audience</label>
          <select
            value={audienceFilter}
            onChange={e => setAudienceFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Audiences</option>
            <option value="all">Platform Wide</option>
            <option value="students">Students</option>
            <option value="parents">Parents</option>
            <option value="teachers">Teachers</option>
            <option value="public">Public</option>
          </select>
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showExpired}
            onChange={e => setShowExpired(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500"
          />
          <span className="text-[11px] font-bold text-slate-500">Show expired</span>
        </label>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-100 transition-colors cursor-pointer"
          >
            Reset Filters ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Toolbar */}
      <EnterpriseToolbar
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search announcements by title or content..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Announcements refreshed.');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={clearFilters}
        createButtonLabel={canPublish ? '+ Post Announcement' : undefined}
        onCreate={canPublish ? () => setShowCreateModal(true) : undefined}
      />

      {/* Card List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : sortedAnnouncements.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <Megaphone className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No announcements found.</p>
          <p className="text-xs text-slate-400 mt-1">Announcements published by administration will appear here.</p>
          {activeFiltersCount > 0 ? (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          ) : canPublish ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition-colors cursor-pointer"
            >
              Post First Announcement
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAnnouncements.map(a => (
            <AnnouncementCard
              key={a.id || a.documentId}
              announcement={a}
              onInspect={setInspectAnnouncement}
              onDelete={handleDeleteAnnouncement}
              canDelete={canUserDelete(a)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAnnouncementModal
          onClose={() => setShowCreateModal(false)}
          onSaved={loadData}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserRole={currentUserRoleLabel}
        />
      )}

      {/* Inspect Modal */}
      {inspectAnnouncement && (
        <AnnouncementDetailModal
          announcement={inspectAnnouncement}
          onClose={() => setInspectAnnouncement(null)}
          onDelete={handleDeleteAnnouncement}
          canDelete={canUserDelete(inspectAnnouncement)}
        />
      )}
    </EnterpriseModuleShell>
  );
}

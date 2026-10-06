'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import {
  Bell, Check, CheckCheck, Trash2, Eye, ExternalLink, MessageSquare,
  Send, BookOpen, DollarSign, AlertTriangle, AlertCircle, ShieldAlert,
  Clock, Calendar, Users, Paperclip, Download, ArrowUpRight, CheckCircle2,
  Info, X, Layers, Sparkles, Filter, RefreshCw, Plus, Search, Megaphone,
  Radio, ChevronRight, CornerUpRight
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { t as i18nT } from '@/lib/i18n-dict';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { notificationService } from '@/services/notification.service';
import { apiClient } from '@/services/api.service';
import type { Notification } from '@/types/notification.types';
import { NotificationStatusEnum, NotificationPriorityEnum, NotificationChannelEnum } from '@/types/enums';
import { EnterpriseModuleShell } from '@/components/erp/EnterpriseModuleShell';
import { EnterpriseKPIDeck, type EnterpriseKPICard } from '@/components/erp/EnterpriseKPIDeck';
import { EnterpriseToolbar, type TableDensity } from '@/components/erp/EnterpriseToolbar';
import { EnterpriseDataGrid, type ColumnDef } from '@/components/erp/EnterpriseDataGrid';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface StrapiAttachment {
  id: number | string;
  name: string;
  url: string;
  mime?: string;
  size?: number;
}

interface ParsedNotification {
  id: number;
  documentId?: string;
  title: string;
  body: string;
  channel: string;
  priority: string;
  recordStatus: string;
  isRead: boolean;
  category: 'academic' | 'finance' | 'urgent' | 'broadcast' | 'system' | 'general';
  sentAt: string;
  readAt?: string;
  senderId?: number;
  senderName: string;
  senderRole: string;
  senderInitials: string;
  recipientId?: number;
  recipientName?: string;
  recipientGroup?: string;
  isBroadcast: boolean;
  relatedEntity?: string;
  relatedEntityId?: string;
  attachments: StrapiAttachment[];
  raw: Notification;
}

interface ContactUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  roleLabel: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  if (!name) return 'YS';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatFullDateTime(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function detectCategory(title: string, body: string, relatedEntity?: string, isBroadcast?: boolean): ParsedNotification['category'] {
  const t = (title || '').toLowerCase();
  const b = (body || '').toLowerCase();
  const r = (relatedEntity || '').toLowerCase();

  if (
    t.includes('exam') || t.includes('homework') || t.includes('result') ||
    t.includes('grade') || t.includes('attendance') || t.includes('curriculum') ||
    t.includes('tajweed') || t.includes('hifz') || r.includes('course') || r.includes('homework')
  ) {
    return 'academic';
  }

  if (
    t.includes('fee') || t.includes('invoice') || t.includes('payment') ||
    t.includes('billing') || t.includes('tuition') || t.includes('receipt') ||
    t.includes('statement') || r.includes('invoice') || r.includes('payment')
  ) {
    return 'finance';
  }

  if (t.includes('urgent') || t.includes('emergency') || t.includes('warning') || t.includes('alert') || t.includes('suspension')) {
    return 'urgent';
  }

  if (isBroadcast || t.includes('broadcast') || t.includes('announcement') || t.includes('assembly')) {
    return 'broadcast';
  }

  if (t.includes('system') || t.includes('backup') || t.includes('security') || t.includes('maintenance')) {
    return 'system';
  }

  return 'general';
}

function priorityBadgeConfig(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return {
        badge: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700',
        dot: 'bg-rose-500 animate-pulse',
        label: 'URGENT',
      };
    case 'high':
      return {
        badge: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
        dot: 'bg-amber-500',
        label: 'HIGH',
      };
    case 'low':
      return {
        badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        dot: 'bg-slate-400',
        label: 'LOW',
      };
    default:
      return {
        badge: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-700',
        dot: 'bg-sky-500',
        label: 'NORMAL',
      };
  }
}

function categoryBadgeConfig(category: ParsedNotification['category']) {
  switch (category) {
    case 'academic':
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        icon: <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
        label: 'Academic',
      };
    case 'finance':
      return {
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
        icon: <DollarSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />,
        label: 'Finance',
      };
    case 'urgent':
      return {
        badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
        label: 'Security / Urgent',
      };
    case 'broadcast':
      return {
        badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
        icon: <Megaphone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />,
        label: 'Broadcast',
      };
    case 'system':
      return {
        badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />,
        label: 'System',
      };
    default:
      return {
        badge: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
        icon: <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />,
        label: 'General',
      };
  }
}

// ─── Modal: Notification Inspector ───────────────────────────────────────────

function NotificationDetailModal({
  notification,
  onClose,
  onMarkRead,
  onDelete,
}: {
  notification: ParsedNotification;
  onClose: () => void;
  onMarkRead: (n: ParsedNotification) => void;
  onDelete: (n: ParsedNotification) => void;
}) {
  const pCfg = priorityBadgeConfig(notification.priority);
  const cCfg = categoryBadgeConfig(notification.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="space-y-2 flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${pCfg.badge}`}>
                <span className={`w-2 h-2 rounded-full ${pCfg.dot}`} />
                {pCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cCfg.badge}`}>
                {cCfg.icon}
                {cCfg.label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                Via {notification.channel}
              </span>
              {notification.isRead ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400">
                  Read
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400">
                  Unread
                </span>
              )}
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">
              {notification.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Sender / Originator</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  {notification.senderInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">{notification.senderName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{notification.senderRole}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Target / Recipient</p>
              <p className="text-xs font-black text-slate-900 dark:text-white">
                {notification.recipientGroup ? (
                  <span className="text-sky-600 dark:text-sky-400 font-bold">{notification.recipientGroup}</span>
                ) : notification.recipientName ? (
                  notification.recipientName
                ) : notification.isBroadcast ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Campus-Wide Broadcast</span>
                ) : (
                  'All Scholars & Faculty'
                )}
              </p>
              <p className="text-[10px] text-slate-400">Dispatched {formatFullDateTime(notification.sentAt)}</p>
            </div>
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Notification Bulletin</h4>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line shadow-xs">
              {notification.body}
            </div>
          </div>

          {/* Attachments */}
          {notification.attachments && notification.attachments.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                Attached Assets & Documentation ({notification.attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notification.attachments.map((file, idx) => (
                  <a
                    key={file.id || idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          {file.name}
                        </p>
                        {file.size ? (
                          <p className="text-[10px] text-slate-400">{Math.round(file.size)} KB</p>
                        ) : null}
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Related Link info if any */}
          {notification.relatedEntity && (
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Linked to {notification.relatedEntity} {notification.relatedEntityId ? `#${notification.relatedEntityId}` : ''}
                </span>
              </div>
              <Link
                href={`/messages?id=${notification.id}`}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                Inspect Related Record →
              </Link>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(notification)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Alert
            </button>
            {!notification.isRead && (
              <button
                onClick={() => onMarkRead(notification)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Mark as Read
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/messages?id=${notification.id}`}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Open Thread in Messages Hub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Quick Dispatch Notification ──────────────────────────────────────

function DispatchNotificationModal({
  isOpen,
  onClose,
  onSuccess,
  contacts,
  currentUserId,
  currentUserName,
  currentUserRole,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contacts: ContactUser[];
  currentUserId?: number;
  currentUserName: string;
  currentUserRole: string;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<NotificationPriorityEnum>(NotificationPriorityEnum.Normal);
  const [channel, setChannel] = useState<NotificationChannelEnum>(NotificationChannelEnum.Dashboard);
  const [targetType, setTargetType] = useState<'broadcast' | 'group' | 'individual'>('broadcast');
  const [group, setGroup] = useState('All Scholars & Faculty');
  const [recipientId, setRecipientId] = useState<number | ''>('');
  const [contactSearch, setContactSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(c =>
    c.fullName.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.roleLabel.toLowerCase().includes(contactSearch.toLowerCase())
  ).slice(0, 15);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message content are required.');
      return;
    }
    if (targetType === 'individual' && !recipientId) {
      toast.error('Please select an individual recipient.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (targetType === 'individual' && recipientId) {
        await notificationService.sendNotification({
          title,
          body,
          channel,
          priority,
          recipientId: Number(recipientId),
          senderId: currentUserId,
          metadata: {
            senderName: currentUserName,
            senderRole: currentUserRole,
            senderId: currentUserId,
          },
        });
      } else {
        const postData: Record<string, any> = {
          title,
          body,
          channel,
          priority,
          recordStatus: 'sent',
          sentAt: new Date().toISOString(),
          metadata: {
            group: targetType === 'group' ? group : 'All Scholars & Faculty',
            isBroadcast: true,
            senderName: currentUserName,
            senderRole: currentUserRole,
            senderId: currentUserId,
          },
        };
        if (currentUserId && currentUserId > 0) postData.sender = currentUserId;
        await apiClient.post('/notifications', { data: postData });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications-update', { detail: { action: 'new' } }));
      }

      toast.success('Notification bulletin dispatched successfully.');
      onSuccess();
      onClose();
      setTitle('');
      setBody('');
    } catch (err: any) {
      toast.error('Failed to dispatch notification: ' + (err?.message || 'Server error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">Dispatch Notification Bulletin</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Broadcast official alerts to school stakeholders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {/* Target audience selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Audience Scope</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'broadcast', label: 'All Campus', icon: Megaphone },
                { id: 'group', label: 'Role Group', icon: Users },
                { id: 'individual', label: 'Individual', icon: UserCircle },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTargetType(id as any)}
                  className={cn(
                    'p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                    targetType === id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {targetType === 'group' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Group</label>
              <select
                value={group}
                onChange={e => setGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="All Scholars & Students">All Scholars & Students</option>
                <option value="All Parent Guardians">All Parent Guardians</option>
                <option value="Academic Faculty & Teachers">Academic Faculty & Teachers</option>
                <option value="Administrative Staff">Administrative Staff</option>
                <option value="Tahfeez & Hifz Department">Tahfeez & Hifz Department</option>
              </select>
            </div>
          )}

          {targetType === 'individual' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Search Recipient</label>
              <input
                type="text"
                placeholder="Search staff, student, or parent by name/email..."
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {filteredContacts.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setRecipientId(c.id)}
                    className={cn(
                      'w-full p-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer',
                      recipientId === c.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <span>{c.fullName} ({c.email})</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{c.roleLabel}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subject / Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. End of Term Examination Schedule Released"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
            />
          </div>

          {/* Body */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bulletin Content *</label>
            <textarea
              required
              rows={4}
              placeholder="Enter official message content..."
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Priority & Channel */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Priority Level</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent / Critical</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Delivery Channel</label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="dashboard">Portal Dashboard</option>
                <option value="email">Email Notification</option>
                <option value="sms">SMS Alert</option>
                <option value="whatsapp">WhatsApp Direct</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Dispatching...' : 'Dispatch Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const locale = useLocale();
  const t = useCallback((key: string) => i18nT(key, locale), [locale]);
  const { user, role } = useAuth();
  const { userRole } = usePermissions();
  const userRoleStr = String(userRole || role || '').toLowerCase();
  const canDispatch = !['student', 'parent'].includes(userRoleStr);

  const currentUserId = (user as any)?.id as number | undefined;
  const currentUserName = (user as any)?.firstName
    ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim()
    : (user as any)?.username || 'Staff Member';
  const currentUserRoleLabel = userRoleStr ? userRoleStr.replace('-', ' ') : 'Administrator';

  // ── State ───────────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<ParsedNotification[]>([]);
  const [contacts, setContacts] = useState<ContactUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'urgent' | 'academic' | 'finance' | 'broadcast' | 'sent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [density, setDensity] = useState<TableDensity>('cozy');

  // Modals
  const [selectedNotif, setSelectedNotif] = useState<ParsedNotification | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // ── Load Data ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [notifRes, usersRes] = await Promise.allSettled([
        apiClient.get('/notifications?populate[sender]=true&populate[recipient]=true&sort=createdAt:desc&pagination[pageSize]=200')
          .catch(() => ({ data: { data: [] } })),
        apiClient.get('/users?populate=role&pagination[pageSize]=200')
          .catch(() => ({ data: [] })),
      ]);

      // Contacts
      const rawU = (usersRes.status === 'fulfilled'
        ? (Array.isArray(usersRes.value?.data) ? usersRes.value.data : usersRes.value?.data?.data)
        : null) || [];
      const parsedContacts: ContactUser[] = rawU.map((u: any) => ({
        id: u.id,
        username: u.username || '',
        fullName: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || u.email || 'User',
        email: u.email || '',
        roleLabel: u.role?.name || u.role?.type || 'Member',
      }));
      setContacts(parsedContacts);

      // Notifications
      const rawList = (notifRes.status === 'fulfilled' ? notifRes.value?.data?.data : null) || [];
      const parsed: ParsedNotification[] = rawList.map((n: any) => {
        const s = n.sender || {};
        const sMeta = (n.metadata as any) || {};
        const sName = [s.firstName, s.lastName].filter(Boolean).join(' ') || s.username || s.email || sMeta.senderName || (sMeta.isBroadcast ? 'Campus Broadcast' : 'System');
        const sRole = s.role?.name || s.role?.type || sMeta.senderRole || 'Institutional Admin';
        const sId = s.id || sMeta.senderId || 0;

        const r = n.recipient || {};
        const rName = [r.firstName, r.lastName].filter(Boolean).join(' ') || r.username || undefined;

        let attachments: StrapiAttachment[] = [];
        if (Array.isArray(sMeta?.attachments)) {
          attachments = sMeta.attachments.map((a: any) => ({
            id: a.id,
            name: a.name || 'document',
            url: a.url || '',
            mime: a.mime,
            size: a.size,
          }));
        }

        const isRead = n.recordStatus === 'read' || n.status === 'read' || Boolean(n.readAt);
        const category = detectCategory(n.title || '', n.body || '', n.relatedEntity || '', Boolean(sMeta.isBroadcast));

        return {
          id: n.id,
          documentId: n.documentId,
          title: n.title || 'Untitled Notification',
          body: n.body || '',
          channel: n.channel || 'dashboard',
          priority: n.priority || 'normal',
          recordStatus: n.recordStatus || 'sent',
          isRead,
          category,
          sentAt: n.sentAt || n.createdAt || new Date().toISOString(),
          readAt: n.readAt,
          senderId: sId,
          senderName: sName,
          senderRole: sRole,
          senderInitials: getInitials(sName),
          recipientId: r.id,
          recipientName: rName,
          recipientGroup: sMeta.group,
          isBroadcast: Boolean(sMeta.isBroadcast || !r.id),
          relatedEntity: n.relatedEntity,
          relatedEntityId: n.relatedEntityId,
          attachments,
          raw: n,
        };
      });

      setNotifications(parsed);
    } catch (err: any) {
      toast.error('Failed to load notifications: ' + (err?.message || 'Server error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData(true);
    };

    window.addEventListener('notifications-update', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('notifications-update', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [loadData]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleMarkAsRead = async (notif: ParsedNotification) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true, recordStatus: 'read', readAt: new Date().toISOString() } : n));
    if (selectedNotif?.id === notif.id) {
      setSelectedNotif(prev => prev ? { ...prev, isRead: true, recordStatus: 'read' } : null);
    }
    window.dispatchEvent(new CustomEvent('notifications-update', { detail: { id: notif.id, action: 'read' } }));
    toast.success('Marked as read.');

    try {
      const target = notif.documentId || notif.id;
      await notificationService.markAsRead(target);
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, recordStatus: 'read', readAt: new Date().toISOString() })));
    window.dispatchEvent(new CustomEvent('notifications-update', { detail: { action: 'read-all' } }));
    toast.success('All notifications marked as read.');

    try {
      await notificationService.markAllAsRead(currentUserId);
    } catch {
      // silent
    }
  };

  const handleDelete = async (notif: ParsedNotification) => {
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    if (selectedNotif?.id === notif.id) setSelectedNotif(null);
    window.dispatchEvent(new CustomEvent('notifications-update', { detail: { id: notif.id, action: 'delete' } }));
    toast.success('Notification removed.');

    try {
      const target = notif.documentId || notif.id;
      await notificationService.deleteNotification(target);
    } catch {
      toast.error('Failed to delete on server.');
      loadData(true);
    }
  };

  // ── Filtering ────────────────────────────────────────────────────────────────

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Tab filter
      if (activeTab === 'unread' && n.isRead) return false;
      if (activeTab === 'urgent' && n.priority !== 'urgent' && n.priority !== 'high') return false;
      if (activeTab === 'academic' && n.category !== 'academic') return false;
      if (activeTab === 'finance' && n.category !== 'finance') return false;
      if (activeTab === 'broadcast' && !n.isBroadcast) return false;
      if (activeTab === 'sent' && n.senderId !== currentUserId) return false;

      // Priority filter
      if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false;

      // Channel filter
      if (channelFilter !== 'all' && n.channel !== channelFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = n.title.toLowerCase().includes(q);
        const inBody = n.body.toLowerCase().includes(q);
        const inSender = n.senderName.toLowerCase().includes(q);
        const inRecipient = (n.recipientName || n.recipientGroup || '').toLowerCase().includes(q);
        const inEntity = (n.relatedEntity || '').toLowerCase().includes(q);
        if (!inTitle && !inBody && !inSender && !inRecipient && !inEntity) return false;
      }

      return true;
    });
  }, [notifications, activeTab, priorityFilter, channelFilter, searchQuery, currentUserId]);

  const activeFiltersCount = [
    activeTab !== 'all',
    priorityFilter !== 'all',
    channelFilter !== 'all',
    searchQuery.trim().length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setActiveTab('all');
    setPriorityFilter('all');
    setChannelFilter('all');
    setSearchQuery('');
  };

  // ── KPI Metrics ─────────────────────────────────────────────────────────────

  const unreadTotal = notifications.filter(n => !n.isRead).length;
  const urgentTotal = notifications.filter(n => n.priority === 'urgent' || n.priority === 'high').length;
  const academicTotal = notifications.filter(n => n.category === 'academic').length;
  const financeTotal = notifications.filter(n => n.category === 'finance').length;

  const kpiCards: EnterpriseKPICard[] = [
    {
      id: 'total',
      title: 'Total Alerts & Bulletins',
      value: String(notifications.length),
      subtitle: `${unreadTotal} unread items in inbox`,
      trendDirection: 'neutral',
      icon: <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      isActive: activeTab === 'all',
      onClick: () => setActiveTab('all'),
    },
    {
      id: 'unread',
      title: 'Unread Notifications',
      value: String(unreadTotal),
      subtitle: 'Requiring review & action',
      trendDirection: unreadTotal > 0 ? 'down' : 'up',
      icon: <CheckCircle2 className={cn('w-5 h-5', unreadTotal > 0 ? 'text-amber-500 animate-pulse' : 'text-emerald-500')} />,
      isActive: activeTab === 'unread',
      onClick: () => setActiveTab('unread'),
    },
    {
      id: 'urgent',
      title: 'Urgent Bulletins',
      value: String(urgentTotal),
      subtitle: 'Critical security & deadlines',
      trendDirection: urgentTotal > 0 ? 'down' : 'neutral',
      icon: <AlertTriangle className={cn('w-5 h-5', urgentTotal > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400')} />,
      isActive: activeTab === 'urgent',
      onClick: () => setActiveTab('urgent'),
    },
    {
      id: 'academic_finance',
      title: 'Academic & Billing',
      value: `${academicTotal + financeTotal}`,
      subtitle: `${academicTotal} academic · ${financeTotal} finance`,
      trendDirection: 'neutral',
      icon: <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      isActive: activeTab === 'academic' || activeTab === 'finance',
      onClick: () => setActiveTab(activeTab === 'academic' ? 'finance' : 'academic'),
    },
  ];

  // ── Grid Columns ────────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<ParsedNotification, any>[]>(() => [
    {
      accessorKey: 'title',
      header: 'Notification Bulletin',
      cell: ({ row }) => {
        const notif = row.original;
        const pCfg = priorityBadgeConfig(notif.priority);
        const cCfg = categoryBadgeConfig(notif.category);

        return (
          <div className="space-y-1.5 max-w-md py-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {!notif.isRead && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Unread" />
              )}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${pCfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`} />
                {pCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cCfg.badge}`}>
                {cCfg.icon}
                {cCfg.label}
              </span>
              {notif.attachments.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <Paperclip className="w-2.5 h-2.5" />
                  {notif.attachments.length}
                </span>
              )}
            </div>
            <p className={cn('text-xs truncate', !notif.isRead ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300')}>
              {notif.title}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
              {notif.body}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'senderName',
      header: 'Originator / Sender',
      cell: ({ row }) => {
        const notif = row.original;
        return (
          <div className="flex items-center gap-2 max-w-[200px]">
            <div className="w-6 h-6 rounded-lg bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-700/50">
              {notif.senderInitials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{notif.senderName}</p>
              <p className="text-[10px] text-slate-400 capitalize truncate">{notif.senderRole}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'recipientGroup',
      header: 'Audience Scope',
      cell: ({ row }) => {
        const notif = row.original;
        if (notif.recipientGroup) {
          return <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{notif.recipientGroup}</span>;
        }
        if (notif.recipientName) {
          return <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{notif.recipientName}</span>;
        }
        return <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Campus-Wide Broadcast</span>;
      },
    },
    {
      accessorKey: 'channel',
      header: 'Channel',
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {row.original.channel}
        </span>
      ),
    },
    {
      accessorKey: 'sentAt',
      header: 'Timestamp',
      cell: ({ row }) => (
        <div className="space-y-0.5 text-right">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            {formatRelativeTime(row.original.sentAt)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block">
            {new Date(row.original.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const notif = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={e => {
                e.stopPropagation();
                setSelectedNotif(notif);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Inspect Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <Link
              href={`/messages?id=${notif.id}`}
              onClick={e => e.stopPropagation()}
              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition-colors"
              title="Open in Messages Hub"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </Link>
            {!notif.isRead && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleMarkAsRead(notif);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                title="Mark as Read"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={e => {
                e.stopPropagation();
                handleDelete(notif);
              }}
              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ], []);

  return (
    <EnterpriseModuleShell
      title="Institutional Notifications & Alert Center"
      description="Real-time dispatch audit, academic bulletins, fee notices, urgent warnings, and communication history."
      breadcrumbs={[{ label: 'School ERP' }, { label: 'Communication' }, { label: 'Notifications' }]}
      icon={<Bell className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
      recordCount={filteredNotifications.length}
      recordLabel="Alerts"
      activeFilterCount={activeFiltersCount}
      onClearFilters={clearFilters}
      headerActions={
        <div className="flex items-center gap-2">
          {unreadTotal > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Mark All Read
            </button>
          )}

          <Link
            href="/messages"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-all"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Messages Hub
          </Link>

          {canDispatch && (
            <button
              onClick={() => setIsDispatchModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Dispatch Bulletin
            </button>
          )}
        </div>
      }
    >
      {/* KPI Deck */}
      <EnterpriseKPIDeck cards={kpiCards} />

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'all', label: 'All Notifications', icon: Bell, count: notifications.length },
          { id: 'unread', label: 'Unread Only', icon: CheckCircle2, count: unreadTotal },
          { id: 'urgent', label: 'Urgent & Critical', icon: AlertTriangle, count: urgentTotal },
          { id: 'academic', label: 'Academic Alerts', icon: BookOpen, count: academicTotal },
          { id: 'finance', label: 'Finance & Fees', icon: DollarSign, count: financeTotal },
          { id: 'broadcast', label: 'Broadcasts', icon: Megaphone, count: notifications.filter(n => n.isBroadcast).length },
          { id: 'sent', label: 'Sent by Me', icon: Send, count: notifications.filter(n => n.senderId === currentUserId).length },
        ].map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer',
              activeTab === id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            {count > 0 && (
              <span className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                activeTab === id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Priority</label>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Channel</label>
          <select
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Channels</option>
            <option value="dashboard">Portal Dashboard</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search notifications by title, content, sender, or audience..."
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => {
          loadData();
          toast.success('Notifications synchronized.');
        }}
        activeFilterCount={activeFiltersCount}
        onResetFilters={clearFilters}
        createButtonLabel={canDispatch ? '+ Dispatch Bulletin' : undefined}
        onCreate={canDispatch ? () => setIsDispatchModalOpen(true) : undefined}
      />

      {/* Main Data Grid */}
      <EnterpriseDataGrid
        data={filteredNotifications}
        columns={columns}
        isLoading={isLoading}
        density={density}
        onRowClick={setSelectedNotif}
        onRowInspect={setSelectedNotif}
        emptyStateProps={{
          title: 'No Notifications Found',
          description: activeFiltersCount > 0
            ? 'No alerts match your search or active filters. Try clearing your filters.'
            : 'You are all caught up! No notifications in your inbox.',
          isFilterActive: activeFiltersCount > 0,
          onResetFilters: clearFilters,
          createLabel: canDispatch ? 'Dispatch Notification' : undefined,
          onCreate: canDispatch ? () => setIsDispatchModalOpen(true) : undefined,
        }}
      />

      {/* Modal: Details Inspector */}
      {selectedNotif && (
        <NotificationDetailModal
          notification={selectedNotif}
          onClose={() => setSelectedNotif(null)}
          onMarkRead={handleMarkAsRead}
          onDelete={handleDelete}
        />
      )}

      {/* Modal: Dispatch Bulletin */}
      <DispatchNotificationModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        onSuccess={() => loadData(true)}
        contacts={contacts}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserRole={currentUserRoleLabel}
      />
    </EnterpriseModuleShell>
  );
}

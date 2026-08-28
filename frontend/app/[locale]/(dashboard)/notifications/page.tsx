'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, AlertCircle, Trash2, CheckCheck, Filter, Clock, 
  Mail, MessageSquare, ShieldAlert, Info, AlertTriangle,
  RefreshCw, Inbox, Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/notification.service';
import { apiClient } from '@/services/api.service';
import { t } from '@/lib/i18n-dict';
import type { Notification } from '@/types/notification.types';
import { NotificationStatusEnum } from '@/types/enums';
import { PAGINATION } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const locale = useLocale();
  const { user } = useAuth();

  // Data states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  // Expanded card tracking
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Load data callback
  const loadNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const filters: any = {
        recipientId: user.id,
        page: pageNum,
        pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (priorityFilter !== 'all') {
        filters.priority = priorityFilter;
      }
      if (channelFilter !== 'all') {
        filters.channel = channelFilter;
      }

      const res = await notificationService.getMyNotifications(filters);
      const newItems = res.data;
      
      setNotifications(prev => append ? [...prev, ...newItems] : newItems);
      setHasMore(res.pagination.page < res.pagination.pageCount);

      // Refresh unread count
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (e) {
      toast.error(t('Failed to load notifications', locale));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, statusFilter, priorityFilter, channelFilter, locale]);

  // Load initial page or when filters change
  useEffect(() => {
    setPage(1);
    loadNotifications(1, false);
  }, [statusFilter, priorityFilter, channelFilter, loadNotifications]);

  // Load more
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(nextPage, true);
  };

  // Mark single as read
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, status: NotificationStatusEnum.Read, recordStatus: NotificationStatusEnum.Read } : n)
      );
      if (user?.id) {
        const count = await notificationService.getUnreadCount(user.id);
        setUnreadCount(count);
      }
    } catch {
      // Silently fail
    }
  };

  // Toggle card expand
  const handleToggleExpand = (id: number, currentStatus?: string) => {
    setExpandedId(prev => prev === id ? null : id);
    if (currentStatus !== 'read') {
      handleMarkAsRead(id);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user?.id || isActionLoading) return;
    setIsActionLoading(true);
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: NotificationStatusEnum.Read, recordStatus: NotificationStatusEnum.Read }))
      );
      setUnreadCount(0);
      toast.success(t('All notifications marked as read', locale));
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Dismiss notification
  const handleDismiss = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (user?.id) {
        const count = await notificationService.getUnreadCount(user.id);
        setUnreadCount(count);
      }
      toast.success(t('Notification dismissed', locale));
    } catch {
      toast.error('Failed to dismiss notification');
    }
  };

  // Helpers for Priority styling
  const getPriorityStyle = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50',
          text: 'text-rose-700 dark:text-rose-400',
          badge: 'bg-rose-600 text-white',
          icon: <ShieldAlert className="w-5 h-5" />
        };
      case 'high':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50',
          text: 'text-amber-700 dark:text-amber-400',
          badge: 'bg-amber-500 text-white',
          icon: <AlertTriangle className="w-5 h-5" />
        };
      case 'low':
        return {
          bg: 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800',
          text: 'text-slate-500 dark:text-slate-400',
          badge: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350',
          icon: <Info className="w-5 h-5" />
        };
      default:
        return {
          bg: 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30',
          text: 'text-emerald-700 dark:text-emerald-450',
          badge: 'bg-emerald-600 text-white',
          icon: <Bell className="w-5 h-5" />
        };
    }
  };

  // Helpers for Channel Icon
  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-3.5 h-3.5" />;
      case 'sms':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
      case 'push':
        return <Smartphone className="w-3.5 h-3.5" />;
      default:
        return <Bell className="w-3.5 h-3.5" />;
    }
  };

  // Format relative date
  const formatNotificationDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return t('Just now', locale);
      if (diffMins < 60) return `${diffMins}m ${t('ago', locale)}`;
      if (diffHours < 24) return `${diffHours}h ${t('ago', locale)}`;
      if (diffDays === 1) return `1d ${t('ago', locale)}`;
      return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 w-full text-slate-800 dark:text-slate-100 animate-in fade-in duration-500">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Bell className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span>{t('Notification Center', locale)}</span>
            {unreadCount > 0 && (
              <span className="ml-2.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                {unreadCount} {t('New', locale)}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('Real-time dispatches, system alerts, workflows, and inbox announcements.', locale)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isActionLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer border-none shrink-0"
            >
              <CheckCheck className="w-4 h-4 stroke-[3]" />
              <span>{t('Mark All as Read', locale)}</span>
            </button>
          )}
          <button
            onClick={() => loadNotifications(1, false)}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title={t('Refresh', locale)}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Interactive Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-550 uppercase tracking-wide">Filters</span>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
            
            {/* Status Select */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">{t('Status', locale)}:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold focus:outline-none cursor-pointer text-slate-700 dark:text-slate-300"
              >
                <option value="all">{t('All Statuses', locale)}</option>
                <option value="pending">{t('Unread', locale)}</option>
                <option value="read">{t('Read', locale)}</option>
              </select>
            </div>

            {/* Priority Select */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">{t('Priority', locale)}:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold focus:outline-none cursor-pointer text-slate-700 dark:text-slate-300"
              >
                <option value="all">{t('All Priorities', locale)}</option>
                <option value="urgent">{t('Urgent', locale)}</option>
                <option value="high">{t('High', locale)}</option>
                <option value="normal">{t('Normal', locale)}</option>
                <option value="low">{t('Low', locale)}</option>
              </select>
            </div>

            {/* Channel Select */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-850 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">{t('Channel', locale)}:</span>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold focus:outline-none cursor-pointer text-slate-700 dark:text-slate-300"
              >
                <option value="all">{t('All Channels', locale)}</option>
                <option value="dashboard">{t('Dashboard', locale)}</option>
                <option value="email">{t('Email', locale)}</option>
                <option value="sms">{t('SMS', locale)}</option>
                <option value="whatsapp">{t('WhatsApp', locale)}</option>
                <option value="push">{t('Push', locale)}</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* Main List Grid */}
      <div className="space-y-4">
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-450 animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
            <span className="text-sm font-semibold">{t('Loading notifications...', locale)}</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center rounded-3xl border border-dashed border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
            <Inbox className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">{t('No Notifications Found', locale)}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {t('You are all caught up! There are no notifications matching your current filters.', locale)}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {notifications.map((item) => {
              const priorityStyle = getPriorityStyle(item.priority);
              const isUnread = item.status !== 'read';
              const isExpanded = expandedId === item.id;

              return (
                <div 
                  key={item.id}
                  onClick={() => handleToggleExpand(item.id, item.status)}
                  className={cn(
                    "p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 group cursor-pointer shadow-xs hover:shadow-md",
                    isUnread 
                      ? "bg-white dark:bg-slate-900 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/10" 
                      : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                  )}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Left Icon Panel */}
                    <div className={cn(
                      "p-3 rounded-xl shrink-0 transition-colors",
                      priorityStyle.bg,
                      priorityStyle.text
                    )}>
                      {priorityStyle.icon}
                    </div>

                    {/* Middle Text Panel */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className={cn(
                          "text-sm leading-snug truncate",
                          isUnread ? "font-extrabold text-slate-900 dark:text-white" : "font-bold text-slate-700 dark:text-slate-350"
                        )}>
                          {item.title}
                        </h4>
                        
                        {/* Status Badges */}
                        {isUnread && (
                          <span className="px-2 py-0.5 rounded text-[8px] font-black bg-rose-500 text-white uppercase tracking-wide animate-pulse">
                            {t('New', locale)}
                          </span>
                        )}
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide",
                          priorityStyle.badge
                        )}>
                          {item.priority}
                        </span>
                      </div>

                      {/* Notification Body - Truncated vs Expanded */}
                      <p className={cn(
                        "text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1",
                        !isExpanded && "line-clamp-2"
                      )}>
                        {item.body}
                      </p>

                      {/* Bottom Metadata Info */}
                      <div className="flex items-center gap-3.5 pt-1.5 text-[11px] text-slate-400 dark:text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {formatNotificationDate(item.sentAt || item.createdAt)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-400 capitalize">
                          {getChannelIcon(item.channel)}
                          {item.channel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Dismiss Button */}
                  <div className="flex items-center shrink-0 self-center">
                    <button
                      onClick={(e) => handleDismiss(item.id, e)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-850 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 text-slate-400 dark:text-slate-500 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900/30 cursor-pointer"
                      title={t('Dismiss', locale)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !isLoading && (
          <div className="pt-4 text-center">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-350 transition shadow-sm cursor-pointer"
            >
              {t('Load More', locale)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

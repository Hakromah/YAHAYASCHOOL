'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import { notificationService } from '@/services/notification.service';
import { apiClient } from '@/services/api.service';
import type { Notification } from '@/types/notification.types';
import {
  NotificationChannelEnum,
  NotificationPriorityEnum,
  NotificationStatusEnum
} from '@/types/enums';

const STORAGE_KEY = 'yahayaschool_notifications';

// Default mock dispatches if API has no records
function generateDefaultNotifications(role: string | null): Partial<Notification>[] {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();

  if (role === 'teacher') {
    return [
      { id: 101, title: 'Homework Submitted', body: 'Ahmad Abdullahi submitted Biology SS3 Homework #4.', priority: NotificationPriorityEnum.Normal, status: NotificationStatusEnum.Sent, channel: NotificationChannelEnum.Dashboard, createdAt: now, sentAt: now, readAt: null },
      { id: 102, title: 'Exam Timetable Published', body: 'First Term Examination schedule is now live.', priority: NotificationPriorityEnum.High, status: NotificationStatusEnum.Sent, channel: NotificationChannelEnum.Dashboard, createdAt: now, sentAt: now, readAt: null },
      { id: 103, title: 'Student Absent Alert', body: 'Fatima Musa was marked absent in Chemistry Section A.', priority: NotificationPriorityEnum.Normal, status: NotificationStatusEnum.Read, channel: NotificationChannelEnum.Dashboard, createdAt: yesterday, sentAt: yesterday, readAt: yesterday },
    ];
  } else if (role === 'student') {
    return [
      { id: 201, title: 'Homework Due Soon', body: 'Mathematics Trigonometry assignment is due tomorrow at 8:00 AM.', priority: NotificationPriorityEnum.High, status: NotificationStatusEnum.Sent, channel: NotificationChannelEnum.Dashboard, createdAt: now, sentAt: now, readAt: null },
      { id: 202, title: 'Results Published', body: 'Mid-term continuous assessment scores are now available.', priority: NotificationPriorityEnum.Normal, status: NotificationStatusEnum.Sent, channel: NotificationChannelEnum.Dashboard, createdAt: now, sentAt: now, readAt: null },
    ];
  } else if (role === 'parent') {
    return [
      { id: 301, title: 'Fee Due Reminder', body: 'Second Term Tuition Fee balance is due by Friday.', priority: NotificationPriorityEnum.High, status: NotificationStatusEnum.Sent, channel: NotificationChannelEnum.Dashboard, createdAt: now, sentAt: now, readAt: null },
      { id: 302, title: 'Child Attendance Alert', body: 'Your ward Yusuf was marked present today at 7:45 AM.', priority: NotificationPriorityEnum.Normal, status: NotificationStatusEnum.Read, channel: NotificationChannelEnum.Dashboard, createdAt: yesterday, sentAt: yesterday, readAt: yesterday },
    ];
  } else {
    // director / admin / default
    return [
      { id: 1, title: 'Term 2 Final Examination Results Certified', body: 'Academic Director Dr. Ibrahim Touré has officially signed off on all report cards for Section A.', priority: NotificationPriorityEnum.High, status: NotificationStatusEnum.Sent, channel: NotificationChannelEnum.Dashboard, createdAt: now, sentAt: now, readAt: null },
      { id: 2, title: 'New Student Admission Application Submitted', body: 'Parent Harith bin Abu Bakr submitted an admission application (#APP-2026-089) for Hifz track.', priority: NotificationPriorityEnum.Normal, status: NotificationStatusEnum.Sent, channel: NotificationChannelEnum.Dashboard, createdAt: twoHoursAgo, sentAt: twoHoursAgo, readAt: null },
      { id: 3, title: 'System Backup & Database Checkpoint Completed', body: 'Database automated snapshot verified and saved to local storage.', priority: NotificationPriorityEnum.Normal, status: NotificationStatusEnum.Read, channel: NotificationChannelEnum.Dashboard, createdAt: yesterday, sentAt: yesterday, readAt: yesterday },
      { id: 4, title: 'Attendance Batch Warning: Section B', body: '5 students in Section B marked absent for more than 3 consecutive Qur\'anic Halaqah sessions.', priority: NotificationPriorityEnum.High, status: NotificationStatusEnum.Read, channel: NotificationChannelEnum.Dashboard, createdAt: yesterday, sentAt: yesterday, readAt: yesterday },
    ];
  }
}

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const { userRole } = usePermissions();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      // 1. Try API
      const res = await notificationService.getMyNotifications({ pageSize: 50 });
      const apiList = res?.data || [];

      const localStr = localStorage.getItem(STORAGE_KEY);
      const localData = localStr ? JSON.parse(localStr) : null;

      if (apiList.length > 0) {
        setNotifications(apiList);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apiList));
      } else {
        if (localData && localData.length > 0) {
          setNotifications(localData);
        } else {
          const defaults = generateDefaultNotifications(userRole) as Notification[];
          setNotifications(defaults);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        }
      }
    } catch (err) {
      // Offline fallback
      const localStr = localStorage.getItem(STORAGE_KEY);
      if (localStr) {
        setNotifications(JSON.parse(localStr));
      } else {
        const defaults = generateDefaultNotifications(userRole) as Notification[];
        setNotifications(defaults);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userRole]);

  useEffect(() => {
    loadNotifications();

    const handleUpdate = () => {
      const localStr = localStorage.getItem(STORAGE_KEY);
      if (localStr) {
        setNotifications(JSON.parse(localStr));
      }
    };

    window.addEventListener('notifications-update', handleUpdate);
    return () => window.removeEventListener('notifications-update', handleUpdate);
  }, [loadNotifications]);

  const notifyChange = () => {
    window.dispatchEvent(new Event('notifications-update'));
  };

  const markAsRead = async (id: number | string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, status: 'read' as any, readAt: new Date().toISOString() } : n
    );
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();

    try {
      if (typeof id === 'number') {
        await notificationService.markAsRead(id);
      } else {
        await apiClient.put(`/notifications/${id}`, { data: { status: 'read', readAt: new Date().toISOString() } });
      }
    } catch {
      // Silent catch for offline capability
    }
  };

  const markAllAsRead = async () => {
    const updated = notifications.map(n => ({ 
      ...n, 
      status: 'read' as any, 
      readAt: new Date().toISOString() 
    }));
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();

    try {
      await notificationService.markAllAsRead();
    } catch {
      // Silent catch
    }
  };

  const deleteNotification = async (id: number | string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyChange();

    try {
      await apiClient.delete(`/notifications/${id}`);
    } catch {
      // Silent catch
    }
  };

  const unreadCount = notifications.filter(n => n.status !== 'read').length;

  return {
    notifications,
    unreadCount,
    isLoading: loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications
  };
}

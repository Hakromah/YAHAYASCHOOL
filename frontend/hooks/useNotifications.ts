'use client';

import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { REFRESH_INTERVALS } from '@/lib/constants';
import { useAuth } from './useAuth';
import type { Notification } from '@/types/notification.types';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — useNotifications Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const { isAuthenticated } = useAuth();

  const {
    data: unreadCount = 0,
    isLoading: isLoadingCount,
  } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: REFRESH_INTERVALS.NOTIFICATIONS,
    staleTime: 30_000,
  });

  const {
    data: notificationsData,
    isLoading: isLoadingList,
  } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () =>
      notificationService.getMyNotifications({ pageSize: 10 }),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  return {
    notifications: (notificationsData?.data ?? []) as Notification[],
    unreadCount,
    isLoading: isLoadingCount || isLoadingList,
  };
}

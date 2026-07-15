import { apiClient, normalizeError } from './api.service';
import type { Notification, NotificationFilters, CreateNotificationPayload } from '@/types/notification.types';
import type { PaginatedResponse } from '@/types/api.types';
import { PAGINATION } from '@/lib/constants';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Notification Service
// ─────────────────────────────────────────────────────────────────────────────

export const notificationService = {
  /**
   * Get notifications for the current user.
   */
  async getMyNotifications(filters: NotificationFilters = {}): Promise<PaginatedResponse<Notification>> {
    try {
      const {
        status,
        channel,
        priority,
        page = PAGINATION.DEFAULT_PAGE,
        pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
      } = filters;

      const queryFilters: Record<string, unknown> = {};
      if (status) queryFilters.status = { $eq: status };
      if (channel) queryFilters.channel = { $eq: channel };
      if (priority) queryFilters.priority = { $eq: priority };

      const { data } = await apiClient.get('/notifications', {
        params: {
          filters: queryFilters,
          pagination: { page, pageSize },
          sort: 'createdAt:desc',
          populate: ['sender'],
        },
      });

      return {
        data: data.data as Notification[],
        pagination: data.meta.pagination,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Get count of unread notifications.
   */
  async getUnreadCount(): Promise<number> {
    try {
      const { data } = await apiClient.get('/notifications', {
        params: {
          filters: { status: { $in: ['pending', 'sent'] } },
          pagination: { page: 1, pageSize: 1 },
          fields: ['id'],
        },
      });
      return data.meta?.pagination?.total ?? 0;
    } catch {
      return 0;
    }
  },

  /**
   * Mark a notification as read.
   */
  async markAsRead(id: number): Promise<void> {
    try {
      await apiClient.put(`/notifications/${id}`, {
        data: { status: 'read', readAt: new Date().toISOString() },
      });
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Mark all unread notifications as read.
   */
  async markAllAsRead(): Promise<void> {
    try {
      // Get all unread notification IDs
      const { data } = await apiClient.get('/notifications', {
        params: {
          filters: { status: { $in: ['pending', 'sent'] } },
          pagination: { page: 1, pageSize: 100 },
          fields: ['id'],
        },
      });

      const ids = (data.data as Array<{ id: number }>).map((n) => n.id);

      await Promise.all(
        ids.map((id) => notificationService.markAsRead(id))
      );
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Create and send a new notification (admin use).
   */
  async sendNotification(payload: CreateNotificationPayload): Promise<void> {
    try {
      await apiClient.post('/notifications', {
        data: {
          title: payload.title,
          body: payload.body,
          channel: payload.channel ?? 'dashboard',
          priority: payload.priority ?? 'normal',
          recipient: payload.recipientId,
          metadata: payload.metadata,
          scheduledAt: payload.scheduledAt,
          relatedEntity: payload.relatedEntity,
          relatedEntityId: payload.relatedEntityId,
        },
      });
    } catch (error) {
      throw normalizeError(error);
    }
  },
};

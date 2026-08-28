import { apiClient, normalizeError } from './api.service';
import type { Notification, NotificationFilters, CreateNotificationPayload } from '@/types/notification.types';
import { NotificationStatusEnum } from '@/types/enums';
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
        recipientId,
        page = PAGINATION.DEFAULT_PAGE,
        pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
      } = filters;

      const queryFilters: Record<string, unknown> = {};
      if (status) queryFilters.recordStatus = { $eq: status };
      if (channel) queryFilters.channel = { $eq: channel };
      if (priority) queryFilters.priority = { $eq: priority };
      if (recipientId) queryFilters.recipient = { id: { $eq: recipientId } };

      const { data } = await apiClient.get('/notifications', {
        params: {
          filters: queryFilters,
          pagination: { page, pageSize },
          sort: 'createdAt:desc',
          populate: ['sender'],
        },
      });

      const notifications = (data.data as Notification[]).map(n => ({
        ...n,
        status: (n.status || n.recordStatus || 'pending') as NotificationStatusEnum
      }));

      return {
        data: notifications,
        pagination: data.meta.pagination,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Get count of unread notifications.
   */
  async getUnreadCount(recipientId?: number): Promise<number> {
    try {
      const queryFilters: any = { recordStatus: { $in: ['pending', 'sent'] } };
      if (recipientId) {
        queryFilters.recipient = { id: { $eq: recipientId } };
      }
      const { data } = await apiClient.get('/notifications', {
        params: {
          filters: queryFilters,
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
        data: { recordStatus: 'read', readAt: new Date().toISOString() },
      });
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Mark all unread notifications as read.
   */
  async markAllAsRead(recipientId?: number): Promise<void> {
    try {
      const queryFilters: any = { recordStatus: { $in: ['pending', 'sent'] } };
      if (recipientId) {
        queryFilters.recipient = { id: { $eq: recipientId } };
      }

      // Get all unread notification IDs
      const { data } = await apiClient.get('/notifications', {
        params: {
          filters: queryFilters,
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

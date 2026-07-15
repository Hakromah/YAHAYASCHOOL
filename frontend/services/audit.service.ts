import { apiClient, normalizeError } from './api.service';
import type { AuditLog, AuditLogFilters, LogActionPayload } from '@/types/audit.types';
import type { PaginatedResponse } from '@/types/api.types';
import { PAGINATION } from '@/lib/constants';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Audit Log Service
// ─────────────────────────────────────────────────────────────────────────────

export const auditService = {
  /**
   * Get paginated audit logs with optional filtering.
   */
  async getLogs(filters: AuditLogFilters = {}): Promise<PaginatedResponse<AuditLog>> {
    try {
      const {
        action,
        entity,
        severity,
        performedBy,
        dateFrom,
        dateTo,
        page = PAGINATION.DEFAULT_PAGE,
        pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
      } = filters;

      const queryFilters: Record<string, unknown> = {};

      if (action) queryFilters.action = { $containsi: action };
      if (entity) queryFilters.entity = { $eq: entity };
      if (severity) queryFilters.severity = { $eq: severity };
      if (performedBy) queryFilters.performedBy = { id: { $eq: performedBy } };
      if (dateFrom) queryFilters.createdAt = { $gte: dateFrom };
      if (dateTo) {
        queryFilters.createdAt = {
          ...(queryFilters.createdAt as object ?? {}),
          $lte: dateTo,
        };
      }

      const { data } = await apiClient.get('/audit-logs', {
        params: {
          filters: queryFilters,
          pagination: { page, pageSize },
          sort: 'createdAt:desc',
          populate: ['performedBy'],
        },
      });

      return {
        data: data.data as AuditLog[],
        pagination: data.meta.pagination,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Log a client-side action to the audit trail via API.
   * Note: Server-side lifecycle hooks auto-log most actions;
   * use this only for additional client-initiated events.
   */
  async logAction(payload: LogActionPayload): Promise<void> {
    try {
      await apiClient.post('/audit-logs', {
        data: {
          action: payload.action,
          entity: payload.entity,
          entityId: payload.entityId != null ? String(payload.entityId) : undefined,
          description: payload.description,
          metadata: payload.metadata,
        },
      });
    } catch {
      // Audit log failures should not propagate to the UI
    }
  },
};

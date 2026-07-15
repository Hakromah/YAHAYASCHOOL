'use client';

import { useAuth } from './useAuth';
import { can, hasPermission } from '@/lib/permissions';
import type { UserRoleEnum } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — usePermissions Hook
// Role-based access control checks for components.
// ─────────────────────────────────────────────────────────────────────────────

export function usePermissions() {
  const { role } = useAuth();

  return {
    role,

    /** Check if current user has any of the given roles */
    hasRole: (...roles: UserRoleEnum[]) => hasPermission(role, roles),

    /** Check permission categories */
    can: {
      manageUsers: can.manageUsers(role),
      viewAuditLogs: can.viewAuditLogs(role),
      manageSettings: can.manageSettings(role),
      accessFinance: can.accessFinance(role),
      approveTransactions: can.approveTransactions(role),
      teach: can.teach(role),
      isAdmin: can.isAdmin(role),
    },
  };
}

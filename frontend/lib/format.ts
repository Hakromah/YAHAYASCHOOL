import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Formatting Utilities
// ─────────────────────────────────────────────────────────────────────────────

// ── Date Formatters ────────────────────────────────────────────────────────

/** Format a date string to a human-readable long format */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr = 'dd MMM yyyy'
): string {
  if (!date) return '—';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsed)) return '—';
    return format(parsed, formatStr);
  } catch {
    return '—';
  }
}

/** Format a datetime string */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd MMM yyyy, HH:mm');
}

/** Format a date as relative time (e.g., "2 hours ago") */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsed)) return '—';
    return formatDistanceToNow(parsed, { addSuffix: true });
  } catch {
    return '—';
  }
}

/** Format a date for HTML date input (YYYY-MM-DD) */
export function formatDateInput(date: string | Date | null | undefined): string {
  return formatDate(date, 'yyyy-MM-dd');
}

// ── Currency Formatters ─────────────────────────────────────────────────────

/** Format a number as currency */
export function formatCurrency(
  amount: number | null | undefined,
  currency = 'NGN',
  locale = 'en-NG'
): string {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// ── Number Formatters ───────────────────────────────────────────────────────

/** Format a large number with thousands separators */
export function formatNumber(num: number | null | undefined): string {
  if (num == null) return '—';
  return new Intl.NumberFormat('en-US').format(num);
}

/** Format a number as percentage */
export function formatPercent(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value == null) return '—';
  return `${value.toFixed(decimals)}%`;
}

// ── Text Formatters ─────────────────────────────────────────────────────────

/** Format a School ID for display (e.g., "AC000000001") */
export function formatSchoolId(schoolId: string | null | undefined): string {
  if (!schoolId) return '—';
  return schoolId.toUpperCase();
}

/** Format a phone number for display */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '—';
  // Simple formatter — can be enhanced with libphonenumber-js later
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
}

/** Format a role type string to display name */
export function formatRoleName(roleType: string): string {
  return roleType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

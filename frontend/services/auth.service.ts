import { apiClient, normalizeError } from './api.service';
import { STRAPI_URL, COOKIE_NAMES } from '@/lib/constants';
import type {
  LoginCredentials,
  LoginResponse,
  AuthUser,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from '@/types/auth.types';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Authentication Service
// ─────────────────────────────────────────────────────────────────────────────

const AUTH_BASE = '/auth/local';

export const authService = {
  /**
   * Log in with email/identifier + password.
   * Sets the JWT cookie on success.
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { data } = await apiClient.post<LoginResponse>(AUTH_BASE, {
        identifier: credentials.identifier,
        password: credentials.password,
      });

      // Store JWT in cookie (accessible by middleware)
      const maxAge = 7 * 24 * 3600; // 7 days
      document.cookie = `${COOKIE_NAMES.JWT}=${data.jwt}; path=/; max-age=${maxAge}; SameSite=Lax`;

      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Log out — clears JWT cookie and calls server logout.
   */
  async logout(): Promise<void> {
    try {
      // Clear the JWT cookie
      document.cookie = `${COOKIE_NAMES.JWT}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    } catch (error) {
      // Always clear cookie even if server call fails
      document.cookie = `${COOKIE_NAMES.JWT}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      throw normalizeError(error);
    }
  },

  /**
   * Get the currently authenticated user profile.
   */
  async getMe(): Promise<AuthUser> {
    try {
      const { data } = await apiClient.get<AuthUser>('/users/me', {
        params: { populate: ['role', 'avatar'] },
      });
      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Send a password reset email.
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', payload);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Reset password using the token from the email link.
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<LoginResponse> {
    try {
      const { data } = await apiClient.post<LoginResponse>(
        '/auth/reset-password',
        payload
      );
      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Verify email using the confirmation token.
   */
  async verifyEmail(payload: VerifyEmailPayload): Promise<void> {
    try {
      await apiClient.get('/auth/email-confirmation', {
        params: { confirmation: payload.confirmation },
      });
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Change the current user's password.
   */
  async changePassword(payload: {
    currentPassword: string;
    password: string;
    passwordConfirmation: string;
  }): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', payload);
    } catch (error) {
      throw normalizeError(error);
    }
  },

  /**
   * Check if user is authenticated by verifying JWT existence.
   */
  isAuthenticated(): boolean {
    if (typeof document === 'undefined') return false;
    const match = document.cookie.match(
      new RegExp(`(^| )${COOKIE_NAMES.JWT}=([^;]+)`)
    );
    return !!match;
  },

  /**
   * Get the Strapi admin panel URL.
   */
  getAdminUrl(): string {
    return `${STRAPI_URL}/admin`;
  },
};

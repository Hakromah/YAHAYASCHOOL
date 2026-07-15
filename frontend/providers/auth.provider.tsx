'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from '@/i18n/routing';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/lib/routes';
import type { AuthUser, LoginCredentials, AuthContextValue, AuthState } from '@/types/auth.types';
import type { UserRoleEnum } from '@/types/enums';

// ─────────────────────────────────────────────────────────────────────────────
// YAHAYASCOOL — Auth Provider
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const INITIAL_STATE: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  role: null,
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);
  const router = useRouter();

  /** Fetch the current user from Strapi using the stored JWT */
  const refreshUser = useCallback(async () => {
    const isAuth = authService.isAuthenticated();

    if (!isAuth) {
      setState({ ...INITIAL_STATE, isLoading: false });
      return;
    }

    try {
      const user = await authService.getMe();
      setState({
        user,
        token: null, // Token is managed via cookie, not state
        isAuthenticated: true,
        isLoading: false,
        role: (user.role?.type ?? null) as UserRoleEnum | null,
      });
    } catch {
      // Token invalid or expired
      setState({ ...INITIAL_STATE, isLoading: false });
    }
  }, []);

  /** On mount, check if user is already authenticated */
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await authService.login(credentials);
      setState({
        user: response.user as unknown as AuthUser,
        token: response.jwt,
        isAuthenticated: true,
        isLoading: false,
        role: (response.user as unknown as AuthUser).role?.type as UserRoleEnum ?? null,
      });
    },
    []
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setState({ ...INITIAL_STATE, isLoading: false });
    router.push(ROUTES.AUTH.LOGIN);
  }, [router]);

  const setUser = useCallback((user: AuthUser | null) => {
    setState((prev) => ({
      ...prev,
      user,
      isAuthenticated: !!user,
      role: user?.role?.type as UserRoleEnum ?? null,
    }));
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook to access the auth context */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an <AuthProvider>');
  }
  return context;
}

export { AuthContext };

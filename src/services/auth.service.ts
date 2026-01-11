// ============================================================================
// Auth Service - Authentication & Authorization
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  tenantId: string | null;
  role: string | null;
  metadata: Record<string, unknown>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  tenantId?: string;
}

export interface AuthResult {
  success: boolean;
  user: AuthUser | null;
  session: Session | null;
  error: string | null;
}

export interface PasswordResetResult {
  success: boolean;
  error: string | null;
}

// ============================================================================
// AUTH SERVICE
// ============================================================================

class AuthService {
  private currentUser: AuthUser | null = null;
  private currentSession: Session | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();

  /**
   * Initialize auth service and listen for auth state changes
   */
  async initialize(): Promise<void> {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      this.currentSession = session;
      this.currentUser = await this.fetchUserProfile(session.user);
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      this.currentSession = session;

      if (session?.user) {
        this.currentUser = await this.fetchUserProfile(session.user);
      } else {
        this.currentUser = null;
      }

      // Notify listeners
      this.notifyListeners();
    });
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          user: null,
          session: null,
          error: error.message,
        };
      }

      const user = data.user ? await this.fetchUserProfile(data.user) : null;

      return {
        success: true,
        user,
        session: data.session,
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        user: null,
        session: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            tenant_id: data.tenantId,
          },
        },
      });

      if (authError) {
        return {
          success: false,
          user: null,
          session: null,
          error: authError.message,
        };
      }

      // Create profile in database
      if (authData.user) {
        await this.createUserProfile(authData.user.id, {
          fullName: data.fullName,
          email: data.email,
          tenantId: data.tenantId,
        });
      }

      const user = authData.user ? await this.fetchUserProfile(authData.user) : null;

      return {
        success: true,
        user,
        session: authData.session,
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        user: null,
        session: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser = null;
    this.currentSession = null;
    this.notifyListeners();
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<PasswordResetResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<PasswordResetResult> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentSession !== null;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  /**
   * Refresh the session
   */
  async refreshSession(): Promise<Session | null> {
    const { data } = await supabase.auth.refreshSession();
    this.currentSession = data.session;
    return data.session;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async fetchUserProfile(user: User): Promise<AuthUser> {
    // Try to fetch profile from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Try to fetch user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email ?? '',
      fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
      tenantId: profile?.tenant_id ?? user.user_metadata?.tenant_id ?? null,
      role: roleData?.role ?? 'user',
      metadata: user.user_metadata ?? {},
    };
  }

  private async createUserProfile(
    userId: string,
    data: { fullName: string; email: string; tenantId?: string }
  ): Promise<void> {
    await supabase.from('profiles').insert({
      user_id: userId,
      full_name: data.fullName,
      // tenant_id is set via trigger or default
    });
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// ============================================================================
// REACT HOOKS FOR AUTH SERVICE
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to access auth state
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(authService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize service
    authService.initialize().then(() => {
      setUser(authService.getCurrentUser());
      setLoading(false);
    });

    // Subscribe to changes
    const unsubscribe = authService.subscribe((newUser) => {
      setUser(newUser);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    return authService.login(credentials);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    return authService.register(data);
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    register,
    requestPasswordReset: authService.requestPasswordReset.bind(authService),
    updatePassword: authService.updatePassword.bind(authService),
  };
}

// ============================================================================
// TODO: Additional Auth Features
// ============================================================================
// TODO: Add OAuth providers (Google, GitHub, etc.)
// TODO: Add MFA support
// TODO: Add session management (list sessions, revoke)
// TODO: Add API key authentication for CLI/SDK
// TODO: Add team invitation flow
// TODO: Add email verification flow
// TODO: Add audit logging for auth events

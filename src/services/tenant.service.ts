// ============================================================================
// Tenant Service - Multi-tenancy Management
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: TenantSettings;
  featureFlags: Record<string, boolean>;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  security?: {
    mfaRequired?: boolean;
    sessionTimeout?: number;
    allowedDomains?: string[];
  };
  quotas?: {
    maxProjects?: number;
    maxUsers?: number;
    maxStorage?: number;
    maxCompute?: number;
  };
  features?: Record<string, boolean>;
}

export interface TenantStats {
  projectCount: number;
  userCount: number;
  experimentCount: number;
  runCount: number;
  modelCount: number;
  storageUsedBytes: number;
  computeHoursUsed: number;
}

export interface TenantCreateData {
  name: string;
  slug: string;
  settings?: TenantSettings;
}

export interface TenantUpdateData {
  name?: string;
  settings?: Partial<TenantSettings>;
  status?: 'active' | 'inactive' | 'suspended';
}

// ============================================================================
// TENANT SERVICE
// ============================================================================

class TenantService {
  private currentTenant: Tenant | null = null;

  /**
   * Get current tenant
   */
  getCurrentTenant(): Tenant | null {
    return this.currentTenant;
  }

  /**
   * Set current tenant context
   */
  setCurrentTenant(tenant: Tenant | null): void {
    this.currentTenant = tenant;
  }

  /**
   * Fetch tenant by ID
   */
  async getTenant(id: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenant')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Failed to fetch tenant:', error);
      return null;
    }

    return this.mapTenant(data);
  }

  /**
   * Fetch tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenant')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      console.error('Failed to fetch tenant by slug:', error);
      return null;
    }

    return this.mapTenant(data);
  }

  /**
   * Create a new tenant
   */
  async createTenant(data: TenantCreateData): Promise<Tenant | null> {
    const { data: result, error } = await supabase
      .from('tenant')
      .insert({
        name: data.name,
        slug: data.slug,
        settings: data.settings ?? {},
        feature_flags: {},
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create tenant:', error);
      throw new Error(error.message);
    }

    return this.mapTenant(result);
  }

  /**
   * Update tenant
   */
  async updateTenant(id: string, data: TenantUpdateData): Promise<Tenant | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.settings !== undefined) {
      // Merge settings
      const { data: current } = await supabase
        .from('tenant')
        .select('settings')
        .eq('id', id)
        .single();

      updateData.settings = {
        ...(current?.settings ?? {}),
        ...data.settings,
      };
    }

    const { data: result, error } = await supabase
      .from('tenant')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update tenant:', error);
      throw new Error(error.message);
    }

    return this.mapTenant(result);
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(tenantId: string): Promise<TenantStats> {
    // Run all queries in parallel
    const [
      projectsResult,
      usersResult,
      experimentsResult,
      runsResult,
      modelsResult,
    ] = await Promise.all([
      supabase
        .from('project')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      supabase
        .from('user_account')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      supabase
        .from('experiment')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      supabase
        .from('run')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      supabase
        .from('model')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
    ]);

    // TODO: Calculate storage and compute usage from actual data
    return {
      projectCount: projectsResult.count ?? 0,
      userCount: usersResult.count ?? 0,
      experimentCount: experimentsResult.count ?? 0,
      runCount: runsResult.count ?? 0,
      modelCount: modelsResult.count ?? 0,
      storageUsedBytes: 0, // TODO: Calculate from artifact storage
      computeHoursUsed: 0, // TODO: Calculate from run durations
    };
  }

  /**
   * Check if a feature is enabled for the tenant
   */
  isFeatureEnabled(featureName: string): boolean {
    if (!this.currentTenant) return false;
    return this.currentTenant.featureFlags[featureName] ?? false;
  }

  /**
   * Update tenant feature flags
   */
  async updateFeatureFlags(
    tenantId: string,
    flags: Record<string, boolean>
  ): Promise<void> {
    const { data: current } = await supabase
      .from('tenant')
      .select('feature_flags')
      .eq('id', tenantId)
      .single();

    const updatedFlags = {
      ...(current?.feature_flags ?? {}),
      ...flags,
    };

    const { error } = await supabase
      .from('tenant')
      .update({ feature_flags: updatedFlags })
      .eq('id', tenantId);

    if (error) {
      console.error('Failed to update feature flags:', error);
      throw new Error(error.message);
    }

    // Update current tenant if it's the same
    if (this.currentTenant?.id === tenantId) {
      this.currentTenant.featureFlags = updatedFlags;
    }
  }

  /**
   * Check quota usage
   */
  async checkQuota(
    tenantId: string,
    quotaType: 'projects' | 'users' | 'storage' | 'compute'
  ): Promise<{ used: number; limit: number; remaining: number; exceeded: boolean }> {
    const stats = await this.getTenantStats(tenantId);
    const tenant = await this.getTenant(tenantId);

    const quotaLimits: Record<string, number> = {
      projects: tenant?.settings.quotas?.maxProjects ?? Infinity,
      users: tenant?.settings.quotas?.maxUsers ?? Infinity,
      storage: tenant?.settings.quotas?.maxStorage ?? Infinity,
      compute: tenant?.settings.quotas?.maxCompute ?? Infinity,
    };

    const usage: Record<string, number> = {
      projects: stats.projectCount,
      users: stats.userCount,
      storage: stats.storageUsedBytes,
      compute: stats.computeHoursUsed,
    };

    const used = usage[quotaType];
    const limit = quotaLimits[quotaType];
    const remaining = Math.max(0, limit - used);
    const exceeded = used >= limit;

    return { used, limit, remaining, exceeded };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private mapTenant(data: Record<string, unknown>): Tenant {
    return {
      id: data.id as string,
      name: data.name as string,
      slug: data.slug as string,
      settings: (data.settings as TenantSettings) ?? {},
      featureFlags: (data.feature_flags as Record<string, boolean>) ?? {},
      status: data.status as Tenant['status'],
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  }
}

// Export singleton instance
export const tenantService = new TenantService();

// ============================================================================
// REACT CONTEXT FOR TENANT
// ============================================================================

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from './auth.service';

interface TenantContextValue {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  stats: TenantStats | null;
  isFeatureEnabled: (feature: string) => boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenant = async () => {
    const user = authService.getCurrentUser();
    if (!user?.tenantId) {
      setTenant(null);
      setLoading(false);
      return;
    }

    try {
      const tenantData = await tenantService.getTenant(user.tenantId);
      setTenant(tenantData);
      tenantService.setCurrentTenant(tenantData);

      if (tenantData) {
        const tenantStats = await tenantService.getTenantStats(tenantData.id);
        setStats(tenantStats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenant');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();

    // Subscribe to auth changes
    const unsubscribe = authService.subscribe(() => {
      loadTenant();
    });

    return unsubscribe;
  }, []);

  const isFeatureEnabled = (feature: string): boolean => {
    return tenant?.featureFlags[feature] ?? false;
  };

  const refreshTenant = async () => {
    await loadTenant();
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        loading,
        error,
        stats,
        isFeatureEnabled,
        refreshTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

// ============================================================================
// TODO: Additional Tenant Features
// ============================================================================
// TODO: Add tenant provisioning workflow
// TODO: Add tenant suspension/reactivation
// TODO: Add tenant data export
// TODO: Add tenant data deletion (GDPR)
// TODO: Add tenant billing integration
// TODO: Add tenant audit logging
// TODO: Add tenant API rate limiting
// TODO: Add tenant custom domains

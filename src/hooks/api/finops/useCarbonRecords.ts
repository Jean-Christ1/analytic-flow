// ============================================================================
// Carbon Records Hooks - React Query Hooks for GreenOps Carbon Tracking
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import {
  createQueryKeyFactory,
  type ListQueryOptions,
  type MutationOptions,
  calculateOffset,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
  getErrorMessage,
} from '../utils/query-utils';

// ============================================================================
// TYPES
// ============================================================================

export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'onprem';

/**
 * Carbon accounting methodology
 */
export type CarbonMethodology =
  | 'ghg_protocol'       // Greenhouse Gas Protocol
  | 'iso14064'           // ISO 14064 Standard
  | 'pue_based'          // Power Usage Effectiveness calculation
  | 'cloud_provider'     // Provider-specific methodology (AWS, GCP, Azure)
  | 'estimated';         // Estimated based on compute hours

/**
 * Attribution target for carbon emissions
 */
export interface CarbonAttribution {
  project_id?: string;
  run_id?: string;
  deployment_id?: string;
  pipeline_id?: string;
  namespace?: string;
  team_id?: string;
}

/**
 * Carbon record structure for tracking environmental impact
 */
export interface CarbonRecord {
  id: string;
  tenant_id: string;
  provider: CloudProvider;
  region: string | null;
  start_time: string | null;
  end_time: string | null;
  kwh: number | null;
  co2e_kg: number | null;
  methodology: CarbonMethodology | null;
  attribution: CarbonAttribution | null;
  created_at: string;
}

export interface CarbonRecordInsert {
  tenant_id: string;
  provider: CloudProvider;
  region?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  kwh?: number | null;
  co2e_kg?: number | null;
  methodology?: CarbonMethodology | null;
  attribution?: CarbonAttribution | null;
}

export interface CarbonRecordUpdate {
  region?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  kwh?: number | null;
  co2e_kg?: number | null;
  methodology?: CarbonMethodology | null;
  attribution?: CarbonAttribution | null;
}

/**
 * Carbon intensity by region (kgCO2e/kWh)
 */
export interface RegionCarbonIntensity {
  provider: CloudProvider;
  region: string;
  carbon_intensity: number;
  renewable_percentage?: number;
  last_updated: string;
}

/**
 * Time granularity for carbon aggregations
 */
export type CarbonGranularity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const carbonRecordKeys = createQueryKeyFactory<string>('carbonRecords');

// ============================================================================
// CONSTANTS - Region Carbon Intensities
// ============================================================================

/**
 * Approximate carbon intensity by cloud region (kgCO2e/kWh)
 * Based on publicly available data from cloud providers and grid operators
 * Last updated: 2026-01
 */
export const REGION_CARBON_INTENSITIES: Record<string, RegionCarbonIntensity> = {
  // AWS Regions
  'aws:us-east-1': { provider: 'aws', region: 'us-east-1', carbon_intensity: 0.379, renewable_percentage: 35, last_updated: '2026-01-01' },
  'aws:us-west-2': { provider: 'aws', region: 'us-west-2', carbon_intensity: 0.147, renewable_percentage: 65, last_updated: '2026-01-01' },
  'aws:eu-west-1': { provider: 'aws', region: 'eu-west-1', carbon_intensity: 0.316, renewable_percentage: 40, last_updated: '2026-01-01' },
  'aws:eu-north-1': { provider: 'aws', region: 'eu-north-1', carbon_intensity: 0.013, renewable_percentage: 95, last_updated: '2026-01-01' },
  // GCP Regions
  'gcp:us-central1': { provider: 'gcp', region: 'us-central1', carbon_intensity: 0.410, renewable_percentage: 30, last_updated: '2026-01-01' },
  'gcp:europe-west1': { provider: 'gcp', region: 'europe-west1', carbon_intensity: 0.190, renewable_percentage: 55, last_updated: '2026-01-01' },
  'gcp:europe-north1': { provider: 'gcp', region: 'europe-north1', carbon_intensity: 0.020, renewable_percentage: 92, last_updated: '2026-01-01' },
  // Azure Regions
  'azure:eastus': { provider: 'azure', region: 'eastus', carbon_intensity: 0.370, renewable_percentage: 38, last_updated: '2026-01-01' },
  'azure:westeurope': { provider: 'azure', region: 'westeurope', carbon_intensity: 0.285, renewable_percentage: 45, last_updated: '2026-01-01' },
  'azure:northeurope': { provider: 'azure', region: 'northeurope', carbon_intensity: 0.150, renewable_percentage: 65, last_updated: '2026-01-01' },
};

// ============================================================================
// CARBON RECORD QUERIES
// ============================================================================

/**
 * Hook to fetch a list of Carbon Records
 */
export const useCarbonRecords = (options: ListQueryOptions = {}) => {
  const {
    pagination = { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    sort,
    filters,
    search,
    select = '*',
    enabled = true,
  } = options;

  const page = pagination.page ?? DEFAULT_PAGE;
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = calculateOffset(page, pageSize);

  return useQuery({
    queryKey: carbonRecordKeys.list({ page, pageSize, sort, filters, search }),
    queryFn: async () => {
      let query = supabase
        .from('carbon_record')
        .select(select, { count: 'exact' });

      // Apply filters
      if (filters) {
        for (const filter of filters) {
          // @ts-expect-error - Dynamic filter application
          query = query[filter.operator](filter.column, filter.value);
        }
      }

      // Apply search
      if (search) {
        query = query.ilike(search.column, `%${search.value}%`);
      }

      // Apply sorting
      if (sort) {
        const sorts = Array.isArray(sort) ? sort : [sort];
        for (const s of sorts) {
          query = query.order(s.column, { ascending: s.ascending ?? true });
        }
      } else {
        query = query.order('start_time', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data as CarbonRecord[],
        count: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
    enabled,
  });
};

/**
 * Hook to fetch a single Carbon Record by ID
 */
export const useCarbonRecord = (
  id: string | undefined,
  options: { select?: string; enabled?: boolean } = {}
) => {
  const { select = '*', enabled = true } = options;

  return useQuery({
    queryKey: carbonRecordKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Carbon Record ID is required');

      const { data, error } = await supabase
        .from('carbon_record')
        .select(select)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as CarbonRecord;
    },
    enabled: enabled && !!id,
  });
};

/**
 * Hook to fetch Carbon Records by provider
 */
export const useCarbonRecordsByProvider = (
  provider: CloudProvider,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'provider', operator: 'eq' as const, value: provider },
  ];

  return useCarbonRecords({ ...options, filters });
};

/**
 * Hook to fetch Carbon Records by region
 */
export const useCarbonRecordsByRegion = (
  region: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'region', operator: 'eq' as const, value: region },
  ];

  return useCarbonRecords({ ...options, filters });
};

/**
 * Hook to fetch Carbon Records by date range
 */
export const useCarbonRecordsByDateRange = (
  startDate: string,
  endDate: string,
  options: ListQueryOptions = {}
) => {
  const filters = [
    ...(options.filters ?? []),
    { column: 'start_time', operator: 'gte' as const, value: startDate },
    { column: 'end_time', operator: 'lte' as const, value: endDate },
  ];

  return useCarbonRecords({ ...options, filters });
};

/**
 * Hook to get carbon emissions summary
 */
export const useCarbonSummary = (
  dateRange?: { start: string; end: string },
  options: { projectId?: string; enabled?: boolean } = {}
) => {
  const { projectId, enabled = true } = options;

  return useQuery({
    queryKey: ['carbonRecords', 'summary', dateRange, projectId],
    queryFn: async () => {
      let query = supabase
        .from('carbon_record')
        .select('co2e_kg, kwh, provider, region, attribution');

      if (dateRange) {
        query = query
          .gte('start_time', dateRange.start)
          .lte('end_time', dateRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by project if specified
      let filteredData = data;
      if (projectId) {
        filteredData = data?.filter((r) => {
          const attr = r.attribution as CarbonAttribution | null;
          return attr?.project_id === projectId;
        }) ?? [];
      }

      // Calculate totals
      const totalCO2eKg = filteredData?.reduce((sum, r) => sum + (r.co2e_kg ?? 0), 0) ?? 0;
      const totalKWh = filteredData?.reduce((sum, r) => sum + (r.kwh ?? 0), 0) ?? 0;

      // Group by provider
      const byProvider = new Map<CloudProvider, { co2e_kg: number; kwh: number }>();
      filteredData?.forEach((r) => {
        const provider = r.provider as CloudProvider;
        const current = byProvider.get(provider) ?? { co2e_kg: 0, kwh: 0 };
        current.co2e_kg += r.co2e_kg ?? 0;
        current.kwh += r.kwh ?? 0;
        byProvider.set(provider, current);
      });

      // Group by region
      const byRegion = new Map<string, { co2e_kg: number; kwh: number }>();
      filteredData?.forEach((r) => {
        const region = r.region ?? 'unknown';
        const current = byRegion.get(region) ?? { co2e_kg: 0, kwh: 0 };
        current.co2e_kg += r.co2e_kg ?? 0;
        current.kwh += r.kwh ?? 0;
        byRegion.set(region, current);
      });

      return {
        totalCO2eKg,
        totalKWh,
        averageCarbonIntensity: totalKWh > 0 ? totalCO2eKg / totalKWh : 0,
        recordCount: filteredData?.length ?? 0,
        // Convert to tonnes for readability
        totalCO2eTonnes: totalCO2eKg / 1000,
        byProvider: Array.from(byProvider.entries()).map(([provider, stats]) => ({
          provider,
          ...stats,
        })),
        byRegion: Array.from(byRegion.entries())
          .map(([region, stats]) => ({ region, ...stats }))
          .sort((a, b) => b.co2e_kg - a.co2e_kg),
      };
    },
    enabled,
  });
};

/**
 * Hook to get carbon emissions over time
 */
export const useCarbonTrends = (
  dateRange: { start: string; end: string },
  granularity: CarbonGranularity = 'daily',
  options: { projectId?: string; enabled?: boolean } = {}
) => {
  const { projectId, enabled = true } = options;

  return useQuery({
    queryKey: ['carbonRecords', 'trends', dateRange, granularity, projectId],
    queryFn: async () => {
      let query = supabase
        .from('carbon_record')
        .select('start_time, co2e_kg, kwh, attribution')
        .gte('start_time', dateRange.start)
        .lte('end_time', dateRange.end)
        .order('start_time');

      const { data, error } = await query;

      if (error) throw error;

      // Filter by project if specified
      let filteredData = data;
      if (projectId) {
        filteredData = data?.filter((r) => {
          const attr = r.attribution as CarbonAttribution | null;
          return attr?.project_id === projectId;
        }) ?? [];
      }

      // Group by period
      const trends = new Map<string, { co2e_kg: number; kwh: number }>();

      filteredData?.forEach((r) => {
        if (!r.start_time) return;

        const date = new Date(r.start_time);
        let periodKey: string;

        switch (granularity) {
          case 'daily':
            periodKey = date.toISOString().split('T')[0];
            break;
          case 'weekly': {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = weekStart.toISOString().split('T')[0];
            break;
          }
          case 'monthly':
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'quarterly': {
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            periodKey = `${date.getFullYear()}-Q${quarter}`;
            break;
          }
          case 'yearly':
            periodKey = String(date.getFullYear());
            break;
        }

        const current = trends.get(periodKey) ?? { co2e_kg: 0, kwh: 0 };
        current.co2e_kg += r.co2e_kg ?? 0;
        current.kwh += r.kwh ?? 0;
        trends.set(periodKey, current);
      });

      return Array.from(trends.entries())
        .map(([period, stats]) => ({
          period,
          co2e_kg: stats.co2e_kg,
          kwh: stats.kwh,
          carbon_intensity: stats.kwh > 0 ? stats.co2e_kg / stats.kwh : 0,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    },
    enabled,
  });
};

/**
 * Hook to get greenest regions
 */
export const useGreenestRegions = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['carbonRecords', 'greenestRegions'],
    queryFn: async () => {
      return Object.values(REGION_CARBON_INTENSITIES)
        .sort((a, b) => a.carbon_intensity - b.carbon_intensity)
        .slice(0, 10);
    },
    enabled,
  });
};

/**
 * Hook to estimate carbon for compute usage
 */
export const useEstimateCarbonEmissions = (
  computeHours: number,
  provider: CloudProvider,
  region: string,
  options: { gpuHours?: number; averageWattage?: number; enabled?: boolean } = {}
) => {
  const { gpuHours = 0, averageWattage = 200, enabled = true } = options;

  return useQuery({
    queryKey: ['carbonRecords', 'estimate', computeHours, gpuHours, provider, region],
    queryFn: async () => {
      const regionKey = `${provider}:${region}`;
      const intensity = REGION_CARBON_INTENSITIES[regionKey]?.carbon_intensity ?? 0.4;

      // CPU energy: computeHours * averageWattage / 1000 = kWh
      const cpuKWh = (computeHours * averageWattage) / 1000;

      // GPU energy: typically 250-400W per GPU
      const gpuKWh = (gpuHours * 300) / 1000;

      const totalKWh = cpuKWh + gpuKWh;
      const co2eKg = totalKWh * intensity;

      return {
        totalKWh,
        cpuKWh,
        gpuKWh,
        co2eKg,
        co2eTonnes: co2eKg / 1000,
        carbonIntensity: intensity,
        provider,
        region,
        methodology: 'estimated' as CarbonMethodology,
      };
    },
    enabled: enabled && computeHours > 0,
  });
};

// ============================================================================
// CARBON RECORD MUTATIONS
// ============================================================================

/**
 * Hook to create a new Carbon Record
 */
export const useCreateCarbonRecord = (
  options: MutationOptions<CarbonRecord, CarbonRecordInsert> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CarbonRecordInsert) => {
      // Auto-calculate CO2e if not provided
      let co2eKg = input.co2e_kg;
      if (co2eKg === undefined && input.kwh && input.region) {
        const regionKey = `${input.provider}:${input.region}`;
        const intensity = REGION_CARBON_INTENSITIES[regionKey]?.carbon_intensity ?? 0.4;
        co2eKg = input.kwh * intensity;
      }

      const { data, error } = await supabase
        .from('carbon_record')
        .insert({ ...input, co2e_kg: co2eKg })
        .select()
        .single();

      if (error) throw error;

      return data as CarbonRecord;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: carbonRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['carbonRecords', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['carbonRecords', 'trends'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to create Carbon Record:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to update a Carbon Record
 */
export const useUpdateCarbonRecord = (
  options: MutationOptions<CarbonRecord, { id: string; data: CarbonRecordUpdate }> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CarbonRecordUpdate }) => {
      const { data: result, error } = await supabase
        .from('carbon_record')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return result as CarbonRecord;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: carbonRecordKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: carbonRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['carbonRecords', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['carbonRecords', 'trends'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to update Carbon Record:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

/**
 * Hook to delete a Carbon Record
 */
export const useDeleteCarbonRecord = (
  options: MutationOptions<void, string> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('carbon_record')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: carbonRecordKeys.all });
      queryClient.invalidateQueries({ queryKey: ['carbonRecords', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['carbonRecords', 'trends'] });
      options.onSuccess?.(undefined, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to delete Carbon Record:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      options.onSettled?.(data, error, variables);
    },
  });
};

/**
 * Hook to bulk create carbon records
 */
export const useBulkCreateCarbonRecords = (
  options: MutationOptions<CarbonRecord[], CarbonRecordInsert[]> = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (records: CarbonRecordInsert[]) => {
      // Auto-calculate CO2e for records that don't have it
      const recordsWithCO2e = records.map((r) => {
        if (r.co2e_kg !== undefined) return r;
        if (!r.kwh || !r.region) return r;

        const regionKey = `${r.provider}:${r.region}`;
        const intensity = REGION_CARBON_INTENSITIES[regionKey]?.carbon_intensity ?? 0.4;
        return { ...r, co2e_kg: r.kwh * intensity };
      });

      const { data, error } = await supabase
        .from('carbon_record')
        .insert(recordsWithCO2e)
        .select();

      if (error) throw error;

      return data as CarbonRecord[];
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: carbonRecordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['carbonRecords', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['carbonRecords', 'trends'] });
      options.onSuccess?.(data, variables);
    },
    onError: (error: PostgrestError, variables) => {
      console.error('Failed to bulk create Carbon Records:', getErrorMessage(error));
      options.onError?.(error, variables);
    },
    onSettled: options.onSettled,
  });
};

// ============================================================================
// TODO: Future Enhancements
// ============================================================================
// TODO: Add useCarbonOffset hook for tracking carbon offset purchases
// TODO: Add useScienceBasedTargets hook for SBTi compliance tracking
// TODO: Add useRealTimeGridIntensity hook for live carbon intensity data
// TODO: Add useCarbonBudget hook for setting carbon emission limits
// TODO: Add useCarbonComparison hook for comparing emissions across periods
// TODO: Add useCarbonReporting hook for generating ESG reports
// TODO: Add integration with Electricity Maps API for real-time grid data
// TODO: Add integration with AWS Customer Carbon Footprint Tool
// TODO: Add integration with GCP Carbon Footprint API
// TODO: Add integration with Azure Emissions Impact Dashboard
// TODO: Add support for Scope 1, 2, 3 emissions categorization
// TODO: Add support for renewable energy certificates (RECs) tracking
// TODO: Add machine learning for carbon optimization recommendations

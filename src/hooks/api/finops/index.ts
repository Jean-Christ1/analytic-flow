// ============================================================================
// FinOps & GreenOps Domain Hooks Index
// MLOps Control Plane v3
// Author: Armand AMOUSSOU
// Date: 2026-01-04
// ============================================================================
//
// This module exports all hooks related to Financial Operations (FinOps) and
// Green Operations (GreenOps) for cost optimization and sustainability tracking.
//
// Domain Coverage:
// - Billing Accounts: Cloud provider billing integrations
// - Cost Allocation Rules: Rules for attributing costs to projects
// - Cost Records: Detailed cloud spending tracking
// - Budgets: Cost limits and alert thresholds
// - Carbon Records: Environmental impact tracking (GreenOps)
// - Efficiency KPIs: ML operations efficiency metrics
//
// ============================================================================

// Billing Accounts - Cloud Provider Integration
export {
  // Types
  type CloudProvider,
  type BillingAccount,
  type BillingAccountInsert,
  type BillingAccountUpdate,
  type BillingAccountWithStats,
  // Query Keys
  billingAccountKeys,
  // Queries
  useBillingAccounts,
  useBillingAccount,
  useBillingAccountsByProvider,
  useSearchBillingAccounts,
  useBillingAccountSummary,
  useProviderSummary,
  // Mutations
  useCreateBillingAccount,
  useUpdateBillingAccount,
  useDeleteBillingAccount,
  useSyncBillingAccount,
} from './useBillingAccounts';

// Cost Allocation Rules - Cost Attribution Logic
export {
  // Types
  type CostAllocationRuleType,
  type TagBasedExpression,
  type NamespaceExpression,
  type PercentageSplitExpression,
  type RuleExpression,
  type CostAllocationRule,
  type CostAllocationRuleInsert,
  type CostAllocationRuleUpdate,
  type CostAllocationRuleWithStats,
  // Query Keys
  costAllocationRuleKeys,
  // Queries
  useCostAllocationRules,
  useCostAllocationRule,
  useCostAllocationRulesByType,
  useEnabledCostAllocationRules,
  useSearchCostAllocationRules,
  useRuleTypeDistribution,
  useValidateRuleExpression,
  // Mutations
  useCreateCostAllocationRule,
  useUpdateCostAllocationRule,
  useDeleteCostAllocationRule,
  useToggleCostAllocationRule,
  useApplyAllocationRules,
  useBulkCreateCostAllocationRules,
} from './useCostAllocationRules';

// Cost Records - Detailed Spending Tracking
export {
  // Types (re-export CloudProvider for convenience)
  type CostRecord,
  type CostRecordInsert,
  type CostRecordUpdate,
  type CostRecordWithRelations,
  type CostGranularity,
  type CostAggregation,
  // Query Keys
  costRecordKeys,
  // Queries
  useCostRecords,
  useCostRecord,
  useCostRecordsByBillingAccount,
  useCostRecordsByProject,
  useCostRecordsByProvider,
  useCostRecordsByDateRange,
  useCostRecordsByService,
  useCostRecordsByRun,
  useUnallocatedCostRecords,
  useCostAggregations,
  useCostSummary,
  useTopCostDrivers,
  // Mutations
  useCreateCostRecord,
  useUpdateCostRecord,
  useDeleteCostRecord,
  useBulkCreateCostRecords,
  useAllocateCostRecords,
} from './useCostRecords';

// Budgets - Cost Limits and Alerts
export {
  // Types
  type BudgetPeriod,
  type BudgetScopeType,
  type AlertChannel,
  type BudgetThreshold,
  type Budget,
  type BudgetInsert,
  type BudgetUpdate,
  type BudgetWithUsage,
  // Query Keys
  budgetKeys,
  // Queries
  useBudgets,
  useBudget,
  useBudgetsByScopeType,
  useBudgetsByScope,
  useTenantBudgets,
  useProjectBudgets,
  useSearchBudgets,
  useBudgetWithUsage,
  useBudgetsWithUsage,
  useAtRiskBudgets,
  useBudgetAlertsSummary,
  // Mutations
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useUpdateBudgetThresholds,
  useUpdateBudgetAlertChannels,
  useCheckBudgetAlerts,
} from './useBudgets';

// Carbon Records - GreenOps Environmental Impact
export {
  // Types
  type CarbonMethodology,
  type CarbonAttribution,
  type CarbonRecord,
  type CarbonRecordInsert,
  type CarbonRecordUpdate,
  type RegionCarbonIntensity,
  type CarbonGranularity,
  // Constants
  REGION_CARBON_INTENSITIES,
  // Query Keys
  carbonRecordKeys,
  // Queries
  useCarbonRecords,
  useCarbonRecord,
  useCarbonRecordsByProvider,
  useCarbonRecordsByRegion,
  useCarbonRecordsByDateRange,
  useCarbonSummary,
  useCarbonTrends,
  useGreenestRegions,
  useEstimateCarbonEmissions,
  // Mutations
  useCreateCarbonRecord,
  useUpdateCarbonRecord,
  useDeleteCarbonRecord,
  useBulkCreateCarbonRecords,
} from './useCarbonRecords';

// Efficiency KPIs - ML Operations Metrics
export {
  // Types
  type EfficiencyKPISnapshot,
  type EfficiencyKPISnapshotInsert,
  type EfficiencyKPISnapshotUpdate,
  type EfficiencyMetrics,
  type KPIGranularity,
  // Query Keys
  efficiencyKPIKeys,
  // Queries
  useEfficiencyKPISnapshots,
  useEfficiencyKPISnapshot,
  useEfficiencyKPIsByProject,
  useEfficiencyKPIsByDateRange,
  useProjectEfficiencyMetrics,
  useEfficiencyTrends,
  useProjectEfficiencyComparison,
  useTopPerformingProjects,
  useGlobalEfficiencySummary,
  // Mutations
  useCreateEfficiencyKPISnapshot,
  useUpdateEfficiencyKPISnapshot,
  useDeleteEfficiencyKPISnapshot,
  useGenerateDailyKPISnapshot,
  useBulkCreateEfficiencyKPISnapshots,
} from './useEfficiencyKPIs';

// ============================================================================
// TODO: Future Domain Additions
// ============================================================================
// TODO: Add useReservedInstances hooks for RI management and optimization
// TODO: Add useSavingsPlans hooks for AWS Savings Plans tracking
// TODO: Add useSpotInstances hooks for spot/preemptible instance analytics
// TODO: Add useCostAnomalies hooks for ML-based anomaly detection
// TODO: Add useCostForecasting hooks for predictive cost modeling
// TODO: Add useRightSizing hooks for resource optimization recommendations
// TODO: Add useIdleResources hooks for waste identification
// TODO: Add useCostReports hooks for automated report generation
// TODO: Add useChargebacks hooks for internal billing/showback
// TODO: Add useSustainabilityScore hooks for overall sustainability rating
// TODO: Add useRenewableEnergy hooks for renewable energy tracking
// TODO: Add useCarbonOffsets hooks for carbon offset management
// TODO: Add useESGReporting hooks for environmental reporting
